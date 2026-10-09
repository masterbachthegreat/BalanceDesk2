// Your manager, Diane Whitfield (Head of Client Services). Whiterock support is fully remote:
// you only ever talk on this messenger. She has her own online presence: on her shift (weekdays,
// your local time) she's at her desk and answers within minutes; evenings and weekends she
// replies when she checks her phone; at night she sleeps.
// She can change things: a rush shift, a lighter or heavier day, time off, taking a chat off
// your hands, or a raise. The LLM only picks from the actions this code says are allowed right
// now; the code applies them. She remembers the whole conversation.
// Two hidden scores (0-100, profile.boss), never shown:
//   work        her professional opinion of you (chat results, missed customers, backlogs)
//   friendship  how well you get on personally (only from how you talk to her)
// They're independent: you can be a poor employee and her best friend. Friendship makes her
// more open to off-work talk and more likely to message you just to chat.
import { S, cfg, rand, pick, touchChat, touchProfile } from '../core/state.js';
import { waitWords, num, plural, lastSeenText } from '../core/format.js';
import { addMessage, getChat, sysMessage, findChatByHandle, activeCustomerChats, customerChats, handle } from './chats.js';
import { reasonText } from './transcript.js';
import * as clock from './clock.js';
import * as world from './world.js';
import { lognormal } from './presence.js';
import { transferChat, openCount, brbAllowed, brbUsed } from './customers.js';
import { llmCall, parseJSON, withRetry } from './llm.js';
import { rankInfo } from './progress.js';
import { botSay } from './bot.js';
import { money } from '../core/format.js';
import { emit } from '../core/bus.js';
import * as team from './team.js';

export const BOSS = { name: 'Diane Whitfield', role: 'Head of Client Services' };
const MIN = 60000;
const HOUR = 3600000;

function chat() { return getChat('boss'); }

export function bossState() {
  const p = S.profile;
  p.boss ||= {};
  const b = p.boss;
  if (b.rapport != null && b.work == null) b.work = b.rapport; // v0.3 dev saves
  delete b.rapport;
  b.work ??= 55;
  b.friendship ??= 25;
  b.events ||= [];
  return b;
}

const clamp100 = (x) => Math.max(0, Math.min(100, x));
function bumpWork(d) { const b = bossState(); b.work = clamp100(b.work + d); }
function bumpFriendship(d) {
  const b = bossState();
  b.friendship = clamp100(b.friendship + (d > 0 ? d * (1 - b.friendship / 130) : d));
}

function workView() {
  const r = bossState().work;
  if (r >= 75) return 'excellent: one of your best people; you trust their work completely.';
  if (r >= 55) return 'solid: reliable, you trust them.';
  if (r >= 35) return 'mixed: some good work, some problems; you keep an eye on it.';
  if (r >= 20) return 'poor: you are worried about their performance and less inclined to do work favours.';
  return 'very poor: frankly one of the weaker agents; you are concerned.';
}

function friendshipView() {
  const f = bossState().friendship;
  if (f >= 80) return 'close friends: you genuinely enjoy talking to them. You chat freely about life outside work, joke around, share personal things (Ledger, books, what you cooked, your weekend), ask about theirs and remember it, and look out for them.';
  if (f >= 60) return 'friends: warm and relaxed; happy to chat about non-work things and share a bit about yourself.';
  if (f >= 40) return 'friendly colleagues: some small talk is welcome; you share the odd personal detail.';
  if (f >= 20) return 'acquaintances: mostly work. Polite, but you keep personal topics short at first; you warm up if they are pleasant and genuinely interested.';
  return 'cool: you prefer to keep it to work.';
}

// Things that happen elsewhere in the game (results.js, progress.js) and how Diane takes them.
export function noteEvent(kind, data = {}) {
  if (!S.profile) return;
  const t = data.t ?? clock.now();
  const b = bossState();
  const tell = (k, extra) => {
    if (b.events.some((e) => e.kind === k)) return;
    const [a, z] = cfg().boss.ping.eventDelayMs;
    b.events.push({ kind: k, at: t + rand(a, z), ...extra });
  };
  switch (kind) {
    case 'chat': {
      const r = data.chat.result;
      if (r.aiScore >= 85 && r.stars >= 4) bumpWork(1.5);
      else if (r.aiScore >= 70) bumpWork(0.5);
      else if (r.aiScore < 50) bumpWork(-2);
      if (data.chat.endReason === 'closed') bumpWork(-1);
      break;
    }
    case 'missed':
      bumpWork(-3);
      if (clock.today(t).missed >= 3 && b.missedTold !== new Date(t).toDateString()) { b.missedTold = new Date(t).toDateString(); tell('missedMany'); }
      break;
    case 'promotion': bumpWork(5); tell('promotion', { detail: data.title }); break;
    case 'highStreak': bumpWork(3); tell('highStreak'); break;
    case 'lowStreak': bumpWork(-2); tell('lowStreak'); break;
    case 'firstVip': tell('firstVip'); break;
    default: break;
  }
  touchProfile();
}

