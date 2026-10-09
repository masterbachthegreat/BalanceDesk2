// The Whiterock Desk Bot: slash commands, receipts and the in-chat /payout command.
import { S, cfg, touchChat } from '../core/state.js';
import { money, num, starsText, durationWords, dateKey, plural } from '../core/format.js';
import { addMessage, getChat, customerChats, handle } from './chats.js';
import * as shop from './shop.js';
import * as clock from './clock.js';
import { rankInfo, promotionStatus, maxRank } from './progress.js';
import { ui } from '../ui/registry.js';

export const COMMANDS = [
  { cmd: 'help', desc: 'List all commands' },
  { cmd: 'balance', desc: 'Your balance and earnings' },
  { cmd: 'stats', desc: 'Lifetime statistics' },
  { cmd: 'rank', desc: 'Your rank and promotion progress' },
  { cmd: 'today', desc: "Today's shift summary" },
  { cmd: 'history', desc: 'Your last 10 finished chats' },
  { cmd: 'payformula', desc: 'How your pay is calculated' },
  { cmd: 'shop', args: '[category]', desc: 'Browse the shop' },
  { cmd: 'buy', args: '<item>', desc: 'Buy an item (id or name)' },
  { cmd: 'inventory', desc: 'Everything you own' },
  { cmd: 'equip', args: '<item>', desc: 'Equip a theme, wallpaper, border…' },
  { cmd: 'unequip', args: '<slot>', desc: 'Remove a cosmetic (theme, wallpaper, border, nameColor, title)' },
  { cmd: 'use', args: '<item>', desc: 'Use a consumable (espresso, coin…)' },
  { cmd: 'bonuses', desc: 'Active bonuses from memos and items' },
  { cmd: 'spendings', desc: 'OpenRouter usage & cost, with graphs' },
  { cmd: 'next', desc: 'Call the next customer right now' },
  { cmd: 'online', desc: 'Start receiving customers' },
  { cmd: 'away', desc: 'Stop new customers from arriving' },
  { cmd: 'calc', desc: 'Open the calculator (shop item)' },
  { cmd: 'notes', desc: 'Open your notepad (shop item)' },
  { cmd: 'profile', desc: 'Open your profile' },
  { cmd: 'settings', desc: 'API key and models' },
];

export const CHAT_COMMANDS = [
  { cmd: 'payout', desc: 'Pay breakdown for this conversation (after it ends)' },
  { cmd: 'feedback', desc: "The grader's feedback on your answer (after it ends)" },
];

export function botSay(text, extra = {}) {
  const chat = getChat('bot');
  if (!chat) return;
  addMessage(chat, { from: 'them', text, ...extra });
}

function findItem(q) {
  if (!q) return null;
  const s = q.trim().toLowerCase();
  const all = shop.items();
  return all.find((i) => i.id.toLowerCase() === s) ||
    all.find((i) => i.name.toLowerCase() === s) ||
    all.find((i) => i.id.toLowerCase().includes(s) || i.name.toLowerCase().includes(s)) || null;
}

const CATS = [
  ['themes', '🎨 Themes'], ['wallpapers', '🖼 Wallpapers'], ['emoji', '😀 Emoji packs'], ['borders', '⭕ Profile borders'],
  ['namecolors', '🌈 Name colours'], ['titles', '🏷 Titles'], ['profile', '📷 Profile'], ['tools', '🧮 Tools'],
  ['upgrades', '⚙ Upgrades'], ['consumables', '☕ Consumables'],
];
export const SHOP_CATEGORIES = CATS;

function itemLine(i) {
  const owned = shop.owns(i.id);
  const status = i.consumable ? (shop.count(i.id) ? ` (you have ${shop.count(i.id)})` : '') : owned ? (S.profile.equipped[i.slot] === i.id ? ' ✅ equipped' : ' ✔ owned') : '';
  return `• **${i.name}** — ${i.price ? money(i.price) : 'free'}${status}\n  _${i.desc}_ · \`${i.id}\``;
}

