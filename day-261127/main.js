const $ = s => document.querySelector(s);
const cv = document.createElement('canvas'); document.body.prepend(cv);
let cx = cv.getContext('2d');
const main = cx, TIME = 50;
let W = 0, H = 0, DPR = 1, S = 1, OX = 0, OY = 0;
const DW = 1600, DH = 893;
const rnd = (a, b) => a + Math.random() * (b - a);
const LINES = [
  ['이번 분기 프로젝트는 예정보다'],
  [['늣게', '늦게'], ' 시작되었으나 모든 팀의'],
  ['협조로 ', ['무사이', '무사히'], ' 마무리되었다.'],
  ['특히 사용자 ', ['검중', '검증'], ' 단계에서'],
  ['많은 개선점을 발견하였다.'],
  ['다음 분기에는 일정 관리를'],
  [['철쩌히', '철저히'], ' 하여 마감 직전에'],
  ['몰아서 일하는 일이 없도록'],
  [['하겟다', '하겠다'], '.'],
];
const NOTES = [['메일 회신', '#ffe066'], ['회의록 정리', '#ffb3c7'], ['견적서!!', '#a8e6cf'], ['전화 걸기', '#9ad0ff'], ['백업 꼭', '#ffd19a']];
const TASKS = [
  { k: 'coffee', t: '엎지른 커피 닦기', how: '물티슈로 닦고, 다 쓴 건 휴지통에', ic: '☕' },
  { k: 'typo', t: '보고서 오타 고치기', how: '아이패드에서 오타를 눌러 다시 입력', ic: 'Aa' },
  { k: 'crumb', t: '지우개 가루 털기', how: '빠르게 쓸어서 종이 밖으로', ic: '✎' },
  { k: 'stamp', t: '결재 도장 찍기', how: '도장 → 인주 → 서류', ic: '印' },
  { k: 'note', t: '포스트잇 버리기', how: '휴지통으로 끌어서', ic: '▤' },
];
const LY = { lamp: [478, 205], lampH: 300, pool: [592, 329], ipad: [570, 98, 526, 696, -.025, .69], sketch: [935, 452, 430, 320, .05, .68],
  forms: [[425, 640, 200, 270, -.08, .72], [600, 628, 200, 270, .05, .72], [772, 652, 200, 270, -.04, .7]],
  spill: [1108, 792, 80], cup: [1058, 752, 64, 66], handle: [996, 800, 25, 17, -.6], ink: [985, 300, 42], stampHome: [1068, 392], pack: [1292, 480, 150, 92, .18], bin: [1445, 705, 150],
  notes: [330, 110, 1240, 800], clock: [800, 46] };
const AVOID = [[420, 170, 190], [985, 300, 90], [1068, 392, 70], [1292, 480, 120], [1100, 790, 130], [1445, 705, 260], [1040, 750, 90]];

const paper = (a, extra = {}) => ({ x: a[0], y: a[1], w: a[2], h: a[3], rot: a[4], s: a[5] || 1, ...extra });
function toLocal(p, px, py) {
  const k = p.s || 1, cxp = p.x + p.w * k / 2, cyp = p.y + p.h * k / 2, c = Math.cos(-p.rot), s = Math.sin(-p.rot), dx = px - cxp, dy = py - cyp;
  return { x: (dx * c - dy * s) / k + p.w / 2, y: (dx * s + dy * c) / k + p.h / 2 };
}
function toWorld(p, lx, ly) {
  const k = p.s || 1, c = Math.cos(p.rot), s = Math.sin(p.rot), dx = (lx - p.w / 2) * k, dy = (ly - p.h / 2) * k;
  return { x: p.x + p.w * k / 2 + dx * c - dy * s, y: p.y + p.h * k / 2 + dx * s + dy * c };
}
const inside = (p, px, py) => { const l = toLocal(p, px, py); return l.x >= 0 && l.y >= 0 && l.x <= p.w && l.y <= p.h; };
function withPaper(p, f) { const k = p.s || 1; cx.save(); cx.translate(p.x + p.w * k / 2, p.y + p.h * k / 2); cx.rotate(p.rot); cx.scale(k, k); cx.translate(-p.w / 2, -p.h / 2); f(); cx.restore(); }
function shadowFor(x, y, h) {
  const dx = x - LY.lamp[0], dy = y - LY.lamp[1], d = Math.hypot(dx, dy) || 1, len = Math.min(h * 6, h * d / LY.lampH + h * .25), k = S * DPR;
  cx.shadowColor = `rgba(10,5,0,${Math.max(.35, Math.min(.8, .72 - d * .00022 + h * .004))})`; cx.shadowBlur = (2 + h * .7 + h * d * .0025) * k; cx.shadowOffsetX = dx / d * len * k; cx.shadowOffsetY = dy / d * len * k;
}
const noShadow = () => { cx.shadowColor = 'transparent'; cx.shadowBlur = 0; cx.shadowOffsetX = cx.shadowOffsetY = 0; };
function blob(c, x, y, r, n = 14, j = .32, seed) {
  c.beginPath();
  const jq = i => seed === undefined ? rnd(-j, j) : (rnd0(seed * 31 + i * 7.3) * 2 - 1) * j;
  const pts = Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [x + Math.cos(a) * r * (1 + jq(i)), y + Math.sin(a) * r * (1 + jq(i + 50))]; });
  pts.forEach((p, i) => { const q = pts[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; i ? c.quadraticCurveTo(p[0], p[1], mx, my) : c.moveTo(mx, my); });
  const p = pts[0], q = pts[1]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); c.closePath();
}

let st;
const SP = { HC: document.createElement('canvas'), M: document.createElement('canvas'), C: document.createElement('canvas'), E: document.createElement('canvas'), o: [0, 0], k: 2, sum0: 1, left: 1, dirty: 1 };
function spillSum() { const d = SP.M.getContext('2d').getImageData(0, 0, SP.M.width, SP.M.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) n += d[i]; return n; }
function makeSpill() {
  const [x, y, r] = LY.spill, k = SP.k, size = Math.ceil(r * 3.2 * k);
  SP.o = [x - r * 1.6, y - r * 1.6];
  for (const c of [SP.M, SP.C, SP.E, SP.HC]) { c.width = c.height = size; }
  const m = SP.M.getContext('2d'), L = v => v * k;
  m.fillStyle = '#000'; blob(m, L(r * 1.6), L(r * 1.6), L(r), 18, .36); m.fill();
  blob(m, L(r * 1.6 - r * .75), L(r * 1.6 + r * .15), L(r * .55), 12, .3); m.fill();
  for (let i = 0; i < 9; i++) { const a = rnd(0, 6.3), d = rnd(1.08, 1.5) * r; blob(m, L(r * 1.6 + Math.cos(a) * d), L(r * 1.6 + Math.sin(a) * d), L(rnd(2.5, 9)), 9, .3); m.fill(); }
  const [ux, uy, urx, ury] = LY.cup, [hx, hy, hrx, hry, hr] = LY.handle, ox = SP.o[0], oy = SP.o[1];
  m.globalCompositeOperation = 'destination-out'; m.beginPath(); m.ellipse((ux - ox) * k, (uy - oy) * k, urx * k, ury * k, 0, 0, 7); m.fill(); m.beginPath(); m.ellipse((hx - ox) * k, (hy - oy) * k, hrx * k, hry * k, hr, 0, 7); m.fill(); m.globalCompositeOperation = 'source-over';
  SP.sum0 = spillSum(); SP.left = 1; SP.dirty = 1;
}
function newRound() {
  const ipad = paper(LY.ipad), sketch = paper(LY.sketch);
  const forms = LY.forms.map(f => paper(f, { done: 0, faint: 0 }));
  makeSpill();
  const crumbs = [];
  for (let i = 0; i < 30; i++) {
    const w = toWorld(sketch, rnd(30, sketch.w - 30), rnd(30, sketch.h - 30)), n = 3 + (Math.random() * 2 | 0), a = rnd(0, 6.3);
    crumbs.push({ x: w.x, y: w.y, vx: 0, vy: 0, a, curl: rnd(-.9, .9), len: rnd(8, 15), th: rnd(3.2, 4.6), off: 0, specks: Array.from({ length: n }, () => [rnd(-9, 9), rnd(-9, 9), rnd(.6, 1.3)]) });
  }
  const [nx0, ny0, nx1, ny1] = LY.notes, notes = [];
  NOTES.forEach(([t, c]) => {
    let x, y, k = 0;
    do { x = rnd(nx0, nx1 - 106); y = rnd(ny0, ny1 - 106); k++; }
    while (k < 120 && (AVOID.some(([ax, ay, ar]) => Math.hypot(x + 53 - ax, y + 53 - ay) < ar) || notes.some(n => Math.hypot(n.x - x, n.y - y) < 130)));
    notes.push({ x, y, w: 106, h: 106, rot: rnd(-.25, .25), t, c, binned: 0, k: 0 });
  });
  const typos = [];
  LINES.forEach(ln => ln.forEach(tok => { if (typeof tok !== 'string') typos.push({ wrong: tok[0], right: tok[1], fixed: 0, at: 0 }); }));
  st = { mode: 'ready', t: TIME, ipad, sketch, forms, typos, crumbs, notes, bin: LY.bin, done: {}, doneAt: {}, fx: [], drag: null, shake: 0, result: 0,
    hold: null, ink: 0, tissue: null, used: [], ptr: { x: DW / 2, y: DH / 2 }, press: 0, edit: null, focus: null, tip: '', tipT: 0 };
  closeEditor(); resize(); buildHud();
}

