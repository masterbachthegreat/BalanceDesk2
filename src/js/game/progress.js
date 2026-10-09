// Ranks, promotion, lifetime stats and streak-triggered memos.
import { S, cfg, touchProfile } from '../core/state.js';
import { emit } from '../core/bus.js';
import { botSay } from './bot.js';
import { triggerMemo } from './manager.js';
import { toast } from '../ui/toast.js';

export function rankInfo(r) {
  const ranks = S.data.ranks;
  return ranks.find((x) => x.rank === r) || ranks[ranks.length - 1];
}
// The top rank is the highest one that actually has questions, so adding a new
// data/questions/rankNN_*.json file is all it takes to open up the next rank.
export function maxRank() {
  const withQuestions = S.data.ranks.filter((r) => S.data.questions.some((q) => q.rank === r.rank));
  return Math.max(...(withQuestions.length ? withQuestions : S.data.ranks).map((r) => r.rank));
}

export function promotionStatus() {
  const P = cfg().promotion;
  const scores = S.profile.rankChats || [];
  const avg = scores.length ? scores.reduce((s, x) => s + x, 0) / scores.length : 0;
  return { have: scores.length, need: P.window, avg, minAvg: P.minAvgScore, atMax: S.profile.rank >= maxRank() };
}

export function recordChat(chat) {
  const p = S.profile;
  const r = chat.result;
  const st = p.stats;
  st.completed++;
  st.scoreSum += r.aiScore;
  st.starsSum += r.stars;
  if (r.stars >= 5) st.fiveStars++;
  if (chat.endReason === 'closed') st.closedByMe++;
  if (chat.endReason === 'left' || chat.endReason === 'timeout') st.lost++;
  if (chat.customer.vip) st.vipServed++;
  st.bestPay = Math.max(st.bestPay || 0, r.payout.total);

  // promotion: last N graded chats taken at the current rank
  if (chat.rankAtStart === p.rank) {
    const P = cfg().promotion;
    p.rankChats = [...(p.rankChats || []), r.aiScore].slice(-P.window);
    const s = promotionStatus();
    if (!s.atMax && s.have >= s.need && s.avg >= s.minAvg) promote();
  }

  // streaks & milestones -> manager memos
  p.streak ||= { low: 0, high: 0 };
  p.streak.low = r.stars <= 2 ? p.streak.low + 1 : 0;
  p.streak.high = r.stars >= 4.5 ? p.streak.high + 1 : 0;
  if (p.streak.low === 3) triggerMemo('lowStreak');
  if (p.streak.high === 5) triggerMemo('highStreak');
  if ([1, 10, 25, 50, 100, 250, 500].includes(st.completed)) triggerMemo('milestone', { count: st.completed });
  if (chat.customer.vip && st.vipServed === 1) triggerMemo('firstVip');
  touchProfile();
}

export function promote() {
  const p = S.profile;
  const old = rankInfo(p.rank);
  p.rank += 1;
  p.rankChats = [];
  p.rankHistory.push({ rank: p.rank, at: Date.now() });
  const nr = rankInfo(p.rank);
  botSay('🎉 **Promotion!** You are now **' + nr.title + '** (rank ' + p.rank + ').\nNew topics unlocked: ' + nr.topics + '.\nBase pay per chat: $' + nr.basePay + ' (was $' + old.basePay + ').');
  triggerMemo('promotion');
  toast('Promoted to ' + nr.title + '!', 'New topics: ' + nr.topics, 'good');
  touchProfile();
  emit('profile');
}
