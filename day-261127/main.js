const $ = s => document.querySelector(s);
const cv = document.createElement('canvas'); document.body.prepend(cv);
let cx = cv.getContext('2d');
const TIME = 50;
let W = 0, H = 0, DPR = 1, DW = 1600, DH = 893, S = 1, OX = 0, OY = 0;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

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
  { k: 'coffee', t: '엎지른 커피 닦기' },
  { k: 'typo', t: '문서 오타 고치기' },
  { k: 'crumb', t: '지우개 가루 털기' },
  { k: 'stamp', t: '결재 서류 도장 찍기' },
  { k: 'note', t: '포스트잇 다 버리기' },
];

const LY = { DW: 1600, DH: 893, lamp: [450, 170], memo: [118, 232, 300, 350, -.07, .74], doc: [445, 118, 470, 640, -.03, .79], sketch: [838, 432, 430, 320, .05, .76],
  forms: [[420, 652, 200, 270, -.08, .8], [612, 640, 200, 270, .05, .8], [800, 672, 200, 270, -.04, .78]], coffee: [1150, 600, 88], bin: [1445, 705, 150],
  notes: [330, 110, 1240, 860], clock: [800, 46] };

const paper = (a, extra = {}) => ({ x: a[0], y: a[1], w: a[2], h: a[3], rot: a[4], s: a[5] || 1, ...extra });
function toLocal(p, px, py) {
  const k = p.s || 1, cxp = p.x + p.w * k / 2, cyp = p.y + p.h * k / 2, c = Math.cos(-p.rot), s = Math.sin(-p.rot), dx = px - cxp, dy = py - cyp;
  return { x: (dx * c - dy * s) / k + p.w / 2, y: (dx * s + dy * c) / k + p.h / 2 };
}
const inside = (p, px, py) => { const l = toLocal(p, px, py); return l.x >= 0 && l.y >= 0 && l.x <= p.w && l.y <= p.h; };
function withPaper(p, f) { const k = p.s || 1; cx.save(); cx.translate(p.x + p.w * k / 2, p.y + p.h * k / 2); cx.rotate(p.rot); cx.scale(k, k); cx.translate(-p.w / 2, -p.h / 2); f(); cx.restore(); }
function shadowFor(x, y, h) {
  const dx = x - LY.lamp[0], dy = y - LY.lamp[1], d = Math.hypot(dx, dy) || 1, len = h * (.6 + d / 420), k = S * DPR;
  cx.shadowColor = `rgba(8,4,0,${Math.min(.75, .5 + h * .012)})`; cx.shadowBlur = (3 + h * 1.1) * k; cx.shadowOffsetX = dx / d * len * k; cx.shadowOffsetY = dy / d * len * k;
}
let paperPat = null;
function sheet(p, col = '#fbf8f1', lift = 1) {
  if (!paperPat) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) { const v = 228 + Math.random() * 27; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); paperPat = cx.createPattern(c, 'repeat');
  }
  const k = p.s || 1;
  withPaper(p, () => {
    cx.save(); shadowFor(p.x + p.w * k / 2, p.y + p.h * k / 2, 4 * lift);
    cx.fillStyle = col; cx.fillRect(0, 0, p.w, p.h); cx.restore();
    cx.save(); cx.globalCompositeOperation = 'multiply'; cx.globalAlpha = .35; cx.fillStyle = paperPat; cx.fillRect(0, 0, p.w, p.h);
    const g = cx.createLinearGradient(0, 0, p.w, p.h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.7, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,100,80,.55)');
    cx.globalAlpha = 1; cx.fillStyle = g; cx.fillRect(0, 0, p.w, p.h); cx.restore();
  });
}