const bg = new Image(); bg.src = 'desk.jpg';
const LM = document.createElement('canvas'); let lmReady = false;
bg.onload = () => {
  const w = 320, h = Math.round(320 * bg.height / bg.width), t = document.createElement('canvas'); t.width = w; t.height = h;
  const x = t.getContext('2d'); x.filter = 'blur(14px)'; x.drawImage(bg, -20, -20, w + 40, h + 40); x.filter = 'none';
  const d = x.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const l = (d.data[i] * .3 + d.data[i + 1] * .59 + d.data[i + 2] * .11) / 255, v = Math.min(1, Math.pow(l / .78, 1.15) * 1.05 + .03);
    d.data[i] = 255 * Math.min(1, v * 1.04); d.data[i + 1] = 255 * v * .9; d.data[i + 2] = 255 * v * .74; d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0); LM.width = w; LM.height = h; LM.getContext('2d').drawImage(t, 0, 0); lmReady = true;
};
const PEN = "'Nanum Pen Script', cursive";
let paperPat = null;
function sheet(p, col = '#fbf8f1', lift = 1) {
  if (!paperPat) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) { const v = 228 + Math.random() * 27; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); paperPat = cx.createPattern(c, 'repeat');
  }
  const k = p.s || 1;
  withPaper(p, () => {
    cx.save(); shadowFor(p.x + p.w * k / 2, p.y + p.h * k / 2, 4 * lift); cx.fillStyle = col; cx.fillRect(0, 0, p.w, p.h); cx.restore();
    cx.save(); cx.globalCompositeOperation = 'multiply'; cx.globalAlpha = .35; cx.fillStyle = paperPat; cx.fillRect(0, 0, p.w, p.h);
    const g = cx.createLinearGradient(0, 0, p.w, p.h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.7, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,100,80,.55)');
    cx.globalAlpha = 1; cx.fillStyle = g; cx.fillRect(0, 0, p.w, p.h); cx.restore();
  });
}
const rnd0 = i => { const v = Math.sin(i * 91.7 + 13.1) * 43758.5; return v - Math.floor(v); };
function drawSketch() {
  const p = st.sketch; sheet(p, '#f7f3ea');
  withPaper(p, () => {
    cx.strokeStyle = 'rgba(70,70,80,.55)'; cx.lineWidth = 1.6; cx.lineCap = 'round';
    cx.beginPath(); cx.rect(60, 60, 150, 110); cx.moveTo(250, 70); cx.lineTo(370, 70); cx.moveTo(250, 100); cx.lineTo(350, 100); cx.moveTo(250, 130); cx.lineTo(330, 130); cx.stroke();
    cx.beginPath(); cx.moveTo(60, 230); cx.bezierCurveTo(140, 190, 220, 280, 370, 220); cx.stroke();
    cx.fillStyle = 'rgba(70,70,80,.5)'; cx.font = `30px ${PEN}`; cx.fillText('시안 B — 이거로?', 70, 290);
    cx.fillStyle = 'rgba(90,90,100,.1)'; for (let i = 0; i < 6; i++) { cx.save(); cx.translate(rnd0(i) * p.w, 30 + rnd0(i + 9) * (p.h - 60)); cx.rotate(rnd0(i + 3) * 3); cx.beginPath(); cx.ellipse(0, 0, 30, 9, 0, 0, 7); cx.fill(); cx.restore(); }
    cx.save(); cx.translate(345, 265); cx.rotate(-.35); shadowFor(p.x + 250, p.y + 200, 5);
    cx.fillStyle = '#f2b8b0'; cx.beginPath(); cx.roundRect(-46, -15, 92, 30, 7); cx.fill(); noShadow();
    const eg = cx.createLinearGradient(0, -15, 0, 15); eg.addColorStop(0, 'rgba(255,255,255,.35)'); eg.addColorStop(1, 'rgba(120,40,40,.25)'); cx.fillStyle = eg; cx.beginPath(); cx.roundRect(-46, -15, 92, 30, 7); cx.fill();
    cx.fillStyle = '#2c5fb5'; cx.fillRect(-20, -16, 66, 32); cx.fillStyle = '#f4f4f2'; cx.fillRect(-20, -6, 66, 12);
    cx.fillStyle = '#2c5fb5'; cx.font = `900 9px 'Noto Sans KR', sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('ERASER', 13, 0);
    cx.restore();
  });
}
const SEALS = {};
function seal(name, seed, strength = 1) {
  const key = name + seed + strength; if (SEALS[key]) return SEALS[key];
  const N = 160, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), R = i => rnd0(i * 13.7 + seed * 101);
  x.translate(N / 2, N / 2); x.fillStyle = x.strokeStyle = '#c2201b';
  x.lineWidth = 9; x.beginPath(); for (let i = 0; i <= 64; i++) { const a = i / 64 * 6.283, rr = 66 + (R(i) - .5) * 2.6; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); x.stroke();
  const ch = [...name]; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (ch.length === 3) {
    x.font = `900 56px 'Noto Serif KR', serif`; x.lineWidth = 3.5; x.lineJoin = 'round';
    [[0, -36], [0, 3], [0, 41]].forEach(([tx, ty], i) => { x.save(); x.translate(tx, ty); x.scale(1.3, .74); x.fillText(ch[i], 0, 2); x.strokeText(ch[i], 0, 2); x.restore(); });
  } else { x.font = `900 60px 'Noto Serif KR', serif`; x.save(); x.scale(1.1, .9); x.fillText(name, 0, 2); x.restore(); }
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 150; i++) { const a = R(i + 300) * 6.283, d = Math.sqrt(R(i + 600)) * 72; x.globalAlpha = .2 + R(i + 900) * .6; x.beginPath(); x.arc(Math.cos(a) * d, Math.sin(a) * d, .5 + R(i + 1200) * 1.5, 0, 7); x.fill(); }
  const weak = R(5) * 6.283, wk = 1 - strength * .75;
  const g = x.createRadialGradient(Math.cos(weak) * 70, Math.sin(weak) * 70, 4, Math.cos(weak) * 70, Math.sin(weak) * 70, 90); g.addColorStop(0, `rgba(0,0,0,${.35 + wk * .55})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalAlpha = 1; x.fillStyle = g; x.fillRect(-N, -N, N * 2, N * 2);
  x.globalAlpha = .1; for (let i = 0; i < 12; i++) { x.beginPath(); x.ellipse((R(i + 40) - .5) * 110, (R(i + 70) - .5) * 110, 6 + R(i + 90) * 14, 3 + R(i + 95) * 6, R(i) * 3, 0, 7); x.fill(); }
  x.globalCompositeOperation = 'source-atop'; x.globalAlpha = .35; x.fillStyle = '#8e0f0c';
  for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse((R(i + 140) - .5) * 90, (R(i + 150) - .5) * 90, 10 + R(i + 160) * 16, 5 + R(i + 165) * 8, R(i + 3) * 3, 0, 7); x.fill(); }
  return SEALS[key] = c;
}
function stampMark(img, x, y, r, rot, a) { cx.save(); cx.translate(x, y); cx.rotate(rot); cx.globalAlpha = a; cx.globalCompositeOperation = 'multiply'; cx.drawImage(img, -r, -r, r * 2, r * 2); cx.restore(); }
function drawForms() {
  st.forms.forEach((f, i) => {
    sheet(f, '#fdfcf8', .8);
    withPaper(f, () => {
      cx.fillStyle = '#1d1d22'; cx.font = `900 24px 'Noto Serif KR', serif`; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic'; cx.fillText('결 재', f.w / 2, 46);
      cx.font = `500 13px 'Noto Sans KR', sans-serif`; cx.fillStyle = '#5b574f'; cx.fillText(['예산 집행 요청', '외주 계약 연장', '연차 사용 신청'][i], f.w / 2, 70);
      const cw = (f.w - 40) / 3; cx.strokeStyle = '#3d3a35'; cx.lineWidth = 1.2;
      ['담당', '팀장', '대표'].forEach((t, j) => { cx.strokeRect(20 + j * cw, 90, cw, 24); cx.strokeRect(20 + j * cw, 114, cw, 56); cx.fillStyle = '#3d3a35'; cx.fillText(t, 20 + j * cw + cw / 2, 107); });
      cx.fillStyle = 'rgba(60,60,70,.35)'; for (let k = 0; k < 6; k++) cx.fillRect(22, 192 + k * 12, (f.w - 44) * (.5 + rnd0(i * 7 + k) * .5), 4);
      const col = j => 20 + cw * j + cw / 2;
      stampMark(seal('김수진', i * 3 + 1), col(0) + (rnd0(i + 30) - .5) * 6, 142 + (rnd0(i + 31) - .5) * 6, 21, (rnd0(i + 32) - .5) * .5, .86);
      stampMark(seal('박정호', i * 3 + 2), col(1) + (rnd0(i + 33) - .5) * 6, 142 + (rnd0(i + 34) - .5) * 6, 21, (rnd0(i + 35) - .5) * .5, .84);
      if (f.faint) stampMark(seal('한마감', i * 3 + 7, .15), col(2) + 2, 143, 22, f.fsr, .35);
      if (f.done) { const k = Math.min(1, (now - f.at) / 90); stampMark(seal('한마감', i * 3 + 3, f.str || 1), col(2) + f.ox, 142 + f.oy, 22 * (1 + (1 - k) * .15), f.sr, .9 * k); }
    });
  });
}
const SCR = { x: 28, y: 28, w: 470, h: 640 };
function ipadBody() {
  const p = st.ipad, k = p.s;
  withPaper(p, () => {
    cx.save(); shadowFor(p.x + p.w * k / 2, p.y + p.h * k / 2, 7);
    cx.fillStyle = '#8d8f93'; cx.beginPath(); cx.roundRect(0, 0, p.w, p.h, 38); cx.fill(); cx.restore();
    const g = cx.createLinearGradient(0, 0, p.w, p.h); g.addColorStop(0, '#c9cbcf'); g.addColorStop(.5, '#6e7074'); g.addColorStop(1, '#a7a9ad');
    cx.strokeStyle = g; cx.lineWidth = 4; cx.beginPath(); cx.roundRect(2, 2, p.w - 4, p.h - 4, 36); cx.stroke();
    cx.fillStyle = '#0c0c0e'; cx.beginPath(); cx.roundRect(7, 7, p.w - 14, p.h - 14, 32); cx.fill();
    cx.fillStyle = '#1d2a3a'; cx.beginPath(); cx.arc(p.w / 2, 17, 3.2, 0, 7); cx.fill();
  });
}
function screenPath(c, p) { c.save(); withPaperOn(c, p, () => { c.beginPath(); c.roundRect(SCR.x, SCR.y, SCR.w, SCR.h, 8); }); c.restore(); }
function withPaperOn(c, p, f) { const k = p.s; c.translate(p.x + p.w * k / 2, p.y + p.h * k / 2); c.rotate(p.rot); c.scale(k, k); c.translate(-p.w / 2, -p.h / 2); f(); }
function ipadScreen() {
  const p = st.ipad;
  withPaper(p, () => {
    cx.save(); cx.beginPath(); cx.roundRect(SCR.x, SCR.y, SCR.w, SCR.h, 8); cx.clip(); cx.translate(SCR.x, SCR.y);
    cx.fillStyle = '#eeeef1'; cx.fillRect(0, 0, SCR.w, 56);
    cx.fillStyle = '#1d1d22'; cx.font = `600 11px 'IBM Plex Mono', monospace`; cx.textBaseline = 'middle'; cx.textAlign = 'left'; cx.fillText('23:59', 14, 11);
    cx.textAlign = 'right'; cx.fillStyle = '#e0362c'; cx.fillText('3% ▭', SCR.w - 12, 11);
    cx.textAlign = 'center'; cx.fillStyle = '#1d1d22'; cx.font = `700 13px 'Noto Sans KR', sans-serif`; cx.fillText('하반기 결산 보고서.pages', SCR.w / 2, 36);
    cx.fillStyle = '#1a73e8'; cx.textAlign = 'left'; cx.font = `500 13px 'Noto Sans KR', sans-serif`; cx.fillText('〈 문서', 12, 36);
    cx.textAlign = 'right'; cx.fillText('완료', SCR.w - 14, 36);
    cx.fillStyle = '#ffffff'; cx.fillRect(0, 56, SCR.w, SCR.h - 56);
    const oy = 44;
    cx.fillStyle = '#1d1d22'; cx.font = `900 28px 'Noto Serif KR', serif`; cx.textAlign = 'left'; cx.textBaseline = 'alphabetic'; cx.fillText('하반기 결산 보고서', 36, oy + 70);
    cx.fillStyle = '#8a8578'; cx.font = `500 13px 'Noto Sans KR', sans-serif`; cx.fillText('작성 2026.11.27 · 제출 기한 오늘 24:00', 36, oy + 96);
    cx.fillStyle = '#1d1d22'; cx.fillRect(36, oy + 110, SCR.w - 72, 2);
    let ti = 0;
    LINES.forEach((ln, li) => {
      let x = 36; const y = oy + 156 + li * 44; cx.font = `500 21px 'Noto Serif KR', serif`;
      ln.forEach(tok => {
        if (typeof tok === 'string') { cx.fillStyle = '#26262c'; cx.fillText(tok, x, y); x += cx.measureText(tok).width; return; }
        const t = st.typos[ti++], txt = t.fixed ? t.right : t.wrong, w = cx.measureText(txt).width;
        t.box = [SCR.x + x - 3, SCR.y + y - 24, w + 6, 32]; t.base = [SCR.x + x, SCR.y + y];
        if (st.edit === t) { x += Math.max(w, cx.measureText(t.right).width); return; }
        if (!t.fixed) {
          cx.fillStyle = '#26262c'; cx.fillText(txt, x, y);
          cx.strokeStyle = '#e0362c'; cx.lineWidth = 1.8; cx.beginPath(); for (let X = 0; X <= w; X += 3) cx.lineTo(x + X, y + 6 + Math.sin(X * .7) * 2); cx.stroke();
        } else { const k = Math.min(1, (now - t.at) / 300); cx.fillStyle = `rgba(31,79,168,${.4 + .6 * k})`; cx.fillText(txt, x, y); }
        x += w;
      });
    });
    cx.fillStyle = '#b5afa1'; cx.font = `500 12px 'Noto Sans KR', sans-serif`; cx.textAlign = 'center'; cx.fillText('— 1 —', SCR.w / 2, SCR.h - 20);
    const gl = cx.createLinearGradient(0, 0, SCR.w, SCR.h); gl.addColorStop(0, 'rgba(255,255,255,.07)'); gl.addColorStop(.4, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,0,.08)');
    cx.fillStyle = gl; cx.fillRect(0, 0, SCR.w, SCR.h);
    cx.restore();
  });
}
function renderSpill() {
  const { M, C, E } = SP, c = C.getContext('2d'), e = E.getContext('2d'), w = C.width;
  c.globalCompositeOperation = 'copy'; c.drawImage(M, 0, 0); c.globalCompositeOperation = 'source-in';
  const [lx, ly] = LY.lamp, [sx, sy] = LY.spill, a = Math.atan2(ly - sy, lx - sx);
  const g = c.createRadialGradient(w / 2, w / 2, 4, w / 2, w / 2, w / 2); g.addColorStop(0, '#4f280c'); g.addColorStop(.7, '#3a1c07'); g.addColorStop(1, '#241003'); c.fillStyle = g; c.fillRect(0, 0, w, w);
  e.globalCompositeOperation = 'copy'; e.drawImage(M, 0, 0); e.globalCompositeOperation = 'destination-out'; e.filter = `blur(${6 * SP.k}px)`; e.drawImage(M, 0, 0); e.drawImage(M, 0, 0); e.filter = 'none';
  e.globalCompositeOperation = 'source-in'; e.fillStyle = '#120600'; e.fillRect(0, 0, w, w); e.globalCompositeOperation = 'source-over';
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = .9; c.drawImage(E, 0, 0); c.globalAlpha = 1;
  const h = SP.HC.getContext('2d'); h.globalCompositeOperation = 'copy'; h.drawImage(M, 0, 0); h.globalCompositeOperation = 'source-in';
  const hx = w / 2 + Math.cos(a) * w * .12, hy = w / 2 + Math.sin(a) * w * .12, hg = h.createRadialGradient(hx, hy, 1, hx, hy, w * .13);
  hg.addColorStop(0, 'rgba(255,232,190,.4)'); hg.addColorStop(.3, 'rgba(255,215,160,.1)'); hg.addColorStop(1, 'rgba(255,215,160,0)'); h.fillStyle = hg; h.fillRect(0, 0, w, w);
  h.globalCompositeOperation = 'source-atop'; h.fillStyle = 'rgba(255,252,240,.9)'; h.beginPath(); h.ellipse(hx - 5, hy - 3, w * .04, w * .013, a + 1.2, 0, 7); h.fill();
  h.fillStyle = 'rgba(255,240,215,.35)'; h.beginPath(); h.ellipse(hx + w * .05, hy + w * .04, w * .022, w * .008, a + 1.2, 0, 7); h.fill(); h.globalCompositeOperation = 'source-over';
  c.globalCompositeOperation = 'source-over'; SP.dirty = 0;
}
function drawSpill() { if (SP.dirty) renderSpill(); const s = SP.C.width / SP.k; cx.globalAlpha = .84; cx.drawImage(SP.C, SP.o[0], SP.o[1], s, s); cx.globalAlpha = 1; }
function spillGloss() { const s = SP.C.width / SP.k; cx.globalCompositeOperation = 'screen'; cx.drawImage(SP.HC, SP.o[0], SP.o[1], s, s); cx.globalCompositeOperation = 'source-over'; }
function drawCrumbs() {
  cx.lineCap = 'round'; cx.lineJoin = 'round';
  st.crumbs.forEach(c => {
    if (c.off >= 1) return;
    cx.globalAlpha = 1 - c.off;
    cx.fillStyle = 'rgba(150,140,135,.8)'; c.specks.forEach(([dx, dy, r]) => { cx.beginPath(); cx.arc(c.x + dx, c.y + dy, r, 0, 7); cx.fill(); });
    const L = c.len, pts = [-1, -.35, .35, 1].map(t => { const a = c.a + c.curl * t; return [c.x + Math.cos(c.a) * L * t * .5 + Math.cos(a + 1.57) * c.curl * 3 * (1 - t * t), c.y + Math.sin(c.a) * L * t * .5 + Math.sin(a + 1.57) * c.curl * 3 * (1 - t * t)]; });
    const path = () => { cx.beginPath(); cx.moveTo(...pts[0]); cx.bezierCurveTo(...pts[1], ...pts[2], ...pts[3]); };
    cx.save(); shadowFor(c.x, c.y, 1.6); cx.strokeStyle = '#b9aea8'; cx.lineWidth = c.th; path(); cx.stroke(); cx.restore();
    cx.strokeStyle = '#e2d7d0'; cx.lineWidth = c.th * .55; cx.save(); cx.translate(-.5, -.6); path(); cx.stroke(); cx.restore();
    cx.strokeStyle = 'rgba(255,255,255,.6)'; cx.lineWidth = .8; cx.save(); cx.translate(-.8, -1); path(); cx.stroke(); cx.restore();
  });
  cx.globalAlpha = 1;
}
function drawInk() {
  const [x, y, r] = LY.ink;
  cx.save(); shadowFor(x, y, 5); cx.fillStyle = '#5a5c60'; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill(); cx.restore();
  const g = cx.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, '#d9dbde'); g.addColorStop(.5, '#7a7c80'); g.addColorStop(1, '#b8babe');
  cx.strokeStyle = g; cx.lineWidth = 5; cx.beginPath(); cx.arc(x, y, r - 2.5, 0, 7); cx.stroke();
  const f = cx.createRadialGradient(x - r * .3, y - r * .3, 2, x, y, r * .85); f.addColorStop(0, '#d0262a'); f.addColorStop(1, '#7c0d12');
  cx.fillStyle = f; cx.beginPath(); cx.arc(x, y, r - 6, 0, 7); cx.fill();
  cx.fillStyle = 'rgba(40,0,0,.25)'; for (let i = 0; i < 40; i++) { const a = rnd0(i) * 6.3, d = rnd0(i + 50) * (r - 9); cx.beginPath(); cx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, .9, 0, 7); cx.fill(); }
  cx.fillStyle = 'rgba(255,200,200,.18)'; cx.beginPath(); cx.ellipse(x - r * .3, y - r * .35, r * .35, r * .14, -.6, 0, 7); cx.fill();
  if (st.dip && now - st.dip < 300) { cx.fillStyle = `rgba(90,0,0,${.4 * (1 - (now - st.dip) / 300)})`; cx.beginPath(); cx.arc(st.dipX, st.dipY, 22, 0, 7); cx.fill(); }
}
function stampBody(len, w) {
  const g = cx.createLinearGradient(0, -w / 2, 0, w / 2);
  g.addColorStop(0, '#120c09'); g.addColorStop(.22, '#4a3326'); g.addColorStop(.38, '#8a6a52'); g.addColorStop(.5, '#3a271d'); g.addColorStop(1, '#0d0806');
  cx.fillStyle = g; cx.beginPath(); cx.roundRect(-len / 2, -w / 2, len, w, [w * .5, 4, 4, w * .5]); cx.fill();
  cx.fillStyle = 'rgba(255,230,200,.07)'; for (let i = 0; i < 7; i++) cx.fillRect(-len / 2 + 8 + i * len / 8, -w / 2 + 2, 1.2, w - 4);
  const gold = cx.createLinearGradient(0, -w / 2, 0, w / 2); gold.addColorStop(0, '#6d4f17'); gold.addColorStop(.35, '#f5d98a'); gold.addColorStop(.55, '#b88b34'); gold.addColorStop(1, '#4e380e');
  cx.fillStyle = gold; cx.fillRect(len / 2 - 20, -w / 2, 7, w);
}
function stampLying(x, y, ang) {
  const len = 92, w = 25;
  cx.save(); cx.translate(x, y); cx.rotate(ang); shadowFor(x, y, 9);
  cx.fillStyle = '#100a07'; cx.beginPath(); cx.roundRect(-len / 2, -w / 2, len, w, [w * .5, 4, 4, w * .5]); cx.fill(); noShadow();
  stampBody(len, w);
  const fg = cx.createLinearGradient(len / 2 - 3, -w / 2, len / 2 + 5, w / 2); fg.addColorStop(0, '#c9a86f'); fg.addColorStop(1, '#8c6a3a');
  cx.fillStyle = fg; cx.beginPath(); cx.ellipse(len / 2, 0, 4.5, w / 2, 0, 0, 7); cx.fill();
  cx.fillStyle = st.ink ? 'rgba(200,25,20,.9)' : 'rgba(170,40,35,.35)'; cx.beginPath(); cx.ellipse(len / 2 + .5, 0, 3, w / 2 - 3, 0, 0, 7); cx.fill();
  cx.restore();
}
function stampHeld(x, y, pressing) {
  const lift = pressing ? 2 : 16, dx = x - LY.lamp[0], dy = y - LY.lamp[1], d = Math.hypot(dx, dy) || 1;
  cx.save(); shadowFor(x, y, lift + 30); cx.fillStyle = '#100a07'; cx.beginPath(); cx.ellipse(x, y, 13, 13, 0, 0, 7); cx.fill(); noShadow(); cx.restore();
  cx.save(); cx.translate(x, y - lift * .4); cx.rotate(-Math.PI / 2 - .35);
  cx.translate(26, 0); stampBody(54, 25);
  cx.fillStyle = '#2a1b13'; cx.beginPath(); cx.ellipse(-27, 0, 7, 12.5, 0, 0, 7); cx.fill();
  const tg = cx.createRadialGradient(-29, -4, 1, -27, 0, 13); tg.addColorStop(0, '#9c7a5e'); tg.addColorStop(1, '#2a1a12');
  cx.fillStyle = tg; cx.beginPath(); cx.ellipse(-27, 0, 6, 11.5, 0, 0, 7); cx.fill();
  cx.restore();
  if (st.ink) { cx.fillStyle = 'rgba(200,25,20,.55)'; cx.beginPath(); cx.ellipse(x + 2, y + 9 - lift * .4, 11, 3.5, -.35, 0, 7); cx.fill(); }
}
function drawPack() {
  const [x, y, w, h, r] = LY.pack;
  cx.save(); cx.translate(x, y); cx.rotate(r); shadowFor(x, y, 6);
  cx.fillStyle = '#dfe9ee'; cx.beginPath(); cx.roundRect(-w / 2, -h / 2, w, h, 22); cx.fill(); noShadow();
  const g = cx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(60,90,110,.25)');
  cx.fillStyle = g; cx.beginPath(); cx.roundRect(-w / 2, -h / 2, w, h, 22); cx.fill();
  cx.fillStyle = '#2f8fc9'; cx.beginPath(); cx.roundRect(-w / 2 + 10, h / 2 - 26, w - 20, 16, 5); cx.fill();
  cx.fillStyle = '#fff'; cx.font = `900 10px 'Noto Sans KR', sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('물티슈 · 80매', 0, h / 2 - 18);
  cx.fillStyle = '#9fc7dc'; cx.beginPath(); cx.ellipse(0, -10, 40, 17, 0, 0, 7); cx.fill();
  if (st.hold !== 'tissue') { cx.fillStyle = '#ffffff'; blob(cx, 0, -12, 22, 8, .25, 3); cx.fill(); cx.strokeStyle = 'rgba(0,0,0,.08)'; cx.lineWidth = 1; cx.stroke(); }
  cx.fillStyle = 'rgba(255,255,255,.6)'; cx.beginPath(); cx.ellipse(-w * .28, -h * .28, 22, 6, -.2, 0, 7); cx.fill();
  cx.restore();
}
function tissueShape(x, y, rot, s, dirt, h) {
  cx.save(); cx.translate(x, y); cx.rotate(rot); cx.scale(s, s); shadowFor(x, y, h);
  cx.fillStyle = '#fbfcfd'; cx.beginPath(); cx.moveTo(-34, -30); cx.quadraticCurveTo(0, -38, 34, -30); cx.quadraticCurveTo(40, 0, 33, 31); cx.quadraticCurveTo(0, 38, -33, 30); cx.quadraticCurveTo(-41, 0, -34, -30); cx.fill(); noShadow();
  cx.strokeStyle = 'rgba(120,140,150,.18)'; cx.lineWidth = 1; for (let i = -2; i <= 2; i++) { cx.beginPath(); cx.moveTo(-28, i * 12); cx.quadraticCurveTo(0, i * 12 + 5, 28, i * 12 - 2); cx.stroke(); }
  if (dirt > 0) { cx.fillStyle = `rgba(90,48,16,${Math.min(.85, dirt * .9)})`; cx.beginPath(); cx.ellipse(4, 6, 10 + dirt * 22, 8 + dirt * 18, .3, 0, 7); cx.fill(); }
  cx.restore();
}
function drawUsed() { st.used.forEach(u => { if (u.binned) return; const lifted = st.drag && st.drag.used === u; cx.save(); cx.translate(u.x, u.y); cx.rotate(u.rot); shadowFor(u.x, u.y, lifted ? 22 : 4); cx.fillStyle = '#efe6dc'; blob(cx, 0, 0, 20, 11, .35, u.seed); cx.fill(); noShadow(); cx.fillStyle = 'rgba(95,52,18,.7)'; blob(cx, 3, 2, 12, 9, .4, u.seed + 1); cx.fill(); cx.strokeStyle = 'rgba(0,0,0,.18)'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(-12, -5); cx.lineTo(6, 7); cx.moveTo(-3, -14); cx.lineTo(10, -3); cx.stroke(); cx.restore(); }); }
const HAND = { '메일 회신': ['메일 회신', '김팀장님께!'], '회의록 정리': ['회의록', '정리 → 공유'], '견적서!!': ['견적서!!', '오늘까지'], '전화 걸기': ['전화 걸기', '010-…'], '백업 꼭': ['백업 꼭', '외장하드'] };
function hand(n) {
  if (!n.ink) {
    const R = (i) => rnd0(i + n.t.length * 7 + n.c.charCodeAt(1)), lines = HAND[n.t] || [n.t], ink = R(3) < .5 ? '#1c2a55' : '#1d1d24';
    n.ink = { ink, lines: lines.map((l, li) => ({ l, size: li ? 23 : 33, chars: [...l].map((ch, ci) => ({ ch, r: (R(ci * 3 + li * 17) - .5) * .16, dy: (R(ci * 5 + li * 11) - .5) * 3.2, sc: .92 + R(ci * 7 + li) * .16 })) })), slant: (R(9) - .5) * .12, under: R(4) < .55, li2: R(6) };
  }
  const I = n.ink; cx.save(); cx.rotate(I.slant); cx.textBaseline = 'alphabetic'; cx.textAlign = 'left';
  I.lines.forEach((L, li) => {
    cx.font = `${L.size}px ${PEN}`;
    const ws = L.chars.map(c => cx.measureText(c.ch).width * c.sc * .96), tot = ws.reduce((a, b) => a + b, 0);
    let x = -tot / 2 + (li ? 6 : -2); const y = li ? 30 : 0;
    L.chars.forEach((c, i) => {
      cx.save(); cx.translate(x, y + c.dy); cx.rotate(c.r); cx.scale(c.sc, c.sc);
      cx.fillStyle = I.ink; cx.globalAlpha = .82; cx.fillText(c.ch, 0, 0);
      cx.globalAlpha = .28; cx.fillText(c.ch, .7, .4); cx.fillText(c.ch, -.4, .6);
      cx.restore(); x += ws[i];
    });
    if (!li && I.under) { cx.strokeStyle = I.ink; cx.globalAlpha = .7; cx.lineWidth = 1.8; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(-tot / 2 - 4, y + 7); cx.quadraticCurveTo(0, y + 10 + I.li2 * 3, tot / 2 + 2, y + 5); cx.stroke(); cx.globalAlpha = 1; }
  });
  cx.restore();
}
function drawNote(n) {
  const k = n.binned ? Math.min(1, n.k) : 0;
  if (k >= 1) return;
  const [bx, by] = st.bin, cxn = n.x + n.w / 2, cyn = n.y + n.h / 2, px = cxn + (bx - cxn) * k, py = cyn + (by - cyn) * k, s = 1 - .8 * k;
  const lifted = st.drag && st.drag.note === n;
  cx.save(); cx.translate(px, py); cx.rotate(n.rot + k * 3); cx.scale(s * (lifted ? 1.06 : 1), s * (lifted ? 1.06 : 1));
  shadowFor(px, py, lifted ? 26 : 3);
  cx.fillStyle = n.c; cx.fillRect(-n.w / 2, -n.h / 2, n.w, n.h); noShadow();
  cx.fillStyle = 'rgba(0,0,0,.06)'; cx.fillRect(-n.w / 2, -n.h / 2, n.w, 20);
  cx.save(); cx.translate(0, -12);
  hand(n); cx.restore();
  const g = cx.createLinearGradient(0, n.h / 2 - 26, 0, n.h / 2); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.12)'); cx.fillStyle = g; cx.fillRect(-n.w / 2, n.h / 2 - 26, n.w, 26);
  cx.restore();
}
function drawBinned() {
  const [x, y] = st.bin;
  st.used.filter(u => u.binned).forEach((u, i) => { cx.save(); cx.translate(x + 30 + Math.cos(i * 2.9) * 30, y + 20 + Math.sin(i * 2.9) * 26); cx.rotate(u.rot); shadowFor(x, y, 3); cx.fillStyle = '#e9e0d6'; blob(cx, 0, 0, 20, 11, .35, u.seed); cx.fill(); noShadow(); cx.fillStyle = 'rgba(95,52,18,.7)'; blob(cx, 3, 2, 12, 9, .4, u.seed + 1); cx.fill(); cx.restore(); });
  st.notes.filter(n => n.binned && n.k >= 1).forEach((n, i) => { cx.save(); cx.translate(x - 20 + Math.cos(i * 2.3) * 40, y - 10 + Math.sin(i * 2.3) * 34); cx.rotate(i * 1.7); shadowFor(x, y, 3); cx.fillStyle = n.c; blob(cx, 0, 0, 24, 9, .4, i + 11); cx.fill(); noShadow(); cx.strokeStyle = 'rgba(0,0,0,.25)'; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(-14, -4); cx.lineTo(6, 8); cx.moveTo(-4, -14); cx.lineTo(10, -2); cx.stroke(); cx.restore(); });
}
function clockBody() {
  const [x, y] = LY.clock;
  cx.save(); cx.translate(x, y); shadowFor(x, y, 9);
  cx.fillStyle = '#1b1b1d'; cx.beginPath(); cx.roundRect(-128, -32, 256, 64, 14); cx.fill(); noShadow();
  const g = cx.createLinearGradient(0, -32, 0, 32); g.addColorStop(0, 'rgba(255,255,255,.16)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); cx.fillStyle = g; cx.beginPath(); cx.roundRect(-128, -32, 256, 64, 14); cx.fill();
  cx.fillStyle = '#060606'; cx.beginPath(); cx.roundRect(-112, -22, 224, 44, 6); cx.fill();
  cx.restore();
}
function drawClock() {
  const [x, y] = LY.clock, t = Math.max(0, st.t), sec = Math.ceil(t), hot = st.mode === 'play' && t < 10, blink = hot && (t % 1) < .35;
  const label = st.mode === 'lose' || t <= 0 ? '00:00:00' : `23:59:${String(60 - sec).padStart(2, '0')}`;
  cx.save(); cx.translate(x, y);
  cx.fillStyle = 'rgba(255,60,40,.08)'; cx.font = `700 34px 'IBM Plex Mono', monospace`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('88:88:88', 0, 1);
  cx.globalCompositeOperation = 'lighter';
  const r = cx.createRadialGradient(0, 0, 10, 0, 0, 170); r.addColorStop(0, `rgba(255,70,30,${blink ? .28 : .16})`); r.addColorStop(1, 'rgba(255,70,30,0)'); cx.fillStyle = r; cx.fillRect(-180, -110, 360, 220);
  cx.globalCompositeOperation = 'source-over';
  cx.fillStyle = blink ? '#ff9a80' : '#ff4a2e'; cx.shadowColor = '#ff3a1e'; cx.shadowBlur = 16 * S * DPR; cx.fillText(label, 0, 1);
  cx.restore();
}
function drawFx(dt) {
  st.fx = st.fx.filter(f => (f.t += dt) < f.d);
  st.fx.forEach(f => {
    const k = f.t / f.d; cx.globalAlpha = 1 - k;
    if (f.kind === 'pop') { cx.strokeStyle = f.c; cx.lineWidth = 3; cx.beginPath(); cx.arc(f.x, f.y, 10 + k * 40, 0, 7); cx.stroke(); }
    if (f.kind === 'txt') { cx.font = `700 18px 'Noto Sans KR', sans-serif`; cx.textAlign = 'center'; cx.lineWidth = 4; cx.strokeStyle = 'rgba(0,0,0,.7)'; cx.strokeText(f.s, f.x, f.y - k * 30); cx.fillStyle = f.c; cx.fillText(f.s, f.x, f.y - k * 30); }
    cx.globalAlpha = 1;
  });
}
function focusRings() {
  const k = st.focus; if (!k || st.done[k]) return;
  const a = .45 + .35 * Math.sin(now / 160), ring = (x, y, r) => { cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.stroke(); };
  cx.save(); cx.strokeStyle = `rgba(255,200,90,${a})`; cx.lineWidth = 3; cx.setLineDash([10, 8]); cx.lineDashOffset = -now / 40;
  if (k === 'coffee') { ring(LY.spill[0], LY.spill[1], LY.spill[2] * 1.45); ring(LY.pack[0], LY.pack[1], 90); st.used.forEach(u => { if (!u.binned) ring(u.x, u.y, 32); }); }
  if (k === 'typo') { const p = st.ipad; withPaper(p, () => { cx.beginPath(); cx.roundRect(-10, -10, p.w + 20, p.h + 20, 44); cx.stroke(); }); }
  if (k === 'crumb') { const p = st.sketch; withPaper(p, () => { cx.strokeRect(-10, -10, p.w + 20, p.h + 20); }); }
  if (k === 'stamp') { ring(LY.stampHome[0], LY.stampHome[1], 40); ring(LY.ink[0], LY.ink[1], 58); st.forms.forEach(f => { if (!f.done) withPaper(f, () => cx.strokeRect(-8, -8, f.w + 16, f.h + 16)); }); }
  if (k === 'note') { ring(st.bin[0], st.bin[1], st.bin[2] + 20); st.notes.forEach(n => { if (!n.binned) ring(n.x + 53, n.y + 53, 80); }); }
  cx.restore();
}
function drawResult() {
  if (st.mode !== 'win' && st.mode !== 'lose') return;
  const k = Math.min(1, (now - st.result) / 260), sc = 1 + (1 - k) * 1.6, win = st.mode === 'win';
  cx.fillStyle = `rgba(10,6,4,${.5 * k})`; cx.fillRect(-OX / S, -OY / S, W / S, H / S);
  cx.save(); cx.translate(DW / 2, DH * .45); cx.rotate(-.12); cx.scale(sc, sc); cx.globalAlpha = k;
  const col = win ? '#e0302a' : '#f3efe6';
  cx.strokeStyle = col; cx.lineWidth = 10; cx.beginPath(); cx.roundRect(-300, -100, 600, 200, 24); cx.stroke();
  cx.lineWidth = 3; cx.beginPath(); cx.roundRect(-282, -82, 564, 164, 16); cx.stroke();
  cx.fillStyle = col; cx.font = `900 96px 'Noto Serif KR', serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(win ? '제출 완료' : '마감 실패', 0, -8);
  cx.font = `700 22px 'IBM Plex Mono', 'Noto Sans KR', monospace`;
  cx.fillText(win ? `23:59:${String(60 - Math.ceil(st.t)).padStart(2, '0')} 제출 · ${st.t.toFixed(1)}초 남김` : `남은 일 ${TASKS.filter(t => !st.done[t.k]).length}개`, 0, 62);
  cx.restore();
}

