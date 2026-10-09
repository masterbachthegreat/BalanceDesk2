// BalanceDesk renderer entry point: loads the save, wires UI and runs the game loop.
import { S, flushAll, touchProfile, saveProfile } from './core/state.js';
import { on } from './core/bus.js';
import { money } from './core/format.js';
import * as clock from './game/clock.js';
import * as shop from './game/shop.js';
import { newChat, getChat, addMessage, markRead, handle } from './game/chats.js';
import { spawnCustomer, resumeAfterLoad, migrateChat } from './game/customers.js';
import { botSay, handleBotInput } from './game/bot.js';
import { triggerMemo } from './game/manager.js';
import * as world from './game/world.js';
import * as boss from './game/boss.js';
import * as team from './game/team.js';
import * as customers from './game/customers.js';
import * as mentor from './game/mentor.js';
import { ui } from './ui/registry.js';
import { renderSidebar, renderStatusBar, bindSidebar } from './ui/sidebar.js';
import { renderChatPane, updateChatPane, tickChatPane, bindChatPane, prefillInput } from './ui/chatview.js';
import { chatContextMenu, bindContextMenu } from './ui/contextmenu.js';
import { onboardingModal, settingsModal, profileModal, shopModal, closeModal, conceptModal, resetModal } from './ui/modals.js';
import { maybeMentorHint, reviewWithMentor } from './game/mentor.js';
import { bindDrawer, closeDrawer } from './ui/drawer.js';
import { openCalculator, openNotepad } from './ui/floating.js';
import { toast, ping } from './ui/toast.js';

