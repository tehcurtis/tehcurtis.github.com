(() => {
'use strict';

// ---------------------------------------------------------------- world
const TW = 16, TH = 8, N = 22, ROADS = [3, 9, 15], WATER = 20;
const TOP = 172, BASE = 14;
const OX = N * TW, OY = TOP, WW = N * TW * 2, WH = TOP + N * TH * 2 + BASE + 4;
const iso = (gx, gy, z = 0) => [OX + (gx - gy) * TW, OY + (gx + gy) * TH - z];
const isRoad = (tx, ty) => ty < WATER && tx >= 0 && tx < N && ty >= 0 && (ROADS.includes(tx) || ROADS.includes(ty));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
function hash(a, b = 0, c = 0, d = 0) {
  let h = 0x9e3779b9 ^ Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1440662683) ^ Math.imul(d | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pick = (arr, r) => arr[Math.floor(r() * arr.length)];

const C = {};
for (const [k, v] of Object.entries({
  asphalt: '#3d4158', side: '#858aa2', curb: '#62667e', line: '#e8c35a', zebra: '#d9dbe6',
  lot: '#585c72', seam: '#4b4f64', grass: '#548f4a', grass2: '#467c40', path: '#ad9f84', plaza: '#8e8a9c',
  water: '#2f5f8a', water2: '#4a83b2', quay: '#8a8ea3', earth: '#5a4636', earth2: '#47372b',
  glass: '#a9c4d8', stone: '#c9b48c', stoneL: '#ddd0b2', wood: '#8a6248', woodL: '#b48a62', paint: '#d8d2c4',
  white: '#eef0f6', dark: '#242838', trunk: '#5b4030', leaf: '#3f8a4a', leaf2: '#5fae58', leafD: '#2f6a3c',
  pot: '#b0654a', blanket: '#4f7f9e', rug: '#9a3f6a', awn: '#d94a5a', grassA: '#6c8a44', grassW: '#7d7f5a', grassW2: '#6c6e4e', noren: '#c8323a', rack: '#1d2638', railc: '#9aa0b4', copper: '#5fae9a', coffee: '#5a3424', snow: '#e9eef7', snow2: '#d2daea', cream: '#f0e2c0', metal: '#8d93a8',
}) ) C[k] = hex(v);
const OUTLINE = hex('#0a0b16');
const WARM = hex('#ffd27a'), WARM2 = hex('#ffbe5c'), COOL = hex('#a8ecff'), PINK = hex('#ff9ad5');
const NEONS = ['#ff3d81', '#41e8ff', '#ffb02e', '#b6ff2e', '#c77dff'].map(hex);
const BCOLS = ['#6b6fa8', '#4f7f9e', '#7d6699', '#5a8a83', '#9a7a66', '#6e7891', '#8a5f7a', '#5c6c9c', '#77809a'].map(hex);

// ---------------------------------------------------------------- light
const TINTS = [[0, [.30, .32, .56]], [5, [.30, .32, .56]], [6.5, [.86, .64, .62]], [8, [1, 1, 1]], [17, [1, .96, .9]], [18.7, [.92, .6, .58]], [20, [.42, .4, .66]], [24, [.30, .32, .56]]];
const SKIES = [[0, '#080b15'], [5, '#0b0f1f'], [6.5, '#3b2c48'], [8, '#5a7593'], [17, '#5c7390'], [18.7, '#4b3150'], [20, '#11162a'], [24, '#080b15']].map(([k, c]) => [k, hex(c)]);
function sample(keys, h) {
  for (let i = 1; i < keys.length; i++) if (h <= keys[i][0]) {
    const t = (h - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
    return keys[i - 1][1].map((v, j) => lerp(v, keys[i][1][j], t));
  }
  return keys[keys.length - 1][1];
}
const OVERCAST = { clear: 0, clouds: .35, rain: .6, storm: .85, snow: .45, fog: .5, wind: .12 };
function lightAt(h, W = { kind: 'clear', k: 0 }) {
  const ov = (OVERCAST[W.kind] || 0) * W.k;
  let tint = sample(TINTS, h), sky = sample(SKIES, h);
  const ta = (tint[0] + tint[1] + tint[2]) / 3, sa = (sky[0] + sky[1] + sky[2]) / 3;
  tint = tint.map(v => lerp(v, ta, ov * .45) * (1 - ov * .36));
  sky = sky.map(v => lerp(v, sa, ov * .7) * (1 - ov * .25));
  if (W.kind === 'fog') sky = sky.map((v, i) => lerp(v, [150, 156, 172][i] * tint[i], W.k * .5));
  if (W.kind === 'snow') tint = tint.map((v, i) => v * [.97, 1, 1.06][i]);
  const night = clamp((1 - (tint[0] + tint[1]) / 2 - .02) / .66, 0, 1);
  let litP = .05 + .6 * night; if (h >= 1 && h < 5.5) litP *= .45;
  return { h, tint, sky, night, litP, ov, snow: W.kind === 'snow' && W.k > .5 };
}
let LT = lightAt(12);
const sh = (c, k = 1) => [c[0] * k * LT.tint[0], c[1] * k * LT.tint[1], c[2] * k * LT.tint[2]];
const flat = (c, k) => () => sh(c, k);
function withTint(tint, fn) { const prev = LT; LT = { ...LT, tint }; try { return fn(); } finally { LT = prev; } }

// ---------------------------------------------------------------- pixel sprites
function sprite(x0, y0, x1, y1) {
  const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
  return { x: x0, y: y0, w, h, d: new Uint8ClampedArray(w * h * 4) };
}
function put(sp, px, py, c, a = 255) {
  if (!sp) return;
  const ix = px - sp.x, iy = py - sp.y;
  if (ix < 0 || iy < 0 || ix >= sp.w || iy >= sp.h) return;
  const i = (iy * sp.w + ix) * 4, d = sp.d;
  if (a >= 255) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; return; }
  const t = a / 255;
  d[i] = lerp(d[i], c[0], t); d[i + 1] = lerp(d[i + 1], c[1], t); d[i + 2] = lerp(d[i + 2], c[2], t); d[i + 3] = Math.max(d[i + 3], a);
}
function finish(sp) {
  const cv = document.createElement('canvas'); cv.width = sp.w; cv.height = sp.h;
  cv.getContext('2d').putImageData(new ImageData(sp.d, sp.w, sp.h), 0, 0);
  return { cv, x: sp.x, y: sp.y, w: sp.w, h: sp.h, d: sp.d };
}
function outline(sp, c) {
  const { w, h, d } = sp, a0 = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) a0[i] = d[i * 4 + 3] > 0 ? 1 : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (a0[i]) continue;
    if ((x > 0 && a0[i - 1]) || (x < w - 1 && a0[i + 1]) || (y > 0 && a0[i - w]) || (y < h - 1 && a0[i + w])) {
      const j = i * 4; d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = 255;
    }
  }
}
// Rasterise one axis-aligned face. 'top' is a roof at height z; 'xw' is the plane gx = x; 'yw' is the plane gy = y.
function face(sp, f, fn) {
  let P;
  if (f.t === 'top') P = [iso(f.x0, f.y0, f.z), iso(f.x1, f.y0, f.z), iso(f.x0, f.y1, f.z), iso(f.x1, f.y1, f.z)];
  else if (f.t === 'xw') P = [iso(f.x, f.y0, f.z0), iso(f.x, f.y1, f.z0), iso(f.x, f.y0, f.z1), iso(f.x, f.y1, f.z1)];
  else P = [iso(f.x0, f.y, f.z0), iso(f.x1, f.y, f.z0), iso(f.x0, f.y, f.z1), iso(f.x1, f.y, f.z1)];
  const x0 = Math.floor(Math.min(...P.map(p => p[0]))), x1 = Math.ceil(Math.max(...P.map(p => p[0])));
  const y0 = Math.floor(Math.min(...P.map(p => p[1]))), y1 = Math.ceil(Math.max(...P.map(p => p[1])));
  for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) {
    const sx = px + .5 - OX, sy = py + .5 - OY;
    let c;
    if (f.t === 'top') {
      const a = sx / TW, b = (sy + f.z) / TH, gx = (a + b) / 2, gy = (b - a) / 2;
      if (gx < f.x0 || gx >= f.x1 || gy < f.y0 || gy >= f.y1) continue;
      c = fn(gx, gy, px, py);
    } else if (f.t === 'xw') {
      const gy = f.x - sx / TW, z = (f.x + gy) * TH - sy;
      if (gy < f.y0 || gy >= f.y1 || z < f.z0 || z >= f.z1) continue;
      c = fn(gy, z, px, py);
    } else {
      const gx = f.y + sx / TW, z = (gx + f.y) * TH - sy;
      if (gx < f.x0 || gx >= f.x1 || z < f.z0 || z >= f.z1) continue;
      c = fn(gx, z, px, py);
    }
    if (c) put(sp, px, py, c);
  }
}
function boxBounds(boxes) {
  let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
  for (const q of boxes) for (const x of [q.x0, q.x1]) for (const y of [q.y0, q.y1]) for (const z of [q.z0, q.z1]) {
    const p = iso(x, y, z); a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]);
  }
  return [Math.floor(a), Math.floor(b), Math.ceil(c), Math.ceil(d)];
}
function rasterBoxes(sp, boxes) {
  for (const q of boxes) {
    if (q.L !== false) face(sp, { t: 'yw', y: q.y1, x0: q.x0, x1: q.x1, z0: q.z0, z1: q.z1 }, q.L || flat(q.col, .84));
    if (q.R !== false) face(sp, { t: 'xw', x: q.x1, y0: q.y0, y1: q.y1, z0: q.z0, z1: q.z1 }, q.R || flat(q.col, .62));
    if (q.T !== false) face(sp, { t: 'top', z: q.z1, x0: q.x0, x1: q.x1, y0: q.y0, y1: q.y1 }, q.T || flat(q.col, 1.1));
  }
}
// Build a sprite from boxes. rel: coordinates relative to iso(0,0), for movable things.
function buildBoxes(boxes, o = {}) {
  const [a, b, c, d] = boxBounds(boxes), pad = o.pad ?? 2;
  const sp = sprite(a - pad - (o.padX || 0), b - pad - (o.padTop || 0), c + pad + (o.padX || 0), d + pad);
  rasterBoxes(sp, boxes);
  if (o.outline !== false) outline(sp, OUTLINE);
  if (o.after) o.after(sp);
  if (o.rel) { sp.x -= OX; sp.y -= OY; }
  return finish(sp);
}

// 3×5 pixel font for signs
const FONT = {};
'A010101111101101 B110101110101110 C011100100100011 D110101101101110 E111100110100111 F111100110100100 G011100101101011 H101101111101101 I111010010010111 L100100100100111 M101111111101101 N110101101101101 O010101101101010 P110101110100100 R110101110101101 S011100010001110 T111010010010010 U101101101101111 Y101101010010010 Z111001010100111 K101101110101101 V101101101101010 W101101111111101 X101101010101101 J001001001101010 Q010101101110011 0111101101101111 1010110010010111 2110001010100111 3110001010001110 4101101111001001 5111100110001110 6011100110101010 7111001010010010 8010101010101010 9010101011001110 ?111001010000010 !010010010000010'
  .split(' ').forEach(s => { FONT[s[0]] = [0, 1, 2, 3, 4].map(r => s.slice(1 + r * 3, 4 + r * 3)); });
const textW = s => s.length * 4 - 1;
function drawText(sp, s, x, y, c) {
  for (let i = 0; i < s.length; i++) {
    const g = FONT[s[i]]; if (!g) continue;
    for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) if (g[r][k] === '1') put(sp, x + i * 4 + k, y + r, c);
  }
}
function plate(sp, text, cx, cy, col) {
  const w = textW(text) + 6, h = 9, x = Math.round(cx - w / 2), y = Math.round(cy - h / 2), rim = col.map(v => v * .55);
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const edge = xx === 0 || yy === 0 || xx === w - 1 || yy === h - 1;
    put(sp, x + xx, y + yy, edge ? rim : [12, 16, 26]);
  }
  for (let yy = h; yy < h + 3; yy++) { put(sp, x + 3, y + yy, [40, 44, 60]); put(sp, x + w - 4, y + yy, [40, 44, 60]); }
  drawText(sp, text, x + 3, y + 2, col);
}

// ---------------------------------------------------------------- layout
const rng = mulberry(20261018);
const zones = new Map(), K = (x, y) => x + ',' + y;
const zoneRect = (x0, y0, x1, y1, z) => { for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) zones.set(K(x, y), z); };
zoneRect(4, 16, 9, 20, 'park');
zoneRect(17, 13, 19, 15, 'garden');
zoneRect(11, 8, 14, 9, 'plaza');
zoneRect(11, 14, 14, 15, 'plaza');
zoneRect(5, 14, 7, 15, 'plaza');
zoneRect(17, 7, 21, 9, 'quad');

const LMK = {
  library: { x0: 11, y0: 5, x1: 14, y1: 8.18, h: 30, col: C.stone, style: 'library', sign: 'LIBRARY', signCol: hex('#ffb02e'), route: 'archive', label: 'library → archive' },
  office: { x0: 11.06, y0: 11.06, x1: 13.94, y1: 13.94, h: 34, col: hex('#41708f'), style: 'ribbon', sign: 'OFFICE', signCol: hex('#41e8ff'), route: 'about', label: 'office → about', cut: 'office' },
  home: { x0: 17.06, y0: 11.06, x1: 18.94, y1: 12.94, h: 20, col: hex('#8f5b4b'), style: 'res', door: true, garden: true, route: 'about', label: 'home → about', cut: 'home' },
  cafe: { x0: 5.06, y0: 12.06, x1: 6.94, y1: 13.94, h: 18, col: hex('#a06a4c'), style: 'cafe', sign: 'COFFEE', signCol: hex('#ff3d81'), label: 'coffee shop' },
  ramen: { x0: 4.06, y0: 7.06, x1: 5.94, y1: 8.94, h: 20, col: hex('#7a3a30'), style: 'ramen', sign: 'RAMEN', signCol: hex('#ff5a4a'), label: 'ramen shop' },
  comics: { x0: 6.06, y0: 7.06, x1: 7.94, y1: 8.94, h: 22, col: hex('#5d4a9a'), style: 'comics', sign: 'COMICS', signCol: hex('#ffe14a'), label: 'comic book shop', mural: 'R', tag: 'POW', tagCol: hex('#ffe14a'), padX: 16 },
  univ: { x0: 17.06, y0: 5.06, x1: 20.94, y1: 6.94, h: 30, col: hex('#9a5444'), style: 'univ', sign: 'UNIVERSITY', signCol: hex('#e8ecf4'), label: 'university' },
  compute: { x0: 5.06, y0: 1.06, x1: 7.94, y1: 2.94, h: 46, col: hex('#323d58'), style: 'compute', sign: 'COMPUTE', signCol: hex('#41e8ff'), label: 'data center' },
  arcade: { x0: 17.06, y0: 1.06, x1: 18.94, y1: 2.94, h: 24, col: hex('#3e2c70'), style: 'arcade', sign: 'ARCADE', signCol: hex('#ff3d81'), label: 'arcade', signZ: 27 },
  robot: { x0: 11.06, y0: 1.06, x1: 12.94, y1: 2.94, h: 30, col: hex('#5c6c9c'), style: 'grid', label: 'the big robot' },
  billboard: { x0: 0.06, y0: 5.06, x1: 1.94, y1: 6.94, h: 70, col: hex('#3a4258'), style: 'ribbon', label: 'billboard' },
  cinema: { x0: 0.06, y0: 12.06, x1: 2.94, y1: 14.94, h: 40, col: hex('#7a1e2c'), style: 'cinema', label: 'cinema' },
};
const reserved = new Set();
const reserve = (x0, y0, x1, y1) => { for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) reserved.add(K(x, y)); };
reserve(0, 12, 3, 15); reserve(4, 7, 8, 9); reserve(17, 5, 21, 9); reserve(5, 1, 8, 3); reserve(17, 1, 19, 3); reserve(11, 1, 13, 3); reserve(0, 5, 2, 7);
reserve(11, 5, 14, 9); reserve(11, 11, 14, 15); reserve(17, 11, 19, 15); reserve(5, 12, 7, 15); reserve(4, 16, 9, 20);

const buildings = [];
let bid = 1;
function inFrontOfLandmark(x, y, w, d) {
  for (const L of Object.values(LMK)) {
    const lx0 = Math.floor(L.x0), ly0 = Math.floor(L.y0), lx1 = Math.ceil(L.x1), ly1 = Math.ceil(L.y1);
    if (x + w > lx0 - 1 && y + d > ly0 - 1 && x + y <= lx1 + ly1 + 3 && !(x + w <= lx0 || y + d <= ly0)) return true;
  }
  return false;
}
function genBuilding(x0, y0, x1, y1, h) {
  const id = bid++, r = mulberry(id * 9176 + 13);
  const b = { id, x0, y0, x1, y1, h, col: pick(BCOLS, r), props: [], neon: pick(NEONS, r) };
  b.roof = b.col.map(v => v * .55 + 22);
  b.style = h > 64 ? (r() < .5 ? 'ribbon' : 'grid') : (r() < .4 ? 'res' : 'grid');
  b.shop = h < 80 && r() < .5;
  b.garden = h < 40 && r() < .2;
  if (h > 32 && r() < .3) {
    const side = r() < .5 ? 'L' : 'R', len = (side === 'L' ? x1 - x0 : y1 - y0) * 16;
    b.vsign = { side, u: Math.round(len * (.25 + r() * .5)), z0: Math.round(h * .32), z1: Math.round(h * .78), col: pick(NEONS, r) };
  }
  if (h < 50 && r() < .24) {
    b.mural = r() < .5 ? 'L' : 'R'; b.muralH = Math.min(16, h - 4);
    const len = (b.mural === 'L' ? x1 - x0 : y1 - y0) * 16, fits = TAGS.filter(t => t.length * 8 <= len - 4);
    b.tag = fits.length ? pick(fits, r) : ''; b.tagCol = pick(TAGCOLS, r);
  }
  const n = Math.floor(r() * 3);
  for (let i = 0; i < n && !b.garden; i++) {
    const s = .18 + r() * .2, px = lerp(x0 + .15, x1 - .15 - s, r()), py = lerp(y0 + .15, y1 - .15 - s, r());
    const tank = r() < .3;
    b.props.push({ x0: px, x1: px + s, y0: py, y1: py + s, z0: h, z1: h + (tank ? 9 : 4 + Math.round(r() * 3)), col: tank ? C.wood : C.metal });
  }
  if (h > 70 && r() < .6) {
    const ax = lerp(x0 + .2, x1 - .3, r()), ay = lerp(y0 + .2, y1 - .3, r()), ah = 14 + Math.round(r() * 10);
    b.props.push({ x0: ax, x1: ax + .07, y0: ay, y1: ay + .07, z0: h, z1: h + ah, col: C.metal });
    blinkers.push({ p: iso(ax + .035, ay + .035, h + ah + 1), ph: r() });
  }
  return b;
}
const blinkers = [];
const TAGS = ['AI', 'BEEP', 'ZZZ', 'SUDO', 'YOLO', 'HI', 'RAD', 'LOL', '404', 'GG'];
const TAGCOLS = ['#e8ecf4', '#b6ff2e', '#ffe14a', '#41e8ff'].map(hex);
const MURAL = ['#ff3d81', '#41e8ff', '#b6ff2e', '#ffb02e', '#c77dff', '#3a3f9a'].map(hex);
const used = new Set();
const canUse = (x, y) => x < N && y < WATER && !isRoad(x, y) && !reserved.has(K(x, y)) && !used.has(K(x, y));
for (let y = 0; y < WATER; y++) for (let x = 0; x < N; x++) {
  if (!canUse(x, y)) continue;
  if (rng() < .07) { used.add(K(x, y)); zones.set(K(x, y), 'plaza'); continue; }
  let w = 1, d = 1;
  if (rng() < .45 && canUse(x + 1, y)) w = 2;
  if (rng() < .45 && canUse(x, y + 1) && (w === 1 || canUse(x + 1, y + 1))) d = 2;
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) used.add(K(x + i, y + j));
  const depth = x + w / 2 + y + d / 2;
  let h = 14 + rng() * 20 + Math.max(0, 24 - depth) * (1 + rng() * 3.2);
  if (inFrontOfLandmark(x, y, w, d)) h = Math.min(h, 14 + rng() * 6);
  buildings.push(genBuilding(x + .06, y + .06, x + w - .06, y + d - .06, Math.round(h)));
}

