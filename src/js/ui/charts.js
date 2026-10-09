// Renders chart specs (from the mentor's ```chart blocks or the bot's /spendings) with Chart.js.
import { compile } from '../core/expr.js';

const PALETTE = ['#4e9af1', '#f5a524', '#4fae4e', '#e5534b', '#a371f7', '#2ec4b6', '#ff7eb6', '#c9a227', '#7f91a4', '#8bc34a'];

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
}

function linspace(a, b, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(a + ((b - a) * i) / (n - 1));
  return out;
}

export function buildConfig(spec) {
  const text = cssVar('--text');
  const muted = cssVar('--muted');
  const grid = 'rgba(127,145,164,.18)';
  let type = spec.type || 'line';
  let data;
  let xLinear = false;

  if (type === 'function') {
    const xMin = Number(spec.xMin ?? 0), xMax = Number(spec.xMax ?? 10);
    const xs = linspace(xMin, xMax, 121);
    const datasets = (spec.functions || []).map((f, i) => {
      const fn = compile(f.expr);
      return {
        type: 'line',
        label: f.label || f.expr,
        data: xs.map((x) => { let y; try { y = fn({ x }); } catch { y = NaN; } return { x, y: Number.isFinite(y) ? y : null }; }),
        borderColor: PALETTE[i % PALETTE.length],
        backgroundColor: PALETTE[i % PALETTE.length],
        pointRadius: 0,
        borderWidth: 2,
        tension: 0,
        spanGaps: false,
      };
    });
    (spec.points || []).forEach((p, i) => datasets.push({
      type: 'scatter',
      label: p.label || 'Point',
      data: [{ x: Number(p.x), y: Number(p.y) }],
      pointRadius: 6,
      backgroundColor: PALETTE[(datasets.length + i) % PALETTE.length],
    }));
    data = { datasets };
    type = 'line';
    xLinear = true;
  } else {
    const round = type === 'pie' || type === 'doughnut';
    data = {
      labels: spec.labels,
      datasets: (spec.datasets || []).map((d, i) => {
        const color = d.color || PALETTE[i % PALETTE.length];
        return {
          label: d.label,
          data: d.data,
          borderColor: round ? cssVar('--panel') : color,
          backgroundColor: round ? (d.data || []).map((_, j) => PALETTE[j % PALETTE.length]) : (d.fill || type === 'bar' || type === 'scatter' ? color + (type === 'bar' ? 'cc' : '55') : color),
          fill: !!d.fill,
          borderWidth: round ? 2 : 2,
          pointRadius: type === 'scatter' ? 4 : (d.data || []).length > 30 ? 0 : 3,
          tension: 0.15,
        };
      }),
    };
    if (type === 'scatter' || (Array.isArray(spec.datasets?.[0]?.data) && typeof spec.datasets[0].data[0] === 'object' && !spec.labels)) xLinear = true;
  }

  const round = type === 'pie' || type === 'doughnut';
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    plugins: {
      title: { display: !!spec.title, text: spec.title, color: text, font: { size: 14, weight: '600' } },
      legend: { display: round || (data.datasets || []).length > 1, labels: { color: text, boxWidth: 12 } },
      tooltip: { intersect: false, mode: round ? 'nearest' : 'index' },
    },
  };
  if (!round) {
    options.scales = {
      x: { type: xLinear ? 'linear' : 'category', stacked: !!spec.stacked, title: { display: !!spec.xLabel, text: spec.xLabel, color: muted }, ticks: { color: muted }, grid: { color: grid } },
      y: { stacked: !!spec.stacked, title: { display: !!spec.yLabel, text: spec.yLabel, color: muted }, ticks: { color: muted }, grid: { color: grid } },
    };
  }
  return { type, data, options };
}

const live = new Set();

export function renderChart(container, spec) {
  const box = document.createElement('div');
  box.className = 'chart-box';
  box.chartSpec = spec; // for the big viewer (click a chart)
  box.title = 'Click to enlarge';
  const canvas = document.createElement('canvas');
  box.appendChild(canvas);
  container.appendChild(box);
  try {
    if (typeof spec === 'string') spec = JSON.parse(spec);
    if (!window.Chart) throw new Error('Chart library missing');
    const chart = new window.Chart(canvas, buildConfig(spec));
    live.add(chart);
  } catch (e) {
    box.style.height = 'auto';
    box.innerHTML = '';
    const err = document.createElement('div');
    err.className = 'chart-error';
    err.textContent = '⚠ Could not draw this chart: ' + e.message;
    box.appendChild(err);
  }
  return box;
}

export function destroyChartsIn(el) {
  for (const c of [...live]) {
    if (!c.canvas || !el.contains(c.canvas)) continue;
    c.destroy();
    live.delete(c);
  }
}