// ---------- when Diane is around ----------
function hourOf(t) { const d = new Date(t); return d.getHours() + d.getMinutes() / 60; }
export function onShift(t) {
  const B = cfg().boss.shift;
  const h = hourOf(t);
  return B.days.includes(new Date(t).getDay()) && h >= B.hours[0] && h < B.hours[1];
}
function awake(t) {
  const [a, z] = cfg().boss.awake;
  const h = hourOf(t);
  return h >= a && h < z;
}

function sessionLen(t) {
  const P = cfg().boss.presence;
  if (onShift(t)) return lognormal(P.shiftSessionMedianMin * MIN, 0.7, 3 * MIN, 2 * HOUR);
  const f = bossState().friendship >= 70 ? 1.5 : 1;
  return lognormal(P.offSessionMedianMin * MIN * f, 0.9, 20000, 30 * MIN);
}

// Her next stretch online starting after `from`.
function nextSession(from) {
  const P = cfg().boss.presence;
  let t = from;
  for (let i = 0; i < 3000; i++) {
    if (onShift(t)) {
      const gap = Math.random() < P.meetingChance ? rand(P.meetingMs[0], P.meetingMs[1]) : rand(P.shiftGapMs[0], P.shiftGapMs[1]);
      const start = t + gap;
      if (onShift(start) || awake(start)) return { start, end: start + sessionLen(start) };
      t = start;
    } else if (awake(t)) {
      const step = 5 * MIN;
      const rate = P.offChecksPerHour * (bossState().friendship >= 70 ? 1.4 : 1);
      if (Math.random() < 1 - Math.exp(-rate * step / HOUR)) {
        const start = t + Math.random() * step;
        return { start, end: start + sessionLen(start) };
      }
      t += step;
    } else t += 10 * MIN;
  }
  return { start: from + 86400000, end: from + 86400000 + MIN };
}

// Bring her timeline up to time t.
function presence(t = clock.now()) {
  const b = bossState();
  if (!b.pres || t - b.pres.end > 2 * 86400000) b.pres = nextSession(t - HOUR);
  for (let i = 0; i < 500 && b.pres.end <= t; i++) {
    b.lastSeen = b.pres.end;
    b.pres = nextSession(b.pres.end);
  }
  return b.pres;
}

export function isOnline(t = clock.now()) {
  const p = presence(t);
  return (p.start <= t && t < p.end) || !!chat()?.typing;
}

// She's on the app now (she's writing, or just read something).
function comeOnline(t) {
  const b = bossState();
  const p = presence(t);
  if (p.start <= t && t < p.end) return;
  b.lastSeen = Math.max(b.lastSeen || 0, t);
  b.pres = { start: t, end: t + sessionLen(t) };
}

// When Diane will reply to a message sent at t.
function replyTime(t) {
  const [a, z] = cfg().boss.replyDelayMs;
  if (isOnline(t)) return t + rand(a, z);
  return Math.max(t, presence(t).start) + rand(10000, 60000);
}

// The next moment at or after t when she'd write about work (on shift) / just to chat (awake).
function workTime(t) {
  for (let x = t, i = 0; i < 2000; i++, x += 10 * MIN) if (onShift(x)) return x === t ? t : x + rand(5, 40) * MIN;
  return t;
}
function chatTime(t) {
  for (let x = t, i = 0; i < 2000; i++, x += 10 * MIN) if (awake(x) && (onShift(x) || bossState().friendship >= 60)) return x === t ? t : x + rand(5, 60) * MIN;
  return t;
}

export function presenceText(t = clock.now()) {
  const c = chat();
  if (c?.typing) return { text: 'typing…', cls: 'online' };
  if (isOnline(t)) return { text: 'online', cls: 'online' };
  return { text: lastSeenText(bossState().lastSeen, t), cls: '' };
}

export function shiftText() {
  const B = cfg().boss.shift;
  const days = B.days.length === 5 && [1, 2, 3, 4, 5].every((d) => B.days.includes(d)) ? 'weekdays' : 'on her work days';
  const hh = (h) => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
  return `${days} ${hh(B.hours[0])}–${hh(B.hours[1])}`;
}

export function welcomeMessage() {
  const c = chat();
  if (!c || c.welcomed || c.messages.length) return;
  c.welcomed = true;
  addMessage(c, {
    from: 'them',
    text: `Hi ${S.profile.name}, Diane here. I run Client Services, so I'm your manager. Welcome to the (fully remote) team.\n\nCustomers will write to you through the day. Aim to answer within about 3 hours; after 12 hours they start chasing, and if you leave them much longer they'll go elsewhere.\n\nI'm at my desk ${shiftText()} and answer quickly then; otherwise I reply when I check my phone. Message me if you want:\n• a **rush**: I'll route the next few customers to you right now\n• a **lighter or heavier day**\n• **time off**: I'll pause your queue\n• to **hand a chat over** to a colleague (mention it, e.g. @chat3)\n\nAnd if your numbers are good, you're welcome to ask about a raise.`,
  });
}

export function onPlayerMessage(text) {
  const c = chat();
  const t = clock.now();
  addMessage(c, { from: 'me', text, read: false, t });
  if (!c.replyAt) c.replyAt = replyTime(t);
  touchChat(c);
}