for (const side of [b => b.x1 < 11, b => b.x0 >= 11]) {
  const t = buildings.filter(side).sort((a, c) => c.h - a.h)[0];
  if (!t) continue;
  t.lattice = 34; t.props = t.props.filter(p => p.x1 - p.x0 > .1);
  const [bx, by] = iso((t.x0 + t.x1) / 2, (t.y0 + t.y1) / 2, t.h);
  blinkers.push({ p: [Math.round(bx), Math.round(by) - 35], ph: hash(t.id, 3) });
}

// ---------------------------------------------------------------- facades
function win(b, side, col, fl) {
  const lit = b.litP ?? LT.litP;
  if (hash(b.id, side === 'L' ? 1 : 2, col, fl) < lit) {
    const w = b.winCol || (hash(b.id, col, fl, 9) < .62 ? WARM : hash(b.id, col, fl, 5) < .8 ? COOL : PINK);
    return side === 'L' ? w : w.map(v => v * .86);
  }
  return sh(C.glass, side === 'L' ? .92 : .7);
}
function shopFront(b, side, upx, z) {
  if (z < 1) return null;
  if (z >= 4.5 && z < 5.5) return b.neon;
  const m = upx % 10;
  if (m >= 1 && m < 8 && z < 4.5) return LT.night > .25 ? WARM.map(v => v * .95) : sh(C.glass, .8);
  return null;
}
const PANELS = ['#ffe14a', '#41e8ff', '#ff3d81', '#f2f2f2', '#ff8a3d', '#7ad35b'].map(hex);
function muralPx(b, side, upx, z) {
  const top = b.muralH ?? (b.h - 4);
  if (z < 1 || z >= top) return null;
  const len = (side === 'L' ? b.x1 - b.x0 : b.y1 - b.y0) * 16, ru = side === 'L' ? upx : len - upx;
  const tag = b.tag || '', lu = ru - 3, row = Math.floor((top - 2 - z) / 2);
  if (tag && lu >= 0 && lu < tag.length * 8 && row >= 0 && row < 5) {
    const g = FONT[tag[Math.floor(lu / 8)]], cx = Math.floor((lu % 8) / 2);
    if (cx < 3 && g && g[row][cx] === '1') return sh(b.tagCol);
  }
  const cx = Math.floor(upx / 3), cz = Math.floor(z / 3);
  if (hash(b.id, cx, cz, 21) < .45) return sh(MURAL[Math.floor(hash(b.id, cx, cz, 22) * MURAL.length)], side === 'L' ? .95 : .75);
  return null;
}
const GOLD = hex('#d9a441'), POSTERS = ['#41e8ff', '#ff3d81', '#ffe14a', '#b6ff2e', '#c77dff', '#ff8a3d'].map(hex);
const STYLES = {
  grid(b, side, upx, z) {
    if (z < 6) return b.shop ? shopFront(b, side, upx, z) : null;
    if (z > b.h - 6) return null;
    const fz = z - 6, fl = Math.floor(fz / 9), r = fz - fl * 9, col = Math.floor(upx / 6), c = upx - col * 6;
    return (c >= 1.5 && c < 4.5 && r >= 2 && r < 7) ? win(b, side, col, fl) : null;
  },
  ribbon(b, side, upx, z) {
    if (z < 6) return b.shop ? shopFront(b, side, upx, z) : null;
    if (z > b.h - 5) return null;
    const fz = z - 6, fl = Math.floor(fz / 8), r = fz - fl * 8;
    return (r >= 2 && r < 7 && upx % 5 >= 1) ? win(b, side, Math.floor(upx / 10), fl) : null;
  },
  res(b, side, upx, z) {
    if (b.door && side === 'L' && z < 9 && Math.abs(upx - 15) < 2.5) return z < 8.5 ? sh(C.wood, .8) : sh(C.woodL);
    if (z < 6) return null;
    if (z > b.h - 5) return null;
    const fz = z - 6, fl = Math.floor(fz / 10), r = fz - fl * 10, col = Math.floor(upx / 8), c = upx - col * 8;
    if (c >= 2 && c < 6 && r >= 2 && r < 8) return win(b, side, col, fl);
    if (c >= 1.5 && c < 6.5 && r >= 8 && r < 9) return sh(C.white, .75);
    return null;
  },
  library(b, side, upx, z) {
    const k = side === 'L' ? 1 : .78;
    if (z < 3) return sh(C.stoneL, k * .95);
    if (z >= b.h - 8) return z < b.h - 7 ? sh(C.stone, .45) : sh(C.stoneL, k);
    const m = upx % 6;
    if (m < 2) return sh(C.stoneL, k * 1.02);
    if (m >= 2.5 && m < 5 && z >= 7 && z < b.h - 11) return b.open ? (side === 'L' ? WARM : WARM2) : sh(C.glass, .8 * k);
    return sh(C.stone, k * .62);
  },
  ramen(b, side, upx, z) {
    if (z < 1) return null;
    if (z < 6) return (upx % 9) < 1 ? sh(C.wood, .6) : (b.open ? WARM2 : sh(C.glass, .8));
    if (z < 10.5) {
      if (upx % 4 < .9) return sh(C.dark, .9);
      return (z > 7.5 && z < 9 && upx % 4 > 1.5 && upx % 4 < 3) ? sh(C.white, .95) : sh(C.noren, side === 'L' ? 1 : .8);
    }
    if (z < 12) return sh(C.wood, .55);
    return STYLES.res(b, side, upx, z) || (Math.floor(z) % 3 === 0 ? sh(b.col, side === 'L' ? .7 : .5) : null);
  },
  comics(b, side, upx, z) {
    if (z < 1) return null;
    if (side === 'L' && z < 11) {
      if (upx % 7 < 1 || (z - 1) % 5 < 1) return [20, 18, 30];
      const col = PANELS[Math.floor(hash(Math.floor(upx / 7), Math.floor((z - 1) / 5), 13) * PANELS.length)];
      return b.open ? col : sh(col, .8);
    }
    return STYLES.grid(b, side, upx, z);
  },
  univ(b, side, upx, z) {
    if (z < 3) return sh(C.stoneL, side === 'L' ? .9 : .7);
    if (z >= b.h - 5) return sh(C.stoneL, side === 'L' ? 1 : .78);
    const col = Math.floor(upx / 8), c = upx - col * 8, fz = z - 5, fl = Math.floor(fz / 11), r = fz - fl * 11;
    if (c >= 2 && c < 6 && r >= 2 && r < 9) return (r >= 8 && (c < 3 || c >= 5)) ? null : win(b, side, col, fl);
    if (c < 1) return sh(C.stoneL, side === 'L' ? .85 : .65);
    return null;
  },
  compute(b, side, upx, z) {
    if (z < 4) return side === 'L' && (upx % 12) < 6 ? sh(C.glass, .7) : null;
    if (z >= b.h - 4) return null;
    if (upx % 5 < 1) return sh(b.col, side === 'L' ? .6 : .45);
    const led = hash(b.id, Math.floor(upx), Math.floor(z), side === 'L' ? 3 : 4);
    if (Math.floor(z) % 3 === 0 && led < .35) return led < .12 ? [65, 232, 255] : led < .22 ? [182, 255, 46] : [40, 60, 90];
    return sh(C.rack, side === 'L' ? .9 : .7);
  },
  arcade(b, side, upx, z) {
    if (z < 1) return null;
    if (z < 9) return (upx % 6) < 1 ? sh(C.dark) : (Math.floor(upx / 6) % 2 ? [255, 61, 129] : [65, 232, 255]).map(v => v * (b.open ? 1 : .45));
    if (z < 11) return sh(C.dark, .8);
    return STYLES.grid(b, side, upx, z);
  },
  cinema(b, side, upx, z) {
    if (z < 1) return null;
    if (z < 9) {
      if (side === 'L' && Math.abs(upx - 23) < 5) return upx % 3 < .8 ? sh(GOLD, .7) : (b.open ? WARM2.map(v => v * .85) : sh(C.glass, .7));
      const m = upx % 12;
      if (m >= 2 && m < 8 && z >= 2 && z < 8) {
        if (m < 2.8 || m >= 7.2 || z < 2.8 || z >= 7.2) return sh(GOLD, side === 'L' ? 1 : .8);
        if (z >= 3 && z < 4) return [26, 20, 30];
        const pc = POSTERS[(Math.floor(upx / 12) + (side === 'L' ? 0 : 3)) % POSTERS.length];
        return b.open ? pc : sh(pc, .7);
      }
      return null;
    }
    if (z >= b.h - 4) return sh(GOLD, side === 'L' ? .95 : .75);
    const m = upx % 8;
    if (m < 1.5) return sh(GOLD, side === 'L' ? .85 : .65);
    if (m >= 3.5 && m < 4.5 && z > 14) return sh(b.col, .55);
    return null;
  },
  cafe(b, side, upx, z) {
    if (z < 1) return null;
    if (z < 10) return (upx % 8) < 1 ? sh(C.wood, .7) : (b.open ? WARM2 : sh(C.glass, .85));
    if (z < 13.5) return Math.floor(upx / 3) % 2 ? sh(C.awn, side === 'L' ? 1 : .8) : sh(C.cream, side === 'L' ? 1 : .8);
    return STYLES.res(b, side, upx, z);
  },
};
function wallFn(b, side) {
  const base = side === 'L' ? b.x0 : b.y0, lenpx = (side === 'L' ? b.x1 - b.x0 : b.y1 - b.y0) * 16, k = side === 'L' ? .84 : .62;
  return (u, z) => {
    const upx = (u - base) * 16;
    if (side === 'L' && upx >= lenpx - 1) return sh(b.col, 1.16);
    if (b.vsign && side === b.vsign.side && Math.abs(upx - b.vsign.u) < 1.6 && z >= b.vsign.z0 && z < b.vsign.z1)
      return Math.floor(z) % 4 === 0 ? b.vsign.col.map(v => v * .6) : b.vsign.col;
    if (z >= b.h - 3) return sh(b.col, k * 1.14);
    if (b.mural === side) { const m = muralPx(b, side, upx, z); if (m) return m; }
    return STYLES[b.style](b, side, upx, z) || sh(b.col, k * (Math.floor(z) % 9 === 5 ? .92 : 1));
  };
}
function roofFn(b) {
  return (gx, gy) => {
    const e = Math.min(gx - b.x0, b.x1 - gx, gy - b.y0, b.y1 - gy);
    if (e < .07) return sh(b.col, 1.22);
    if (LT.snow) return sh(hash(gx * 16 | 0, gy * 16 | 0, 5) < .5 ? C.snow : C.snow2);
    if (b.garden && e > .18) return sh(hash(gx * 16 | 0, gy * 16 | 0, 3) < .5 ? C.grass : C.grass2);
    return sh(b.roof || C.metal, ((Math.floor(gx * 4) + Math.floor(gy * 4)) & 1) ? 1 : .93);
  };
}
function drawLattice(sp, b) {
  const [bx, by] = iso((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, b.h), L = b.lattice, cx = Math.round(bx), cy = Math.round(by);
  for (let y = 0; y <= L; y++) {
    const w = Math.round(4 * (1 - y / L)), col = Math.floor(y / 6) % 2 ? sh(C.noren) : sh(C.white, .9);
    put(sp, cx - w, cy - y, col); put(sp, cx + w, cy - y, col);
    if (y % 5 === 0) for (let x = -w; x <= w; x++) put(sp, cx + x, cy - y, sh(C.metal, .8));
    else { const t = (y % 5) / 5; put(sp, Math.round(cx - w + t * 2 * w), cy - y, sh(C.metal, .7)); }
  }
}
function buildingSprite(b) {
  const boxes = [{ x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, z0: 0, z1: b.h, L: wallFn(b, 'L'), R: wallFn(b, 'R'), T: roofFn(b) }];
  for (const p of (b.extra || [])) boxes.push(p);
  for (const p of [...b.props].sort((a, c) => (a.x0 + a.y0) - (c.x0 + c.y0))) boxes.push(p);
  return buildBoxes(boxes, {
    padTop: b.padTop ?? ((b.sign ? 9 + (b.signZ ?? 9) : 2) + (b.lattice ? b.lattice + 4 : 0)), padX: b.padX ?? (b.sign ? 6 : 0),
    after: sp => {
      if (b.sign) { const [cx, cy] = iso((b.x0 + b.x1) / 2, b.y1, b.h + (b.signZ ?? 9)); plate(sp, b.sign, cx, cy, b.signCol); }
      if (b.lattice) drawLattice(sp, b);
      if (b.after) b.after(sp);
    },
  });
}

// landmark details
LMK.library.extra = [
  { x0: 11, x1: 14, y0: 8, y1: 8.18, z0: 0, z1: 3, col: C.stoneL },
  { x0: 12.05, x1: 12.95, y0: 6.05, y1: 6.95, z0: 30, z1: 38, col: C.stoneL },
  { x0: 12.2, x1: 12.8, y0: 6.2, y1: 6.8, z0: 38, z1: 43, col: hex('#5fae9a') },
];
LMK.library.roof = C.stone.map(v => v * .8);
LMK.office.roof = hex('#3a4a5c');
LMK.office.props = [{ x0: 13.2, x1: 13.6, y0: 11.4, y1: 11.8, z0: 34, z1: 39, col: C.metal }, { x0: 11.6, x1: 11.67, y0: 11.6, y1: 11.67, z0: 34, z1: 52, col: C.metal }];
blinkers.push({ p: iso(11.635, 11.635, 53), ph: .3 });
LMK.home.roof = hex('#6a4a40');
LMK.home.props = [{ x0: 17.3, x1: 17.55, y0: 11.3, y1: 11.55, z0: 20, z1: 26, col: hex('#7a4a3c') }];
LMK.cafe.roof = hex('#6d5040');
LMK.cafe.props = [{ x0: 5.4, x1: 5.7, y0: 12.4, y1: 12.7, z0: 18, z1: 22, col: C.metal }];
// coffee shop: giant rooftop cup
LMK.cafe.extra = [
  { x0: 5.75, x1: 6.25, y0: 12.75, y1: 13.25, z0: 18, z1: 28, col: C.white, T: flat(C.coffee, 1) },
  { x0: 6.25, x1: 6.36, y0: 12.93, y1: 13.07, z0: 21, z1: 26, col: C.white },
];
LMK.cafe.dyn = (ctx, anim) => { const [x, y] = iso(6, 13, 29); steam(ctx, x, y, anim, 4); };
// ramen: lanterns + steaming vent
LMK.ramen.roof = hex('#4a2a24');
LMK.ramen.props = [{ x0: 4.4, x1: 4.62, y0: 7.4, y1: 7.62, z0: 20, z1: 26, col: C.metal }];
const LANTERNS = [iso(4.25, 8.94, 12), iso(5.75, 8.94, 12)];
LMK.ramen.glows = LANTERNS.map(p => ({ p: [p[0] + 1, p[1] + 2], c: [255, 90, 70], r: 10, a: .55 }));
LMK.ramen.dyn = (ctx, anim) => {
  for (const [lx, ly] of LANTERNS) {
    const x = Math.round(lx) - 1, y = Math.round(ly);
    ctx.fillStyle = '#2a1a14'; ctx.fillRect(x + 1, y - 1, 1, 1); ctx.fillRect(x, y, 3, 1); ctx.fillRect(x, y + 4, 3, 1);
    ctx.fillStyle = '#e8323a'; ctx.fillRect(x, y + 1, 3, 3); ctx.fillStyle = '#ffd27a'; ctx.fillRect(x + 1, y + 2, 1, 1);
  }
  const [x, y] = iso(4.51, 7.51, 27); steam(ctx, x, y, anim, 5);
};
// comics: POW starburst beside the sign
LMK.comics.after = sp => {
  const [cx, cy] = iso(7, 8.94, 31), x0 = Math.round(cx) - 24, y0 = Math.round(cy);
  for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) {
    const a = Math.atan2(y, x), d = Math.hypot(x, y), rr = 4.2 + 1.8 * Math.sign(Math.cos(a * 5));
    if (d <= rr) put(sp, x0 + x, y0 + y, d <= rr - 2 ? [255, 90, 60] : [255, 225, 74]);
  }
};
// university: clock tower that keeps Curtis's time
LMK.univ.extra = [
  { x0: 18.6, x1: 19.4, y0: 5.4, y1: 6.2, z0: 30, z1: 62, col: C.stoneL },
  { x0: 18.65, x1: 19.35, y0: 5.45, y1: 6.15, z0: 62, z1: 66, col: C.copper },
  { x0: 18.76, x1: 19.24, y0: 5.56, y1: 6.04, z0: 66, z1: 70, col: C.copper },
  { x0: 18.88, x1: 19.12, y0: 5.68, y1: 5.92, z0: 70, z1: 75, col: C.copper },
];
LMK.univ.roof = hex('#5a3a34');
const CLOCK = iso(19, 6.2, 51);
LMK.univ.glows = [{ p: CLOCK, c: [255, 236, 190], r: 10, a: .4 }];
LMK.univ.dyn = () => {
  const cx = Math.round(CLOCK[0]), cy = Math.round(CLOCK[1]);
  for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) {
    const d = Math.hypot(x, y); if (d > 4.3) continue;
    ctx.fillStyle = d > 3.3 ? '#3a2a20' : (LT.night > .3 ? '#f4ecd0' : rgba(sh([244, 236, 208]), 1)); ctx.fillRect(cx + x, cy + y, 1, 1);
  }
  const ha = ((S.t / 3600) % 12) / 12 * Math.PI * 2 - Math.PI / 2, ma = ((S.t / 60) % 60) / 60 * Math.PI * 2 - Math.PI / 2;
  ctx.fillStyle = '#1a1a1a';
  for (let k = 0; k <= 2; k++) ctx.fillRect(cx + Math.round(Math.cos(ha) * k), cy + Math.round(Math.sin(ha) * k), 1, 1);
  for (let k = 0; k <= 3; k++) ctx.fillRect(cx + Math.round(Math.cos(ma) * k), cy + Math.round(Math.sin(ma) * k), 1, 1);
};
// data center: blinking rack LEDs
LMK.compute.roof = hex('#262e44');
LMK.compute.props = [{ x0: 5.4, x1: 5.9, y0: 1.4, y1: 1.9, z0: 46, z1: 52, col: C.metal }, { x0: 6.3, x1: 6.8, y0: 1.4, y1: 1.9, z0: 46, z1: 52, col: C.metal }, { x0: 7.2, x1: 7.6, y0: 1.3, y1: 1.7, z0: 46, z1: 50, col: C.metal }];
LMK.compute.leds = [];
face(null, { t: 'yw', y: LMK.compute.y1, x0: LMK.compute.x0, x1: LMK.compute.x1, z0: 4, z1: LMK.compute.h - 4 }, (gx, z, px, py) => {
  const upx = (gx - LMK.compute.x0) * 16, b = LMK.compute;
  if (upx % 5 < 1 || Math.floor(z) % 3 !== 0) return;
  const led = hash(900 + Object.keys(LMK).indexOf('compute'), Math.floor(upx), Math.floor(z), 3);
  if (led < .22) b.leds.push([px, py, hash(px, py, 5)]);
});
LMK.compute.dyn = (ctx, anim) => {
  for (const [x, y, h] of LMK.compute.leds) {
    const on = reduced || fr(anim * (.6 + h * 1.8) + h * 7) < .55;
    ctx.fillStyle = on ? (h < .5 ? '#41e8ff' : '#b6ff2e') : '#1d2638'; ctx.fillRect(x, y, 1, 1);
  }
};
// arcade: chasing marquee bulbs + a space invader on the roof
const BULBS = [];
for (let u = 1.5; u < (LMK.arcade.x1 - LMK.arcade.x0) * 16 - 1; u += 3) BULBS.push(iso(LMK.arcade.x0 + u / 16, LMK.arcade.y1, 10.5));
for (let u = 1.5; u < (LMK.arcade.y1 - LMK.arcade.y0) * 16 - 1; u += 3) BULBS.push(iso(LMK.arcade.x1, LMK.arcade.y0 + u / 16, 10.5));
const INVADER = [['..x.....x..', '...x...x...', '..xxxxxxx..', '.xx.xxx.xx.', 'xxxxxxxxxxx', 'x.xxxxxxx.x', 'x.x.....x.x', '...xx.xx...'],
                 ['..x.....x..', 'x..x...x..x', 'x.xxxxxxx.x', 'xxx.xxx.xxx', 'xxxxxxxxxxx', '.xxxxxxxxx.', '..x.....x..', '.x.......x.']];
