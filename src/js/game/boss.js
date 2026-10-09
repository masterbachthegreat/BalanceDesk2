// Your manager, Diane Whitfield (Head of Client Services). You can message her; she replies
// during office hours (your local time) and can change things: a rush shift, a lighter or
// heavier day, time off, taking a chat off your hands, or a raise. The LLM only picks from
// the actions this code says are allowed right now; the code applies them.
// She also writes to you unprompted now and then: about things that happened (a promotion,
// a bad streak, a backlog) or just to chat, depending on how well you get on (`rapport`,
// hidden, 0-100, in profile.boss).
import { S, cfg, rand, touchChat, touchProfile } from '../core/state.js';
import { waitWords, num, plural } from '../core/format.js';
import { addMessage, getChat, sysMessage, findChatByHandle, activeCustomerChats, customerChats, handle } from './chats.js';
import { reasonText } from './transcript.js';
import * as clock from './clock.js';
import * as world from './world.js';
import { transferChat, openCount } from './customers.js';
import { llmCall, parseJSON, withRetry } from './llm.js';
import { rankInfo } from './progress.js';
import { emit } from '../core/bus.js';

export const BOSS = { name: 'Diane Whitfield', role: 'Head of Client Services' };

function chat() { return getChat('boss'); }

export function bossState() {
  const p = S.profile;
  p.boss ||= {};
  const b = p.boss;
  b.rapport ??= 55;
  b.events ||= [];
  return b;
}

function bump(delta) {
  const b = bossState();
  b.rapport = Math.max(0, Math.min(100, b.rapport + delta));
}

function relationship() {
  const r = bossState().rapport;
  if (r >= 75) return 'close: you genuinely like working with them. Relaxed, first-name, light banter; you may share a small personal remark now and then. You give them the benefit of the doubt.';
  if (r >= 55) return 'good: friendly and supportive; you trust them.';
  if (r >= 35) return 'neutral: professional and polite, not much small talk.';
  if (r >= 20) return 'strained: cooler and more formal; you are keeping an eye on their performance and are less inclined to do favours.';
  return 'poor: curt and businesslike; you are worried about their performance.';
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
      if (r.aiScore >= 85 && r.stars >= 4) bump(1.5);
      else if (r.aiScore >= 70) bump(0.5);
      else if (r.aiScore < 50) bump(-2);
      if (data.chat.endReason === 'closed') bump(-1);
      break;
    }
    case 'missed':
      bump(-3);
      if (clock.today(t).missed >= 3 && !b.missedTold?.startsWith?.(new Date(t).toDateString())) { b.missedTold = new Date(t).toDateString(); tell('missedMany'); }
      break;
    case 'promotion': bump(5); tell('promotion', { detail: data.title }); break;
    case 'highStreak': bump(3); tell('highStreak'); break;
    case 'lowStreak': bump(-2); tell('lowStreak'); break;
    case 'firstVip': tell('firstVip'); break;
    default: break;
  }
  touchProfile();
}

function inOffice(t) {
  const h = new Date(t).getHours();
  const [a, b] = cfg().boss.workHours;
  return h >= a && h < b;
}

// t if Diane is in the office then, else shortly after she next gets in.
function officeTime(t) {
  if (inOffice(t)) return t;
  const d = new Date(t);
  if (d.getHours() >= cfg().boss.workHours[1]) d.setDate(d.getDate() + 1);
  d.setHours(cfg().boss.workHours[0], 0, 0, 0);
  return d.getTime() + rand(5, 40) * 60000;
}

// When Diane will get to a message sent at t.
function replyTime(t) {
  const [a, b] = cfg().boss.replyDelayMs;
  return officeTime(t + rand(a, b));
}

export function presenceText(t = clock.now()) {
  const c = chat();
  if (c?.typing) return { text: 'typing…', cls: 'online' };
  return inOffice(t) ? { text: BOSS.role + ' · in the office', cls: 'online' } : { text: BOSS.role + ' · out of office, back at ' + String(cfg().boss.workHours[0]).padStart(2, '0') + ':00', cls: '' };
}

