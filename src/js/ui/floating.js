// Floating tool windows: calculator and notepad (shop items).
import { S, touchProfile } from '../core/state.js';
import { evaluate, FUNCS, FINANCIAL_NAMES } from '../core/expr.js';
import { smart, escapeHtml } from '../core/format.js';
import * as shop from '../game/shop.js';
import { prefillInput } from './chatview.js';

function makeWindow(id, title, cls, x, y) {
  let win = document.getElementById(id);
  if (win) { win.style.zIndex = 26; return { win, existed: true }; }
  win = document.createElement('div');
  win.id = id;
  win.className = 'float-win ' + cls;
  const pos = S.profile.windows?.[id];
  win.style.left = (pos?.x ?? x) + 'px';
  win.style.top = (pos?.y ?? y) + 'px';
  win.innerHTML = `<div class="float-head"><span class="t">${title}</span><button data-close title="Close">✕</button></div>`;
  document.getElementById('floatRoot').appendChild(win);
  win.querySelector('[data-close]').onclick = () => win.remove();
  // dragging
  const head = win.querySelector('.float-head');
  head.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) return;
    const sx = e.clientX - win.offsetLeft, sy = e.clientY - win.offsetTop;
    const move = (ev) => {
      win.style.left = Math.max(0, Math.min(window.innerWidth - 80, ev.clientX - sx)) + 'px';
      win.style.top = Math.max(0, Math.min(window.innerHeight - 40, ev.clientY - sy)) + 'px';
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      S.profile.windows ||= {};
      S.profile.windows[id] = { x: win.offsetLeft, y: win.offsetTop };
      touchProfile();
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });
  return { win, existed: false };
}

export function openCalculator() {
  if (!shop.hasTool('calculator')) return false;
  const fin = shop.hasTool('fincalc');
  const { win, existed } = makeWindow('calcWin', fin ? '🧮 Financial calculator' : '🧮 Calculator', 'calc', window.innerWidth - 340, 80);
  if (existed) return true;
  const funcs = fin ? FUNCS : Object.fromEntries(Object.entries(FUNCS).filter(([k]) => !FINANCIAL_NAMES.includes(k)));
  const keys = [
    ['7', '8', '9', '/', '('], ['4', '5', '6', '*', ')'], ['1', '2', '3', '-', '^'], ['0', '.', '%', '+', '√'],
    ['ln(', 'exp(', 'sqrt(', 'C', '⌫'],
  ];
  if (fin) keys.push(['pv(', 'fv(', 'pmt(', 'npv(', 'irr(']);
  const body = document.createElement('div');
  body.innerHTML = `<div class="calc-display"><input id="calcIn" spellcheck="false" placeholder="e.g. 1000*(1+5%)^10"><div class="calc-result" id="calcOut"></div></div>
    <div class="calc-keys">${keys.map((row) => row.map((k) => `<button class="${/[\d.]/.test(k) && k.length === 1 ? '' : k.endsWith('(') ? 'fn' : 'op'}" data-k="${escapeHtml(k)}">${escapeHtml(k)}</button>`).join('')).join('')}
    <button class="eq" data-k="=" style="grid-column: span 3">=</button><button data-k="ins" title="Insert result into the message box" style="grid-column: span 2">↳ to chat</button></div>
    <div class="calc-hist" id="calcHist"></div>
    ${fin ? '<div style="font-size:11px;color:var(--muted);padding:0 10px 8px">pv(r,n,pmt,fv) · fv(r,n,pmt,pv) · pmt(r,n,pv,fv) · npv(r,cf0,cf1,…) · irr(cf0,cf1,…) · rates as decimals</div>' : ''}`;
  win.appendChild(body);
  const inp = body.querySelector('#calcIn');
  const out = body.querySelector('#calcOut');
  const hist = body.querySelector('#calcHist');
  let last = null;
  const calc = (commit) => {
    const src = inp.value.trim();
    if (!src) { out.textContent = ''; out.classList.remove('err'); return; }
    try {
      const v = evaluate(src, { ans: last ?? 0 }, { funcs });
      out.classList.remove('err');
      out.textContent = '= ' + smart(v, 8);
      if (commit) {
        last = v;
        S.profile.calcHistory = [`${src} = ${smart(v, 8)}`, ...(S.profile.calcHistory || [])].slice(0, 30);
        touchProfile();
        renderHist();
      }
    } catch (e) {
      out.classList.toggle('err', commit);
      out.textContent = commit ? e.message : '';
    }
  };
  const renderHist = () => { hist.innerHTML = (S.profile.calcHistory || []).map((h) => `<div title="Click to reuse">${escapeHtml(h)}</div>`).join(''); };
  renderHist();
  hist.onclick = (e) => { const d = e.target.closest('div[title]'); if (d) { inp.value = d.textContent.split(' = ')[0]; calc(false); inp.focus(); } };
  inp.addEventListener('input', () => calc(false));
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); calc(true); } });
  body.querySelector('.calc-keys').onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const k = b.dataset.k;
    if (k === '=') calc(true);
    else if (k === 'C') { inp.value = ''; calc(false); }
    else if (k === '⌫') { inp.value = inp.value.slice(0, -1); calc(false); }
    else if (k === 'ins') { if (last !== null) prefillInput((document.getElementById('input')?.value || '') + smart(last, 4)); }
    else { inp.value += k; calc(false); }
    inp.focus();
  };
  setTimeout(() => inp.focus(), 0);
  return true;
}

export function openNotepad() {
  if (!shop.hasTool('notepad')) return false;
  const { win, existed } = makeWindow('noteWin', '📝 Notepad', 'notepad', window.innerWidth - 380, 140);
  if (existed) return true;
  const ta = document.createElement('textarea');
  ta.placeholder = 'Formulas, reminders, scratch work… (saved automatically)';
  ta.value = S.profile.notes || '';
  ta.oninput = () => { S.profile.notes = ta.value; touchProfile(); };
  win.appendChild(ta);
  setTimeout(() => ta.focus(), 0);
  return true;
}