const INV_AT = iso(18, 2, 66);
LMK.arcade.glows = [{ p: INV_AT, c: [182, 255, 46], r: 16, a: .4 }, { p: iso(18, 2.94, 5), c: [255, 61, 129], r: 18, a: .35 }];
LMK.arcade.dyn = (ctx, anim) => {
  const step = reduced ? 0 : Math.floor(anim * 6), cols = ['#ffe14a', '#ff3d81', '#41e8ff'];
  BULBS.forEach(([x, y], i) => { ctx.fillStyle = cols[(i + step) % 3]; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); });
  const f = INVADER[reduced ? 0 : Math.floor(anim * 1.5) % 2], x0 = Math.round(INV_AT[0]) - 5, y0 = Math.round(INV_AT[1]) - 4;
  ctx.fillStyle = '#0c1018'; ctx.fillRect(x0 - 2, y0 - 2, 15, 12);
  ctx.fillStyle = '#b6ff2e'; f.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'x') ctx.fillRect(x0 + c, y0 + r, 1, 1); }));
  ctx.fillStyle = '#2b3150'; ctx.fillRect(x0 + 2, y0 + 10, 1, 4); ctx.fillRect(x0 + 8, y0 + 10, 1, 4);
};
// the big robot, waving from its rooftop
const ROBO_WHITE = hex('#e3e7f0');
const ROBO_GREY = hex('#9aa3b8');
LMK.robot.extra = [
  // feet, legs, hips: wide stance
  { x0: 11.56, x1: 11.86, y0: 1.8, y1: 2.14, z0: 30, z1: 33, col: ROBO_GREY },
  { x0: 12.14, x1: 12.44, y0: 1.8, y1: 2.14, z0: 30, z1: 33, col: ROBO_GREY },
  { x0: 11.62, x1: 11.82, y0: 1.86, y1: 2.06, z0: 33, z1: 42, col: ROBO_GREY },
  { x0: 12.18, x1: 12.38, y0: 1.86, y1: 2.06, z0: 33, z1: 42, col: ROBO_GREY },
  { x0: 11.58, x1: 12.42, y0: 1.78, y1: 2.14, z0: 42, z1: 46, col: ROBO_GREY },
  // boxy torso with a chest panel of lights
  { x0: 11.46, x1: 12.54, y0: 1.7, y1: 2.2, z0: 46, z1: 62, col: ROBO_WHITE, L: (gx, z) => {
      const u = (gx - 11.46) * 16;
      if (u >= 4 && u < 13.5 && z >= 50 && z < 58) {
        if (z >= 55 && z < 56.5) return u < 6.5 ? [65, 232, 255] : u < 9 ? [255, 61, 129] : u < 11.5 ? [182, 255, 46] : [26, 32, 48];
        if (z >= 51.5 && z < 52.5 && u >= 5 && u < 12.5) return sh(ROBO_GREY, .8);
        return [26, 32, 48];
      }
      return sh(ROBO_WHITE, .86);
    } },
  { x0: 11.34, x1: 11.5, y0: 1.82, y1: 2.08, z0: 57, z1: 63, col: ROBO_GREY },
  { x0: 12.5, x1: 12.66, y0: 1.82, y1: 2.08, z0: 57, z1: 63, col: ROBO_GREY },
  // wide head with side bolts and a screen face
  { x0: 11.56, x1: 11.62, y0: 1.9, y1: 2.0, z0: 66, z1: 70, col: ROBO_GREY },
  { x0: 11.62, x1: 12.38, y0: 1.75, y1: 2.15, z0: 63, z1: 73, col: ROBO_WHITE, L: (gx, z) => {
      const u = (gx - 11.62) * 16;
      if (z >= 64.5 && z < 71.5 && u >= 1 && u < 11.2) {
        if (z >= 67 && z < 69 && ((u >= 2.5 && u < 4.5) || (u >= 7.5 && u < 9.5))) return [65, 232, 255];
        if (z >= 65 && z < 66 && u >= 4 && u < 8.5) return [65, 232, 255].map(v => v * .7);
        return [26, 32, 48];
      }
      return sh(ROBO_WHITE, .86);
    } },
  { x0: 12.38, x1: 12.44, y0: 1.9, y1: 2.0, z0: 66, z1: 70, col: ROBO_GREY },
  { x0: 11.97, x1: 12.03, y0: 1.92, y1: 1.98, z0: 73, z1: 80, col: C.metal },
  // both arms bent at the elbow, forearms forward, cradling an electric sheep
  { x0: 11.32, x1: 11.48, y0: 1.87, y1: 2.03, z0: 51, z1: 59, col: ROBO_WHITE },
  { x0: 11.32, x1: 11.48, y0: 2.03, y1: 2.34, z0: 51, z1: 55, col: ROBO_WHITE },
  { x0: 11.3, x1: 11.5, y0: 2.34, y1: 2.48, z0: 50, z1: 56, col: ROBO_GREY },
  { x0: 12.52, x1: 12.68, y0: 1.87, y1: 2.03, z0: 51, z1: 59, col: ROBO_WHITE },
  { x0: 12.52, x1: 12.68, y0: 2.03, y1: 2.34, z0: 51, z1: 55, col: ROBO_WHITE },
  { x0: 12.5, x1: 12.7, y0: 2.34, y1: 2.48, z0: 50, z1: 56, col: ROBO_GREY },
];
blinkers.push({ p: iso(12, 1.95, 81), ph: .7 });
LMK.robot.glows = [{ p: iso(12, 2.15, 68), c: [65, 232, 255], r: 12, a: .5 }, { p: iso(12, 2.32, 58), c: [182, 255, 46], r: 10, a: .4 }];
// screen-face pixels on the head's front face, redrawn each frame for expressions
const ROBO_FACE = [];
face(null, { t: 'yw', y: 2.15, x0: 11.62, x1: 12.38, z0: 64.5, z1: 71.5 }, (gx, z, px, py) => { const u = (gx - 11.62) * 16; if (u >= 1 && u < 11.2) ROBO_FACE.push([px, py, u, z]); });
const HEART = ['.x.x.', 'xxxxx', '.xxx.', '..x..'];
// a bigger electric sheep for the robot to hold
const BIG_SHEEP = ['...wwwwww.....', '.wwwwwwwwww...', 'wwwwwwwwwwwkk.', 'wwwwwwwwwwkkkk', 'WwwwwwwwwwkekK', '.WWwwwwwWWkkk.', '..WWWWWWW.....', '..g..g..g..g..', '..g..g..g..g..'];
function bigSheepSprite() {
  let s = vcache.get('bigsheep'); if (s) return s;
  const h = BIG_SHEEP.length, sp = sprite(-8, -h - 1, 8, 1);
  const col = { w: sh([242, 244, 252]), W: sh([196, 200, 216]), k: sh([42, 42, 58]), K: sh([70, 70, 90]), e: [182, 255, 46], g: [182, 255, 46] };
  BIG_SHEEP.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') put(sp, c - 7, r - h, col[ch]); }));
  outline(sp, OUTLINE);
  s = finish(sp); vcache.set('bigsheep', s); return s;
}
LMK.robot.dyn = (ctx, anim) => {
  // a 10s loop: content, glance around, sheep sparks (heart eyes), happy
  const t = reduced ? 1 : anim % 10, mood = t < 2.5 ? 'calm' : t < 5 ? 'look' : t < 7.5 ? 'love' : 'happy';
  const blink = mood === 'calm' && t > 2.2, du = mood === 'look' ? (t < 3.75 ? -1.5 : 1.5) : 0;
  const ink = mood === 'love' ? '#ff3d81' : '#41e8ff';
  for (const [x, y, u, z] of ROBO_FACE) {
    let on = false;
    for (const e0 of [2.5, 7.5]) {
      const eu = u - du - e0;
      if (eu < 0 || eu >= 2) continue;
      if (blink) on = z >= 67.5 && z < 68.5;
      else if (mood === 'happy') on = (z >= 68 && z < 69) || (z >= 67 && z < 68 && (eu < .8 || eu >= 1.2));
      else on = z >= 67 && z < 69;
    }
    if (z >= 65 && z < 66 && u >= 4 && u < 8.5) on = true;
    if ((mood === 'happy' || mood === 'love') && z >= 65.5 && z < 66.5 && (u >= 3.5 && u < 4 || u >= 8.5 && u < 9)) on = true;
    ctx.fillStyle = on ? ink : '#1a2030'; ctx.fillRect(x, y, 1, 1);
  }
  // the sheep it is holding
  const spr = bigSheepSprite(), [sx, sy] = iso(12, 2.42, 56);
  ctx.drawImage(spr.cv, Math.round(sx + spr.x), Math.round(sy + spr.y));
  if (mood === 'love') {
    const ph = (t - 5) / 2.5;
    if (fr(anim * 3) < .5) { ctx.fillStyle = '#b6ff2e'; ctx.fillRect(Math.round(sx) - 9, Math.round(sy) - 9, 1, 2); ctx.fillRect(Math.round(sx) + 8, Math.round(sy) - 7, 2, 1); ctx.fillRect(Math.round(sx) - 2, Math.round(sy) - 12, 1, 2); }
    ctx.globalAlpha = 1 - ph; ctx.fillStyle = '#ff3d81';
    HEART.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'x') ctx.fillRect(Math.round(sx) - 2 + c, Math.round(sy - 16 - ph * 14) + r, 1, 1); }));
    ctx.globalAlpha = 1;
  }
};
// cinema: art deco corner movie palace with a blade sign, a two-line marquee, popcorn and searchlights
const MQ = { x0: .1, x1: 2.9, y: 15.26, z0: 9, z1: 35 }, MQW = (MQ.x1 - MQ.x0) * 16, CREAM = hex('#f4ecd0');
const BLADE = { x0: 2.94, x1: 3.42, y0: 14.6, y1: 14.72, z0: 12, z1: 58 };
const bladeFace = (gx, z) => {
  const len = (BLADE.x1 - BLADE.x0) * 16, u = (gx - BLADE.x0) * 16;
  if (u < 1 || u >= len - 1 || z < BLADE.z0 + 1 || z >= BLADE.z1 - 2) return sh(GOLD, .9);
  const top = BLADE.z1 - 4, idx = Math.floor((top - z) / 7), r = Math.floor(top - z - idx * 7), col = Math.floor(u - 2.3);
  const g = FONT['CINEMA'[idx]];
  if (g && r < 5 && col >= 0 && col < 3 && g[r][col] === '1') return [255, 242, 192];
  return sh(LMK.cinema.col, .75);
};
const stripes = (gx, z) => Math.floor(gx * 16 / 2) % 2 ? sh([220, 50, 60]) : sh([245, 245, 250]);
LMK.cinema.extra = [
  { x0: 0.9, x1: 2.1, y0: 12.9, y1: 14.1, z0: 40, z1: 45, col: LMK.cinema.col, T: flat(GOLD, 1) },
  { x0: 1.15, x1: 1.85, y0: 13.15, y1: 13.85, z0: 45, z1: 49, col: LMK.cinema.col, T: flat(GOLD, 1) },
  { x0: 1.35, x1: 1.65, y0: 13.35, y1: 13.65, z0: 49, z1: 55, col: GOLD },
  { x0: 0.3, x1: 0.75, y0: 12.3, y1: 12.75, z0: 40, z1: 48, col: C.white, L: stripes, R: (gy, z) => stripes(gy, z), T: (gx, gy) => hash(gx * 16 | 0, gy * 16 | 0, 4) < .5 ? sh([255, 244, 200]) : sh([242, 209, 107]) },
  { x0: 0.38, x1: 0.67, y0: 12.38, y1: 12.67, z0: 48, z1: 50, col: hex('#f2d16b') },
  { x0: MQ.x0, x1: MQ.x1, y0: 14.94, y1: MQ.y, z0: MQ.z0, z1: MQ.z1, col: hex('#2a1a22'),
    L: (gx, z) => (z < MQ.z0 + 2 || z >= MQ.z1 - 2) ? [42, 26, 34] : (LMK.cinema.open ? CREAM : sh(CREAM, .8)), R: flat(GOLD, .7), T: flat(hex('#2a1a22'), 1) },
  { ...BLADE, col: GOLD, L: bladeFace },
];
const MQ_BULBS = [];
for (let u = 1; u < MQW - .5; u += 3) MQ_BULBS.push(iso(MQ.x0 + (u + .5) / 16, MQ.y, MQ.z1 - .9), iso(MQ.x0 + (u + .5) / 16, MQ.y, MQ.z0 + .6));
// classic sci-fi and horror, at most six letters a line so they fit the board at double size
const TITLES = [['BLADE', 'RUNNER'], ['ALIEN'], ['THE', 'THING'], ['AKIRA'], ['THE', 'FLY'], ['GET', 'OUT'], ['THE', 'MATRIX'], ['PSYCHO'], ['DUNE'], ['THEM!'], ['TRON'], ['SCREAM']];
const SEARCH = [iso(0.5, 12.3, 41), iso(2.6, 12.3, 41)];
LMK.cinema.glows = [{ p: iso(1.5, MQ.y, 22), c: [255, 226, 160], r: 30, a: .5 }, { p: iso(3.18, BLADE.y1, 36), c: [255, 210, 120], r: 18, a: .45 }];
function boardLine(ctx, text, ztop) {
  const sc = 2, adv = 3 * sc + 1, w = text.length * adv - 1, start = Math.floor((MQW - w) / 2);
  for (let i = 0; i < text.length; i++) {
    const g = FONT[text[i]]; if (!g) continue;
    for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) {
      if (g[r][k] !== '1') continue;
      for (let du = 0; du < sc; du++) for (let dv = 0; dv < sc; dv++) {
        const [x, y] = iso(MQ.x0 + (start + i * adv + k * sc + du + .5) / 16, MQ.y, ztop - r * sc - dv - .5);
        ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
      }
    }
  }
}
LMK.cinema.dyn = (ctx, anim) => {
  const step = reduced ? 0 : Math.floor(anim * 5);
  MQ_BULBS.forEach(([x, y], i) => { ctx.fillStyle = ((i >> 1) + step) % 2 ? '#fff2c0' : '#c98a2a'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); });
  const lines = TITLES[(reduced ? 0 : Math.floor(anim / 4)) % TITLES.length], top = MQ.z1 - 2;
  ctx.fillStyle = '#1a1a22';
  if (lines.length === 2) { boardLine(ctx, lines[0], top); boardLine(ctx, lines[1], top - 12); }
  else boardLine(ctx, lines[0], top - 6);
  // premiere searchlights sweep the night sky in the evening
  const hr = S.t / 3600;
  if (LT.night > .35 && (hr >= 18 || hr < 1)) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    SEARCH.forEach(([sx, sy], i) => {
      const a = -Math.PI / 2 + (reduced ? (i ? .3 : -.3) : Math.sin(anim * .35 + i * 2.2) * .55), len = 260, w = 18;
      const ex = sx + Math.cos(a) * len, ey = sy + Math.sin(a) * len, nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
      const g = ctx.createLinearGradient(sx, sy, ex, ey);
      g.addColorStop(0, `rgba(255,240,200,${.22 * LT.night})`); g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx - 1, sy); ctx.lineTo(sx + 1, sy); ctx.lineTo(ex + nx, ey + ny); ctx.lineTo(ex - nx, ey - ny); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff2c0'; ctx.fillRect(Math.round(sx) - 1, Math.round(sy) - 1, 2, 2);
    });
    ctx.restore();
  }
};