let actx = null, scrubG = null;
function audio() {
  if (actx) return;
  try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  const len = actx.sampleRate * 2, b = actx.createBuffer(1, len, actx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = actx.createBufferSource(); s.buffer = b; s.loop = true;
  const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = .6;
  scrubG = actx.createGain(); scrubG.gain.value = 0; s.connect(f).connect(scrubG).connect(actx.destination); s.start();
}
function tone(fr, dur = .12, type = 'sine', vol = .18, at = 0) {
  if (!actx) return;
  const t = actx.currentTime + at, o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = fr;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + .02);
}
const thud = () => { tone(90, .2, 'sine', .5); tone(180, .08, 'triangle', .2); };
const ding = () => { tone(1046, .25, 'triangle', .14); tone(1568, .35, 'triangle', .1, .07); };
const say = (s, x, y, c = '#ffd28a') => { st.fx.push({ kind: 'txt', s, x, y, c, t: 0, d: 1.4 }); st.tip = s; st.tipT = now; };

const ed = $('#ed'), mcx = document.createElement('canvas').getContext('2d');
function openEditor(t) {
  st.edit = t; ed.value = t.wrong; ed.classList.remove('bad'); ed.style.display = 'block'; placeEditor();
  setTimeout(() => { ed.focus(); ed.select(); }, 0); tone(1200, .04, 'square', .05);
}
function closeEditor() { if (st) st.edit = null; ed.style.display = 'none'; if (document.activeElement === ed) ed.blur(); }
function placeEditor() {
  const t = st.edit; if (!t) return;
  const p = st.ipad, f = 21 * p.s * S, w = toWorld(p, t.base[0], t.base[1] - 7);
  mcx.font = `500 21px 'Noto Serif KR', serif`;
  const tw = (Math.max(mcx.measureText(t.right).width, mcx.measureText(t.wrong).width) + 10) * p.s * S, h = f * 1.5;
  Object.assign(ed.style, { left: `${OX + w.x * S + 2}px`, top: `${OY + w.y * S - h / 2}px`, width: `${tw}px`, height: `${h}px`, lineHeight: `${h}px`, fontSize: `${f}px`, transform: `rotate(${p.rot}rad)` });
}
function checkEdit() {
  const t = st.edit; if (!t || st.mode !== 'play') return;
  if (ed.value.trim() === t.right) {
    t.fixed = 1; t.at = now; const w = toWorld(st.ipad, t.base[0] + 20, t.base[1] - 8);
    st.fx.push({ kind: 'pop', x: w.x, y: w.y, c: '#4f8cff', t: 0, d: .45 }); tone(1320, .08, 'triangle', .12); closeEditor();
    if (st.typos.every(t => t.fixed)) complete('typo');
  }
}
ed.addEventListener('input', checkEdit);
ed.addEventListener('compositionend', () => setTimeout(checkEdit, 0));
ed.addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key === 'Escape') closeEditor();
  if (e.key === 'Enter' && !e.isComposing) { checkEdit(); if (st.edit) { ed.classList.remove('bad'); void ed.offsetWidth; ed.classList.add('bad'); tone(220, .12, 'square', .08); say(`'${st.edit.right}'로 고쳐야 해요`, st.ipad.x + 180, st.ipad.y + 480); } }
});
ed.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== ed) closeEditor(); }, 0));

