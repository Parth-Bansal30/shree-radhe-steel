/* Shared steel geometry, materials and textures for the hero world and the grade studio. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const rand = (a, b) => a + Math.random() * (b - a);

/* ---------- Textures ---------- */
let brushedCache = null;
export function brushedTexture() {
  if (brushedCache) return brushedCache;
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#7d7d7d'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 2600; i++) {
    const y = Math.random() * c.height;
    const v = Math.floor(rand(90, 170));
    g.strokeStyle = `rgba(${v},${v},${v},${rand(0.05, 0.35)})`;
    g.lineWidth = rand(0.4, 1.6);
    const x = rand(-200, c.width);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(120, 900), y + rand(-0.6, 0.6)); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  brushedCache = t;
  return t;
}

export function concreteTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#6b625a'; g.fillRect(0, 0, 512, 512);
  const img = g.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 38;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n * 0.9;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '30,26,22' : '140,130,120'},${rand(0.03, 0.09)})`;
    g.beginPath(); g.arc(rand(0, 512), rand(0, 512), rand(10, 70), 0, Math.PI * 2); g.fill();
  }
  g.strokeStyle = 'rgba(20,18,16,0.35)'; g.lineWidth = 2;
  g.strokeRect(0, 0, 512, 512); // slab joints
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/* Bar-end face: brushed rings, painted colour band, stamped grade code */
export function drawEndFace(canvas, code, paint, opts = {}) {
  const S = canvas.width;
  const g = canvas.getContext('2d');
  const cx = S / 2, cy = S / 2, r = S / 2;
  g.clearRect(0, 0, S, S);
  const base = g.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  base.addColorStop(0, opts.light || '#d9dee4');
  base.addColorStop(1, opts.dark || '#8c949e');
  g.fillStyle = base; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  // saw-cut rings
  for (let i = 0; i < 160; i++) {
    const rr = rand(0.04, 0.99) * r;
    g.strokeStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '40,44,50'},${rand(0.03, 0.12)})`;
    g.lineWidth = rand(0.6, 2.2);
    g.beginPath(); g.arc(cx + rand(-3, 3), cy + rand(-3, 3), rr, 0, Math.PI * 2); g.stroke();
  }
  // painted band (illustrative colour code)
  g.save();
  g.beginPath(); g.arc(cx, cy, r * 0.985, 0, Math.PI * 2); g.clip();
  g.fillStyle = paint;
  g.globalAlpha = 0.92;
  g.beginPath();
  g.moveTo(cx - r, cy + r * 0.38);
  g.bezierCurveTo(cx - r * 0.3, cy + r * 0.3, cx + r * 0.3, cy + r * 0.46, cx + r, cy + r * 0.36);
  g.lineTo(cx + r, cy + r); g.lineTo(cx - r, cy + r); g.closePath(); g.fill();
  // paint drips/brush edge
  g.globalAlpha = 0.5;
  for (let i = 0; i < 26; i++) {
    g.beginPath(); g.arc(rand(cx - r, cx + r), cy + r * rand(0.33, 0.45), rand(2, 7) * (S / 512), 0, Math.PI * 2); g.fill();
  }
  g.restore();
  // stamp
  const fs = Math.round(S * (code.length > 6 ? 0.13 : code.length > 4 ? 0.16 : 0.2));
  g.font = `700 ${fs}px "JetBrains Mono", ui-monospace, monospace`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const ty = cy - r * 0.08;
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillText(code, cx + S * 0.004, ty + S * 0.005);
  g.fillStyle = 'rgba(28,31,36,0.86)'; g.fillText(code, cx, ty);
  if (opts.sub) {
    g.font = `600 ${Math.round(S * 0.05)}px "JetBrains Mono", ui-monospace, monospace`;
    g.fillStyle = 'rgba(28,31,36,0.7)';
    g.fillText(opts.sub, cx, ty + fs * 0.78);
  }
  g.font = `600 ${Math.round(S * 0.034)}px "JetBrains Mono", ui-monospace, monospace`;
  g.fillStyle = 'rgba(28,31,36,0.55)';
  g.fillText('SRS · HEAT NO. ______', cx, cy - r * 0.55);
  // bevel shadow
  const v = g.createRadialGradient(cx, cy, r * 0.82, cx, cy, r);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.35)');
  g.fillStyle = v; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
}