// billboard: a 3D sign board on the tower roof; text scrolls across its iso front face
const BBX0 = -0.3, BBX1 = 2.3, BBY = 6.12, BBZ0 = 79, BBZ1 = 95, BBW = (BBX1 - BBX0) * 16;
const bbFace = (gx, z) => {
  const u = (gx - BBX0) * 16;
  if (u < 2 || u >= BBW - 2 || z < BBZ0 + 2 || z >= BBZ1 - 2) return sh(C.metal, .62);
  return [10, 12, 20];
};
LMK.billboard.extra = [
  { x0: 0.35, x1: 0.45, y0: 5.95, y1: 6.05, z0: 70, z1: 79, col: C.metal },
  { x0: 1.55, x1: 1.65, y0: 5.95, y1: 6.05, z0: 70, z1: 79, col: C.metal },
  { x0: BBX0 + .1, x1: BBX1 - .1, y0: 6.0, y1: 6.32, z0: 77, z1: 78, col: C.metal },
  { x0: BBX0, x1: BBX1, y0: 5.98, y1: BBY, z0: BBZ0, z1: BBZ1, col: hex('#3a4258'), L: bbFace },
];
LMK.billboard.padTop = 4; LMK.billboard.padX = 8;
LMK.billboard.glows = [{ p: iso(1, BBY, 87), c: [255, 61, 129], r: 30, a: .35 }];
LMK.billboard.dyn = (ctx, anim) => {
  const msg = 'DO AGENTS DREAM OF ELECTRIC SHEEP?', sc = 2, wi = BBW - 4, tw = msg.length * 4 * sc;
  const start = wi - (reduced ? wi - 2 : Math.floor(anim * 18) % (tw + wi)), ztop = BBZ1 - 3.5;
  ctx.fillStyle = '#ff3d81';
  for (let i = 0; i < msg.length; i++) {
    const g = FONT[msg[i]]; if (!g) continue;
    const cu = start + i * 4 * sc; if (cu > wi || cu + 3 * sc < 0) continue;
    for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) {
      if (g[r][k] !== '1') continue;
      for (let du = 0; du < sc; du++) for (let dv = 0; dv < sc; dv++) {
        const U = cu + k * sc + du; if (U < 0 || U >= wi) continue;
        const [x, y] = iso(BBX0 + (2 + U + .5) / 16, BBY, ztop - r * sc - dv);
        ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
      }
    }
  }
};
for (const [k, L] of Object.entries(LMK)) { L.id = 900 + Object.keys(LMK).indexOf(k); L.key = k; L.props = L.props || []; buildings.push(L); }

// ---------------------------------------------------------------- interiors (dollhouse cutaways)
const INTERIOR = {
  office: {
    floor: (gx, gy) => sh(((Math.floor(gx * 6) + Math.floor(gy * 6)) & 1) ? hex('#5c6478') : hex('#545b6e')),
    furniture: [
      [.1, .52, .25, .9, 0, 5, C.woodL], [.16, .22, .4, .75, 5, 11, C.dark, 'mx'],
      [.1, .52, 1.3, 1.95, 0, 5, C.woodL], [.16, .22, 1.45, 1.8, 5, 11, C.dark, 'mx'],
      [1.2, 1.85, .1, .52, 0, 5, C.woodL], [1.35, 1.7, .16, .22, 5, 11, C.dark, 'my'],
      [1.95, 2.7, .08, .11, 10, 21, C.white],
      [2.55, 2.8, .15, .4, 0, 4, C.pot], [2.5, 2.85, .1, .45, 4, 12, C.leaf],
    ],
    table: [1.5, 2.4, 1.5, 2.25, 0, 5, C.wood],
    seats: { code: [.8, .58, 'sitB'], cw1: [.8, 1.62, 'sitB'], cw2: [1.52, .8, 'sitB'], meetA: [1.3, 1.9, 'sitF'], meetB: [1.95, 1.3, 'sitF'], meetC: [1.95, 2.48, 'sitB'] },
  },
  home: {
    floor: (gx, gy, b) => {
      const u = gx - b.x0, v = gy - b.y0;
      if (u > .9 && u < 1.7 && v > 1.0 && v < 1.7) return sh((u < .96 || u > 1.64 || v < 1.06 || v > 1.64) ? C.cream : C.rug);
      return sh(Math.floor(v * 8) % 2 ? C.woodL : C.woodL.map(x => x * .92));
    },
    furniture: [
      [.08, .14, .15, 1.0, 0, 10, C.wood], [.14, .85, .15, 1.0, 0, 3, C.wood], [.15, .84, .17, .98, 3, 5, C.blanket], [.16, .36, .3, .85, 5, 6, C.white],
      [1.0, 1.7, .08, .45, 0, 5, C.woodL], [1.2, 1.5, .18, .23, 5, 9, C.dark, 'my'],
      [.08, .22, 1.2, 1.8, 0, 15, C.wood, 'books'],
      [1.55, 1.78, 1.5, 1.73, 0, 4, C.pot], [1.5, 1.82, 1.45, 1.78, 4, 10, C.leaf],
    ],
    seats: { tinker: [1.35, .8, 'sitB'] },
    head: [.25, .57, 6],
  },
};
function interiorSprites(b, spec, lightsOn) {
  const tint = lightsOn ? [1, .93, .84] : LT.tint.map(v => Math.min(1, v * 1.15));
  return withTint(tint, () => {
    const W = .08, x0 = b.x0, y0 = b.y0, x1 = b.x1, y1 = b.y1, h = b.h;
    const wallInner = (along0) => (u, z) => {
      if (z >= h - 2) return sh(C.paint, .7);
      const p = ((u - along0) * 16) % 16;
      if (z >= 9 && z < h - 6 && p >= 5 && p < 11) return lightsOn && LT.night < .3 ? sh(C.glass, 1.1) : sh(C.glass, .7);
      return sh(C.paint, z < 3 ? .75 : .92);
    };
    const boxes = [
      { x0, x1, y0, y1, z0: -1, z1: 0, L: false, R: false, T: (gx, gy) => spec.floor(gx, gy, b) },
      { x0, x1: x0 + W, y0, y1, z0: 0, z1: h, L: false, R: wallInner(y0), T: flat(C.paint, .55) },
      { x0, x1, y0, y1: y0 + W, z0: 0, z1: h, L: wallInner(x0), R: false, T: flat(C.paint, .55) },
    ];
    const screens = [];
    for (const [a, c, e, f, z0, z1, col, tag] of spec.furniture) {
      const q = { x0: x0 + a, x1: x0 + c, y0: y0 + e, y1: y0 + f, z0, z1, col };
      if (tag === 'books') q.R = (u, z) => (Math.floor(z) % 5 === 4) ? sh(C.wood, .5) : sh(NEONS[Math.floor(u * 40) % 5], .7);
      boxes.push(q);
      if (tag === 'mx') screens.push({ t: 'xw', x: q.x1, y0: q.y0 + .03, y1: q.y1 - .03, z0: z0 + 1, z1: z1 - 1 });
      if (tag === 'my') screens.push({ t: 'yw', y: q.y1, x0: q.x0 + .03, x1: q.x1 - .03, z0: z0 + 1, z1: z1 - 1 });
    }
    const back = buildBoxes(boxes, { outline: false });
    const screenPx = screens.map(f => {
      const px = []; let u0 = 1e9;
      face(null, f, (u, z, x, y) => { px.push([x, y, u, z]); u0 = Math.min(u0, u); });
      return px.map(([x, y, u, z]) => [x, y, Math.floor((u - u0) * 16), Math.floor(f.z1 - z)]);
    });
    const ext = flat(b.col, .84), extR = flat(b.col, .62), cap = flat(b.col, 1.2);
    const front = buildBoxes([
      { x0, x1, y0: y1 - W, y1, z0: 0, z1: 4, L: ext, R: false, T: cap },
      { x0: x1 - W, x1, y0, y1, z0: 0, z1: 4, L: ext, R: extR, T: cap },
    ], { outline: false });
    let table = null;
    if (spec.table) {
      const [a, c, e, f, z0, z1, col] = spec.table;
      table = { sp: buildBoxes([{ x0: x0 + a, x1: x0 + c, y0: y0 + e, y1: y0 + f, z0, z1, col }]), d: x0 + (a + c) / 2 + y0 + (e + f) / 2 };
    }
    return { back, front, screenPx, table, tint };
  });
}

// ---------------------------------------------------------------- props, trees, lamps
const statics = [];
function addStatic(o) { statics.push(o); return o; }
for (const b of buildings) {
  addStatic({ kind: 'building', b, fp: { x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1 }, make: () => buildingSprite(b) });
}
// seasonal foliage: [light, mid, dark] per tree palette; winter trees are bare
const FOLIAGE = {
  summer: [['#5fae58', '#3f8a4a', '#2f6a3c']],
  autumn: [['#f2a541', '#e07a2e', '#a8481f'], ['#e8664a', '#c8402e', '#8a2a22'], ['#f5d860', '#e8b830', '#a8801f'], ['#a8b04a', '#7a8a3a', '#4f5f2a']],
  spring: [['#5fae58', '#3f8a4a', '#2f6a3c'], ['#5fae58', '#3f8a4a', '#2f6a3c'], ['#ffe0ee', '#ffb7d5', '#d97aa6']],
  winter: null,
};
const LEAFFALL = ['#e07a2e', '#c8402e', '#e8b830', '#a8481f'].map(hex);
function treeSprite(big, seed) {
  const r = mulberry(seed), R = big ? 5.5 : 4, H = big ? 6 : 4;
  const sp = sprite(-8, -(H + 2 * R + 3), 9, 3);
  const pals = FOLIAGE[SEASON];
  if (!pals) {
    // bare winter tree: trunk and forked branches, dusted with snow when it's snowing
    for (let y = -H - R; y < 0; y++) { put(sp, 0, y, sh(C.trunk)); put(sp, 1, y, sh(C.trunk, .75)); }
    for (const [dir, y0, len] of [[-1, -H - 1, R + 1], [1, -H - 3, R], [-1, -H - R + 1, R - 1], [1, -H - R, R - 2]]) {
      for (let k = 1; k <= len; k++) {
        const x = dir < 0 ? -k + 1 : k, y = y0 - Math.floor(k * .8);
        put(sp, x, y, sh(C.trunk, .9));
        if (LT.snow && k % 2) put(sp, x, y - 1, sh(C.snow));
      }
    }
    outline(sp, OUTLINE);
    return finish(sp);
  }
  const pal = pals[Math.floor(r() * pals.length)].map(hex), autumn = SEASON === 'autumn';
  for (let y = -H; y < 0; y++) { put(sp, 0, y, sh(C.trunk)); put(sp, 1, y, sh(C.trunk, .75)); }
  const cy = -H - R + 1;
  for (let y = Math.floor(cy - R - 1); y <= cy + R + 1; y++) for (let x = -7; x <= 8; x++) {
    const dx = x - .5, dy = (y - cy) * 1.1, dd = Math.hypot(dx, dy);
    if (dd > R + (r() < .3 ? .6 : 0)) continue;
    if (autumn && dd > R * .55 && r() < .1) continue;   // thinning canopy
    const s = dx + dy;
    put(sp, x, y, sh(s < -R * .5 ? (LT.snow ? C.snow : pal[0]) : s > R * .55 ? pal[2] : (r() < .15 ? pal[0] : pal[1])));
  }
  outline(sp, OUTLINE);
  if (autumn) for (let i = 0; i < 7; i++) put(sp, Math.round((r() - .5) * 12), Math.round(r() * 2), sh(LEAFFALL[Math.floor(r() * LEAFFALL.length)]));
  return finish(sp);
}
function addTree(x, y, big) {
  const seed = Math.round(x * 100 + y * 7);
  addStatic({ kind: 'tree', x, y, fp: { x0: x - .12, x1: x + .12, y0: y - .12, y1: y + .12 }, make: () => treeSprite(big, seed), rel: true });
}
[[4.6, 16.6, 1], [5.4, 19.4, 1], [8.4, 16.7, 0], [8.4, 19.3, 1], [4.6, 18.9, 0], [7.9, 17.6, 1], [5.2, 17.5, 0],
 [17.35, 14.35, 1], [18.65, 13.55, 0], [11.3, 8.55, 0], [13.7, 8.55, 0], [11.3, 14.55, 0], [13.7, 14.55, 0]]
  .forEach(([x, y, b]) => addTree(x, y, b));
[[17.3, 7.35, 1], [20.7, 7.35, 1], [17.3, 8.65, 0], [20.7, 8.65, 0]].forEach(([x, y, b]) => addTree(x, y, b));
for (const [k, z] of zones) if (z === 'plaza' && !reserved.has(k)) { const [x, y] = k.split(',').map(Number); addTree(x + .5, y + .5, rng() < .5); }

// tunnel portals: north-south roads dive under the river
const RAMP_Y = 18.3, TUNNEL_Y = 19.05;
const HAZARD = [hex('#f2c94c'), hex('#1a1a22')], CONCRETE = hex('#9a9eb0');
for (const R of ROADS) {
  const top = (gx, gy) => {
    const fx = gx - R, d = gy - TUNNEL_Y;
    if (d < .28 && fx > .1 && fx < .9) return d < .04 ? sh(CONCRETE, .5) : [14, 16, 24];
    if (d < .38) return sh(HAZARD[Math.floor((gx + gy) * 10) % 2]);
    return sh(hash(gx * 16 | 0, gy * 16 | 0, 9) < .5 ? C.grass : C.grass2);
  };
  const front = (gx, z) => z > 8 ? sh(CONCRETE, 1.05) : sh(CONCRETE, Math.floor(z) % 3 === 0 ? .74 : .84);
  const parts = [{ x0: R - .02, x1: R + 1.02, y0: TUNNEL_Y, y1: WATER, z0: 0, z1: 10, col: CONCRETE, T: top, L: front }];
  addStatic({ kind: 'portal', x: 0, y: 0, z0: 1, fp: { x0: R - .02, x1: R + 1.02, y0: TUNNEL_Y, y1: WATER }, make: () => buildBoxes(parts, { rel: true }), rel: true });
  for (const [w0, w1] of [[R - .02, R + .08], [R + .92, R + 1.02]]) {
    const wall = [{ x0: w0, x1: w1, y0: RAMP_Y, y1: TUNNEL_Y, z0: 0, z1: 3, col: CONCRETE }];
    addStatic({ kind: 'portal', x: 0, y: 0, fp: { x0: w0, x1: w1, y0: RAMP_Y, y1: TUNNEL_Y }, make: () => buildBoxes(wall, { rel: true }), rel: true });
  }
}

// elevated monorail over road 3
const RAIL_Y = 3.5, RAIL_Z = 44;
for (let gx = 0; gx < N; gx++) {
  const seg = [{ x0: gx, x1: gx + 1, y0: RAIL_Y - .12, y1: RAIL_Y + .12, z0: RAIL_Z, z1: RAIL_Z + 4, col: C.railc }];
  addStatic({ kind: 'rail', x: 0, y: 0, z0: RAIL_Z, fp: { x0: gx, x1: gx + 1, y0: RAIL_Y - .12, y1: RAIL_Y + .12 }, make: () => buildBoxes(seg, { rel: true, outline: false }), rel: true });
  if (gx % 2 === 1 && !ROADS.includes(gx)) {
    const pil = [{ x0: gx + .45, x1: gx + .55, y0: RAIL_Y - .05, y1: RAIL_Y + .05, z0: 0, z1: RAIL_Z, col: C.railc }];
    addStatic({ kind: 'pillar', x: 0, y: 0, fp: { x0: gx + .45, x1: gx + .55, y0: RAIL_Y - .05, y1: RAIL_Y + .05 }, make: () => buildBoxes(pil, { rel: true }), rel: true });
  }
}
const lamps = [];
const SPANS_X = [[0, 3], [4, 9], [10, 15], [16, 22]], SPANS_Y = [[0, 3], [4, 9], [10, 15], [16, 20]];
for (const R of ROADS) {
  for (const [a, b] of SPANS_X) lamps.push([(a + b) / 2, R + .97]);
  for (const [a, b] of SPANS_Y) lamps.push([R + .97, (a + b) / 2]);
}
function lampSprite() {
  const sp = sprite(-2, -16, 4, 1);
  for (let y = -13; y < 0; y++) put(sp, 0, y, sh(C.metal, .7));
  put(sp, 1, -13, sh(C.metal, .7));
  const on = LT.night > .3;
  put(sp, 1, -12, on ? [255, 236, 180] : sh(C.white, .8)); put(sp, 2, -12, on ? [255, 220, 150] : sh(C.white, .7));
  return finish(sp);
}
for (const [x, y] of lamps) addStatic({ kind: 'lamp', x, y, fp: { x0: x - .04, x1: x + .04, y0: y - .04, y1: y + .04 }, make: lampSprite, rel: true });

function relBox(list) { return () => buildBoxes(list, { rel: true }); }
const BENCH = (x, y) => [
  { x0: x - .3, x1: x + .3, y0: y - .08, y1: y + .08, z0: 2, z1: 3, col: C.woodL },
  { x0: x - .3, x1: x + .3, y0: y - .08, y1: y - .04, z0: 3, z1: 6, col: C.woodL },
];
const benches = { library: [12.5, 8.42], park: [6.5, 16.34] };
for (const [x, y] of Object.values(benches)) addStatic({ kind: 'prop', x: 0, y: 0, fp: { x0: x - .3, x1: x + .3, y0: y - .08, y1: y + .08 }, make: relBox(BENCH(x, y)), rel: true });
const cafeTables = [[5.5, 14.55], [6.45, 14.55]];
for (const [x, y] of cafeTables) addStatic({ kind: 'prop', x: 0, y: 0, fp: { x0: x - .13, x1: x + .13, y0: y - .1, y1: y + .1 },
  make: relBox([{ x0: x - .04, x1: x + .04, y0: y - .04, y1: y + .04, z0: 0, z1: 3, col: C.dark }, { x0: x - .13, x1: x + .13, y0: y - .1, y1: y + .1, z0: 3, z1: 4, col: C.white }]), rel: true });

