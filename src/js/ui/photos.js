// Character photos from the player's avatars/ folder (☰ → Character photos).
// A file named after someone ("diane.jpg", "Margaret Ellis.png", "p-margaret-ellis.jpg") is theirs.
// Any other photos form a pool: a character without their own photo gets an unused one from it,
// and keeps it (profile.photoMap). No photo → the usual initials / emoji circle.
import { S, touchProfile } from '../core/state.js';
import { emit } from '../core/bus.js';

let files = [];
let named = null; // normalised names that belong to a specific character

const norm = (s) => String(s || '').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/^(p|vip)-/, '').replace(/[^a-z0-9]/g, '');

const PEOPLE = () => [
  ['diane', ['Diane Whitfield', 'Diane']],
  ['mentor', ['Mentor']],
  ...(S.data.team || []).map((m) => [m.id, [m.name, m.name.split(' ')[0]]]),
  ...S.data.personalities.map((p) => [p.id, [p.name]]),
];

let signature = '';

// Re-reads the folder; only re-renders when something actually changed.
export async function loadPhotos() {
  let next = [];
  try { next = (await window.api.avatars?.()) || []; } catch { next = []; }
  named ||= new Set(PEOPLE().flatMap(([id, names]) => [id, ...names].map(norm)));
  const sig = next.map((f) => f.file + ':' + f.url.length).join('|');
  if (sig === signature) return;
  signature = sig;
  files = next;
  emit('photos');
}

export function photoCount() { return files.length; }

export function photoFor(id, names = []) {
  if (!files.length) return null;
  const want = new Set([id, ...names].map(norm));
  const own = files.find((f) => want.has(norm(f.file)));
  if (own) return own.url;
  const pool = files.filter((f) => !named.has(norm(f.file)));
  if (!pool.length) return null;
  const map = (S.profile.photoMap ||= {});
  const mine = map[id] && pool.find((f) => f.file === map[id]);
  if (mine) return mine.url;
  const used = new Set(Object.values(map));
  const free = pool.filter((f) => !used.has(f.file));
  if (!free.length) return null;
  const f = free[Math.floor(Math.random() * free.length)];
  map[id] = f.file;
  touchProfile();
  return f.url;
}

// Forget the pool assignments (☰ → Shuffle photos).
export function shufflePhotos() {
  S.profile.photoMap = {};
  touchProfile();
  emit('photos');
}
