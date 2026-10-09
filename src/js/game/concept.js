// "📖 Concept" explainer for a customer's question: a short beginner lesson that
// teaches the idea without solving the customer's exact numbers. Cached per chat.
import { touchChat } from '../core/state.js';
import { llmCall } from './llm.js';

const SYSTEM = `You are a patient tutor inside a training game. A support agent with NO prior knowledge needs to understand the concept behind a customer's question so they can answer it themselves.

Write a short lesson (at most ~220 words) in markdown for a chat window:
**The idea** — what it means, in plain words (1-3 sentences).
**How to work it out** — the formula or step-by-step method, with each symbol explained. Maths in plain text/Unicode (no LaTeX).
**Mini example** — a tiny worked example using DIFFERENT numbers from the customer's question.
**Watch out** — one common mistake.

Do NOT solve the customer's actual question or use its numbers. If a picture really helps you may add one chart block:
\`\`\`chart
{"type":"line","title":"...","labels":[...],"datasets":[{"label":"...","data":[...]}]}
\`\`\`
(or {"type":"function","xMin":0,"xMax":10,"functions":[{"label":"...","expr":"..."}]}). Valid JSON only.`;

const pending = new Map();

export function getConcept(chat) {
  if (chat.concept) return Promise.resolve(chat.concept);
  if (pending.has(chat.id)) return pending.get(chat.id);
  const q = chat.question;
  const p = llmCall({
    role: 'smart',
    category: 'concept',
    system: SYSTEM,
    messages: [{ role: 'user', content: `Topic: ${q.topic}\n\nThe customer's question (do not solve it):\n${q.text}\n\nAnswer key, for your accuracy only (do not reveal it):\n${q.solution}` }],
    maxTokens: 900,
    temperature: 0.4,
    chatId: chat.id,
  }).then((text) => {
    chat.concept = text.trim();
    touchChat(chat);
    return chat.concept;
  }).finally(() => pending.delete(chat.id));
  pending.set(chat.id, p);
  return p;
}