// ---------------------------------------------------------------- people
const POSES = {
  standF: ['.hhh.', '.sss.', '.sss.', 'ccccc', 'ccccc', 'scccs', '.ppp.', '.p.p.', '.p.p.', '.d.d.'],
  walkF1: ['.hhh.', '.sss.', '.sss.', 'ccccc', 'ccccc', 'scccs', '.ppp.', '.p.p.', 'p...p', 'd...d'],
  walkF2: ['.hhh.', '.sss.', '.sss.', 'ccccc', 'ccccc', '.cccs', '.ppp.', '..pp.', '..p..', '..d..'],
  walkB1: ['.hhh.', '.hhh.', '.hhh.', 'ccccc', 'ccccc', 'scccs', '.ppp.', '.p.p.', 'p...p', 'd...d'],
  walkB2: ['.hhh.', '.hhh.', '.hhh.', 'ccccc', 'ccccc', 'scccs', '.ppp.', '.pp..', '..p..', '..d..'],
  sitF: ['.hhh.', '.sss.', '.sss.', 'ccccc', 'ccccc', 'scccs', 'ppppp', 'p...p', 'd...d'],
  sitB: ['.hhh.', '.hhh.', '.hhh.', 'ccccc', 'ccccc', 'ccccc', '.ppp.'],
};
const mkPal = (id, h, s, c, p, d) => ({ id, h: hex(h), s: hex(s), c: hex(c), p: hex(p), d: hex(d) });
// Tune the avatar here.
const AVATAR = mkPal('me', '#2a1d18', '#c68a62', '#b6ff2e', '#2b3150', '#e8ecf4');
AVATAR.pep = hex('#a9aab3'); // peppered gray
const CW1 = mkPal('cw1', '#6b4a2b', '#f1c7a5', '#41e8ff', '#3d3d4f', '#1a1a1a');
const CW2 = mkPal('cw2', '#1a1a1a', '#8a5a3b', '#ff3d81', '#2f4f6f', '#e8ecf4');
const SHIRTS = ['#ff3d81', '#41e8ff', '#ffb02e', '#e8ecf4', '#9a7fc0', '#5f9ec4', '#d9534f', '#6fb39a', '#f2d16b', '#c08a6a'];
const PANTS = ['#2b3150', '#3d3d4f', '#4a3b2a', '#2f4f6f', '#24302c'], SKINS = ['#f1c7a5', '#d9a37c', '#b07a52', '#8a5a3b', '#5e3b26'], HAIRS = ['#2a1d18', '#1a1a1a', '#6b4a2b', '#c9a15b', '#8f8f9a', '#a33b2b'];
const PALS = Array.from({ length: 14 }, (_, i) => mkPal('p' + i, pick(HAIRS, rng), pick(SKINS, rng), pick(SHIRTS, rng), pick(PANTS, rng), '#1a1a1a'));
const ROBOT = mkPal('robot', '#c9cfdb', '#9aa3b5', '#e8ecf4', '#6b7286', '#41e8ff');
let pcache = new Map();
function personSprite(pal, pose, tint) {
  const k = pal.id + pose + tint.join();
  let s = pcache.get(k); if (s) return s;
  const rows = POSES[pose], h = rows.length, sp = sprite(-2, -h, 3, 0);
  for (let r = 0; r < h; r++) for (let c = 0; c < 5; c++) {
    const ch = rows[r][c]; if (ch === '.') continue;
    const col = ch === 'h' && pal.pep && (r + c) % 2 === 0 ? pal.pep : pal[ch]; put(sp, c - 2, r - h, [col[0] * tint[0], col[1] * tint[1], col[2] * tint[2]]);
  }
  s = finish(sp); pcache.set(k, s); return s;
}
function drawPerson(ctx, pal, pose, x, y, tint, z = 0) {
  const s = personSprite(pal, pose, tint || OUT_TINT), p = iso(x, y, z);
  ctx.drawImage(s.cv, Math.round(p[0] + s.x), Math.round(p[1] + s.y));
}

// ---------------------------------------------------------------- traffic
const agents = [];
const XR = [[3, 9], [9, 15], [3, 15]];
for (let i = 0; i < 28; i++) {
  const xr = pick(XR, rng), yr = pick(XR, rng);
  agents.push({ kind: 'ped', path: { loop: [xr[0] + .92, yr[0] + .92, xr[1] + .08, yr[1] + .08] }, dir: rng() < .5 ? 1 : -1, speed: .4 + rng() * .25, phase: rng() * 200, pal: rng() < .2 ? ROBOT : pick(PALS, rng), gate: rng() });
}
for (let i = 0; i < 20; i++) {
  const R = pick(ROADS, rng), axis = rng() < .5 ? 'x' : 'y';
  agents.push({ kind: 'ped', path: { line: axis, c: R + (rng() < .5 ? .08 : .92), a: .4, b: axis === 'x' ? N - .4 : RAMP_Y - .2 }, dir: rng() < .5 ? 1 : -1, speed: .4 + rng() * .25, phase: rng() * 200, pal: rng() < .2 ? ROBOT : pick(PALS, rng), gate: rng() });
}
const CARCOLS = ['#e8ecf4', '#ff3d81', '#41e8ff', '#f2c94c', '#5a5f7a', '#b6ff2e', '#d9534f', '#e8ecf4'].map(hex);
for (let i = 0; i < 10; i++) {
  const xr = pick(XR, rng), yr = pick(XR, rng), dir = rng() < .5 ? 1 : -1, o = dir > 0 ? .18 : -.18;
  agents.push({ kind: 'car', path: { loop: [xr[0] + .5 + o, yr[0] + .5 + o, xr[1] + .5 - o, yr[1] + .5 - o] }, dir, speed: 1.35, phase: rng() * 200, col: pick(CARCOLS, rng), gate: rng() });
}
for (let i = 0; i < 7; i++) {
  const R = pick(ROADS, rng), axis = rng() < .5 ? 'x' : 'y', dir = rng() < .5 ? 1 : -1;
  const off = axis === 'x' ? (dir > 0 ? .18 : -.18) : (dir > 0 ? -.18 : .18);
  agents.push({ kind: 'car', path: { line: axis, c: R + .5 + off, a: 0, b: axis === 'x' ? N : TUNNEL_Y + .55, wrap: true, fadeB: axis === 'x' }, dir, speed: 1.35, phase: rng() * 200, col: pick(CARCOLS, rng), gate: rng() });
}
agents.push({ kind: 'boat', path: { line: 'x', c: 21.1, a: 1.2, b: N - 1.2 }, dir: 1, speed: .3, phase: 3, gate: 0 });

function loopPos(r, s) {
  const w = r[2] - r[0], h = r[3] - r[1], P = 2 * (w + h);
  s = ((s % P) + P) % P;
  if (s < w) return [r[0] + s, r[1], 1, 0];
  s -= w; if (s < h) return [r[2], r[1] + s, 0, 1];
  s -= h; if (s < w) return [r[2] - s, r[3], -1, 0];
  s -= w; return [r[0], r[3] - s, 0, -1];
}
function evalAgent(a, t) {
  const s = a.phase + t * a.speed * a.dir;
  if (a.path.loop) { const [x, y, dx, dy] = loopPos(a.path.loop, s); return { x, y, dx: dx * a.dir, dy: dy * a.dir, dist: Math.abs(s), fade: 1 }; }
  const { line, c, a: A, b: B, wrap } = a.path, L = B - A;
  let u, d;
  if (wrap) { u = ((s % L) + L) % L; d = a.dir; }
  else { const m = ((s % (2 * L)) + 2 * L) % (2 * L); u = m < L ? m : 2 * L - m; d = a.dir * (m < L ? 1 : -1); }
  const fade = wrap ? clamp(Math.min(u, a.path.fadeB === false ? Infinity : L - u) / .6, 0, 1) : 1;
  return line === 'x' ? { x: A + u, y: c, dx: d, dy: 0, dist: Math.abs(s), fade } : { x: c, y: A + u, dx: 0, dy: d, dist: Math.abs(s), fade };
}
let vcache = new Map();
function vehicleSprite(kind, axis, col) {
  const k = kind + axis + col.join();
  let s = vcache.get(k); if (s) return s;
  let boxes;
  if (kind === 'boat') boxes = [{ x0: -.55, x1: .55, y0: -.2, y1: .2, z0: -2, z1: 2, col: C.white }, { x0: -.2, x1: .25, y0: -.13, y1: .13, z0: 2, z1: 7, col: hex('#d9534f') }];
  else {
    const [lx, ly] = axis === 'x' ? [.28, .13] : [.13, .28], [cx, cy] = axis === 'x' ? [.13, .11] : [.11, .13];
    boxes = [{ x0: -lx, x1: lx, y0: -ly, y1: ly, z0: 1, z1: 5, col }, { x0: -cx, x1: cx, y0: -cy, y1: cy, z0: 5, z1: 8, col: C.glass, T: flat(col, 1.1) }];
  }
  s = buildBoxes(boxes, { rel: true }); vcache.set(k, s); return s;
}

// ---------------------------------------------------------------- Curtis's day
const LOCS = {
  home: { door: [18.0, 12.98], cut: 'home' },
  office: { door: [12.5, 13.98], cut: 'office' },
  cafe: { spot: [5.5, 14.32] },
  library: { spot: [12.5, 8.56] },
  park: { spot: [6.5, 16.48] },
};
const WEEKDAY = [[0, 'home', 'sleep'], [7, 'cafe', 'coffee'], [8.5, 'office', 'code'], [12, 'park', 'lunch'], [13, 'office', 'meet'], [14.5, 'office', 'code'], [18, 'library', 'read'], [19.5, 'home', 'tinker'], [23, 'home', 'sleep']];
const WEEKEND = [[0, 'home', 'sleep'], [9, 'cafe', 'coffee'], [10.5, 'library', 'read'], [13, 'park', 'hang'], [16.5, 'home', 'tinker'], [23.5, 'home', 'sleep']];
const ACT = {
  sleep: 'asleep, dreaming of electric sheep', coffee: 'getting coffee at the coffee shop', code: 'programming at the office', meet: 'in a meeting',
  lunch: 'eating lunch in the park', read: 'reading at the library', tinker: 'tinkering on side projects at home', hang: 'hanging out in the park',
};
const WALK = .45; // tiles per sim-second
function nearestRoad(p) {
  const tx = Math.floor(p[0]), ty = Math.floor(p[1]);
  for (let k = 1; k < 5; k++) for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if (isRoad(tx + dx * k, ty + dy * k)) return [tx + dx * k, ty + dy * k];
  return [tx, ty];
}
const pathCache = new Map();
function pathBetween(a, b) {
  const k = a + '>' + b; if (pathCache.has(k)) return pathCache.get(k);
  const A = LOCS[a].door || LOCS[a].spot, B = LOCS[b].door || LOCS[b].spot;
  const s = nearestRoad(A), g = nearestRoad(B), prev = new Map([[K(...s), null]]), q = [s];
  while (q.length) {
    const c = q.shift(); if (c[0] === g[0] && c[1] === g[1]) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = [c[0] + dx, c[1] + dy];
      if (isRoad(n[0], n[1]) && !prev.has(K(...n))) { prev.set(K(...n), c); q.push(n); }
    }
  }
  const tiles = []; for (let c = g; c; c = prev.get(K(...c))) tiles.unshift(c);
  const pts = [A, ...tiles.map(([x, y]) => [x + .08, y + .08]), B];
  const segs = []; let len = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(l); len += l; }
  const path = { pts, segs, len };
  pathCache.set(k, path); return path;
}
function along(path, d) {
  for (let i = 0; i < path.segs.length; i++) {
    if (d <= path.segs[i] || i === path.segs.length - 1) {
      const t = path.segs[i] ? clamp(d / path.segs[i], 0, 1) : 1, p = path.pts[i], q = path.pts[i + 1];
      return { x: lerp(p[0], q[0], t), y: lerp(p[1], q[1], t), dx: Math.sign(q[0] - p[0]), dy: Math.sign(q[1] - p[1]) };
    }
    d -= path.segs[i];
  }
}
const OUTDOOR = { park: 1, library: 1 };
function shelter(day, seg) {
  const w = weatherAt(day, seg[0] * 3600 + 60);
  return OUTDOOR[seg[1]] && WET[w.kind] ? ['cafe', w.kind] : [seg[1], null];
}
function avatarState(day, t) {
  const sched = (day === 0 || day === 6) ? WEEKEND : WEEKDAY, h = t / 3600;
  let i = 0; for (let j = 0; j < sched.length; j++) if (sched[j][0] <= h) i = j;
  const seg = sched[i], prev = sched[(i - 1 + sched.length) % sched.length];
  const e = shelter(day, seg), pe = shelter(day, prev);
  const st = { loc: e[0], act: seg[2], shelter: e[1], walking: false, weekend: sched === WEEKEND };
  if (pe[0] !== e[0]) {
    const path = pathBetween(pe[0], e[0]), since = t - seg[0] * 3600, dist = since * WALK;
    if (dist < path.len) { Object.assign(st, along(path, dist), { walking: true, from: prev[1], dist }); return st; }
  }
  const L = LOCS[st.loc];
  if (L.spot) { st.x = L.spot[0]; st.y = L.spot[1]; }
  return st;
}

