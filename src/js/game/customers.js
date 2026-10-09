// Customers: who arrives, when they read your messages, and their (Haiku-written) replies.
// Everything is timestamped in real time, so the same code runs live and when the world is
// caught up after the app was closed (world.js). Per chat, `cs` holds the pending events:
//   readAt   — when the customer will next read your unread messages
//   nudgeAt  — when they'll chase you if you still haven't replied
//   leaveAt  — when they'll give up after chasing you
// Rush customers (mode 'live', from your boss) stay online and expect replies in minutes.
import { S, cfg, rand, randInt, pick, clamp, touchChat, touchProfile } from '../core/state.js';
import { ui } from '../ui/registry.js';
import * as clock from './clock.js';
import * as presence from './presence.js';
import { newChat, addMessage, sysMessage, activeCustomerChats, removeChat } from './chats.js';
import { pickQuestion } from './questions.js';
import { pickPersona, colorFor } from './personas.js';
import { llmCall, parseJSON, withRetry } from './llm.js';
import { finishConversation, gradeAndPay } from './results.js';
import * as shop from './shop.js';

const inflight = new Set(); // chats whose events are being processed (LLM call running)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LIVE_WINDOW = 120000; // an event this close to "now" is shown live (typing indicator etc.)

export function openCount() { return activeCustomerChats().length; }

function transform(persona, text) {
  if (persona.transform === 'upper') return text.toUpperCase();
  if (persona.transform === 'lower') return text.toLowerCase();
  return text;
}

export function personaOf(chat) {
  return S.data.personalities.find((p) => p.id === chat.customer.personaId) || { ...chat.customer, nudges: [], leaves: [] };
}

function liveReadDelay(chat) {
  const C = cfg().customer;
  const [a, b] = C.readDelayMs[chat.customer.read] || C.readDelayMs.normal;
  return Math.max(1000, rand(a, b) * shop.effectProduct('readMult'));
}

export function isOnline(chat, t = clock.now()) {
  return chat.kind === 'customer' && chat.status === 'active' && (chat.cs.onlineUntil || 0) > t;
}

// engaged = they just wrote or read something in this chat (they tend to stay a little longer)
function comeOnline(chat, t, engaged = true) {
  const cs = chat.cs;
  const len = cs.mode === 'live' ? 6 * 3600000 : presence.sessionLength(personaOf(chat), t, engaged);
  cs.onlineUntil = Math.max(cs.onlineUntil || 0, t + len);
  cs.lastSeen = Math.max(cs.lastSeen || 0, t);
}

export function lastSeen(chat) {
  const cs = chat.cs;
  return Math.min(Math.max(cs.lastSeen || 0, cs.onlineUntil || 0), clock.now());
}

// While they wait on you, customers still open the messenger now and then (you see them online),
// with nothing new to read from you.
export function ambientPresence(dt, now = clock.now()) {
  for (const chat of activeCustomerChats()) {
    const cs = chat.cs;
    if (cs.mode === 'live' || cs.readAt != null || cs.typing || cs.thinking || inflight.has(chat.id) || isOnline(chat, now)) continue;
    const r = presence.checkRate(personaOf(chat), now);
    if (r > 0 && Math.random() < 1 - Math.exp(-r * dt / 3600000)) { comeOnline(chat, now, false); touchChat(chat); }
  }
}

// After the app was closed: when did each waiting customer last pop online?
export function backfillPresence(since, now = clock.now()) {
  for (const chat of activeCustomerChats()) {
    const cs = chat.cs;
    if (cs.mode === 'live') continue;
    const from = Math.max(since, cs.lastSeen || 0, chat.createdAt);
    const t = presence.lastCheckBefore(personaOf(chat), from, now);
    if (t != null) comeOnline(chat, t, false);
  }
}

function patienceMs(chat) {
  const W = cfg().world;
  const c = chat.customer;
  return W.nudgeAfterMs * (W.patienceMult[c.patience] || 1) * (c.vip ? W.vipPatienceMult : 1) * rand(0.85, 1.15) + shop.effectSum('patienceMs');
}

