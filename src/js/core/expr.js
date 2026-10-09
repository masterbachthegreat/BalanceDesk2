// Safe arithmetic expression evaluator (no eval). Used by the calculator,
// question templates and mentor function plots.
//
// Supports: numbers (1,000 is NOT allowed — use 1000), + - * / ^ %, unary -,
// parentheses, comparisons (< > <= >= == !=), && ||, the ternary  a ? b : c,
// constants pi and e, and the functions listed in FUNCS below.

const BASIC = {
  sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp,
  ln: Math.log,
  log: (x, b) => (b === undefined ? Math.log10(x) : Math.log(x) / Math.log(b)),
  min: Math.min, max: Math.max,
  floor: Math.floor, ceil: Math.ceil,
  round: (x, d = 0) => { const f = 10 ** d; return Math.round(x * f) / f; },
  pow: Math.pow,
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  fact: (n) => { let r = 1; for (let i = 2; i <= Math.round(n); i++) r *= i; return r; },
  comb: (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; },
  perm: (n, k) => { let r = 1; for (let i = 0; i < k; i++) r *= n - i; return r; },
  sum: (...a) => a.reduce((s, x) => s + x, 0),
  avg: (...a) => a.reduce((s, x) => s + x, 0) / a.length,
  // standard normal CDF (Abramowitz–Stegun 7.1.26, |err| < 1.5e-7)
  ncdf: (z) => {
    const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
    return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
  },
  // inverse standard normal (Acklam's algorithm)
  ninv: (p) => {
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const pl = 0.02425;
    let q, r;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p <= 1 - pl) { q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  },
};

// Financial functions. Rates are decimals (0.05 = 5%). Sign convention: plain
// positive amounts (pv of an annuity of pmt is positive, pmt on a loan is positive).
const FINANCIAL = {
  // present value of n payments of pmt at rate r, plus fv received at n
  pv: (r, n, pmt, fv = 0) => (r === 0 ? pmt * n + fv : pmt * (1 - (1 + r) ** -n) / r + fv * (1 + r) ** -n),
  // future value of pv invested for n periods plus n payments of pmt
  fv: (r, n, pmt, pv = 0) => (r === 0 ? pv + pmt * n : pv * (1 + r) ** n + pmt * (((1 + r) ** n - 1) / r)),
  // level payment that repays pv over n periods (leaving fv)
  pmt: (r, n, pv, fv = 0) => (r === 0 ? (pv - fv) / n : (pv - fv * (1 + r) ** -n) * r / (1 - (1 + r) ** -n)),
  // npv(r, cf0, cf1, ...) with cf0 at time 0
  npv: (r, ...cfs) => cfs.reduce((s, cf, t) => s + cf / (1 + r) ** t, 0),
  // irr(cf0, cf1, ...) by bisection on [-0.99, 10]
  irr: (...cfs) => {
    const f = (r) => cfs.reduce((s, cf, t) => s + cf / (1 + r) ** t, 0);
    let lo = -0.99, hi = 10, flo = f(lo);
    if (flo * f(hi) > 0) return NaN;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2, fm = f(mid);
      if (Math.abs(fm) < 1e-12) return mid;
      if (fm * flo < 0) hi = mid; else { lo = mid; flo = fm; }
    }
    return (lo + hi) / 2;
  },
  // number of periods to repay pv with payment pmt
  nper: (r, pmt, pv) => (r === 0 ? pv / pmt : -Math.log(1 - (r * pv) / pmt) / Math.log(1 + r)),
};

export const FUNCS = { ...BASIC, ...FINANCIAL };
export const FINANCIAL_NAMES = Object.keys(FINANCIAL);
const CONSTS = { pi: Math.PI, e: Math.E };

// ---------- tokenizer ----------
function tokenize(src) {
  const toks = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i));
      if (!m) throw new Error('Bad number at ' + i);
      toks.push({ t: 'num', v: parseFloat(m[0]) });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i));
      toks.push({ t: 'id', v: m[0] });
      i += m[0].length;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (['<=', '>=', '==', '!=', '&&', '||', '**'].includes(two)) {
      toks.push({ t: 'op', v: two === '**' ? '^' : two });
      i += 2;
      continue;
    }
    const map = { '×': '*', '÷': '/', '−': '-', '·': '*' };
    const c = map[ch] || ch;
    if ('+-*/^%(),<>?:'.includes(c)) { toks.push({ t: 'op', v: c }); i++; continue; }
    if (ch === '√') { toks.push({ t: 'op', v: '√' }); i++; continue; }
    throw new Error('Unexpected character "' + ch + '"');
  }
  return toks;
}

