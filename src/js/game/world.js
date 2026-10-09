// The world clock: customers write in through the day (more when they're awake), keep
// living while the app is closed, and everything that happened meanwhile is replayed
// on launch (catchUp). Also rush shifts, lighter/heavier days and time off (set by your boss).
//
// profile.world = {
//   nextArrivalAt  next organic customer (wall time)
//   lastSeen       last time the app was running (for the "while you were away" summary)
//   load           { mult, label, until } a lighter or heavier day, until midnight
//   rush           { left, nextAt, cooldownUntil } a rush shift in progress
//   vacation       { start, end } time off: no customers, open chats are frozen
//   transfers      { day, count } chats handed to colleagues today
// }
import { S, cfg, rand, randInt, touchProfile } from '../core/state.js';
import { waitWords, plural } from '../core/format.js';
import * as clock from './clock.js';
import * as presence from './presence.js';
import * as shop from './shop.js';
import { activeCustomerChats, customerChats, handle, sysMessage } from './chats.js';
import { spawnCustomer, advanceChat, advanceTimers, speedUpReads, shiftTimers, openCount, ambientPresence, backfillPresence } from './customers.js';
import { tickMemos } from './manager.js';
import { botSay } from './bot.js';
import { ui } from '../ui/registry.js';
import * as boss from './boss.js';
import * as team from './team.js';
import { maybeDigest } from './mentor.js';
import { deliverDue } from './scheduled.js';

const DAY = 86400000;
const HOUR = 3600000;

export function state() {
  const p = S.profile;
  p.world ||= {};
  const w = p.world;
  w.rush ||= { left: 0, nextAt: null, cooldownUntil: 0 };
  w.transfers ||= { day: null, count: 0 };
  return w;
}

// ---------- arrival rate ----------
// Average "likely to write now" weight over all personas at time t.
function crowd(t) {
  const all = S.data.personalities;
  let s = 0;
  for (const p of all) s += presence.arrivalWeight(p, t);
  return s / all.length;
}

let norm = null;
function normaliser() {
  if (norm == null) {
    let s = 0, n = 0;
    const t0 = Date.UTC(2026, 0, 5); // any Monday: a full week, hourly
    for (let h = 0; h < 7 * 24; h++, n++) s += crowd(t0 + h * HOUR + 30 * 60000);
    norm = s / n || 1;
  }
  return norm;
}

export function loadMult(t = clock.now()) {
  const l = state().load;
  return l && t < l.until ? l.mult : 1;
}

export function capToday(t = clock.now()) {
  return Math.round(cfg().world.dailyCap * loadMult(t));
}

function ratePerMs(t) {
  return (cfg().world.dailyTarget / DAY) * (crowd(t) / normaliser()) * loadMult(t);
}

// Next arrival after `from` (non-homogeneous Poisson process, by thinning).
function sampleNext(from) {
  const maxMult = Math.max(1, loadMult(from), cfg().boss.loadMults.heavier);
  const lmax = (cfg().world.dailyTarget / DAY) * (1 / normaliser()) * maxMult;
  let t = from;
  for (let i = 0; i < 5000; i++) {
    t += -Math.log(1 - Math.random()) / lmax;
    if (Math.random() < ratePerMs(t) / lmax) return t;
  }
  return t;
}

function onVacation(t) {
  const v = state().vacation;
  return !!v && t >= v.start && t < v.end;
}

// Organic arrivals up to `now`. `catching` = replaying time the app was closed.
function processArrivals(now, catching = false) {
  const w = state();
  if (!S.settings.hasKey) { w.nextArrivalAt = null; return []; }
  if (w.nextArrivalAt == null) {
    // the very first customer shows up quickly; afterwards the day's rhythm takes over
    w.nextArrivalAt = customerChats().length ? sampleNext(now) : now + rand(15000, 45000);
    touchProfile();
  }
  const W = cfg().world;
  if (w.nextArrivalAt < now - W.catchUpWindowMs) w.nextArrivalAt = sampleNext(now - W.catchUpWindowMs);
  const spawned = [];
  let guard = 0;
  while (w.nextArrivalAt <= now && guard++ < 200) {
    const t = w.nextArrivalAt;
    w.nextArrivalAt = sampleNext(t);
    if (onVacation(t)) continue;
    if (catching) for (const c of activeCustomerChats()) advanceTimers(c, t); // who's still open at t?
    const day = clock.today(t);
    if (day.arrivals >= capToday(t) || openCount() >= W.openCap) continue; // queue full: they try elsewhere
    day.arrivals++;
    spawned.push(spawnCustomer({ at: t }));
  }
  if (spawned.length || guard) touchProfile();
  return spawned;
}

// ---------- rush shifts ----------
export function rushStatus(t = clock.now()) {
  const r = state().rush;
  return { active: r.left > 0, left: r.left, cooldownUntil: r.cooldownUntil || 0, ready: !(r.left > 0) && t >= (r.cooldownUntil || 0) };
}

export function startRush(t = clock.now()) {
  const R = cfg().rush;
  const r = state().rush;
  r.left = randInt(R.customers[0], R.customers[1]) + shop.effectSum('rushExtra');
  r.nextAt = t + rand(5000, 20000);
  r.cooldownUntil = t + Math.max(HOUR, R.cooldownMs - shop.effectSum('rushCooldownCut'));
  touchProfile();
  return r.left;
}

