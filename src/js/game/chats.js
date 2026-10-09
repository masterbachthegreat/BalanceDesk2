// Chat objects and messages. Every chat is saved as chats/<id>.json in the save folder.
import { S, touchChat, uid } from '../core/state.js';
import { emit } from '../core/bus.js';
import * as clock from './clock.js';
import { displayFor } from './names.js';

export const SYSTEM_CHATS = ['bot', 'mentor', 'manager', 'boss', 'team'];

export function getChat(id) { return S.chats.get(id); }

export function customerChats() {
  return [...S.chats.values()].filter((c) => c.kind === 'customer' && !c.deleted);
}

export function activeCustomerChats() {
  return customerChats().filter((c) => c.status === 'active');
}

export function newChat(kind, fields = {}) {
  const t = clock.now();
  const chat = {
    id: fields.id || uid('c'),
    kind,
    title: '',
    createdAt: t,
    lastAt: t,
    messages: [],
    unread: 0,
    archived: false,
    pinned: kind !== 'customer',
    status: kind === 'customer' ? 'active' : 'system',
    ...fields,
  };
  S.chats.set(chat.id, chat);
  touchChat(chat);
  return chat;
}

export function isViewing(chat) {
  return S.activeChatId === chat.id && S.focused && !S.showModal;
}

// msg: { from: 'me' | 'them' | 'sys', text, kind?, t?, ... }
// `t` defaults to now; catch-up (world.js) passes past times. Messages stay in time order.
export function addMessage(chat, msg) {
  const m = { id: uid('m'), ...msg, t: msg.t ?? clock.now() };
  let i = chat.messages.length;
  while (i > 0 && (chat.messages[i - 1].t || 0) > m.t) i--;
  chat.messages.splice(i, 0, m);
  chat.lastAt = Math.max(chat.lastAt || 0, m.t);
  if (m.from === 'them' && !isViewing(chat)) {
    chat.unread = (chat.unread || 0) + 1;
    if (!S.catchingUp) emit('incoming', chat);
  }
  // Telegram behaviour: a new message un-archives a chat
  if (m.from === 'them' && chat.archived && chat.kind === 'customer') chat.archived = false;
  touchChat(chat);
  return m;
}

export function sysMessage(chat, text, extra = {}) {
  return addMessage(chat, { from: 'sys', text, ...extra });
}

export function markRead(chat) {
  if (chat.unread) {
    chat.unread = 0;
    touchChat(chat);
  }
}

export function removeChat(chat) {
  chat.deleted = true;
  S.chats.delete(chat.id);
  window.api.store.remove('chats/' + chat.id + '.json');
  if (S.activeChatId === chat.id) S.activeChatId = null;
  emit('list');
  emit('chat', null);
}

export function handle(chat) {
  return '@chat' + chat.seq;
}

export function displayName(chat) {
  if (chat.kind === 'customer') return customerNames(chat).display;
  return chat.title;
}

// Casual display name and @username (worked out once per chat, from the persona).
export function customerNames(chat) {
  const c = chat.customer;
  if (!c.display) {
    const p = S.data.personalities.find((x) => x.id === c.personaId) || { id: c.personaId || c.name, name: c.name };
    Object.assign(c, displayFor(p));
  }
  return { display: c.display, username: c.username, full: c.name };
}

export function findChatByHandle(token) {
  const t = token.replace(/^@/, '').toLowerCase();
  const m = /^chat(\d+)$/.exec(t);
  const list = customerChats().sort((a, b) => b.createdAt - a.createdAt);
  if (m) return list.find((c) => String(c.seq) === m[1]) || null;
  return list.find((c) => c.customer.name.toLowerCase().split(' ')[0] === t) ||
    list.find((c) => c.customer.name.toLowerCase().replace(/\s+/g, '') === t) || null;
}

// ---------- message actions (reply, react, edit, delete, pin) ----------
export function findMessage(chat, id) { return chat.messages.find((m) => m.id === id) || null; }

export function toggleReaction(chat, m, emoji, by = 'me') {
  m.reactions ||= [];
  const i = m.reactions.findIndex((r) => r.by === by);
  if (i >= 0 && m.reactions[i].e === emoji) m.reactions.splice(i, 1);
  else if (i >= 0) m.reactions[i].e = emoji;
  else m.reactions.push({ e: emoji, by });
  touchChat(chat);
}

export const EDIT_WINDOW_MS = 15 * 60000;
export function canEdit(chat, m) {
  return m.from === 'me' && !m.local && !m.after && chat.kind !== 'bot' && clock.now() - m.t < EDIT_WINDOW_MS;
}

export function editMessage(chat, m, text) {
  if (!canEdit(chat, m) || !text.trim() || text === m.text) return false;
  if (m.read) m.editedAfterRead = m.text; // the other side already saw the old version
  m.text = text;
  m.edited = true;
  touchChat(chat);
  return true;
}

export function deleteMessage(chat, m) {
  if (!canEdit(chat, m)) return false;
  if (m.read && chat.kind === 'customer') (chat.cs.deletedSeen ||= []).push(m.text);
  chat.messages = chat.messages.filter((x) => x !== m);
  if (chat.pinnedMsg === m.id) chat.pinnedMsg = null;
  touchChat(chat);
  return true;
}

export function pinMessage(chat, m) {
  chat.pinnedMsg = chat.pinnedMsg === m?.id ? null : m?.id || null;
  touchChat(chat);
}

export function quoteText(m, n = 90) {
  const t = String(m?.text || '').replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
}
