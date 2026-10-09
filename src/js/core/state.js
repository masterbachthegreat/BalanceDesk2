// Global in-memory state plus debounced persistence to the save folder.
import { emit } from './bus.js';

export const S = {
  data: null,          // bundled game data (config, ranks, personalities, shop, memos, questions)
  settings: null,      // settings from the main process (API key never exposed)
  profile: null,       // the player's save (profile.json)
  chats: new Map(),    // id -> chat object (each saved as chats/<id>.json)
  activeChatId: null,
  folder: 'all',       // chat-list folder: all | customers | work | unread | vip | archive
  search: '',
  focused: true,
};

export const cfg = () => S.data.config;

const timers = new Map();
function debounced(key, ms, fn) {
  clearTimeout(timers.get(key));
  timers.set(key, setTimeout(() => { timers.delete(key); fn(); }, ms));
}

export function saveChat(chat) {
  if (chat.deleted || S.resetting) return;
  debounced('chat:' + chat.id, 300, () => {
    if (!chat.deleted) window.api.store.write('chats/' + chat.id + '.json', chat);
  });
}

export function saveProfile() {
  if (S.resetting) return;
  debounced('profile', 400, () => window.api.store.write('profile.json', S.profile));
}

export function flushAll() {
  for (const [key] of timers) clearTimeout(timers.get(key));
  timers.clear();
  if (S.resetting) return;
  window.api.store.write('profile.json', S.profile);
  for (const c of S.chats.values()) if (!c.deleted) window.api.store.write('chats/' + c.id + '.json', c);
}

export function touchChat(chat) {
  saveChat(chat);
  emit('chat', chat.id);
  emit('list');
}

export function touchProfile() {
  saveProfile();
  emit('profile');
}

export function uid(prefix = 'm') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function rand(min, max) { return min + Math.random() * (max - min); }
export function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
export function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
