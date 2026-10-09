// Chooses the next question for a customer, following the book's order within the player's rank.
import { S, cfg, pick, rand } from '../core/state.js';
import { instantiate } from './template.js';
import * as clock from './clock.js';

const FALLBACK = {
  id: 'fallback', rank: 1, chapter: 2, topic: 'Percentages', kind: 'calc',
  text: 'Hi, a price went up 25% and then down 20%. Am I back where I started?',
  solution: 'Yes: 1.25 × 0.80 = 1.00, so the price ends where it started. The changes cancel because the multipliers multiply to one, not because 25 and 20 are equal.',
};

function poolFor(rank) {
  return S.data.questions.filter((q) => q.rank === rank);
}

// ---------- second chances ----------
// A question you scored badly on (or never answered) comes back a few days later from a
// different customer, with fresh numbers if it's templated. profile.retry = [{ qid, due, ... }]
export function noteResult(chat, score, at) {
  const SC = cfg().secondChance;
  const p = S.profile;
  p.retry ||= [];
  const qid = chat.question.id;
  const prev = chat.question.retryOf;
  p.retry = p.retry.filter((r) => r.qid !== qid);
  if (score != null && score >= SC.belowScore) return;
  const attempts = (prev?.attempts || 0) + 1;
  if (attempts > SC.maxAttempts) return;
  const [a, b] = SC.afterDays;
  p.retry.push({ qid, due: at + rand(a, b) * 86400000, lastScore: score, lastAt: at, lastChat: chat.seq, personaId: chat.customer.personaId, attempts });
}

function dueRetry(rank) {
  const p = S.profile;
  const now = clock.now();
  const due = (p.retry || []).filter((r) => r.due <= now).sort((a, b) => a.due - b.due);
  for (const r of due) {
    const q = S.data.questions.find((x) => x.id === r.qid);
    if (q && q.rank <= rank) return { r, q };
    if (!q) p.retry = p.retry.filter((x) => x !== r);
  }
  return null;
}

export function pickQuestion(rank, vip) {
  const C = cfg();
  const p = S.profile;
  const d = dueRetry(rank);
  if (d && Math.random() < C.secondChance.chance) {
    p.retry = p.retry.filter((x) => x !== d.r);
    const q = instantiate(d.q);
    q.retryOf = { lastScore: d.r.lastScore, lastAt: d.r.lastAt, lastChat: d.r.lastChat, personaId: d.r.personaId, attempts: d.r.attempts };
    return q;
  }
  let r = rank;
  // fall back to the highest rank that actually has questions
  while (r > 1 && !poolFor(r).length) r--;
  let pool = poolFor(r);
  if (!pool.length) return instantiate(FALLBACK);

  // occasional review question from an earlier rank
  let reviewRank = null;
  if (!vip && r > 1 && Math.random() < C.reviewChance) {
    reviewRank = 1 + Math.floor(Math.random() * (r - 1));
    const rp = poolFor(reviewRank);
    if (rp.length) return instantiate(pick(rp));
  }

  p.seenQuestions ||= {};
  let seen = new Set(p.seenQuestions[r] || []);
  let unseen = pool.filter((q) => !seen.has(q.id));
  if (!unseen.length) {
    p.seenQuestions[r] = [];
    seen = new Set();
    unseen = pool;
  }
  if (vip) {
    const hard = unseen.filter((q) => (q.difficulty || 1) >= 2);
    if (hard.length) unseen = hard;
  }
  // stay close to the book's order: choose among the next few unseen questions
  const q = pick(unseen.slice(0, C.orderWindow || 6));
  p.seenQuestions[r] = [...seen, q.id];
  return instantiate(q);
}