// ---------- Pratt parser producing a closure ----------
const BINARY = {
  '||': [1, (a, b) => (a || b ? 1 : 0)],
  '&&': [2, (a, b) => (a && b ? 1 : 0)],
  '==': [3, (a, b) => (Math.abs(a - b) < 1e-9 ? 1 : 0)],
  '!=': [3, (a, b) => (Math.abs(a - b) >= 1e-9 ? 1 : 0)],
  '<': [4, (a, b) => (a < b ? 1 : 0)],
  '>': [4, (a, b) => (a > b ? 1 : 0)],
  '<=': [4, (a, b) => (a <= b ? 1 : 0)],
  '>=': [4, (a, b) => (a >= b ? 1 : 0)],
  '+': [5, (a, b) => a + b],
  '-': [5, (a, b) => a - b],
  '*': [6, (a, b) => a * b],
  '/': [6, (a, b) => a / b],
  '^': [8, (a, b) => a ** b], // right-assoc, binds tighter than unary minus
};

export function compile(src, opts = {}) {
  const funcs = opts.funcs || FUNCS;
  const toks = tokenize(String(src));
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  const expect = (v) => {
    const t = next();
    if (!t || t.v !== v) throw new Error('Expected "' + v + '"');
  };

  function parsePrimary() {
    const t = next();
    if (!t) throw new Error('Unexpected end of expression');
    if (t.t === 'num') return () => t.v;
    if (t.t === 'op' && t.v === '(') {
      const e = parseExpr(0);
      expect(')');
      return e;
    }
    if (t.t === 'op' && t.v === '-') {
      const e = parseExpr(7);
      return (env) => -e(env);
    }
    if (t.t === 'op' && t.v === '+') return parseExpr(7);
    if (t.t === 'op' && t.v === '√') {
      const e = parseExpr(8);
      return (env) => Math.sqrt(e(env));
    }
    if (t.t === 'id') {
      const name = t.v;
      if (peek() && peek().v === '(') {
        next();
        const args = [];
        if (peek() && peek().v !== ')') {
          do { args.push(parseExpr(0)); } while (peek() && peek().v === ',' && next());
        }
        expect(')');
        const fn = funcs[name];
        if (!fn) throw new Error('Unknown function ' + name + '()');
        return (env) => fn(...args.map((a) => a(env)));
      }
      return (env) => {
        if (env && Object.prototype.hasOwnProperty.call(env, name)) return env[name];
        if (name in CONSTS) return CONSTS[name];
        throw new Error('Unknown variable ' + name);
      };
    }
    throw new Error('Unexpected "' + t.v + '"');
  }

  function parsePostfix() {
    let left = parsePrimary();
    // postfix percent: 5% -> 0.05 (only when not followed by an operand)
    while (peek() && peek().v === '%') {
      const after = toks[p + 1];
      if (after && (after.t === 'num' || after.t === 'id' || after.v === '(')) break;
      next();
      const inner = left;
      left = (env) => inner(env) / 100;
    }
    return left;
  }

  function parseExpr(minPrec) {
    let left = parsePostfix();
    for (;;) {
      const t = peek();
      if (!t || t.t !== 'op') break;
      if (t.v === '?' && minPrec === 0) {
        next();
        const a = parseExpr(0);
        expect(':');
        const b = parseExpr(0);
        const cond = left;
        left = (env) => (cond(env) ? a(env) : b(env));
        continue;
      }
      if (t.v === '%') { // modulo
        if (6 < minPrec) break;
        next();
        const right = parseExpr(7);
        const l = left;
        left = (env) => l(env) % right(env);
        continue;
      }
      const op = BINARY[t.v];
      if (!op) break;
      const [prec, fn] = op;
      if (prec < minPrec) break;
      next();
      const right = parseExpr(t.v === '^' ? prec : prec + 1);
      const l = left;
      left = (env) => fn(l(env), right(env));
    }
    return left;
  }

  const fn = parseExpr(0);
  if (p < toks.length) throw new Error('Unexpected "' + toks[p].v + '"');
  return fn;
}

export function evaluate(src, env = {}, opts = {}) {
  return compile(src, opts)(env);
}