export function makeLabelTexture(text, { size = 46, color = '#cfe9ff', bg = 'rgba(8,16,24,0.55)', border = 'rgba(127,216,255,0.55)' } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `600 ${size}px "JetBrains Mono", ui-monospace, monospace`;
  const w = Math.ceil(g.measureText(text).width) + size * 1.2;
  c.width = w; c.height = Math.ceil(size * 1.9);
  g.font = `600 ${size}px "JetBrains Mono", ui-monospace, monospace`;
  g.fillStyle = bg; g.strokeStyle = border; g.lineWidth = 3;
  const rr = size * 0.35;
  g.beginPath(); g.roundRect(2, 2, c.width - 4, c.height - 4, rr); g.fill(); g.stroke();
  g.fillStyle = color; g.textBaseline = 'middle'; g.fillText(text, size * 0.6, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return { texture: t, aspect: c.width / c.height };
}

/* ---------- Materials ---------- */
export function steelMaterial({ color = 0xc7cdd4, roughness = 0.3, aniso = true, envIntensity = 1 } = {}) {
  const tex = brushedTexture();
  const m = new THREE.MeshPhysicalMaterial({
    color, metalness: 1, roughness, roughnessMap: tex,
    envMapIntensity: envIntensity, clearcoat: 0.15, clearcoatRoughness: 0.4,
  });
  if (aniso) { m.anisotropy = 0.6; m.anisotropyRotation = 0; }
  return m;
}

export function millScaleMaterial(color = 0x3b3f45) {
  return new THREE.MeshPhysicalMaterial({ color, metalness: 0.75, roughness: 0.62, roughnessMap: brushedTexture(), envMapIntensity: 0.8 });
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

/* ---------- Product groups (lengths along X) ---------- */
export function roundBundle(mat, { r = 0.16, L = 5, count = 7 } = {}) {
  const grp = new THREE.Group();
  const geo = roundBarGeometry(r, L, 0.015, 40);
  const pos = count === 7
    ? [[0, 0], [2, 0], [-2, 0], [1, 1.732], [-1, 1.732], [1, -1.732], [-1, -1.732]]
    : [[-1, 0], [1, 0], [0, 1.732]];
  pos.forEach(([a, b]) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(rand(-0.15, 0.15), b * r * 1.02, a * r * 1.02);
    m.castShadow = m.receiveShadow = true;
    grp.add(m);
  });
  grp.userData.h = r * 1.02 * 1.732 + r;
  return grp;
}

export function squareBundle(mat, { s = 0.26, L = 4.6, n = 3 } = {}) {
  const grp = new THREE.Group();
  const geo = box(L, s, s, 0.02);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(rand(-0.12, 0.12), j * (s + 0.006) + s / 2, (i - (n - 1) / 2) * (s + 0.006));
    m.castShadow = m.receiveShadow = true;
    grp.add(m);
  }
  return grp;
}

export function flatsBundle(mat, { w = 0.55, t = 0.09, L = 4.2, cols = 2, rows = 4 } = {}) {
  const grp = new THREE.Group();
  const geo = box(L, t, w, 0.012);
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(rand(-0.1, 0.1), r * (t + 0.004) + t / 2, (c - (cols - 1) / 2) * (w + 0.02));
    m.castShadow = m.receiveShadow = true;
    grp.add(m);
  }
  return grp;
}

export function plateStack(mat, { w = 2.6, d = 1.8, ts = [0.18, 0.1, 0.14, 0.08, 0.22] } = {}) {
  const grp = new THREE.Group();
  let y = 0;
  ts.forEach((t, i) => {
    const m = new THREE.Mesh(box(w - i * 0.06, t, d - i * 0.05, 0.015), mat);
    m.position.set(rand(-0.05, 0.05), y + t / 2, rand(-0.05, 0.05));
    m.rotation.y = rand(-0.03, 0.03);
    m.castShadow = m.receiveShadow = true;
    grp.add(m);
    y += t + 0.004;
  });
  return grp;
}

export function blockPair(mat) {
  const grp = new THREE.Group();
  const a = new THREE.Mesh(box(1.0, 0.85, 0.9, 0.025), mat); a.position.set(0, 0.425, 0);
  const b = new THREE.Mesh(box(0.8, 0.8, 0.8, 0.025), mat); b.position.set(0, 0.4, 1.1); b.rotation.y = 0.12;
  [a, b].forEach((m) => { m.castShadow = m.receiveShadow = true; grp.add(m); });
  return grp;
}
