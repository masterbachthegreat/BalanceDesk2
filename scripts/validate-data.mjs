// Validates everything in data/: run with `npm run validate`.
// Checks question templates against the book's own numbers ("check" blocks) and samples random variants.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { instantiate, computeEnv, fill, formatValue } from '../src/js/game/template.js';
import { evaluate } from '../src/js/core/expr.js';

const require = createRequire(import.meta.url);
const backend = require('../electron/backend.js');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
backend.init({ dataDir: path.join(root, '.dev-data', 'validate'), appDir: root });
const D = backend.readGameData();

let errors = 0, warnings = 0;
const err = (m) => { errors++; console.log('ERROR  ' + m); };
const warn = (m) => { warnings++; console.log('warn   ' + m); };

// ranks
const ranks = new Map(D.ranks.map((r) => [r.rank, r]));
if (!D.ranks.length) err('ranks.json is empty');

// personalities
const pid = new Set();
for (const p of D.personalities) {
  if (pid.has(p.id)) err('duplicate personality id ' + p.id);
  pid.add(p.id);
  for (const k of ['name', 'bio', 'style']) if (!p[k]) err(`personality ${p.id} missing ${k}`);
  for (const k of ['greetings', 'nudges', 'leaves']) if (!Array.isArray(p[k]) || !p[k].length) err(`personality ${p.id} missing ${k}`);
  if (!D.config.customer.readDelayMs[p.read]) err(`personality ${p.id} bad read speed ${p.read}`);
  if (!D.config.customer.maxTurns[p.patience]) err(`personality ${p.id} bad patience ${p.patience}`);
}

// shop
const css = ['themes.css', 'cosmetics.css'].map((f) => fs.readFileSync(path.join(root, 'src', 'css', f), 'utf8')).join('\n');
const sid = new Set();
for (const it of D.shop) {
  if (sid.has(it.id)) err('duplicate shop id ' + it.id);
  sid.add(it.id);
  if (it.slot === 'theme' && !css.includes(`[data-theme="${it.value}"]`) && it.value !== 'night') err(`theme ${it.value} not in themes.css`);
  if (['wallpaper', 'border', 'nameColor'].includes(it.slot) && !css.includes('.' + it.value)) err(`class .${it.value} not in cosmetics.css`);
  if (it.requires && !D.shop.find((x) => x.id === it.requires)) err(`${it.id} requires unknown ${it.requires}`);
}

// memos
for (const m of D.team || []) {
  if (!m.id || !m.name || !m.role || !m.bio || !m.style || !Array.isArray(m.days) || !Array.isArray(m.hours) || m.hours.length !== 2) err('bad team member ' + JSON.stringify(m).slice(0, 80));
}
if ((D.team || []).length < 1) err('data/team.json: no coworkers');
for (const m of D.memos) if (!m.id || !m.trigger || !m.title || !m.text) err('bad memo ' + JSON.stringify(m).slice(0, 80));

// questions
const qid = new Set();
const perRank = {};
const close = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
for (const q of D.questions) {
  const where = `question ${q.id}`;
  if (qid.has(q.id)) err('duplicate question id ' + q.id);
  qid.add(q.id);
  perRank[q.rank] = (perRank[q.rank] || 0) + 1;
  if (!ranks.has(q.rank)) err(`${where}: unknown rank ${q.rank}`);
  else if (!ranks.get(q.rank).chapters.includes(q.chapter)) warn(`${where}: chapter ${q.chapter} not in rank ${q.rank}`);
  if (!q.text || !q.solution || !q.topic) err(`${where}: missing text/solution/topic`);
  if (q.attachment) {
    const a = q.attachment;
    if (!a.file || !a.title || !Array.isArray(a.columns) || !Array.isArray(a.rows)) err(`${where}: attachment needs file, title, columns, rows`);
    else if (a.rows.some((r) => r.length !== a.columns.length)) err(`${where}: attachment row length doesn't match columns`);
    if (!/attach/i.test(q.text)) warn(`${where}: has an attachment but the text doesn't mention it`);
  }
  const attText = (a) => (a ? [a.title, ...a.columns, ...a.rows.flat(), a.note || ''].join(' ') : '');
  if (!q.vars) {
    if (/\{[=?]?[A-Za-z_][^{}]*\}/.test(q.text + q.solution + attText(q.attachment))) warn(`${where}: has {placeholders} but no vars`);
    continue;
  }
  try {
    if (q.check) {
      const env = computeEnv(q, q.check.vars);
      for (const [k, v] of Object.entries(q.check.expect || {})) {
        if (!close(env[k], v, q.check.tol ?? 0.006)) err(`${where}: check ${k} = ${env[k]} but book says ${v}`);
      }
      const t = fill(q.text, env) + fill(q.solution, env);
      if (/\{[=?]?[A-Za-z_][^{}]*\}/.test(t)) err(`${where}: unfilled placeholder in book check: ${t.match(/\{[=?]?[A-Za-z_][^{}]*\}/)[0]}`);
    } else warn(`${where}: templated question without a book check`);
    for (let i = 0; i < 200; i++) {
      const inst = instantiate(q);
      for (const [k, v] of Object.entries(inst.values)) if (typeof v === 'number' && !Number.isFinite(v)) throw new Error(`${k} is ${v}`);
      for (const c of q.constraints || []) if (!evaluate(c, inst.values)) throw new Error('constraint never satisfied: ' + c);
      if (/\{[=?]?[A-Za-z_][^{}]*\}/.test(inst.text + inst.solution + attText(inst.attachment))) throw new Error('unfilled placeholder');
      // a non-zero value must not be shown as 0 because of too few decimals
      for (const m of (q.text + ' ' + q.solution).matchAll(/\{(=?)([^{}?|]+?)(?::([a-z0-9]+))?\}/gi)) {
        const v = m[1] ? evaluate(m[2], inst.values) : inst.values[m[2].trim()];
        if (typeof v !== "number" || Math.abs(v) < 1e-9) continue;
        const shown = parseFloat(formatValue(v, m[3]).replace(/,/g, ''));
        if (shown === 0) throw new Error(`${m[0]} shows as 0 but is ${v}`);
      }
    }
  } catch (e) {
    err(`${where}: ${e.message}`);
  }
}

console.log(`\n${D.personalities.length} personalities (${D.personalities.filter((p) => p.vip).length} VIP), ${D.shop.length} shop items, ${D.memos.length} memos`);
console.log(`${D.questions.length} questions (${D.questions.filter((q) => q.vars).length} templated) — per rank: ${Object.entries(perRank).map(([r, n]) => r + ':' + n).join(' ')}`);
console.log(`${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
