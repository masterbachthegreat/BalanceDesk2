// BalanceDesk renderer entry point: loads the save, wires UI and runs the game loop.
import { S, cfg, flushAll, touchProfile, saveProfile, rand } from './core/state.js';
import { on } from './core/bus.js';
import { money } from './core/format.js';
import * as clock from './game/clock.js';
import * as shop from './game/shop.js';
import { newChat, getChat, activeCustomerChats, customerChats, addMessage, markRead, handle } from './game/chats.js';
import { spawnCustomer, tickCustomers, freeSlots, maxSlots, resumeAfterLoad } from './game/customers.js';
import { botSay } from './game/bot.js';
import { tickMemos, triggerMemo } from './game/manager.js';
import { ui } from './ui/registry.js';
import { renderSidebar, renderStatusBar, bindSidebar } from './ui/sidebar.js';
import { renderChatPane, updateChatPane, tickChatPane, bindChatPane, prefillInput } from './ui/chatview.js';
import { chatContextMenu, bindContextMenu } from './ui/contextmenu.js';
import { onboardingModal, settingsModal, profileModal, shopModal, closeModal } from './ui/modals.js';
import { bindDrawer, closeDrawer } from './ui/drawer.js';
import { openCalculator, openNotepad } from './ui/floating.js';
import { toast, ping } from './ui/toast.js';

function newProfile(name) {
  return {
    version: 1,
    name,
    createdAt: Date.now(),
    balance: S.data.config.startingBalance || 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    rank: 1,
    rankHistory: [{ rank: 1, at: Date.now() }],
    rankChats: [],
    stats: { completed: 0, scoreSum: 0, starsSum: 0, fiveStars: 0, closedByMe: 0, lost: 0, vipServed: 0, bestPay: 0 },
    owned: {},
    equipped: { theme: 'theme-night', wallpaper: null, border: null, nameColor: null, title: null },
    avatar: null,
    status: 'online',
    activeMs: 0,
    days: {},
    seenQuestions: {},
    recentPersonas: [],
    modifiers: [],
    memo: { nextAtA: null, sent: [] },
    nextCustomerA: null,
    vipNext: false,
    counters: { chatSeq: 0 },
    streak: { low: 0, high: 0 },
    notes: '',
    calcHistory: [],
    windows: {},
  };
}

function migrate(p) {
  const d = newProfile(p.name || 'Agent');
  for (const k of Object.keys(d)) if (p[k] === undefined) p[k] = d[k];
  for (const k of Object.keys(d.stats)) if (p.stats[k] === undefined) p.stats[k] = 0;
  for (const k of Object.keys(d.equipped)) if (p.equipped[k] === undefined) p.equipped[k] = d.equipped[k];
  return p;
}

function ensureSystemChats() {
  if (!getChat('bot')) newChat('bot', { id: 'bot', title: 'Whiterock Desk Bot' });
  if (!getChat('mentor')) newChat('mentor', { id: 'mentor', title: 'Mentor' });
  if (!getChat('manager')) newChat('manager', { id: 'manager', title: 'Whiterock Management' });
}

function welcome() {
  const p = S.profile;
  const keyNote = S.settings.hasKey
    ? 'Your OpenRouter key is set, so customers will start arriving in a few seconds.'
    : '⚠ **First, add your OpenRouter API key** — customers can\'t talk without it.';
  botSay(`👋 Welcome to Whiterock, **${p.name}**!\nI'm the Desk Bot. Customers will message you with finance, accounting, statistics and maths questions. Keep chatting until they're satisfied: you're graded on the answer (AI score /100) and on service (★1–5), and paid when each chat ends.\n\n${keyNote}\n\nUseful: /help · /rank · /payformula · /shop · /spendings\nRight-click a chat to close, archive or delete it.`, {
    buttons: S.settings.hasKey ? [[{ label: '📖 All commands', action: 'cmd', value: '/help' }]] : [[{ label: '⚙ Open Settings', action: 'ui', value: 'settings' }], [{ label: '📖 All commands', action: 'cmd', value: '/help' }]],
  });
  addMessage(getChat('mentor'), {
    from: 'them',
    text: `Hi ${p.name}, welcome aboard. I'm your mentor.\n\nAsk me anything: a concept you're unsure about, how to explain something to a customer, or a quick check of your maths. I'll draw graphs when they help.\n\nTo show me a conversation, mention it with **@** (for example **@chat1**) and I'll read the whole chat.`,
  });
  triggerMemo('welcome');
}

// ---------- rendering (batched) ----------
let pending = { sidebar: false, chats: new Set(), status: false };
let rafQueued = false;
function schedule() {
  if (rafQueued) return;
  rafQueued = true;
  requestAnimationFrame(() => {
    rafQueued = false;
    if (pending.sidebar) renderSidebar();
    if (pending.status) renderStatusBar();
    for (const id of pending.chats) updateChatPane(id);
    pending = { sidebar: false, chats: new Set(), status: false };
    updateTitle();
  });
}

function updateTitle() {
  const n = [...S.chats.values()].reduce((s, c) => s + (c.unread || 0), 0);
  document.title = (n ? `(${n}) ` : '') + 'BalanceDesk — Whiterock Support';
}

function refresh(full = false) {
  renderSidebar();
  renderStatusBar();
  if (full) renderChatPane();
  updateTitle();
}

// ---------- actions exposed to other modules ----------
function openChat(id) {
  const chat = getChat(id);
  if (!chat) return;
  if (chat.archived && !S.showArchived) S.showArchived = true;
  S.activeChatId = id;
  renderChatPane();
  renderSidebar();
  updateTitle();
}

function setStatus(st) {
  S.profile.status = st;
  if (st !== 'online') S.profile.nextCustomerA = null;
  touchProfile();
  renderStatusBar();
}