function tickRush(now) {
  const r = state().rush;
  if (!(r.left > 0) || now < r.nextAt) return;
  if (now - r.nextAt > 10 * 60000) { r.left = 0; touchProfile(); return; } // the app was closed: the rush is over
  if (openCount() >= cfg().world.openCap) { r.nextAt = now + 30000; return; }
  const chat = spawnCustomer({ at: now, rush: true });
  clock.today(now).arrivals++;
  r.left -= 1;
  const [a, b] = cfg().rush.gapMs;
  r.nextAt = now + rand(a, b);
  touchProfile();
  if (!S.activeChatId) ui.openChat?.(chat.id);
}

// ---------- lighter / heavier days ----------
export function setLoad(kind, t = clock.now()) {
  const w = state();
  const mult = cfg().boss.loadMults[kind];
  w.load = { mult, label: kind, until: clock.nextMidnight(t) };
  w.nextArrivalAt = sampleNext(t);
  touchProfile();
}

// ---------- time off ----------
export function startVacation(hours, t = clock.now()) {
  const w = state();
  w.vacation = { start: t, end: t + hours * HOUR };
  w.rush.left = 0;
  for (const c of activeCustomerChats()) {
    sysMessage(c, `🌴 You're on leave until ${new Date(w.vacation.end).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}. This customer was told you'll be back then.`, { t });
  }
  touchProfile();
}

export function endVacation(at = clock.now()) {
  const w = state();
  const v = w.vacation;
  if (!v) return;
  const end = Math.min(at, v.end);
  const len = Math.max(0, end - v.start);
  w.vacation = null;
  shiftTimers(len);
  w.nextArrivalAt = sampleNext(end);
  touchProfile();
}

export function vacation() {
  const v = state().vacation;
  return v && clock.now() < v.end ? v : null;
}

// ---------- transfers (counted per day) ----------
export function transfersToday(t = clock.now()) {
  const tr = state().transfers;
  const k = new Date(t).toDateString();
  if (tr.day !== k) { tr.day = k; tr.count = 0; }
  return tr.count;
}
export function countTransfer() { transfersToday(); state().transfers.count++; touchProfile(); }

// ---------- the live loop ----------
export function tick(dt) {
  if (!S.profile || S.catchingUp) return;
  const now = clock.now();
  const w = state();
  w.lastSeen = now;
  const v = w.vacation;
  if (v && now >= v.end) endVacation(v.end);
  deliverDue(now);
  boss.tick(now);
  team.tick(now);
  tickMemos(now);
  maybeDigest(now);
  if (vacation()) return;
  speedUpReads(dt);
  ambientPresence(dt, now);
  const spawned = processArrivals(now);
  if (spawned.length && !S.activeChatId) ui.openChat?.(spawned[0].id);
  tickRush(now);
  for (const chat of activeCustomerChats()) advanceChat(chat, now);
}

// ---------- catching up after the app was closed ----------
export async function catchUp() {
  const w = state();
  const now = clock.now();
  const since = w.lastSeen || now;
  S.catchingUp = true;
  try {
    const v = w.vacation;
    if (v && now >= v.end) endVacation(v.end);
    deliverDue(now); // scheduled messages go out at their own time
    if (!vacation()) {
      processArrivals(now, true);
      for (const c of activeCustomerChats()) advanceTimers(c, now);
      if (now - since > 10 * 60000) backfillPresence(since, now);
      if (w.rush.left > 0 && now - (w.rush.nextAt || 0) > 10 * 60000) w.rush.left = 0;
    }
    tickMemos(now);
    boss.tick(now);
    if (!vacation()) await Promise.all(activeCustomerChats().map((c) => advanceChat(c, now)));
  } finally {
    S.catchingUp = false;
    w.lastSeen = clock.now();
    touchProfile();
  }
  summary(since, now);
}

function summary(since, now) {
  if (now - since < 10 * 60000) return;
  const chats = customerChats();
  const arrived = chats.filter((c) => c.createdAt > since);
  const replied = chats.filter((c) => c.createdAt <= since && c.messages.some((m) => m.from === 'them' && m.t > since && m.kind !== 'nudge'));
  const chased = chats.filter((c) => c.messages.some((m) => m.kind === 'nudge' && m.t > since));
  const gone = chats.filter((c) => c.endedAt > since && ['timeout', 'missed', 'left'].includes(c.endReason));
  const happy = chats.filter((c) => c.endedAt > since && c.endReason === 'satisfied');
  if (!arrived.length && !replied.length && !chased.length && !gone.length && !happy.length) return;
  const lines = [];
  if (arrived.length) lines.push(`📨 ${plural(arrived.length, 'new customer')} wrote in`);
  if (replied.length) lines.push(`💬 ${plural(replied.length, 'customer')} replied to you`);
  if (happy.length) lines.push(`✅ ${plural(happy.length, 'customer')} ended satisfied`);
  if (chased.length) lines.push(`🔔 ${plural(chased.length, 'customer')} chased you: ${chased.slice(0, 5).map(handle).join(', ')}`);
  if (gone.length) lines.push(`🚪 ${plural(gone.length, 'customer')} gave up: ${gone.slice(0, 5).map(handle).join(', ')}`);
  const waiting = activeCustomerChats().filter((c) => c.cs.waitingSince != null).length;
  botSay(`🌙 **While you were away** (${waitWords(now - since)})\n${lines.join('\n')}\n\n${waiting ? `${plural(waiting, 'customer')} ${waiting === 1 ? 'is' : 'are'} waiting for you.` : 'Nobody is waiting on you right now.'}`, {
    buttons: [[{ label: '📋 Show queue', action: 'cmd', value: '/queue' }]],
  });
}
