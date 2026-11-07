/* The working yard: a gantry crane and a crew of six, all procedural.
   Everything is driven by the scroll story so it scrubs forwards and backwards:
   - a cutter works the hot bar end (sparks in chapters 0–1),
   - the gantry crane lifts the heavy stock onto the truck one piece at a time,
   - two men shoulder-carry loose bars from the rack and slide them onto the deck,
   - a signaller walks with the load, a supervisor checks the order and waves the truck off,
   - a helper rides on the truck and receives the bars. */
import * as THREE from 'three';
import * as F from './forms.js';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (u, a, b) => clamp01((u - a) / (b - a));
const smooth = (a, b, v) => { const t = seg(v, a, b); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
const angLerp = (a, b, t) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return a + d * t; };
const damp = (rate, dt) => 1 - Math.exp(-rate * dt);

/* =========================================================
   Worker rig
   ========================================================= */
let G = null;
function geos() {
  if (G) return G;
  G = {
    thigh: new THREE.CapsuleGeometry(0.074, 0.296, 4, 10),
    shin: new THREE.CapsuleGeometry(0.06, 0.3, 4, 10),
    upper: new THREE.CapsuleGeometry(0.057, 0.188, 4, 10),
    fore: new THREE.CapsuleGeometry(0.047, 0.18, 4, 10),
    hand: new THREE.SphereGeometry(0.05, 10, 8),
    foot: F.box(0.11, 0.075, 0.25, 0.025),
    pelvis: F.box(0.31, 0.18, 0.2, 0.05),
    torso: F.box(0.35, 0.52, 0.215, 0.07),
    vest: F.box(0.372, 0.36, 0.238, 0.07),
    strip: F.box(0.378, 0.03, 0.244, 0.01),
    neck: new THREE.CylinderGeometry(0.045, 0.05, 0.09, 10),
    head: new THREE.SphereGeometry(0.104, 16, 12),
    hat: new THREE.SphereGeometry(0.122, 16, 8, 0, TAU, 0, Math.PI / 2),
    brim: new THREE.CylinderGeometry(0.152, 0.152, 0.014, 20),
    board: F.box(0.2, 0.014, 0.27, 0.005),
    paper: new THREE.PlaneGeometry(0.17, 0.22),
    torch: new THREE.CylinderGeometry(0.016, 0.022, 0.46, 8),
    flame: new THREE.ConeGeometry(0.03, 0.16, 8, 1, true),
  };
  return G;
}
const MATS = new Map();
function mat(color, rough = 0.85, metal = 0, emissive = 0) {
  const k = `${color}|${rough}|${metal}|${emissive}`;
  if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, emissive, emissiveIntensity: emissive ? 0.5 : 0 }));
  return MATS.get(k);
}

