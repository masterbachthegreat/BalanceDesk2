// Left column: chat list (Telegram-style), archive folder and the status bar.
import { S } from '../core/state.js';
import { escapeHtml, listTime, duration, money, starsText } from '../core/format.js';
import { chatAvatar } from './avatar.js';
import { plainPreview } from './markdown.js';
import { displayName } from '../game/chats.js';
import * as clock from '../game/clock.js';
import { freeSlots, maxSlots } from '../game/customers.js';
import { ui } from './registry.js';

const ORDER = { bot: 0, mentor: 1, manager: 2 };

function sortChats(list) {
  return list.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.pinned && b.pinned && a.kind !== 'customer' && b.kind !== 'customer') return ORDER[a.kind] - ORDER[b.kind];
    return b.lastAt - a.lastAt;
  });
}

function isTyping(chat) {
  return chat.kind === 'customer' ? chat.status === 'active' && chat.cs?.typing : !!chat.typing;
}

function preview(chat) {
  if (isTyping(chat)) return '<span class="typing">typing…</span>';
  const m = [...chat.messages].reverse().find((x) => x.kind !== 'breakdown' && x.kind !== 'feedback');
  if (!m) return '';
  if (m.kind === 'payout') return '💸 ' + escapeHtml(m.text);
  const prefix = m.from === 'me' ? '<span style="color:var(--accent)">You:</span> ' : '';
  return prefix + escapeHtml(plainPreview(m.text)).slice(0, 120);
}

function ticks(chat) {
  const last = chat.messages[chat.messages.length - 1];
  if (!last || last.from !== 'me' || chat.kind === 'manager') return '';
  return `<span class="ticks ${last.read ? 'read' : ''}">${last.read ? '✓✓' : '✓'}</span>`;
}

function rightBottom(chat) {
  if (chat.unread) return `<span class="badge">${chat.unread}</span>`;
  if (chat.kind !== 'customer') return '';
  if (chat.status === 'grading') return '<span class="cr-meta">⏳</span>';
  if (chat.status === 'ended') return chat.result ? `<span class="cr-meta" style="color:var(--star)">${starsText(chat.result.stars)}</span>` : '';
  const cs = chat.cs;
  if (cs.waitingSinceA != null) {
    const w = clock.now() - cs.waitingSinceA;
    const cls = cs.nudgedA != null ? 'danger' : w > cs.patienceMs * 0.6 ? 'warn' : '';
    return `<span class="wait-chip ${cls}" title="Customer is waiting for your reply">${duration(w)}</span>`;
  }
  return '';
}

function rowHtml(chat) {
  const selected = chat.id === S.activeChatId ? ' selected' : '';
  const vip = chat.kind === 'customer' && chat.customer.vip ? ' <span class="vip-crown" title="VIP client">👑</span>' : '';
  const verified = chat.kind !== 'customer' ? ' <span class="verified" title="Whiterock official">✔</span>' : '';
  const pin = chat.pinned && chat.kind === 'customer' ? '<span class="pin">📌</span>' : '';
  const ended = chat.kind === 'customer' && chat.status !== 'active' ? ' style="opacity:.78"' : '';
  return `<div class="chat-row${selected}" data-id="${chat.id}"${ended}>
    ${chatAvatar(chat)}
    <div class="cr-body">
      <div class="cr-top"><span class="cr-name">${escapeHtml(displayName(chat))}${vip}${verified}</span>${pin}${ticks(chat)}<span class="cr-time">${listTime(chat.lastAt)}</span></div>
      <div class="cr-bottom"><span class="cr-preview">${preview(chat)}</span>${rightBottom(chat)}</div>
    </div>
  </div>`;
}

export function renderSidebar() {
  const el = document.getElementById('chatList');
  const q = S.search.trim().toLowerCase();
  const all = [...S.chats.values()].filter((c) => !c.deleted);
  const match = (c) => !q || displayName(c).toLowerCase().includes(q) || ('@chat' + c.seq) === q || c.messages.some((m) => m.text && m.text.toLowerCase().includes(q));
  let html = '';
  if (S.showArchived) {
    html += `<div class="chat-row archive-row" data-action="back"><div class="avatar-wrap"><div class="avatar emoji" style="background:var(--muted)">←</div></div><div class="cr-body"><div class="cr-name">Archived chats</div><div class="cr-preview">Back to all chats</div></div></div>`;
    const arch = sortChats(all.filter((c) => c.archived && match(c)));
    html += arch.length ? arch.map(rowHtml).join('') : '<div class="list-empty">No archived chats</div>';
  } else {
    const arch = all.filter((c) => c.archived);
    if (arch.length && !q) {
      const unread = arch.reduce((s, c) => s + (c.unread || 0), 0);
      const names = sortChats(arch).slice(0, 4).map(displayName).join(', ');
      html += `<div class="chat-row archive-row" data-action="archive"><div class="avatar-wrap"><div class="avatar emoji">🗄</div></div><div class="cr-body"><div class="cr-top"><span class="cr-name">Archived Chats</span></div><div class="cr-bottom"><span class="cr-preview">${escapeHtml(names)}</span>${unread ? `<span class="badge muted">${unread}</span>` : ''}</div></div></div>`;
    }
    const list = sortChats(all.filter((c) => (!c.archived || q) && match(c)));
    html += list.map(rowHtml).join('');
    if (q && !list.length) html += '<div class="list-empty">No chats found</div>';
  }
  el.innerHTML = html;
}

export function renderStatusBar() {
  const p = S.profile;
  const on = p.status === 'online';
  const d = clock.today();
  const slots = maxSlots();
  const used = slots - freeSlots();
  const keyWarn = !S.settings.hasKey ? ' · <span style="color:var(--danger)">no API key</span>' : '';
  document.getElementById('statusBar').innerHTML =
    `<button class="status-toggle" id="statusToggle" title="Toggle whether new customers arrive"><span class="dot ${on ? 'on' : ''}"></span>${on ? 'Online' : 'Away'}</button>` +
    `<span title="Time on shift today">⏱ ${duration(d.activeMs)}</span><span title="Active customer chats">💬 ${used}/${slots}</span>${keyWarn}` +
    `<span class="bal" title="Balance">${money(p.balance)}</span>`;
}

export function bindSidebar() {
  const list = document.getElementById('chatList');
  list.addEventListener('click', (e) => {
    const row = e.target.closest('.chat-row');
    if (!row) return;
    if (row.dataset.action === 'archive') { S.showArchived = true; ui.refresh(); return; }
    if (row.dataset.action === 'back') { S.showArchived = false; ui.refresh(); return; }
    ui.openChat(row.dataset.id);
  });
  list.addEventListener('contextmenu', (e) => {
    const row = e.target.closest('.chat-row');
    if (!row || !row.dataset.id) return;
    e.preventDefault();
    ui.chatContextMenu(row.dataset.id, e.clientX, e.clientY);
  });
  const search = document.getElementById('search');
  search.addEventListener('input', () => { S.search = search.value; renderSidebar(); });
  document.getElementById('statusBar').addEventListener('click', (e) => {
    if (e.target.closest('#statusToggle')) ui.setStatus(S.profile.status === 'online' ? 'away' : 'online');
  });
}

