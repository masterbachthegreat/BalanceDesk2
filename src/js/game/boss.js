// Your manager, Diane Whitfield (Head of Client Services). You can message her; she replies
// during office hours (your local time) and can change things: a rush shift, a lighter or
// heavier day, time off, taking a chat off your hands, or a raise. The LLM only picks from
// the actions this code says are allowed right now; the code applies them.
import { S, cfg, rand, touchChat, touchProfile } from '../core/state.js';
import { waitWords, num, plural } from '../core/format.js';
import { addMessage, getChat, sysMessage, findChatByHandle, activeCustomerChats, handle } from './chats.js';
import * as clock from './clock.js';
import * as world from './world.js';
import { transferChat, openCount } from './customers.js';
import { llmCall, parseJSON, withRetry } from './llm.js';
import { rankInfo } from './progress.js';
import { emit } from '../core/bus.js';

export const BOSS = { name: 'Diane Whitfield', role: 'Head of Client Services' };

function chat() { return getChat('boss'); }

function inOffice(t) {
  const h = new Date(t).getHours();
  const [a, b] = cfg().boss.workHours;
  return h >= a && h < b;
}

// When Diane will get to a message sent at t.
function replyTime(t) {
  const [a, b] = cfg().boss.replyDelayMs;
  const at = t + rand(a, b);
  if (inOffice(at)) return at;
  const d = new Date(at);
  if (d.getHours() >= cfg().boss.workHours[1]) d.setDate(d.getDate() + 1);
  d.setHours(cfg().boss.workHours[0], 0, 0, 0);
  return d.getTime() + rand(5, 40) * 60000;
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
    w.load && t < w.load.until ? `Today is set to a ${w.load.label} day.` : '',
    vac ? `The agent is on time off until ${new Date(vac.end).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}.` : '',
  ].filter(Boolean).join('\n');
}

const SYSTEM = (actions, ctx) => `You are Diane Whitfield, Head of Client Services at Whiterock, a financial-services firm. You manage the support agent you're chatting with (the player of a training game). You're experienced, fair, warm but busy and businesslike; dry humour now and then. You care about customers being answered well and on time, and about your people not burning out.

Write like a manager on a work messenger: 1-4 short sentences, plain text, no headings. Never invent facts about the agent beyond what's below. Don't promise anything you can't do with the actions below.

SITUATION
${ctx}

ACTIONS YOU CAN TAKE NOW (pick at most one, only if the agent asked for it or it clearly fits):
${actions.out.map(([k, v]) => `- "${k}": ${v}`).join('\n')}
${actions.no.length ? `\nNOT POSSIBLE RIGHT NOW (explain kindly if asked):\n${actions.no.map((x) => '- ' + x).join('\n')}` : ''}

Use judgement like a real manager: e.g. you may refuse a heavier day or a rush if the agent has customers waiting over 12 hours, or ask them to clear the backlog before time off, or grant it anyway if they seem overwhelmed. A raise is only possible when listed above.

OUTPUT: only a JSON object:
{"reply": "<your message>", "action": "<one of: ${actions.out.map(([k]) => k).join(', ')}>", "hours": <number, only for time_off>, "chat": "<@chatN, only for transfer>"}`;

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
    const msgs = [];
    for (const m of c.messages.filter((x) => x.from !== 'sys').slice(-20)) {
      const role = m.from === 'me' ? 'user' : 'assistant';
      const text = m.from === 'them' ? JSON.stringify({ reply: m.text }) : m.text;
      if (msgs.length && msgs[msgs.length - 1].role === role) msgs[msgs.length - 1].content += '\n\n' + text;
      else msgs.push({ role, content: text });
    }
    while (msgs.length && msgs[0].role !== 'user') msgs.shift();
    if (!msgs.length) return;
    const raw = await withRetry(() => llmCall({ role: 'smart', category: 'boss', system: SYSTEM(actions, contextText(t)), messages: msgs, maxTokens: 400, temperature: 0.6 }), 3, 1500);
    const j = parseJSON(raw);
    const at = live ? clock.now() : t + 20000;
    c.typing = false;
    addMessage(c, { from: 'them', text: String(j.reply || 'Noted.').trim(), t: at });
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

// ---------- the clock ----------
export function tick(now = clock.now()) {
  const c = chat();
  if (!c) return;
  if (c.replyAt && now >= c.replyAt && !busy) {
    const t = c.replyAt;
    c.replyAt = null;
    respond(Math.max(t, now - 6 * 3600000));
  }
  nag(now);
}

// Unprompted: Diane notices a backlog of customers who've waited over 12 hours.
function nag(now) {
  const B = cfg().boss;
  const p = S.profile;
  if (!inOffice(now) || world.vacation()) return;
  if (now - (p.lastBossNag || 0) < B.overdueNagEveryMs) return;
  const od = overdue(now);
  if (od.length < B.overdueNagCount) return;
  p.lastBossNag = now;
  const list = od.slice(0, 5).map(handle).join(', ');
  addMessage(chat(), { from: 'them', text: `${p.name}, I'm seeing ${plural(od.length, 'customer')} who've been waiting over 12 hours (${list}${od.length > 5 ? ', …' : ''}). Can you get to them today? If you're swamped, tell me and I'll lighten your load or move one to a colleague.`, t: now });
  touchProfile();
}
