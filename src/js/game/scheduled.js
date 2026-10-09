// Scheduled messages ("send tomorrow at 09:00"). Stored on the chat (chat.scheduled) and sent at
// their time, also while the app was closed (world.catchUp delivers them with their own timestamp).
import { S, uid, touchChat } from '../core/state.js';
import * as clock from './clock.js';
import { onPlayerMessage as toCustomer, advanceTimers } from './customers.js';
import * as boss from './boss.js';
import * as team from './team.js';

export const SCHEDULABLE = new Set(['customer', 'boss', 'team']);

export function schedule(chat, text, at, replyTo = null) {
  chat.scheduled ||= [];
  chat.scheduled.push({ id: uid('s'), text, at, replyTo });
  chat.scheduled.sort((a, b) => a.at - b.at);
  touchChat(chat);
}

export function cancel(chat, id) {
  chat.scheduled = (chat.scheduled || []).filter((x) => x.id !== id);
  touchChat(chat);
}

function sendNow(chat, s) {
  const before = new Set(chat.messages.map((m) => m.id));
  if (chat.kind === 'customer') {
    if (chat.status === 'active') advanceTimers(chat, s.at); // did they give up before it went out?
    toCustomer(chat, s.text, s.at);
  } else if (chat.kind === 'boss') boss.onPlayerMessage(s.text, s.at);
  else if (chat.kind === 'team') team.onPlayerMessage(s.text, s.at);
  const mine = chat.messages.find((m) => !before.has(m.id) && m.from === 'me');
  if (mine) { mine.scheduled = true; if (s.replyTo) mine.replyTo = s.replyTo; }
}

// Send everything that's due by `now`.
export function deliverDue(now = clock.now()) {
  for (const chat of S.chats.values()) {
    if (!chat.scheduled?.length || chat.deleted) continue;
    const due = chat.scheduled.filter((s) => s.at <= now);
    if (!due.length) continue;
    chat.scheduled = chat.scheduled.filter((s) => s.at > now);
    for (const s of due) sendNow(chat, s);
    touchChat(chat);
  }
}