const tasksEl = $('#tasks'); let hudCache = '';
function buildHud() {
  tasksEl.innerHTML = '';
  TASKS.forEach(tk => {
    const li = document.createElement('li'); li.dataset.k = tk.k;
    li.innerHTML = `<i class="ic">${TASKS.indexOf(tk) + 1}</i><div><b>${tk.t}</b><small>${tk.how}</small><div class="bar"><span></span></div></div><em>0</em>`;
    li.onmouseenter = () => { st.focus = tk.k; }; li.onmouseleave = () => { st.focus = null; };
    tasksEl.append(li);
  });
  hudCache = '';
}
function progress(k) {
  if (k === 'coffee') { const left = st.used.filter(u => !u.binned).length; if (st.clean && left) return [.95, `휴지 ${left}`]; return [(1 - SP.left) * .9, `${Math.round((1 - SP.left) * 100)}%`]; }
  if (k === 'typo') { const n = st.typos.filter(t => t.fixed).length; return [n / 5, `${n}/5`]; }
  if (k === 'crumb') { const n = st.crumbs.filter(c => c.gone).length; return [n / st.crumbs.length, `${Math.round(n / st.crumbs.length * 100)}%`]; }
  if (k === 'stamp') { const n = st.forms.filter(f => f.done).length; return [n / 3, `${n}/3`]; }
  const n = st.notes.filter(n => n.binned).length; return [n / 5, `${n}/5`];
}
function hudTip() {
  if (st.tip && now - st.tipT < 2200) return st.tip;
  if (st.mode !== 'play') return '할 일에 마우스를 올리면 책상 위 위치가 보여요';
  if (st.edit) return `키보드로 '${st.edit.right}'라고 고쳐 입력하세요`;
  if (st.hold === 'stamp') return st.ink ? '결재 서류의 대표란을 눌러 쾅!' : '도장을 인주에 먼저 꾹 눌러요';
  if (st.used.some(u => !u.binned) && !st.hold) return '다 쓴 물티슈를 휴지통에 버려요';
  if (st.hold === 'tissue') return `커피를 문질러 닦아요 · 물티슈 ${Math.round(Math.min(1, st.tissue.dirt) * 100)}% 젖음`;
  return '할 일에 마우스를 올리면 책상 위 위치가 보여요';
}
function updateHud() {
  const ps = TASKS.map(t => progress(t.k)), done = TASKS.filter(t => st.done[t.k]).length, tip = hudTip();
  const key = ps.map(p => p[1]).join() + done + tip + Object.keys(st.done).join() + st.mode;
  $('#tbar').style.transform = `scaleX(${Math.max(0, st.t / TIME)})`; $('#tsec').textContent = `${Math.ceil(Math.max(0, st.t))}초`; $('#hud').classList.toggle('hot', st.mode === 'play' && st.t < 10);
  if (key === hudCache) return; hudCache = key;
  [...tasksEl.children].forEach((li, i) => {
    const k = TASKS[i].k, [v, s] = ps[i], was = li.classList.contains('done');
    li.querySelector('.bar span').style.width = `${Math.min(100, v * 100)}%`; li.querySelector('em').textContent = st.done[k] ? '완료' : s;
    li.classList.toggle('done', !!st.done[k]); if (st.done[k] && !was) { li.classList.remove('pop'); void li.offsetWidth; li.classList.add('pop'); li.querySelector('.ic').textContent = '✓'; }
    if (!st.done[k]) li.querySelector('.ic').textContent = i + 1;
    li.classList.toggle('next', st.mode === 'play' && !st.done[k] && TASKS.findIndex(t => !st.done[t.k]) === i);
  });
  $('#hc').textContent = `${done} / 5`; $('#tip').textContent = tip;
}