// ---------- what Diane may do right now ----------
// ---------- what Diane may do right now ----------
function recentAvg() {
  const R = cfg().boss.raise;
  const xs = (S.profile.recentScores || []).slice(-R.window);
  return { n: xs.length, avg: xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0 };
}

function raiseStatus() {
  const R = cfg().boss.raise;
  const p = S.profile;
  const since = p.stats.completed - (p.raiseAtChats || 0);
  const { n, avg } = recentAvg();
  const current = p.payRaise || 0;
  if (current >= R.max - 1e-9) return { ok: false, why: `already at the maximum raise (+${Math.round(R.max * 100)}%)` };
  if (since < R.minChatsBetween) return { ok: false, why: `only ${since} chats finished since the last pay review; needs ${R.minChatsBetween}` };
  if (n < R.window || avg < R.minAvgScore) return { ok: false, why: `average score over the last ${R.window} chats is ${n ? num(avg, 0) : 'n/a'}; needs ${R.minAvgScore}+` };
  return { ok: true, why: `${since} chats since the last review, recent average ${num(avg, 0)}/100` };
}

function overdue(t = clock.now()) {
  return activeCustomerChats().filter((c) => c.cs.waitingSince != null && t - c.cs.waitingSince > cfg().world.nudgeAfterMs);
}

function allowedActions(t) {
  const B = cfg().boss;
  const W = cfg().world;
  const w = world.state();
  const vac = world.vacation();
  const rush = world.rushStatus(t);
  const out = [];
  const no = [];
  if (vac) out.push(['end_time_off', 'end the agent\'s time off now and reopen their queue']);
  else {
    if (rush.active) no.push(`rush: a rush is already running (${rush.left} customers still to come)`);
    else if (!rush.ready) no.push(`rush: the last rush was recent; next possible in ${waitWords(rush.cooldownUntil - t)}`);
    else if (openCount() + 2 > W.openCap) no.push(`rush: the agent already has ${openCount()} open chats (limit ${W.openCap})`);
    else out.push(['rush', 'route the next 2-3 customers to the agent right now; they stay online and expect replies within minutes (pays +' + Math.round((cfg().rush.payMult - 1) * 100) + '%)']);
    if (w.load && t < w.load.until) no.push(`lighter_day/heavier_day: today is already set to a ${w.load.label} day`);
    else {
      out.push(['lighter_day', `about half the usual number of new customers for the rest of today`]);
      out.push(['heavier_day', `about 50% more new customers for the rest of today`]);
    }
    out.push(['time_off', `give the agent time off: no new customers and open chats are paused. Put the length in "hours" (1-${B.maxTimeOffHours})`]);
  }
  const tr = world.transfersToday(t);
  if (tr >= B.transfersPerDay) no.push(`transfer: already transferred ${tr} chats today (limit ${B.transfersPerDay})`);
  else if (!activeCustomerChats().length) no.push('transfer: the agent has no open chats');
  else out.push(['transfer', `hand one open chat to a colleague (no pay or rating for the agent). Put the chat handle in "chat", e.g. "@chat12". ${B.transfersPerDay - tr} left today`]);
  const rs = raiseStatus();
  if (rs.ok) out.push(['raise', `give a +${Math.round(B.raise.step * 100)}% pay raise (${rs.why})`]);
  else no.push(`raise: not deserved yet: ${rs.why}`);
  out.push(['none', 'just reply']);
  return { out, no };
}

function contextText(t) {
  const p = S.profile;
  const W = cfg().world;
  const d = clock.today(t);
  const r = rankInfo(p.rank);
  const { n, avg } = recentAvg();
  const od = overdue(t);
  const w = world.state();
  const vac = world.vacation();
  const open = activeCustomerChats();
  return [
    `Now: ${new Date(t).toLocaleString('en-GB', { weekday: 'long', hour: '2-digit', minute: '2-digit' })} (agent's local time).`,
    `Agent: ${p.name}, rank ${p.rank} (${r.title}). Chats finished: ${p.stats.completed}; recent average answer score ${n ? num(avg, 0) + '/100 over ' + plural(n, 'chat') : 'n/a'}; customers who gave up waiting: ${p.stats.missed || 0}; current pay raise +${Math.round((p.payRaise || 0) * 100)}%.`,
    `Today: ${d.arrivals || 0} customers wrote in (normal day: about ${W.dailyTarget}), ${d.chats} chats finished. Open chats: ${open.length}/${W.openCap}${od.length ? `; ${od.length} have waited over 12 hours (${od.slice(0, 6).map(handle).join(', ')})` : ''}.`,
    open.length ? 'Open chats: ' + open.slice(0, 15).map((c) => `${handle(c)} ${c.customer.name}${c.customer.vip ? ' (VIP)' : ''}, ${c.question.topic}${c.cs.waitingSince != null ? ', waiting ' + waitWords(t - c.cs.waitingSince) : ''}`).join('; ') : '',
    recentlyEnded(t),
    w.load && t < w.load.until ? `Today is set to a ${w.load.label} day.` : '',
    vac ? `The agent is on time off until ${new Date(vac.end).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}.` : '',
  ].filter(Boolean).join('\n');
}