// The customer has just written at time t and now waits for the agent.
function setWaiting(chat, t) {
  const cs = chat.cs;
  cs.waitingSince = t;
  cs.nudged = false;
  cs.leaveAt = null;
  if (cs.mode === 'live') {
    const [a, b] = cfg().rush.nudgeAfterMs;
    cs.nudgeAt = t + rand(a, b);
  } else {
    cs.nudgeAt = presence.nextCheck(personaOf(chat), t + patienceMs(chat));
  }
}

// When will the customer read what the agent just sent (at `from`)?
function scheduleRead(chat, from) {
  if (chat.cs.mode === 'live' || isOnline(chat, from)) return from + liveReadDelay(chat);
  const next = presence.nextCheck(personaOf(chat), from);
  return from + Math.max(60000, (next - from) * shop.effectProduct('readMult'));
}

// While the app is open, pending reads arrive `onlineSpeedup` times faster.
export function speedUpReads(dt) {
  const extra = dt * (cfg().world.onlineSpeedup - 1);
  if (extra <= 0) return;
  const t = clock.now();
  for (const chat of activeCustomerChats()) {
    const cs = chat.cs;
    if (cs.readAt != null && cs.readAt > t && !inflight.has(chat.id)) cs.readAt = Math.max(t, cs.readAt - extra);
  }
}

// ---------- arrival ----------
export function spawnCustomer(opts = {}) {
  const p = S.profile;
  const C = cfg().customer;
  const at = opts.at ?? clock.now();
  const rush = !!opts.rush;
  let vip = opts.vip ?? Math.random() < cfg().vipChance + shop.effectSum('vipChance');
  if (p.vipNext) { vip = true; p.vipNext = false; }
  const persona = pickPersona(vip, rush ? null : at);
  const question = pickQuestion(p.rank, vip);
  p.counters.chatSeq += 1;
  const chat = newChat('customer', {
    seq: p.counters.chatSeq,
    rankAtStart: p.rank,
    createdAt: at,
    lastAt: at,
    rush,
    customer: {
      personaId: persona.id,
      name: persona.name,
      bio: persona.bio,
      style: persona.style,
      vip: !!persona.vip,
      read: persona.read || 'normal',
      patience: persona.patience || 'normal',
      curiosity: persona.curiosity ?? 1,
      transform: persona.transform || null,
      color: colorFor(persona.id),
      emoji: persona.emoji || null,
    },
    question,
    cs: {
      mode: rush ? 'live' : 'async',
      turns: 0,
      followUps: 0,
      pushbacks: 0,
      anger: 0,
      vipGrace: persona.vip ? randInt(C.meter.vipGrace[0], C.meter.vipGrace[1]) : null,
      hintsGiven: 0,
      mood: 0,
      maxTurns: C.maxTurns[persona.patience] || C.maxTurns.normal,
      waitingSince: null,
      nudgeAt: null,
      leaveAt: null,
      nudged: false,
      nudges: 0,
      readAt: null,
      onlineUntil: 0,
      lastSeen: at,
      typing: false,
      thinking: false,
      lastCustomerAt: null,
      awaitingReply: false,
      latencies: [],
      openingPending: false,
    },
    emojiPacksUsed: [],
  });
  comeOnline(chat, at);
  touchProfile();
  const greeting = transform(persona, pick(persona.greetings || ['Hi!']));
  addMessage(chat, { from: 'them', text: greeting, t: at });
  if (at >= clock.now() - 10000) {
    // happening right now: greeting, typing…, then the question
    chat.cs.openingPending = true;
    chat.cs.typing = true;
    touchChat(chat);
    setTimeout(() => postOpeningQuestion(chat), rand(1500, 4000));
  } else {
    postOpeningQuestion(chat, at + rand(15000, 60000));
  }
  return chat;
}

function postOpeningQuestion(chat, t = clock.now()) {
  if (chat.deleted || chat.status !== 'active') return;
  const cs = chat.cs;
  cs.openingPending = false;
  cs.typing = false;
  addMessage(chat, { from: 'them', text: transform(personaOf(chat), chat.question.text), t });
  cs.lastCustomerAt = t;
  cs.awaitingReply = true;
  if (cs.readAt == null) setWaiting(chat, t);
  touchChat(chat);
}

