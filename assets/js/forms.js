/* Shared steel geometry, materials and textures for the yard and the grade studio.
   All surfaces are drawn on canvases at load time, so the site ships no texture files.
   A seeded random generator keeps every visit (and the poster image) identical. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* ---------- Seeded random ---------- */
function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let rnd = mulberry(1982);
export const reseed = (s) => { rnd = mulberry(s); };
export const rand = (a = 0, b = 1) => a + rnd() * (b - a);

const canvas = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const tex = (c, { srgb = true, repeat = [1, 1], aniso = 8 } = {}) => {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = aniso;
  return t;
};
function grain(g, w, h, amt, tint = [1, 1, 1]) {
  const img = g.getImageData(0, 0, w, h); const d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * amt; d[i] += n * tint[0]; d[i + 1] += n * tint[1]; d[i + 2] += n * tint[2]; }
  g.putImageData(img, 0, 0);
}

/* ---------- Textures ---------- */
let brushedCache = null;
/** Fine longitudinal polishing lines (roughness for bright bars). */
export function brushedTexture() {
  if (brushedCache) return brushedCache;
  const [c, g] = canvas(1024, 256);
  g.fillStyle = '#e6e6e6'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 2400; i++) {
    const y = rand(0, c.height), v = Math.floor(rand(190, 255));
    g.strokeStyle = `rgba(${v},${v},${v},${rand(0.05, 0.3)})`; g.lineWidth = rand(0.4, 1.4);
    const x = rand(-200, c.width);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(120, 900), y + rand(-0.5, 0.5)); g.stroke();
  }
  brushedCache = tex(c, { srgb: false });
  return brushedCache;
}

let scaleCache = null;
/** Hot-rolled mill scale: blue-grey mottling, flaked patches, rolling streaks, the odd rust bloom. */
export function millScaleTexture() {
  if (scaleCache) return scaleCache;
  const S = 512; const [c, g] = canvas(S);
  g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) { // rolling streaks along x
    const v = Math.floor(rand(120, 175)); g.fillStyle = `rgba(${v},${v},${v + 4},${rand(0.05, 0.16)})`;
    g.beginPath(); g.ellipse(rand(0, S), rand(0, S), rand(40, 200), rand(2, 9), 0, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 160; i++) { // darker scale islands
    g.fillStyle = `rgba(40,42,46,${rand(0.06, 0.18)})`;
    g.beginPath(); g.ellipse(rand(0, S), rand(0, S), rand(10, 70), rand(4, 22), rand(-0.2, 0.2), 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 90; i++) { // flaked scale shows lighter metal
    g.fillStyle = `rgba(205,205,200,${rand(0.08, 0.22)})`;
    const x = rand(0, S), y = rand(0, S);
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 6; k++) g.lineTo(x + rand(-14, 14), y + rand(-5, 5));
    g.closePath(); g.fill();
  }
  for (let i = 0; i < 14; i++) { // light surface oxidation
    g.fillStyle = `rgba(150,92,52,${rand(0.05, 0.12)})`;
    g.beginPath(); g.ellipse(rand(0, S), rand(0, S), rand(8, 40), rand(4, 16), 0, 0, Math.PI * 2); g.fill();
  }
  grain(g, S, S, 26);
  scaleCache = tex(c);
  return scaleCache;
}

let forgedCache = null;
/** Forged / heavily stocked surface: darker scale with brown oxidation blooms. */
export function forgedTexture() {
  if (forgedCache) return forgedCache;
  const S = 512; const [c, g] = canvas(S);
  g.fillStyle = '#8b8783'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 220; i++) {
    const warm = rnd() < 0.35;
    g.fillStyle = warm ? `rgba(140,84,48,${rand(0.06, 0.2)})` : `rgba(${rnd() < 0.5 ? '50,50,52' : '170,168,160'},${rand(0.05, 0.16)})`;
    g.beginPath(); g.ellipse(rand(0, S), rand(0, S), rand(8, 60), rand(6, 40), rand(0, 3), 0, Math.PI * 2); g.fill();
  }
  grain(g, S, S, 34, [1, 0.95, 0.9]);
  forgedCache = tex(c);
  return forgedCache;
}

