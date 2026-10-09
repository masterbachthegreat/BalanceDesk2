// Question templates: random variables, computed values and {placeholder} filling.
//
// A templated question in data/questions/*.json looks like:
//   "vars":    { "P": { "min": 10000, "max": 50000, "step": 1000 }, "r": { "choices": [4, 5, 6] } },
//   "compute": { "pay": "pmt(r/100/12, n*12, P)" },          // evaluated in order
//   "constraints": ["pay > 0"],                               // resampled until all true
//   "text": "I borrowed {P} at {r}% ... ",                    // {name} or {name:fmt}
//   "solution": "Payment = {pay:2}; total interest {=pay*n*12-P:2}",   // {=expr:fmt}
//   "check": { "vars": { ...book values... }, "expect": { "pay": 1073.64 } }
// Formats: none = up to 2 decimals, a digit N = exactly N decimals, int, pct (x100 + %), money.

import { evaluate } from '../core/expr.js';
import { smart, num } from '../core/format.js';

function sampleOne(spec, rng) {
  if (Array.isArray(spec.choices)) return spec.choices[Math.floor(rng() * spec.choices.length)];
  const step = spec.step || 1;
  const n = Math.floor((spec.max - spec.min) / step + 1e-9);
  const v = spec.min + step * Math.floor(rng() * (n + 1));
  return Math.round(v * 1e10) / 1e10;
}

export function computeEnv(q, base) {
  const env = { ...base };
  for (const [name, ex] of Object.entries(q.compute || {})) env[name] = evaluate(ex, env);
  return env;
}

export function sampleVars(q, rng = Math.random) {
  let env = {};
  for (let attempt = 0; attempt < 200; attempt++) {
    const base = {};
    for (const [name, spec] of Object.entries(q.vars || {})) base[name] = sampleOne(spec, rng);
    env = computeEnv(q, base);
    const ok = (q.constraints || []).every((c) => evaluate(c, env));
    if (ok) return env;
  }
  return env;
}

export function formatValue(v, fmt) {
  if (typeof v !== 'number') return String(v);
  switch (fmt) {
    case undefined: case '': return smart(v, 2);
    case 'int': return Math.round(v).toLocaleString('en-US');
    case 'pct': return smart(v * 100, 2) + '%';
    case 'money': return num(v, 2);
    default:
      if (/^\d$/.test(fmt)) return num(v, +fmt);
      return smart(v, 2);
  }
}

export function fill(str, env) {
  if (!str) return str;
  return str.replace(/\{(=?)([^{}]+?)(?::([a-z0-9]+))?\}/gi, (m, isExpr, body, fmt) => {
    try {
      const v = isExpr ? evaluate(body, env) : env[body.trim()];
      if (v === undefined) return m;
      return formatValue(v, fmt);
    } catch {
      return m;
    }
  });
}

// Turn a pool entry into a concrete question for one customer.
export function instantiate(q, rng = Math.random) {
  const hasVars = q.vars && Object.keys(q.vars).length;
  const env = hasVars ? sampleVars(q, rng) : {};
  return {
    id: q.id,
    rank: q.rank,
    chapter: q.chapter,
    topic: q.topic,
    kind: q.kind || 'theory',
    difficulty: q.difficulty || 1,
    text: hasVars ? fill(q.text, env) : q.text,
    solution: hasVars ? fill(q.solution, env) : q.solution,
    values: hasVars ? env : null,
  };
}