// ---------- the player writes ----------
export function onPlayerMessage(chat, text) {
  if (chat.status !== 'active') {
    // the customer is gone; messages are stored but never read
    addMessage(chat, { from: 'me', text, after: true, read: false });
    return;
  }
  const cs = chat.cs;
  const t = clock.now();
  addMessage(chat, { from: 'me', text, read: false, t });
  if (cs.awaitingReply && cs.lastCustomerAt != null) {
    cs.latencies.push(t - cs.lastCustomerAt);
    cs.awaitingReply = false;
  }
  cs.waitingSince = null;
  cs.nudgeAt = null;
  cs.leaveAt = null;
  cs.nudged = false;
  chat.emojiPacksUsed = [...new Set([...(chat.emojiPacksUsed || []), ...shop.packsUsedIn(text)])];
  if (cs.readAt == null && !cs.typing && !cs.thinking && !cs.openingPending) cs.readAt = scheduleRead(chat, t);
  touchChat(chat);
}

// ---------- events: read, nudge, leave ----------
function nextEvent(chat) {
  const cs = chat.cs;
  const ev = [];
  if (cs.readAt != null) ev.push(['read', cs.readAt]);
  if (cs.waitingSince != null && !cs.nudged && cs.nudgeAt != null) ev.push(['nudge', cs.nudgeAt]);
  if (cs.waitingSince != null && cs.nudged && cs.leaveAt != null) ev.push(['leave', cs.leaveAt]);
  ev.sort((a, b) => a[1] - b[1]);
  return ev[0] || null;
}

// Synchronous part of catch-up: chasing and giving up (no LLM needed) up to time `upTo`.
export function advanceTimers(chat, upTo) {
  if (inflight.has(chat.id)) return;
  for (let guard = 0; guard < 5 && chat.status === 'active'; guard++) {
    const e = nextEvent(chat);
    if (!e || e[0] === 'read' || e[1] > upTo) return;
    if (e[0] === 'nudge') nudge(chat, e[1]);
    else customerLeaves(chat, e[1]);
  }
}

export async function advanceChat(chat, now = clock.now()) {
  if (inflight.has(chat.id) || chat.cs.openingPending) return;
  inflight.add(chat.id);
  try {
    for (let guard = 0; guard < 25 && chat.status === 'active' && !chat.deleted; guard++) {
      const e = nextEvent(chat);
      if (!e || e[1] > now) break;
      if (e[0] === 'read') {
        if (!(await customerReads(chat, e[1]))) break;
        now = Math.max(now, clock.now());
      } else if (e[0] === 'nudge') {
        nudge(chat, e[1]);
      } else {
        customerLeaves(chat, e[1]);
      }
    }
  } finally {
    inflight.delete(chat.id);
    touchChat(chat);
  }
}

function nudge(chat, t) {
  const persona = personaOf(chat);
  const cs = chat.cs;
  cs.nudged = true;
  cs.nudges = (cs.nudges || 0) + 1;
  comeOnline(chat, t);
  addMessage(chat, { from: 'them', text: transform(persona, pick(persona.nudges?.length ? persona.nudges : ['Hello? Are you still there?'])), kind: 'nudge', t });
  if (cs.mode === 'live') {
    cs.leaveAt = t + cfg().rush.leaveAfterNudgeMs;
  } else {
    const [a, b] = cfg().world.giveUpAfterNudgeMs;
    const W = cfg().world;
    const mult = (W.patienceMult[chat.customer.patience] || 1) * (chat.customer.vip ? W.vipPatienceMult : 1);
    cs.leaveAt = presence.nextCheck(persona, t + rand(a, b) * mult);
  }
}

function customerLeaves(chat, t) {
  const persona = personaOf(chat);
  comeOnline(chat, t);
  addMessage(chat, { from: 'them', text: transform(persona, pick(persona.leaves?.length ? persona.leaves : ['Forget it, I\'ll ask someone else.'])), t });
  finishConversation(chat, 'timeout', t);
}

// How long the customer spends reading and thinking about `msgs` before they start typing:
// longer, number-heavy answers take longer; slow readers take longer still.
export function thinkMs(chat, msgs) {
  const T = cfg().customer.think;
  const text = msgs.map((m) => m.text || '').join(' ');
  const words = (text.match(/\S+/g) || []).length;
  const numbers = Math.min(T.maxNumbers, (text.match(/\d[\d,.]*%?/g) || []).length);
  const ms = rand(T.baseMs[0], T.baseMs[1]) + words * T.perWordMs + numbers * T.perNumberMs;
  return clamp(ms * (T.readSpeed[chat.customer.read] || 1) * rand(0.85, 1.2), T.minMs, T.maxMs);
}

