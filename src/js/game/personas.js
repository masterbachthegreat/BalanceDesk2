// Picks a customer personality from data/personalities.json, avoiding recent repeats.
import { S, pick } from '../core/state.js';

const COLORS = ['#e17076', '#7bc862', '#e5ca77', '#65aadd', '#a695e7', '#ee7aae', '#6ec9cb', '#faa774'];

export function pickPersona(vip) {
  const all = S.data.personalities;
  let pool = all.filter((p) => !!p.vip === !!vip);
  if (!pool.length) pool = all;
  const recent = new Set(S.profile.recentPersonas || []);
  const fresh = pool.filter((p) => !recent.has(p.id));
  const persona = pick(fresh.length ? fresh : pool);
  S.profile.recentPersonas = [persona.id, ...(S.profile.recentPersonas || [])].slice(0, 30);
  return persona;
}

export function colorFor(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}
