// The in-app clock. Real wall-clock time, but it only advances while the app is open,
// so customers don't lose patience (and timers don't run) while BalanceDesk is closed.
import { S } from '../core/state.js';
import { dateKey } from '../core/format.js';

let last = performance.now();

export function now() { return S.profile ? S.profile.activeMs : 0; }

export function advance() {
  const t = performance.now();
  let d = t - last;
  last = t;
  if (d < 0) d = 0;
  if (d > 5000) d = 5000; // laptop slept / window frozen: don't jump timers
  S.profile.activeMs += d;
  today().activeMs += d;
  return d;
}

export function today() {
  const p = S.profile;
  p.days ||= {};
  const k = dateKey();
  return (p.days[k] ||= { activeMs: 0, chats: 0, earned: 0, scoreSum: 0, starsSum: 0 });
}