function markRead(chat, at) {
  const fresh = chat.messages.filter((m) => m.from === 'me' && !m.read && !m.after);
  for (const m of fresh) { m.read = true; m.readAt = at; }
  return fresh;
}

// The customer reads the agent's messages at time `at`, thinks, types and answers.
// Returns false to stop processing. If the moment is (nearly) now, it plays out live:
// ✓✓ read, a pause to think (more of your messages are read and taken into account),
// then "typing…", then the reply.
async function customerReads(chat, at) {
  const cs = chat.cs;
  const C = cfg().customer;
  cs.readAt = null;
  const read = markRead(chat, at);
  comeOnline(chat, at);
  let thinkEnd = at + thinkMs(chat, read.length ? read : chat.messages.filter((m) => m.from === 'me').slice(-1));
  const gone = () => chat.status !== 'active' || chat.deleted;
  let call = withRetry(() => customerReply(chat), 3, 1500);
  call.catch(() => {});
  let out;
  try {
    if (thinkEnd > clock.now() - 2000) {
      // live: think in real time, picking up anything else the agent sends meanwhile
      cs.thinking = true;
      touchChat(chat);
      while (clock.now() < thinkEnd) {
        await sleep(Math.min(1000, Math.max(50, thinkEnd - clock.now())));
        if (gone()) return false;
        const more = markRead(chat, clock.now());
        if (more.length) {
          thinkEnd = Math.max(thinkEnd, clock.now() + thinkMs(chat, more) * 0.6);
          call = withRetry(() => customerReply(chat), 3, 1500);
          call.catch(() => {});
          touchChat(chat);
        }
      }
      cs.thinking = false;
      cs.typing = true;
      touchChat(chat);
      const started = performance.now();
      out = await call;
      if (gone()) return false;
      const typingMs = clamp(out.reply.length * C.typingMsPerChar, C.typingMinMs, C.typingMaxMs);
      const remaining = typingMs - (performance.now() - started);
      if (remaining > 0) await sleep(remaining);
      if (gone()) return false;
      out.t = clock.now();
    } else {
      out = await call;
      if (gone()) return false;
      out.t = thinkEnd + clamp(out.reply.length * C.typingMsPerChar, C.typingMinMs, C.typingMaxMs);
      if (out.t > clock.now()) out.t = clock.now();
    }
  } catch (e) {
    cs.typing = false;
    cs.thinking = false;
    if (!gone()) sysMessage(chat, '⚠ Couldn\'t get the customer\'s reply: ' + e.message, { kind: 'error', retry: 'customer' });
    return false;
  }
  const t = out.t;
  cs.typing = false;
  cs.thinking = false;
  cs.turns += 1;
  cs.mood = out.mood;
  if (out.followUp) cs.followUps += 1;
  if (out.pushback) cs.pushbacks = (cs.pushbacks || 0) + 1;
  raiseAnger(chat, out);
  addMessage(chat, { from: 'them', text: transform(personaOf(chat), out.reply), t });
  comeOnline(chat, t);
  cs.lastCustomerAt = t;
  cs.awaitingReply = true;
  if (out.status === 'satisfied') { finishConversation(chat, 'satisfied', t); return false; }
  if (out.status === 'leaving') { finishConversation(chat, 'left', t); return false; }
  if (out.pushback) ui.maybeMentorHint?.(chat);
  if (cs.turns >= cs.maxTurns || cs.anger >= 100) {
    const persona = personaOf(chat);
    addMessage(chat, { from: 'them', text: transform(persona, pick(persona.leaves?.length ? persona.leaves : ['I have to go. Bye.'])), t: t + 5000 });
    finishConversation(chat, 'left', t + 5000);
    return false;
  }
  if (chat.messages.some((m) => m.from === 'me' && !m.read)) cs.readAt = t + liveReadDelay(chat); // they're in the chat already
  else setWaiting(chat, t);
  return true;
}