let flameCache = null;
/** Oxy-fuel cut edge: fine vertical drag lines and a heat-tinted band. */
export function flameCutTexture() {
  if (flameCache) return flameCache;
  const [c, g] = canvas(512, 128);
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#8a8580'); grad.addColorStop(0.5, '#6f6b68'); grad.addColorStop(1, '#5f5550');
  g.fillStyle = grad; g.fillRect(0, 0, 512, 128);
  for (let x = 0; x < 512; x += rand(1.5, 3.5)) {
    g.strokeStyle = `rgba(${rnd() < 0.5 ? '40,36,34' : '170,160,150'},${rand(0.1, 0.3)})`; g.lineWidth = rand(0.5, 1.2);
    g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 1, 40, x + 3, 80, x + 5, 128); g.stroke();
  }
  g.fillStyle = 'rgba(120,70,40,0.16)'; g.fillRect(0, 96, 512, 32);
  grain(g, 512, 128, 20);
  flameCache = tex(c);
  return flameCache;
}

let timberCache = null;
/** Weathered timber dunnage. */
export function timberTexture() {
  if (timberCache) return timberCache;
  const [c, g] = canvas(512, 128);
  g.fillStyle = '#7b6650'; g.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 160; i++) {
    const y = rand(0, 128), v = rnd() < 0.5;
    g.strokeStyle = v ? `rgba(60,44,30,${rand(0.15, 0.4)})` : `rgba(170,150,125,${rand(0.08, 0.2)})`;
    g.lineWidth = rand(0.6, 2.2);
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= 512; x += 64) g.lineTo(x, y + Math.sin(x * 0.01 + i) * rand(0.5, 3));
    g.stroke();
  }
  for (let i = 0; i < 5; i++) { // knots
    const x = rand(20, 490), y = rand(20, 108);
    g.strokeStyle = 'rgba(55,38,24,0.5)'; g.lineWidth = 1.4;
    for (let r = 2; r < 12; r += 3) { g.beginPath(); g.ellipse(x, y, r * 1.8, r, 0, 0, Math.PI * 2); g.stroke(); }
  }
  g.fillStyle = 'rgba(150,150,150,0.18)'; g.fillRect(0, 0, 512, 128); // sun-greyed
  grain(g, 512, 128, 22, [1, 0.9, 0.8]);
  timberCache = tex(c);
  return timberCache;
}

/** Yard slab: 2 × 2 bays per tile with saw-cut joints, tyre wear, oil spots and patch repairs. */
export function concreteTexture({ joints = true } = {}) {
  const S = 1024; const [c, g] = canvas(S);
  g.fillStyle = '#8f877e'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 120; i++) {
    g.fillStyle = `rgba(${rnd() < 0.55 ? '70,64,58' : '170,162,150'},${rand(0.03, 0.08)})`;
    g.beginPath(); g.arc(rand(0, S), rand(0, S), rand(20, 140), 0, Math.PI * 2); g.fill();
  }
  // tyre wear bands along the slab
  for (let i = 0; i < 4; i++) { const x = rand(0, S); g.fillStyle = 'rgba(40,36,34,0.07)'; g.fillRect(x, 0, rand(30, 60), S); }
  // oil and water stains
  for (let i = 0; i < 5; i++) {
    const x = rand(0, S), y = rand(0, S), r = rand(10, 40);
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(30,27,24,0.2)'); gr.addColorStop(1, 'rgba(30,27,24,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 1.4, r, rand(0, 3), 0, Math.PI * 2); g.fill();
  }
  // hairline cracks
  g.strokeStyle = 'rgba(45,40,36,0.35)'; g.lineWidth = 1;
  for (let i = 0; i < 7; i++) { let x = rand(0, S), y = rand(0, S); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += rand(-24, 24); y += rand(-24, 24); g.lineTo(x, y); } g.stroke(); }
  grain(g, S, S, 30);
  // saw-cut joints
  g.strokeStyle = 'rgba(30,27,25,0.55)'; g.lineWidth = 3;
  if (joints) [0, S / 4, S / 2, (3 * S) / 4].forEach((p) => { g.beginPath(); g.moveTo(p + 1.5, 0); g.lineTo(p + 1.5, S); g.moveTo(0, p + 1.5); g.lineTo(S, p + 1.5); g.stroke(); });
  return tex(c);
}

