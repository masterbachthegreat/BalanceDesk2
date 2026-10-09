// Customer behaviour: arrival, reading delay, typing, impatience and Haiku-written replies.
import { S, cfg, rand, pick, clamp, touchChat, touchProfile } from '../core/state.js';
import * as clock from './clock.js';
import { newChat, addMessage, sysMessage, activeCustomerChats, removeChat } from './chats.js';
import { pickQuestion } from './questions.js';
import { pickPersona, colorFor } from './personas.js';
import { llmCall, parseJSON, withRetry } from './llm.js';
import { finishConversation, gradeAndPay } from './results.js';
import * as shop from './shop.js';

const inflight = new Set(); // chats with a customer LLM request running
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function maxSlots() { return cfg().maxConcurrentCustomers + shop.effectSum('slots'); }

export function freeSlots() { return maxSlots() - activeCustomerChats().length; }

function transform(persona, text) {
  if (persona.transform === 'upper') return text.toUpperCase();
  if (persona.transform === 'lower') return text.toLowerCase();
  return text;
}

function readDelayMs(chat) {
  const C = cfg().customer;
  const [a, b] = C.readDelayMs[chat.customer.read] || C.readDelayMs.normal;
  return Math.max(1000, rand(a, b) * shop.effectProduct('readMult'));
}

// ---------- arrival ----------
export function spawnCustomer(opts = {}) {
  const p = S.profile;
  const C = cfg().customer;
  let vip = opts.vip ?? Math.random() < cfg().vipChance + shop.effectSum('vipChance');
  if (p.vipNext) { vip = true; p.vipNext = false; }
  const persona = pickPersona(vip);
  const question = pickQuestion(p.rank, vip);
  p.counters.chatSeq += 1;
  const patienceMs = rand(C.patienceMs[0], C.patienceMs[1]) * (C.patienceMult[persona.patience] || 1) + shop.effectSum('patienceMs');
  const chat = newChat('customer', {
    seq: p.counters.chatSeq,
    rankAtStart: p.rank,
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
    startedA: clock.now(),
    cs: {
      turns: 0,
      followUps: 0,
      mood: 0,
      maxTurns: C.maxTurns[persona.patience] || C.maxTurns.normal,
      patienceMs,
      waitingSinceA: null,
      nudgedA: null,
      nudges: 0,
      pendingReadA: null,
      typing: false,
      lastCustomerA: null,
      awaitingReply: false,
      latencies: [],
      openingPending: true,
    },
    emojiPacksUsed: [],
  });
  touchProfile();
  // greeting now, question a moment later (with a typing indicator in between)
  const greeting = pick(persona.greetings || ['Hi!']);
  addMessage(chat, { from: 'them', text: transform(persona, greeting) });
  chat.cs.typing = true;
  touchChat(chat);
  setTimeout(() => postOpeningQuestion(chat), rand(...C.secondMessageDelayMs));
  return chat;
}

function postOpeningQuestion(chat) {
  if (chat.deleted || chat.status !== 'active' || !chat.cs.openingPending) return;
  const persona = personaOf(chat);
  chat.cs.openingPending = false;
  chat.cs.typing = false;
  addMessage(chat, { from: 'them', text: transform(persona, chat.question.text) });
  chat.cs.lastCustomerA = clock.now();
  chat.cs.awaitingReply = true;
  if (chat.cs.pendingReadA == null) chat.cs.waitingSinceA = clock.now();
  touchChat(chat);
}

export function personaOf(chat) {
  return S.data.personalities.find((p) => p.id === chat.customer.personaId) || { ...chat.customer, nudges: [], leaves: [] };
}

// ---------- the player writes ----------
export function onPlayerMessage(chat, text) {
  if (chat.status !== 'active') {
    // the customer is gone; messages are stored but never read
    addMessage(chat, { from: 'me', text, after: true, read: false });
    return;
  }
  const cs = chat.cs;
  addMessage(chat, { from: 'me', text, read: false });
  if (cs.awaitingReply && cs.lastCustomerA != null) {
    cs.latencies.push(clock.now() - cs.lastCustomerA);
    cs.awaitingReply = false;
  }
  cs.waitingSinceA = null;
  cs.nudgedA = null;
  chat.emojiPacksUsed = [...new Set([...(chat.emojiPacksUsed || []), ...shop.packsUsedIn(text)])];
  if (!cs.typing && cs.pendingReadA == null && !inflight.has(chat.id)) cs.pendingReadA = clock.now() + readDelayMs(chat);
  touchChat(chat);
}

// ---------- periodic tick ----------
export function tickCustomers() {
  const C = cfg().customer;
  const t = clock.now();
  for (const chat of activeCustomerChats()) {
    const cs = chat.cs;
    if (cs.pendingReadA != null && t >= cs.pendingReadA && !inflight.has(chat.id)) {
      if (cs.openingPending) cs.pendingReadA = t + 1500;
      else doRead(chat);
    }
    if (cs.waitingSinceA != null && !inflight.has(chat.id)) {
      if (cs.nudgedA == null && t - cs.waitingSinceA >= cs.patienceMs) nudge(chat);
      else if (cs.nudgedA != null && t - cs.nudgedA >= C.leaveAfterNudgeMs) customerLeaves(chat);
    }
  }
}