// ---------------------------------------------------------------- ground
function zoneAt(tx, ty) { return zones.get(K(tx, ty)); }
function roadPx(a, c, cross) {
  if (c < .16 || c > .84) return sh((c < .03 || c > .97) ? C.curb : LT.snow ? C.snow2 : C.side, Math.floor(a * 8) % 2 ? 1 : .94);
  if (c < .19 || c > .81) return sh(C.curb, .8);
  if (cross) return Math.floor(c * 10) % 2 ? sh(C.zebra, .95) : sh(C.asphalt);
  if (Math.abs(c - .5) < .035 && (a * 4) % 1 < .5) return sh(C.line);
  return sh(C.asphalt);
}
function grassPx(n, n2) {
  if (LT.snow) return sh(n < .5 ? C.snow : C.snow2);
  if (SEASON === 'winter') return sh(n < .5 ? C.grassW : C.grassW2);
  if (SEASON === 'autumn' && n < .07) return sh(LEAFFALL[Math.floor(n2 * LEAFFALL.length)]);
  if (n < (SEASON === 'spring' ? .03 : .012)) return n < (SEASON === 'spring' ? .018 : .006) ? [255, 120, 170] : [255, 220, 90];
  return sh(n < .5 ? C.grass : SEASON === 'autumn' ? C.grassA : C.grass2);
}
function groundFn(gx, gy) {
  const tx = Math.floor(gx), ty = Math.floor(gy), fx = gx - tx, fy = gy - ty;
  if (gy >= WATER) {
    if (gy < WATER + .1) return sh(C.quay, 1.05);
    if (ROADS.includes(tx)) {
      const d = Math.abs(fx - .5);
      if (d < .36) return sh(d > .31 ? C.water2 : C.water, d > .31 ? .9 : .78);
    }
    return sh(hash(Math.floor(gx * 5), Math.floor(gy * 9)) < .1 ? C.water2 : C.water);
  }
  const rx = ROADS.includes(tx), ry = ROADS.includes(ty);
  if (rx && ry) return sh(C.asphalt, .96);
  if (ry) return roadPx(fx, fy, (ROADS.includes(tx - 1) && fx < .3) || (ROADS.includes(tx + 1) && fx > .7));
  if (rx && gy >= RAMP_Y) {
    if (fx < .1 || fx > .9) return sh(C.curb, fx < .05 || fx > .95 ? 1.05 : .8);
    const c = roadPx(fy, fx, false), k = lerp(1, .35, clamp((gy - RAMP_Y) / (TUNNEL_Y - RAMP_Y), 0, 1));
    return [c[0] * k, c[1] * k, c[2] * k];
  }
  if (rx) return roadPx(fy, fx, (ROADS.includes(ty - 1) && fy < .3) || (ROADS.includes(ty + 1) && fy > .7));
  const z = zoneAt(tx, ty);
  if (z === 'quad') {
    if (Math.abs(gx - 19) < .1 || Math.abs(gy - 8) < .1) return sh(LT.snow ? C.snow2 : C.path);
    const n = hash(gx * 16 | 0, gy * 16 | 0, 7);
    return grassPx(n, hash(gx * 16 | 0, gy * 16 | 0, 8));
  }
  if (z === 'park' || z === 'garden') {
    if (z === 'park') {
      const pd = Math.hypot(gx - 6.6, (gy - 18.3) * 1.2);
      if (pd < .62) return sh(hash(gx * 16 | 0, gy * 16 | 0) < .1 ? C.water2 : C.water);
      if (pd < .72) return sh(C.quay);
      if (Math.abs(gx - 6.5) < .1 || Math.abs(gy - 17.2) < .1) return sh(C.path);
    } else if (Math.abs(gx - 18) < .12 && gy < 14.9) return sh(C.path, (Math.floor(gy * 6) % 2) ? 1 : .9);
    const n = hash(gx * 16 | 0, gy * 16 | 0, 7);
    return grassPx(n, hash(gx * 16 | 0, gy * 16 | 0, 8));
  }
  if (z === 'plaza') return sh(LT.snow ? C.snow : C.plaza, ((Math.floor(gx * 4) + Math.floor(gy * 4)) & 1) ? 1 : .92);
  if (fx < .05 || fy < .05) return sh(LT.snow ? C.snow2 : C.seam);
  return sh(LT.snow ? C.snow : C.lot);
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function buildGround() {
  const sp = sprite(0, 0, WW, WH);
  face(sp, { t: 'top', z: 0, x0: 0, x1: N, y0: 0, y1: N }, groundFn);
  const band = (z) => sh(Math.floor(-z) % 5 === 0 ? C.earth2 : C.earth, .9);
  face(sp, { t: 'yw', y: N, x0: 0, x1: N, z0: -BASE, z1: 0 }, (gx, z) => z > -5 ? sh(C.water, .62) : band(z));
  face(sp, { t: 'xw', x: N, y0: 0, y1: N, z0: -BASE, z1: 0 }, (gy, z) => gy >= WATER ? (z > -5 ? sh(C.water, .5) : band(z)) : z > -2 ? sh(C.curb, .7) : band(z));
  if (LT.night > .25) {
    for (const [lx, ly] of lamps) {
      const [cx, cy] = iso(lx, ly);
      for (let dy = -9; dy <= 9; dy++) for (let dx = -18; dx <= 18; dx++) {
        const d = Math.hypot(dx / 18, dy / 9); if (d >= 1) continue;
        const px = Math.round(cx + dx), py = Math.round(cy + dy), i = (py * WW + px) * 4;
        if (px < 0 || py < 0 || px >= WW || py >= WH || sp.d[i + 3] === 0) continue;
        if (BAYER[(px & 3) + (py & 3) * 4] / 16 < (1 - d) * LT.night * .95) put(sp, px, py, [255, 214, 140], 105);
      }
    }
  }
  return finish(sp);
}

// ---------------------------------------------------------------- state & rebuild
const SEASON = (() => { const m = +new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', month: 'numeric' }).format(new Date()) - 1; return m === 11 || m < 2 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn'; })();
const WTABLE = {
  winter: [['clear', 3], ['clouds', 3], ['snow', 3], ['fog', 1.2], ['rain', .8]],
  spring: [['clear', 3.5], ['clouds', 2.5], ['rain', 2.2], ['storm', .7], ['fog', .6], ['wind', 1]],
  summer: [['clear', 5], ['clouds', 2], ['rain', 1], ['storm', 1.2], ['fog', .3]],
  autumn: [['clear', 3], ['clouds', 2.5], ['rain', 2], ['storm', .5], ['fog', 1.2], ['wind', 1.8]],
};
const WEEK = Math.floor(Date.now() / 604800000);
const WLABEL = { clear: 'clear', clouds: 'cloudy', rain: 'rain', storm: 'thunderstorm', snow: 'snow', fog: 'fog', wind: SEASON === 'spring' ? 'breezy, petals drifting' : 'windy, leaves falling' };
function weatherKind(day, block) {
  const tbl = WTABLE[SEASON], total = tbl.reduce((a, w) => a + w[1], 0);
  let r = hash(WEEK, day, block, 77) * total;
  for (const [kind, w] of tbl) { if ((r -= w) < 0) return kind; }
  return 'clear';
}
function weatherAt(day, t) {
  if (S.weather !== 'auto') return { kind: S.weather, k: 1 };
  const B = 10800, block = Math.floor(t / B), kind = weatherKind(day, block);
  const prev = block > 0 ? weatherKind(day, block - 1) : weatherKind((day + 6) % 7, 7);
  const next = block < 7 ? weatherKind(day, block + 1) : weatherKind((day + 1) % 7, 0);
  let k = 1;
  if (prev !== kind) k = Math.min(k, (t - block * B) / 1200);
  if (next !== kind) k = Math.min(k, ((block + 1) * B - t) / 1200);
  return { kind, k: clamp(k, 0, 1) };
}
const WET = { rain: 1, storm: 1, snow: 1 };
let WX = { kind: 'clear', k: 0 };
const S = { weather: 'auto', live: true, speed: 1, day: new Date().getDay(), t: 0, route: 'posts' };
let OUT_TINT = [1, 1, 1], ground = null, lightKey = '', interiors = {}, glowsStatic = [];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cutState = { office: 0, home: 0 };

function flagsFor(av, h) {
  const weekday = S.day > 0 && S.day < 6;
  return {
    office: weekday && h >= 7.5 && h < 19.5,
    home: av.loc === 'home' && av.act !== 'sleep' && !av.walking,
    library: h >= 8 && h < 21,
    cafe: h >= 6.5 && h < 21,
    cinema: h >= 12,
  };
}
function rebuild(L, F) {
  LT = L; OUT_TINT = L.tint;
  LMK.office.litP = F.office ? .85 : .04; LMK.office.winCol = F.office ? COOL : null;
  LMK.home.litP = F.home ? .9 : .02; LMK.home.winCol = WARM;
  LMK.library.open = F.library; LMK.library.litP = 0;
  LMK.cinema.open = F.cinema; LMK.cinema.litP = F.cinema ? .6 : .05; LMK.cinema.winCol = WARM;
  LMK.cafe.open = F.cafe; LMK.cafe.litP = F.cafe ? .7 : 0; LMK.cafe.winCol = WARM;
  ground = buildGround();
  for (const s of statics) s.sp = s.make();
  interiors.office = interiorSprites(LMK.office, INTERIOR.office, F.office);
  interiors.home = interiorSprites(LMK.home, INTERIOR.home, F.home);
  pcache = new Map(); vcache = new Map(); ccache = new Map(); trainSp = null;
}
// static glow sources (neon signs, landmark plates, lamps)
for (const b of buildings) {
  if (b.vsign) {
    const at = b.vsign.side === 'L' ? iso(b.x0 + b.vsign.u / 16, b.y1, (b.vsign.z0 + b.vsign.z1) / 2) : iso(b.x1, b.y0 + b.vsign.u / 16, (b.vsign.z0 + b.vsign.z1) / 2);
    glowsStatic.push({ p: at, c: b.vsign.col, r: 16, a: .35 });
  }
  if (b.sign) glowsStatic.push({ p: iso((b.x0 + b.x1) / 2, b.y1, b.h + (b.signZ ?? 9)), c: b.signCol, r: 26, a: .4 });
  if (b.glows) glowsStatic.push(...b.glows);
}
for (const [x, y] of lamps) glowsStatic.push({ p: iso(x, y, 12), c: [255, 214, 140], r: 14, a: .45 });

// ---------------------------------------------------------------- canvas & camera
const cv = document.getElementById('city'), ctx = cv.getContext('2d');
let dpr = 1, VW = 0, VH = 0;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2); VW = innerWidth; VH = innerHeight;
  cv.width = Math.round(VW * dpr); cv.height = Math.round(VH * dpr);
}
resize(); addEventListener('resize', () => { resize(); if (!manual) tween = { from: { ...cam }, t0: performance.now(), dur: 1 }; });
const cam = { x: WW / 2, y: OY + 140, s: 1 };
let tween = null, manual = false;
const mainEl = document.getElementById('main'), hudEl = document.querySelector('.hud'), navEl = document.querySelector('header.site-nav');
// The part of the viewport not covered by the reading column (right of it on desktop, above it on phones).
function visibleRect() {
  const navBottom = navEl.offsetTop + navEl.offsetHeight;
  let r;
  if (VW > 760) {
    const x = mainEl.getBoundingClientRect().right;
    r = { x, y: navBottom, w: VW - x, h: VH - navBottom };
  } else {
    r = { x: 0, y: navBottom, w: VW, h: Math.max(120, VH * .42) };
  }
  r.w = Math.max(r.w, 120); r.h = Math.max(r.h, 120);
  return r;
}
function crisp(s) { const d = s * dpr; return d >= 2.5 ? Math.floor(d) / dpr : s; }
let AV = null;
function avatarFocus() {
  if (!AV) return [WW / 2, WH / 2];
  if (!AV.walking && LOCS[AV.loc].cut) { const b = LMK[LOCS[AV.loc].cut]; return iso((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, b.h * .35); }
  return iso(AV.x, AV.y, 8);
}
function camTarget() {
  const v = visibleRect();
  let p, s;
  if (S.route === 'archive') {
    const b = LMK.library; p = iso((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 18);
    s = crisp(Math.min(v.w * .62 / 110, v.h * .62 / 100));
  } else if (S.route === 'about') {
    p = avatarFocus();
    const inside = AV && !AV.walking && LOCS[AV.loc].cut, b = inside && LMK[LOCS[AV.loc].cut];
    const fw = b ? (b.x1 - b.x0 + b.y1 - b.y0) * 16 + 36 : 70, fh = b ? fw * .5 + b.h + 24 : 60;
    s = crisp(Math.min(v.w * .62 / fw, v.h * .62 / fh));
  } else if (S.route === 'robot') {
    p = iso(12, 2, 55);
    s = crisp(Math.min(v.w * .6 / 90, v.h * .6 / 110));
  } else if (S.route === 'post') {
    const tt = performance.now() / 1000;
    p = [WW / 2 + Math.sin(tt * .03) * 170, OY + 150 + Math.sin(tt * .047) * 70];
    s = crisp(Math.max(1.4, Math.min(v.w / 380, v.h / 280)));
  } else {
    p = [WW / 2, OY + 120];
    s = Math.min(v.w / (WW * .96), v.h / (WH - 40));
  }
  s = Math.max(s, .5);
  return { x: p[0] - (v.x + v.w / 2 - VW / 2) / s, y: p[1] - (v.y + v.h / 2 - VH / 2) / s, s };
}
function updateCam(now) {
  if (manual) return;
  const g = camTarget();
  if (tween) {
    const t = tween.dur ? (now - tween.t0) / tween.dur : 1;
    if (t >= 1) { tween = null; Object.assign(cam, g); return; }
    const e = ease(t), f = tween.from, dist = Math.hypot(g.x - f.x, g.y - f.y);
    const dip = 1 + Math.min(1.3, dist / 200) * Math.sin(Math.PI * e) * .85;
    cam.s = Math.exp(lerp(Math.log(f.s), Math.log(g.s), e)) / dip;
    cam.x = lerp(f.x, g.x, e); cam.y = lerp(f.y, g.y, e);
  } else {
    cam.x += (g.x - cam.x) * .15; cam.y += (g.y - cam.y) * .15; cam.s = g.s;
  }
}

// ---------------------------------------------------------------- frame
const behind = (a, b) => a.x1 <= b.x0 + 1e-6 || a.y1 <= b.y0 + 1e-6;
function depthSort(list) {
  const n = list.length, before = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    const a = list[i], ra = a.rect;
    for (let j = i + 1; j < n; j++) {
      const b = list[j], rb = b.rect;
      if (ra.x >= rb.x + rb.w || rb.x >= ra.x + ra.w || ra.y >= rb.y + rb.h || rb.y >= ra.y + ra.h) continue;
      if (behind(a.fp, b.fp)) before[j].push(i);
      else if (behind(b.fp, a.fp)) before[i].push(j);
      else if ((a.z0 || 0) !== (b.z0 || 0)) { if ((a.z0 || 0) < (b.z0 || 0)) before[j].push(i); else before[i].push(j); }
      else if (a.fp.x0 + a.fp.x1 + a.fp.y0 + a.fp.y1 < b.fp.x0 + b.fp.x1 + b.fp.y0 + b.fp.y1) before[j].push(i);
      else before[i].push(j);
    }
  }
  const out = [], seen = new Uint8Array(n);
  const visit = i => { if (seen[i]) return; seen[i] = 1; for (const j of before[i]) visit(j); out.push(list[i]); };
  for (let i = 0; i < n; i++) visit(i);
  return out;
}
function pedDensity(h) { return h < 5 ? .1 : h < 7 ? .35 : h < 9 ? .8 : h < 19 ? 1 : h < 22 ? .65 : .25; }
function carDensity(h) { return h < 5 ? .3 : h < 7 ? .6 : h < 22 ? 1 : .5; }
function pxText(ctx, s, x, y, c, sc = 1) {
  ctx.fillStyle = c;
  for (let i = 0; i < s.length; i++) { const g = FONT[s[i]]; if (!g) continue; for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) if (g[r][k] === '1') ctx.fillRect(x + (i * 4 + k) * sc, y + r * sc, sc, sc); }
}
function steam(ctx, x, y, anim, n = 3) {
  for (let k = 0; k < n; k++) {
    const ph = reduced ? .3 : fr(anim * .55 + k / n);
    ctx.fillStyle = `rgba(238,240,246,${.65 * (1 - ph)})`;
    ctx.fillRect(Math.round(x + Math.sin(ph * 6 + k * 2) * 1.5), Math.round(y - ph * 11), ph > .5 ? 2 : 1, 1);
  }
}
let trainSp = null;
function makeTrain() {
  const stripe = hex('#41e8ff'), side = (u, z, k) => {
    if (z >= 1.5 && z < 2.5) return sh(stripe, k);
    if (z >= 4 && z < 7 && (u * 16) % 3 >= 1) return LT.night > .3 ? WARM : sh(C.glass, k);
    return sh(C.white, k);
  };
  const boxes = [];
  for (let i = 0; i < 3; i++) { const x0 = -.86 + i * .58; boxes.push({ x0, x1: x0 + .54, y0: -.14, y1: .14, z0: 0, z1: 9, col: C.white, L: (gx, z) => side(gx - x0, z, .92), R: (gy, z) => side(gy, z, .68) }); }
  return buildBoxes(boxes, { rel: true });
}
const SHEEP_HOME = [[5.1, 17.0], [7.8, 18.9], [5.0, 18.6], [8.1, 17.3]];
const QUEUE = [[0.62, 15.09], [0.86, 15.11], [1.1, 15.08], [1.34, 15.1], [2.0, 15.09]];
const STUDENTS = [[18.2, 7.6], [18.45, 7.72], [19.8, 8.45]];
function sheepSprite(flip, step) {
  const k = 'sheep' + flip + step; let s = vcache.get(k); if (s) return s;
  const rows = ['.wwwww..', 'wwwwwwwk', 'wwwwwwkk', '.wwwwww.', step ? '.g..g.g.' : '.g.g..g.'];
  const sp = sprite(-5, -6, 5, 1);
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.') return;
    const x = flip ? 3 - c : c - 4;
    put(sp, x, r - 5, ch === 'w' ? sh([240, 242, 250]) : ch === 'k' ? sh([42, 42, 58]) : [182, 255, 46]);
  }));
  outline(sp, OUTLINE);
  s = finish(sp); vcache.set(k, s); return s;
}
function drawDrones(ctx, anim, glows) {
  for (let i = 0; i < 3; i++) {
    const t = reduced ? i * 2 : anim * (.05 + i * .012) + i * 2.1;
    const gx = 11 + Math.cos(t) * (5 + i * 1.5), gy = 10 + Math.sin(t * 1.6 + i) * (4 + i), alt = 92 + i * 9 + (reduced ? 0 : Math.sin(anim * 1.3 + i) * 2);
    const [sx, sy] = iso(gx, gy), [dx, dy] = iso(gx, gy, alt), x = Math.round(dx), y = Math.round(dy);
    ctx.fillStyle = 'rgba(10,14,30,.25)'; ctx.fillRect(Math.round(sx) - 2, Math.round(sy), 5, 1);
    ctx.fillStyle = rgba(sh([141, 147, 168]), 1); ctx.fillRect(x - 3, y, 7, 1);
    ctx.fillStyle = '#2a2f40'; ctx.fillRect(x - 1, y - 1, 3, 2);
    const spin = reduced ? 0 : Math.floor(anim * 20) % 2;
    ctx.fillStyle = 'rgba(220,225,235,.85)'; ctx.fillRect(x - 4 + spin, y - 1, 2, 1); ctx.fillRect(x + 3 - spin, y - 1, 2, 1);
    if (i !== 1) { ctx.fillStyle = '#3a3f50'; ctx.fillRect(x, y + 1, 1, 2); ctx.fillStyle = rgba(sh([176, 132, 86]), 1); ctx.fillRect(x - 1, y + 3, 3, 2); }
    if (reduced || fr(anim * .9 + i * .3) < .25) {
      ctx.fillStyle = '#ff4a5a'; ctx.fillRect(x - 3, y, 1, 1); ctx.fillStyle = '#5aff8a'; ctx.fillRect(x + 3, y, 1, 1);
      glows.push({ p: [x - 3, y], c: [255, 74, 90], r: 5, a: .5 }, { p: [x + 3, y], c: [90, 255, 138], r: 5, a: .5 });
    }
  }
}
const SHEEP = ['..wwww..', '.wwwwwwk', 'wwwwwwkk', '.wwwwww.', '.g.g..g.'];
function drawSheep(ctx, x, y) {
  const col = { w: '#f4f4fa', k: '#2a2a3a', g: '#b6ff2e' };
  SHEEP.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') { ctx.fillStyle = col[ch]; ctx.fillRect(x + c, y + r, 1, 1); } }));
}
const CODECOL = ['#b6ff2e', '#41e8ff', '#ff3d81', '#e8ecf4', '#ffb02e'];
function drawScreens(ctx, inter, t, on) {
  for (const px of inter.screenPx) for (const [x, y, u, v] of px) {
    if (!on) { ctx.fillStyle = '#141824'; ctx.fillRect(x, y, 1, 1); continue; }
    const line = Math.floor(v / 2) + Math.floor(t * 1.6), len = 1 + Math.floor(hash(line, 4) * 6), ind = Math.floor(hash(line, 2) * 3);
    ctx.fillStyle = (v % 2 === 0 && u >= ind && u < ind + len) ? CODECOL[Math.floor(hash(line, 9) * 5)] : '#18213a';
    ctx.fillRect(x, y, 1, 1);
  }
}
function drawInterior(ctx, key, t, glows) {
  const b = LMK[key], inter = interiors[key], spec = INTERIOR[key], at = (u, v) => [b.x0 + u, b.y0 + v];
  ctx.drawImage(inter.back.cv, inter.back.x, inter.back.y);
  const items = [], inside = AV && !AV.walking && AV.loc === key;
  const sitter = (pal, seat) => { const [u, v, pose] = spec.seats[seat], [x, y] = at(u, v); items.push({ d: x + y, f: () => drawPerson(ctx, pal, pose, x, y, inter.tint) }); };
  let speakers = null;
  if (key === 'office') {
    const h = S.t / 3600, weekday = S.day > 0 && S.day < 6, working = weekday && h >= 9 && h < 17.5;
    const meeting = inside && AV.act === 'meet';
    if (meeting) { sitter(AVATAR, 'meetA'); sitter(CW1, 'meetB'); sitter(CW2, 'meetC'); speakers = ['meetA', 'meetB', 'meetC']; }
    else { if (inside) sitter(AVATAR, 'code'); if (working) { sitter(CW1, 'cw1'); sitter(CW2, 'cw2'); } }
    if (inter.table) items.push({ d: inter.table.d, f: () => ctx.drawImage(inter.table.sp.cv, inter.table.sp.x, inter.table.sp.y) });
    items.sort((a, c) => a.d - c.d).forEach(i => i.f());
    drawScreens(ctx, inter, t, working || (inside && AV.act === 'code'));
    if (working) for (const m of inter.screenPx) if (m.length) glows.push({ p: [m[0][0], m[0][1]], c: [120, 220, 255], r: 10, a: .3 });
  } else {
    const sleeping = inside && AV.act === 'sleep', tinkering = inside && AV.act === 'tinker';
    if (tinkering) sitter(AVATAR, 'tinker');
    items.forEach(i => i.f());
    drawScreens(ctx, inter, t, tinkering);
    if (sleeping) {
      const [u, v, z] = spec.head, [hx, hy] = iso(...at(u, v), z);
      ctx.fillStyle = rgba(AVATAR.h.map((c, i) => c * inter.tint[i]), 1); ctx.fillRect(Math.round(hx) - 1, Math.round(hy) - 2, 3, 1);
      ctx.fillStyle = rgba(AVATAR.pep.map((c, i) => c * inter.tint[i]), 1); ctx.fillRect(Math.round(hx), Math.round(hy) - 2, 1, 1);
      ctx.fillStyle = rgba(AVATAR.s.map((c, i) => c * inter.tint[i]), 1); ctx.fillRect(Math.round(hx) - 1, Math.round(hy) - 1, 3, 2);
      for (let k = 0; k < 3; k++) {
        const ph = reduced ? k / 3 : (t * .45 + k / 3) % 1;
        ctx.globalAlpha = 1 - ph; pxText(ctx, 'Z', Math.round(hx + 3 + ph * 8), Math.round(hy - 8 - ph * 16), '#e8ecf4'); ctx.globalAlpha = 1;
      }
      const bob = reduced ? 0 : Math.round(Math.sin(t * 1.4) * 1.5);
      ctx.fillStyle = '#e8ecf4'; ctx.fillRect(Math.round(hx) + 12, Math.round(hy) - 20, 1, 1); ctx.fillRect(Math.round(hx) + 14, Math.round(hy) - 24, 2, 2);
      ctx.fillStyle = 'rgba(232,236,244,.18)'; ctx.fillRect(Math.round(hx) + 15, Math.round(hy) - 40 + bob, 14, 11);
      drawSheep(ctx, Math.round(hx) + 18, Math.round(hy) - 37 + bob);
    }
  }
  ctx.drawImage(inter.front.cv, inter.front.x, inter.front.y);
  if (speakers) {
    const who = speakers[Math.floor(t / 2.2) % 3], [u, v, pose] = spec.seats[who], [sx, sy] = iso(...at(u, v), pose === 'sitF' ? 9 : 7);
    const bx = Math.round(sx) - 3, by = Math.round(sy) - 9;
    ctx.fillStyle = '#e8ecf4'; ctx.fillRect(bx, by, 9, 5); ctx.fillRect(bx + 2, by + 5, 2, 1);
    ctx.fillStyle = '#242838'; for (let k = 0; k < 3; k++) if (Math.floor(t * 3) % 4 > k) ctx.fillRect(bx + 2 + k * 2, by + 2, 1, 1);
  }
}

