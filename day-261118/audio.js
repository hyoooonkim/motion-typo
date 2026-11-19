let ac = null, out = null;

export function unlock() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ac.createDynamicsCompressor();
    out = ac.createGain(); out.gain.value = .7;
    out.connect(comp); comp.connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

export const now = () => (ac ? ac.currentTime : 0);

function env(t0, a, peak, d) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + a);
  g.gain.exponentialRampToValueAtTime(.0008, t0 + a + d);
  g.connect(out);
  return g;
}

function osc(type, f, t0, dur, g) {
  const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0);
  o.connect(g); o.start(t0); o.stop(t0 + dur);
  return o;
}

function thump(t0) {
  const g = env(t0, .006, 1, .5), o = osc('sine', 130, t0, .6, g);
  o.frequency.exponentialRampToValueAtTime(42, t0 + .2);
  const g2 = env(t0 + .19, .006, .55, .35), o2 = osc('sine', 110, t0 + .19, .45, g2);
  o2.frequency.exponentialRampToValueAtTime(40, t0 + .36);
}

function bell(f, t0) {
  [[1, .5], [2.003, .16], [3.01, .06], [4.2, .025]].forEach(([m, a]) => osc('sine', f * m, t0, 1.4, env(t0, .004, a, m > 1 ? .5 : 1.1)));
}

function tok(f, t0) {
  osc('triangle', f, t0, .15, env(t0, .002, .45, .09));
  osc('sine', f * 1.5, t0, .1, env(t0, .002, .2, .05));
}

function pop(f, t0) {
  const o = osc('sine', f, t0, .3, env(t0, .004, .6, .22));
  o.frequency.exponentialRampToValueAtTime(f * .35, t0 + .14);
}

export function play(note, t0 = now()) {
  if (!ac) return;
  if (note.type === 'thump') thump(t0);
  else if (note.type === 'tok') tok(note.f, t0);
  else if (note.type === 'pop') pop(note.f, t0);
  else bell(note.f, t0);
}