// Impatience meter: grows with every reply, faster when the customer has to push back.
function raiseAnger(chat, out) {
  const cs = chat.cs;
  const M = cfg().customer.meter;
  const temper = chat.customer.patience || 'normal';
  let add = M.perReply[temper] ?? M.perReply.normal;
  if (out.pushback) {
    const vipOut = chat.customer.vip && cs.pushbacks > (cs.vipGrace ?? 99);
    add += vipOut ? M.vipPushback : (M.pushback[temper] ?? M.pushback.normal);
  }
  if (out.mood < 0) add += M.negativeMood * -out.mood;
  if (out.status === 'satisfied') add = 0;
  cs.anger = clamp((cs.anger || 0) + add, 0, 100);
}

function toneGuide(chat) {
  const cs = chat.cs;
  const c = chat.customer;
  const a = Math.round(cs.anger || 0);
  const hotHead = c.patience === 'low';
  let tone;
  if (a < 30) tone = 'You are still calm and polite.';
  else if (a < cfg().customer.meter.rudeAt) tone = 'You are getting impatient: shorter, curter messages; let your frustration show a little.';
  else tone = hotHead
    ? 'You are fed up: be openly irritated and a bit rude (snappy, sarcastic, maybe a mild insult — no slurs, no threats). You may leave if the next answer is not right.'
    : 'You are fed up: very short, cold and clearly annoyed (stay civil). You may leave if the next answer is not right.';
  let vip = '';
  if (c.vip) {
    vip = cs.pushbacks >= (cs.vipGrace ?? 99)
      ? '\n- As a VIP you have NO patience left for wrong or vague answers: if the agent gets it wrong again, either reply angrily and demand competence, or simply drop it and leave ("leaving").'
      : '\n- As a VIP you stay composed for now, but you notice every mistake.';
  }
  return `Your impatience level is ${a}/100. ${tone}${vip}`;
}

function buildCustomerPrompt(chat) {
  const c = chat.customer;
  const q = chat.question;
  const cs = chat.cs;
  const turn = cs.turns + 1;
  const last = turn >= cs.maxTurns;
  const system = `You are role-playing a CUSTOMER in a support chat with Whiterock, a financial-services company. The other side is a Whiterock support agent (the human player of a training game).

WHO YOU ARE
Name: ${c.name}
About you: ${c.bio}
How you write: ${c.style}
${c.vip ? 'You are a VIP client: you expect precise, professional, complete answers and you notice sloppiness.\n' : ''}
YOUR QUESTION (you already sent it):
"""${q.text}"""

HIDDEN ANSWER KEY - you do NOT actually know this. Never quote it, never reveal its numbers or wording, never hint at the right answer. Use it only privately to judge whether the agent is right:
"""${q.solution}"""

HOW TO BEHAVE
- Write like a real person in a messaging app: usually 1-3 short sentences, plain text, no markdown, no headings. Stay in character.
- React to what the agent actually wrote, like a normal customer who does NOT know the answer. If their answer is wrong, incomplete or you could not follow it, don't accept it — but keep it vague and natural: "hmm, that doesn't sound right", "I don't get the Ben part", "that's not what I asked". Do NOT list which parts they got right, do NOT spell out exactly what is missing or what value you need, and do NOT tell them to "recheck" or "double-check" their work. Never give away or hint at the answer.
- Small rounding differences or a different but valid method are fine.
- If the agent asks you something, answer sensibly (you may invent harmless personal details, but do not change the numbers in your question).
- Once everything is answered correctly and clearly you may ask up to ${c.curiosity} short related follow-up question(s) (a "why" or "what if") before being satisfied. Follow-ups asked so far: ${cs.followUps}. Judge the follow-up answers the same way.
- If the agent is rude, spams, writes nonsense or ignores you, get annoyed; you may leave.
- ${toneGuide(chat)}
- This is your reply number ${turn} of at most ${cs.maxTurns}.${last || (cs.anger || 0) >= 85 ? ' This is your LAST reply: you must now either be satisfied (only if the agent really got it right) or leave.' : ''}

OUTPUT: reply with ONLY a JSON object, nothing else:
{"reply": "<your chat message>", "status": "continue" | "satisfied" | "leaving", "mood": <integer -2..2>, "followUp": <true if this reply asks a new follow-up question>, "pushback": <true if you are NOT accepting the agent's latest answer because it is wrong, incomplete or unclear>}
"satisfied" = your question is resolved and the reply is a short thanks/goodbye. "leaving" = you give up on this agent and the reply is your parting message. Mood: -2 furious ... 2 delighted.`;

  const lines = [];
  for (const m of chat.messages) {
    if (m.from === 'them') lines.push('YOU: ' + m.text);
    else if (m.from === 'me') lines.push('AGENT: ' + m.text);
  }
  const user = 'The chat so far (oldest first):\n\n' + lines.join('\n\n') + `\n\nWrite your next message as ${c.name}. JSON only.`;
  return { system, user };
}

