/* The working yard: an outdoor EOT gantry crane and a crew of six, all procedural.
   Everything is driven by the scroll story, so it scrubs forwards and backwards:
   - a cutter works the hot bar end (sparks in chapters 0–1), then walks clear,
   - the crane lifts the heavy stock onto the truck one piece at a time on a lifting beam and two sling legs,
   - two men shoulder-carry loose bars from the rack and slide them onto the deck,
   - a signaller walks with the load, a supervisor checks the order and waves the truck off,
   - a helper climbs onto the deck to receive the bars and climbs down before the truck leaves.
   When loading is done the crane parks and only the truck drives out. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as F from './forms.js';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (u, a, b) => clamp01((u - a) / (b - a));
const smooth = (a, b, v) => { const t = seg(v, a, b); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
const angLerp = (a, b, t) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return a + d * t; };
const damp = (rate, dt) => 1 - Math.exp(-rate * dt);
const V2 = THREE.Vector2;

/* =========================================================
   Worker: a jointed figure whose parts are baked per bone into one vertex-coloured mesh
   (about fifteen draw calls a person, so six people stay cheap).
   ========================================================= */
/** Tapered limb hanging from its joint at the origin: rounded ends, an optional muscle bulge. */
function limbGeo(r0, r1, len, bulge = 0, at = 0.3, segs = 14) {
  const pts = [];
  for (let i = 0; i <= 4; i++) { const a = (i / 4) * Math.PI / 2; pts.push(new V2(Math.max(1e-4, Math.sin(a) * r1), -len - Math.cos(a) * r1 * 0.7)); }
  const N = 9;
  for (let i = 1; i < N; i++) {
    const t = i / N;
    pts.push(new V2(lerp(r1, r0, t) + bulge * Math.exp(-Math.pow((t - (1 - at)) / 0.22, 2)), -len + t * len));
  }
  for (let i = 0; i <= 4; i++) { const a = Math.PI / 2 + (i / 4) * Math.PI / 2; pts.push(new V2(Math.max(1e-4, Math.sin(a) * r0), -Math.cos(a) * r0 * 0.7)); }
  return new THREE.LatheGeometry(pts, segs);
}
/** Lathe from [radius, y] pairs, flattened front-to-back. */
function shellGeo(P, depth = 0.62, segs = 22) {
  const g = new THREE.LatheGeometry(P.map(([r, y]) => new V2(r, y)), segs);
  g.scale(1, 1, depth);
  return g;
}

let G = null;
function geos() {
  if (G) return G;
  G = {
    torso: shellGeo([[0.001, -0.12], [0.136, -0.112], [0.141, -0.03], [0.143, 0.08], [0.152, 0.18], [0.163, 0.27], [0.168, 0.34], [0.165, 0.39], [0.15, 0.43], [0.115, 0.465], [0.07, 0.49], [0.045, 0.5], [0.001, 0.505]]),
    yoke: new THREE.CapsuleGeometry(0.066, 0.25, 6, 14).rotateZ(Math.PI / 2).scale(1, 1, 0.74),
    vest: shellGeo([[0.153, 0.04], [0.158, 0.12], [0.168, 0.22], [0.177, 0.3], [0.179, 0.36], [0.172, 0.41], [0.15, 0.445]], 0.66),
    strip: shellGeo([[0.18, 0.0], [0.182, 0.028]], 0.67),
    collar: new THREE.TorusGeometry(0.058, 0.016, 6, 18).rotateX(Math.PI / 2).scale(1, 1, 0.85),
    pelvis: new THREE.SphereGeometry(0.15, 18, 12).scale(1, 0.62, 0.7),
    crotch: new THREE.SphereGeometry(0.085, 12, 8),
    thigh: limbGeo(0.08, 0.06, 0.43, 0.006, 0.25),
    shin: limbGeo(0.058, 0.045, 0.4, 0.01, 0.3),
    boot: F.box(0.104, 0.09, 0.27, 0.035),
    sole: F.box(0.112, 0.022, 0.278, 0.008),
    delt: new THREE.SphereGeometry(0.062, 14, 10),
    upper: limbGeo(0.052, 0.042, 0.27, 0.006, 0.35),
    fore: limbGeo(0.043, 0.031, 0.24, 0.006, 0.25),
    cuff: new THREE.CylinderGeometry(0.036, 0.036, 0.03, 12),
    palm: F.box(0.034, 0.1, 0.078, 0.014),
    thumb: new THREE.CapsuleGeometry(0.012, 0.04, 4, 8),
    neck: new THREE.CylinderGeometry(0.053, 0.06, 0.1, 12),
    skull: new THREE.SphereGeometry(0.1, 22, 16).scale(0.88, 1.06, 0.98),
    jaw: new THREE.SphereGeometry(0.07, 16, 12).scale(0.9, 0.78, 0.9),
    nose: new THREE.SphereGeometry(0.017, 10, 8).scale(0.78, 1.25, 0.95),
    ear: new THREE.SphereGeometry(0.026, 10, 8).scale(0.45, 1, 0.8),
    eye: new THREE.SphereGeometry(0.0115, 8, 6),
    brow: F.box(0.034, 0.008, 0.012, 0.003),
    stache: F.box(0.056, 0.013, 0.014, 0.005),
    // hair cap tilted back: hairline above the brow at the front, down to the nape behind
    hair: new THREE.SphereGeometry(0.105, 20, 12, 0, TAU, 0, Math.PI * 0.5).rotateX(-0.45).scale(0.92, 1.02, 0.99),
    dome: new THREE.SphereGeometry(0.118, 22, 12, 0, TAU, 0, Math.PI / 2).scale(0.95, 0.92, 1.06),
    brim: new THREE.CylinderGeometry(0.121, 0.123, 0.011, 28).scale(1, 1, 1.13),
    ridge: new THREE.TorusGeometry(0.119, 0.0085, 6, 28, Math.PI).rotateY(Math.PI / 2).scale(1, 0.92, 1.06),
    cap: new THREE.SphereGeometry(0.108, 18, 10, 0, TAU, 0, Math.PI * 0.5).scale(0.92, 0.75, 1.02),
    apron: F.box(0.3, 0.66, 0.014, 0.006),
    board: F.box(0.2, 0.014, 0.27, 0.005),
    paper: new THREE.PlaneGeometry(0.17, 0.22),
    torch: new THREE.CylinderGeometry(0.016, 0.022, 0.46, 8),
    flame: new THREE.ConeGeometry(0.03, 0.16, 8, 1, true),
  };
  return G;
}

const BODY = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0 });
const GLOSS = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.36, metalness: 0.05 });
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color();
/** One coloured part, moved into its bone's space. Faint per-vertex variation reads as fabric and skin. */
function piece(geo, color, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], vary = 0.06 } = {}) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  g.applyMatrix4(_m.compose(_p.set(...p), _q.setFromEuler(_e.set(...r)), _s.set(...s)));
  _c.set(color);
  const pos = g.attributes.position.array, n = pos.length / 3, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const h = Math.sin(pos[i * 3] * 91.7 + pos[i * 3 + 1] * 47.3 + pos[i * 3 + 2] * 13.1) * 43758.5;
    const k = 1 - vary + (h - Math.floor(h)) * vary * 1.4;
    col[i * 3] = _c.r * k; col[i * 3 + 1] = _c.g * k; col[i * 3 + 2] = _c.b * k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