function recentlyEnded(t) {
  const list = customerChats().filter((c) => c.status !== 'active' && c.endedAt && t - c.endedAt < 86400000 && c.endedAt <= t)
    .sort((a, b) => b.endedAt - a.endedAt).slice(0, 10);
  if (!list.length) return '';
  return 'Chats that ended in the last 24 hours: ' + list.map((c) => `${handle(c)} ${c.customer.name}: ${c.endReason === 'transferred' ? 'transferred to a colleague by you' : reasonText(c.endReason)}${c.result && !c.result.missed ? `, score ${c.result.aiScore}/100` : ''} (${when(c.endedAt)})`).join('; ') + '.';
}

const when = (t) => new Date(t).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Static, so the long conversation history after it can be cached by the API.
const SYSTEM = `You are Diane Whitfield, Head of Client Services at Whiterock, a financial-services firm, chatting on the company messenger with one of your support agents (the player of a training game). You're experienced, fair, warm but busy, with dry humour. You care about customers being answered well and on time, and about your people not burning out.

Whiterock's support team is fully remote. You work from home and you and the agent have never met in person: everything happens over this messenger. Never suggest meeting up, coffee, lunch, drinks, office visits or anything in person, and don't talk as if you share an office. You can still be personal in a remote way.

About you (share only as much as your friendship with the agent warrants): 19 years at Whiterock, started as an auditor; a beagle called Ledger who sleeps under your desk; black coffee; you read crime novels and like cooking on Sundays; you live with your partner, Tom.

You hold two separate views of the agent, given in the CONTEXT note with each message: your professional opinion of their work, and your personal friendship. They are independent. You can be honest that their work is poor and still be close friends, or respect their work while keeping things purely professional. Friendship decides how open you are to off-work conversation; work opinion decides how you talk about their performance and how readily you do work favours.

Style: a work messenger. Usually 1-4 short sentences, plain text, no headings; a little longer only for a real personal conversation. Remember everything said earlier in this conversation and stay consistent with it. Never invent facts about the agent, their chats or customers beyond what the conversation and the CONTEXT note say. The CONTEXT note is live and authoritative: chats end, get transferred and arrive between messages, so if it no longer matches something said earlier, things moved on (nobody was mistaken). Lines in the history starting with "[done]" are actions you already took.

Reply with ONLY a JSON object in the format the CONTEXT note asks for.`;

function contextNote(t, actions) {
  const lines = [
    '[CONTEXT: not written by the agent]',
    `Your professional view of their work: ${workView()}`,
    `Your personal friendship with them: ${friendshipView()}`,
    `You are ${onShift(t) ? 'on your shift, at your desk' : awake(t) ? 'off shift, on your phone (evening or weekend)' : 'up unusually late'}.`,
    '',
    'SITUATION',
    contextText(t),
  ];
  const tl = getChat('team') ? team.recentLines(30) : '';
  const b = bossState();
  if (b.away && !b.away.told && b.away.until <= t) lines.push('', `Earlier (${when(b.away.at)}) you had to step away ("${b.away.reason}") and you're back now. If the agent wrote meanwhile, start with a brief, natural acknowledgement.`);
  if (b.urgentAt && t - b.urgentAt < 2 * HOUR) lines.push('', `At ${when(b.urgentAt)} the agent used their once-per-game URGENT call to get you online${onShift(b.urgentAt) ? '' : awake(b.urgentAt) ? ' outside your shift' : ' in the middle of the night'}.`);
  if (tl) lines.push('', 'TEAM CHANNEL #support-team (group chat with the agent and four coworkers; you are a member). Recent messages:', tl);
  if (actions) {
    lines.push('', 'ACTIONS YOU CAN TAKE NOW (at most one; only if the agent asked for it or it clearly fits):');
    for (const [k, v] of actions.out) lines.push(`- "${k}": ${v}`);
    if (actions.no.length) { lines.push('', 'NOT POSSIBLE RIGHT NOW (explain kindly if asked):'); for (const x of actions.no) lines.push('- ' + x); }
    lines.push('', 'Use judgement like a real manager: you may refuse a heavier day or a rush while customers have waited over 12 hours, ask them to clear the backlog before time off, or grant it anyway if they seem overwhelmed. A raise is only possible when listed above. Off shift you can still act from your phone, or say you\'ll handle it tomorrow.');
    lines.push('', `OUTPUT: {"reply": "<your message>", "action": "<one of: ${actions.out.map(([k]) => k).join(', ')}>", "hours": <number, only for time_off>, "chat": "<@chatN, only for transfer>", "warmth": <integer -2..2: how the agent's new messages felt to you personally: 2 genuinely kind, funny or interested in you; 1 friendly; 0 neutral or purely work; -1 cold or curt; -2 rude>}`);
  }
  return lines.join('\n');
}

// The whole conversation, oldest first. Actions she took are folded into her turns.
function historyMessages(exclude = new Set()) {
  const msgs = [{ role: 'user', content: '(The conversation with the agent starts here.)' }];
  const push = (role, text) => {
    const last = msgs[msgs.length - 1];
    if (last.role === role) last.content += '\n\n' + text;
    else msgs.push({ role, content: text });
  };
  for (const m of chat().messages) {
    if (exclude.has(m.id) || m.kind === 'error') continue;
    if (m.from === 'me') push('user', `[${when(m.t)}] ${m.text}`);
    else if (m.from === 'them') push('assistant', JSON.stringify({ at: when(m.t), reply: m.text }));
    else push('assistant', `[done] ${m.text}`);
  }
  return msgs;
}