async function customerReply(chat) {
  const { system, user } = buildCustomerPrompt(chat);
  const text = await llmCall({
    role: 'customer',
    category: 'customer',
    system,
    messages: [{ role: 'user', content: user }],
    maxTokens: 400,
    temperature: 0.8,
    chatId: chat.id,
  });
  const j = parseJSON(text);
  const reply = String(j.reply || '').trim();
  if (!reply) throw new Error('Customer reply was empty');
  const status = ['continue', 'satisfied', 'leaving'].includes(j.status) ? j.status : 'continue';
  return { reply, status, mood: clamp(Math.round(Number(j.mood) || 0), -2, 2), followUp: !!j.followUp, pushback: !!j.pushback && status !== 'satisfied' };
}

export function retryCustomer(chat) {
  chat.messages = chat.messages.filter((m) => !(m.kind === 'error' && m.retry === 'customer'));
  chat.cs.readAt = clock.now();
  touchChat(chat);
}

// ---------- player actions from the context menu ----------
export function closeChat(chat) {
  if (chat.status !== 'active') return false;
  finishConversation(chat, 'closed');
  return true;
}

export function deleteChat(chat) {
  const wasActive = chat.status === 'active';
  removeChat(chat);
  if (wasActive) finishConversation(chat, 'closed');
}

// Your boss takes a chat off your hands: it ends without pay or grading.
export function transferChat(chat) {
  if (chat.status !== 'active') return false;
  const cs = chat.cs;
  chat.status = 'ended';
  chat.endedAt = clock.now();
  chat.endReason = 'transferred';
  cs.typing = false;
  cs.readAt = cs.nudgeAt = cs.leaveAt = cs.waitingSince = null;
  sysMessage(chat, '↪ Transferred to a colleague by your manager — no pay, no rating');
  touchChat(chat);
  return true;
}

// Time off: nothing happens in open chats while you're away, so their clocks move on by `ms`.
export function shiftTimers(ms) {
  for (const chat of activeCustomerChats()) {
    const cs = chat.cs;
    for (const k of ['readAt', 'nudgeAt', 'leaveAt', 'waitingSince', 'lastCustomerAt']) if (cs[k] != null) cs[k] += ms;
    touchChat(chat);
  }
}

// Saves from v0.2 used an "active time" clock; restart their timers on wall time.
export function migrateChat(chat) {
  const cs = chat.cs;
  const t = clock.now();
  if (!cs || cs.mode) return;
  cs.mode = 'async';
  cs.lastSeen = t;
  cs.onlineUntil = 0;
  cs.readAt = cs.pendingReadA != null ? t + 60000 : null;
  cs.lastCustomerAt = cs.lastCustomerA != null ? t : null;
  cs.nudges = cs.nudgedA != null ? 1 : cs.nudges || 0;
  cs.leaveAt = null;
  cs.nudged = false;
  if (cs.waitingSinceA != null) setWaiting(chat, t);
  else { cs.waitingSince = null; cs.nudgeAt = null; }
  for (const k of ['pendingReadA', 'waitingSinceA', 'nudgedA', 'lastCustomerA', 'patienceMs']) delete cs[k];
  delete chat.startedA;
  touchChat(chat);
}

// ---------- after loading a save ----------
export function resumeAfterLoad() {
  for (const chat of S.chats.values()) {
    if (chat.kind !== 'customer') continue;
    if (chat.status === 'active') {
      const cs = chat.cs;
      if (cs.openingPending) postOpeningQuestion(chat);
      if (cs.typing || cs.thinking) { // a reply was being written when the app closed
        cs.typing = false;
        cs.thinking = false;
        if (cs.readAt == null) cs.readAt = clock.now();
      }
      touchChat(chat);
    } else if (chat.status === 'grading') {
      gradeAndPay(chat);
    }
  }
}
