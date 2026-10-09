// Picks a customer personality from data/personalities.json, avoiding recent repeats.
// With a time `at`, people who are awake (and not at work) then are more likely to write.
import { S, pick } from '../core/state.js';
import { arrivalWeight } from './presence.js';

const COLORS = ['#e17076', '#7bc862', '#e5ca77', '#65aadd', '#a695e7', '#ee7aae', '#6ec9cb', '#faa774'];

export function pickPersona(vip, at = null) {
  const all = S.data.personalities;
  let pool = all.filter((p) => !!p.vip === !!vip);
  if (!pool.length) pool = all;
  const recent = new Set(S.profile.recentPersonas || []);
  const busy = new Set([...S.chats.values()].filter((c) => c.kind === 'customer' && c.status === 'active').map((c) => c.customer.personaId));
  const fresh = pool.filter((p) => !recent.has(p.id) && !busy.has(p.id));
  const persona = at == null ? pick(fresh.length ? fresh : pool) : weightedPick(fresh.length ? fresh : pool, (p) => arrivalWeight(p, at));
  S.profile.recentPersonas = [persona.id, ...(S.profile.recentPersonas || [])].slice(0, 30);
  return persona;
}

function weightedPick(list, w) {
  const ws = list.map(w);
  let r = Math.random() * ws.reduce((s, x) => s + x, 0);
  for (let i = 0; i < list.length; i++) if ((r -= ws[i]) <= 0) return list[i];
  return list[list.length - 1];
}

export function colorFor(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}