// History + one final user turn; marks the end of the history as cacheable.
function buildMessages(finalText, exclude) {
  const msgs = historyMessages(exclude);
  let cacheAt = msgs.length - 1;
  if (msgs[msgs.length - 1].role === 'user') { msgs[msgs.length - 1].content += '\n\n' + finalText; cacheAt -= 1; }
  else msgs.push({ role: 'user', content: finalText });
  if (cacheAt >= 2) {
    const m = msgs[cacheAt];
    m.content = [{ type: 'text', text: m.content, cache_control: { type: 'ephemeral' } }];
  }
  return msgs;
}

async function typeOut(c, text, live) {
  if (!live) return;
  c.typing = true;
  touchChat(c);
  await sleep(Math.min(9000, Math.max(1500, text.length * 30)));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let busy = false;

async function respond(t) {
  const c = chat();
  busy = true;
  c.messages = c.messages.filter((m) => !(m.kind === 'error' && m.retry === 'boss'));
  try {
    const pending = c.messages.filter((m) => m.from === 'me' && !m.read);
    if (!pending.length) return;
    for (const m of pending) { m.read = true; m.readAt = t; }
    const live = clock.now() - t < 120000;
    if (live) { comeOnline(clock.now()); c.typing = true; touchChat(c); }
    const actions = allowedActions(t);
    const final = contextNote(t, actions) + '\n\n[NEW MESSAGES FROM THE AGENT]\n' + pending.map((m) => `[${when(m.t)}] ${m.text}`).join('\n\n');
    const messages = buildMessages(final, new Set(pending.map((m) => m.id)));
    const raw = await withRetry(() => llmCall({ role: 'boss', category: 'boss', system: SYSTEM, messages, maxTokens: 500, temperature: 0.7 }), 3, 1500);
    const j = parseJSON(raw);
    const reply = String(j.reply || 'Noted.').trim();
    await typeOut(c, reply, live);
    const at = live ? clock.now() : t + 20000;
    c.typing = false;
    comeOnline(at);
    addMessage(c, { from: 'them', text: reply, t: at });
    const warmth = Math.max(-2, Math.min(2, Math.round(Number(j.warmth ?? j.tone) || 0)));
    bumpFriendship([-6, -3, 0.3, 1.5, 3][warmth + 2]);
    if (warmth <= -2) bumpWork(-2); // rude to your manager: noted professionally too
    const allowed = new Set(actions.out.map(([k]) => k));
    if (j.action && j.action !== 'none' && allowed.has(j.action)) apply(j, at);
    if (bossState().away?.until <= at) bossState().away.told = true;
    if (live) await maybeStepAway(at);
  } catch (e) {
    c.typing = false;
    sysMessage(c, '⚠ Diane couldn\'t reply: ' + e.message, { kind: 'error', retry: 'boss' });
  } finally {
    busy = false;
    c.typing = false;
    touchChat(c);
    touchProfile();
  }
}

function apply(j, t) {
  const c = chat();
  const B = cfg().boss;
  const p = S.profile;
  switch (j.action) {
    case 'rush': {
      const n = world.startRush(t);
      sysMessage(c, `⚡ Rush shift: ${plural(n, 'customer')} coming your way in the next few minutes. They stay online and expect quick replies (+${Math.round((cfg().rush.payMult - 1) * 100)}% pay).`, { t });
      break;
    }
    case 'lighter_day':
    case 'heavier_day': {
      world.setLoad(j.action === 'lighter_day' ? 'lighter' : 'heavier', t);
      sysMessage(c, j.action === 'lighter_day' ? '🌤 Lighter day: fewer new customers until midnight.' : '📈 Heavier day: more new customers until midnight.', { t });
      break;
    }
    case 'time_off': {
      const h = Math.max(1, Math.min(B.maxTimeOffHours, Math.round(Number(j.hours) || 8)));
      world.startVacation(h, t);
      sysMessage(c, `🌴 Time off for ${plural(h, 'hour')}: no new customers, and your open chats are paused until you're back. Message Diane to come back early.`, { t });
      break;
    }
    case 'end_time_off': {
      world.endVacation(t);
      sysMessage(c, '💼 Welcome back: your queue is open again.', { t });
      break;
    }
    case 'transfer': {
      const target = j.chat ? findChatByHandle(String(j.chat)) : null;
      if (!target || target.status !== 'active') { sysMessage(c, '↪ No open chat matched, so nothing was transferred.', { t }); break; }
      const taker = team.pickTaker(t);
      transferChat(target, taker?.name);
      target.transferredTo = taker?.id || null;
      world.countTransfer();
      bumpWork(-1);
      sysMessage(c, `↪ ${handle(target)} (${target.customer.name}) was handed to ${taker ? taker.name : 'a colleague'}. No pay or rating for that one.`, { t });
      break;
    }
    case 'raise': {
      p.payRaise = Math.min(B.raise.max, (p.payRaise || 0) + B.raise.step);
      p.raiseAtChats = p.stats.completed;
      sysMessage(c, `💰 Pay raise: you now earn +${Math.round(p.payRaise * 100)}% on every chat.`, { t });
      emit('profile');
      break;
    }
    default: break;
  }
  touchProfile();
}

export function retryBoss() {
  const c = chat();
  const lastMine = [...c.messages].reverse().find((m) => m.from === 'me');
  if (lastMine) lastMine.read = false;
  c.replyAt = clock.now();
  touchChat(c);
}

// ---------- unprompted messages ----------
const REASONS = {
  urgent: () => `The agent just used their once-per-game URGENT call to get you online right now (${new Date(clock.now()).toLocaleString('en-GB', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}). React in character to being summoned (how you feel depends on the time, whether you were on shift or asleep, and your friendship) and ask what's up.`,
  promotion: (e) => `The agent was just promoted${e.detail ? ' to ' + e.detail : ''}. Congratulate them, in your own way.`,
  highStreak: () => 'The agent has had a run of excellent chats lately. Tell them, briefly.',
  lowStreak: () => 'The agent\'s last few chats went badly (low ratings). Check in supportively; you might suggest the mentor, the 📖 Concept button, or a lighter day.',
  firstVip: () => 'The agent just handled their first VIP client. A short remark about VIPs (they pay well and notice everything).',
  review: (e) => `It's the agent's monthly performance review for ${e.month}. The KPIs and the outcome were decided by HR rules: rating "${e.rating}"; ${e.outcome}. KPIs: ${e.kpiText}. Write the review message: 3-6 sentences, honest and specific about the numbers, in a tone that fits both your views of them (a friend still gets the honest version). Mention the outcome. A KPI card is shown under your message, so don't list every number.`,
  missedMany: () => 'Several customers gave up today before the agent ever replied. Raise it, in a way that fits both your views of them; offer a lighter day if they seem swamped.',
  backlog: (e) => `Several customers have been waiting over 12 hours (${e.detail}). Ask the agent to get to them; offer to lighten the load or move one to a colleague.`,
  casual: () => 'No work reason: you are messaging because you like talking to them. Pick up something personal from earlier in your conversation if there is one (ask how it went), or share something small from your day (remote-work life, Ledger, cooking, a book). Keep it light and short. No work assignments.',
  checkin: () => 'A brief, friendly work check-in: how are things going, do they need anything. Short.',
  concern: () => 'A short, professional check-in about how their work is going, based on the numbers. Offer help (mentor, lighter day). Not harsh.',
};

async function ping(kind, T, ev = {}, fallback = null) {
  const c = chat();
  const b = bossState();
  busy = true;
  const live = clock.now() - T < 120000;
  try {
    let text;
    try {
      const final = contextNote(T, null) + `\n\nYou are writing UNPROMPTED: the agent has not just messaged you. Why: ${REASONS[kind](ev)}\nDon't repeat what you said recently. 1-3 short sentences.\nOUTPUT: {"reply": "<your message>"}`;
      const raw = await withRetry(() => llmCall({ role: 'boss', category: 'boss', system: SYSTEM, messages: buildMessages(final), maxTokens: 300, temperature: 0.85 }), 2, 1500);
      text = String(parseJSON(raw).reply || '').trim();
    } catch (e) {
      text = fallback;
    }
    if (!text) return;
    const at = live ? clock.now() : T;
    comeOnline(at);
    await typeOut(c, text, live);
    addMessage(c, { from: 'them', text, t: live ? clock.now() : T, unprompted: kind });
    b.lastPingAt = T;
  } finally {
    busy = false;
    c.typing = false;
    touchChat(c);
    touchProfile();
  }
}

// Friends hear from her more often.
function scheduleCasual(from) {
  const b = bossState();
  const [a, z] = cfg().boss.ping.everyHours;
  b.nextPingAt = from + rand(a, z) * HOUR * (1.7 - b.friendship / 100);
}

function casualKind() {
  const b = bossState();
  const { n, avg } = recentAvg();
  if (b.friendship >= 55) return Math.random() < 0.8 ? 'casual' : 'checkin';
  if (b.work < 35 && ((n && avg < 70) || (S.profile.stats.missed || 0) > 0)) return 'concern';
  return Math.random() < 0.5 ? 'checkin' : null;
}

const WORK_KINDS = new Set(['highStreak', 'lowStreak', 'firstVip', 'missedMany', 'backlog', 'checkin', 'concern']);

// Returns true if a message is being sent.
function proactive(now) {
  const c = chat();
  const b = bossState();
  if (world.vacation() || c.replyAt) return false;
  const recent = c.messages.length ? c.messages[c.messages.length - 1].t : 0;
  // things that happened
  b.events = b.events.filter((e) => e.kind === 'review' || now - e.at < 86400000);
  for (const e of b.events) {
    const T = e.kind === 'urgent' ? e.at : WORK_KINDS.has(e.kind) || e.kind === 'review' ? workTime(e.at) : chatTime(e.at);
    if (T > now) { e.at = T; continue; }
    b.events = b.events.filter((x) => x !== e);
    ping(e.kind, Math.min(now, Math.max(T, recent + MIN)), e, e.fallback || null).then(() => { if (e.card) sysMessage(chat(), e.card.title, { kind: 'review', review: e.card, t: clock.now() }); });
    return true;
  }
  // a backlog of customers waiting over 12 hours
  const B = cfg().boss;
  const od = overdue(now);
  if (onShift(now) && od.length >= B.overdueNagCount && now - (S.profile.lastBossNag || 0) >= B.overdueNagEveryMs) {
    S.profile.lastBossNag = now;
    bumpWork(-2);
    const list = od.slice(0, 5).map(handle).join(', ') + (od.length > 5 ? ', …' : '');
    ping('backlog', now, { detail: list }, `${S.profile.name}, I'm seeing ${plural(od.length, 'customer')} who've been waiting over 12 hours (${list}). Can you get to them today? If you're swamped, tell me and I'll lighten your load or move one to a colleague.`);
    return true;
  }
  // just checking in / chatting
  if (b.nextPingAt == null) { scheduleCasual(now); return false; }
  if (now < b.nextPingAt) return false;
  const kind = casualKind();
  if (!kind) { scheduleCasual(now); return false; }
  const T = kind === 'casual' ? chatTime(b.nextPingAt) : workTime(b.nextPingAt);
  if (T > now) { b.nextPingAt = T; return false; }
  if (now - T > 12 * HOUR || now - recent < 4 * HOUR) { scheduleCasual(now); return false; }
  scheduleCasual(T);
  ping(kind, T);
  return true;
}

// ---------- the team channel (same memory as your private chat) ----------
const TEAM_NOTE = 'You are writing in the TEAM CHANNEL #support-team, visible to the agent and four coworkers (Priya, Marcus, Sofia, Ken), not in your private chat. Keep it short and team-appropriate; don\'t bring up private matters from your one-to-one chat unless the agent raised them here.';

export async function teamReply(teamLines) {
  const t = clock.now();
  try {
    const final = contextNote(t, null) + `\n\n${TEAM_NOTE}\nThe agent just wrote in the channel and it needs you. Channel so far:\n${teamLines}\n\nOUTPUT: {"reply": "<your message in the channel>"}`;
    const raw = await withRetry(() => llmCall({ role: 'boss', category: 'boss', system: SYSTEM, messages: buildMessages(final), maxTokens: 300, temperature: 0.7 }), 2, 1500);
    comeOnline(clock.now());
    return String(parseJSON(raw).reply || '').trim();
  } catch (e) {
    console.warn('Diane team reply failed', e);
    return '';
  }
}

export async function teamPost(teamLines, at) {
  try {
    const final = contextNote(at, null) + `\n\n${TEAM_NOTE}\nWrite one unprompted team-wide post: a short manager note (a thank-you to the team, a heads-up about volumes, a reminder, a bit of encouragement, or light banter). Channel so far:\n${teamLines}\n\nOUTPUT: {"reply": "<your message>"}`;
    const raw = await withRetry(() => llmCall({ role: 'boss', category: 'boss', system: SYSTEM, messages: buildMessages(final), maxTokens: 250, temperature: 0.85 }), 2, 1500);
    return String(parseJSON(raw).reply || '').trim();
  } catch (e) {
    console.warn('Diane team post failed', e);
    return '';
  }
}

// ---------- monthly performance review ----------
const monthKey = (t) => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };

