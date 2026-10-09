// Small corner notifications.
export function toast(title, body = '', kind = '', onClick = null, ms = 4500) {
  const root = document.getElementById('toasts');
  if (!root) return;
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  const b = document.createElement('b');
  b.textContent = title;
  el.appendChild(b);
  if (body) {
    const d = document.createElement('div');
    d.textContent = body;
    el.appendChild(d);
  }
  el.onclick = () => { if (onClick) onClick(); el.remove(); };
  root.appendChild(el);
  while (root.children.length > 4) root.firstChild.remove();
  setTimeout(() => el.remove(), ms);
}

let audioCtx = null;
export function ping(kind = 'msg') {
  try {
    audioCtx ||= new AudioContext();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = { money: 1046, boss: 880, team: 660, mentor: 620, bot: 520 }[kind] || 740;
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.26);
    if (kind === 'money') {
      const o2 = audioCtx.createOscillator();
      o2.frequency.value = 1318;
      o2.connect(g);
      o2.start(audioCtx.currentTime + 0.09);
      o2.stop(audioCtx.currentTime + 0.3);
    }
  } catch {}
}