function makeWorker({ shirt, pants = 0x34363c, vest = 0xff7417, hat = 0xf2c230, skin = 0x8a5a3c, shadows = true, seed = 0 }) {
  const g = geos();
  const root = new THREE.Group();
  const hips = new THREE.Group(); root.add(hips);
  const add = (parent, geo, m, y = 0, x = 0, z = 0) => {
    const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = shadows; parent.add(o); return o;
  };
  add(hips, g.pelvis, mat(pants));
  const leg = (side) => {
    const th = new THREE.Group(); th.position.set(0.085 * side, -0.04, 0); hips.add(th);
    add(th, g.thigh, mat(pants), -0.222);
    const kn = new THREE.Group(); kn.position.y = -0.444; th.add(kn);
    add(kn, g.shin, mat(pants), -0.21);
    const an = new THREE.Group(); an.position.y = -0.42; kn.add(an);
    add(an, g.foot, mat(0x1c1915, 0.7), -0.035, 0, 0.05);
    return { th, kn, an };
  };
  const L = leg(1), R = leg(-1);
  const spine = new THREE.Group(); spine.position.y = 0.06; hips.add(spine);
  add(spine, g.torso, mat(shirt), 0.27);
  if (vest) {
    add(spine, g.vest, mat(vest, 0.62), 0.33);
    [0.25, 0.41].forEach((y) => add(spine, g.strip, mat(0xcfd4d0, 0.3, 0.3, 0x3a3a3a), y));
  }
  const neck = new THREE.Group(); neck.position.y = 0.55; spine.add(neck);
  add(neck, g.neck, mat(skin, 0.7), 0.035);
  const head = new THREE.Group(); head.position.y = 0.085; neck.add(head);
  add(head, g.head, mat(skin, 0.7), 0.09);
  add(head, g.hat, mat(hat, 0.38, 0.05), 0.115);
  add(head, g.brim, mat(hat, 0.38, 0.05), 0.118, 0, 0.028);
  const arm = (side) => {
    const sh = new THREE.Group(); sh.position.set(0.218 * side, 0.5, 0); spine.add(sh);
    add(sh, g.upper, mat(shirt), -0.151);
    const el = new THREE.Group(); el.position.y = -0.302; sh.add(el);
    add(el, g.fore, mat(skin, 0.7), -0.137);
    const hd = new THREE.Group(); hd.position.y = -0.274; el.add(hd);
    add(hd, g.hand, mat(skin, 0.7), -0.03);
    return { sh, el, hd };
  };
  const LA = arm(1), RA = arm(-1);
  root.scale.setScalar(0.96);
  return { root, hips, spine, neck, head, L, R, LA, RA, phase: seed * 3, heading: 0, walk: 0, seed, init: false };
}

/* Poses: plain objects of joint angles. Forward swing of a limb is negative X. */
const NEUTRAL = { lean: 0.02, twist: 0, hx: 0, hy: 0, lh: 0, rh: 0, lk: 0.05, rk: 0.05, lsx: 0.05, lsz: 0.09, rsx: 0.05, rsz: -0.09, le: -0.22, re: -0.22 };
const POSES = {
  carry: { rsx: -2.55, rsz: -0.3, re: -1.95, hy: 0.25, lsx: -0.15, le: -0.5 },
  reach: { lsx: -2.05, rsx: -2.05, lsz: 0.16, rsz: -0.16, le: -0.45, re: -0.45, lean: -0.06, hx: -0.25 },
  bend: { lean: 0.95, lh: -0.6, rh: -0.55, lk: 1.0, rk: 0.95, lsx: -0.75, rsx: -0.7, le: -0.15, re: -0.15, hx: -0.35 },
  crouch: { lean: 0.42, lh: -1.3, rh: -0.55, lk: 2.05, rk: 1.55, lsx: -1.05, rsx: -1.25, lsz: 0.1, rsz: -0.05, le: -0.75, re: -0.55, hx: 0.3 },
  signal: { rsx: -2.95, rsz: -0.1, re: -0.12, lsx: 0.05, hx: -0.3 },
  guide: { lsx: -1.35, rsx: -1.15, lsz: 0.12, rsz: -0.12, le: -0.25, re: -0.4, lean: 0.1, hx: -0.15 },
  clip: { lsx: -0.8, lsz: 0.28, le: -1.35, rsx: -0.62, rsz: -0.22, re: -1.6, hx: 0.35, lean: 0.04 },
  hips: { lsz: 0.55, le: -1.7, rsz: -0.55, re: -1.7, lsx: 0.2, rsx: 0.2 },
  wave: { rsx: -2.55, rsz: -0.5, re: -0.35 },
  talk: { rsx: -0.7, rsz: -0.25, re: -1.3 },
};
const KEYS = Object.keys(NEUTRAL);
function layer(P, O, w) { if (w <= 0) return P; for (const k in O) P[k] = lerp(P[k], O[k], w); return P; }
function walkPose(P, ph, amt) {
  const s = Math.sin(ph), c = Math.cos(ph);
  P.lh = -0.46 * s * amt; P.rh = 0.46 * s * amt;
  P.lk = 0.06 + 0.72 * Math.max(0, c) * amt; P.rk = 0.06 + 0.72 * Math.max(0, -c) * amt;
  P.lsx = 0.36 * s * amt + 0.05; P.rsx = -0.36 * s * amt + 0.05;
  P.le = -0.25 - 0.2 * amt; P.re = -0.25 - 0.2 * amt;
  P.lean = 0.02 + 0.07 * amt;
  return P;
}
const legH = (h, k) => 0.04 + 0.444 * Math.cos(h) + 0.42 * Math.cos(h + k) + 0.078;
function applyPose(w, P) {
  // keep the lower foot on the ground
  w.hips.position.y = Math.max(legH(P.lh, P.lk), legH(P.rh, P.rk));
  w.spine.rotation.set(P.lean, P.twist, 0);
  w.hips.rotation.y = -P.twist * 0.4;
  w.neck.rotation.y = P.hy; w.head.rotation.x = P.hx;
  w.L.th.rotation.x = P.lh; w.L.kn.rotation.x = P.lk; w.L.an.rotation.x = -(P.lh + P.lk) * 0.9;
  w.R.th.rotation.x = P.rh; w.R.kn.rotation.x = P.rk; w.R.an.rotation.x = -(P.rh + P.rk) * 0.9;
  w.LA.sh.rotation.set(P.lsx, 0, P.lsz); w.LA.el.rotation.x = P.le;
  w.RA.sh.rotation.set(P.rsx, 0, P.rsz); w.RA.el.rotation.x = P.re;
}