const bone = (parent, x = 0, y = 0, z = 0) => { const b = new THREE.Group(); b.position.set(x, y, z); parent.add(b); return b; };
function bake(parent, parts, shadows, mat = BODY) {
  const m = new THREE.Mesh(mergeGeometries(parts, false), mat);
  m.castShadow = shadows; m.receiveShadow = true; parent.add(m); return m;
}

const LEG = { hip: 0.06, thigh: 0.43, shin: 0.4, foot: 0.095 };
const legH = (h, k) => LEG.hip + LEG.thigh * Math.cos(h) + LEG.shin * Math.cos(h + k) + LEG.foot;

function makeWorker({
  shirt, pants = 0x34363c, skin = 0x8a5a3c, hair = 0x1a1613, helmet = 0xf0b92a, cap = 0, vest = 0, gloves = 0,
  sleeves = 'full', stache = false, apron = 0, scale = 0.94, shadows = true, seed = 0,
}) {
  const g = geos();
  const root = new THREE.Group();
  const hips = bone(root, 0, 0.98, 0);
  const boot = 0x24201c, sole = 0x141210;
  bake(hips, [piece(g.pelvis, pants, { p: [0, -0.03, 0] }), piece(g.crotch, pants, { p: [0, -0.09, 0] })], shadows);
  const leg = (side) => {
    const th = bone(hips, 0.085 * side, -LEG.hip, 0);
    th.rotation.z = 0.03 * side;
    bake(th, [piece(g.thigh, pants)], shadows);
    const kn = bone(th, 0, -LEG.thigh, 0);
    bake(kn, [piece(g.shin, pants)], shadows);
    const an = bone(kn, 0, -LEG.shin, 0);
    bake(an, [piece(g.boot, boot, { p: [0, -0.045, 0.05] }), piece(g.sole, sole, { p: [0, -0.084, 0.052], vary: 0.02 })], shadows);
    return { th, kn, an };
  };
  const L = leg(1), R = leg(-1);

  const spine = bone(hips, 0, 0.04, 0);
  const torso = [piece(g.torso, shirt), piece(g.yoke, shirt, { p: [0, 0.415, 0] }), piece(g.collar, shirt, { p: [0, 0.49, 0.004] })];
  if (vest) {
    torso.push(piece(g.vest, vest, { vary: 0.03 }));
    [0.16, 0.3].forEach((y) => torso.push(piece(g.strip, 0xd7dbd6, { p: [0, y, 0], vary: 0.01 })));
  }
  if (apron) torso.push(piece(g.apron, apron, { p: [0, 0.06, 0.112], r: [-0.06, 0, 0] }));
  bake(spine, torso, shadows);

  const neck = bone(spine, 0, 0.49, 0);
  bake(neck, [piece(g.neck, skin, { p: [0, 0.04, 0] })], shadows);
  const head = bone(neck, 0, 0.066, 0);
  const face = [
    piece(g.skull, skin, { p: [0, 0.105, -0.004] }), piece(g.jaw, skin, { p: [0, 0.05, 0.02] }),
    piece(g.nose, skin, { p: [0, 0.093, 0.091] }),
    piece(g.ear, skin, { p: [0.089, 0.1, -0.005] }), piece(g.ear, skin, { p: [-0.089, 0.1, -0.005] }),
    piece(g.eye, 0x16120f, { p: [0.034, 0.118, 0.083], vary: 0 }), piece(g.eye, 0x16120f, { p: [-0.034, 0.118, 0.083], vary: 0 }),
    piece(g.brow, hair, { p: [0.034, 0.138, 0.087], r: [0, 0, -0.12] }), piece(g.brow, hair, { p: [-0.034, 0.138, 0.087], r: [0, 0, 0.12] }),
    piece(g.hair, hair, { p: [0, 0.11, -0.01] }),
  ];
  if (stache) face.push(piece(g.stache, hair, { p: [0, 0.066, 0.095] }));
  if (cap) face.push(piece(g.cap, cap, { p: [0, 0.14, -0.006] }));
  bake(head, face, shadows);
  if (helmet) {
    bake(head, [
      piece(g.dome, helmet, { p: [0, 0.135, 0], vary: 0.03 }), piece(g.brim, helmet, { p: [0, 0.139, 0.022], vary: 0.03 }),
      piece(g.ridge, helmet, { p: [0, 0.135, 0], vary: 0.03 }),
    ], shadows, GLOSS);
  }

  const handC = gloves || skin;
  const arm = (side) => {
    const sh = bone(spine, 0.19 * side, 0.415, 0);
    bake(sh, [piece(g.delt, shirt), piece(g.upper, shirt)], shadows);
    const el = bone(sh, 0, -0.27, 0);
    const fore = [piece(g.fore, sleeves === 'full' ? shirt : skin)];
    if (sleeves === 'full') fore.push(piece(g.cuff, shirt, { p: [0, -0.225, 0] }));
    bake(el, fore, shadows);
    const hd = bone(el, 0, -0.24, 0);
    bake(hd, [piece(g.palm, handC, { p: [0, -0.055, 0.004] }), piece(g.thumb, handC, { p: [-0.012 * side, -0.035, 0.044], r: [0.5, 0, 0.3 * side] })], shadows);
    return { sh, el, hd };
  };
  const LA = arm(1), RA = arm(-1);
  root.scale.setScalar(scale);
  return { root, hips, spine, neck, head, L, R, LA, RA, phase: seed * 3, heading: 0, walk: 0, seed, init: false };
}

/* Poses: plain objects of joint angles. A limb swinging forward is negative X. */
const NEUTRAL = { lean: 0.03, twist: 0, pyaw: 0, roll: 0, hx: 0, hy: 0, lh: 0, rh: 0, lk: 0.06, rk: 0.06, la: 0, ra: 0, lsx: 0.06, lsz: 0.07, rsx: 0.06, rsz: -0.07, le: -0.2, re: -0.2 };
const POSES = {
  carry: { rsx: -2.6, rsz: -0.32, re: -1.95, hy: 0.25, lsx: -0.1, le: -0.45, roll: 0.04 },
  reach: { lsx: -1.95, rsx: -1.95, lsz: 0.14, rsz: -0.14, le: -0.4, re: -0.4, lean: -0.04, hx: -0.25 },
  bend: { lean: 0.9, lh: -0.65, rh: -0.6, lk: 1.05, rk: 1.0, lsx: -0.8, rsx: -0.75, le: -0.15, re: -0.15, hx: -0.4 },
  crouch: { lean: 0.42, lh: -1.35, rh: -0.55, lk: 2.1, rk: 1.6, lsx: -1.05, rsx: -1.25, lsz: 0.1, rsz: -0.05, le: -0.75, re: -0.55, hx: 0.35 },
  signal: { rsx: -2.95, rsz: -0.08, re: -0.12, lsx: 0.05, hx: -0.3 },
  guide: { lsx: -1.35, rsx: -1.15, lsz: 0.12, rsz: -0.12, le: -0.25, re: -0.4, lean: 0.1, hx: -0.15 },
  clip: { lsx: -0.85, lsz: 0.26, le: -1.4, rsx: -0.6, rsz: -0.2, re: -1.55, hx: 0.38, lean: 0.05 },
  hips: { lsz: 0.55, le: -1.75, rsz: -0.55, re: -1.75, lsx: 0.2, rsx: 0.2 },
  wave: { rsx: -2.6, rsz: -0.45, re: -0.35 },
  talk: { rsx: -0.7, rsz: -0.25, re: -1.35 },
  climb: { lean: 0.55, lh: -1.25, lk: 1.7, rh: -0.15, rk: 0.35, lsx: -1.7, rsx: -1.5, le: -0.45, re: -0.4, hx: -0.3 },
};
function layer(P, O, w) { if (w <= 0) return P; for (const k in O) P[k] = lerp(P[k], O[k], w); return P; }

