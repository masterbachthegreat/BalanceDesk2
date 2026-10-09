// Plain-text transcripts of customer chats, used by the grader and the mentor.
import { durationWords, starsText, money } from '../core/format.js';
import { handle } from './chats.js';

const REASONS = {
  satisfied: 'the customer was satisfied',
  left: 'the customer gave up and left',
  timeout: 'the customer left after waiting too long for a reply',
  closed: 'the agent closed the conversation before the customer was satisfied',
  missed: 'the customer gave up before the agent ever replied',
  transferred: 'the manager transferred the chat to a colleague',
};
export const reasonText = (r) => REASONS[r] || r || 'unknown';

function ts(t) {
  return new Date(t).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function messageLines(chat) {
  const out = [];
  for (const m of chat.messages) {
    if (m.from === 'sys') {
      if (m.kind === 'payout' || m.kind === 'breakdown' || m.kind === 'feedback' || m.kind === 'error') continue;
      out.push(`[${ts(m.t)}] (system) ${m.text}`);
    } else if (m.from === 'them') {
      out.push(`[${ts(m.t)}] CUSTOMER: ${m.text}`);
    } else {
      out.push(`[${ts(m.t)}] AGENT${m.after ? ' (after the chat had ended — customer did not see it)' : ''}: ${m.text}`);
    }
  }
  return out;
}

export function fullTranscript(chat) {
  const q = chat.question;
  const c = chat.customer;
  const head = [
    `=== CHAT TRANSCRIPT ${handle(chat)} ===`,
    `Customer: ${c.name}${c.vip ? ' (VIP client)' : ''} — ${c.bio}`,
    `Topic: ${q.topic} (book chapter ${q.chapter}, rank ${q.rank})`,
    `Customer's question: ${q.text}`,
    `Reference solution (Whiterock answer key): ${q.solution}`,
  ];
  if (chat.status === 'active') head.push('Status: ACTIVE — the conversation is still going on.');
  else head.push(`Status: ended — ${reasonText(chat.endReason)}.`);
  if (chat.result) {
    const r = chat.result;
    head.push(`Result: AI answer score ${r.aiScore}/100 · service ${starsText(r.stars)} · paid ${money(r.payout.total)} · duration ${durationWords(r.durationMs)}`);
    if (r.grade) {
      head.push(`Grader summary: ${r.grade.summary || ''}`);
      if (r.grade.issues?.length) head.push(`Grader issues: ${r.grade.issues.join('; ')}`);
      if (r.grade.correctAnswer) head.push(`Grader's correct answer: ${r.grade.correctAnswer}`);
    }
  }
  return [...head, '--- messages ---', ...messageLines(chat), `=== END ${handle(chat)} ===`].join('\n');
}
