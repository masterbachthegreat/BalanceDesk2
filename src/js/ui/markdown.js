// Minimal, safe markdown -> HTML (escapes everything first).
// full: headings, lists, tables, *italic*; light (customer/player text): only `code`, **bold**, line breaks.
import { escapeHtml } from '../core/format.js';

function inline(s, opts) {
  s = s.replace(/`([^`]+)`/g, (m, c) => '<code>' + c + '</code>');
  s = s.replace(/\*\*([^*]+?)\*\*/g, '<b>$1</b>');
  if (opts.full || opts.italic) {
    s = s.replace(/(^|[\s(])_(\S(?:[^_]*?\S)?)_(?=[\s).,!?:;]|$)/g, '$1<i>$2</i>');
    s = s.replace(/(^|[\s(])\*(\S(?:[^*]*?\S)?)\*(?=[\s).,!?:;]|$)/g, '$1<i>$2</i>');
  }
  if (opts.commands) s = s.replace(/(^|[\s(>])\/([a-z]{2,20})\b/g, '$1<span class="cmd" data-cmd="/$2">/$2</span>');
  if (opts.mentions) s = s.replace(/(^|[\s(>])@([A-Za-z][\w-]*)/g, '$1<span class="mention">@$2</span>');
  return s;
}

function table(rows, opts) {
  const cells = (r) => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
  const head = cells(rows[0]);
  const body = rows.slice(rows[1] && /^[\s|:-]+$/.test(rows[1]) ? 2 : 1).map(cells);
  return '<table><thead><tr>' + head.map((c) => '<th>' + inline(c, opts) + '</th>').join('') + '</tr></thead><tbody>' +
    body.map((r) => '<tr>' + r.map((c) => '<td>' + inline(c, opts) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
}

export function renderMarkdown(text, opts = {}) {
  const src = escapeHtml(String(text ?? '').replace(/\r/g, ''));
  // fenced code blocks
  const blocks = [];
  let s = src.replace(/```[a-z]*\n?([\s\S]*?)```/g, (m, code) => {
    blocks.push('<pre><code>' + code.replace(/\n$/, '') + '</code></pre>');
    return '\u0000' + (blocks.length - 1) + '\u0000';
  });
  if (!opts.full) {
    const html = inline(s, opts).replace(/\n/g, '<br>');
    return html.replace(/\u0000(\d+)\u0000/g, (m, i) => blocks[+i]);
  }
  const lines = s.split('\n');
  const out = [];
  let para = [];
  const flush = () => { if (para.length) { out.push('<p>' + para.map((l) => inline(l, opts)).join('<br>') + '</p>'); para = []; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { flush(); continue; }
    if (/^\u0000\d+\u0000$/.test(line.trim())) { flush(); out.push(line.trim()); continue; }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      flush();
      const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(lines[i++]);
      i--;
      out.push(table(rows, opts));
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) { flush(); out.push('<h4>' + inline(h[2], opts) + '</h4>'); continue; }
    if (/^\s*([-*•])\s+/.test(line)) {
      flush();
      const items = [];
      while (i < lines.length && /^\s*([-*•])\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*•])\s+/, ''));
      i--;
      out.push('<ul>' + items.map((x) => '<li>' + inline(x, opts) + '</li>').join('') + '</ul>');
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      flush();
      const items = [];
      const start = parseInt(line, 10);
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''));
      i--;
      out.push(`<ol start="${start}">` + items.map((x) => '<li>' + inline(x, opts) + '</li>').join('') + '</ol>');
      continue;
    }
    para.push(line);
  }
  flush();
  return out.join('').replace(/\u0000(\d+)\u0000/g, (m, i) => blocks[+i]);
}

// Split mentor text into text and ```chart blocks.
export function splitCharts(text) {
  const parts = [];
  const re = /```chart\s*\n([\s\S]*?)```/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ type: 'text', text: text.slice(last, m.index) });
    parts.push({ type: 'chart', json: m[1] });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ type: 'text', text: text.slice(last) });
  return parts;
}

export function plainPreview(text) {
  return String(text ?? '').replace(/```chart[\s\S]*?```/g, '📈 chart').replace(/```[\s\S]*?```/g, '[code]')
    .replace(/[*_`#|]/g, '').replace(/\s+/g, ' ').trim();
}
