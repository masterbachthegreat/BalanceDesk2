// End-to-end test of the game in a real browser, with the mock LLM (no API calls).
// Run: npm test   (needs Playwright: npm i -D playwright, or a global install)
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5199;

async function loadPlaywright() {
  for (const spec of ['playwright', 'playwright-core', '/opt/node22/lib/node_modules/playwright/index.mjs']) {
    try { return await import(spec); } catch {}
  }
  console.log('Playwright not found: install it with `npm i -D playwright` to run the UI tests.');
  process.exit(0);
}

let passed = 0, failed = 0;
function check(cond, name, extra = '') {
  if (cond) { passed++; console.log('  ✓ ' + name); } else { failed++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
}

const { chromium } = await loadPlaywright();
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bd-test-'));
const server = spawn(process.execPath, [path.join(root, 'scripts', 'dev-server.js'), String(PORT)], {
  env: { ...process.env, BD_MOCK_LLM: '1', BD_DATA_DIR: dataDir },
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 800));

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const bd = (fn, arg) => page.evaluate(fn, arg);
const chatsOfKind = (kind) => bd((k) => [...window.__bd.S.chats.values()].filter((c) => c.kind === k).map((c) => c.id), kind);
const send = async (text) => { await page.fill('#input', text); await page.keyboard.press('Enter'); };
const forceRead = (id) => bd((cid) => { const c = window.__bd.S.chats.get(cid); c.cs.pendingReadA = window.__bd.clock.now(); }, id);
const status = (id) => bd((cid) => window.__bd.S.chats.get(cid)?.status ?? 'gone', id);
const waitFor = (fn, arg, ms = 20000) => page.waitForFunction(fn, arg, { timeout: ms });
const LONG = 'Here is the full explanation: the changes multiply, so the overall factor is the product of the two multipliers, and that is why the result differs from the naive sum.';

async function newCustomer() {
  const before = await chatsOfKind('customer');
  await page.click('.chat-row[data-id="bot"]');
  await send('/next');
  await waitFor((n) => [...window.__bd.S.chats.values()].filter((c) => c.kind === 'customer').length > n, before.length);
  const after = await chatsOfKind('customer');
  const id = after.find((x) => !before.includes(x));
  await waitFor((cid) => !window.__bd.S.chats.get(cid).cs.openingPending, id); // question posted
  await page.click(`.chat-row[data-id="${id}"]`);
  return id;
}

try {
  console.log('Onboarding');
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForSelector('#obName');
  await page.fill('#obName', 'Test Agent');
  await page.click('#obGo');
  await page.waitForTimeout(500);
  check((await bd(() => window.__bd.S.profile.name)) === 'Test Agent', 'name saved');
  check((await bd(() => window.__bd.S.chats.get('bot').messages.length)) >= 1, 'bot welcome message');
  check((await bd(() => window.__bd.S.chats.get('mentor').messages.length)) >= 1, 'mentor intro message');
  check((await bd(() => window.__bd.S.chats.get('manager').messages.length)) >= 1, 'manager welcome memo');
  await bd(() => window.__bd.ui.setStatus('away')); // keep random arrivals out of the way

  console.log('Customer conversation');
  const c1 = await newCustomer();
  const c1msgs = await bd((id) => window.__bd.S.chats.get(id).messages.filter((m) => m.from === 'them').length, c1);
  check(c1msgs === 2, 'greeting and question posted', 'got ' + c1msgs);
  await send('Hi! 🙂 Let me check.');
  await forceRead(c1);
  await waitFor((id) => window.__bd.S.chats.get(id).cs.turns === 1, c1);
  check((await bd((id) => window.__bd.S.chats.get(id).messages.filter((m) => m.from === 'me').every((m) => m.read), c1)), 'read ticks set');
  check((await bd((id) => window.__bd.S.chats.get(id).cs.waitingSinceA !== null, c1)), 'waiting timer starts after customer reply');
  const balBefore = await bd(() => window.__bd.S.profile.balance);
  await send(LONG);
  await forceRead(c1);
  await waitFor((id) => window.__bd.S.chats.get(id).status === 'ended', c1);
  const res = await bd((id) => window.__bd.S.chats.get(id).result, c1);
  check(res && res.aiScore > 0 && res.payout.total > 0, 'graded and paid', JSON.stringify(res && res.payout));
  check((await bd(() => window.__bd.S.profile.balance)) === balBefore + res.payout.total, 'balance credited');
  check((await page.locator('.payout-card').count()) === 1, 'payout card rendered');
  await send('/payout');
  await page.waitForTimeout(200);
  check((await page.locator('.breakdown').count()) === 1, '/payout shows breakdown');
  await send('/feedback');
  await page.waitForTimeout(200);
  check((await page.locator('.payout-card').count()) === 3, '/feedback shows grader notes');
  const turnsBefore = await bd((id) => window.__bd.S.chats.get(id).cs.turns, c1);
  await send('are you still there?');
  await page.waitForTimeout(1500);
  check((await bd((id) => window.__bd.S.chats.get(id).cs.turns, c1)) === turnsBefore, 'ended chat: customer does not react');
  check((await bd((id) => window.__bd.S.chats.get(id).messages.at(-1).after === true, c1)), 'after-end message flagged');
  check((await bd(() => window.__bd.S.chats.get('bot').messages.some((m) => /from .*@chat1/.test(m.text)))), 'bot posted payout receipt');

  console.log('Bot and shop');
  await page.click('.chat-row[data-id="bot"]');
  for (const c of ['/help', '/balance', '/rank', '/stats', '/payformula', '/history', '/today', '/shop themes', '/spendings']) {
    const n = await bd(() => window.__bd.S.chats.get('bot').messages.length);
    await send(c);
    await waitFor((k) => window.__bd.S.chats.get('bot').messages.length >= k + 2, n);
  }
  await page.waitForTimeout(400);
  check((await page.locator('.chat-box canvas, .chart-box canvas').count()) >= 2, '/spendings draws charts');
  await bd(() => { window.__bd.S.profile.balance += 5000; });
  await send('/buy theme-navy');
  await page.waitForTimeout(400);
  check((await page.evaluate(() => document.documentElement.dataset.theme)) === 'navy', 'buying a theme equips it');
  await send('/buy tool-calculator');
  await page.waitForTimeout(400);
  await send('/calc');
  await page.waitForTimeout(400);
  check((await page.locator('#calcWin').count()) === 1, 'calculator opens');
  await page.fill('#calcIn', '1000*(1+5%)^10');
  await page.keyboard.press('Enter');
  check((await page.textContent('#calcOut')).includes('1,628.89'), 'calculator evaluates', await page.textContent('#calcOut'));
  await page.click('#calcWin [data-close]');
  await send('/buy emoji-friendly');
  await page.waitForTimeout(300);
  check((await bd(() => !!window.__bd.S.profile.owned['emoji-friendly'])), 'emoji pack bought');

  console.log('Close via context menu (star penalty)');
  const c2 = await newCustomer();
  await send('😊 One moment please.');
  await page.click(`.chat-row[data-id="${c2}"]`, { button: 'right' });
  await page.click('.ctx-item:has-text("Close conversation")');
  await page.click('[data-yes]');
  await waitFor((id) => window.__bd.S.chats.get(id).status === 'ended', c2);
  const r2 = await bd((id) => window.__bd.S.chats.get(id), c2);
  check(r2.endReason === 'closed', 'closed by player');
  check(r2.result.stars === Math.max(1, Math.round((r2.result.graderStars + 0.1 - 1.5) * 2) / 2), 'close penalty and emoji bonus applied', `grader ${r2.result.graderStars}, final ${r2.result.stars}`);
  check(r2.emojiPacksUsed.includes('emoji-friendly'), 'premium emoji use recorded');

  console.log('Archive');
  await page.click(`.chat-row[data-id="${c2}"]`, { button: 'right' });
  await page.click('.ctx-item:has-text("Archive")');
  await page.waitForTimeout(200);
  check((await page.locator('.archive-row').count()) === 1, 'archive folder appears');
  check((await page.locator(`#chatList .chat-row[data-id="${c2}"]`).count()) === 0, 'archived chat hidden from main list');
  await page.click('.archive-row');
  check((await page.locator(`#chatList .chat-row[data-id="${c2}"]`).count()) === 1, 'archived chat visible in folder');
  await page.click(`.chat-row[data-id="${c2}"]`, { button: 'right' });
  await page.click('.ctx-item:has-text("Unarchive")');
  await page.click('.archive-row[data-action="back"]').catch(() => {});
  await page.waitForTimeout(200);

  console.log('Delete an active chat');
  const c3 = await newCustomer();
  const balBeforeDelete = await bd(() => window.__bd.S.profile.balance);
  await page.click(`.chat-row[data-id="${c3}"]`, { button: 'right' });
  await page.click('.ctx-item:has-text("Delete chat")');
  await page.click('[data-yes]');
  await page.waitForTimeout(200);
  check((await page.locator(`.chat-row[data-id="${c3}"]`).count()) === 0, 'deleted chat removed from list');
  await waitFor(() => window.__bd.S.chats.get('bot').messages.some((m) => /deleted\)/.test(m.text)));
  check((await bd(() => window.__bd.S.profile.balance)) > balBeforeDelete, 'deleted active chat was closed and paid');

  console.log('Impatience');
  const c4 = await newCustomer();
  await bd((id) => { const c = window.__bd.S.chats.get(id); c.cs.waitingSinceA = window.__bd.clock.now() - c.cs.patienceMs - 1000; }, c4);
  await waitFor((id) => window.__bd.S.chats.get(id).cs.nudgedA !== null, c4);
  check(true, 'customer chases after patience runs out');
  await bd((id) => { const c = window.__bd.S.chats.get(id); c.cs.nudgedA = window.__bd.clock.now() - 1000000; }, c4);
  await waitFor((id) => window.__bd.S.chats.get(id).status === 'ended', c4);
  const r4 = await bd((id) => window.__bd.S.chats.get(id), c4);
  check(r4.endReason === 'timeout' && r4.result.stars <= 2, 'customer leaves after waiting, stars capped');

  console.log('Mentor');
  await page.click('.chat-row[data-id="mentor"]');
  await page.fill('#input', '@chat');
  await page.waitForTimeout(200);
  check((await page.locator('#suggest .item').count()) >= 2, '@ suggestions list chats');
  await page.keyboard.press('Escape');
  await send('Please plot a demand curve and review @chat1 for me');
  await waitFor(() => window.__bd.S.chats.get('mentor').messages.at(-1).from === 'them' && window.__bd.S.chats.get('mentor').messages.length > 2);
  const mentorReply = await bd(() => window.__bd.S.chats.get('mentor').messages.at(-1));
  check(/transcript/.test(mentorReply.text), 'mentor received the mentioned chat transcript');
  await page.waitForTimeout(400);
  check((await page.locator('#messages .chart-box canvas').count()) >= 1, 'mentor chart rendered');

  console.log('Promotion');
  await bd(() => { window.__bd.S.profile.rankChats = [90, 90, 90, 90, 90, 90, 90]; });
  const c5 = await newCustomer();
  await send(LONG);
  await forceRead(c5);
  await waitFor((id) => window.__bd.S.chats.get(id).status === 'ended', c5);
  check((await bd(() => window.__bd.S.profile.rank)) === 2, 'promoted to rank 2 after 8 good chats');

  console.log('Persistence');
  await page.waitForTimeout(800);
  const snapshot = await bd(() => ({ bal: window.__bd.S.profile.balance, n: window.__bd.S.chats.size, rank: window.__bd.S.profile.rank }));
  await page.evaluate(() => window.dispatchEvent(new Event('beforeunload')));
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForFunction(() => window.__bd && window.__bd.S.profile);
  const after = await bd(() => ({ bal: window.__bd.S.profile.balance, n: window.__bd.S.chats.size, rank: window.__bd.S.profile.rank }));
  check(after.bal === snapshot.bal && after.n === snapshot.n && after.rank === snapshot.rank, 'state survives reload', JSON.stringify({ snapshot, after }));
  await page.screenshot({ path: path.join(dataDir, 'final.png') });

  check(errors.length === 0, 'no console/page errors', errors.slice(0, 3).join(' | '));
} catch (e) {
  failed++;
  console.log('  ✗ test crashed: ' + e.message);
  console.log('    console errors: ' + errors.slice(0, 5).join(' | '));
} finally {
  await browser.close();
  server.kill();
}

console.log(`\n${passed} passed, ${failed} failed  (artifacts: ${dataDir})`);
process.exit(failed ? 1 : 0);
