// The pay formula. All constants live in data/config.json -> "pay" and "stars".
import { S, cfg, clamp, rand } from '../core/state.js';
import { durationWords, starsText } from '../core/format.js';
import { rankInfo } from './progress.js';
import * as shop from './shop.js';

export function finalStars(chat, gradeStars) {
  const St = cfg().stars;
  const packs = [...new Set(chat.emojiPacksUsed || [])];
  const emojiBonus = Math.min(St.emojiBonusCap, packs.reduce((s, id) => s + (shop.item(id)?.starBonus || 0), 0));
  let stars = gradeStars + emojiBonus;
  const notes = [];
  if (emojiBonus) notes.push('emoji +' + emojiBonus.toFixed(2).replace(/0$/, ''));
  if (chat.endReason === 'closed') { stars -= St.closePenalty; notes.push('closed by you −' + St.closePenalty); }
  if (chat.endReason === 'left' || chat.endReason === 'timeout') {
    if (stars > St.leftCap) notes.push('customer left: capped at ' + St.leftCap);
    stars = Math.min(stars, St.leftCap);
  }
  stars = clamp(Math.round(stars * 2) / 2, 1, 5);
  return { stars, emojiBonus, notes };
}

// Best factor up to the ideal reply time, linear down to `atSlow` at the slow mark, then down
// to `minFactor` at twice the slow mark; each chase costs nudgePenalty. Rush chats use minutes.
export function timeFactor(avgMs, rush = false, nudges = 0) {
  const T = cfg().pay.time;
  const ideal = rush ? cfg().rush.idealReplyMs : cfg().world.idealReplyMs;
  const slow = rush ? cfg().rush.slowReplyMs : T.slowReplyMs;
  let f;
  if (avgMs <= ideal) f = T.bestFactor;
  else if (avgMs <= slow) f = T.bestFactor - (T.bestFactor - T.atSlow) * (avgMs - ideal) / (slow - ideal);
  else f = T.atSlow - (T.atSlow - T.minFactor) * Math.min(1, (avgMs - slow) / slow);
  return clamp(Math.round((f - T.nudgePenalty * nudges) * 100) / 100, T.minFactor, T.bestFactor);
}

function lengthFactor(exchanges) {
  for (const row of cfg().pay.lengthFactors) if (exchanges <= row.maxExchanges) return row.factor;
  return 1;
}

// Returns { lines: [{label, why, mult?|add?|value?}], total, stars, ... } — doesn't change state.
export function computePayout(chat, grade, modifiers = S.profile.modifiers) {
  const P = cfg().pay;
  const cs = chat.cs;
  const rk = rankInfo(chat.rankAtStart || S.profile.rank);
  const lines = [];
  let amount = rk.basePay;
  lines.push({ label: 'Base pay', why: `Rank ${rk.rank} · ${rk.title}`, value: rk.basePay });

  if (chat.customer.vip) {
    amount *= P.vipMultiplier;
    lines.push({ label: 'VIP client', why: 'VIP customers pay more', mult: P.vipMultiplier });
  }

  const quality = clamp(grade.score / 100, 0.01, 1);
  amount *= quality;
  lines.push({ label: 'Answer quality', why: `AI score ${grade.score}/100`, mult: quality });

  const fs = finalStars(chat, grade.stars);
  const service = P.serviceMultBase + P.serviceMultPerStar * fs.stars;
  amount *= service;
  lines.push({ label: 'Service rating', why: `${starsText(fs.stars)} (grader ${starsText(grade.stars)}${fs.notes.length ? ', ' + fs.notes.join(', ') : ''})`, mult: service });

  const exchanges = cs.turns;
  const lf = lengthFactor(exchanges);
  amount *= lf;
  lines.push({ label: 'Conversation length', why: `${exchanges} customer repl${exchanges === 1 ? 'y' : 'ies'} after the question`, mult: lf });

  const T = P.time;
  let avgMs = cs.latencies.length ? cs.latencies.reduce((s, x) => s + x, 0) / cs.latencies.length : null;
  if (avgMs === null) avgMs = Math.max(0, (chat.endedAt || 0) - (cs.lastCustomerAt || chat.createdAt));
  const nudges = cs.nudges || 0;
  const tf = timeFactor(avgMs, chat.rush, nudges);
  amount *= tf;
  lines.push({ label: 'Response time', why: `avg reply ${durationWords(avgMs)}${nudges ? `, chased ${nudges}×` : ''}`, mult: tf });

  if (chat.rush) {
    amount *= cfg().rush.payMult;
    lines.push({ label: 'Rush shift', why: 'Extra customers sent your way by your manager', mult: cfg().rush.payMult });
  }
  const raise = S.profile.payRaise || 0;
  if (raise > 0) {
    amount *= 1 + raise;
    lines.push({ label: 'Pay raise', why: `+${Math.round(raise * 100)}% from your manager`, mult: 1 + raise });
  }

  // bonuses from memos and consumables
  const used = [];
  let forceTip = false;
  let flat = 0;
  for (const m of modifiers || []) {
    if (m.vipOnly && !chat.customer.vip) continue;
    if (m.kind === 'payMult') {
      amount *= m.value;
      lines.push({ label: m.label || 'Bonus', why: m.source || '', mult: m.value });
      used.push(m.id);
    } else if (m.kind === 'tip') {
      forceTip = true;
      used.push(m.id);
    } else if (m.kind === 'flat5star' && fs.stars >= 5) {
      flat += m.value;
      lines.push({ label: m.label || '5★ bonus', why: m.source || '', add: m.value });
      used.push(m.id);
    }
  }

  let tip = 0;
  const Tp = P.tip;
  const earnsTip = fs.stars >= Tp.minStars && grade.score >= Tp.minScore;
  if (forceTip || (earnsTip && Math.random() < (chat.customer.vip ? Tp.vipChance : Tp.chance))) {
    tip = Math.round(amount * rand(Tp.pct[0], Tp.pct[1]));
    if (tip > 0) lines.push({ label: 'Tip from customer', why: forceTip ? 'Lucky coin' : 'They loved it', add: tip });
  }

  const total = Math.max(P.minPay, Math.round(amount + tip + flat));
  return { lines, total, stars: fs.stars, emojiBonus: fs.emojiBonus, usedModifiers: used, avgReplyMs: avgMs };
}