/* Move a worker to a scripted position; the walk cycle is derived from the distance covered,
   so scrubbing backwards plays the walk in reverse. `layers` = [[pose, weight], ...]. */
function drive(w, dt, t, pos, heading, layers = []) {
  if (!w.init) { w.root.position.copy(pos); w.heading = heading; w.init = true; }
  const dx = pos.x - w.root.position.x, dz = pos.z - w.root.position.z;
  const dist = Math.hypot(dx, dz);
  const along = dx * Math.sin(w.heading) + dz * Math.cos(w.heading);
  w.phase += (along / 0.6) * Math.PI;
  const speed = dist / Math.max(dt, 1 / 240);
  w.walk = lerp(w.walk, clamp01(speed / 0.8), damp(dist > 0.0005 ? 14 : 6, dt));
  w.root.position.copy(pos);
  w.heading = angLerp(w.heading, heading, damp(7, dt));
  w.root.rotation.y = w.heading;
  const P = { ...NEUTRAL };
  // breathing + glances
  P.lean += Math.sin(t * 1.7 + w.seed * 5) * 0.012;
  P.hy = Math.sin(t * 0.37 + w.seed * 9) * 0.35;
  walkPose(P, w.phase, w.walk);
  layers.forEach(([O, wt]) => layer(P, O, wt));
  applyPose(w, P);
}

/* =========================================================
   Gantry crane
   ========================================================= */
function stripeTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#e2b13a'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#16181b';
  for (let i = -64; i < 128; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 16, 0); g.lineTo(i + 16 - 64, 64); g.lineTo(i - 64, 64); g.closePath(); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const CR = { X0: -9.0, X1: 9.6, Z0: -10.5, Z1: 5.8, H: 7.0 };
