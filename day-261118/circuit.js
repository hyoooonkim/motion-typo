const PAD_ANG = [-58, -28, 2, 32, 148, 178, 208, 238];

export function buildCircuit(img) {
  const MW = 720, MH = Math.round(img.naturalHeight / img.naturalWidth * MW), N = MW * MH;
  const oc = document.createElement('canvas'); oc.width = MW; oc.height = MH;
  const octx = oc.getContext('2d', { willReadFrequently: true });
  octx.drawImage(img, 0, 0, MW, MH);
  const px = octx.getImageData(0, 0, MW, MH).data, gold = new Uint8Array(N);
  for (let i = 0; i < N; i++) { const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2]; gold[i] = r > 110 && r - b > 45 && g > 70 ? 1 : 0; }

  const cx = MW * .5, cy = MH * .504, R = MH * .436, dist = new Float32Array(N).fill(Infinity), q = new Int32Array(N);
  const rad = i => Math.hypot(i % MW - cx, ((i / MW) | 0) - cy);
  const bfs = seeds => {
    let h = 0, tl = 0;
    for (const [i, d] of seeds) if (d < dist[i]) { dist[i] = d; q[tl++] = i; }
    while (h < tl) {
      const i = q[h++], x = i % MW, y = (i / MW) | 0, d = dist[i] + 1;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy;
        if ((!dx && !dy) || X < 0 || Y < 0 || X >= MW || Y >= MH) continue;
        const j = Y * MW + X;
        if (gold[j] && dist[j] === Infinity) { dist[j] = d; q[tl++] = j; }
      }
    }
  };
  const s1 = [];
  for (let i = 0; i < N; i++) if (gold[i] && rad(i) < 22) s1.push([i, 0]);
  bfs(s1);
  let sum = 0, n = 0;
  for (let i = 0; i < N; i++) { const r = rad(i); if (dist[i] < Infinity && r > R - 40 && r < R - 12) { sum += dist[i]; n++; } }
  const Dring = n ? sum / n : R, s2 = [];
  for (let i = 0; i < N; i++) { const r = rad(i); if (gold[i] && dist[i] === Infinity && r > R + 4 && r < R + 30) s2.push([i, Dring + (r - R)]); }
  bfs(s2);

  const idx = [], dd = [], ang = [];
  let maxD = 0;
  for (let i = 0; i < N; i++) if (dist[i] < Infinity) { idx.push(i); dd.push(dist[i]); ang.push(Math.atan2(((i / MW) | 0) - cy, i % MW - cx)); maxD = Math.max(maxD, dist[i]); }
  octx.clearRect(0, 0, MW, MH);
  const od = octx.createImageData(MW, MH);
  for (const i of idx) { od.data[i * 4] = 255; od.data[i * 4 + 1] = 236; od.data[i * 4 + 2] = 178; }
  const pads = PAD_ANG.map(deg => {
    const a = deg * Math.PI / 180, tx = cx + Math.cos(a) * MH * .4, ty = cy + Math.sin(a) * MH * .4;
    let best = -1, bd = 1e9;
    for (let k = 0; k < idx.length; k++) { const i = idx[k], dx = i % MW - tx, dy = ((i / MW) | 0) - ty, e = dx * dx + dy * dy; if (e < bd) { bd = e; best = k; } }
    const i = idx[best];
    return { u: (i % MW) / MW, v: ((i / MW) | 0) / MH, a: ang[best], d: dd[best] };
  });
  return { oc, octx, od, idx: Int32Array.from(idx), d: Float32Array.from(dd), ang: Float32Array.from(ang), maxD, pads };
}

export function paintCircuit(C, waves, col, beat = 0) {
  const { idx, d, ang, od, maxD } = C, data = od.data;
  if (C.col !== col) { C.col = col; for (const i of idx) { data[i * 4] = col[0]; data[i * 4 + 1] = col[1]; data[i * 4 + 2] = col[2]; } }
  for (let k = 0; k < idx.length; k++) {
    let I = 0;
    const dk = d[k];
    for (const w of waves) {
      const u = Math.min(1, w.t / w.dur);
      if (w.t < 0) continue;
      if (w.kind === 'out') {
        const front = u * maxD * 1.05, x = (dk - front) / 12;
        I += (Math.exp(-x * x) + (dk < front ? .22 * Math.exp(-(front - dk) / 55) : 0)) * Math.pow(1 - u, .6) * w.gain;
        continue;
      }
      let da = ang[k] - w.ang; da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da)));
      if (da > .4 || dk > w.to + 14) continue;
      const front = w.kind === 'in' ? w.to * (1 - u) : w.to * u, x = (dk - front) / 11;
      const trail = w.kind === 'in' ? (dk > front ? .25 * Math.exp(-(dk - front) / 40) : 0) : (dk < front ? .25 * Math.exp(-(front - dk) / 40) : 0);
      I += (Math.exp(-x * x) + trail) * (1 - da / .4) * w.gain;
    }
    if (beat > .01 && dk < 150) I += beat * .3 * (1 - dk / 300);
    data[idx[k] * 4 + 3] = I > 1 ? 255 : I * 255;
  }
  C.octx.putImageData(od, 0, 0);
}