/** Walking gait: hip swing, knee flex in swing with a give at heel strike, toe-off, counter-rotation, hip drop. */
function walkPose(P, ph, amt) {
  if (amt < 0.002) return P;
  const s = Math.sin(ph), c = Math.cos(ph);
  const swL = Math.max(0, c), swR = Math.max(0, -c);
  P.lh = lerp(P.lh, -0.44 * s, amt); P.rh = lerp(P.rh, 0.44 * s, amt);
  P.lk = lerp(P.lk, 0.08 + 1.0 * swL * swL + 0.14 * Math.max(0, s) * (1 - swL), amt);
  P.rk = lerp(P.rk, 0.08 + 1.0 * swR * swR + 0.14 * Math.max(0, -s) * (1 - swR), amt);
  P.la = 0.32 * Math.max(0, -s) * (1 - swL) * amt; P.ra = 0.32 * Math.max(0, s) * (1 - swR) * amt;
  P.lsx = lerp(P.lsx, 0.34 * s + 0.04, amt); P.rsx = lerp(P.rsx, -0.34 * s + 0.04, amt);
  P.le = lerp(P.le, -0.24 - 0.32 * Math.max(0, -s), amt); P.re = lerp(P.re, -0.24 - 0.32 * Math.max(0, s), amt);
  P.pyaw = -0.1 * s * amt; P.twist = 0.15 * s * amt; P.roll = -0.045 * c * amt;
  P.lean = lerp(P.lean, 0.07, amt);
  return P;
}
function applyPose(w, P) {
  w.hips.position.y = Math.max(legH(P.lh, P.lk), legH(P.rh, P.rk));
  w.hips.rotation.set(0, P.pyaw, P.roll);
  w.spine.rotation.set(P.lean, P.twist, -P.roll * 0.7);
  w.neck.rotation.set(P.hx * 0.35 - P.lean * 0.3, P.hy, 0); w.head.rotation.x = P.hx * 0.65;
  w.L.th.rotation.x = P.lh; w.L.kn.rotation.x = P.lk; w.L.an.rotation.x = -(P.lh + P.lk) + P.la;
  w.R.th.rotation.x = P.rh; w.R.kn.rotation.x = P.rk; w.R.an.rotation.x = -(P.rh + P.rk) + P.ra;
  w.LA.sh.rotation.set(P.lsx, 0, P.lsz); w.LA.el.rotation.x = P.le;
  w.RA.sh.rotation.set(P.rsx, 0, P.rsz); w.RA.el.rotation.x = P.re;
}

/* Move a worker to a scripted position. The walk cycle comes from the distance covered, so feet don't
   skate and scrubbing backwards plays the walk in reverse. `layers` = [[pose, weight], ...]. */
const STRIDE = 0.66; // metres per step
function drive(w, dt, t, pos, heading, layers = []) {
  if (!w.init) { w.root.position.copy(pos); w.heading = heading; w.init = true; }
  const dx = pos.x - w.root.position.x, dz = pos.z - w.root.position.z;
  const dist = Math.hypot(dx, dz);
  const along = dx * Math.sin(w.heading) + dz * Math.cos(w.heading);
  w.phase += (along / STRIDE) * Math.PI;
  const speed = dist / Math.max(dt, 1 / 240);
  w.walk = lerp(w.walk, clamp01(speed / 0.7), damp(dist > 0.0004 ? 12 : 5, dt));
  w.root.position.copy(pos);
  w.heading = angLerp(w.heading, heading, damp(6, dt));
  w.root.rotation.y = w.heading;
  const P = { ...NEUTRAL };
  // breathing, weight shift, glances
  const k = 1 - w.walk;
  P.lean += Math.sin(t * 1.6 + w.seed * 5) * 0.01;
  P.roll += Math.sin(t * 0.45 + w.seed * 2) * 0.025 * k;
  P.lh += Math.sin(t * 0.45 + w.seed * 2) * 0.03 * k; P.rh -= Math.sin(t * 0.45 + w.seed * 2) * 0.03 * k;
  P.hy = Math.sin(t * 0.33 + w.seed * 9) * 0.35;
  walkPose(P, w.phase, w.walk);
  layers.forEach(([O, wt]) => layer(P, O, wt));
  applyPose(w, P);
}

/* =========================================================
   Gantry crane: H-section columns on plinths, runway girders and rails, double-girder bridge with
   walkway and handrail, hoist trolley, hook block and a lifting beam with two sling legs.
   ========================================================= */
