// Left column: chat list (Telegram-style), archive folder and the status bar.
import { S, cfg, touchChat, touchProfile } from '../core/state.js';
import { escapeHtml, listTime, waitWords, money, starsText } from '../core/format.js';
import { chatAvatar } from './avatar.js';
import { plainPreview } from './markdown.js';
import { displayName } from '../game/chats.js';
import * as clock from '../game/clock.js';
import { openCount } from '../game/customers.js';
import * as world from '../game/world.js';
import * as team from '../game/team.js';
import { ui } from './registry.js';

const ORDER = { bot: 0, boss: 1, team: 2, mentor: 3, manager: 4 };

function sortChats(list) {
  return list.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.pinned && b.pinned) {
      const pa = a.pinOrder ?? 100 + (ORDER[a.kind] ?? 50), pb = b.pinOrder ?? 100 + (ORDER[b.kind] ?? 50);
      if (pa !== pb) return pa - pb;
    }
    return b.lastAt - a.lastAt;
  });
}

// ---------- folders (left rail) ----------
export const FOLDERS = [
  { id: 'all', ic: '💬', label: 'All', test: (c) => !c.archived },
  { id: 'customers', ic: '👤', label: 'Customers', test: (c) => !c.archived && c.kind === 'customer' },
  { id: 'work', ic: '🏢', label: 'Work', test: (c) => !c.archived && c.kind !== 'customer' },
  { id: 'unread', ic: '🔵', label: 'Unread', test: (c) => !c.archived && c.unread > 0 },
  { id: 'vip', ic: '👑', label: 'VIP', test: (c) => !c.archived && c.kind === 'customer' && c.customer.vip },
  { id: 'archive', ic: '🗄', label: 'Archive', test: (c) => c.archived },
];

export const isMuted = (c) => c.mutedUntil === -1 || (c.mutedUntil || 0) > clock.now();

export function renderRail() {
  const el = document.getElementById('rail');
  if (!el) return;
  const all = [...S.chats.values()].filter((c) => !c.deleted);
  const items = FOLDERS.map((f) => {
    const n = all.filter((c) => f.test(c) && !isMuted(c)).reduce((s, c) => s + (c.unread || 0), 0);
    return `<button class="rail-item ${S.folder === f.id ? 'active' : ''}" data-folder="${f.id}" title="${f.label}"><span class="ri-ic">${f.ic}</span><span class="ri-label">${f.label}</span>${n ? `<span class="ri-badge">${n > 99 ? '99+' : n}</span>` : ''}</button>`;
  }).join('');
  el.innerHTML = `<button id="menuBtn" class="rail-item" title="Menu"><span class="ri-ic">☰</span></button>${items}<div class="rail-spacer"></div><button class="rail-item" data-rail="settings" title="Settings"><span class="ri-ic">⚙</span><span class="ri-label">Settings</span></button>`;
  document.getElementById('menuBtn').onclick = () => ui.openDrawer?.();
}

function isTyping(chat) {
  return chat.kind === 'customer' ? chat.status === 'active' && chat.cs?.typing : !!chat.typing;
}

function preview(chat) {
  if (chat.draft && chat.id !== S.activeChatId) return `<span class="draft">Draft:</span> ${escapeHtml(chat.draft.replace(/\s+/g, ' ')).slice(0, 100)}`;
  if (isTyping(chat)) return `<span class="typing">${chat.kind === 'team' && typeof chat.typing === 'string' ? escapeHtml(chat.typing) + ' is ' : ''}typing…</span>`;
  const m = [...chat.messages].reverse().find((x) => x.kind !== 'breakdown' && x.kind !== 'feedback');
  if (!m) return '';
  if (m.kind === 'payout') return '💸 ' + escapeHtml(m.text);
  const sender = chat.kind === 'team' && m.from === 'them' ? team.member(m.who) : null;
  const prefix = m.from === 'me' ? '<span style="color:var(--accent)">You:</span> ' : sender ? `<span style="color:${sender.color}">${escapeHtml(sender.name.split(' ')[0])}:</span> ` : '';
  return prefix + escapeHtml(plainPreview(m.text)).slice(0, 120);
}

function ticks(chat) {
  const last = chat.messages[chat.messages.length - 1];
  if (!last || last.from !== 'me' || chat.kind === 'manager') return '';
  return `<span class="ticks ${last.read ? 'read' : ''}">${last.read ? '✓✓' : '✓'}</span>`;
}

