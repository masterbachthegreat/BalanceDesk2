// Avatars for the player, customers and system chats.
import { S } from '../core/state.js';
import { escapeHtml } from '../core/format.js';
import * as shop from '../game/shop.js';

const SYSTEM = {
  bot: { emoji: '🤖', color: '#4f8fd6' },
  mentor: { emoji: '🎓', color: '#8e6cd1' },
  manager: { emoji: '🏢', color: '#2e8b72' },
};

function initials(name) {
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function chatAvatar(chat, size = '') {
  if (SYSTEM[chat.kind]) {
    const s = SYSTEM[chat.kind];
    return `<div class="avatar-wrap"><div class="avatar emoji ${size}" style="background:${s.color}">${s.emoji}</div></div>`;
  }
  const c = chat.customer;
  const inner = c.emoji ? escapeHtml(c.emoji) : escapeHtml(initials(c.name));
  const border = c.vip ? ' border-gold' : '';
  const online = chat.status === 'active' ? '<span class="online-dot"></span>' : '';
  return `<div class="avatar-wrap${border}"><div class="avatar ${c.emoji ? 'emoji ' : ''}${size}" style="background:${c.color}">${inner}</div>${online}</div>`;
}

export function playerAvatar(size = '') {
  const p = S.profile;
  const border = shop.equippedValue('border');
  const photo = p.avatar && shop.hasUnlock('photo') ? p.avatar : null;
  const style = photo ? `background-image:url('${photo}')` : 'background:#5288c1';
  return `<div class="avatar-wrap${border ? ' ' + border : ''}"><div class="avatar ${size}" style="${style}">${photo ? '' : escapeHtml(initials(p.name || '?'))}</div></div>`;
}

export function playerNameHtml() {
  const nc = shop.equippedValue('nameColor');
  return `<span class="${nc || ''}">${escapeHtml(S.profile.name)}</span>`;
}

export function playerTitle() {
  return shop.equippedValue('title');
}