function stripeTexture(rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#d1a12e'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#17191b';
  for (let i = -64; i < 128; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 16, 0); g.lineTo(i + 16 - 64, 64); g.lineTo(i - 64, 64); g.closePath(); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep);
  return t;
}
/** Worn crane paint: chalky yellow, darker grime toward the underside, scuffs and the odd rust run. */
function paintTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#e1b23f'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '120,86,30' : '250,220,150'},${0.04 + Math.random() * 0.08})`; g.beginPath(); g.ellipse(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 30, 2 + Math.random() * 10, Math.random() * 3, 0, TAU); g.fill(); }
  for (let i = 0; i < 26; i++) { const x = Math.random() * 256, h = 20 + Math.random() * 90; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(110,60,25,0.28)'); gr.addColorStop(1, 'rgba(110,60,25,0)'); g.fillStyle = gr; g.fillRect(x, Math.random() * 160, 1.5 + Math.random() * 2.5, h); }
  for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(60,50,40,${0.1 + Math.random() * 0.2})`; g.lineWidth = 0.6 + Math.random(); const x = Math.random() * 256, y = Math.random() * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 6); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function hookGeometry() {
  const pts = [new THREE.Vector3(0, 0.24, 0), new THREE.Vector3(0, 0.12, 0)];
  const c = new V2(0.075, 0.0), Rr = 0.08;
  for (let a = Math.PI; a <= Math.PI * 2.32; a += 0.12) pts.push(new THREE.Vector3(c.x + Math.cos(a) * Rr, c.y + Math.sin(a) * Rr, 0));
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.026, 10, false);
}

export const CR = { X0: -9.0, X1: 9.6, ZS: [-10.5, -2.35, 5.8], H: 7.0 };
function makeCrane(lite) {
  const pt = paintTexture();
  const paint = new THREE.MeshStandardMaterial({ color: 0xffffff, map: pt, roughness: 0.6, metalness: 0.2 });
  const grey = new THREE.MeshStandardMaterial({ color: 0x5c6268, roughness: 0.62, metalness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2e32, roughness: 0.55, metalness: 0.6 });
  const rail = new THREE.MeshStandardMaterial({ color: 0x6a6f74, roughness: 0.4, metalness: 0.85 });
  const hazard = new THREE.MeshStandardMaterial({ map: stripeTexture([2, 2]), roughness: 0.6, metalness: 0.2 });
  const plinth = new THREE.MeshStandardMaterial({ color: 0x8e887f, roughness: 0.95 });
  const group = new THREE.Group();
  const add = (parent, geo, m, x = 0, y = 0, z = 0, cast = true) => {
    const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; parent.add(o); return o;
  };
  const { X0, X1, ZS, H } = CR;
  const z0 = ZS[0] - 0.4, z1 = ZS[ZS.length - 1] + 0.4, zl = z1 - z0, zc = (z0 + z1) / 2;
  const colLen = H - 0.7 - 0.34;
  const colGeo = F.hSection(0.42, 0.3, 0.018, 0.026, colLen, 'y');
  [X0, X1].forEach((x) => {
    ZS.forEach((z) => {
      add(group, F.box(0.9, 0.3, 0.9, 0.02), plinth, x, 0.15, z, false);
      add(group, new THREE.BoxGeometry(0.6, 0.04, 0.6), grey, x, 0.32, z);
      add(group, colGeo, grey, x, 0.34 + colLen / 2, z);
      add(group, F.box(0.46, 0.9, 0.34, 0.02), hazard, x, 0.79, z, false); // painted guard at the foot
      [-1, 1].forEach((sg) => {
        if ((z === ZS[0] && sg < 0) || (z === ZS[ZS.length - 1] && sg > 0)) return;
        const b = add(group, F.hSection(0.16, 0.12, 0.01, 0.014, 1.3, 'y'), grey, x, H - 1.25, z + sg * 0.5);
        b.rotation.x = sg * 0.72;
      });
    });
    add(group, F.hSection(0.7, 0.32, 0.016, 0.03, zl, 'z'), paint, x, H - 0.35, zc);
    add(group, new THREE.BoxGeometry(0.07, 0.1, zl), rail, x, H + 0.05, zc);
    // end stops and a festoon of cable loops along the runway
    [z0 + 0.1, z1 - 0.1].forEach((z) => add(group, F.box(0.3, 0.3, 0.2, 0.02), hazard, x, H + 0.2, z));
  });
  const bridge = new THREE.Group(); bridge.position.y = H + 0.1; group.add(bridge);
  const span = X1 - X0 + 0.9, cx = (X0 + X1) / 2;
  [X0, X1].forEach((x) => {
    add(bridge, F.box(0.5, 0.55, 3.4, 0.03), paint, x, 0.33, 0);
    [-1.25, 1.25].forEach((z) => { const w = add(bridge, new THREE.CylinderGeometry(0.22, 0.22, 0.14, 18), dark, x, 0.18, z); w.rotation.z = Math.PI / 2; });
    add(bridge, F.box(0.52, 0.2, 0.2, 0.02), hazard, x, 0.3, 1.78);
    add(bridge, F.box(0.52, 0.2, 0.2, 0.02), hazard, x, 0.3, -1.78);
    add(bridge, F.box(0.4, 0.34, 0.55, 0.03), dark, x + (x < 0 ? 0.42 : -0.42), 0.8, -1.0);
  });
  const GZ = 0.6, GH = 1.0, GY = 0.6 + GH / 2;
  const girderTex = pt.clone(); girderTex.repeat.set(10, 1); girderTex.needsUpdate = true;
  const girderPaint = paint.clone(); girderPaint.map = girderTex;
  [-GZ, GZ].forEach((z) => {
    add(bridge, F.box(span, GH, 0.38, 0.03), girderPaint, cx, GY, z);
    add(bridge, new THREE.BoxGeometry(span, 0.06, 0.07), rail, cx, GY + GH / 2 + 0.03, z);
    // diaphragm stiffeners on the outer web
    if (!lite) for (let x = X0 + 0.8; x < X1 - 0.5; x += 1.2) add(bridge, new THREE.BoxGeometry(0.03, GH - 0.06, 0.03), girderPaint, x, GY, z + Math.sign(z) * 0.2, false);
  });
  add(bridge, new THREE.BoxGeometry(span - 0.6, 0.04, 0.7), dark, cx, GY - GH / 2 + 0.05, GZ + 0.55);
  const postGeo = new THREE.BoxGeometry(0.04, 1.0, 0.04);
  for (let x = X0 + 0.3; x <= X1 - 0.2; x += 1.5) add(bridge, postGeo, girderPaint, x, GY - GH / 2 + 0.55, GZ + 0.88, false);
  [0.55, 1.02].forEach((y) => add(bridge, new THREE.BoxGeometry(span - 0.6, 0.04, 0.04), girderPaint, cx, GY - GH / 2 + y, GZ + 0.88, false));
  add(bridge, F.box(0.7, 0.9, 0.35, 0.02), dark, X1 - 1.6, GY - GH / 2 + 0.52, GZ + 0.7);
  const top = GY + GH / 2 + 0.06;

  const trolley = new THREE.Group(); trolley.position.y = top; bridge.add(trolley);
  add(trolley, F.box(1.5, 0.22, 1.7, 0.03), paint, 0, 0.2, 0);
  [-0.55, 0.55].forEach((x) => [-GZ, GZ].forEach((z) => { const w = add(trolley, new THREE.CylinderGeometry(0.13, 0.13, 0.1, 14), dark, x, 0.08, z); w.rotation.z = Math.PI / 2; }));
  const drum = add(trolley, new THREE.CylinderGeometry(0.26, 0.26, 1.0, 24), dark, 0, 0.58, -0.12); drum.rotation.z = Math.PI / 2;
  add(trolley, F.box(0.5, 0.42, 0.42, 0.03), dark, 0.78, 0.55, 0.45);
  add(trolley, F.box(0.36, 0.5, 0.5, 0.03), paint, -0.72, 0.58, 0.4);
  const ropeTop = top - 0.1;

  const block = new THREE.Group(); group.add(block);
  add(block, F.box(0.4, 0.5, 0.3, 0.04), hazard, 0, 0.62, 0);
  [-0.08, 0.08].forEach((x) => { const s = add(block, new THREE.CylinderGeometry(0.19, 0.19, 0.05, 24), dark, x, 0.82, 0); s.rotation.z = Math.PI / 2; });
  add(block, F.box(0.22, 0.12, 0.22, 0.02), dark, 0, 0.32, 0);
  add(block, hookGeometry(), dark, -0.075, 0.02, 0).scale.setScalar(1.15);
  const beam = new THREE.Group(); group.add(beam);
  const BEAM = 3.0, LUG = 1.3;
  add(beam, F.hSection(0.3, 0.16, 0.012, 0.018, BEAM, 'x'), paint, 0, -0.27, 0);
  add(beam, new THREE.BoxGeometry(0.06, 0.22, 0.03), dark, 0, -0.06, 0);
  add(beam, new THREE.TorusGeometry(0.06, 0.016, 8, 20), dark, 0, 0.02, 0);
  [-1, 1].forEach((sg) => {
    add(beam, F.box(0.2, 0.32, 0.18, 0.01), hazard, sg * (BEAM / 2 - 0.1), -0.27, 0, false);
    add(beam, new THREE.BoxGeometry(0.03, 0.12, 0.06), dark, sg * LUG, -0.47, 0);
  });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x3b3e42, roughness: 0.45, metalness: 0.8 });
  const ropeGeo = new THREE.CylinderGeometry(0.014, 0.014, 1, 6); ropeGeo.translate(0, -0.5, 0);
  const ropes = [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]].map(([x, z]) => { const r = new THREE.Mesh(ropeGeo, ropeMat); r.userData.o = [x, z]; r.castShadow = true; group.add(r); return r; });
  const slingMat = new THREE.MeshStandardMaterial({ color: 0xb9952e, roughness: 0.85, metalness: 0 });
  const legGeo = new THREE.CylinderGeometry(0.022, 0.022, 1, 8); legGeo.translate(0, 0.5, 0);
  const legs = [0, 1].map(() => { const m = new THREE.Mesh(legGeo, slingMat); m.castShadow = true; group.add(m); return m; });
  const eyes = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 16), slingMat); group.add(m); return m; });
  return { group, bridge, trolley, block, beam, ropes, legs, eyes, ropeTop, slingMat, LUG };
}

/* =========================================================
   Marigold garland (toran): flowers along a hanging curve, with strands dropping at intervals
   and a few mango leaves, as strung over gates and on trucks across India.
   ========================================================= */
export function garland({ from, to, sag = 0.35, step = 0.055, drop = 0.55, dropN = 6, leaves = true, scale = 1, lite = false }) {
  const grp = new THREE.Group();
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const len = a.distanceTo(b);
  const pts = [];
  const at = (t, out) => out.lerpVectors(a, b, t).setY(lerp(a.y, b.y, t) - sag * 4 * t * (1 - t));
  const n = Math.max(8, Math.round(len / (step * (lite ? 1.5 : 1))));
  const v = new THREE.Vector3();
  for (let i = 0; i <= n; i++) { at(i / n, v); pts.push([v.x, v.y, v.z, 1]); }
  if (drop > 0) for (let d = drop / 2; d < len; d += drop) {
    at(d / len, v);
    for (let k = 1; k <= dropN; k++) pts.push([v.x, v.y - k * step * 0.95, v.z, k === dropN ? 1.35 : 0.9]);
  }
  const geo = new THREE.IcosahedronGeometry(0.042 * scale, 1); geo.scale(1, 0.82, 1);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0, emissive: 0x2a1000 });
  const mesh = new THREE.InstancedMesh(geo, mat, pts.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
  const cols = [0xf08a12, 0xffb21c, 0xe8670c, 0xffc23a].map((h) => new THREE.Color(h));
  pts.forEach(([x, y, z, k], i) => {
    m.compose(p.set(x, y, z), q.setFromEuler(e.set(Math.random() * 3, Math.random() * 3, 0)), s.setScalar(k * (0.85 + Math.random() * 0.3)));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, cols[(i + (Math.random() < 0.3 ? 1 : 0)) % 2 === 0 ? (Math.random() < 0.5 ? 0 : 2) : (Math.random() < 0.5 ? 1 : 3)]);
  });
  mesh.castShadow = !lite;
  grp.add(mesh);
  if (leaves && !lite) {
    const lg = new THREE.SphereGeometry(0.05 * scale, 8, 6); lg.scale(0.42, 1.6, 0.12);
    const lm = new THREE.MeshStandardMaterial({ color: 0x3e6a2a, roughness: 0.7 });
    const cnt = Math.max(3, Math.floor(len / 0.32));
    const lmesh = new THREE.InstancedMesh(lg, lm, cnt);
    for (let i = 0; i < cnt; i++) {
      at((i + 0.5) / cnt, v);
      m.compose(p.set(v.x, v.y - 0.075 * scale, v.z + 0.01), q.setFromEuler(e.set(0.1, Math.random() * 0.6 - 0.3, Math.random() * 0.3 - 0.15)), s.setScalar(1));
      lmesh.setMatrixAt(i, m);
    }
    lmesh.castShadow = true;
    grp.add(lmesh);
  }
  return grp;
}

/* =========================================================
   Yard
   ========================================================= */
export function createYard({ scene, truck, cargo, barEnd, parkZ = -0.8, lite = false }) {
  const shadows = !lite;
  const crane = makeCrane(lite);
  scene.add(crane.group);

  // Crew
  const crew = {
    cutter: makeWorker({ shirt: 0x5b4636, pants: 0x3b3a36, skin: 0x7a4b30, helmet: 0, cap: 0x7a2e2a, apron: 0x5a3a22, gloves: 0x8c7a5a, stache: true, shadows, seed: 1, scale: 0.93 }),
    carrierA: makeWorker({ shirt: 0x3f5f7f, pants: 0x4b4a45, skin: 0x8a5a3c, vest: 0xff7417, gloves: 0xb49a6c, sleeves: 'half', shadows, seed: 2, scale: 0.95 }),
    carrierB: makeWorker({ shirt: 0x7a3b36, pants: 0x2f3640, skin: 0x77492f, gloves: 0xb49a6c, stache: true, shadows, seed: 3, scale: 0.92 }),
    signaller: makeWorker({ shirt: 0x4d5a3e, pants: 0x3d3a34, skin: 0x93613f, vest: 0xff7417, sleeves: 'half', shadows, seed: 4, scale: 0.94 }),
    supervisor: makeWorker({ shirt: 0xe6e0d2, pants: 0x2a2d36, skin: 0x8c5c3e, helmet: 0xf3f2ee, stache: true, shadows, seed: 5, scale: 0.96 }),
    helper: makeWorker({ shirt: 0x8a6a3a, pants: 0x3a3a3a, skin: 0x85573a, vest: 0xff7417, gloves: 0xb49a6c, sleeves: 'half', shadows, seed: 6, scale: 0.92 }),
  };
  Object.values(crew).forEach((w) => scene.add(w.root));

  // Props: clipboard, cutting torch with flame, goggles
  const g = geos();
  const propMat = (c, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const board = new THREE.Mesh(g.board, propMat(0x6a4a2a));
  const paper = new THREE.Mesh(g.paper, propMat(0xf2efe8, 0.9)); paper.rotation.x = -Math.PI / 2; paper.position.y = 0.009; board.add(paper);
  board.position.set(0, -0.08, 0.06); board.rotation.set(0.2, 0, 0);
  crew.supervisor.LA.hd.add(board);
  const torch = new THREE.Mesh(g.torch, propMat(0x8a8f96, 0.35, 0.8));
  torch.position.set(0, -0.12, 0.12); torch.rotation.x = Math.PI / 2 + 0.3;
  crew.cutter.RA.hd.add(torch);
  const flameMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 2.4, 4.0), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const flame = new THREE.Mesh(g.flame, flameMat); flame.position.y = -0.31; flame.rotation.x = Math.PI; torch.add(flame);
  const goggles = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 6, 20, Math.PI * 1.2), propMat(0x15181c, 0.3, 0.4));
  goggles.rotation.set(Math.PI / 2, 0, -Math.PI * 0.1); goggles.position.set(0, 0.118, 0.01); crew.cutter.head.add(goggles);
  [-0.034, 0.034].forEach((x) => { const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.014, 12), propMat(0x2b3a3a, 0.15, 0.6)); lens.rotation.x = Math.PI / 2; lens.position.set(x, 0.118, 0.094); crew.cutter.head.add(lens); });

  // Loose bars: rack → shoulders → truck deck
  const N = 4;
  const steel = F.steelMaterial({ color: 0xa9b0b7, roughness: 0.42, envIntensity: 0.7 });
  const shortGeo = F.roundBarGeometry(0.065, 2.4, 0.012, 20);
  const RACK = { x: 0.9, z: 7.3 };
  [-0.7, 0.7].forEach((dx) => {
    const t = new THREE.Mesh(F.box(0.2, 0.5, 1.05, 0.02), F.timberMaterial()); t.position.set(RACK.x + dx, 0.25, RACK.z); t.castShadow = t.receiveShadow = true; scene.add(t);
  });
  const rackBars = [];
  for (let i = 0; i < N + 3; i++) {
    const m = new THREE.Mesh(shortGeo, steel); m.castShadow = m.receiveShadow = true;
    const row = i < 4 ? 0 : 1; const col = row ? i - 4 : i;
    m.position.set(RACK.x + (F.rand() - 0.5) * 0.08, 0.565 + row * 0.12, RACK.z - 0.22 + col * 0.15 + row * 0.075);
    scene.add(m); rackBars.push(m);
  }
  const pickOrder = [6, 5, 4, 3];
  const deckBars = Array.from({ length: N }, (_, k) => {
    const m = new THREE.Mesh(shortGeo, steel); m.castShadow = true;
    m.position.set(0.02, 1.47 + 0.066, 7.32 + k * 0.17); m.visible = false; truck.add(m); return m;
  });
  const carried = new THREE.Mesh(shortGeo, steel); carried.castShadow = true; carried.visible = false; scene.add(carried);

  // Choke loops on each crane load (hidden until rigged)
  cargo.forEach((it) => {
    it.loops = [-1, 1].map((sg) => {
      let m;
      if (it.section.type === 'round') {
        m = new THREE.Mesh(new THREE.TorusGeometry(it.section.r + 0.018, 0.022, 8, 40), crane.slingMat);
        m.rotation.y = Math.PI / 2; m.position.set(sg * it.half, it.section.cy ?? it.section.r, 0);
      } else {
        m = F.strapBand(it.section.h + 0.02, it.section.d + 0.02, { w: 0.06 }); m.material = crane.slingMat;
        m.position.set(sg * it.half, it.section.h / 2, 0);
      }
      m.visible = false; it.obj.add(m); return m;
    });
  });

  /* ---------- Crane script ---------- */
  const HT = 5.1;            // hook travel height
  const HANG = 0.47 + 1.05;  // hook point → top of the load while rigged
  const HOME = new THREE.Vector3(1.6, HT + 0.6, CR.ZS[0] + 1.2);
  const hookPos = HOME.clone(), lastHook = HOME.clone();
  const vel = new THREE.Vector3(), lastVel = new THREE.Vector3();
  const sway = new THREE.Vector2(), swayV = new THREE.Vector2();
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), park = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const qT = new THREE.Quaternion(), qA = new THREE.Quaternion();
  const targets = cargo.map(() => new THREE.Vector3());
  const truckPoint = (local, out) => { out.set(local[0], local[1], local[2]); truck.localToWorld(out); return out; };
  // Drop points use the truck's parked spot, so the hook never chases a moving truck.
  const parkPoint = (local, out) => out.set(truck.position.x + local[0], local[1], parkZ + local[2]);

  function craneScript(load, leave) {
    const n = cargo.length;
    if (load <= 0) { hookPos.copy(HOME); return { k: -1, u: 0 }; }
    const c = clamp01(load) * n;
    const k = Math.min(n - 1, Math.floor(c));
    const u = load >= 1 ? 1 : c - k;
    const it = cargo[k];
    const pick = it.yardPos;
    const drop = parkPoint(it.truck, targets[k]);
    const from = k === 0 ? HOME : parkPoint(cargo[k - 1].truck, tmp2);
    const fromY = k === 0 ? HOME.y : HT;
    const pickY = pick.y + it.top + HANG, dropY = drop.y + it.top + HANG + 0.01;
    let x, z, y;
    if (u < 0.24) { const t = ease(seg(u, 0, 0.24)); x = lerp(from.x, pick.x, t); z = lerp(from.z, pick.z, t); y = lerp(fromY, HT, Math.min(1, t * 2)); }
    else if (u < 0.36) { x = pick.x; z = pick.z; y = lerp(HT, pickY, ease(seg(u, 0.24, 0.36))); }
    else if (u < 0.42) { x = pick.x; z = pick.z; y = pickY; }
    else if (u < 0.54) { x = pick.x; z = pick.z; y = lerp(pickY, HT, ease(seg(u, 0.42, 0.54))); }
    else if (u < 0.8) { const t = ease(seg(u, 0.54, 0.8)); x = lerp(pick.x, drop.x, t); z = lerp(pick.z, drop.z, t); y = HT; }
    else if (u < 0.92) { x = drop.x; z = drop.z; y = lerp(HT, dropY, ease(seg(u, 0.8, 0.92))); }
    else { x = drop.x; z = drop.z; y = lerp(dropY, HT, ease(seg(u, 0.95, 1))); }
    // loading done: the crane travels back to its parking spot while the truck leaves
    if (load >= 1 && leave > 0) {
      const t = ease(clamp01(leave));
      x = lerp(x, HOME.x, t); z = lerp(z, HOME.z, t); y = lerp(y, HOME.y, t);
    }
    hookPos.set(x, y, z);
    return { k, u };
  }

  function placeCargo(cs) {
    cargo.forEach((it, i) => {
      const o = it.obj;
      const done = i < cs.k || (i === cs.k && cs.u >= 0.92);
      const lifting = i === cs.k && cs.u >= 0.42 && cs.u < 0.92;
      const rigged = i === cs.k && cs.u >= 0.37 && cs.u < 0.935;
      it.loops.forEach((l) => { l.visible = rigged; });
      qA.copy(it.yardQuat);
      qT.setFromAxisAngle(up, it.truck[3]).premultiply(truck.quaternion);
      if (done) { truckPoint(it.truck, o.position); o.quaternion.copy(qT); return; }
      if (!lifting) { o.position.copy(it.yardPos); o.quaternion.copy(it.yardQuat); return; }
      const t = ease(seg(cs.u, 0.56, 0.8));
      o.quaternion.slerpQuaternions(qA, qT, t);
      o.position.set(hookPos.x + sway.x, hookPos.y - HANG - it.top, hookPos.z + sway.y);
      o.rotateZ(sway.x * 0.04); o.rotateX(-sway.y * 0.04);
    });
  }

  let beamYaw = Math.PI / 2;
  const lugW = new THREE.Vector3(), loopW = new THREE.Vector3(), dir = new THREE.Vector3(), down = new THREE.Vector3(0, -1, 0);
  function rig(dt, cs) {
    const { bridge, trolley, block, beam, ropes, legs, eyes, ropeTop, LUG } = crane;
    if (dt > 0) {
      vel.subVectors(hookPos, lastHook).divideScalar(dt);
      const ax = THREE.MathUtils.clamp((vel.x - lastVel.x) / dt, -20, 20), az = THREE.MathUtils.clamp((vel.z - lastVel.z) / dt, -20, 20);
      const w2 = 3.2, zeta = 0.35, w = Math.sqrt(w2);
      swayV.x += (-w2 * sway.x - 2 * zeta * w * swayV.x - ax * 0.18) * dt;
      swayV.y += (-w2 * sway.y - 2 * zeta * w * swayV.y - az * 0.18) * dt;
      sway.x = THREE.MathUtils.clamp(sway.x + swayV.x * dt, -0.22, 0.22);
      sway.y = THREE.MathUtils.clamp(sway.y + swayV.y * dt, -0.22, 0.22);
      lastVel.copy(vel); lastHook.copy(hookPos);
    }
    bridge.position.z = hookPos.z;
    trolley.position.x = hookPos.x;
    const bx = hookPos.x + sway.x, bz = hookPos.z + sway.y;
    block.position.set(bx, hookPos.y, bz);
    const ry = bridge.position.y + ropeTop;
    ropes.forEach((r) => {
      const [ox, oz] = r.userData.o;
      tmp.set(hookPos.x + ox, ry, hookPos.z + oz);
      tmp2.set(bx + ox * 0.6, hookPos.y + 0.84, bz + oz * 0.3);
      dir.subVectors(tmp2, tmp); const len = dir.length();
      r.position.copy(tmp); r.scale.set(1, len, 1);
      r.quaternion.setFromUnitVectors(down, dir.normalize());
    });
    const it = cs.k >= 0 ? cargo[cs.k] : null;
    const rigged = it && cs.u >= 0.37 && cs.u < 0.935;
    if (rigged) { tmp.set(1, 0, 0).applyQuaternion(it.obj.quaternion); beamYaw = Math.atan2(-tmp.z, tmp.x); }
    beam.position.set(bx, hookPos.y, bz);
    beam.rotation.set(sway.y * 0.15, beamYaw, -sway.x * 0.15);
    beam.updateMatrixWorld();
    legs.forEach((leg, i) => {
      const sg = i ? 1 : -1;
      lugW.set(sg * LUG, -0.52, 0); beam.localToWorld(lugW);
      if (rigged) {
        it.obj.updateMatrixWorld();
        const l = it.loops[i];
        if (it.section.type === 'round') loopW.set(0, (it.section.cy ?? it.section.r) + it.section.r + 0.03, 0).setX(l.position.x);
        else loopW.set(l.position.x, it.section.h + 0.03, 0);
        it.obj.localToWorld(loopW);
      } else loopW.copy(lugW).add(tmp.set(0, -1.05, 0));
      dir.subVectors(loopW, lugW); const len = dir.length();
      leg.position.copy(lugW); leg.scale.set(1, len, 1);
      leg.quaternion.setFromUnitVectors(down, dir.normalize());
      leg.position.addScaledVector(dir, len);
      eyes[i].visible = !rigged; eyes[i].position.copy(loopW); eyes[i].rotation.set(0, beamYaw, 0);
    });
  }

  /* ---------- Crew choreography ---------- */
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const P = V(0, 0, 0), Q = V(0, 0, 0);
  const SIG_IDLE = V(6.8, 0, -1.4), sigPos = SIG_IDLE.clone();
  const CUT = V(barEnd.x + 0.62, 0, -0.92), CUT_AWAY = V(5.7, 0, 2.7);
  const CUT_HEAD = Math.atan2(barEnd.x + 0.05 - CUT.x, 0.1 - CUT.z);
  const SUP_A = V(5.6, 0, -1.9), SUP_B = V(-2.75, 0, -5.9);
  const CARRY_Z = 6.8, PICK_MID = RACK.x, D_MID = -2.5, OFF = 1.0;
  // helper: waits by the lane, climbs onto the parked deck, climbs down before the truck leaves
  const H_WAIT = V(-1.9, 0, 9.6), H_STEP = V(-3.35, 0, 6.25), H_DECK = V(-4.25, 1.47, 6.18), H_DOWN = V(-3.3, 0, 4.4), H_SEE = V(-2.3, 0, -3.4);
  const hPos = V(0, 0, 0);

  function carrierScript(m) {
    if (m <= 0) return { mid: PICK_MID, dir: 0, bend: 0, carry: 0, reach: 0, trip: -1, v: 0 };
    const c = Math.min(m * N, N - 1e-6), k = Math.floor(c), v = m >= 1 ? 1 : c - k;
    let mid, dir, bend = 0, carry = 0, reach = 0;
    if (v < 0.12) { mid = PICK_MID; dir = -1; bend = Math.sin(Math.PI * seg(v, 0, 0.12)); carry = smooth(0.07, 0.12, v); }
    else if (v < 0.5) { mid = lerp(PICK_MID, D_MID, ease(seg(v, 0.12, 0.5))); dir = -1; carry = 1; }
    else if (v < 0.64) { mid = D_MID; dir = -1; reach = Math.sin(Math.PI * seg(v, 0.5, 0.64)); carry = 1 - smooth(0.5, 0.56, v); }
    else { mid = lerp(D_MID, PICK_MID, ease(seg(v, 0.66, 1))); dir = v < 0.66 ? -1 : 1; }
    return { mid, dir, bend, carry, reach, trip: k, v };
  }

  const shoulderA = V(0, 0, 0), shoulderB = V(0, 0, 0);
  function update(dt, t, s) {
    const load = clamp01(s.load);
    const leave = clamp01((s.dismount ?? 0) * 0.5 + (s.drive ?? 0) * 3);
    const cs = craneScript(load, leave);
    rig(dt, cs);
    placeCargo(cs);
    // once the truck rolls, the whole crew turns to see it out of the gate
    const seeOff = smooth(0.03, 0.18, s.drive ?? 0);
    const toTruck = (pos) => Math.atan2(truck.position.x - pos.x, Math.max(-70, truck.position.z) - pos.z);

    /* cutter: works the bar end while there is heat; walks clear once the crane comes for the bar */
    const work = smooth(0.02, 0.12, Math.max(s.sparks, s.heat));
    const away = smooth(0.0, 0.07, load);
    P.lerpVectors(CUT, CUT_AWAY, away);
    const cutHead = away > 0.01 && away < 0.99 ? Math.atan2(CUT_AWAY.x - CUT.x, CUT_AWAY.z - CUT.z) : away >= 0.99 ? (seeOff > 0.5 ? toTruck(P) : -2.2) : CUT_HEAD;
    drive(crew.cutter, dt, t, P, cutHead, [[POSES.crouch, work * (1 - away)], [POSES.hips, away * smooth(0.95, 1, away) * 0.8]]);
    flameMat.opacity = work * (1 - away) * (0.75 + Math.sin(t * 40) * 0.15);
    torch.visible = away < 0.98;

    /* carriers */
    const m = clamp01((load - 0.02) / 0.94);
    const cc = carrierScript(m);
    let headA = cc.dir === 0 ? Math.PI / 2 : cc.dir < 0 ? -Math.PI / 2 : Math.PI / 2;
    let headB = cc.dir === 0 ? -Math.PI / 2 : headA;
    const idle = cc.trip < 0 ? 1 : 0;
    P.set(cc.mid - OFF, 0, CARRY_Z); Q.set(cc.mid + OFF, 0, CARRY_Z);
    if (seeOff > 0.5) { headA = toTruck(P); headB = toTruck(Q); }
    drive(crew.carrierA, dt, t + 0.4, P, headA, [[POSES.bend, cc.bend], [POSES.carry, cc.carry], [POSES.reach, cc.reach], [POSES.hips, idle * 0.7 + seeOff * 0.6]]);
    drive(crew.carrierB, dt, t, Q, headB, [[POSES.bend, cc.bend], [POSES.carry, cc.carry], [POSES.reach, cc.reach * 0.6], [POSES.talk, idle * (0.5 + 0.5 * Math.sin(t * 2.3))], [POSES.wave, seeOff * 0.8]]);
    if (seeOff > 0) crew.carrierB.RA.sh.rotation.z += Math.sin(t * 6.4 + 2) * 0.28 * seeOff;

    const picked = (k) => (cc.trip > k || (cc.trip === k && cc.v >= 0.07)) ? 1 : 0;
    const placed = (k) => cc.trip > k || (cc.trip === k && cc.v >= 0.64) || m >= 1;
    pickOrder.forEach((ri, k) => { rackBars[ri].visible = !picked(k); });
    deckBars.forEach((b, k) => { b.visible = placed(k); });
    carried.visible = cc.trip >= 0 && m < 1 && cc.v >= 0.07 && cc.v < 0.64;
    if (carried.visible) {
      crew.carrierA.root.updateMatrixWorld(true); crew.carrierB.root.updateMatrixWorld(true);
      crew.carrierA.RA.sh.getWorldPosition(shoulderA); crew.carrierB.RA.sh.getWorldPosition(shoulderB);
      tmp.addVectors(shoulderA, shoulderB).multiplyScalar(0.5); tmp.y += 0.09;
      const rb = rackBars[pickOrder[cc.trip]];
      const slot = deckBars[cc.trip]; slot.updateMatrixWorld(true); slot.getWorldPosition(tmp2);
      if (cc.v < 0.12) carried.position.lerpVectors(rb.position, tmp, ease(seg(cc.v, 0.07, 0.12)));
      else if (cc.v < 0.5) carried.position.copy(tmp);
      else carried.position.lerpVectors(tmp, tmp2, ease(seg(cc.v, 0.52, 0.64)));
      carried.rotation.set(0, 0, 0);
    }

    /* helper: walks to the truck as it parks, climbs up, receives the bars, climbs down, sees it off */
    const arrive = smooth(0.55, 1.0, s.truckIn);
    const climb = smooth(0.0, 0.05, load), dn = clamp01(s.dismount ?? 0);
    const receiving = cc.trip >= 0 && m < 1 ? Math.sin(Math.PI * seg(cc.v, 0.42, 0.68)) : 0;
    let hHead, hLayers;
    if (climb <= 0) {
      hPos.lerpVectors(H_WAIT, H_STEP, arrive);
      hHead = arrive > 0.01 && arrive < 0.99 ? Math.atan2(H_STEP.x - H_WAIT.x, H_STEP.z - H_WAIT.z) : arrive >= 0.99 ? -Math.PI / 2 : -2.6;
      hLayers = [[POSES.hips, (1 - arrive) * 0.6]];
    } else if (dn <= 0) {
      hPos.lerpVectors(H_STEP, H_DECK, ease(climb)); hPos.y = H_DECK.y * smooth(0.15, 0.85, climb);
      hHead = climb < 1 ? -Math.PI / 2 : Math.PI / 2;
      hLayers = [[POSES.climb, Math.sin(Math.PI * climb)], [POSES.reach, receiving]];
    } else {
      const d1 = seg(dn, 0, 0.35), d2 = seg(dn, 0.35, 1);
      if (d2 <= 0) { hPos.lerpVectors(H_DECK, H_DOWN, ease(d1)); hPos.y = H_DECK.y * (1 - smooth(0.15, 0.85, d1)); }
      else hPos.lerpVectors(H_DOWN, H_SEE, ease(d2));
      hHead = d2 > 0 && d2 < 1 ? Math.atan2(H_SEE.x - H_DOWN.x, H_SEE.z - H_DOWN.z) : d2 >= 1 ? Math.atan2(truck.position.x - hPos.x, truck.position.z - hPos.z) : Math.PI / 2;
      hLayers = [[POSES.climb, Math.sin(Math.PI * d1)], [POSES.wave, smooth(0.02, 0.12, s.drive) * (1 - smooth(0.55, 0.8, s.drive)) * 0.85]];
    }
    drive(crew.helper, dt, t + 1.3, hPos, hHead, hLayers);
    if (hPos.y > 0.01) crew.helper.root.position.y = hPos.y; // feet on the deck, not the ground
    if (dn > 0 && s.drive > 0.02) crew.helper.RA.sh.rotation.z += Math.sin(t * 7 + 1) * 0.3 * smooth(0.02, 0.12, s.drive);

    /* signaller walks with the load and signals the operator */
    let sigLayers = [];
    if (cs.k >= 0 && load < 1) {
      tmp.set(hookPos.x + 1.8, 0, hookPos.z + 1.6);
      tmp.x = Math.max(tmp.x, -2.4);
      const u = cs.u;
      const sig = (u > 0.24 && u < 0.54) || (u > 0.8 && u < 0.95) ? 1 : 0;
      const guide = u >= 0.54 && u <= 0.8 ? 1 : 0;
      sigLayers = [[POSES.signal, sig], [POSES.guide, guide]];
    } else tmp.copy(SIG_IDLE);
    sigPos.lerp(tmp, damp(2.4, dt));
    const toHook = seeOff > 0.5 ? toTruck(sigPos) : Math.atan2(hookPos.x - sigPos.x, hookPos.z - sigPos.z);
    drive(crew.signaller, dt, t + 2.1, sigPos, toHook, sigLayers);

    /* supervisor checks the order, then waves the truck off */
    const e = smooth(0.55, 1.0, s.truckIn);
    P.lerpVectors(SUP_A, SUP_B, e);
    const moving = e > 0.01 && e < 0.99;
    tmp.copy(truck.position);
    const supHead = moving ? Math.atan2(SUP_B.x - SUP_A.x, SUP_B.z - SUP_A.z) : e >= 0.99 ? Math.atan2(tmp.x - P.x, tmp.z + 2 - P.z) : -2.4;
    const wave = smooth(0.0, 0.08, s.drive);
    drive(crew.supervisor, dt, t + 3.3, P, supHead, [[POSES.clip, 1 - wave], [POSES.wave, wave * (0.8 + 0.2 * Math.sin(t * 6))]]);
    if (wave > 0) crew.supervisor.RA.sh.rotation.z += Math.sin(t * 7) * 0.3 * wave;
  }

  return { update, crane, crew };
}
