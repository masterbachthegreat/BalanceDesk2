// Formatting helpers for money, numbers, durations and times.

export function money(n, opts = {}) {
  const v = Math.round(n || 0);
  const s = Math.abs(v).toLocaleString('en-US');
  return (v < 0 ? '-' : opts.plus && v > 0 ? '+' : '') + '$' + s;
}

export function num(n, dec = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  if (!Number.isFinite(n)) return n > 0 ? '∞' : '-∞';
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// Smart number: integers with separators, otherwise up to `dec` decimals (trailing zeros trimmed).
export function smart(n, dec = 4) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  if (!Number.isFinite(n)) return n > 0 ? '∞' : '-∞';
  if (Math.abs(n - Math.round(n)) < 1e-9) return Math.round(n).toLocaleString('en-US');
  return n.toLocaleString('en-US', { maximumFractionDigits: dec });
}

export function duration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const pad = (x) => String(x).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export function durationWords(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60), r = s % 60;
  if (m < 60) return m + 'm ' + String(r).padStart(2, '0') + 's';
  return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
}

export function clockTime(t) {
  const d = new Date(t);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function dayLabel(t) {
  const d = new Date(t), now = new Date();
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(now) - start(d)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
}

export function listTime(t) {
  const d = new Date(t), now = new Date();
  if (d.toDateString() === now.toDateString()) return clockTime(t);
  const diffDays = (now - d) / 86400000;
  if (diffDays < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' });
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function dateKey(t = Date.now()) {
  const d = new Date(t);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function stars(n) {
  const full = Math.floor(n), half = n - full >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

export function starsText(n) {
  return (Math.round(n * 2) / 2).toString().replace(/\.0$/, '') + '★';
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function plural(n, word, pluralWord) {
  return n + ' ' + (n === 1 ? word : pluralWord || word + 's');
}