function world(e) { return { x: (e.clientX - OX) / S, y: (e.clientY - OY) / S }; }
function complete(k) {
  if (st.done[k]) return;
  st.done[k] = 1; st.doneAt[k] = now; ding();
  if (TASKS.every(t => st.done[t.k])) { st.mode = 'win'; st.result = now; st.hold = null; [523, 659, 784, 1046].forEach((f, i) => tone(f, .35, 'triangle', .16, i * .09)); thud(); closeEditor(); showOv('다시 하기', `${st.t.toFixed(1)}초 남기고 제출했어요`); }
}
const near = (p, x, y, r) => Math.hypot(p.x - x, p.y - y) < r;
function onPack(p) { const [x, y, w, h, r] = LY.pack, c = Math.cos(-r), s = Math.sin(-r), dx = p.x - x, dy = p.y - y; return Math.abs(dx * c - dy * s) < w / 2 + 6 && Math.abs(dx * s + dy * c) < h / 2 + 6; }
function rustle() { if (!actx) return; for (let i = 0; i < 3; i++) tone(2400 + Math.random() * 1500, .05, 'triangle', .03, i * .04); }
let last = null;
cv.addEventListener('pointerdown', e => {
  if (!st || st.mode !== 'play') return;
  audio(); try { cv.setPointerCapture(e.pointerId); } catch {}
  const p = world(e); st.ptr = p; st.press = now; last = { ...p, t: performance.now() };
  if (st.edit) closeEditor();
  const form = st.forms.find(f => !f.done && inside(f, p.x, p.y));
  if (st.hold === 'stamp') {
    if (near(p, LY.ink[0], LY.ink[1], LY.ink[2])) { st.ink = 1; st.dip = now; st.dipX = p.x; st.dipY = p.y; tone(140, .14, 'sine', .35); tone(600, .05, 'triangle', .05); return; }
    if (form) {
      if (st.ink) { form.done = 1; form.at = now; form.sr = rnd(-.35, .25); form.ox = rnd(-5, 5); form.oy = rnd(-5, 5); form.str = rnd(.7, 1); st.ink = 0; thud(); st.shake = .25; if (st.forms.every(f => f.done)) complete('stamp'); }
      else { form.faint = 1; form.fsr = rnd(-.4, .2); tone(260, .1, 'sine', .25); say('인주가 없어요 · 인주에 먼저 꾹', p.x, p.y - 40); }
      return;
    }
    if (near(p, LY.stampHome[0], LY.stampHome[1], 44)) { st.hold = null; tone(500, .05, 'triangle', .08); return; }
    return;
  }
  if (st.hold === 'tissue' && onPack(p)) { st.hold = null; st.tissue = null; rustle(); return; }
  if (!st.hold) {
    for (let i = st.notes.length - 1; i >= 0; i--) {
      const n = st.notes[i]; if (n.binned) continue;
      const c = Math.cos(-n.rot), s = Math.sin(-n.rot), dx = p.x - n.x - n.w / 2, dy = p.y - n.y - n.h / 2;
      if (Math.abs(dx * c - dy * s) < n.w / 2 && Math.abs(dx * s + dy * c) < n.h / 2) { st.notes.splice(i, 1); st.notes.push(n); st.drag = { note: n, dx: p.x - n.x, dy: p.y - n.y }; tone(700, .05, 'square', .05); return; }
    }
    const u = [...st.used].reverse().find(u => !u.binned && near(p, u.x, u.y, 30)); if (u) { st.drag = { used: u, dx: p.x - u.x, dy: p.y - u.y }; rustle(); return; }
    if (near(p, LY.stampHome[0], LY.stampHome[1], 40)) { st.hold = 'stamp'; tone(420, .06, 'triangle', .1); return; }
    if (onPack(p)) { st.hold = 'tissue'; st.tissue = { start: spillSum(), dirt: 0 }; rustle(); return; }
    if (inside(st.ipad, p.x, p.y)) {
      const l = toLocal(st.ipad, p.x, p.y), t = st.typos.find(t => !t.fixed && t.box && l.x > t.box[0] && l.x < t.box[0] + t.box[2] && l.y > t.box[1] && l.y < t.box[1] + t.box[3]);
      if (t) { e.preventDefault(); openEditor(t); return; }
      return;
    }
    if (form) { say('도장을 먼저 집어요', p.x, p.y - 40); return; }
    if (near(p, LY.spill[0], LY.spill[1], LY.spill[2] * 1.3) && !st.done.coffee) say('맨손으론 안 닦여요 · 물티슈를 뽑아요', p.x, p.y - 40);
  }
  st.drag = { brush: 1 };
});
cv.addEventListener('pointermove', e => {
  if (!st) return;
  const p = world(e); st.ptr = p;
  if (st.mode === 'play' && !st.drag) {
    const over = !st.hold && (st.notes.some(n => !n.binned && Math.hypot(p.x - n.x - n.w / 2, p.y - n.y - n.h / 2) < 60) || st.used.some(u => !u.binned && near(p, u.x, u.y, 30)) ? 'grab'
      : near(p, LY.stampHome[0], LY.stampHome[1], 46) || onPack(p) || (inside(st.ipad, p.x, p.y) && st.typos.some(t => { if (t.fixed || !t.box) return 0; const l = toLocal(st.ipad, p.x, p.y); return l.x > t.box[0] && l.x < t.box[0] + t.box[2] && l.y > t.box[1] && l.y < t.box[1] + t.box[3]; })) ? 'pointer' : '');
    cv.style.cursor = st.hold ? 'none' : over || 'default';
  }
  if (!st.drag || !last || st.mode !== 'play') return;
  const t = performance.now(), dt = Math.max(1, t - last.t) / 1000, vx = (p.x - last.x) / dt, vy = (p.y - last.y) / dt, sp = Math.hypot(vx, vy);
  if (st.drag.note) { const n = st.drag.note; n.x = p.x - st.drag.dx; n.y = p.y - st.drag.dy; cv.style.cursor = 'grabbing'; }
  else if (st.drag.used) { const u = st.drag.used; u.x = p.x - st.drag.dx; u.y = p.y - st.drag.dy; cv.style.cursor = 'grabbing'; }
  else {
    if (st.hold === 'tissue') {
      const m = SP.M.getContext('2d'), k = SP.k, o = SP.o;
      m.save(); m.globalCompositeOperation = 'destination-out'; m.globalAlpha = .2; m.lineCap = 'round'; m.lineWidth = 46 * k;
      m.beginPath(); m.moveTo((last.x - o[0]) * k, (last.y - o[1]) * k); m.lineTo((p.x - o[0]) * k, (p.y - o[1]) * k); m.stroke(); m.restore();
      SP.dirty = 1; st.wiped = 1;
    }
    st.crumbs.forEach(c => { if (c.off) return; const d = Math.hypot(c.x - p.x, c.y - p.y); if (d < 55 && sp > 150) { const f = (1 - d / 55) * .55; c.vx += vx * f; c.vy += vy * f; } });
    if (scrubG) scrubG.gain.setTargetAtTime(Math.min(.22, sp / 9000), actx.currentTime, .03);
  }
  last = { ...p, t };
});
addEventListener('pointerup', () => {
  if (!st) return;
  if (st.drag && st.drag.note) {
    const n = st.drag.note, [bx, by, br] = st.bin;
    if (Math.hypot(n.x + n.w / 2 - bx, n.y + n.h / 2 - by) < br + 30) { n.binned = 1; n.k = 0; tone(220, .15, 'sawtooth', .06); tone(160, .2, 'triangle', .1, .05); if (st.notes.every(n => n.binned)) complete('note'); }
  }
  if (st.drag && st.drag.used) { const u = st.drag.used, [bx, by, br] = st.bin; if (Math.hypot(u.x - bx, u.y - by) < br + 30) { u.binned = 1; tone(220, .15, 'sawtooth', .06); } }
  st.drag = null; last = null; if (scrubG) scrubG.gain.setTargetAtTime(0, actx.currentTime, .05);
});