function makeCrane(shadows) {
  const yellow = new THREE.MeshStandardMaterial({ color: 0xd9a42b, roughness: 0.5, metalness: 0.3 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x22272d, roughness: 0.55, metalness: 0.6 });
  const stripes = stripeTexture();
  const hazard = new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.5, metalness: 0.2 });
  const group = new THREE.Group();
  const add = (parent, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = shadows; o.receiveShadow = true; parent.add(o); return o; };
  const { X0, X1, Z0, Z1, H } = CR;
  const zs = [Z0, (Z0 + Z1) / 2, Z1];
  [X0, X1].forEach((x) => {
    zs.forEach((z) => {
      add(group, F.box(0.42, H, 0.42, 0.03), yellow, x, H / 2, z);
      add(group, F.box(0.95, 0.08, 0.95, 0.02), dark, x, 0.04, z);
      add(group, F.box(0.5, 0.9, 0.5, 0.03), hazard, x, 0.45, z).material = hazard;
    });
    add(group, F.box(0.46, 0.55, Z1 - Z0 + 0.7, 0.03), yellow, x, H + 0.275, (Z0 + Z1) / 2);
    add(group, F.box(0.12, 0.12, Z1 - Z0 + 0.7, 0.02), dark, x, H + 0.61, (Z0 + Z1) / 2); // rail
    // knee braces between each column and the runway beam
    zs.forEach((z, i) => [-1, 1].forEach((sgn) => {
      if ((i === 0 && sgn < 0) || (i === zs.length - 1 && sgn > 0)) return;
      const b = add(group, F.box(0.16, 1.5, 0.16, 0.02), yellow, x, H - 0.62, z + sgn * 0.68);
      b.rotation.x = sgn * 0.62;
    }));
  });
  // bridge (moves along z)
  const bridge = new THREE.Group(); bridge.position.y = H + 0.67; group.add(bridge);
  const span = X1 - X0 + 0.9, cx = (X0 + X1) / 2;
  [-0.46, 0.46].forEach((z) => {
    add(bridge, F.box(span, 0.7, 0.3, 0.03), yellow, cx, 0.35, z);
    add(bridge, F.box(span, 0.06, 0.34, 0.01), dark, cx, 0.72, z);
  });
  [X0, X1].forEach((x) => add(bridge, F.box(0.75, 0.46, 1.9, 0.04), dark, x, 0.2, 0));
  const sign = add(bridge, new THREE.PlaneGeometry(2.6, 0.42), new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.6 }), cx, 0.35, 0.615);
  sign.material.map = stripes.clone(); sign.material.map.repeat.set(8, 1.3); sign.material.map.needsUpdate = true;
  // trolley (moves along x)
  const trolley = new THREE.Group(); trolley.position.y = 0.78; bridge.add(trolley);
  add(trolley, F.box(1.15, 0.5, 1.3, 0.05), yellow, 0, 0.25, 0);
  const drum = add(trolley, new THREE.CylinderGeometry(0.22, 0.22, 0.9, 20), dark, 0, 0.18, 0); drum.rotation.z = Math.PI / 2;
  // hook block (world space)
  const hook = new THREE.Group(); group.add(hook);
  add(hook, F.box(0.36, 0.5, 0.26, 0.04), hazard, 0, 0.02, 0);
  const sheave = add(hook, new THREE.CylinderGeometry(0.15, 0.15, 0.3, 18), dark, 0, 0.18, 0); sheave.rotation.z = Math.PI / 2;
  const hk = add(hook, new THREE.TorusGeometry(0.1, 0.03, 8, 16, Math.PI * 1.45), dark, 0, -0.34, 0); hk.rotation.z = Math.PI * 0.8;
  // ropes
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x2b2e33, roughness: 0.4, metalness: 0.8 });
  const ropeGeo = new THREE.CylinderGeometry(0.017, 0.017, 1, 6); ropeGeo.translate(0, -0.5, 0);
  const ropes = [-0.09, 0.09].map((x) => { const r = new THREE.Mesh(ropeGeo, ropeMat); r.userData.x = x; group.add(r); return r; });
  // spreader beam + chain slings
  const spreader = new THREE.Group(); group.add(spreader);
  add(spreader, F.box(3.4, 0.16, 0.14, 0.02), hazard, 0, 0, 0);
  const slingGeo = new THREE.BufferGeometry(); slingGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(18), 3));
  const slings = new THREE.LineSegments(slingGeo, new THREE.LineBasicMaterial({ color: 0x3a3d42 }));
  slings.frustumCulled = false; group.add(slings);
  return { group, bridge, trolley, hook, ropes, spreader, slings, cx };
}

/* =========================================================
   Yard
   ========================================================= */
