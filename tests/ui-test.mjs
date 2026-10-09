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
await page.addInitScript(() => { window.HOUR = 3600000; }); // also usable inside page.evaluate callbacks
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const bd = (fn, arg) => page.evaluate(fn, arg);
const chatsOfKind = (kind) => bd((k) => [...window.__bd.S.chats.values()].filter((c) => c.kind === k).map((c) => c.id), kind);
const send = async (text) => { await page.fill('#input', text); await page.keyboard.press('Enter'); };
const forceRead = (id) => bd((cid) => { const c = window.__bd.S.chats.get(cid); c.cs.readAt = window.__bd.clock.now(); }, id);
const HOUR = 3600000;
const status = (id) => bd((cid) => window.__bd.S.chats.get(cid)?.status ?? 'gone', id);
const waitFor = (fn, arg, ms = 20000) => page.waitForFunction(fn, arg, { timeout: ms });
const LONG = 'Here is the full explanation: the changes multiply, so the overall factor is the product of the two multipliers, and that is why the result differs from the naive sum.';

async function newCustomer() {
  const id = await bd(() => window.__bd.spawnCustomer().id);
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
  check((await bd(() => window.__bd.S.chats.get('boss').messages.length)) >= 1, 'manager Diane says hello');
  await bd(() => {
    window.__bd.S.profile.world.nextArrivalAt = Date.now() + 1e12; // keep random arrivals out of the way
    window.__bd.S.data.config.boss.workHours = [0, 24]; // Diane is always in, whatever time the test runs
  });

  console.log('Customer conversation');
  const c1 = await newCustomer();
  const c1msgs = await bd((id) => window.__bd.S.chats.get(id).messages.filter((m) => m.from === 'them').length, c1);
  check(c1msgs === 2, 'greeting and question posted', 'got ' + c1msgs);
  await send('Hi! 🙂 Let me check.');
  await forceRead(c1);
  await page.waitForTimeout(2500);
  const thinking = await bd((id) => { const c = window.__bd.S.chats.get(id); return { read: c.messages.filter((m) => m.from === 'me').every((m) => m.read), thinking: c.cs.thinking, typing: c.cs.typing, turns: c.cs.turns }; }, c1);
  check(thinking.read && thinking.thinking && !thinking.typing && thinking.turns === 0, 'customer reads (✓✓), then thinks before typing', JSON.stringify(thinking));
  await waitFor((id) => window.__bd.S.chats.get(id).cs.turns === 1, c1, 45000);
  check((await bd((id) => window.__bd.S.chats.get(id).messages.filter((m) => m.from === 'me').every((m) => m.read), c1)), 'read ticks set');
  await bd(() => Object.assign(window.__bd.S.data.config.customer.think, { baseMs: [200, 400], perWordMs: 2, perNumberMs: 10, minMs: 300, maxMs: 800 })); // speed up the rest
  check((await bd((id) => window.__bd.S.chats.get(id).cs.waitingSince !== null && window.__bd.S.chats.get(id).cs.nudgeAt > window.__bd.clock.now() + HOUR, c1)), 'waiting timer starts after customer reply (chase hours later)');
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
  check((await bd(() => window.__bd.boss.bossState().rapport > 55)), 'a good chat improves Diane\'s (hidden) opinion of you');

  console.log('Bot and shop');
  await page.click('.chat-row[data-id="bot"]');
  for (const c of ['/help', '/balance', '/rank', '/stats', '/payformula', '/history', '/today', '/queue', '/shop themes', '/spendings']) {
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
  await send('Let me look into this for you.');
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
  await bd((id) => { window.__bd.S.chats.get(id).cs.nudgeAt = window.__bd.clock.now() - 1000; }, c4);
  await waitFor((id) => window.__bd.S.chats.get(id).cs.nudged, c4);
  check(true, 'customer chases after patience runs out');
  await bd((id) => { window.__bd.S.chats.get(id).cs.leaveAt = window.__bd.clock.now() - 1000; }, c4);
  await waitFor((id) => window.__bd.S.chats.get(id).status === 'ended', c4);
  const r4 = await bd((id) => window.__bd.S.chats.get(id), c4);
  check(r4.endReason === 'missed' && r4.result.payout.total === 0, 'never answered: missed, no pay, no grading call', r4.endReason);
  const c7 = await newCustomer();
  await send('Give me a moment to work this out.');
  await forceRead(c7);
  await waitFor((id) => window.__bd.S.chats.get(id).cs.turns === 1, c7);
  await bd((id) => { window.__bd.S.chats.get(id).cs.nudgeAt = window.__bd.clock.now() - 1000; }, c7);
  await waitFor((id) => window.__bd.S.chats.get(id).cs.nudged, c7);
  await bd((id) => { window.__bd.S.chats.get(id).cs.leaveAt = window.__bd.clock.now() - 1000; }, c7);
  await waitFor((id) => window.__bd.S.chats.get(id).status === 'ended', c7);
  const r7 = await bd((id) => window.__bd.S.chats.get(id), c7);
  check(r7.endReason === 'timeout' && r7.result.stars <= 2, 'answered but left waiting: timeout, stars capped');

  console.log('Time passes while the app is closed');
  const c8 = await newCustomer();
  await send('Quick question first: is this for a personal account?');
  await bd((id) => {
    const { S, clock } = window.__bd;
    S.chats.get(id).cs.readAt = clock.now() + 2 * HOUR; // they'll check their phone in 2 hours
    S.profile.world.lastSeen = clock.now();
    S.profile.world.nextArrivalAt = clock.now() + HOUR;
    clock.skip(6 * HOUR);
  }, c8);
  const nBefore = (await chatsOfKind('customer')).length;
  await bd(() => window.__bd.world.catchUp());
  await waitFor((id) => window.__bd.S.chats.get(id).cs.turns === 1, c8);
  const r8 = await bd((id) => { const c = window.__bd.S.chats.get(id); const m = c.messages.filter((x) => x.from === 'them').at(-1); return { ago: window.__bd.clock.now() - m.t, read: c.messages.filter((x) => x.from === 'me').every((x) => x.read) }; }, c8);
  check(r8.read && r8.ago > 3 * HOUR, 'customer read and replied hours ago, while the app was "closed"', JSON.stringify(r8));
  check((await chatsOfKind('customer')).length > nBefore, 'customers arrived while away');
  check((await bd(() => window.__bd.S.chats.get('bot').messages.some((m) => /While you were away/.test(m.text)))), '"While you were away" summary');
  await bd(() => { window.__bd.S.profile.world.nextArrivalAt = Date.now() + 1e12; });

  console.log('Manager: rush, transfer, time off');
  const askBoss = async (text) => {
    await page.click('.chat-row[data-id="boss"]');
    const n = await bd(() => window.__bd.S.chats.get('boss').messages.filter((m) => m.from === 'them').length);
    await send(text);
    await bd(() => { window.__bd.S.chats.get('boss').replyAt = window.__bd.clock.now(); });
    await waitFor((k) => window.__bd.S.chats.get('boss').messages.filter((m) => m.from === 'them').length > k, n);
  };
  await askBoss('It is quiet, can you send me a rush of more customers?');
  check((await bd(() => window.__bd.world.rushStatus().active)), 'boss starts a rush shift');
  await bd(() => { window.__bd.S.profile.world.rush.nextAt = window.__bd.clock.now(); });
  await waitFor(() => [...window.__bd.S.chats.values()].some((c) => c.rush && c.status === 'active'));
  check((await bd(() => [...window.__bd.S.chats.values()].find((c) => c.rush).cs.mode === 'live')), 'rush customer arrives and stays online');
  const tr = await bd(() => [...window.__bd.S.chats.values()].find((c) => c.rush && c.status === 'active').seq);
  await askBoss(`Please transfer @chat${tr} to a colleague`);
  check((await bd((seq) => [...window.__bd.S.chats.values()].find((c) => c.seq === seq).endReason === 'transferred', tr)), 'boss transfers a chat');
  const prompt = await bd(() => window.__bd.boss.promptPreview());
  check(/THINGS YOU ALREADY DID[\s\S]*handed to a colleague/.test(prompt) && /transferred to a colleague by you/.test(prompt), 'Diane remembers what she did and sees recently ended chats');
  await askBoss('Could I take some time off tomorrow?');
  check((await bd(() => !!window.__bd.world.vacation())), 'boss grants time off');
  check((await page.textContent('#statusBar')).includes('off until'), 'status bar shows time off');
  await askBoss("I'm back, open my queue please");
  check((await bd(() => !window.__bd.world.vacation())), 'time off ended early');
  const nBoss = await bd(() => window.__bd.S.chats.get('boss').messages.length);
  await bd(() => { const { boss, clock } = window.__bd; boss.noteEvent('promotion', { title: 'Test Rank' }); boss.bossState().events[0].at = clock.now() - 1000; });
  await waitFor((n) => window.__bd.S.chats.get('boss').messages.some((m, i) => i >= n && m.unprompted === 'promotion'), nBoss);
  check(true, 'Diane messages unprompted when something happens');

  console.log('Concept, hints and review');
  const c6 = await newCustomer();
  await page.click('#chConceptBtn');
  await page.waitForSelector('#conceptBody p', { timeout: 10000 });
  check((await page.textContent('#conceptBody')).includes('The idea'), 'concept explainer shown');
  await page.click('.modal [data-close]');
  for (let i = 0; i < 2; i++) {
    await send('not sure, maybe 5?');
    await forceRead(c6);
    await waitFor(([id, n]) => window.__bd.S.chats.get(id).cs.turns === n, [c6, i + 1]);
  }
  await waitFor(() => window.__bd.S.chats.get('mentor').messages.some((m) => m.hint));
  check(true, 'mentor sends an unprompted hint after repeated pushback');
  check((await bd((id) => window.__bd.S.chats.get(id).cs.anger > 0, c6)), 'hidden impatience grows');
  check((await page.locator('.meter, .anger').count()) === 0, 'no visible impatience meter');
  await page.click(`.chat-row[data-id="${c1}"]`);
  await page.click(`[data-review="${c1}"]`);
  await waitFor(() => window.__bd.S.activeChatId === 'mentor' && window.__bd.S.chats.get('mentor').messages.some((m) => m.from === 'me' && /@chat1/.test(m.text)));
  check(true, 'review with mentor sends the chat to the mentor');

  console.log('Mentor');
  await page.click('.chat-row[data-id="mentor"]');
  await page.fill('#input', '@chat');
  await page.waitForTimeout(200);
  check((await page.locator('#suggest .item').count()) >= 2, '@ suggestions list chats');
  await page.keyboard.press('Escape');
  await send('Please plot a demand curve and review @chat1 for me');
  await waitFor(() => window.__bd.S.chats.get('mentor').messages.some((m) => m.from === 'them' && /```chart/.test(m.text)));
  const mentorReply = await bd(() => window.__bd.S.chats.get('mentor').messages.filter((m) => /```chart/.test(m.text)).at(-1));
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

  console.log('Persistence and v0.2 save migration');
  const c9 = await newCustomer();
  await bd((id) => { // make it look like a v0.2 save (active-time clock)
    const { S } = window.__bd;
    const cs = S.chats.get(id).cs;
    for (const k of ['mode', 'readAt', 'nudgeAt', 'leaveAt', 'waitingSince', 'lastCustomerAt']) delete cs[k];
    Object.assign(cs, { waitingSinceA: 5000, nudgedA: null, pendingReadA: null, lastCustomerA: 5000, patienceMs: 600000 });
    S.profile.version = 1; S.profile.status = 'online'; S.profile.memo.nextAtA = 123;
  }, c9);
  await page.waitForTimeout(800);
  const snapshot = await bd(() => ({ bal: window.__bd.S.profile.balance, n: window.__bd.S.chats.size, rank: window.__bd.S.profile.rank }));
  await page.evaluate(() => window.dispatchEvent(new Event('beforeunload')));
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForFunction(() => window.__bd && window.__bd.S.profile);
  const after = await bd(() => ({ bal: window.__bd.S.profile.balance, n: window.__bd.S.chats.size, rank: window.__bd.S.profile.rank }));
  check(after.bal === snapshot.bal && after.n === snapshot.n && after.rank === snapshot.rank, 'state survives reload', JSON.stringify({ snapshot, after }));
  const mig = await bd((id) => { const { S } = window.__bd; const cs = S.chats.get(id).cs; return { v: S.profile.version, mode: cs.mode, w: cs.waitingSince != null && cs.nudgeAt > Date.now(), old: 'waitingSinceA' in cs }; }, c9);
  check(mig.v === 2 && mig.mode === 'async' && mig.w && !mig.old, 'v0.2 active chat migrated to wall-clock timers', JSON.stringify(mig));
  await page.screenshot({ path: path.join(dataDir, 'final.png') });

  check(errors.length === 0, 'no console/page errors', errors.slice(0, 3).join(' | '));
} catch (e) {
  failed++;
  console.log('  ✗ test crashed: ' + e.message);
  console.log('    console errors: ' + errors.slice(0, 5).join(' | '));
  try { console.log(JSON.stringify(await page.evaluate(() => window.__bd.S.chats.get('mentor').messages.map((m) => [m.from, m.read, m.text.slice(0, 60)])), null, 0)); } catch {}
} finally {
  await browser.close();
  server.kill();
}

console.log(`\n${passed} passed, ${failed} failed  (artifacts: ${dataDir})`);
process.exit(failed ? 1 : 0);