const handlers = {
  help() {
    const lines = COMMANDS.map((c) => `/${c.cmd}${c.args ? ' ' + c.args : ''} — ${c.desc}`);
    botSay('**Commands**\n' + lines.join('\n') + '\n\nIn customer chats: /payout and /feedback (after a chat ends).\nIn the Mentor chat, mention a chat with @chat12 (or @Name) and the mentor reads the whole conversation.\nRight-click a chat for Close, Archive and Delete.');
  },
  balance() {
    const p = S.profile;
    const d = clock.today();
    botSay(`💰 Balance: **${money(p.balance)}**\nToday: ${money(d.earned)} from ${plural(d.chats, 'chat')}\nLifetime earned: ${money(p.lifetimeEarned)} · spent: ${money(p.lifetimeSpent || 0)}`);
  },
  stats() {
    const st = S.profile.stats;
    const n = st.completed;
    botSay(`📊 **Lifetime stats**\nChats completed: ${n}\nAverage AI score: ${n ? num(st.scoreSum / n, 1) : '—'}/100\nAverage service: ${n ? num(st.starsSum / n, 2) : '—'}★\n5★ chats: ${st.fiveStars}\nVIPs served: ${st.vipServed}\nClosed by you: ${st.closedByMe} · customers lost: ${st.lost}\nBest single payout: ${money(st.bestPay || 0)}\nTime on shift: ${durationWords(S.profile.activeMs)}`);
  },
  rank() {
    const p = S.profile;
    const r = rankInfo(p.rank);
    const s = promotionStatus();
    let txt = `🏅 **${r.title}** — rank ${p.rank} of ${maxRank()}\nTopics: ${r.topics} (book chapters ${r.chapters[0]}–${r.chapters[r.chapters.length - 1]})\nBase pay per chat: ${money(r.basePay)}`;
    if (s.atMax) txt += '\n\nYou are at the top. Nothing left but glory.';
    else {
      const next = rankInfo(p.rank + 1);
      txt += `\n\nNext: **${next.title}** — ${next.topics}\nPromotion rule: your last ${s.need} chats at this rank must average ≥ ${s.minAvg}/100.\nProgress: ${s.have}/${s.need} chats, average ${s.have ? num(s.avg, 1) : '—'}`;
    }
    botSay(txt);
  },
  today() {
    const d = clock.today();
    botSay(`🗓 **Today (${dateKey()})**\nTime on shift: ${durationWords(d.activeMs)}\nChats finished: ${d.chats}\nEarned: ${money(d.earned)}\nAverage score: ${d.chats ? num(d.scoreSum / d.chats, 1) : '—'} · average stars: ${d.chats ? num(d.starsSum / d.chats, 2) : '—'}`);
  },
  history() {
    const list = customerChats().filter((c) => c.result).sort((a, b) => b.endedAt - a.endedAt).slice(0, 10);
    if (!list.length) return botSay('No finished chats yet. Deleted chats are not listed.');
    botSay('🧾 **Last finished chats**\n' + list.map((c) => `${handle(c)} ${c.customer.name}${c.customer.vip ? ' 👑' : ''} — ${starsText(c.result.stars)} · ${c.result.aiScore}/100 · ${money(c.result.payout.total)} · ${durationWords(c.result.durationMs)}`).join('\n'));
  },
  payformula() {
    const P = cfg().pay;
    const St = cfg().stars;
    botSay(`🧮 **How pay works**\nPay = Base × VIP × Quality × Service × Length × Time × Bonuses + Tip\n\n• **Base**: depends on your rank (${money(rankInfo(S.profile.rank).basePay)} now)\n• **VIP**: ×${P.vipMultiplier} for VIP clients 👑\n• **Quality**: AI score ÷ 100\n• **Service**: ${P.serviceMultBase} + ${P.serviceMultPerStar} × stars (1★ = ×${num(P.serviceMultBase + P.serviceMultPerStar, 2)}, 5★ = ×${num(P.serviceMultBase + 5 * P.serviceMultPerStar, 2)})\n• **Length**: ${P.lengthFactors.map((r) => (r.maxExchanges >= 999 ? 'more' : '≤' + r.maxExchanges) + ' → ×' + r.factor).join(', ')} (customer replies after the question)\n• **Time**: ×${P.time.bestFactor} for instant replies, −${P.time.lossPerMinute} per minute of average reply time, −${P.time.nudgePenalty} each time a customer has to chase you (min ×${P.time.minFactor})\n• **Stars**: grader's rating + emoji pack bonus (max +${St.emojiBonusCap}); closing a chat yourself −${St.closePenalty}; customers who leave give at most ${St.leftCap}★\n• **Tip**: happy customers (≥${P.tip.minStars}★, score ≥${P.tip.minScore}) sometimes tip 5–25%\n\nType /payout inside a finished chat to see its exact breakdown.`);
  },
  shop(arg) {
    if (arg) {
      const cat = CATS.find(([k, l]) => k === arg.toLowerCase() || l.toLowerCase().includes(arg.toLowerCase()));
      if (!cat) return botSay('Unknown category. Try one of: ' + CATS.map((c) => c[0]).join(', '));
      const list = shop.items().filter((i) => i.category === cat[0]);
      const buttons = list.filter((i) => i.price > 0 && (i.consumable || !shop.owns(i.id))).slice(0, 12)
        .map((i) => [{ label: `Buy ${i.name} · ${money(i.price)}`, action: 'cmd', value: '/buy ' + i.id }]);
      return botSay(`${cat[1]}\n\n${list.map(itemLine).join('\n')}\n\nYour balance: **${money(S.profile.balance)}**`, { buttons });
    }
    const buttons = [];
    for (let i = 0; i < CATS.length; i += 2) {
      buttons.push(CATS.slice(i, i + 2).map(([k, l]) => ({ label: l, action: 'cmd', value: '/shop ' + k })));
    }
    buttons.push([{ label: '🛍 Open the shop window', action: 'ui', value: 'shop' }]);
    botSay(`🛍 **Whiterock Company Store**\nBalance: **${money(S.profile.balance)}**\nPick a category:`, { buttons });
  },
  buy(arg) {
    const it = findItem(arg);
    if (!it) return botSay('Which item? Use `/buy <item id or name>`, e.g. `/buy theme-navy`. See /shop.');
    const r = shop.buy(it.id);
    if (!r.ok) return botSay('❌ ' + r.why);
    let extra = '';
    if (it.consumable) extra = `\nUse it with /use ${it.id}`;
    else if (it.slot) extra = '\nIt is now equipped.';
    else if (it.tool === 'calculator') extra = '\nOpen it with /calc or from the ☰ menu.';
    else if (it.tool === 'notepad') extra = '\nOpen it with /notes or from the ☰ menu.';
    else if (it.unlock === 'photo') extra = '\nSet your picture in ☰ → My Profile.';
    botSay('✅ ' + r.msg + extra + `\nBalance: **${money(S.profile.balance)}**`);
  },
  inventory() {
    const owned = shop.ownedItems().filter((i) => i.price > 0);
    if (!owned.length) return botSay('You don\'t own anything yet. Check the /shop.');
    botSay('🎒 **Inventory**\n' + owned.map(itemLine).join('\n'));
  },
  equip(arg) {
    const it = findItem(arg);
    if (!it) return botSay('Which item? `/equip <item>` — see /inventory.');
    const r = shop.equip(it.id);
    botSay(r.ok ? '✅ ' + r.msg : '❌ ' + r.why);
  },
  unequip(arg) {
    const r = shop.unequip((arg || '').trim());
    botSay(r.ok ? '✅ ' + r.msg : '❌ ' + r.why);
  },
  use(arg) {
    const it = findItem(arg);
    if (!it) return botSay('Which item? `/use <item>`');
    const r = shop.useItem(it.id);
    botSay(r.ok ? '✅ ' + r.msg : '❌ ' + r.why);
  },
  bonuses() {
    const m = S.profile.modifiers;
    if (!m.length && !S.profile.vipNext) return botSay('No active bonuses right now.');
    const lines = m.map((x) => `• ${x.label || x.kind} — ${x.kind === 'payMult' ? '×' + x.value : x.kind === 'flat5star' ? '+' + money(x.value) + ' on 5★ chats' : 'guaranteed tip'}${x.vipOnly ? ' (VIP chats)' : ''} · ${plural(x.chatsLeft ?? x.chats ?? 1, 'chat')} left · from ${x.source}`);
    if (S.profile.vipNext) lines.push('• VIP pass — your next customer is a VIP');
    botSay('🎁 **Active bonuses**\n' + lines.join('\n'));
  },
  async spendings() {
    const recs = await window.api.usage();
    if (!recs.length) return botSay('No API calls recorded yet.');
    const cats = ['customer', 'grading', 'mentor', 'other'];
    const label = { customer: 'Customers (Haiku)', grading: 'Grading (Sonnet)', mentor: 'Mentor (Sonnet)', other: 'Other' };
    const tot = {};
    for (const c of cats) tot[c] = { cost: 0, in: 0, out: 0, calls: 0 };
    for (const r of recs) {
      const t = tot[cats.includes(r.category) ? r.category : 'other'];
      t.cost += r.cost || 0; t.in += r.in || 0; t.out += r.out || 0; t.calls++;
    }
    const all = cats.reduce((s, c) => ({ cost: s.cost + tot[c].cost, in: s.in + tot[c].in, out: s.out + tot[c].out, calls: s.calls + tot[c].calls }), { cost: 0, in: 0, out: 0, calls: 0 });
    const useCost = all.cost > 0;
    const fmt = (x) => '$' + x.toFixed(x < 1 ? 4 : 2);
    const table = '| What | Calls | Tokens in | Tokens out | Cost |\n|---|---|---|---|---|\n' +
      cats.filter((c) => tot[c].calls).map((c) => `| ${label[c]} | ${tot[c].calls} | ${tot[c].in.toLocaleString()} | ${tot[c].out.toLocaleString()} | ${fmt(tot[c].cost)} |`).join('\n') +
      `\n| **Total** | ${all.calls} | ${all.in.toLocaleString()} | ${all.out.toLocaleString()} | **${fmt(all.cost)}** |`;
    // last 14 days, stacked by category
    const days = [];
    for (let i = 13; i >= 0; i--) days.push(dateKey(Date.now() - i * 86400000));
    const perDay = Object.fromEntries(cats.map((c) => [c, days.map(() => 0)]));
    for (const r of recs) {
      const k = dateKey(r.t);
      const idx = days.indexOf(k);
      if (idx < 0) continue;
      const c = cats.includes(r.category) ? r.category : 'other';
      perDay[c][idx] += useCost ? r.cost || 0 : (r.in || 0) + (r.out || 0);
    }
    const charts = [
      {
        type: 'doughnut',
        title: useCost ? 'Spend by purpose (USD)' : 'Tokens by purpose',
        labels: cats.filter((c) => tot[c].calls).map((c) => label[c]),
        datasets: [{ label: useCost ? 'USD' : 'Tokens', data: cats.filter((c) => tot[c].calls).map((c) => +(useCost ? tot[c].cost : tot[c].in + tot[c].out).toFixed(6)) }],
      },
      {
        type: 'bar',
        stacked: true,
        title: useCost ? 'Daily spend, last 14 days (USD)' : 'Daily tokens, last 14 days',
        labels: days.map((d) => d.slice(5)),
        datasets: cats.filter((c) => tot[c].calls).map((c) => ({ label: label[c], data: perDay[c].map((v) => +v.toFixed(6)) })),
      },
    ];
    botSay(`💳 **OpenRouter usage**\n${table}${useCost ? '' : '\n\n_OpenRouter did not report costs, so the graphs show tokens._'}`, { charts });
  },
  next() {
    ui.callNextCustomer?.();
  },
  online() { ui.setStatus?.('online'); botSay('🟢 You are online. Customers will start arriving.'); },
  away() { ui.setStatus?.('away'); botSay('⏸ You are away. No new customers will arrive; ongoing chats continue.'); },
  calc() {
    if (!shop.hasTool('calculator')) return botSay('🧮 You don\'t own a calculator yet. Buy one: /buy tool-calculator', { buttons: [[{ label: 'Buy calculator', action: 'cmd', value: '/buy tool-calculator' }]] });
    ui.openCalculator?.();
  },
  notes() {
    if (!shop.hasTool('notepad')) return botSay('📝 You don\'t own a notepad yet. Buy one: /buy tool-notepad', { buttons: [[{ label: 'Buy notepad', action: 'cmd', value: '/buy tool-notepad' }]] });
    ui.openNotepad?.();
  },
  profile() { ui.openProfile?.(); },
  settings() { ui.openSettings?.(); },
};

export async function handleBotInput(text) {
  const chat = getChat('bot');
  addMessage(chat, { from: 'me', text, read: true });
  const m = /^\/(\w+)(?:@\w+)?\s*(.*)$/s.exec(text.trim());
  await new Promise((r) => setTimeout(r, 250));
  if (!m) return botSay('I only understand commands. Try /help');
  const fn = handlers[m[1].toLowerCase()];
  if (!fn) return botSay(`Unknown command /${m[1]}. Try /help`);
  await fn(m[2]);
}

// /payout and /feedback inside a customer chat
export function handleChatCommand(chat, text) {
  const m = /^\/(\w+)/.exec(text.trim());
  if (!m) return false;
  const c = m[1].toLowerCase();
  if (c !== 'payout' && c !== 'feedback') return false;
  addMessage(chat, { from: 'me', text, read: true, after: chat.status !== 'active', local: true });
  if (!chat.result) {
    addMessage(chat, { from: 'sys', text: chat.status === 'grading' ? 'Still grading — try again in a moment.' : `/${c} is available after the conversation ends.` });
    return true;
  }
  addMessage(chat, { from: 'sys', kind: c === 'payout' ? 'breakdown' : 'feedback', text: '' });
  touchChat(chat);
  return true;
}