// ---------------------------------------------------------------- weather
const fr = x => x - Math.floor(x);
const UMBS = ['#ff3d81', '#41e8ff', '#ffb02e', '#e8ecf4', '#c77dff', '#2b3150'].map(hex);
agents.forEach((a, i) => { if (a.kind === 'ped' && hash(i, 31) < .75) a.umb = UMBS[Math.floor(hash(i, 32) * UMBS.length)]; });
function drawUmbrella(ctx, ax, ay, col) {
  const x = Math.round(ax), y = Math.round(ay), c = col.map((v, i) => v * OUT_TINT[i]);
  ctx.fillStyle = rgba(c, 1); ctx.fillRect(x - 1, y - 14, 3, 1); ctx.fillRect(x - 3, y - 13, 7, 1);
  ctx.fillStyle = rgba(c.map(v => v * .6), 1); ctx.fillRect(x - 3, y - 12, 1, 1); ctx.fillRect(x + 3, y - 12, 1, 1);
  ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x, y - 12, 1, 2);
}
function lightning(anim) {
  if (reduced) return null;
  const P = 6.5, cyc = Math.floor(anim / P);
  if (hash(cyc, 61) > .6) return null;
  const dt = anim - cyc * P - hash(cyc, 62) * 4;
  if (dt < 0 || dt >= .45) return null;
  return { cyc, f: dt < .07 ? 1 : dt < .13 ? .25 : dt < .2 ? .85 : Math.max(0, (.45 - dt) / .25) * .4 };
}
const LEAVES = { autumn: ['#e0703a', '#f2b33d', '#c94a3a', '#a8642e'], spring: ['#ffb7d5', '#ffd6e8', '#fff0f5', '#f7a1c4'] };
// clouds float at altitude over their own ground shadow
const CLOUDS = { clear: [4, 'fair', .8], wind: [6, 'fair', .85], clouds: [15, 'grey', .92], rain: [17, 'rain', .94], storm: [19, 'storm', .96], snow: [15, 'grey', .92], fog: [5, 'grey', .6] };
const CLOUDCOL = { fair: '#f4f6fb', grey: '#c6ccd8', rain: '#98a1b3', storm: '#666d82' };
let ccache = new Map();
// voxel clouds: stepped iso boxes on a quarter-tile grid, with a matching pixel shadow
function cloudSprite(kind, v) {
  const key = kind + v; let s = ccache.get(key); if (s) return s;
  const r = mulberry(v * 131 + 7), base = hex(CLOUDCOL[kind]), c = .25;
  const W = 11 + Math.floor(r() * 6), D = 8 + Math.floor(r() * 4), blobs = [];
  for (let i = 0, n = 3 + Math.floor(r() * 3); i < n; i++) blobs.push([lerp(2.5, W - 2.5, r()), lerp(2.2, D - 2.2, r()), 2.4 + r() * 1.8]);
  const cells = [];
  for (let i = 0; i < W; i++) for (let j = 0; j < D; j++) {
    let f = 0;
    for (const [bx, by, br] of blobs) f += Math.max(0, 1 - Math.hypot(i + .5 - bx, j + .5 - by) / br);
    if (f < .32) continue;
    cells.push({ i, j, h: Math.min(22, 6 + Math.round(f * 3) * 4) });
  }
  cells.sort((p, q) => (p.i + p.j) - (q.i + q.j) || p.h - q.h);
  const ox = W * c / 2, oy = D * c / 2, box = q => ({ x0: q.i * c - ox, x1: (q.i + 1) * c - ox, y0: q.j * c - oy, y1: (q.j + 1) * c - oy });
  const cloud = buildBoxes(cells.map(q => ({ ...box(q), z0: 0, z1: q.h, L: flat(base, .86), R: flat(base, .7), T: flat(base, .96 + q.h / 22 * .1) })), { rel: true, outline: false });
  outlineSprite(cloud, sh(base, .55));
  const shadow = buildBoxes(cells.map(q => ({ ...box(q), z0: 0, z1: 0, L: false, R: false, T: () => [10, 14, 30] })), { rel: true, outline: false });
  s = { cloud, shadow }; ccache.set(key, s); return s;
}
// outline a finished sprite in place
function outlineSprite(f, col) {
  const sp = { w: f.w, h: f.h, d: f.d };
  outline(sp, col);
  f.cv.getContext('2d').putImageData(new ImageData(f.d, f.w, f.h), 0, 0);
}
function drawClouds(W, L, anim) {
  const [n, kind, a0] = CLOUDS[W.kind], a = a0 * (W.kind === 'clear' ? 1 : W.k);
  if (a <= .01) return;
  const zoomFade = clamp(1.45 - cam.s * .27, .3, 1), wind = W.kind === 'storm' ? 2.2 : (W.kind === 'rain' || W.kind === 'wind') ? 1.6 : 1;
  const list = [];
  for (let b = 0; b < n; b++) {
    const gx = fr(hash(b, 71) + anim * (.0012 + hash(b, 72) * .001) * wind) * (N + 20) - 10, gy = hash(b, 73) * (N + 6) - 3;
    const [sx, sy] = iso(gx, gy);
    list.push({ spr: cloudSprite(kind, b % 6), gx, gy, sx, sy, alt: 150 + hash(b, 74) * 90 });
  }
  list.sort((p, q) => (p.gx + p.gy) - (q.gx + q.gy));
  if (W.kind !== 'clear' && L.night < .75) {
    ctx.globalAlpha = .2 * a * (1 - L.night);
    for (const c of list) {
      const gi = (Math.round(c.sy) * WW + Math.round(c.sx)) * 4;
      if (c.sx < 0 || c.sx >= WW || c.sy >= WH || !ground.d[gi + 3]) continue;
      const sh = c.spr.shadow; ctx.drawImage(sh.cv, Math.round(c.sx + sh.x), Math.round(c.sy + sh.y));
    }
  }
  ctx.globalAlpha = a * zoomFade;
  for (const c of list) { const cl = c.spr.cloud; ctx.drawImage(cl.cv, Math.round(c.sx + cl.x), Math.round(c.sy - c.alt + cl.y)); }
  ctx.globalAlpha = 1;
}
function drawWeather(W, L, anim) {
  drawClouds(W, L, anim);
  if (W.kind === 'clear' || W.k <= .01) return;
  const vx0 = cam.x - VW / 2 / cam.s, vy0 = cam.y - VH / 2 / cam.s, vw = VW / cam.s, vh = VH / cam.s;
  const area = VW * VH / 1e6, k = W.k, at = (u, v) => [Math.floor(vx0 + u * vw), Math.floor(vy0 + v * vh)];
  if (W.kind === 'rain' || W.kind === 'storm') {
    const storm = W.kind === 'storm', n = Math.round((storm ? 750 : 450) * area * k);
    ctx.fillStyle = storm ? 'rgba(200,215,245,.55)' : 'rgba(190,210,240,.45)';
    for (let i = 0; i < n; i++) {
      const sp = (storm ? 1.3 : 1) * (.9 + hash(i, 5) * .4), [x, y] = at(fr(hash(i, 1) + anim * sp * (storm ? .3 : .18)), fr(hash(i, 2) + anim * sp));
      ctx.fillRect(x, y, 1, 1); ctx.fillRect(x - 1, y - 3, 1, 3);
    }
    ctx.fillStyle = 'rgba(215,228,250,.55)';
    for (let i = 0; i < n / 4; i++) {
      const c = anim * 2.2 + hash(i, 10); if (fr(c) > .22) continue;
      const cyc = Math.floor(c), [x, y] = at(hash(i, cyc, 8), hash(i, cyc, 9));
      if (x < 0 || y < 0 || x >= WW || y >= WH || !ground.d[(y * WW + x) * 4 + 3]) continue;
      ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1);
    }
    const bolt = storm && lightning(anim);
    if (bolt) {
      let x = vx0 + vw * (.2 + .6 * hash(bolt.cyc, 63)), y = vy0;
      const end = vy0 + vh * (.3 + .35 * hash(bolt.cyc, 64));
      ctx.fillStyle = `rgba(244,246,255,${bolt.f})`;
      for (let j = 0; y < end; j++) {
        const nx = x + Math.round((hash(bolt.cyc, j, 65) - .5) * 6), ny = y + 3 + Math.floor(hash(bolt.cyc, j, 66) * 4);
        for (let q = 0; q <= ny - y; q++) ctx.fillRect(Math.round(lerp(x, nx, q / (ny - y))), y + q, 1, 1);
        x = nx; y = ny;
      }
    }
  }
  if (W.kind === 'snow') {
    const n = Math.round(420 * area * k); ctx.fillStyle = 'rgba(240,244,252,.9)';
    for (let i = 0; i < n; i++) {
      const big = hash(i, 6) < .18, [x, y] = at(fr(hash(i, 1) + anim * .015 + Math.sin(anim * 1.1 + i) * .006), fr(hash(i, 2) + anim * (.04 + hash(i, 3) * .05)));
      ctx.fillRect(x, y, big ? 2 : 1, big ? 2 : 1);
    }
  }
  if (W.kind === 'wind') {
    const cols = LEAVES[SEASON === 'spring' ? 'spring' : 'autumn'], n = Math.round(90 * area * k);
    for (let i = 0; i < n; i++) {
      const [x, y] = at(fr(hash(i, 1) + anim * (.07 + hash(i, 3) * .06)), fr(hash(i, 2) + anim * (.035 + hash(i, 4) * .03) + Math.sin(anim * 2 + i) * .01));
      const flip = Math.sin(anim * 5 + i * 1.7) > 0;
      ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(x, y, flip ? 2 : 1, flip ? 1 : 2);
    }
  }
}
function drawScreenWeather(W, L, anim) {
  if (W.k <= .01) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (W.kind === 'fog') {
    const fc = L.sky.map(v => Math.min(255, v * 1.35 + 30));
    for (let b = 0; b < 6; b++) {
      const r = cv.width * (.25 + hash(b, 51) * .2), x = fr(hash(b, 52) + anim * .008 * (1 + hash(b, 53))) * (cv.width + 2 * r) - r, y = cv.height * (.25 + hash(b, 54) * .7);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(fc, .32 * W.k)); g.addColorStop(1, rgba(fc, 0));
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.fillStyle = rgba(fc, .14 * W.k); ctx.fillRect(0, 0, cv.width, cv.height);
  }
  const bolt = W.kind === 'storm' && lightning(anim);
  if (bolt) { ctx.fillStyle = `rgba(220,230,255,${.3 * bolt.f * W.k})`; ctx.fillRect(0, 0, cv.width, cv.height); }
}