function monthKpis(key) {
  const p = S.profile;
  const days = Object.entries(p.days || {}).filter(([k]) => k.startsWith(key)).map(([, v]) => v);
  const sum = (f) => days.reduce((s, d) => s + (d[f] || 0), 0);
  const chats = sum('chats');
  const ended = customerChats().filter((c) => c.endedAt && monthKey(c.endedAt) === key && c.result && !c.result.missed);
  const lat = ended.flatMap((c) => c.cs.latencies || []);
  return {
    chats, missed: sum('missed'), arrivals: sum('arrivals'), earned: sum('earned'),
    avgScore: chats ? sum('scoreSum') / chats : 0, avgStars: chats ? sum('starsSum') / chats : 0,
    avgReplyMs: lat.length ? lat.reduce((s, x) => s + x, 0) / lat.length : null,
    chased: ended.reduce((s, c) => s + (c.cs.nudges || 0), 0), vips: ended.filter((c) => c.customer.vip).length,
  };
}

function maybeReview(now) {
  const b = bossState();
  const p = S.profile;
  const thisMonth = monthKey(now);
  if (b.lastReview === thisMonth) return;
  if (!b.lastReview) { b.lastReview = thisMonth; return; } // your first (partial) month isn't reviewed
  b.lastReview = thisMonth;
  const d = new Date(now); d.setDate(0); // last day of the previous month
  const prev = monthKey(d.getTime());
  const monthName = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const R = cfg().boss.review;
  const k = monthKpis(prev);
  if (k.chats < R.minChats) return;
  const missedRate = k.missed / Math.max(1, k.chats + k.missed);
  let rating, outcome;
  if (k.avgScore >= R.exceeds.avgScore && k.avgStars >= R.exceeds.avgStars && missedRate <= R.exceeds.maxMissedRate) {
    const bonus = Math.round(rankInfo(p.rank).basePay * R.bonusChats);
    p.balance += bonus; p.lifetimeEarned += bonus;
    rating = 'Exceeds expectations'; outcome = `a performance bonus of ${money(bonus)} has been paid`;
    bumpWork(5); b.belowStreak = 0;
    botSay(`🏆 Performance bonus from Diane: **${money(bonus, { plus: true })}**\nBalance: **${money(p.balance)}**`, { silent: true });
  } else if (k.avgScore >= R.meets.avgScore && missedRate <= R.meets.maxMissedRate) {
    rating = 'Meets expectations'; outcome = 'no change to pay; keep it up';
    bumpWork(1); b.belowStreak = 0;
  } else {
    b.belowStreak = (b.belowStreak || 0) + 1;
    rating = 'Below expectations';
    if (b.belowStreak >= 2 && (p.payRaise || 0) > 0) {
      p.payRaise = Math.max(0, p.payRaise - cfg().boss.raise.step);
      outcome = `second month in a row below expectations, so one raise step was removed (now +${Math.round(p.payRaise * 100)}%)`;
    } else outcome = b.belowStreak >= 2 ? 'second month in a row below expectations: a formal improvement plan' : 'an informal improvement plan for next month: clear targets, and the mentor is there to help';
    bumpWork(-4);
  }
  const rows = [
    ['Chats finished', String(k.chats)], ['Average answer score', `${Math.round(k.avgScore)}/100`], ['Average service', `${k.avgStars.toFixed(2)}★`],
    ['Customers who gave up before a reply', `${k.missed} (${Math.round(missedRate * 100)}%)`], ['Average reply time', k.avgReplyMs == null ? '—' : waitWords(k.avgReplyMs)],
    ['Times a customer chased you', String(k.chased)], ['VIP clients served', String(k.vips)], ['Earned', money(k.earned)],
  ];
  const card = { title: `📋 Performance review · ${monthName}`, rating, outcome, rows };
  const kpiText = rows.map(([a, v]) => `${a}: ${v}`).join('; ');
  b.events = b.events.filter((e) => e.kind !== 'review');
  b.events.push({ kind: 'review', at: now, month: monthName, rating, outcome, kpiText, card,
    fallback: `${p.name}, your review for ${monthName}: ${rating}. ${outcome[0].toUpperCase() + outcome.slice(1)}. Details below.` });
  touchProfile();
}

