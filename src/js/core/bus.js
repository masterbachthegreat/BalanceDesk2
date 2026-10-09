// Tiny event bus. Events used: 'chat' (chatId), 'list', 'profile', 'toast'.
const handlers = new Map();

export function on(evt, fn) {
  if (!handlers.has(evt)) handlers.set(evt, new Set());
  handlers.get(evt).add(fn);
  return () => handlers.get(evt).delete(fn);
}

export function emit(evt, payload) {
  for (const fn of handlers.get(evt) || []) {
    try { fn(payload); } catch (e) { console.error('bus handler for', evt, e); }
  }
}