/** Cement plaster on a brick boundary wall: soft patching, rain streaks from the coping, damp at the foot. */
export function plasterTexture() {
  const [c, g] = canvas(512, 256);
  g.fillStyle = '#c9c3b8'; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '120,112,102' : '220,214,204'},${rand(0.04, 0.1)})`; g.beginPath(); g.ellipse(rand(0, 512), rand(0, 256), rand(10, 60), rand(6, 30), 0, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 50; i++) { const x = rand(0, 512), h = rand(20, 120); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(70,64,56,0.16)'); gr.addColorStop(1, 'rgba(70,64,56,0)'); g.fillStyle = gr; g.fillRect(x, 0, rand(2, 7), h); }
  const damp = g.createLinearGradient(0, 256, 0, 190); damp.addColorStop(0, 'rgba(60,54,46,0.38)'); damp.addColorStop(1, 'rgba(60,54,46,0)'); g.fillStyle = damp; g.fillRect(0, 190, 512, 66);
  grain(g, 512, 256, 22);
  return tex(c);
}

/** Cladding sheet (trapezoidal profile) as a colour texture with ribs, streaks and weathering. */
export function claddingTexture(base = '#7d858c') {
  const [c, g] = canvas(256, 512);
  g.fillStyle = base; g.fillRect(0, 0, 256, 512);
  for (let x = 0; x < 256; x += 32) {
    const gr = g.createLinearGradient(x, 0, x + 32, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.0)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.12)'); gr.addColorStop(0.82, 'rgba(0,0,0,0.0)'); gr.addColorStop(1, 'rgba(255,255,255,0.08)');
    g.fillStyle = gr; g.fillRect(x, 0, 32, 512);
  }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(90,60,40,${rand(0.03, 0.1)})`; g.fillRect(rand(0, 256), rand(0, 512), rand(1, 4), rand(30, 200)); }
  grain(g, 256, 512, 14);
  return tex(c);
}