// Curtis's clock: Mountain Time (MDT/MST)
const TZ = 'America/Denver';
const tzParts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', weekday: 'short', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' });
const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
let TZNAME = 'MT';
function homeClock() {
  const d = new Date(), p = {};
  for (const x of tzParts.formatToParts(d)) p[x.type] = x.value;
  TZNAME = p.timeZoneName || 'MT';
  return { day: WD[p.weekday], t: (+p.hour % 24) * 3600 + (+p.minute) * 60 + (+p.second) + d.getMilliseconds() / 1000 };
}
let last = performance.now(), lastHud = 0, lastDraw = 0;
const T0 = Date.now() / 1000;
function frame(now) {
  if (now - lastDraw < 32) { requestAnimationFrame(frame); return; }
  lastDraw = now;
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if (S.live) { const c = homeClock(); S.day = c.day; S.t = c.t; }
  else {
    const sp = AV && AV.walking ? Math.min(S.speed, 2) : S.speed;
    S.t += dt * sp; if (S.t >= 86400) { S.t -= 86400; S.day = (S.day + 1) % 7; }
  }
  const h = S.t / 3600;
  WX = weatherAt(S.day, S.t);
  const L = lightAt(h, WX);
  AV = avatarState(S.day, S.t);
  const F = flagsFor(AV, h), key = Math.round(h * 3) + '|' + F.office + F.home + F.library + F.cafe + F.cinema + '|' + Math.round(L.ov * 8) + L.snow;
  if (key !== lightKey) { lightKey = key; rebuild(L, F); }
  LT = L;
  const at = reduced ? T0 : Date.now() / 1000, anim = reduced ? 0 : now / 1000;

  // cutaways open when the camera is visiting Curtis indoors
  for (const k of ['office', 'home']) {
    const want = S.route === 'about' && !manual && AV && !AV.walking && AV.loc === k ? 1 : 0;
    cutState[k] = reduced ? want : cutState[k] + (want - cutState[k]) * Math.min(1, dt * 3.5);
  }
  updateCam(now);

  // draw
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, cv.height);
  g.addColorStop(0, rgba(L.sky.map(v => v * .7), 1)); g.addColorStop(1, rgba(L.sky, 1));
  ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
  if (L.night > .3) for (let i = 0; i < 90; i++) {
    const tw = reduced ? 1 : .5 + .5 * Math.sin(anim * (1 + hash(i, 3) * 2) + i);
    ctx.fillStyle = `rgba(232,236,244,${(L.night - .3) * tw * .9})`;
    ctx.fillRect(Math.floor(hash(i, 1) * cv.width), Math.floor(hash(i, 2) * cv.height * .7), dpr, dpr);
  }
  const sd = cam.s * dpr, tx = Math.round(cv.width / 2 - cam.x * sd), ty = Math.round(cv.height / 2 - cam.y * sd);
  ctx.setTransform(sd, 0, 0, sd, tx, ty);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ground.cv, 0, 0);

  // water shimmer
  ctx.fillStyle = rgba([200, 225, 255], .55);
  for (let i = 0; i < 46; i++) {
    if (((anim * .6 + hash(i, 11)) % 1) > .45) continue;
    const [x, y] = iso(.5 + hash(i, 12) * (N - 1), WATER + .25 + hash(i, 13) * (N - WATER - .4));
    ctx.fillRect(Math.round(x), Math.round(y), 2, 1);
  }

  const view = { x0: cam.x - VW / 2 / cam.s - 40, x1: cam.x + VW / 2 / cam.s + 40, y0: cam.y - VH / 2 / cam.s - 40, y1: cam.y + VH / 2 / cam.s + 160 };
  const vis = r => r.x < view.x1 && r.x + r.w > view.x0 && r.y < view.y1 && r.y + r.h > view.y0;
  const list = [], glows = [];
  for (const s of statics) {
    if (!s.sp) continue;
    if (s.rel) { const p = iso(s.x, s.y); s.ax = Math.round(p[0]); s.ay = Math.round(p[1]); } else { s.ax = 0; s.ay = 0; }
    s.rect = { x: s.ax + s.sp.x, y: s.ay + s.sp.y, w: s.sp.w, h: s.sp.h };
    if (vis(s.rect)) list.push(s);
  }
  const wet = WET[WX.kind] ? WX.k : 0, pd = pedDensity(h) * (1 - .55 * wet), cd = carDensity(h);
  const umbrellas = (WX.kind === 'rain' || WX.kind === 'storm') && WX.k > .3;
  for (const a of agents) {
    if (a.gate > (a.kind === 'ped' ? pd : a.kind === 'car' ? cd : 1)) continue;
    const p = evalAgent(a, at - 1.7e9);
    const [ax, ay] = iso(p.x, p.y);
    let spr, draw;
    if (a.kind === 'ped') {
      const front = p.dx > 0 || p.dy > 0, step = reduced ? 0 : Math.floor(p.dist * 5) % 2;
      const pose = (front ? 'walkF' : 'walkB') + (step + 1);
      spr = personSprite(a.pal, pose, OUT_TINT);
      const umb = umbrellas && a.umb;
      const bot = a.pal === ROBOT && front;
      draw = () => { ctx.drawImage(spr.cv, Math.round(ax + spr.x), Math.round(ay + spr.y)); if (bot) { ctx.fillStyle = '#41e8ff'; ctx.fillRect(Math.round(ax), Math.round(ay) - 9, 1, 1); } if (umb) drawUmbrella(ctx, ax, ay, umb); };
    } else {
      spr = vehicleSprite(a.kind, p.dx !== 0 ? 'x' : 'y', a.col || C.white);
      draw = () => {
        ctx.globalAlpha = p.fade; ctx.drawImage(spr.cv, Math.round(ax + spr.x), Math.round(ay + spr.y)); ctx.globalAlpha = 1;
        if (a.kind === 'car' && L.night > .2) {
          const f = iso(p.x + p.dx * .3, p.y + p.dy * .3, 3), r = iso(p.x - p.dx * .3, p.y - p.dy * .3, 3);
          ctx.fillStyle = '#fff3c4'; ctx.fillRect(Math.round(f[0]), Math.round(f[1]), 1, 1);
          ctx.fillStyle = '#ff4a5a'; ctx.fillRect(Math.round(r[0]), Math.round(r[1]), 1, 1);
          glows.push({ p: iso(p.x + p.dx * .6, p.y + p.dy * .6, 1), c: [255, 236, 190], r: 9, a: .35 * p.fade });
        }
      };
    }
    const e = a.kind === 'ped' ? .05 : a.kind === 'boat' ? .55 : .28, ex = p.dx !== 0 ? e : (a.kind === 'ped' ? .05 : .14), ey = p.dy !== 0 ? e : (a.kind === 'ped' ? .05 : .14);
    const d = { fp: { x0: p.x - ex, x1: p.x + ex, y0: p.y - ey, y1: p.y + ey }, rect: { x: ax + spr.x, y: ay + spr.y, w: spr.w, h: spr.h }, draw };
    if (vis(d.rect)) list.push(d);
  }
  // monorail train
  {
    if (!trainSp) trainSp = makeTrain();
    const ph = reduced ? .3 : fr(anim / 30), tri = ph < .5 ? ph * 2 : 2 - ph * 2, tp = 1 + (N - 2) * tri * tri * (3 - 2 * tri);
    const [rx, ry] = iso(tp, RAIL_Y, RAIL_Z + 4), t = trainSp;
    const d = { z0: RAIL_Z + 4, fp: { x0: tp - .86, x1: tp + .88, y0: RAIL_Y - .14, y1: RAIL_Y + .14 }, rect: { x: rx + t.x, y: ry + t.y, w: t.w, h: t.h }, draw: () => ctx.drawImage(t.cv, Math.round(rx + t.x), Math.round(ry + t.y)) };
    if (vis(d.rect)) list.push(d);
    glows.push({ p: iso(tp + .95, RAIL_Y, RAIL_Z + 8), c: [255, 240, 200], r: 10, a: .5 }, { p: iso(tp - .9, RAIL_Y, RAIL_Z + 8), c: [255, 240, 200], r: 10, a: .5 });
  }
  // electric sheep grazing in the park
  for (const [i, [cx, cy]] of SHEEP_HOME.entries()) {
    const t = reduced ? i : anim * .12 + i * 1.7, x = cx + Math.cos(t) * .35, y = cy + Math.sin(t * 1.3) * .22, dx = -Math.sin(t);
    const step = reduced ? 0 : Math.floor(anim * 3 + i) % 2, spr = sheepSprite(dx < 0, step), [sx, sy] = iso(x, y);
    const d = { fp: { x0: x - .12, x1: x + .12, y0: y - .08, y1: y + .08 }, rect: { x: sx + spr.x, y: sy + spr.y, w: spr.w, h: spr.h },
      draw: () => {
        ctx.drawImage(spr.cv, Math.round(sx + spr.x), Math.round(sy + spr.y));
        if (!reduced && fr(anim * .7 + i * .37) < .06) { ctx.fillStyle = '#b6ff2e'; ctx.fillRect(Math.round(sx) + (i % 2 ? -3 : 2), Math.round(sy) - 8, 1, 2); }
      } };
    if (vis(d.rect)) list.push(d);
    glows.push({ p: [sx, sy - 3], c: [182, 255, 46], r: 8, a: .3 });
  }
  // students on the quad by day
  if (h > 9 && h < 18.5 && !WET[WX.kind]) for (const [i, [x, y]] of STUDENTS.entries()) {
    const spr = personSprite(PALS[i * 3], 'sitF', OUT_TINT), [sx, sy] = iso(x, y);
    list.push({ fp: { x0: x - .05, x1: x + .05, y0: y - .05, y1: y + .05 }, rect: { x: sx + spr.x, y: sy + spr.y, w: spr.w, h: spr.h }, draw: () => ctx.drawImage(spr.cv, Math.round(sx + spr.x), Math.round(sy + spr.y)) });
  }
  // moviegoers queue under the marquee before evening shows (and weekend matinees)
  if ((h >= 18 && h < 22.5) || ((S.day === 0 || S.day === 6) && h >= 13 && h < 22.5)) for (const [i, [x, y]] of QUEUE.entries()) {
    const spr = personSprite(PALS[(i * 5 + 2) % PALS.length], 'standF', OUT_TINT), [sx, sy] = iso(x, y);
    list.push({ fp: { x0: x - .05, x1: x + .05, y0: y - .05, y1: y + .05 }, rect: { x: sx + spr.x, y: sy + spr.y, w: spr.w, h: spr.h }, draw: () => ctx.drawImage(spr.cv, Math.round(sx + spr.x), Math.round(sy + spr.y)) });
  }
  // Curtis, when outdoors
  let marker = null, pulseAt = null;
  if (AV) {
    if (AV.walking || !LOCS[AV.loc].cut) {
      const front = AV.walking ? (AV.dx > 0 || AV.dy > 0) : true;
      const pose = AV.walking ? (front ? 'walkF' : 'walkB') + ((reduced ? 0 : Math.floor(AV.dist * 5) % 2) + 1) : 'sitF';
      const spr = personSprite(AVATAR, pose, OUT_TINT), [ax, ay] = iso(AV.x, AV.y);
      list.push({
        fp: { x0: AV.x - .05, x1: AV.x + .05, y0: AV.y - .05, y1: AV.y + .05 }, rect: { x: ax - 3, y: ay - 12, w: 7, h: 13 }, avatar: true,
        draw: () => {
          ctx.drawImage(spr.cv, Math.round(ax + spr.x), Math.round(ay + spr.y));
          if (umbrellas && AV.walking) drawUmbrella(ctx, ax, ay, AVATAR.c);
          const hx = Math.round(ax), hy = Math.round(ay);
          if (!AV.walking && AV.act === 'read') { ctx.fillStyle = '#eef0f6'; ctx.fillRect(hx - 2, hy - 5, 2, 2); ctx.fillStyle = '#d9534f'; ctx.fillRect(hx, hy - 5, 2, 2); }
          if (!AV.walking && AV.act === 'lunch') { ctx.fillStyle = '#e0b56a'; ctx.fillRect(hx - 1, hy - 5, 3, 1); }
        },
      });
      marker = iso(AV.x, AV.y, 15); pulseAt = iso(AV.x, AV.y);
    } else {
      const b = LMK[LOCS[AV.loc].cut];
      marker = cutState[AV.loc] > .5 ? null : iso((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, b.h + 22);
      pulseAt = iso((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, b.h);
      if (cutState[AV.loc] > .5) {
        const sp = AV.act === 'sleep' ? [b.x0 + .25, b.y0 + .57] : AV.act === 'meet' ? [b.x0 + 1.3, b.y0 + 1.9] : AV.act === 'tinker' ? [b.x0 + 1.35, b.y0 + .8] : [b.x0 + .8, b.y0 + .58];
        marker = iso(...sp, AV.act === 'sleep' ? 12 : 14); pulseAt = iso(...sp, AV.act === 'sleep' ? 5 : 0);
      }
    }
  }
  const sorted = depthSort(list);
  for (const d of sorted) {
    if (d.kind === 'building' && d.b.cut && cutState[d.b.cut] > .01) {
      drawInterior(ctx, d.b.cut, anim, glows);
      const a = 1 - cutState[d.b.cut];
      if (a > .01) { ctx.globalAlpha = a; ctx.drawImage(d.sp.cv, d.sp.x, d.sp.y); ctx.globalAlpha = 1; }
    } else if (d.sp) { ctx.drawImage(d.sp.cv, d.ax + d.sp.x, d.ay + d.sp.y); if (d.b && d.b.dyn) d.b.dyn(ctx, anim, glows); }
    else d.draw();
  }
  drawDrones(ctx, anim, glows);
  // cafe cup + steam, park pigeons
  if (AV && !AV.walking && AV.act === 'coffee') {
    const [cx, cy] = iso(5.5, 14.55, 4);
    ctx.fillStyle = '#eef0f6'; ctx.fillRect(Math.round(cx), Math.round(cy) - 2, 2, 2);
    for (let k = 0; k < 3; k++) { const ph = reduced ? .3 : (anim * .7 + k / 3) % 1; ctx.fillStyle = `rgba(238,240,246,${.7 * (1 - ph)})`; ctx.fillRect(Math.round(cx + Math.sin(ph * 6 + k) * 1.2), Math.round(cy - 4 - ph * 7), 1, 1); }
  }
  if (h > 7 && h < 19) for (let k = 0; k < 3; k++) {
    const hop = reduced ? 0 : (Math.sin(anim * 3 + k * 2) > .85 ? 1 : 0), [px, py] = iso(6.95 + k * .17, 16.75 + (k % 2) * .12);
    ctx.fillStyle = rgba(sh([140, 140, 160]), 1); ctx.fillRect(Math.round(px), Math.round(py) - 2 - hop, 2, 2);
    ctx.fillStyle = rgba(sh([90, 110, 120]), 1); ctx.fillRect(Math.round(px) + (k % 2 ? -1 : 2), Math.round(py) - 3 - hop, 1, 1);
  }
  // blinkers
  for (const bl of blinkers) {
    const on = reduced || ((anim * .55 + bl.ph) % 1) < .35;
    if (!on) continue;
    ctx.fillStyle = '#ff4a5a'; ctx.fillRect(Math.round(bl.p[0]), Math.round(bl.p[1]), 1, 1);
    glows.push({ p: bl.p, c: [255, 74, 90], r: 7, a: .5 });
  }
  // night glow pass
  if (L.night > .05) {
    ctx.globalCompositeOperation = 'lighter';
    for (const gl of glowsStatic.concat(glows)) {
      const [x, y] = gl.p; if (x < view.x0 || x > view.x1 || y < view.y0 || y > view.y1) continue;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, gl.r);
      gr.addColorStop(0, rgba(gl.c, gl.a * L.night)); gr.addColorStop(1, rgba(gl.c, 0));
      ctx.fillStyle = gr; ctx.fillRect(x - gl.r, y - gl.r, gl.r * 2, gl.r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  drawWeather(WX, L, anim);
  drawScreenWeather(WX, L, anim);
  ctx.setTransform(sd, 0, 0, sd, tx, ty);
  // Curtis pulse: a soft ring every few seconds
  if (pulseAt && !reduced) {
    const ph = fr(anim / 2.6), r = 3 + ph * 15, n = Math.ceil(r * 4);
    ctx.fillStyle = `rgba(182,255,46,${.55 * (1 - ph)})`;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; ctx.fillRect(Math.round(pulseAt[0] + Math.cos(a) * r), Math.round(pulseAt[1] + Math.sin(a) * r * .5), 1, 1); }
  }
  // Curtis marker
  if (marker) {
    const bob = reduced ? 0 : Math.round(Math.sin(anim * 3) * 1.5), mx = Math.round(marker[0]), my = Math.round(marker[1]) + bob;
    ctx.fillStyle = '#0a0b16'; ctx.fillRect(mx - 3, my - 1, 7, 1); ctx.fillRect(mx - 3, my - 1, 1, 3);
    ctx.fillStyle = '#b6ff2e'; ctx.fillRect(mx - 2, my, 5, 1); ctx.fillRect(mx - 1, my + 1, 3, 1); ctx.fillRect(mx, my + 2, 1, 1);
  }
  window.__hits = sorted;
  if (now - lastHud > 250) { lastHud = now; updateHud(); }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- HUD & routing
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const fmt = t => { const m = Math.floor(t / 60) % 1440, h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0'); return `${(h % 12) || 12}:${mm} ${h < 12 ? 'AM' : 'PM'}`; };
const $ = id => document.getElementById(id);
const scrub = $('scrub');
const nowWhatEl = document.querySelector('[data-city-now-what]'), nowWhenEl = document.querySelector('[data-city-now-when]'), nowBoxEl = document.querySelector('[data-city-now]');
function statusText() {
  if (!AV) return '';
  if (AV.walking) return `walking to ${AV.loc === 'home' ? 'home' : AV.loc === 'office' ? 'the office' : 'the ' + AV.loc}`;
  if (AV.shelter) return `${{ lunch: 'eating lunch', read: 'reading', hang: 'waiting out the weather' }[AV.act]} at the coffee shop, out of the ${AV.shelter === 'snow' ? 'snow' : 'rain'}`;
  return ACT[AV.act];
}
function updateHud() {
  $('clock').textContent = fmt(S.t) + ' ' + TZNAME;
  $('dow').textContent = DAYS[S.day] + (S.live ? ' · live' : '') + ' · ' + WLABEL[WX.kind];
  const txt = statusText();
  $('status').innerHTML = `Curtis is <b>${txt}</b>.`;
  if (nowWhatEl) nowWhatEl.textContent = txt.charAt(0).toUpperCase() + txt.slice(1) + '.';
  if (nowWhenEl) nowWhenEl.textContent = `${fmt(S.t)} ${TZNAME} · ${DAYS[S.day]} · ${WLABEL[WX.kind]}${S.live ? '' : ' (simulated)'}`;
  if (nowBoxEl && nowBoxEl.hidden) nowBoxEl.hidden = false;
  if (document.activeElement !== scrub) scrub.value = Math.floor(S.t / 60);
  $('live').setAttribute('aria-pressed', String(S.live));
  $('ff').setAttribute('aria-pressed', String(!S.live && S.speed > 1));
  $('weekend').setAttribute('aria-pressed', String(S.day === 0 || S.day === 6));
}
// Each page names the scene to frame; map it onto the engine's internal route names.
const SCENES = { overview: 'posts', library: 'archive', curtis: 'about', tour: 'post', robot: 'robot' };
const SCENE = Object.prototype.hasOwnProperty.call(SCENES, document.body.dataset.cityScene) ? document.body.dataset.cityScene : 'overview';
function setRoute(r) {
  S.route = r; manual = false;
  tween = { from: { ...cam }, t0: performance.now(), dur: reduced ? 0 : 1800 };
}
// The clock/time-travel panel stays hidden unless unlocked with ?timemachine.
// Once unlocked it stays on for the rest of the browser session.
function timeMachineUnlocked() {
  let on = new URLSearchParams(location.search).has('timemachine');
  try { if (on) sessionStorage.setItem('tehcurtis.timemachine', '1'); else on = sessionStorage.getItem('tehcurtis.timemachine') === '1'; } catch (e) { /* storage unavailable */ }
  return on;
}
hudEl.hidden = !timeMachineUnlocked();
$('weather').onchange = e => { S.weather = e.target.value; };
$('live').onclick = () => { S.live = true; S.speed = 1; };
$('ff').onclick = () => { if (!S.live && S.speed > 1) S.speed = 1; else { S.live = false; S.speed = 120; } };
scrub.oninput = () => { S.live = false; S.speed = Math.min(S.speed, 120); S.t = scrub.value * 60; };
$('weekend').onclick = () => { const we = S.day === 0 || S.day === 6; S.live = false; S.day = we ? 2 : 6; };

// ---------------------------------------------------------------- pointer: pan, zoom, click landmarks
const tip = $('tip');
const toWorld = (x, y) => [cam.x + (x - VW / 2) / cam.s, cam.y + (y - VH / 2) / cam.s];
function hitTest(x, y) {
  const [wx, wy] = toWorld(x, y), list = window.__hits || [];
  for (let i = list.length - 1; i >= 0; i--) {
    const d = list[i], r = d.rect;
    if (wx < r.x || wx >= r.x + r.w || wy < r.y || wy >= r.y + r.h) continue;
    if (d.avatar) return { route: 'about', label: 'Curtis → about' };
    if (d.kind !== 'building') { if (d.sp) { const ix = Math.floor(wx - r.x), iy = Math.floor(wy - r.y); if (d.sp.d[(iy * d.sp.w + ix) * 4 + 3]) return null; } continue; }
    const ix = Math.floor(wx - r.x), iy = Math.floor(wy - r.y);
    if (!d.sp.d[(iy * d.sp.w + ix) * 4 + 3]) continue;
    return d.b.label ? { route: d.b.route, label: d.b.label } : null;
  }
  return null;
}
let drag = null;
cv.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false }; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => {
  if (drag) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 4) { drag.moved = true; manual = true; tween = null; cv.classList.add('dragging'); }
    if (drag.moved) { cam.x = drag.cx - dx / cam.s; cam.y = drag.cy - dy / cam.s; tip.hidden = true; return; }
  }
  const h = hitTest(e.clientX, e.clientY);
  cv.classList.toggle('pointing', !!(h && h.route));
  if (h) { tip.hidden = false; tip.textContent = h.label; tip.style.left = (e.clientX + 14) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; } else tip.hidden = true;
});
cv.addEventListener('pointerup', e => {
  const wasDrag = drag && drag.moved; drag = null; cv.classList.remove('dragging');
  if (wasDrag) return;
  const h = hitTest(e.clientX, e.clientY);
  if (h && h.route) {
    const here = { archive: 'library', about: 'curtis' }[h.route] === SCENE;
    if (here) setRoute(h.route); else location.href = { archive: '/archive', about: '/about-me/' }[h.route];
  }
});
cv.addEventListener('pointerleave', () => { tip.hidden = true; });
cv.addEventListener('wheel', e => {
  if (!(e.ctrlKey || e.metaKey || !hudEl.hidden)) return;
  e.preventDefault();
  const [wx, wy] = toWorld(e.clientX, e.clientY), f = e.deltaY < 0 ? 1.25 : 1 / 1.25;
  manual = true; tween = null;
  cam.s = clamp(cam.s * f, .5, 12);
  cam.x = wx - (e.clientX - VW / 2) / cam.s; cam.y = wy - (e.clientY - VH / 2) / cam.s;
}, { passive: false });

// Camera continuity across page loads: resume from where the last page left off if it was recent.
const CAM_KEY = 'tehcurtis.cam';
addEventListener('pagehide', () => {
  try { sessionStorage.setItem(CAM_KEY, JSON.stringify({ x: cam.x, y: cam.y, s: cam.s, at: Date.now() })); } catch (e) { /* storage unavailable */ }
});
let saved = null;
try {
  const j = JSON.parse(sessionStorage.getItem(CAM_KEY) || 'null');
  if (j && [j.x, j.y, j.s, j.at].every(Number.isFinite) && j.s > 0 && Date.now() - j.at < 30 * 60 * 1000) saved = j;
} catch (e) { /* storage unavailable or corrupt */ }
if (saved) {
  Object.assign(cam, { x: saved.x, y: saved.y, s: saved.s });
  setRoute(SCENES[SCENE]);
} else {
  S.route = SCENES[SCENE]; manual = false; tween = null;
  Object.assign(cam, camTarget());
}
requestAnimationFrame(frame);
})();
