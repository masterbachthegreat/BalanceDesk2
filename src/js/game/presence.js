// When customers are awake, busy and online. Each persona has a timezone (UTC offset, hours)
// and a daily rhythm; while awake they check their phone at random (a Poisson process),
// which is when they read your messages.
import { cfg, rand } from '../core/state.js';

const SCHEDULES = {
  early: { wake: 5.5, sleep: 21.5, busy: [7, 15] },
  regular: { wake: 7, sleep: 23.5, busy: [9, 17] },
  student: { wake: 9.5, sleep: 1.5, busy: [10, 15] },
  night: { wake: 13, sleep: 5, busy: [21, 3] },
  retired: { wake: 7, sleep: 22, busy: null },
  executive: { wake: 6, sleep: 0.5, busy: [8, 19] },
};

function inRange(h, a, b) { return a <= b ? h >= a && h < b : h >= a || h < b; }

function local(persona, t) {
  const d = new Date(t + (persona.tz ?? 0) * 3600000);
  return { hour: d.getUTCHours() + d.getUTCMinutes() / 60, weekday: d.getUTCDay() >= 1 && d.getUTCDay() <= 5 };
}

export function schedule(persona) { return SCHEDULES[persona.schedule] || SCHEDULES.regular; }

export function isAwake(persona, t) {
  const s = schedule(persona);
  return inRange(local(persona, t).hour, s.wake, s.sleep);
}

export function isBusy(persona, t) {
  const s = schedule(persona);
  const l = local(persona, t);
  return !!s.busy && l.weekday && inRange(l.hour, s.busy[0], s.busy[1]);
}

// How often (per hour) the customer opens the chat app at time t.
export function checkRate(persona, t) {
  if (!isAwake(persona, t)) return 0;
  const W = cfg().world;
  const base = isBusy(persona, t) ? W.checksPerHourBusy : W.checksPerHourFree;
  return base * (W.readSpeedMult[persona.read] || 1);
}

// Weight for "is this person likely to write to us right now" (used when picking who arrives).
export function arrivalWeight(persona, t) {
  if (!isAwake(persona, t)) return 0.03;
  return isBusy(persona, t) ? 0.5 : 1;
}

// Next time the customer checks their phone after `from` (searches up to 3 days ahead).
export function nextCheck(persona, from) {
  const step = 5 * 60000;
  for (let t = from; t < from + 3 * 86400000; t += step) {
    const r = checkRate(persona, t);
    if (r > 0 && Math.random() < 1 - Math.exp(-r * step / 3600000)) return t + Math.random() * step;
  }
  return from + 86400000;
}

// First time the customer is awake at or after `from`.
export function nextAwake(persona, from) {
  for (let t = from; t < from + 2 * 86400000; t += 10 * 60000) if (isAwake(persona, t)) return t;
  return from;
}

// Log-normal sample with the given median (ms), clamped.
export function lognormal(median, sigma, min, max) {
  const z = Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
  return Math.max(min, Math.min(max, median * Math.exp(sigma * z)));
}

const SESSION_MULT = { student: 1.6, night: 1.5, retired: 1.2, regular: 1, early: 0.9, executive: 0.6 };

// How long the customer stays online once they open the app: a minute at work, often longer
// in the evening; students and night owls linger, executives dash in and out.
export function sessionLength(persona, t, engaged = false) {
  const W = cfg().world.session;
  let median = (isBusy(persona, t) ? W.busyMedianMin : W.freeMedianMin) * 60000;
  if (!isAwake(persona, t)) median = W.nightMedianMin * 60000;
  const h = local(persona, t).hour;
  if (h >= 19 && h < 24) median *= W.eveningMult;
  median *= (SESSION_MULT[persona.schedule] || 1) * (W.readMult[persona.read] || 1) * (engaged ? W.engagedMult : 1);
  return lognormal(median, W.sigma, W.minMs, W.maxMs);
}

// When did the customer last open the app in (from, to]? Searches backwards; null if never.
export function lastCheckBefore(persona, from, to) {
  const step = 5 * 60000;
  for (let t = to; t > from; t -= step) {
    const r = checkRate(persona, t);
    if (r > 0 && Math.random() < 1 - Math.exp(-r * step / 3600000)) return Math.max(from, t - Math.random() * step);
  }
  return null;
}