export function createYard({ scene, truck, cargo, barEnd, lite = false }) {
  const shadows = !lite;
  const crane = makeCrane(true);
  scene.add(crane.group);

  // Crew
  const crew = {
    cutter: makeWorker({ shirt: 0x5a3f2e, vest: 0, hat: 0xe6e6e0, skin: 0x7c4f33, shadows, seed: 1 }),
    carrierA: makeWorker({ shirt: 0x2e4a6b, skin: 0x8a5a3c, shadows, seed: 2 }),
    carrierB: makeWorker({ shirt: 0x6b2e33, skin: 0x7a4c32, shadows, seed: 3 }),
    signaller: makeWorker({ shirt: 0x3d4f3a, skin: 0x93613f, shadows, seed: 4 }),
    supervisor: makeWorker({ shirt: 0xd9d4c8, pants: 0x2a2d36, vest: 0, hat: 0xf4f4f0, skin: 0x8c5c3e, shadows, seed: 5 }),
    helper: makeWorker({ shirt: 0x47406b, skin: 0x85573a, shadows, seed: 6 }),
  };
  Object.values(crew).forEach((w) => scene.add(w.root));
  truck.add(crew.helper.root);

  // Props: clipboard, cutting torch with flame
  const g = geos();
  const board = new THREE.Mesh(g.board, mat(0x6a4a2a, 0.8));
  const paper = new THREE.Mesh(g.paper, mat(0xf2efe8, 0.9)); paper.rotation.x = -Math.PI / 2; paper.position.y = 0.009; board.add(paper);
  board.position.set(0, -0.06, 0.05); board.rotation.set(0.2, 0, 0);
  crew.supervisor.LA.hd.add(board);
  const torch = new THREE.Mesh(g.torch, mat(0x8a8f96, 0.35, 0.8));
  torch.position.set(0, -0.12, 0.12); torch.rotation.x = Math.PI / 2 + 0.3;
  crew.cutter.RA.hd.add(torch);
  const flameMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 2.4, 4.0), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const flame = new THREE.Mesh(g.flame, flameMat); flame.position.y = -0.31; flame.rotation.x = Math.PI; torch.add(flame);
  // goggles band on the cutter
  const goggles = new THREE.Mesh(new THREE.TorusGeometry(0.106, 0.016, 6, 20), mat(0x15181c, 0.3, 0.4));
  goggles.rotation.x = Math.PI / 2; goggles.position.y = 0.11; crew.cutter.head.add(goggles);

  // Loose bars: rack → shoulders → truck deck
  const N = 4;
  const steel = F.steelMaterial({ color: 0xc8cdd3, roughness: 0.3 });
  const shortGeo = F.roundBarGeometry(0.065, 2.4, 0.012, 20);
  const RACK = { x: 0.9, z: 7.3 };
  const timber = new THREE.MeshStandardMaterial({ color: 0x4a3324, roughness: 0.9 });
  [-0.7, 0.7].forEach((dx) => {
    const t = new THREE.Mesh(F.box(0.2, 0.5, 1.05, 0.02), timber); t.position.set(RACK.x + dx, 0.25, RACK.z); t.castShadow = t.receiveShadow = true; scene.add(t);
  });
  const rackBars = [];
  for (let i = 0; i < N + 3; i++) {
    const m = new THREE.Mesh(shortGeo, steel); m.castShadow = m.receiveShadow = true;
    const row = i < 4 ? 0 : 1; const col = row ? i - 4 : i;
    m.position.set(RACK.x + (Math.random() - 0.5) * 0.08, 0.565 + row * 0.12, RACK.z - 0.22 + col * 0.15 + row * 0.075);
    scene.add(m); rackBars.push(m);
  }
  // the top row is picked first
  const pickOrder = [6, 5, 4, 3];
  const deckBars = Array.from({ length: N }, (_, k) => {
    const m = new THREE.Mesh(shortGeo, steel); m.castShadow = true;
    m.position.set(0.02, 1.47 + 0.066, 7.32 + k * 0.17); m.visible = false; truck.add(m); return m;
  });
  const carried = new THREE.Mesh(shortGeo, steel); carried.castShadow = true; carried.visible = false; scene.add(carried);

  // Crane state
  const HOME = new THREE.Vector3(1.6, 6.05, CR.Z0 + 1.2);
  const HT = 6.05; // travel height of the hook
  const HANG = 1.45; // hook → top of load
  const hookPos = HOME.clone();
  const lastHook = HOME.clone();
  const vel = new THREE.Vector3(), lastVel = new THREE.Vector3();
  const sway = new THREE.Vector2(), swayV = new THREE.Vector2();
  let spreaderYaw = 0;
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const qT = new THREE.Quaternion(), qA = new THREE.Quaternion();
  const targets = cargo.map(() => new THREE.Vector3());

  function truckPoint(local, out) { out.set(local[0], local[1], local[2]); truck.localToWorld(out); return out; }

  /* returns { item index carried, u phase } and positions the hook */
  function craneScript(load) {
    const n = cargo.length;
    const c = clamp01(load) * n;
    const k = Math.min(n - 1, Math.floor(c));
    const u = load >= 1 ? 1 : c - k;
    const it = cargo[k];
    const pick = it.yardPos;
    const drop = truckPoint(it.truck, targets[k]);
    const from = k === 0 ? HOME : truckPoint(cargo[k - 1].truck, tmp2);
    const pickY = pick.y + it.top + HANG, dropY = drop.y + it.top + HANG + 0.02;
    let x, z, y;
    if (load <= 0) { hookPos.copy(HOME); return { k: -1, u: 0 }; }
    if (u < 0.24) { const t = ease(seg(u, 0, 0.24)); x = lerp(from.x, pick.x, t); z = lerp(from.z, pick.z, t); y = HT; }
    else if (u < 0.36) { x = pick.x; z = pick.z; y = lerp(HT, pickY, ease(seg(u, 0.24, 0.36))); }
    else if (u < 0.42) { x = pick.x; z = pick.z; y = pickY; }
    else if (u < 0.54) { x = pick.x; z = pick.z; y = lerp(pickY, HT, ease(seg(u, 0.42, 0.54))); }
    else if (u < 0.8) { const t = ease(seg(u, 0.54, 0.8)); x = lerp(pick.x, drop.x, t); z = lerp(pick.z, drop.z, t); y = HT; }
    else if (u < 0.92) { x = drop.x; z = drop.z; y = lerp(HT, dropY, ease(seg(u, 0.8, 0.92))); }
    else { x = drop.x; z = drop.z; y = lerp(dropY, HT, ease(seg(u, 0.94, 1))); }
    hookPos.set(x, y, z);
    return { k, u };
  }

  function placeCargo(cs) {
    cargo.forEach((it, i) => {
      const o = it.obj;
      const done = i < cs.k || (i === cs.k && cs.u >= 0.92);
      const lifting = i === cs.k && cs.u >= 0.42 && cs.u < 0.92;
      qA.copy(it.yardQuat);
      qT.setFromAxisAngle(up, it.truck[3]).premultiply(truck.quaternion);
      if (done) { truckPoint(it.truck, o.position); o.quaternion.copy(qT); return; }
      if (!lifting) { o.position.copy(it.yardPos); o.quaternion.copy(it.yardQuat); return; }
      const t = ease(seg(cs.u, 0.56, 0.8));
      o.quaternion.slerpQuaternions(qA, qT, t);
      o.position.set(crane.spreader.position.x, crane.spreader.position.y - (HANG - 0.6) - it.top, crane.spreader.position.z);
      // a gentle tilt with the sway
      o.rotateZ(sway.x * 0.06); o.rotateX(-sway.y * 0.06);
    });
  }

  function updateCrane(dt, cs) {
    const { bridge, trolley, hook, ropes, spreader, slings, cx } = crane;
    // pendulum sway driven by hook acceleration
    if (dt > 0) {
      vel.subVectors(hookPos, lastHook).divideScalar(dt);
      const ax = THREE.MathUtils.clamp((vel.x - lastVel.x) / dt, -30, 30), az = THREE.MathUtils.clamp((vel.z - lastVel.z) / dt, -30, 30);
      const w2 = 4.4, zeta = 0.22, w = Math.sqrt(w2);
      swayV.x += (-w2 * sway.x - 2 * zeta * w * swayV.x - ax * 0.35) * dt;
      swayV.y += (-w2 * sway.y - 2 * zeta * w * swayV.y - az * 0.35) * dt;
      sway.x = THREE.MathUtils.clamp(sway.x + swayV.x * dt, -0.45, 0.45);
      sway.y = THREE.MathUtils.clamp(sway.y + swayV.y * dt, -0.45, 0.45);
      lastVel.copy(vel); lastHook.copy(hookPos);
    }
    bridge.position.z = hookPos.z;
    trolley.position.x = hookPos.x;
    hook.position.copy(hookPos);
    const top = CR.H + 0.67 + 0.78 + 0.05;
    ropes.forEach((r) => { r.position.set(hookPos.x + r.userData.x, top, hookPos.z); r.scale.y = Math.max(0.05, top - hookPos.y - 0.25); });
    spreader.position.set(hookPos.x + sway.x, hookPos.y - 0.6, hookPos.z + sway.y);
    // spreader follows the load's heading while lifting
    const it = cs.k >= 0 ? cargo[cs.k] : null;
    if (it && cs.u >= 0.42 && cs.u < 0.92) {
      tmp.set(1, 0, 0).applyQuaternion(it.obj.quaternion); spreaderYaw = Math.atan2(-tmp.z, tmp.x);
    }
    spreader.rotation.y = spreaderYaw;
    // slings: from the spreader ends to the load (or hanging free)
    const p = slings.geometry.attributes.position.array;
    const ax = Math.cos(spreaderYaw), az = -Math.sin(spreaderYaw);
    const sx = spreader.position.x, sy = spreader.position.y, sz = spreader.position.z;
    const attached = it && cs.u >= 0.36 && cs.u < 0.93;
    const half = attached ? Math.min(it.len * 0.36, 2.4) : 1.5;
    const ly = attached ? (cs.u < 0.42 ? it.yardPos.y + it.top : it.obj.position.y + it.top) : sy - 0.85;
    const lx = attached && cs.u < 0.42 ? it.yardPos.x : sx, lz = attached && cs.u < 0.42 ? it.yardPos.z : sz;
    [-1, 1].forEach((sgn, i) => {
      const o = i * 6;
      p[o] = sx + ax * 1.6 * sgn; p[o + 1] = sy - 0.06; p[o + 2] = sz + az * 1.6 * sgn;
      p[o + 3] = lx + ax * half * sgn; p[o + 4] = ly; p[o + 5] = lz + az * half * sgn;
    });
    slings.geometry.attributes.position.needsUpdate = true;
    slings.geometry.setDrawRange(0, 4);
  }

  /* ---------- crew choreography ---------- */
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const P = V(0, 0, 0), Q = V(0, 0, 0);
  const SIG_IDLE = V(6.8, 0, -1.4), sigPos = SIG_IDLE.clone();
  const CUT = V(barEnd.x + 0.62, 0, -0.92), CUT_AWAY = V(5.7, 0, 2.7);
  const CUT_HEAD = Math.atan2(barEnd.x + 0.05 - CUT.x, 0.1 - CUT.z);
  const SUP_A = V(5.6, 0, -1.9), SUP_B = V(-2.75, 0, -5.9);
  const CARRY_Z = 6.8, PICK_MID = RACK.x, D_MID = -2.5, OFF = 1.0;

  function carrierScript(m, t) {
    // returns mid x, facing (-1 loaded toward truck / +1 back), and task weights
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
    const cs = craneScript(load);
    updateCrane(dt, cs);
    placeCargo(cs);

    /* cutter: works the bar end while there is heat; walks clear once the crane comes for the bar */
    const work = smooth(0.02, 0.12, Math.max(s.sparks, s.heat));
    const away = smooth(0.0, 0.07, load);
    P.lerpVectors(CUT, CUT_AWAY, away);
    const cutHead = away > 0.01 && away < 0.99 ? Math.atan2(CUT_AWAY.x - CUT.x, CUT_AWAY.z - CUT.z) : away >= 0.99 ? -2.2 : CUT_HEAD;
    drive(crew.cutter, dt, t, P, cutHead, [[POSES.crouch, work * (1 - away)], [POSES.hips, away * smooth(0.95, 1, away) * 0.8]]);
    flameMat.opacity = work * (1 - away) * (0.75 + Math.sin(t * 40) * 0.15);
    torch.visible = away < 0.98;

    /* carriers */
    const m = clamp01((load - 0.02) / 0.94);
    const cc = carrierScript(m, t);
    const headA = cc.dir === 0 ? Math.PI / 2 : cc.dir < 0 ? -Math.PI / 2 : Math.PI / 2;
    const headB = cc.dir === 0 ? -Math.PI / 2 : headA;
    const idle = cc.trip < 0 ? 1 : 0;
    P.set(cc.mid - OFF, 0, CARRY_Z); Q.set(cc.mid + OFF, 0, CARRY_Z);
    drive(crew.carrierA, dt, t + 0.4, P, headA, [[POSES.bend, cc.bend], [POSES.carry, cc.carry], [POSES.reach, cc.reach], [POSES.hips, idle * 0.7]]);
    drive(crew.carrierB, dt, t, Q, headB, [[POSES.bend, cc.bend], [POSES.carry, cc.carry], [POSES.reach, cc.reach * 0.6], [POSES.talk, idle * (0.5 + 0.5 * Math.sin(t * 2.3))]]);

    // loose bars
    const picked = (k) => (cc.trip > k || (cc.trip === k && cc.v >= 0.07)) ? 1 : 0;
    const placed = (k) => cc.trip > k || (cc.trip === k && cc.v >= 0.64) || m >= 1;
    pickOrder.forEach((ri, k) => { rackBars[ri].visible = !picked(k); });
    deckBars.forEach((b, k) => { b.visible = placed(k); });
    carried.visible = cc.trip >= 0 && m < 1 && cc.v >= 0.07 && cc.v < 0.64;
    if (carried.visible) {
      crew.carrierA.root.updateMatrixWorld(true); crew.carrierB.root.updateMatrixWorld(true);
      crew.carrierA.RA.sh.getWorldPosition(shoulderA); crew.carrierB.RA.sh.getWorldPosition(shoulderB);
      tmp.addVectors(shoulderA, shoulderB).multiplyScalar(0.5); tmp.y += 0.1;
      const rb = rackBars[pickOrder[cc.trip]];
      const slot = deckBars[cc.trip]; slot.updateMatrixWorld(true); slot.getWorldPosition(tmp2);
      if (cc.v < 0.12) carried.position.lerpVectors(rb.position, tmp, ease(seg(cc.v, 0.07, 0.12)));
      else if (cc.v < 0.5) carried.position.copy(tmp);
      else carried.position.lerpVectors(tmp, tmp2, ease(seg(cc.v, 0.52, 0.64)));
      carried.rotation.set(0, 0, 0);
    }

    /* helper rides on the deck and receives the bars */
    P.set(1.0, 1.47, 6.98);
    const receiving = cc.trip >= 0 && m < 1 ? Math.sin(Math.PI * seg(cc.v, 0.42, 0.68)) : 0;
    const helperHead = m >= 1 && s.drive > 0 ? Math.PI : Math.PI / 2;
    drive(crew.helper, dt, t + 1.3, P, helperHead, [[POSES.reach, receiving], [POSES.wave, smooth(0.02, 0.1, s.drive) * (1 - smooth(0.5, 0.7, s.drive)) * 0.8]]);

    /* signaller walks with the load and signals the operator */
    let sigLayers = [];
    if (cs.k >= 0 && load < 1) {
      tmp.set(hookPos.x + 1.8, 0, hookPos.z + 1.6);
      tmp.x = Math.max(tmp.x, -3.15);
      const u = cs.u;
      const sig = (u > 0.24 && u < 0.54) || (u > 0.8 && u < 0.95) ? 1 : 0;
      const guide = u >= 0.54 && u <= 0.8 ? 1 : 0;
      sigLayers = [[POSES.signal, sig], [POSES.guide, guide]];
    } else tmp.copy(SIG_IDLE);
    sigPos.lerp(tmp, damp(2.4, dt));
    const toHook = Math.atan2(hookPos.x - sigPos.x, hookPos.z - sigPos.z);
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