function newProfile(name) {
  return {
    version: 2,
    name,
    createdAt: Date.now(),
    balance: S.data.config.startingBalance || 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    rank: 1,
    rankHistory: [{ rank: 1, at: Date.now() }],
    rankChats: [],
    stats: { completed: 0, scoreSum: 0, starsSum: 0, fiveStars: 0, closedByMe: 0, lost: 0, missed: 0, vipServed: 0, bestPay: 0 },
    owned: {},
    equipped: { theme: 'theme-night', wallpaper: null, border: null, nameColor: null, title: null },
    avatar: null,
    activeMs: 0,
    days: {},
    seenQuestions: {},
    recentPersonas: [],
    modifiers: [],
    memo: { nextAt: null, sent: [] },
    world: {},
    payRaise: 0,
    raiseAtChats: 0,
    recentScores: [],
    lastBossNag: 0,
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
  if ((p.version || 1) < 2) {
    // v0.3: the world runs on wall-clock time (see world.js)
    delete p.status;
    delete p.nextCustomerA;
    p.memo = { nextAt: null, sent: p.memo?.sent || [] };
    for (const c of S.chats.values()) if (c.kind === 'customer' && c.status === 'active') migrateChat(c);
    p.version = 2;
  }
  return p;
}

function ensureSystemChats() {
  if (!getChat('bot')) newChat('bot', { id: 'bot', title: 'Whiterock Desk Bot' });
  if (!getChat('mentor')) newChat('mentor', { id: 'mentor', title: 'Mentor' });
  if (!getChat('manager')) newChat('manager', { id: 'manager', title: 'Whiterock Management' });
  if (!getChat('boss')) newChat('boss', { id: 'boss', title: boss.BOSS.name });
  if (!getChat('team')) newChat('team', { id: 'team', title: '#support-team' });
}

function welcome() {
  const p = S.profile;
  const keyNote = S.settings.hasKey
    ? 'Your OpenRouter key is set, so your first customer will write in shortly.'
    : '⚠ **First, add your OpenRouter API key** — customers can\'t talk without it.';
  botSay(`👋 Welcome to Whiterock, **${p.name}**!\nI'm the Desk Bot. Customers message you with finance, accounting, statistics and maths questions, any time of day, like on a real messenger. Keep chatting until they're satisfied: you're graded on the answer (AI score /100) and on service (★1–5), and paid when each chat ends.\n\n⏰ The world keeps running when BalanceDesk is closed. Customers read your replies when they check their phones (twice as fast while the app is open). Answer within about **3 hours** for full pay; after **12 hours** they chase you, and later they give up. You can have up to 15 open chats.\n\n${keyNote}\n\nUseful: /help · /queue · /rank · /payformula · /shop · /spendings\nMessage your manager **Diane** for a rush shift or time off. Right-click a chat to close, archive or delete it.`, {
    buttons: S.settings.hasKey ? [[{ label: '📖 All commands', action: 'cmd', value: '/help' }]] : [[{ label: '⚙ Open Settings', action: 'ui', value: 'settings' }], [{ label: '📖 All commands', action: 'cmd', value: '/help' }]],
  });
  addMessage(getChat('mentor'), {
    from: 'them',
    text: `Hi ${p.name}, welcome aboard. I'm your mentor.\n\nAsk me anything: a concept you're unsure about, how to explain something to a customer, or a quick check of your maths. I'll draw graphs when they help.\n\nTo show me a conversation, mention it with **@** (for example **@chat1**) and I'll read the whole chat. If I see a customer keep pushing back on you, I'll drop you a hint here.`,
  });
  triggerMemo('welcome');
  boss.welcomeMessage();
  team.welcome();
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

let lastUnread = -1;
function updateTitle() {
  const n = [...S.chats.values()].reduce((s, c) => s + (c.unread || 0), 0);
  document.title = (n ? `(${n}) ` : '') + 'BalanceDesk — Whiterock Support';
  if (n !== lastUnread) { lastUnread = n; window.api.setUnread?.(n); }
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
  openChat, refresh, askMentorAbout,
  showQueue: () => { openChat('bot'); handleBotInput('/queue'); }, toggleDayNight, chatContextMenu,
  openSettings: settingsModal, openReset: resetModal, openProfile: profileModal, openShop: (c) => shopModal(c),
  openCalculator: () => { if (!openCalculator()) shopModal('tools'); },
  openNotepad: () => { if (!openNotepad()) shopModal('tools'); },
  toast,
  maybeMentorHint,
  openConcept: (id) => { const c = getChat(id); if (c) conceptModal(c); },
  reviewWithMentor: (id) => { const c = getChat(id); if (!c) return; openChat('mentor'); reviewWithMentor(c); },
});

// ---------- game loop ----------
let ticks = 0;
function tick() {
  if (!S.profile) return;
  const dt = clock.advance();
  world.tick(dt);
  ticks++;
  if (ticks % 2 === 0) { renderSidebar(); renderStatusBar(); tickChatPane(); }
  if (ticks % 30 === 0) saveProfile();
}

// ---------- notifications ----------
function onIncoming(chat) {
  const m = chat.messages[chat.messages.length - 1];
  if (m?.silent) return;
  if (S.settings.sound) ping();
  if (S.settings.notifications) window.api.flash();
  let title = null;
  let body = (m?.text || '').replace(/[*_`#>]/g, '').slice(0, 140);
  let kind = '';
  if (chat.kind === 'customer') {
    const first = chat.messages.filter((x) => x.from === 'them').length === 1;
    title = first ? `New customer: ${chat.customer.name}${chat.customer.vip ? ' 👑' : ''}` : chat.customer.name;
    kind = first ? 'good' : '';
  } else if (chat.kind === 'boss') title = '💼 Diane';
  else if (chat.kind === 'team') { title = '👥 #support-team'; body = `${team.member(m?.who)?.name.split(' ')[0] || ''}: ${body}`; }
  else if (chat.kind === 'mentor' && m?.kind === 'digest') title = '📅 Your weekly digest';
  if (!title) return;
  if (S.activeChatId !== chat.id) toast(title, body.slice(0, 90), kind, () => openChat(chat.id));
  if (S.settings.desktopNotifications !== false && !m?.silent && (!document.hasFocus() || document.hidden)) window.api.notify({ title, body, chatId: chat.id });
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
    S.profile = saved;
    migrate(saved);
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
  on('mentorHint', (chat) => {
    if (S.activeChatId !== 'mentor') toast('🎓 Mentor has a hint', `About ${chat.customer.name} (${handle(chat)})`, 'good', () => openChat('mentor'));
  });
  on('purchase', () => { pending.status = true; schedule(); });
  on('modalClosed', () => { const c = getChat(S.activeChatId); if (c) markRead(c); });

  window.api.onOpenChat?.((id) => openChat(id));
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
    boss.welcomeMessage();
    team.welcome();
    resumeAfterLoad();
    openChat(S.profile.lastOpenChat && getChat(S.profile.lastOpenChat) ? S.profile.lastOpenChat : 'bot');
  }
  window.__bd = { S, spawnCustomer, clock, world, boss, team, customers, mentor, ui }; // handy for debugging in DevTools (and used by tests)
  const caught = world.catchUp(); // replays the time the app was closed (world.tick waits for it)
  setInterval(tick, 500);
  setInterval(() => { S.profile.lastOpenChat = S.activeChatId; }, 5000);
  await caught;
}

boot().catch((e) => {
  console.error(e);
  document.body.innerHTML = `<pre style="color:#e5534b;padding:20px;white-space:pre-wrap">BalanceDesk failed to start:\n${e.stack || e}</pre>`;
});