const papers = () => [st.ipad, st.sketch, ...st.forms];
let now = performance.now(), prev = now, nextTick = 0, spT = 0;
function step(dt) {
  if (st.mode === 'play') {
    st.t -= dt;
    if (st.t <= 0) { st.t = 0; st.mode = 'lose'; st.result = now; st.hold = null; closeEditor(); tone(196, .6, 'sawtooth', .12); tone(147, .8, 'sawtooth', .12, .25); showOv('다시 하기', `남은 일 ${TASKS.filter(t => !st.done[t.k]).length}개 · 다음엔 꼭`); }
    const sec = Math.ceil(st.t);
    if (sec !== nextTick) { nextTick = sec; if (sec <= 10) tone(1760, .05, 'square', .07); else tone(900, .03, 'square', .035); }
  }
  st.crumbs.forEach(c => {
    c.x += c.vx * dt; c.y += c.vy * dt; const fr = Math.exp(-5 * dt); c.vx *= fr; c.vy *= fr;
    if (Math.abs(c.vx) + Math.abs(c.vy) > 20) c.a += dt * 6;
    if (!c.gone && Math.abs(c.vx) + Math.abs(c.vy) < 40 && !papers().some(p => inside(p, c.x, c.y))) c.gone = 1;
    if (c.gone) c.off = Math.min(1, c.off + dt * .6);
  });
  if (st.mode === 'play' && st.crumbs.every(c => c.gone)) complete('crumb');
  st.notes.forEach(n => { if (n.binned) n.k += dt * 3.2; });
  spT -= dt;
  if (st.mode === 'play' && spT <= 0 && st.wiped) {
    spT = .2; st.wiped = 0; const cur = spillSum(); SP.left = cur / SP.sum0;
    if (st.tissue) {
      st.tissue.dirt = (st.tissue.start - cur) / (SP.sum0 * .5);
      if (st.tissue.dirt >= 1 && SP.left > .04) { st.used.push({ x: st.ptr.x + 30, y: st.ptr.y + 20, rot: rnd(0, 6), seed: Math.random() * 1000 | 0 }); st.hold = null; st.tissue = null; rustle(); say('물티슈가 다 젖었어요 · 새로 뽑아요', st.ptr.x, st.ptr.y - 50); }
    }
    if (SP.left < .04) { SP.M.getContext('2d').clearRect(0, 0, SP.M.width, SP.M.height); SP.left = 0; SP.dirty = 1; st.clean = 1; if (st.tissue) { st.used.push({ x: st.ptr.x + 30, y: st.ptr.y + 20, rot: rnd(0, 6), seed: Math.random() * 1000 | 0 }); st.hold = null; st.tissue = null; } say('다 쓴 물티슈는 휴지통에!', st.ptr.x, st.ptr.y - 50); }
  }
  if (st.mode === 'play' && st.clean && st.used.every(u => u.binned)) complete('coffee');
  st.shake = Math.max(0, st.shake - dt);
}

