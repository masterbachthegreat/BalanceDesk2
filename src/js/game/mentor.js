// The Mentor (Sonnet): answers questions, draws charts, and reads any chat you @mention.
import { S, cfg, touchChat } from '../core/state.js';
import { emit } from '../core/bus.js';
import { addMessage, getChat, findChatByHandle, handle, sysMessage } from './chats.js';
import { fullTranscript } from './transcript.js';
import { llmCall } from './llm.js';
import { rankInfo } from './progress.js';
import { num } from '../core/format.js';

const SYSTEM = `You are the Mentor at Whiterock, a financial-services firm: a senior analyst who coaches a junior support agent. You are warm, direct and precise. You teach economics, finance, accounting, statistics and mathematics, and you help the agent handle customer chats better (accuracy, structure, tone).

FORMAT: this is a chat app. Keep answers focused. Use short paragraphs, **bold**, bullet lists and simple markdown tables. Write maths in plain text or Unicode (PV = C / (1 + r)^n, σ², √, Σ, ≤) - never LaTeX.

GRAPHS: when a picture genuinely helps (curves, distributions, amortisation schedules, cash flows, comparisons, supply and demand...) include one or more chart blocks exactly like this:
\`\`\`chart
{"type": "line", "title": "...", "xLabel": "...", "yLabel": "...", "labels": [...], "datasets": [{"label": "...", "data": [...]}]}
\`\`\`
"type" can be line, bar, scatter, pie, doughnut or function. Scatter data is [{"x": 1, "y": 2}, ...]. Add "stacked": true for stacked bars, "fill": true on a dataset for an area.
For a function plot give formulas in x instead of data:
\`\`\`chart
{"type": "function", "title": "...", "xLabel": "Q", "yLabel": "P", "xMin": 0, "xMax": 50, "functions": [{"label": "Demand", "expr": "100 - 2*x"}], "points": [{"label": "Equilibrium", "x": 25, "y": 50}]}
\`\`\`
Formulas support + - * / ^, sqrt, ln, exp, abs, min, max, ncdf (standard normal CDF), pi and e. Keep data to about 60 points or fewer. The block must be valid JSON. Only draw a chart when it adds something.

CHATS: when the agent mentions a chat such as @chat12, the full transcript of that chat (customer messages, the agent's replies, the answer key and, if finished, the grade) is attached in this system prompt. Refer to specifics from it. If the agent mentions a chat that is not attached, say you can't find it.`;

function mentionsIn(text) {
  return [...String(text).matchAll(/@([A-Za-z][\w-]*)/g)].map((m) => m[1]);
}

function resolveMentions(messages) {
  const lookback = cfg().mentor.mentionLookback;
  const mine = messages.filter((m) => m.from === 'me').slice(-lookback);
  const found = new Map();
  const missing = [];
  for (const m of mine) {
    for (const tok of mentionsIn(m.text)) {
      const chat = findChatByHandle(tok);
      if (chat) found.set(chat.id, chat);
      else missing.push('@' + tok);
    }
  }
  return { chats: [...found.values()], missing };
}

function playerSummary() {
  const p = S.profile;
  const st = p.stats;
  const r = rankInfo(p.rank);
  return `About the agent: name ${p.name}; rank ${p.rank} (${r.title}), currently answering questions on ${r.topics}. Chats completed: ${st.completed}; average AI score ${st.completed ? num(st.scoreSum / st.completed, 1) : 'n/a'}/100; average service ${st.completed ? num(st.starsSum / st.completed, 2) : 'n/a'} stars.`;
}

let busy = false;

export async function sendToMentor(text) {
  const chat = getChat('mentor');
  addMessage(chat, { from: 'me', text, read: false });
  if (busy) return; // the pending request will pick this message up afterwards
  await runMentor(chat);
}

