// Chat objects and messages. Every chat is saved as chats/<id>.json in the save folder.
import { S, touchChat, uid } from '../core/state.js';
import { emit } from '../core/bus.js';
import * as clock from './clock.js';

export const SYSTEM_CHATS = ['bot', 'mentor', 'manager'];

export function getChat(id) { return S.chats.get(id); }

export function customerChats() {
  return [...S.chats.values()].filter((c) => c.kind === 'customer' && !c.deleted);
}

export function activeCustomerChats() {
  return customerChats().filter((c) => c.status === 'active');
}

export function newChat(kind, fields = {}) {
  const t = Date.now();
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

// msg: { from: 'me' | 'them' | 'sys', text, kind?, ... }
export function addMessage(chat, msg) {
  const m = { id: uid('m'), t: Date.now(), a: clock.now(), ...msg };
  chat.messages.push(m);
  chat.lastAt = m.t;
  if (m.from === 'them' && !isViewing(chat)) {
    chat.unread = (chat.unread || 0) + 1;
    emit('incoming', chat);
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
  if (chat.kind === 'customer') return chat.customer.name;
  return chat.title;
}

export function findChatByHandle(token) {
  const t = token.replace(/^@/, '').toLowerCase();
  const m = /^chat(\d+)$/.exec(t);
  const list = customerChats().sort((a, b) => b.createdAt - a.createdAt);
  if (m) return list.find((c) => String(c.seq) === m[1]) || null;
  return list.find((c) => c.customer.name.toLowerCase().split(' ')[0] === t) ||
    list.find((c) => c.customer.name.toLowerCase().replace(/\s+/g, '') === t) || null;
}