function callNextCustomer() {
  if (!S.settings.hasKey) {
    botSay('⚠ Add your OpenRouter API key first.', { buttons: [[{ label: '⚙ Open Settings', action: 'ui', value: 'settings' }]] });
    return;
  }
  if (freeSlots() <= 0) {
    botSay(`📵 All your lines are busy (${maxSlots()}/${maxSlots()}). Finish a chat first — or buy a Second Monitor in the /shop for an extra line.`);
    return;
  }
  const chat = spawnCustomer();
  S.profile.nextCustomerA = null;
  openChat(chat.id);
}

function askMentorAbout(chatId) {
  const c = getChat(chatId);
  if (!c) return;
  openChat('mentor');
  prefillInput(handle(c) + ' ');
}

function toggleDayNight() {
  const day = document.documentElement.dataset.theme === 'day';
  shop.equip(day ? 'theme-night' : 'theme-day');
}

Object.assign(ui, {
  openChat, refresh, setStatus, callNextCustomer, askMentorAbout, toggleDayNight, chatContextMenu,
  openSettings: settingsModal, openProfile: profileModal, openShop: (c) => shopModal(c),
  openCalculator: () => { if (!openCalculator()) shopModal('tools'); },
  openNotepad: () => { if (!openNotepad()) shopModal('tools'); },
  toast,
});

// ---------- game loop ----------
function arrivals() {
  const p = S.profile;
  const A = cfg().arrival;
  if (p.status !== 'online' || !S.settings.hasKey || freeSlots() <= 0) { p.nextCustomerA = null; return; }
  if (p.nextCustomerA == null) {
    const idle = activeCustomerChats().length === 0;
    p.nextCustomerA = clock.now() + (customerChats().length === 0 ? A.firstMs : idle ? rand(A.firstMs, A.minMs) : rand(A.minMs, A.maxMs));
    return;
  }
  if (clock.now() >= p.nextCustomerA) {
    p.nextCustomerA = null;
    const chat = spawnCustomer();
    if (!S.activeChatId) openChat(chat.id);
  }
}

let ticks = 0;
function tick() {
  if (!S.profile) return;
  clock.advance();
  tickCustomers();
  arrivals();
  tickMemos();
  ticks++;
  if (ticks % 2 === 0) { renderSidebar(); renderStatusBar(); tickChatPane(); }
  if (ticks % 30 === 0) saveProfile();
}

// ---------- notifications ----------
function onIncoming(chat) {
  if (S.settings.sound && !chat.messages[chat.messages.length - 1]?.silent) ping();
  if (S.settings.notifications) window.api.flash();
  if (S.activeChatId !== chat.id && chat.kind === 'customer') {
    const m = chat.messages[chat.messages.length - 1];
    const first = chat.messages.filter((x) => x.from === 'them').length === 1;
    toast(first ? `New customer: ${chat.customer.name}${chat.customer.vip ? ' 👑' : ''}` : chat.customer.name, (m?.text || '').slice(0, 90), first ? 'good' : '', () => openChat(chat.id));
  }
}

// ---------- boot ----------
async function boot() {
  S.data = await window.api.gameData();
  S.settings = await window.api.settings.get();
  const saved = await window.api.store.read('profile.json');
  const chats = await window.api.store.readAll('chats');
  for (const c of chats) S.chats.set(c.id, c);

  let fresh = false;
  if (saved) {
    S.profile = migrate(saved);
  } else {
    fresh = true;
    S.profile = newProfile('Agent');
  }
  shop.applyCosmetics();
  ensureSystemChats();

  bindSidebar();
  bindChatPane();
  bindContextMenu();
  bindDrawer();

  on('chat', (id) => { pending.sidebar = true; if (id) pending.chats.add(id); schedule(); });
  on('list', () => { pending.sidebar = true; schedule(); });
  on('profile', () => { pending.status = true; pending.sidebar = true; schedule(); });
  on('settings', () => { pending.status = true; schedule(); });
  on('cosmetics', () => { renderChatPane(); renderSidebar(); });
  on('incoming', onIncoming);
  on('payout', (chat) => {
    if (S.settings.sound) ping('money');
    if (S.activeChatId !== chat.id) toast(`${money(chat.result.payout.total, { plus: true })} from ${chat.customer.name}`, `Score ${chat.result.aiScore}/100 · ${chat.result.stars}★`, 'good', () => openChat(chat.id));
    pending.status = true; schedule();
  });
  on('purchase', () => { pending.status = true; schedule(); });
  on('modalClosed', () => { const c = getChat(S.activeChatId); if (c) markRead(c); });

  window.addEventListener('focus', () => { S.focused = true; const c = getChat(S.activeChatId); if (c) markRead(c); });
  window.addEventListener('blur', () => { S.focused = false; });
  window.addEventListener('beforeunload', () => flushAll());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); closeDrawer(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('search').focus(); }
  });

  refresh(true);

  if (fresh) {
    const name = await onboardingModal();
    S.profile.name = name;
    S.settings = await window.api.settings.get();
    touchProfile();
    welcome();
    openChat('bot');
  } else {
    resumeAfterLoad();
    openChat(S.profile.lastOpenChat && getChat(S.profile.lastOpenChat) ? S.profile.lastOpenChat : 'bot');
  }
  setInterval(tick, 500);
  setInterval(() => { S.profile.lastOpenChat = S.activeChatId; }, 5000);
  window.__bd = { S, spawnCustomer, clock }; // handy for debugging in DevTools
}

boot().catch((e) => {
  console.error(e);
  document.body.innerHTML = `<pre style="color:#e5534b;padding:20px;white-space:pre-wrap">BalanceDesk failed to start:\n${e.stack || e}</pre>`;
});