function rightBottom(chat) {
  if (chat.unread) return `<span class="badge ${isMuted(chat) ? 'muted' : ''}">${chat.unread}</span>`;
  if (chat.kind !== 'customer') return '';
  if (chat.status === 'grading') return '<span class="cr-meta">⏳</span>';
  if (chat.status === 'ended') return chat.result ? `<span class="cr-meta" style="color:var(--star)">${starsText(chat.result.stars)}</span>` : '';
  const cs = chat.cs;
  if (cs.waitingSince != null) {
    const w = clock.now() - cs.waitingSince;
    const ideal = chat.rush ? cfg().rush.idealReplyMs : cfg().world.idealReplyMs;
    const cls = cs.nudged ? 'danger' : w > ideal ? 'warn' : '';
    return `<span class="wait-chip ${cls}" title="Customer is waiting for your reply">${waitWords(w)}</span>`;
  }
  return '';
}

function rowHtml(chat) {
  const selected = chat.id === S.activeChatId ? ' selected' : '';
  const vip = chat.kind === 'customer' && chat.customer.vip ? ' <span class="vip-crown" title="VIP client">👑</span>' : '';
  const verified = chat.kind !== 'customer' ? ' <span class="verified" title="Whiterock official">✔</span>' : '';
  const pin = chat.pinned && chat.kind === 'customer' ? '<span class="pin">📌</span>' : '';
  const mute = isMuted(chat) ? '<span class="pin" title="Muted">🔕</span>' : '';
  const ended = chat.kind === 'customer' && chat.status !== 'active' ? ' style="opacity:.78"' : '';
  const quick = `<div class="row-actions"><button data-quick="pin" title="${chat.pinned ? 'Unpin' : 'Pin'}">📌</button><button data-quick="archive" title="${chat.archived ? 'Unarchive' : 'Archive'}">🗄</button>${chat.unread ? '<button data-quick="read" title="Mark as read">✔</button>' : ''}</div>`;
  return `<div class="chat-row${selected}" data-id="${chat.id}"${ended}${chat.pinned ? ' draggable="true"' : ''}>${quick}
    ${chatAvatar(chat)}
    <div class="cr-body">
      <div class="cr-top"><span class="cr-name">${escapeHtml(displayName(chat))}${vip}${verified}</span>${mute}${pin}${ticks(chat)}<span class="cr-time">${listTime(chat.lastAt)}</span></div>
      <div class="cr-bottom"><span class="cr-preview">${preview(chat)}</span>${rightBottom(chat)}</div>
    </div>
  </div>`;
}

function hl(text, q) {
  const t = String(text || '').replace(/\s+/g, ' ');
  const i = t.toLowerCase().indexOf(q);
  if (i < 0) return escapeHtml(t.slice(0, 100));
  const start = Math.max(0, i - 30);
  return (start ? '…' : '') + escapeHtml(t.slice(start, i)) + '<mark>' + escapeHtml(t.slice(i, i + q.length)) + '</mark>' + escapeHtml(t.slice(i + q.length, i + q.length + 70));
}

export function renderSidebar() {
  renderRail();
  const el = document.getElementById('chatList');
  const q = S.search.trim().toLowerCase();
  const all = [...S.chats.values()].filter((c) => !c.deleted);
  let html = '';
  if (q) {
    // search: chats by name / @handle / username, then individual messages
    const people = sortChats(all.filter((c) => displayName(c).toLowerCase().includes(q) || ('@chat' + c.seq) === q || (c.customer && (c.customer.name.toLowerCase().includes(q) || (c.customer.username || '').toLowerCase().includes(q)))));
    if (people.length) html += '<div class="list-section">Chats</div>' + people.map(rowHtml).join('');
    const hits = [];
    for (const c of all) for (const m of c.messages) if (m.text && m.from !== 'sys' && m.text.toLowerCase().includes(q)) hits.push([c, m]);
    hits.sort((a, b) => b[1].t - a[1].t);
    if (hits.length) {
      html += `<div class="list-section">Messages · ${hits.length}</div>` + hits.slice(0, 60).map(([c, m]) => `<div class="chat-row hit" data-id="${c.id}" data-msg="${m.id}">${chatAvatar(c)}<div class="cr-body"><div class="cr-top"><span class="cr-name">${escapeHtml(displayName(c))}</span><span class="cr-time">${listTime(m.t)}</span></div><div class="cr-bottom"><span class="cr-preview">${m.from === 'me' ? '<span style="color:var(--accent)">You:</span> ' : ''}${hl(m.text, q)}</span></div></div></div>`).join('');
    }
    if (!people.length && !hits.length) html += '<div class="list-empty">Nothing found</div>';
  } else {
    const f = FOLDERS.find((x) => x.id === S.folder) || FOLDERS[0];
    const list = sortChats(all.filter(f.test));
    if (f.id !== 'all') html += `<div class="list-section">${f.ic} ${f.label}</div>`;
    html += list.map(rowHtml).join('');
    if (!list.length) html += `<div class="list-empty">${f.id === 'unread' ? 'All caught up ✨' : 'No chats here'}</div>`;
  }
  if (S.netDown) html = '<div class="net-banner"><span class="spin"></span>Connecting…</div>' + html;
  el.innerHTML = html;
}