export async function runMentor(chat) {
  busy = true;
  chat.messages = chat.messages.filter((m) => !(m.kind === 'error' && m.retry === 'mentor'));
  try {
    for (;;) {
      const pending = chat.messages.filter((m) => m.from === 'me' && !m.read);
      if (!pending.length) break;
      for (const m of pending) m.read = true;
      chat.typing = true;
      touchChat(chat);

      // messages sent while the previous answer was being written go last, so the request always ends on them
      const pendingIds = new Set(pending.map((m) => m.id));
      const history = [
        ...chat.messages.filter((m) => m.from !== 'sys' && !pendingIds.has(m.id)),
        ...pending,
      ].slice(-cfg().mentor.historyMessages);
      const { chats, missing } = resolveMentions(chat.messages);
      let system = SYSTEM + '\n\n' + playerSummary();
      if (chats.length) system += '\n\nATTACHED CHATS:\n\n' + chats.map(fullTranscript).join('\n\n');
      if (missing.length) system += '\n\n(No chat matched these mentions: ' + [...new Set(missing)].join(', ') + '. Active handles look like @chat12.)';

      // merge consecutive messages of the same role (the API wants alternation)
      const msgs = [];
      for (const m of history) {
        const role = m.from === 'me' ? 'user' : 'assistant';
        if (msgs.length && msgs[msgs.length - 1].role === role) msgs[msgs.length - 1].content += '\n\n' + m.text;
        else msgs.push({ role, content: m.text });
      }
      while (msgs.length && msgs[0].role !== 'user') msgs.shift();

      const reply = await llmCall({
        role: 'smart',
        category: 'mentor',
        system,
        messages: msgs,
        maxTokens: cfg().mentor.maxTokens,
        temperature: 0.5,
      });
      chat.typing = false;
      addMessage(chat, { from: 'them', text: reply.trim() || '…', attached: chats.map(handle) });
    }
  } catch (e) {
    chat.typing = false;
    sysMessage(chat, '⚠ The mentor could not answer: ' + e.message, { kind: 'error', retry: 'mentor' });
    for (const m of chat.messages) if (m.from === 'me') m.read = true;
  } finally {
    busy = false;
    chat.typing = false;
    touchChat(chat);
  }
}

export function retryMentor() {
  const chat = getChat('mentor');
  const lastMine = [...chat.messages].reverse().find((m) => m.from === 'me');
  if (lastMine) lastMine.read = false;
  runMentor(chat);
}

// ---------- unprompted hints when the agent is struggling in a live chat ----------
const HINT_SYSTEM = `You are the Mentor at Whiterock. You are quietly watching a junior support agent's LIVE customer chat, and the customer has pushed back on their answer more than once. Send the agent a short, unprompted private nudge.

Rules: 2-4 sentences, friendly and direct, in a chat-app tone. Name the concept they need and point at what to reconsider (the step or idea they are missing). Do NOT give the final answer or the key numbers — make them think. No headings. Plain text/Unicode maths only.`;

const hinting = new Set();

export async function maybeMentorHint(chat) {
  const M = cfg().mentor;
  const cs = chat.cs;
  if (!M.autoHints || chat.status !== 'active' || hinting.has(chat.id)) return;
  if ((cs.hintsGiven || 0) >= M.maxHintsPerChat) return;
  if ((cs.pushbacks || 0) < M.hintAfterPushbacks * ((cs.hintsGiven || 0) + 1)) return;
  hinting.add(chat.id);
  cs.hintsGiven = (cs.hintsGiven || 0) + 1;
  const mentorChat = getChat('mentor');
  try {
    mentorChat.typing = true;
    touchChat(mentorChat);
    const text = await llmCall({
      role: 'smart',
      category: 'mentor',
      system: HINT_SYSTEM,
      messages: [{ role: 'user', content: fullTranscript(chat) + '\n\nWrite your nudge to the agent now.' }],
      maxTokens: 300,
      temperature: 0.5,
      chatId: chat.id,
    });
    if (chat.status !== 'active') return;
    addMessage(mentorChat, { from: 'them', text: `👀 Saw you're stuck with ${chat.customer.name} (${handle(chat)}). ${text.trim()}`, hint: chat.id });
    emit('mentorHint', chat);
  } catch (e) {
    console.warn('mentor hint failed', e);
  } finally {
    mentorChat.typing = false;
    hinting.delete(chat.id);
    touchChat(mentorChat);
  }
}

export function reviewWithMentor(chat) {
  return sendToMentor(`${handle(chat)} Can you walk me through the correct answer step by step, and show me where I went wrong?`);
}