const L1 = document.createElement('canvas'), L2 = document.createElement('canvas'), TMP = document.createElement('canvas');
function applyLight(L, T, jx, jy, screen) {
  if (!lmReady) return;
  const tc = TMP.getContext('2d'), lc = L.getContext('2d');
  tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'copy'; tc.setTransform(...T); tc.translate(jx, jy); tc.drawImage(LM, 0, 0, DW, DH);
  tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'destination-in'; tc.drawImage(L, 0, 0);
  if (screen) { tc.globalCompositeOperation = 'source-atop'; tc.setTransform(...T); tc.translate(jx, jy); withPaperOn(tc, st.ipad, () => { tc.beginPath(); tc.roundRect(SCR.x, SCR.y, SCR.w, SCR.h, 8); }); tc.fillStyle = '#f2f2f2'; tc.fill(); }
  tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'source-over';
  lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalCompositeOperation = 'multiply'; lc.drawImage(TMP, 0, 0); lc.globalCompositeOperation = 'source-over';
}
function begin(L, T, jx, jy) { const c = L.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, L.width, L.height); cx = c; cx.setTransform(...T); cx.translate(jx, jy); }
function render(dt) {
  const T = [DPR * S, 0, 0, DPR * S, DPR * OX, DPR * OY];
  let jx = 0, jy = 0;
  if (st.shake || (st.mode === 'play' && st.t < 5)) { const a = st.shake * 14 + (st.mode === 'play' && st.t < 5 ? 1.8 : 0); jx = rnd(-a, a); jy = rnd(-a, a); }
  begin(L1, T, jx, jy);
  drawSketch(); ipadBody(); drawForms(); drawSpill(); drawUsed(); drawInk(); if (st.hold !== 'stamp') stampLying(LY.stampHome[0], LY.stampHome[1], 2.4);
  drawPack(); drawBinned(); drawCrumbs(); clockBody();
  applyLight(L1, T, jx, jy, true);
  cx = L1.getContext('2d'); cx.setTransform(...T); cx.translate(jx, jy); ipadScreen();
  begin(L2, T, jx, jy);
  st.notes.forEach(drawNote);
  const pressing = now - st.press < 140 && st.drag !== undefined;
  if (st.hold === 'stamp') stampHeld(st.ptr.x, st.ptr.y, pressing);
  if (st.hold === 'tissue') tissueShape(st.ptr.x, st.ptr.y, -.25, 1, st.tissue ? st.tissue.dirt : 0, st.drag ? 4 : 16);
  applyLight(L2, T, jx, jy, false);
  cx = main; cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = '#000'; cx.fillRect(0, 0, cv.width, cv.height);
  cx.setTransform(...T); cx.translate(jx, jy); if (bg.complete && bg.naturalWidth) cx.drawImage(bg, 0, 0, DW, DH);
  cx.setTransform(1, 0, 0, 1, 0, 0); cx.drawImage(L1, 0, 0); cx.drawImage(L2, 0, 0);
  cx.setTransform(...T); cx.translate(jx, jy);
  { const t = now / 1000, f = .5 * Math.sin(t * .7) + .3 * Math.sin(t * 1.9 + 1) + .2 * Math.sin(t * 5.3 + rnd0(Math.floor(t * 3)) * 2) * (rnd0(Math.floor(t * .5)) < .2 ? 1 : .25);
    const [px, py] = LY.pool, g = cx.createRadialGradient(px, py, 20, px, py, 760);
    if (f > 0) { cx.globalCompositeOperation = 'lighter'; g.addColorStop(0, `rgba(255,190,120,${.045 * f})`); g.addColorStop(1, 'rgba(255,190,120,0)'); }
    else { g.addColorStop(0, `rgba(0,0,0,${-.07 * f})`); g.addColorStop(1, `rgba(0,0,0,${-.03 * f})`); }
    cx.fillStyle = g; cx.fillRect(-OX / S, -OY / S, W / S, H / S); cx.globalCompositeOperation = 'source-over'; }
  spillGloss(); focusRings(); drawFx(dt); drawClock();
  if (st.mode === 'play' && st.t < 10) {
    const a = (.18 + .14 * Math.sin(now / 120)) * (1 - st.t / 10), g = cx.createRadialGradient(DW / 2, DH / 2, Math.min(DW, DH) * .35, DW / 2, DH / 2, Math.max(DW, DH) * .75);
    g.addColorStop(0, 'rgba(255,0,0,0)'); g.addColorStop(1, `rgba(220,20,10,${a})`); cx.fillStyle = g; cx.fillRect(-OX / S, -OY / S, W / S, H / S);
  }
  drawResult();
  if (st.edit) placeEditor();
  updateHud();
}
function loop(t) { now = t; const dt = Math.min(.05, (t - prev) / 1000); prev = t; step(dt); render(dt); requestAnimationFrame(loop); }
function resize() {
  DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  for (const c of [cv, L1, L2, TMP]) { c.width = W * DPR; c.height = H * DPR; }
  S = Math.max(W / DW, Math.min(H / DH, W / (DW * .88))); OX = (W - DW * S) / 2; OY = (H - DH * S) / 2;
}
addEventListener('resize', () => { if (st) resize(); });
function showOv(btn, sub) { $('#go').textContent = btn; $('.sub').textContent = sub; $('#ov').classList.add('res'); $('#ov').classList.remove('hide'); }
$('#go').onclick = () => { audio(); if (st.mode !== 'ready') newRound(); st.mode = 'play'; st.t = TIME; nextTick = TIME + 1; $('#ov').classList.add('hide'); };
Promise.all([document.fonts.load(`40px 'Nanum Pen Script'`), document.fonts.load("900 30px 'Noto Serif KR'"), document.fonts.load("500 21px 'Noto Serif KR'"), document.fonts.load("700 34px 'IBM Plex Mono'"), document.fonts.load("700 13px 'Noto Sans KR'")]).then(() => { newRound(); requestAnimationFrame(loop); });