function nudge(chat) {
  const persona = personaOf(chat);
  chat.cs.nudgedA = clock.now();
  chat.cs.nudges = (chat.cs.nudges || 0) + 1;
  addMessage(chat, { from: 'them', text: transform(persona, pick(persona.nudges?.length ? persona.nudges : ['Hello? Are you still there?'])), kind: 'nudge' });
}

function customerLeaves(chat) {
  const persona = personaOf(chat);
  addMessage(chat, { from: 'them', text: transform(persona, pick(persona.leaves?.length ? persona.leaves : ['Forget it, I\'ll ask someone else.'])) });
  finishConversation(chat, 'timeout');
}

// ---------- the customer reads and answers ----------
async function doRead(chat) {
  const cs = chat.cs;
  const C = cfg().customer;
  cs.pendingReadA = null;
  for (const m of chat.messages) if (m.from === 'me' && !m.read) m.read = true;
  cs.typing = true;
  inflight.add(chat.id);
  touchChat(chat);
  const started = performance.now();
  try {
    const out = await withRetry(() => customerReply(chat), 3, 1500);
    if (chat.status !== 'active' || chat.deleted) return;
    const typingMs = clamp(out.reply.length * C.typingMsPerChar, C.typingMinMs, C.typingMaxMs);
    const remaining = typingMs - (performance.now() - started);
    if (remaining > 0) await sleep(remaining);
    if (chat.status !== 'active' || chat.deleted) return;
    cs.typing = false;
    cs.turns += 1;
    cs.mood = out.mood;
    if (out.followUp) cs.followUps += 1;
    addMessage(chat, { from: 'them', text: transform(personaOf(chat), out.reply) });
    cs.lastCustomerA = clock.now();
    cs.awaitingReply = true;
    if (out.status === 'satisfied') return void finishConversation(chat, 'satisfied');
    if (out.status === 'leaving') return void finishConversation(chat, 'left');
    if (cs.turns >= cs.maxTurns) {
      const persona = personaOf(chat);
      addMessage(chat, { from: 'them', text: transform(persona, pick(persona.leaves?.length ? persona.leaves : ['I have to go. Bye.'])) });
      return void finishConversation(chat, 'left');
    }
    const unread = chat.messages.some((m) => m.from === 'me' && !m.read);
    if (unread) cs.pendingReadA = clock.now() + rand(1000, 4000); // they're in the chat already
    else cs.waitingSinceA = clock.now();
  } catch (e) {
    cs.typing = false;
    if (chat.status === 'active' && !chat.deleted) {
      sysMessage(chat, '⚠ Couldn\'t get the customer\'s reply: ' + e.message, { kind: 'error', retry: 'customer' });
    }
  } finally {
    inflight.delete(chat.id);
    touchChat(chat);
  }
}

export function retryCustomer(chat) {
  chat.messages = chat.messages.filter((m) => !(m.kind === 'error' && m.retry === 'customer'));
  chat.cs.pendingReadA = clock.now();
  touchChat(chat);
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
- React to what the agent actually wrote. If their answer is wrong, contradicts the key, skips part of your question, or you could not follow it, do not accept it: say what confuses you, push back, or ask them to double-check - without giving away the answer.
- Small rounding differences or a different but valid method are fine.
- If the agent asks you something, answer sensibly (you may invent harmless personal details, but do not change the numbers in your question).
- Once everything is answered correctly and clearly you may ask up to ${c.curiosity} short related follow-up question(s) (a "why" or "what if") before being satisfied. Follow-ups asked so far: ${cs.followUps}. Judge the follow-up answers the same way.
- If the agent is rude, spams, writes nonsense or ignores you, get annoyed; you may leave.
- This is your reply number ${turn} of at most ${cs.maxTurns}.${last ? ' This is your LAST reply: you must now either be satisfied (only if the agent really got it right) or leave.' : ''}

OUTPUT: reply with ONLY a JSON object, nothing else:
{"reply": "<your chat message>", "status": "continue" | "satisfied" | "leaving", "mood": <integer -2..2>, "followUp": <true if this reply asks a new follow-up question>}
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
  return { reply, status, mood: clamp(Math.round(Number(j.mood) || 0), -2, 2), followUp: !!j.followUp };
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

// ---------- after loading a save ----------
export function resumeAfterLoad() {
  for (const chat of S.chats.values()) {
    if (chat.kind !== 'customer') continue;
    if (chat.status === 'active') {
      const cs = chat.cs;
      if (cs.openingPending) postOpeningQuestion(chat);
      if (cs.typing) { // a reply was being written when the app closed
        cs.typing = false;
        cs.pendingReadA = clock.now() + 1500;
      }
      if (chat.messages.some((m) => m.from === 'me' && !m.read) && cs.pendingReadA == null) cs.pendingReadA = clock.now() + readDelayMs(chat);
      touchChat(chat);
    } else if (chat.status === 'grading') {
      gradeAndPay(chat);
    }
  }
}
