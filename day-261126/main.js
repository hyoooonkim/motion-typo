const $ = s => document.querySelector(s);
const COINS = [
  { k: 'bus', m: 'bronze', job: '첫차 버스 기사', v: 50, leg: 'FIRST BVS DRIVER · V:X AM', back: ['새벽 5시 10분', '아무도 없는 정류장에도', '섰다'] },
  { k: 'clerk', m: 'silver', job: '편의점 야간 알바', v: 100, leg: 'NIGHT CLERK · CCCXII CHANGES', back: ['오늘 거스름돈을', '312번 건넸다'] },
  { k: 'granny', m: 'gold', job: '시장 나물 할머니', v: 500, leg: 'MARKET GRANDMOTHER · LX YEARS', back: ['60년 동안', '덤을 얹어 주었다'] },
  { k: 'guard', m: 'silver', job: '아파트 경비원', v: 100, leg: 'APARTMENT GVARD · MMCXL PARCELS', back: ['택배 2,140개를', '대신 받아 주었다'] },
  { k: 'bungeo', m: 'bronze', job: '붕어빵 사장님', v: 10, leg: 'BVNGEOPPANG MASTER · III FOR M', back: ['천 원에 세 마리', '가끔은 네 마리'] },
  { k: 'rider', m: 'silver', job: '배달 라이더', v: 100, leg: 'DELIVERY RIDER · RAIN OR SHINE', back: ['비 오는 날', '더 많이 달렸다'] },
  { k: 'nurse', m: 'gold', job: '야간 간호사', v: 500, leg: 'NIGHT NVRSE · WARD VII', back: ['모두가 자는 동안', '깨어 있었다'] },
  { k: 'sweeper', m: 'bronze', job: '환경미화원', v: 10, leg: 'STREET SWEEPER · IV AM', back: ['아침이 오기 전에', '길을 치웠다'] },
  { k: 'crossing', m: 'silver', job: '등굣길 지킴이', v: 100, leg: 'CROSSING GVARD · MDCCC CHILDREN', back: ['아이들 1,800명을', '건너게 했다'] },
  { k: 'laundry', m: 'bronze', job: '동네 세탁소 사장님', v: 50, leg: 'LAVNDRY MASTER · XL YEARS', back: ['단추 하나도', '그냥 넘기지 않았다'] },
  { k: 'barista', m: 'gold', job: '카페 바리스타', v: 500, leg: 'BARISTA · CCXL NAMES', back: ['손님 240명의', '이름을 외웠다'] },
  { k: 'mom', m: 'gold', job: '엄마', v: 500, leg: 'MOTHER · KEEP THE CHANGE', back: ['거스름돈은', '늘 너 가져'] },
];
const METAL = {
  gold: { base: '#d4ad62', hi: 'rgba(255,244,210,.85)', lo: 'rgba(80,45,5,.8)' },
  silver: { base: '#b3ada6', hi: 'rgba(255,255,255,.8)', lo: 'rgba(20,18,16,.8)' },
  bronze: { base: '#6e6d55', hi: 'rgba(210,220,180,.55)', lo: 'rgba(5,5,2,.85)' },
};
const ROMAN = { 10: 'X', 50: 'L', 100: 'C', 500: 'D' };
const SZ = 640, R = SZ * .494;
const load = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = src; });

function emboss(c, draw, metal, d = 1.7) {
  const M = METAL[metal];
  c.save(); c.translate(-d, -d); c.fillStyle = M.hi; draw(); c.restore();
  c.save(); c.translate(d * 1.15, d * 1.15); c.fillStyle = M.lo; draw(); c.restore();
  c.save(); c.translate(d * 1.9, d * 1.9); c.globalAlpha = .45; c.fillStyle = M.lo; draw(); c.restore();
  c.fillStyle = M.base; draw();
}
function arcLegend(c, txt, r, size, metal) {
  c.font = `700 ${size}px 'Cinzel', serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const chars = [...txt], track = size * .08, ws = chars.map(ch => c.measureText(ch).width + track);
  let tot = ws.reduce((a, b) => a + b, 0) / r;
  const maxSpan = Math.PI * 1.62, k = tot > maxSpan ? maxSpan / tot : 1;
  tot *= k;
  let a = -Math.PI / 2 - tot / 2;
  chars.forEach((ch, i) => {
    const d = ws[i] * k / r; a += d / 2;
    const x = SZ / 2 + Math.cos(a) * r, y = SZ / 2 + Math.sin(a) * r, rot = a + Math.PI / 2;
    emboss(c, () => { c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, 1); c.fillText(ch, 0, 0); c.restore(); }, metal);
    a += d / 2;
  });
}
function front(im, o) {
  const cv = document.createElement('canvas'); cv.width = cv.height = SZ; cv.className = 'front';
  const c = cv.getContext('2d'); c.drawImage(im, 0, 0, SZ, SZ);
  arcLegend(c, o.leg, R * .83, 27, o.m);
  return cv;
}
function back(im, o) {
  const cv = document.createElement('canvas'); cv.width = cv.height = SZ; cv.className = 'back';
  const c = cv.getContext('2d'); c.drawImage(im, 0, 0, SZ, SZ);
  arcLegend(c, `${ROMAN[o.v]} · ${o.v} WON · MMXXVI`, R * .855, 26, o.m);
  const n = o.back.length, fs = n > 2 ? 50 : 58, lh = fs * 1.32, y0 = SZ / 2 - 18 - lh * (n - 1) / 2;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  o.back.forEach((l, i) => {
    let s = fs; c.font = `900 ${s}px 'Noto Serif KR', serif`;
    const w = c.measureText(l).width, max = R * 1.32; if (w > max) { s *= max / w; c.font = `900 ${s}px 'Noto Serif KR', serif`; }
    emboss(c, () => c.fillText(l, SZ / 2, y0 + i * lh), o.m, 3);
  });
  return cv;
}

let actx = null;
function clink(metal) {
  if (!actx) try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  const t = actx.currentTime, base = metal === 'gold' ? 1900 : metal === 'silver' ? 2600 : 1300;
  [1, 2.76, 5.4].forEach((m, i) => {
    const o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.value = base * m * (1 + Math.random() * .01);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12 / (i + 1), t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + .6 - i * .15);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + .65);
  });
}

async function init() {
  await Promise.all([document.fonts.load("700 30px 'Cinzel'"), document.fonts.load("900 50px 'Noto Serif KR'")]);
  const backs = {};
  for (const m of ['gold', 'silver', 'bronze']) backs[m] = await load(`coins/back-${m}.webp`);
  const wall = $('#wall');
  const ims = await Promise.all(COINS.map(o => load(`coins/${o.k}.webp`)));
  COINS.forEach((o, i) => {
    const slot = document.createElement('div'); slot.className = 'slot';
    const coin = document.createElement('div'); coin.className = 'coin';
    const inner = document.createElement('div'); inner.className = 'inner';
    inner.append(front(ims[i], o), back(backs[o.m], o));
    coin.append(inner);
    const lab = document.createElement('div'); lab.className = 'label'; lab.innerHTML = `No.${String(i + 1).padStart(2, '0')} · <b>${o.job}</b>`;
    slot.append(coin, lab); wall.append(slot);
    coin.addEventListener('click', () => { coin.classList.toggle('flip'); clink(o.m); });
    coin.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = coin.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      inner.style.setProperty('--rx', `${-y * 18}deg`); inner.style.setProperty('--ry', `${x * 18}deg`);
    });
    coin.addEventListener('pointerleave', () => { inner.style.setProperty('--rx', '0deg'); inner.style.setProperty('--ry', '0deg'); });
  });
}
init();
