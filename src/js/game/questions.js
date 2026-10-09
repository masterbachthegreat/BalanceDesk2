// Chooses the next question for a customer, following the book's order within the player's rank.
import { S, cfg, pick } from '../core/state.js';
import { instantiate } from './template.js';

const FALLBACK = {
  id: 'fallback', rank: 1, chapter: 2, topic: 'Percentages', kind: 'calc',
  text: 'Hi, a price went up 25% and then down 20%. Am I back where I started?',
  solution: 'Yes: 1.25 × 0.80 = 1.00, so the price ends where it started. The changes cancel because the multipliers multiply to one, not because 25 and 20 are equal.',
};

function poolFor(rank) {
  return S.data.questions.filter((q) => q.rank === rank);
}

export function pickQuestion(rank, vip) {
  const C = cfg();
  const p = S.profile;
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