let st, M, mctx, cxSave, mask0 = 1, maskLeft = 1;
function blob(c, x, y, r, n = 14, j = .32) {
  c.beginPath();
  const pts = Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [x + Math.cos(a) * r * (1 + rnd(-j, j)), y + Math.sin(a) * r * (1 + rnd(-j, j))]; });
  pts.forEach((p, i) => { const q = pts[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; i ? c.quadraticCurveTo(p[0], p[1], mx, my) : c.moveTo(mx, my); });
  const p = pts[0], q = pts[1]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); c.closePath();
}
function countMask() {
  const d = mctx.getImageData(0, 0, M.width, M.height).data; let n = 0;
  for (let i = 3; i < d.length; i += 64) n += d[i];
  return n;
}
function newRound() {
  const memo = paper(LY.memo), doc = paper(LY.doc), sketch = paper(LY.sketch);
  const forms = LY.forms.map(f => paper(f, { done: 0, t: 0 }));
  const [cxo, cyo, cr] = LY.coffee;
  M = document.createElement('canvas'); M.width = DW; M.height = DH; mctx = M.getContext('2d');
  mctx.fillStyle = 'rgba(52,26,9,.9)'; blob(mctx, cxo, cyo, cr, 16, .38); mctx.fill();
  for (let i = 0; i < 6; i++) { const a = rnd(0, 6.3), d = rnd(1.05, 1.5) * cr; blob(mctx, (cxo + Math.cos(a) * d), (cyo + Math.sin(a) * d), rnd(5, 16), 9, .3); mctx.fill(); }
  mctx.fillStyle = 'rgba(92,52,22,.55)'; blob(mctx, cxo + 4, cyo + 3, cr * .78, 16, .3); mctx.fill();
  mctx.fillStyle = 'rgba(255,225,180,.18)'; blob(mctx, (cxo - cr * .35), (cyo - cr * .3), cr * .28, 10, .3); mctx.fill();
  mask0 = countMask(); maskLeft = 1;
  const typos = []; const crumbs = [];
  for (let i = 0; i < 34; i++) {
    const k = sketch.s, l = { x: rnd(30, sketch.w - 30), y: rnd(30, sketch.h - 30) }, c = Math.cos(sketch.rot), s = Math.sin(sketch.rot), dx = (l.x - sketch.w / 2) * k, dy = (l.y - sketch.h / 2) * k;
    crumbs.push({ x: sketch.x + sketch.w * k / 2 + dx * c - dy * s, y: sketch.y + sketch.h * k / 2 + dx * s + dy * c, vx: 0, vy: 0, a: rnd(0, 6.3), len: rnd(5, 11), off: 0 });
  }
  const [nx0, ny0, nx1, ny1] = LY.notes, bin = LY.bin, notes = [];
  NOTES.forEach(([t, c]) => {
    let x, y, k = 0;
    do { x = rnd(nx0, nx1 - 106); y = rnd(ny0, ny1 - 106); k++; } while (k < 80 && (Math.hypot(x + 53 - bin[0], y + 53 - bin[1]) < bin[2] + 110 || Math.hypot(x + 53 - 1050, y + 53 - 750) < 120 || notes.some(n => Math.hypot(n.x - x, n.y - y) < 130)));
    notes.push({ x, y, w: 106, h: 106, rot: rnd(-.25, .25), t, c, binned: 0, k: 0 });
  });
  st = { mode: 'ready', t: TIME, memo, doc, sketch, forms, typos, crumbs, notes, bin, done: {}, doneAt: {}, fx: [], drag: null, shake: 0, result: 0 };
  resize();
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
function desk() { if (bg.complete && bg.naturalWidth) cx.drawImage(bg, 0, 0, DW, DH); else { cx.fillStyle = '#2a1a0e'; cx.fillRect(0, 0, DW, DH); } }
const PEN = "'Nanum Pen Script', cursive";
function drawMemo() {
  const p = st.memo; sheet(p, '#fffbea');
  withPaper(p, () => {
    cx.fillStyle = 'rgba(200,60,60,.75)'; cx.beginPath(); cx.arc(p.w / 2, 16, 9, 0, 7); cx.fill();
    cx.fillStyle = '#2b2b33'; cx.font = `44px ${PEN}`; cx.textBaseline = 'alphabetic'; cx.textAlign = 'left'; cx.fillText('오늘 마감 전에!', 26, 70);
    cx.strokeStyle = 'rgba(80,120,200,.25)'; cx.lineWidth = 1; for (let y = 96; y < p.h - 10; y += 50) { cx.beginPath(); cx.moveTo(18, y + 26); cx.lineTo(p.w - 18, y + 26); cx.stroke(); }
    TASKS.forEach((tk, i) => {
      const y = 112 + i * 50, done = st.done[tk.k], k = done ? Math.min(1, (now - st.doneAt[tk.k]) / 350) : 0;
      cx.strokeStyle = '#2b2b33'; cx.lineWidth = 2; cx.strokeRect(24, y - 4, 20, 20);
      cx.fillStyle = done ? 'rgba(43,43,51,.45)' : '#2b2b33'; cx.font = `30px ${PEN}`; cx.fillText(tk.t + prog(tk.k), 56, y + 16);
      if (done) {
        cx.strokeStyle = '#d4362c'; cx.lineWidth = 3.5; cx.lineCap = 'round';
        cx.beginPath(); cx.moveTo(26, y + 6); cx.lineTo(33, y + 14); cx.lineTo(33 + 16 * k, y - 8 - 2 * k); cx.stroke();
        const tw = cx.measureText(tk.t + prog(tk.k)).width; cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(52, y + 6); cx.lineTo(52 + (tw + 8) * k, y + 3); cx.stroke();
      }
    });
  });
}
function prog(k) {
  if (k === 'typo') return ` ${st.typos.filter(t => t.fixed).length}/5`;
  if (k === 'stamp') return ` ${st.forms.filter(f => f.done).length}/3`;
  if (k === 'note') return ` ${st.notes.filter(n => n.binned).length}/5`;
  if (k === 'coffee') return ` ${Math.round((1 - maskLeft) * 100)}%`;
  if (k === 'crumb') { const n = st.crumbs.filter(c => !c.off).length; return n ? ` ${n}개` : ''; }
  return '';
}
function drawDoc() {
  const p = st.doc; sheet(p);
  withPaper(p, () => {
    cx.fillStyle = '#1d1d22'; cx.font = `900 30px 'Noto Serif KR', serif`; cx.textAlign = 'left'; cx.textBaseline = 'alphabetic';
    cx.fillText('하반기 결산 보고서', 40, 74);
    cx.fillStyle = '#8a8578'; cx.font = `500 15px 'Noto Sans KR', sans-serif`; cx.fillText('작성 2026.11.27 · 제출 기한 오늘 24:00', 40, 104);
    cx.fillStyle = '#1d1d22'; cx.fillRect(40, 120, p.w - 80, 2);
    let ti = 0; const first = !st.typos.length;
    LINES.forEach((ln, li) => {
      let x = 40; const y = 172 + li * 46; cx.font = `500 22px 'Noto Serif KR', serif`;
      ln.forEach(tok => {
        if (typeof tok === 'string') { cx.fillStyle = '#26262c'; cx.fillText(tok, x, y); x += cx.measureText(tok).width; return; }
        if (first) st.typos.push({ wrong: tok[0], right: tok[1], fixed: 0, at: 0 });
        const t = st.typos[ti++], txt = t.fixed ? t.right : t.wrong, w = cx.measureText(txt).width;
        t.box = [x - 4, y - 26, w + 8, 36];
        if (!t.fixed) {
          cx.fillStyle = '#26262c'; cx.fillText(txt, x, y);
          cx.strokeStyle = '#e0362c'; cx.lineWidth = 2; cx.beginPath(); for (let X = 0; X <= w; X += 3) cx.lineTo(x + X, y + 6 + Math.sin(X * .7) * 2); cx.stroke();
        } else {
          const k = Math.min(1, (now - t.at) / 300); cx.globalAlpha = k; cx.fillStyle = '#1f4fa8'; cx.fillText(txt, x, y); cx.globalAlpha = 1;
        }
        x += w;
      });
    });
    cx.fillStyle = '#b5afa1'; cx.font = `500 14px 'Noto Sans KR', sans-serif`; cx.fillText('— 1 —', p.w / 2 - 20, p.h - 30);
  });
}
function drawSketch() {
  const p = st.sketch; sheet(p, '#f7f3ea');
  withPaper(p, () => {
    cx.strokeStyle = 'rgba(70,70,80,.55)'; cx.lineWidth = 1.6; cx.lineCap = 'round';
    cx.beginPath(); cx.rect(60, 60, 150, 110); cx.moveTo(250, 70); cx.lineTo(370, 70); cx.moveTo(250, 100); cx.lineTo(350, 100); cx.moveTo(250, 130); cx.lineTo(330, 130); cx.stroke();
    cx.beginPath(); cx.moveTo(60, 230); cx.bezierCurveTo(140, 190, 220, 280, 370, 220); cx.stroke();
    cx.fillStyle = 'rgba(70,70,80,.5)'; cx.font = `30px ${PEN}`; cx.fillText('시안 B — 이거로?', 70, 290);
    cx.fillStyle = 'rgba(70,70,80,.12)'; for (let i = 0; i < 5; i++) { cx.save(); cx.translate(rnd0(i) * p.w, 30 + rnd0(i + 9) * (p.h - 60)); cx.rotate(rnd0(i + 3) * 3); cx.fillRect(-26, -8, 52, 16); cx.restore(); }
  });
}
const rnd0 = i => { const v = Math.sin(i * 91.7 + 13.1) * 43758.5; return v - Math.floor(v); };
function drawForms() {
  st.forms.forEach((f, i) => {
    sheet(f, '#fdfcf8', .8);
    withPaper(f, () => {
      cx.fillStyle = '#1d1d22'; cx.font = `900 24px 'Noto Serif KR', serif`; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic'; cx.fillText('결 재', f.w / 2, 46);
      cx.font = `500 13px 'Noto Sans KR', sans-serif`; cx.fillStyle = '#5b574f'; cx.fillText(['예산 집행 요청', '외주 계약 연장', '연차 사용 신청'][i], f.w / 2, 70);
      const cw = (f.w - 40) / 3; cx.strokeStyle = '#3d3a35'; cx.lineWidth = 1.2;
      ['담당', '팀장', '대표'].forEach((t, j) => { cx.strokeRect(20 + j * cw, 90, cw, 24); cx.strokeRect(20 + j * cw, 114, cw, 56); cx.fillStyle = '#3d3a35'; cx.fillText(t, 20 + j * cw + cw / 2, 107); });
      cx.fillStyle = 'rgba(60,60,70,.35)'; for (let k = 0; k < 6; k++) cx.fillRect(22, 192 + k * 12, (f.w - 44) * (.5 + rnd0(i * 7 + k) * .5), 4);
      if (f.done) {
        const k = Math.min(1, (now - f.at) / 180), sc = 1 + (1 - k) * .8;
        cx.save(); cx.translate(20 + cw * 2 + cw / 2, 142); cx.rotate(f.sr); cx.scale(sc, sc); cx.globalAlpha = .85 * k;
        cx.strokeStyle = '#d2251f'; cx.fillStyle = '#d2251f'; cx.lineWidth = 3; cx.beginPath(); cx.arc(0, 0, 24, 0, 7); cx.stroke();
        cx.font = `900 17px 'Noto Serif KR', serif`; cx.textBaseline = 'middle'; cx.fillText('승인', 0, 1); cx.restore();
      }
    });
  });
}

function drawCoffee() { cx.drawImage(M, 0, 0, DW, DH); }
function drawBinned() {
  const [x, y] = st.bin;
  st.notes.filter(n => n.binned && n.k >= 1).forEach((n, i) => { cx.save(); cx.translate(x - 20 + Math.cos(i * 2.3) * 40, y - 10 + Math.sin(i * 2.3) * 34); cx.rotate(i * 1.7); shadowFor(x, y, 3); cx.fillStyle = n.c; blob(cx, 0, 0, 24, 9, .4); cx.fill(); cx.shadowColor = 'transparent'; cx.strokeStyle = 'rgba(0,0,0,.25)'; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(-14, -4); cx.lineTo(6, 8); cx.moveTo(-4, -14); cx.lineTo(10, -2); cx.stroke(); cx.restore(); });
}
function drawNote(n) {
  const k = n.binned ? Math.min(1, n.k) : 0;
  if (k >= 1) return;
  const [bx, by] = st.bin, cxn = n.x + n.w / 2, cyn = n.y + n.h / 2;
  const px = cxn + (bx - cxn) * k, py = cyn + (by - cyn) * k, s = 1 - .8 * k;
  const lifted = st.drag && st.drag.note === n;
  cx.save(); cx.translate(px, py); cx.rotate(n.rot + k * 3); cx.scale(s * (lifted ? 1.06 : 1), s * (lifted ? 1.06 : 1));
  shadowFor(px, py, lifted ? 26 : 3);
  cx.fillStyle = n.c; cx.fillRect(-n.w / 2, -n.h / 2, n.w, n.h); cx.shadowColor = 'transparent';
  cx.fillStyle = 'rgba(0,0,0,.06)'; cx.fillRect(-n.w / 2, -n.h / 2, n.w, 22);
  cx.fillStyle = '#2b2b33'; cx.font = `31px ${PEN}`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(n.t, 0, 7);
  const g = cx.createLinearGradient(0, n.h / 2 - 26, 0, n.h / 2); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.12)'); cx.fillStyle = g; cx.fillRect(-n.w / 2, n.h / 2 - 26, n.w, 26);
  cx.restore();
}
function drawCrumbs() {
  cx.lineCap = 'round';
  st.crumbs.forEach(c => {
    if (c.off >= 1) return;
    cx.globalAlpha = 1 - c.off; cx.strokeStyle = '#9b9690'; cx.lineWidth = 4.5;
    cx.beginPath(); cx.moveTo(c.x - Math.cos(c.a) * c.len / 2, c.y - Math.sin(c.a) * c.len / 2); cx.lineTo(c.x + Math.cos(c.a) * c.len / 2, c.y + Math.sin(c.a) * c.len / 2); cx.stroke();
    cx.strokeStyle = '#c7c2bb'; cx.lineWidth = 1.5; cx.stroke();
  });
  cx.globalAlpha = 1;
}
function clockBody() {
  const [x, y] = LY.clock;
  cx.save(); cx.translate(x, y); shadowFor(x, y, 9);
  cx.fillStyle = '#1b1b1d'; cx.beginPath(); cx.roundRect(-128, -32, 256, 64, 14); cx.fill(); cx.shadowColor = 'transparent';
  const g = cx.createLinearGradient(0, -32, 0, 32); g.addColorStop(0, 'rgba(255,255,255,.16)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); cx.fillStyle = g; cx.beginPath(); cx.roundRect(-128, -32, 256, 64, 14); cx.fill();
  cx.fillStyle = '#060606'; cx.beginPath(); cx.roundRect(-112, -22, 224, 44, 6); cx.fill();
  cx.restore();
}
function drawClock() {
  const [x, y] = LY.clock, t = Math.max(0, st.t), sec = Math.ceil(t), hot = st.mode === 'play' && t < 10;
  const label = st.mode === 'lose' || t <= 0 ? '00:00:00' : `23:59:${String(60 - sec).padStart(2, '0')}`;
  const blink = hot && (t % 1) < .35;
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
    if (f.kind === 'txt') { cx.fillStyle = f.c; cx.font = `700 22px 'Noto Sans KR', sans-serif`; cx.textAlign = 'center'; cx.fillText(f.s, f.x, f.y - k * 40); }
    cx.globalAlpha = 1;
  });
}
function drawResult() {
  if (st.mode !== 'win' && st.mode !== 'lose') return;
  const k = Math.min(1, (now - st.result) / 260), sc = 1 + (1 - k) * 1.6, win = st.mode === 'win';
  cx.fillStyle = `rgba(20,12,8,${.45 * k})`; cx.fillRect(-OX / S, -OY / S, W / S, H / S);
  cx.save(); cx.translate(DW / 2, DH * .45); cx.rotate(-.12); cx.scale(sc, sc); cx.globalAlpha = k;
  const col = win ? '#e0302a' : '#f3efe6';
  cx.strokeStyle = col; cx.lineWidth = 10; cx.beginPath(); cx.roundRect(-300, -100, 600, 200, 24); cx.stroke();
  cx.lineWidth = 3; cx.beginPath(); cx.roundRect(-282, -82, 564, 164, 16); cx.stroke();
  cx.fillStyle = col; cx.font = `900 96px 'Noto Serif KR', serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.fillText(win ? '제출 완료' : '마감 실패', 0, -8);
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
function thud() { if (!actx) return; tone(90, .2, 'sine', .5); tone(180, .08, 'triangle', .2); }
const ding = () => { tone(1046, .25, 'triangle', .14); tone(1568, .35, 'triangle', .1, .07); };

function world(e) { return { x: (e.clientX - OX) / S, y: (e.clientY - OY) / S }; }
function complete(k) {
  if (st.done[k]) return;
  st.done[k] = 1; st.doneAt[k] = now; ding();
  if (TASKS.every(t => st.done[t.k])) { st.mode = 'win'; st.result = now; [523, 659, 784, 1046].forEach((f, i) => tone(f, .35, 'triangle', .16, i * .09)); thud(); showOv('다시 하기', `${st.t.toFixed(1)}초 남기고 제출했어요`); }
}
let last = null;
cv.addEventListener('pointerdown', e => {
  if (st.mode !== 'play') return;
  audio(); try { cv.setPointerCapture(e.pointerId); } catch {}
  const p = world(e); last = { ...p, t: performance.now() };
  for (let i = st.notes.length - 1; i >= 0; i--) {
    const n = st.notes[i]; if (n.binned) continue;
    const c = Math.cos(-n.rot), s = Math.sin(-n.rot), dx = p.x - n.x - n.w / 2, dy = p.y - n.y - n.h / 2;
    if (Math.abs(dx * c - dy * s) < n.w / 2 && Math.abs(dx * s + dy * c) < n.h / 2) { st.notes.splice(i, 1); st.notes.push(n); st.drag = { note: n, dx: p.x - n.x, dy: p.y - n.y }; tone(700, .05, 'square', .05); return; }
  }
  for (const f of st.forms) if (!f.done && inside(f, p.x, p.y)) {
    f.done = 1; f.at = now; f.sr = rnd(-.4, .2); thud(); st.shake = .25;
    if (st.forms.every(f => f.done)) complete('stamp'); return;
  }
  if (inside(st.doc, p.x, p.y)) {
    const l = toLocal(st.doc, p.x, p.y);
    for (const t of st.typos) if (!t.fixed && l.x > t.box[0] && l.x < t.box[0] + t.box[2] && l.y > t.box[1] && l.y < t.box[1] + t.box[3]) {
      t.fixed = 1; t.at = now; tone(1320, .08, 'triangle', .12); st.fx.push({ kind: 'pop', x: p.x, y: p.y, c: '#1f4fa8', t: 0, d: .4 });
      if (st.typos.every(t => t.fixed)) complete('typo'); return;
    }
  }
  st.drag = { brush: 1 };
});
cv.addEventListener('pointermove', e => {
  if (!st) return;
  const p = world(e);
  if (st.mode === 'play' && !st.drag) {
    const overNote = st.notes.some(n => !n.binned && Math.hypot(p.x - n.x - n.w / 2, p.y - n.y - n.h / 2) < 70);
    const overTypo = inside(st.doc, p.x, p.y) && st.typos.some(t => { if (t.fixed || !t.box) return 0; const l = toLocal(st.doc, p.x, p.y); return l.x > t.box[0] && l.x < t.box[0] + t.box[2] && l.y > t.box[1] && l.y < t.box[1] + t.box[3]; });
    const overForm = st.forms.some(f => !f.done && inside(f, p.x, p.y));
    cv.style.cursor = overNote ? 'grab' : overTypo || overForm ? 'pointer' : 'crosshair';
  }
  if (!st.drag || !last || st.mode !== 'play') return;
  const t = performance.now(), dt = Math.max(1, t - last.t) / 1000, vx = (p.x - last.x) / dt, vy = (p.y - last.y) / dt;
  if (st.drag.note) { const n = st.drag.note; n.x = p.x - st.drag.dx; n.y = p.y - st.drag.dy; cv.style.cursor = 'grabbing'; }
  else {
    mctx.save(); mctx.globalCompositeOperation = 'destination-out'; mctx.globalAlpha = .14; mctx.lineCap = 'round'; mctx.lineWidth = 72;
    mctx.beginPath(); mctx.moveTo(last.x, last.y); mctx.lineTo(p.x, p.y); mctx.stroke(); mctx.restore();
    st.wiped = (st.wiped || 0) + Math.hypot(p.x - last.x, p.y - last.y);
    const sp = Math.hypot(vx, vy);
    st.crumbs.forEach(c => {
      if (c.off) return;
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < 60 && sp > 150) { const f = (1 - d / 60) * .55; c.vx += vx * f; c.vy += vy * f; }
    });
    if (scrubG) scrubG.gain.setTargetAtTime(Math.min(.22, sp / 9000), actx.currentTime, .03);
  }
  last = { ...p, t };
});
addEventListener('pointerup', () => {
  if (!st) return;
  if (st.drag && st.drag.note) {
    const n = st.drag.note, [bx, by, br] = st.bin;
    if (Math.hypot(n.x + n.w / 2 - bx, n.y + n.h / 2 - by) < br + 30) {
      n.binned = 1; n.k = 0; tone(220, .15, 'sawtooth', .06); tone(160, .2, 'triangle', .1, .05);
      if (st.notes.every(n => n.binned)) complete('note');
    }
  }
  st.drag = null; last = null; if (scrubG) scrubG.gain.setTargetAtTime(0, actx.currentTime, .05);
});

const papers = () => [st.doc, st.sketch, st.memo, ...st.forms];
let now = performance.now(), prev = now, nextTick = 0, maskT = 0;
function step(dt) {
  if (st.mode === 'play') {
    st.t -= dt;
    if (st.t <= 0) { st.t = 0; st.mode = 'lose'; st.result = now; tone(196, .6, 'sawtooth', .12); tone(147, .8, 'sawtooth', .12, .25); showOv('다시 하기', `남은 일 ${TASKS.filter(t => !st.done[t.k]).length}개 · 다음엔 꼭`); }
    const sec = Math.ceil(st.t);
    if (sec !== nextTick) { nextTick = sec; if (sec <= 10) { tone(1760, .05, 'square', .07); } else tone(900, .03, 'square', .035); }
    if (st.t < 10 && Math.ceil(st.t * 2) !== st.half) { st.half = Math.ceil(st.t * 2); if (st.t < 5) tone(1760, .04, 'square', .05); }
  }
  st.crumbs.forEach(c => {
    c.x += c.vx * dt; c.y += c.vy * dt; const fr = Math.exp(-5 * dt); c.vx *= fr; c.vy *= fr;
    if (Math.abs(c.vx) + Math.abs(c.vy) > 20) c.a += dt * 6;
    if (!c.gone && Math.abs(c.vx) + Math.abs(c.vy) < 40 && !papers().some(p => inside(p, c.x, c.y))) c.gone = 1;
    if (c.gone) c.off = Math.min(1, c.off + dt * 1.5);
  });
  if (st.mode === 'play' && st.crumbs.every(c => c.gone)) complete('crumb');
  st.notes.forEach(n => { if (n.binned) n.k += dt * 3.2; });
  maskT -= dt;
  if (st.mode === 'play' && maskT <= 0 && st.wiped) { maskT = .25; maskLeft = countMask() / mask0; if (maskLeft < .05) { mctx.clearRect(0, 0, M.width, M.height); maskLeft = 0; complete('coffee'); } }
  st.shake = Math.max(0, st.shake - dt);
}
const LAY = document.createElement('canvas'), TMP = document.createElement('canvas'), main = cx;
function render(dt) {
  const T = [DPR * S, 0, 0, DPR * S, DPR * OX, DPR * OY];
  let jx = 0, jy = 0;
  if (st.shake || (st.mode === 'play' && st.t < 5)) { const a = st.shake * 14 + (st.mode === 'play' && st.t < 5 ? 1.8 : 0); jx = rnd(-a, a); jy = rnd(-a, a); }
  const lc = LAY.getContext('2d'); lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, LAY.width, LAY.height);
  cx = lc; cx.setTransform(...T); cx.translate(jx, jy);
  drawSketch(); drawDoc(); drawForms(); drawCoffee(); drawMemo(); drawBinned(); drawCrumbs(); clockBody();
  st.notes.forEach(drawNote);
  if (lmReady) {
    const tc = TMP.getContext('2d'); tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'copy';
    tc.setTransform(...T); tc.translate(jx, jy); tc.drawImage(LM, 0, 0, DW, DH);
    tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'destination-in'; tc.drawImage(LAY, 0, 0); tc.globalCompositeOperation = 'source-over';
    lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalCompositeOperation = 'multiply'; lc.drawImage(TMP, 0, 0); lc.globalCompositeOperation = 'source-over';
  }
  cx = main; cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = '#000'; cx.fillRect(0, 0, cv.width, cv.height);
  cx.setTransform(...T); cx.translate(jx, jy); desk();
  cx.setTransform(1, 0, 0, 1, 0, 0); cx.drawImage(LAY, 0, 0);
  cx.setTransform(...T); cx.translate(jx, jy);
  drawFx(dt); drawClock();
  if (st.mode === 'play' && st.t < 10) {
    const a = (.18 + .14 * Math.sin(now / 120)) * (1 - st.t / 10);
    const g = cx.createRadialGradient(DW / 2, DH / 2, Math.min(DW, DH) * .35, DW / 2, DH / 2, Math.max(DW, DH) * .75);
    g.addColorStop(0, 'rgba(255,0,0,0)'); g.addColorStop(1, `rgba(220,20,10,${a})`); cx.fillStyle = g; cx.fillRect(-OX / S, -OY / S, W / S, H / S);
  }
  drawResult();
}
function loop(t) { now = t; const dt = Math.min(.05, (t - prev) / 1000); prev = t; step(dt); render(dt); requestAnimationFrame(loop); }

function resize() {
  DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  for (const c of [cv, LAY, TMP]) { c.width = W * DPR; c.height = H * DPR; }
  S = Math.max(W / DW, H / DH); OX = (W - DW * S) / 2; OY = (H - DH * S) / 2;
}
addEventListener('resize', resize);
function showOv(btn, sub) { $('#go').textContent = btn; $('.sub').textContent = sub; $('#ov').classList.remove('hide'); }
$('#go').onclick = () => {
  audio();
  if (st.mode !== 'ready') newRound();
  st.mode = 'play'; st.t = TIME; nextTick = TIME + 1; $('#ov').classList.add('hide');
};
document.fonts.load(`40px 'Nanum Pen Script'`).then(() => Promise.all([document.fonts.load("900 30px 'Noto Serif KR'"), document.fonts.load("500 22px 'Noto Serif KR'"), document.fonts.load("700 44px 'IBM Plex Mono'")])).then(() => { newRound(); requestAnimationFrame(loop); });