export function renderStatusBar() {
  const p = S.profile;
  const W = cfg().world;
  const d = clock.today();
  const open = openCount();
  const vac = world.vacation();
  const rush = world.rushStatus();
  const load = world.loadMult();
  let extra = '';
  if (vac) extra += `<span title="Time off: no new customers, open chats paused">🌴 off until ${new Date(vac.end).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>`;
  if (rush.active) extra += `<span title="Rush shift: customers still to come" style="color:var(--warning)">⚡ rush · ${rush.left} to come</span>`;
  if (load !== 1 && !vac) extra += `<span title="Set by your manager until midnight">${load < 1 ? '🌤 lighter day' : '📈 heavier day'}</span>`;
  const keyWarn = !S.settings.hasKey ? '<span style="color:var(--danger)">no API key</span>' : '';
  const pres = p.presence || 'online';
  document.getElementById('statusBar').innerHTML =
    `<button class="status-toggle" id="presenceBtn" title="Your status (Diane and the team see it)"><span class="pres ${pres}"></span>${pres[0].toUpperCase() + pres.slice(1)}</button>` +
    `<button class="status-toggle" id="queueBtn" title="Open chats (max ${W.openCap}) — click for the queue"><span class="dot ${open < W.openCap ? 'on' : ''}"></span>💬 ${open}/${W.openCap}</button>` +
    `<span title="Customers who wrote in today (daily cap ${world.capToday()})">📨 ${d.arrivals || 0}/${world.capToday()}</span>${extra}${keyWarn}` +
    `<span class="bal" title="Balance">${money(p.balance)}</span>`;
}

export function bindSidebar() {
  const list = document.getElementById('chatList');
  list.addEventListener('click', (e) => {
    const row = e.target.closest('.chat-row');
    if (!row) return;
    const quick = e.target.closest('[data-quick]');
    if (quick) {
      e.stopPropagation();
      const chat = S.chats.get(row.dataset.id);
      if (!chat) return;
      if (quick.dataset.quick === 'pin') chat.pinned = !chat.pinned;
      else if (quick.dataset.quick === 'archive') { chat.archived = !chat.archived; if (chat.archived && S.activeChatId === chat.id && S.folder !== 'archive') S.activeChatId = null; }
      else if (quick.dataset.quick === 'read') chat.unread = 0;
      touchChat(chat);
      ui.refresh(true);
      return;
    }
    ui.openChat(row.dataset.id);
    if (row.dataset.msg) ui.jumpToMessage?.(row.dataset.msg);
  });
  list.addEventListener('contextmenu', (e) => {
    const row = e.target.closest('.chat-row');
    if (!row || !row.dataset.id) return;
    e.preventDefault();
    ui.chatContextMenu(row.dataset.id, e.clientX, e.clientY);
  });
  // drag pinned chats to reorder them
  let dragId = null;
  list.addEventListener('dragstart', (e) => { const row = e.target.closest('.chat-row[draggable]'); if (row) { dragId = row.dataset.id; e.dataTransfer.effectAllowed = 'move'; } });
  list.addEventListener('dragover', (e) => { if (dragId && e.target.closest('.chat-row[draggable]')) e.preventDefault(); });
  list.addEventListener('drop', (e) => {
    const row = e.target.closest('.chat-row[draggable]');
    if (!dragId || !row || row.dataset.id === dragId) { dragId = null; return; }
    e.preventDefault();
    const pinned = sortChats([...S.chats.values()].filter((c) => c.pinned && !c.deleted));
    const from = pinned.findIndex((c) => c.id === dragId);
    const to = pinned.findIndex((c) => c.id === row.dataset.id);
    const [moved] = pinned.splice(from, 1);
    pinned.splice(to, 0, moved);
    pinned.forEach((c, i) => { c.pinOrder = i; touchChat(c); });
    dragId = null;
    renderSidebar();
  });
  document.getElementById('rail').addEventListener('click', (e) => {
    const f = e.target.closest('[data-folder]');
    if (f) { S.folder = f.dataset.folder; S.search = ''; document.getElementById('search').value = ''; renderSidebar(); return; }
    if (e.target.closest('[data-rail="settings"]')) ui.openSettings();
  });
  const search = document.getElementById('search');
  search.addEventListener('input', () => { S.search = search.value; renderSidebar(); });
  document.getElementById('statusBar').addEventListener('click', (e) => {
    if (e.target.closest('#queueBtn')) ui.showQueue();
    const pb = e.target.closest('#presenceBtn');
    if (pb) {
      const r = pb.getBoundingClientRect();
      const set = (v) => () => { S.profile.presence = v; touchProfile(); renderStatusBar(); };
      ui.showMenu?.([{ ic: '🟢', label: 'Online', run: set('online') }, { ic: '🟡', label: 'Away', run: set('away') }, { ic: '🔴', label: 'Busy', run: set('busy') }], r.left, r.top - 130);
    }
  });
}
