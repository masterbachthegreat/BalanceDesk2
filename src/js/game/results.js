// Ending conversations: grading, payout, receipts and progress.
import { S, touchChat, touchProfile } from '../core/state.js';
import { emit } from '../core/bus.js';
import { money, starsText } from '../core/format.js';
import * as clock from './clock.js';
import { addMessage, sysMessage, handle } from './chats.js';
import { gradeChat } from './grading.js';
import { computePayout } from './payout.js';
import { withRetry } from './llm.js';
import { recordChat } from './progress.js';
import { botSay } from './bot.js';

const END_TEXT = {
  satisfied: '✅ The customer is satisfied — conversation ended',
  left: '🚪 The customer left the conversation',
  timeout: '⌛ The customer got tired of waiting and left',
  closed: '✖ You closed this conversation',
  missed: '⌛ The customer gave up before you ever replied',
};

const grading = new Set();

// `at` is when it ended (in the past during catch-up).
export async function finishConversation(chat, reason, at = clock.now()) {
  if (chat.status !== 'active') return;
  const cs = chat.cs;
  const answered = chat.messages.some((m) => m.from === 'me' && !m.after && !m.local);
  if (!answered && reason !== 'closed') reason = 'missed';
  chat.status = 'grading';
  chat.endedAt = at;
  chat.endReason = reason;
  cs.typing = false;
  cs.readAt = cs.nudgeAt = cs.leaveAt = cs.waitingSince = null;
  cs.onlineUntil = Math.min(cs.onlineUntil || 0, at);
  sysMessage(chat, END_TEXT[reason] || 'Conversation ended', { t: at });
  if (!answered) { noAnswer(chat, reason, at); return; }
  sysMessage(chat, '⏳ Grading your answer…', { kind: 'grading', t: at });
  await gradeAndPay(chat);
}

// Nothing to grade: you never wrote to this customer.
function noAnswer(chat, reason, at) {
  const p = S.profile;
  chat.status = 'ended';
  chat.result = {
    aiScore: 0, stars: 1, graderStars: 1, missed: true,
    grade: { score: 0, stars: 1, summary: 'You never replied to this customer.', correctAnswer: chat.question.solution, strengths: [], improvements: ['Reply sooner: customers chase you after about 12 hours and then give up.'] },
    payout: { lines: [{ label: 'No reply', why: reason === 'closed' ? 'You closed the chat without answering' : 'The customer gave up waiting', value: 0 }], total: 0 },
    durationMs: at - chat.createdAt,
    avgReplyMs: null,
  };
  p.stats.missed = (p.stats.missed || 0) + 1;
  clock.today(at).missed++;
  addMessage(chat, { from: 'sys', kind: 'payout', text: 'No pay', t: at });
  if (!S.catchingUp) botSay(`📭 ${chat.customer.name}${chat.customer.vip ? ' 👑' : ''} (${handle(chat)}) ${reason === 'closed' ? 'was closed' : 'gave up'} before you replied. No pay.`, { silent: true });
  touchProfile();
  touchChat(chat);
}

function consumeModifiers(ids) {
  const p = S.profile;
  for (const m of p.modifiers) {
    if (!ids.includes(m.id)) continue;
    m.chatsLeft = (m.chatsLeft ?? m.chats ?? 1) - 1;
  }
  p.modifiers = p.modifiers.filter((m) => (m.chatsLeft ?? m.chats ?? 1) > 0);
}

export async function gradeAndPay(chat) {
  if (grading.has(chat.id)) return;
  grading.add(chat.id);
  chat.messages = chat.messages.filter((m) => m.kind !== 'error' || m.retry !== 'grade');
  touchChat(chat);
  try {
    const grade = await withRetry(() => gradeChat(chat), 3, 2000);
    const payout = computePayout(chat, grade);
    const p = S.profile;
    consumeModifiers(payout.usedModifiers);
    p.balance += payout.total;
    p.lifetimeEarned += payout.total;
    const d = clock.today(chat.endedAt);
    d.chats++; d.earned += payout.total; d.scoreSum += grade.score; d.starsSum += payout.stars;

    chat.result = {
      aiScore: grade.score,
      stars: payout.stars,
      graderStars: grade.stars,
      grade,
      payout: { lines: payout.lines, total: payout.total },
      durationMs: chat.endedAt - chat.createdAt,
      avgReplyMs: payout.avgReplyMs,
    };
    p.lastPayoutChat = chat.id;
    chat.status = 'ended';
    chat.messages = chat.messages.filter((m) => m.kind !== 'grading');
    addMessage(chat, { from: 'sys', kind: 'payout', text: `Paid ${money(payout.total)}`, t: Math.max(chat.endedAt, ...chat.messages.map((m) => m.t || 0)) });
    recordChat(chat);
    botSay(`💸 **${money(payout.total, { plus: true })}** from ${chat.customer.name}${chat.customer.vip ? ' 👑' : ''} (${handle(chat)}${chat.deleted ? ', deleted' : ''}) · ${starsText(payout.stars)} · score ${grade.score}/100\nBalance: **${money(p.balance)}**`, { silent: true });
    touchProfile();
    emit('payout', chat);
  } catch (e) {
    chat.messages = chat.messages.filter((m) => m.kind !== 'grading');
    if (chat.deleted) {
      botSay(`⚠ Grading failed for the deleted chat with ${chat.customer.name}: ${e.message}. No pay for that one.`);
    } else {
      sysMessage(chat, '⚠ Grading failed: ' + e.message, { kind: 'error', retry: 'grade' });
    }
  } finally {
    grading.delete(chat.id);
    touchChat(chat);
  }
}
