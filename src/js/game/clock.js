// Game time is real wall-clock time, like Telegram: the world keeps going while the app
// is closed and is caught up on launch (see world.js). `activeMs` only counts time the app
// is open, for the "time on shift" stats. Tests can shift time with skip().
import { S } from '../core/state.js';
import { dateKey } from '../core/format.js';

let last = performance.now();
let offset = 0;

export function now() { return Date.now() + offset; }

export function skip(ms) { offset += ms; } // for tests and debugging only

export function advance() {
  const t = performance.now();
  let d = t - last;
  last = t;
  if (d < 0) d = 0;
  if (d > 5000) d = 5000;
  S.profile.activeMs += d;
  today().activeMs += d;
  return d;
}

export function today(t = now()) {
  const p = S.profile;
  p.days ||= {};
  const k = dateKey(t);
  return (p.days[k] ||= { activeMs: 0, chats: 0, earned: 0, scoreSum: 0, starsSum: 0, arrivals: 0, missed: 0 });
}

// Local midnight after time t.
export function nextMidnight(t = now()) {
  const d = new Date(t);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}
