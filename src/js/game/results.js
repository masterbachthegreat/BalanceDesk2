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
};

const grading = new Set();

export async function finishConversation(chat, reason) {
  if (chat.status !== 'active') return;
  const cs = chat.cs;
  chat.status = 'grading';
  chat.endedA = clock.now();
  chat.endedAt = Date.now();
  chat.endReason = reason;
  cs.typing = false;
  cs.pendingReadA = null;
  cs.waitingSinceA = null;
  sysMessage(chat, END_TEXT[reason] || 'Conversation ended');
  sysMessage(chat, '⏳ Grading your answer…', { kind: 'grading' });
  await gradeAndPay(chat);
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
    const d = clock.today();
    d.chats++; d.earned += payout.total; d.scoreSum += grade.score; d.starsSum += payout.stars;

    chat.result = {
      aiScore: grade.score,
      stars: payout.stars,
      graderStars: grade.stars,
      grade,
      payout: { lines: payout.lines, total: payout.total },
      durationMs: chat.endedA - chat.startedA,
      avgReplyMs: payout.avgReplyMs,
    };
    p.lastPayoutChat = chat.id;
    chat.status = 'ended';
    chat.messages = chat.messages.filter((m) => m.kind !== 'grading');
    addMessage(chat, { from: 'sys', kind: 'payout', text: `Paid ${money(payout.total)}` });
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