export function welcomeMessage() {
  const c = chat();
  if (!c || c.welcomed || c.messages.length) return;
  c.welcomed = true;
  addMessage(c, {
    from: 'them',
    text: `Hi ${S.profile.name}, Diane here. I run Client Services, so I'm your manager.\n\nCustomers will write to you through the day. Aim to answer within about 3 hours; after 12 hours they start chasing, and if you leave them much longer they'll go elsewhere.\n\nMessage me any time (I answer during office hours) if you want:\n• a **rush**: I'll route the next few customers to you right now\n• a **lighter or heavier day**\n• **time off**: I'll pause your queue\n• to **hand a chat over** to a colleague (mention it, e.g. @chat3)\n\nAnd if your numbers are good, you're welcome to ask about a raise.`,
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
  const hm = (x) => new Date(x).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  return 'Chats that ended in the last 24 hours: ' + list.map((c) => `${handle(c)} ${c.customer.name}: ${c.endReason === 'transferred' ? 'transferred to a colleague by you' : reasonText(c.endReason)}${c.result && !c.result.missed ? `, score ${c.result.aiScore}/100` : ''} (${hm(c.endedAt)})`).join('; ') + '.';
}

function actionLog() {
  const xs = chat().messages.filter((m) => m.from === 'sys' && m.kind !== 'error').slice(-8);
  if (!xs.length) return '';
  return '\n\nTHINGS YOU ALREADY DID (system log, newest last):\n' + xs.map((m) => `- ${new Date(m.t).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}: ${m.text}`).join('\n');
}

const PERSONA = `You are Diane Whitfield, Head of Client Services at Whiterock, a financial-services firm. You manage the support agent you're chatting with (the player of a training game). You're experienced, fair, warm but busy; dry humour now and then. You care about customers being answered well and on time, and about your people not burning out. Background (mention rarely, and only when you get on well): 19 years at Whiterock, started as an auditor, cycles to work, runs on black coffee, has a beagle called Ledger.

Write like a manager on a work messenger: 1-4 short sentences, plain text, no headings. Never invent facts about the agent, their chats or customers beyond what's below.`;

const SYSTEM = (actions, ctx) => `${PERSONA} Don't promise anything you can't do with the actions below.

YOUR RELATIONSHIP WITH THE AGENT: ${relationship()}

SITUATION (live and authoritative; it changes between messages: chats end, get transferred, new ones arrive. If it no longer matches something said earlier, that's because things moved on, not because anyone was mistaken.)
${ctx}${actionLog()}

ACTIONS YOU CAN TAKE NOW (pick at most one, only if the agent asked for it or it clearly fits):
${actions.out.map(([k, v]) => `- "${k}": ${v}`).join('\n')}
${actions.no.length ? `\nNOT POSSIBLE RIGHT NOW (explain kindly if asked):\n${actions.no.map((x) => '- ' + x).join('\n')}` : ''}

Use judgement like a real manager: e.g. you may refuse a heavier day or a rush if the agent has customers waiting over 12 hours, or ask them to clear the backlog before time off, or grant it anyway if they seem overwhelmed. A raise is only possible when listed above.

OUTPUT: only a JSON object:
{"reply": "<your message>", "action": "<one of: ${actions.out.map(([k]) => k).join(', ')}>", "hours": <number, only for time_off>, "chat": "<@chatN, only for transfer>", "tone": <integer -2..2: how the agent's latest messages came across to you, -2 rude, 0 neutral, 2 especially kind or pleasant>}`;

const when = (t) => new Date(t).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

function historyMessages() {
  const msgs = [];
  for (const m of chat().messages.filter((x) => x.from !== 'sys').slice(-20)) {
    const role = m.from === 'me' ? 'user' : 'assistant';
    const text = m.from === 'them' ? JSON.stringify({ reply: m.text }) : `[${when(m.t)}] ${m.text}`;
    if (msgs.length && msgs[msgs.length - 1].role === role) msgs[msgs.length - 1].content += '\n\n' + text;
    else msgs.push({ role, content: text });
  }
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
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
    if (live) { c.typing = true; touchChat(c); }
    const actions = allowedActions(t);
    const msgs = historyMessages();
    if (!msgs.length) return;
    const raw = await withRetry(() => llmCall({ role: 'boss', category: 'boss', system: SYSTEM(actions, contextText(t)), messages: msgs, maxTokens: 400, temperature: 0.6 }), 3, 1500);
    const j = parseJSON(raw);
    const reply = String(j.reply || 'Noted.').trim();
    await typeOut(c, reply, live);
    const at = live ? clock.now() : t + 20000;
    c.typing = false;
    addMessage(c, { from: 'them', text: reply, t: at });
    const tone = Math.max(-2, Math.min(2, Math.round(Number(j.tone) || 0)));
    if (tone) bump(tone * 1.5);
    const allowed = new Set(actions.out.map(([k]) => k));
    if (j.action && j.action !== 'none' && allowed.has(j.action)) apply(j, at);
  } catch (e) {
    c.typing = false;
    sysMessage(c, '⚠ Diane couldn\'t reply: ' + e.message, { kind: 'error', retry: 'boss' });
  } finally {
    busy = false;
    c.typing = false;
    touchChat(c);
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
      transferChat(target);
      world.countTransfer();
      bump(-1);
      sysMessage(c, `↪ ${handle(target)} (${target.customer.name}) was handed to a colleague. No pay or rating for that one.`, { t });
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
  promotion: (e) => `The agent was just promoted${e.detail ? ' to ' + e.detail : ''}. Congratulate them, in your own way.`,
  highStreak: () => 'The agent has had a run of excellent chats lately. Tell them, briefly.',
  lowStreak: () => 'The agent\'s last few chats went badly (low ratings). Check in supportively; you might suggest the mentor, the 📖 Concept button, or a lighter day.',
  firstVip: () => 'The agent just handled their first VIP client. A short remark about VIPs (they pay well and notice everything).',
  missedMany: () => 'Several customers gave up today before the agent ever replied. Raise it, matching your relationship; offer a lighter day if they seem swamped.',
  backlog: (e) => `Several customers have been waiting over 12 hours (${e.detail}). Ask the agent to get to them; offer to lighten the load or move one to a colleague.`,
  casual: () => 'No particular reason: you are just dropping a casual message, like a manager who gets on well with them. How their day or week is going, plans for the weekend, a remark about the office, coffee or Ledger. Keep it light and short. Do not assign work.',
  checkin: () => 'A brief, friendly work check-in: how are things going, do they need anything. Short.',
  concern: () => 'A short, professional check-in about how things are going, based on the numbers above. Offer help (mentor, lighter day). Not harsh.',
};

const PING_SYSTEM = (reason, ctx) => `${PERSONA}

YOUR RELATIONSHIP WITH THE AGENT: ${relationship()}

SITUATION (live)
${ctx}${actionLog()}

You are writing UNPROMPTED: the agent has not just messaged you. Why you're writing: ${reason}
Don't repeat what you said in your recent messages. 1-3 short sentences.

OUTPUT: only a JSON object: {"reply": "<your message>"}`;

function pingMessages() {
  const msgs = historyMessages();
  const note = '(no new message from the agent: write your unprompted message now)';
  if (msgs.length && msgs[msgs.length - 1].role === 'user') msgs[msgs.length - 1].content += '\n\n' + note;
  else msgs.push({ role: 'user', content: note });
  return msgs;
}

async function ping(kind, T, ev = {}, fallback = null) {
  const c = chat();
  const b = bossState();
  busy = true;
  const live = clock.now() - T < 120000;
  try {
    let text;
    try {
      const raw = await withRetry(() => llmCall({ role: 'boss', category: 'boss', system: PING_SYSTEM(REASONS[kind](ev), contextText(T)), messages: pingMessages(), maxTokens: 300, temperature: 0.8 }), 2, 1500);
      text = String(parseJSON(raw).reply || '').trim();
    } catch (e) {
      text = fallback;
    }
    if (!text) return;
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

function scheduleCasual(from) {
  const b = bossState();
  const [a, z] = cfg().boss.ping.everyHours;
  b.nextPingAt = from + rand(a, z) * 3600000 * (1.6 - b.rapport / 100);
}

function casualKind() {
  const r = bossState().rapport;
  const { n, avg } = recentAvg();
  if (r >= 65) return Math.random() < 0.7 ? 'casual' : 'checkin';
  if (r >= 40) return Math.random() < 0.5 ? 'checkin' : null;
  return (n && avg < 70) || (S.profile.stats.missed || 0) > 0 ? 'concern' : 'checkin';
}

// Returns true if a message is being sent.
function proactive(now) {
  const c = chat();
  const b = bossState();
  if (world.vacation() || c.replyAt) return false;
  const recent = c.messages.length ? c.messages[c.messages.length - 1].t : 0;
  // things that happened
  b.events = b.events.filter((e) => now - e.at < 86400000);
  for (const e of b.events) {
    const T = officeTime(e.at);
    if (T > now) { e.at = T; continue; }
    b.events = b.events.filter((x) => x !== e);
    ping(e.kind, Math.max(T, recent + 60000), e);
    return true;
  }
  // a backlog of customers waiting over 12 hours
  const B = cfg().boss;
  const od = overdue(now);
  if (inOffice(now) && od.length >= B.overdueNagCount && now - (S.profile.lastBossNag || 0) >= B.overdueNagEveryMs) {
    S.profile.lastBossNag = now;
    bump(-2);
    const list = od.slice(0, 5).map(handle).join(', ') + (od.length > 5 ? ', …' : '');
    ping('backlog', now, { detail: list }, `${S.profile.name}, I'm seeing ${plural(od.length, 'customer')} who've been waiting over 12 hours (${list}). Can you get to them today? If you're swamped, tell me and I'll lighten your load or move one to a colleague.`);
    return true;
  }
  // just checking in
  if (b.nextPingAt == null) { scheduleCasual(now); return false; }
  if (now < b.nextPingAt) return false;
  const T = officeTime(b.nextPingAt);
  if (T > now) { b.nextPingAt = T; return false; }
  if (now - T > 12 * 3600000 || now - recent < 4 * 3600000) { scheduleCasual(now); return false; }
  scheduleCasual(T);
  const kind = casualKind();
  if (kind) { ping(kind, T); return true; }
  return false;
}

// ---------- the clock ----------
export function tick(now = clock.now()) {
  const c = chat();
  if (!c || busy) return;
  if (c.replyAt && now >= c.replyAt) {
    const t = c.replyAt;
    c.replyAt = null;
    respond(Math.max(t, now - 6 * 3600000));
    return;
  }
  proactive(now);
}

// The system prompt Diane would get right now (for debugging in DevTools and for tests).
export function promptPreview(t = clock.now()) { return SYSTEM(allowedActions(t), contextText(t)); }
