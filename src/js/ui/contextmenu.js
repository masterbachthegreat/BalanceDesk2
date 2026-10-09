// Right-click menu for chats: pin, archive, mark read, ask mentor, close, delete.
import { S, touchChat } from '../core/state.js';
import { escapeHtml } from '../core/format.js';
import { getChat, displayName, markRead } from '../game/chats.js';
import { closeChat, deleteChat } from '../game/customers.js';
import { confirmModal } from './modals.js';
import { ui } from './registry.js';
import * as clock from '../game/clock.js';

const menu = () => document.getElementById('ctxMenu');

export function hideMenu() { menu().classList.add('hidden'); }

// items: [{ ic, label, run, danger?, disabled? } | { sep: true } | { html, onClick }]
export function showMenu(items, x, y, headHtml = '') {
  const el = menu();
  el.onclick = (e) => { // default: run the clicked item (callers may replace this)
    const row = e.target.closest('.ctx-item');
    if (!row || !items[+row.dataset.i]) return;
    hideMenu();
    items[+row.dataset.i].run();
  };
  el.innerHTML = headHtml + items.map((it, i) => it.sep ? '<div class="ctx-sep"></div>' :
    `<div class="ctx-item${it.danger ? ' danger' : ''}${it.disabled ? ' disabled' : ''}" data-i="${i}"><span class="ic">${it.ic}</span>${escapeHtml(it.label)}</div>`).join('');
  el.classList.remove('hidden');
  const w = el.offsetWidth, h = el.offsetHeight;
  el.style.left = Math.max(4, Math.min(x, window.innerWidth - w - 4)) + 'px';
  el.style.top = Math.max(4, Math.min(y, window.innerHeight - h - 4)) + 'px';
  return el;
}

export function chatContextMenu(id, x, y) {
  const chat = getChat(id);
  if (!chat) return;
  const items = [];
  const cust = chat.kind === 'customer';
  items.push({ ic: '💬', label: 'Open', run: () => ui.openChat(id) });
  items.push({ ic: '📌', label: chat.pinned ? 'Unpin' : 'Pin to top', run: () => { chat.pinned = !chat.pinned; touchChat(chat); } });
  items.push({ ic: '🗄', label: chat.archived ? 'Unarchive' : 'Archive', run: () => {
    chat.archived = !chat.archived;
    if (chat.archived && S.activeChatId === id && S.folder !== 'archive') S.activeChatId = null;
    touchChat(chat);
    ui.refresh();
  } });
  if (chat.unread) items.push({ ic: '✔', label: 'Mark as read', run: () => markRead(chat) });
  const muted = chat.mutedUntil === -1 || (chat.mutedUntil || 0) > clock.now();
  if (muted) items.push({ ic: '🔔', label: 'Unmute', run: () => { chat.mutedUntil = 0; touchChat(chat); } });
  else {
    items.push({ ic: '🔕', label: 'Mute for 1 hour', run: () => { chat.mutedUntil = clock.now() + 3600000; touchChat(chat); } });
    items.push({ ic: '🔕', label: 'Mute for 8 hours', run: () => { chat.mutedUntil = clock.now() + 8 * 3600000; touchChat(chat); } });
    items.push({ ic: '🔕', label: 'Mute forever', run: () => { chat.mutedUntil = -1; touchChat(chat); } });
  }
  if (cust) items.push({ ic: '🎓', label: 'Ask the mentor about it', run: () => ui.askMentorAbout(id) });
  if (!cust && chat.kind !== 'manager') {
    items.push({ sep: true });
    items.push({ ic: '🧹', label: 'Clear history', danger: true, run: async () => {
      if (await confirmModal('Clear history?', `Remove all messages in ${escapeHtml(displayName(chat))}?`, 'Clear', true)) {
        chat.messages = [];
        touchChat(chat);
        ui.refresh(true);
      }
    } });
  }
  if (cust) {
    items.push({ sep: true });
    items.push({ ic: '✖', label: 'Close conversation', disabled: chat.status !== 'active', run: async () => {
      if (await confirmModal('Close this conversation?', `${escapeHtml(chat.customer.name)} isn't done yet. Closing it ends the chat now and costs you <b>${S.data.config.stars.closePenalty} stars</b> on the service rating. The answer is still graded and paid.`, 'Close conversation', true)) {
        closeChat(chat);
      }
    } });
    items.push({ ic: '🗑', label: 'Delete chat', danger: true, run: async () => {
      const active = chat.status === 'active';
      const body = active
        ? `This conversation is still active: it will be <b>closed first</b> (star penalty, still graded and paid) and then the chat is deleted for good. The mentor won't be able to read it afterwards.`
        : 'The chat is deleted for good. The mentor won\'t be able to read it afterwards.';
      if (await confirmModal('Delete chat with ' + escapeHtml(chat.customer.name) + '?', body, 'Delete', true)) {
        deleteChat(chat);
        ui.refresh(true);
      }
    } });
  }
  const el = menu();
  el.innerHTML = items.map((it, i) => it.sep ? '<div class="ctx-sep"></div>' :
    `<div class="ctx-item${it.danger ? ' danger' : ''}${it.disabled ? ' disabled' : ''}" data-i="${i}"><span class="ic">${it.ic}</span>${escapeHtml(it.label)}</div>`).join('');
  el.classList.remove('hidden');
  const w = el.offsetWidth, h = el.offsetHeight;
  el.style.left = Math.max(4, Math.min(x, window.innerWidth - w - 4)) + 'px';
  el.style.top = Math.max(4, Math.min(y, window.innerHeight - h - 4)) + 'px';
  el.onclick = (e) => {
    const row = e.target.closest('.ctx-item');
    if (!row) return;
    hideMenu();
    items[+row.dataset.i].run();
  };
}

export function bindContextMenu() {
  document.addEventListener('mousedown', (e) => { if (!e.target.closest('#ctxMenu')) hideMenu(); });
  window.addEventListener('blur', hideMenu);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideMenu(); });
}
