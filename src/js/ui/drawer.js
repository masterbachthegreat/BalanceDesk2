// The ☰ side drawer.
import { S } from '../core/state.js';
import { escapeHtml, money } from '../core/format.js';
import { playerAvatar, playerNameHtml, playerTitle } from './avatar.js';
import { rankInfo } from '../game/progress.js';
import * as shop from '../game/shop.js';
import { ui } from './registry.js';

export function openDrawer() {
  const d = document.getElementById('drawer');
  const p = S.profile;
  const r = rankInfo(p.rank);
  const items = [
    ['👤', 'My Profile', () => ui.openProfile()],
    ['🛍', 'Company Store', () => ui.openShop()],
    ['🧮', 'Calculator', () => ui.openCalculator(), !shop.hasTool('calculator')],
    ['📝', 'Notepad', () => ui.openNotepad(), !shop.hasTool('notepad')],
    ['🤖', 'Desk Bot', () => ui.openChat('bot')],
    ['🎓', 'Mentor', () => ui.openChat('mentor')],
    ['💼', 'Manager (Diane)', () => ui.openChat('boss')],
    ['🌗', document.documentElement.dataset.theme === 'day' ? 'Night mode' : 'Day mode', () => ui.toggleDayNight()],
    ['⚙', 'Settings', () => ui.openSettings()],
    ['📂', 'Open save folder', () => window.api.openDataFolder()],
  ];
  d.innerHTML = `<div class="drawer-head">${playerAvatar('sm')}<div class="dname">${playerNameHtml()}</div><div class="dtitle">${escapeHtml(playerTitle() || r.title)} · rank ${p.rank}</div><div class="dbal">${money(p.balance)}</div></div>
    <div class="drawer-items">${items.map(([ic, label, , locked], i) => `<div class="drawer-item${locked ? ' locked' : ''}" data-i="${i}"><span class="ic">${ic}</span>${label}${locked ? ' 🔒' : ''}</div>`).join('')}</div>
    <div class="drawer-foot">BalanceDesk · Whiterock Support Desk</div>`;
  d.onclick = (e) => {
    const row = e.target.closest('.drawer-item');
    if (!row) return;
    closeDrawer();
    items[+row.dataset.i][2]();
  };
  d.classList.add('open');
  document.getElementById('drawerBackdrop').classList.remove('hidden');
}

export function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerBackdrop').classList.add('hidden');
}

export function bindDrawer() {
  document.getElementById('menuBtn').onclick = openDrawer;
  document.getElementById('drawerBackdrop').onclick = closeDrawer;
}