// ---------- brb ----------
// Rarely (shared limit with customers: about once every day or two), right after replying live,
// Diane has to go for a while. She's offline until then and acknowledges it when she's back.
async function maybeStepAway(t) {
  const A = cfg().boss.stepAway;
  if (!brbAllowed(t) || Math.random() >= (onShift(t) ? A.chanceShift : A.chanceOff)) return;
  const b = bossState();
  if (b.urgentAt && t - b.urgentAt < HOUR) return; // you called her urgently: she stays
  const c = chat();
  const text = pick(onShift(t) ? A.shiftLines : A.offLines);
  c.typing = true;
  touchChat(c);
  await sleep(rand(2500, 6000));
  c.typing = false;
  const at = clock.now();
  addMessage(c, { from: 'them', text, kind: 'away', t: at });
  const until = at + lognormal(A.awayMedianMin * MIN, A.sigma, A.minMin * MIN, A.maxMin * MIN);
  b.away = { reason: text, at, until, told: false };
  b.lastSeen = at;
  b.pres = { start: until, end: until + sessionLen(until) };
  brbUsed(at);
  touchProfile();
}

// ---------- the one urgent call per game ----------
export function urgentUsed() { return bossState().urgentAt || null; }

export function urgent() {
  const b = bossState();
  if (b.urgentAt) return { ok: false, at: b.urgentAt };
  const now = clock.now();
  const [a, z] = cfg().boss.urgent.sessionMin;
  b.urgentAt = now;
  b.lastSeen = Math.max(b.lastSeen || 0, now);
  b.pres = { start: now + 5000, end: now + rand(a, z) * MIN };
  b.away = null;
  const c = chat();
  if (c.messages.some((m) => m.from === 'me' && !m.read)) c.replyAt = now + rand(10000, 30000);
  else b.events.push({ kind: 'urgent', at: now + rand(10000, 30000) });
  touchProfile();
  touchChat(c);
  return { ok: true };
}

// ---------- the clock ----------
export function tick(now = clock.now()) {
  const c = chat();
  if (!c || busy) return;
  presence(now);
  if (c.replyAt && now >= c.replyAt) {
    const t = c.replyAt;
    c.replyAt = null;
    respond(Math.max(t, now - 6 * HOUR));
    return;
  }
  if (onShift(now)) maybeReview(now);
  proactive(now);
}

// What Diane would be sent right now (for debugging in DevTools and for tests).
export function promptPreview(t = clock.now()) {
  return SYSTEM + '\n\n' + historyMessages().map((m) => m.role + ': ' + m.content).join('\n') + '\n\n' + contextNote(t, allowedActions(t));
}