/** Bar-end face: saw-cut arcs, a painted colour band, the hard-stamped grade and a chalked heat line. */
export function drawEndFace(canvasEl, code, paint, opts = {}) {
  const S = canvasEl.width;
  const g = canvasEl.getContext('2d');
  const cx = S / 2, cy = S / 2, r = S / 2;
  const k = S / 512;
  g.clearRect(0, 0, S, S);
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip();
  const base = g.createLinearGradient(0, 0, S, S);
  base.addColorStop(0, opts.light || '#c9ced3'); base.addColorStop(1, opts.dark || '#8d949b');
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  // cold-saw arcs sweep across the face
  for (let i = 0; i < 70; i++) {
    const rr = S * (0.9 + i * 0.012);
    g.strokeStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '50,54,60'},${rand(0.04, 0.12)})`; g.lineWidth = rand(0.8, 2.4) * k;
    g.beginPath(); g.arc(cx - S * 0.95, cy + S * 0.2, rr, -0.6, 0.6); g.stroke();
  }
  grain(g, S, S, 16);
  // painted colour band (lower part of the face)
  g.fillStyle = paint; g.globalAlpha = 0.94;
  g.beginPath(); g.moveTo(0, cy + r * 0.4);
  g.bezierCurveTo(cx - r * 0.3, cy + r * 0.34, cx + r * 0.3, cy + r * 0.48, S, cy + r * 0.38);
  g.lineTo(S, S); g.lineTo(0, S); g.closePath(); g.fill();
  g.globalAlpha = 0.45;
  for (let i = 0; i < 22; i++) { g.beginPath(); g.arc(rand(0, S), cy + r * rand(0.34, 0.46), rand(1.5, 5) * k, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1;
  // hard-stamped code: dark recess, light lip below
  const fs = Math.round(S * (code.length > 6 ? 0.12 : code.length > 4 ? 0.15 : 0.19));
  g.font = `700 ${fs}px "JetBrains Mono", ui-monospace, monospace`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const ty = cy - r * 0.1;
  g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillText(code, cx + 1.5 * k, ty + 2 * k);
  g.fillStyle = 'rgba(30,33,37,0.86)'; g.fillText(code, cx, ty);
  if (opts.sub) {
    g.font = `600 ${Math.round(S * 0.05)}px "JetBrains Mono", ui-monospace, monospace`;
    g.fillStyle = 'rgba(30,33,37,0.7)'; g.fillText(opts.sub, cx, ty + fs * 0.8);
  }
  // chalked heat line (deliberately illegible)
  g.strokeStyle = 'rgba(245,242,232,0.7)'; g.lineWidth = 3 * k; g.lineCap = 'round';
  g.beginPath(); let x = cx - r * 0.34; const y = cy - r * 0.56; g.moveTo(x, y);
  for (let i = 0; i < 9; i++) { x += r * 0.075; g.lineTo(x, y + (i % 2 ? -1 : 1) * rand(4, 10) * k); }
  g.stroke();
  // chamfer: oxidised rim
  const v = g.createRadialGradient(cx, cy, r * 0.86, cx, cy, r);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.7, 'rgba(40,38,36,0.35)'); v.addColorStop(1, 'rgba(30,28,26,0.75)');
  g.fillStyle = v; g.fillRect(0, 0, S, S);
  g.restore();
}

/** Small engineering label for 3D callouts. */
export function makeLabelTexture(text, { size = 46, color = '#f3efe6', bg = 'rgba(14,15,16,0.82)', border = 'rgba(242,167,27,0.75)' } = {}) {
  const [c, g] = canvas(8, 8);
  g.font = `600 ${size}px "JetBrains Mono", ui-monospace, monospace`;
  const w = Math.ceil(g.measureText(text).width) + size * 1.2;
  c.width = w; c.height = Math.ceil(size * 1.9);
  g.font = `600 ${size}px "JetBrains Mono", ui-monospace, monospace`;
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = border; g.fillRect(0, 0, size * 0.14, c.height);
  g.fillStyle = color; g.textBaseline = 'middle'; g.fillText(text, size * 0.6, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return { texture: t, aspect: c.width / c.height };
}

/* ---------- Materials ---------- */
/** Bright bar (peeled, turned or ground): satin, not mirror. */
// Anisotropy is off by default: on long bars it smears the sun highlight into a white band that reads as plastic.
export function steelMaterial({ color = 0x9ca3aa, roughness = 0.5, aniso = false, envIntensity = 0.55 } = {}) {
  const m = new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness, roughnessMap: brushedTexture(), envMapIntensity: envIntensity });
  if (aniso) { m.anisotropy = 0.5; m.anisotropyRotation = 0; }
  return m;
}
/** Hot-rolled black material with mill scale. */
export function millScaleMaterial(color = 0x5b6168, { repeat = [3, 1] } = {}) {
  const map = millScaleTexture().clone(); map.repeat.set(...repeat); map.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ color, map, metalness: 0.55, roughness: 0.72, roughnessMap: map, envMapIntensity: 0.7 });
}
/** Forged blocks and large rounds. */
export function forgedMaterial(color = 0x6a6660, { repeat = [1.5, 1.5] } = {}) {
  const map = forgedTexture().clone(); map.repeat.set(...repeat); map.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ color, map, metalness: 0.45, roughness: 0.8, envMapIntensity: 0.6 });
}
export function flameCutMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0xa8a29c, map: flameCutTexture(), metalness: 0.5, roughness: 0.82, envMapIntensity: 0.6 });
}
let timberMat = null;
export function timberMaterial() {
  if (!timberMat) timberMat = new THREE.MeshStandardMaterial({ color: 0xd8cfc4, map: timberTexture(), roughness: 0.92, metalness: 0 });
  return timberMat;
}
let strapMat = null;
/** Painted steel strapping band. */
export function strapMaterial() {
  if (!strapMat) strapMat = new THREE.MeshStandardMaterial({ color: 0x2c3a46, roughness: 0.5, metalness: 0.6 });
  return strapMat;
}

/* ---------- Geometry ---------- */
export function roundBarGeometry(r, L, chamfer = 0.04, seg = 96) {
  const pts = [
    new THREE.Vector2(0, -L / 2), new THREE.Vector2(r - chamfer, -L / 2), new THREE.Vector2(r, -L / 2 + chamfer),
    new THREE.Vector2(r, L / 2 - chamfer), new THREE.Vector2(r - chamfer, L / 2), new THREE.Vector2(0, L / 2),
  ];
  const g = new THREE.LatheGeometry(pts, seg);
  g.rotateZ(-Math.PI / 2); // axis along +X
  return g;
}

export const box = (x, y, z, r = 0.02, s = 2) => new RoundedBoxGeometry(x, y, z, s, Math.min(r, x / 2.1, y / 2.1, z / 2.1));

export function hexBarGeometry(r, L) {
  const g = new THREE.CylinderGeometry(r, r, L, 6, 1);
  g.rotateZ(Math.PI / 2);
  return g;
}

/** Timber bearer (dunnage) along z, sitting on y = 0. */
export function dunnage(len = 1.6, w = 0.16, h = 0.12) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, len), timberMaterial());
  m.position.y = h / 2; m.castShadow = m.receiveShadow = true;
  m.rotation.y = rand(-0.03, 0.03);
  return m;
}

/** Steel strap band around a rectangular or round bundle cross-section (bundle runs along x). */
export function strapBand(height, depth, { round = false, w = 0.035 } = {}) {
  const geo = round
    ? new THREE.TorusGeometry(Math.max(height, depth) / 2 + 0.006, 0.006, 4, 40).rotateY(Math.PI / 2).scale(w / 0.012, 1, 1)
    : (() => {
      const s = new THREE.Shape(); const hw = depth / 2 + 0.008, hh = height / 2 + 0.008;
      s.moveTo(-hw, -hh); s.lineTo(hw, -hh); s.lineTo(hw, hh); s.lineTo(-hw, hh); s.closePath();
      const hole = new THREE.Path(); const i = 0.007; hole.moveTo(-hw + i, -hh + i); hole.lineTo(-hw + i, hh - i); hole.lineTo(hw - i, hh - i); hole.lineTo(hw - i, -hh + i); hole.closePath();
      s.holes.push(hole);
      const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }); g.translate(0, 0, -w / 2); g.rotateY(Math.PI / 2); return g;
    })();
  const m = new THREE.Mesh(geo, strapMaterial()); m.castShadow = true;
  return m;
}

/* ---------- Product groups (lengths along X, resting on y = 0) ---------- */
export function roundBundle(mat, { r = 0.16, L = 5, count = 7, straps = 0 } = {}) {
  const grp = new THREE.Group();
  const geo = roundBarGeometry(r, L, Math.min(0.012, r * 0.08), 40);
  const pos = count === 7
    ? [[0, 0], [2, 0], [-2, 0], [1, 1.732], [-1, 1.732], [1, -1.732], [-1, -1.732]]
    : [[-1, 0], [1, 0], [0, 1.732]];
  pos.forEach(([a, b]) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(rand(-0.08, 0.08), b * r * 1.01, a * r * 1.01); // ends never line up exactly
    m.castShadow = m.receiveShadow = true;
    grp.add(m);
  });
  const h = r * 1.01 * 1.732 + r;
  grp.userData.h = h;
  for (let i = 0; i < straps; i++) {
    const s = strapBand(r * 6.04, r * 6.04, { round: true }); s.position.x = (i - (straps - 1) / 2) * L * 0.34; grp.add(s);
  }
  return grp;
}

export function squareBundle(mat, { s = 0.26, L = 4.6, n = 3, straps = 0 } = {}) {
  const grp = new THREE.Group();
  const geo = box(L, s, s, 0.008);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(rand(-0.06, 0.06), j * (s + 0.004) + s / 2, (i - (n - 1) / 2) * (s + 0.004));
    m.castShadow = m.receiveShadow = true;
    grp.add(m);
  }
  const H = n * (s + 0.004), D = n * (s + 0.004);
  for (let i = 0; i < straps; i++) { const b = strapBand(H, D); b.position.set((i - (straps - 1) / 2) * L * 0.36, H / 2, 0); grp.add(b); }
  grp.userData.h = H;
  return grp;
}

export function flatsBundle(mat, { w = 0.55, t = 0.09, L = 4.2, cols = 2, rows = 4, straps = 0 } = {}) {
  const grp = new THREE.Group();
  const geo = box(L, t, w, 0.006);
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(rand(-0.06, 0.06), r * (t + 0.003) + t / 2, (c - (cols - 1) / 2) * (w + 0.012));
    m.castShadow = m.receiveShadow = true;
    grp.add(m);
  }
  const H = rows * (t + 0.003), D = cols * (w + 0.012);
  for (let i = 0; i < straps; i++) { const b = strapBand(H, D); b.position.set((i - (straps - 1) / 2) * L * 0.36, H / 2, 0); grp.add(b); }
  grp.userData.h = H;
  return grp;
}

/** Plates: mill-scale faces, flame-cut edges; `mat` may be a single material or [edge, face]. */
export function plateStack(mat, { w = 2.6, d = 1.8, ts = [0.18, 0.1, 0.14, 0.08, 0.22] } = {}) {
  const grp = new THREE.Group();
  const [edge, face] = Array.isArray(mat) ? mat : [mat, mat];
  const mats = [edge, edge, face, face, edge, edge];
  let y = 0;
  ts.forEach((t, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w - i * 0.05, t, d - i * 0.04), mats);
    m.position.set(rand(-0.04, 0.04), y + t / 2, rand(-0.04, 0.04));
    m.rotation.y = rand(-0.025, 0.025);
    m.castShadow = m.receiveShadow = true;
    grp.add(m);
    y += t + 0.003;
  });
  grp.userData.h = y;
  return grp;
}

export function blockPair(mat) {
  const grp = new THREE.Group();
  const a = new THREE.Mesh(box(1.0, 0.85, 0.9, 0.03), mat); a.position.set(0, 0.425, 0);
  const b = new THREE.Mesh(box(0.8, 0.7, 0.8, 0.03), mat); b.position.set(0.05, 0.35, 1.1); b.rotation.y = 0.12;
  [a, b].forEach((m) => { m.castShadow = m.receiveShadow = true; grp.add(m); });
  grp.userData.h = 0.85;
  return grp;
}

/** An extruded steel section (H or I) along y, for columns, or along x for beams. */
export function hSection(h, b, tw, tf, len, axis = 'y') {
  const s = new THREE.Shape();
  s.moveTo(-b / 2, -h / 2); s.lineTo(b / 2, -h / 2); s.lineTo(b / 2, -h / 2 + tf); s.lineTo(tw / 2, -h / 2 + tf);
  s.lineTo(tw / 2, h / 2 - tf); s.lineTo(b / 2, h / 2 - tf); s.lineTo(b / 2, h / 2); s.lineTo(-b / 2, h / 2);
  s.lineTo(-b / 2, h / 2 - tf); s.lineTo(-tw / 2, h / 2 - tf); s.lineTo(-tw / 2, -h / 2 + tf); s.lineTo(-b / 2, -h / 2 + tf); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
  g.translate(0, 0, -len / 2);
  if (axis === 'y') g.rotateX(Math.PI / 2);
  else if (axis === 'x') g.rotateY(Math.PI / 2);
  return g;
}
