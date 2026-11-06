/* Grade studio: renders any grade on any form (round, square, flat, block) with a stamped,
   colour-painted end face. Also renders the product-card studio images once, so the page
   ships no heavy image files. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as F from './forms.js';
import { FAMILIES } from './grades.js';

const FINISH = {
  carbon:    { color: 0xaab1b9, roughness: 0.38 },
  alloy:     { color: 0xa3adbb, roughness: 0.3 },
  case:      { color: 0xb3b2aa, roughness: 0.34 },
  bearing:   { color: 0x9ea9b0, roughness: 0.26 },
  tool:      { color: 0x8e98a6, roughness: 0.2 },
  stainless: { color: 0xe1e6ec, roughness: 0.12 },
};

export function initStudio({ canvas }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  // warm the studio a touch so it matches the golden-hour hero
  room.traverse((o) => { if (o.material && o.material.color && o.material.emissive === undefined) o.material.color.multiply(new THREE.Color(1, 0.94, 0.86)); });
  scene.environment = pmrem.fromScene(room, 0.03).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  const key = new THREE.DirectionalLight(0xffd2a0, 2.2); key.position.set(4, 6, 3); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
  key.shadow.radius = 6;
  const rim = new THREE.DirectionalLight(0x9fd0ff, 1.4); rim.position.set(-5, 2.5, -4);
  scene.add(key, rim, new THREE.HemisphereLight(0xcdd8ff, 0x2a2018, 0.4));

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.35 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor);

  /* ---------- Specimen ---------- */
  const holder = new THREE.Group(); scene.add(holder);
  const endCanvas = document.createElement('canvas'); endCanvas.width = endCanvas.height = 1024;
  const endTex = new THREE.CanvasTexture(endCanvas); endTex.colorSpace = THREE.SRGBColorSpace; endTex.anisotropy = 8;
  const endMat = new THREE.MeshStandardMaterial({ map: endTex, metalness: 0.5, roughness: 0.4 });
  const paintMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.15 });
  const bodyMat = F.steelMaterial({ color: 0xaab1b9, roughness: 0.3 });

  let current = { form: 'round', grade: null };
  function build(form) {
    holder.clear();
    let body, cap, ring, len;
    if (form === 'round') {
      len = 3.0; const r = 0.85;
      body = new THREE.Mesh(F.roundBarGeometry(r, len, 0.05, 128), bodyMat);
      cap = new THREE.Mesh(new THREE.CircleGeometry(r - 0.05, 96), endMat);
      ring = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.004, r + 0.004, 0.32, 96, 1, true), paintMat); ring.rotation.z = Math.PI / 2;
      body.position.y = r; cap.position.set(len / 2 + 0.003, r, 0); ring.position.set(len / 2 - 0.22, r, 0);
    } else {
      const dims = form === 'square' ? [3.0, 1.5, 1.5] : form === 'flat' ? [3.2, 0.55, 1.9] : [2.2, 1.7, 1.9];
      len = dims[0];
      body = new THREE.Mesh(F.box(...dims, 0.05), bodyMat);
      const s = Math.min(dims[1], dims[2]) - 0.1;
      cap = new THREE.Mesh(new THREE.PlaneGeometry(dims[2] - 0.1, dims[1] - 0.1), endMat);
      cap.material.map.repeat.set(1, 1);
      ring = new THREE.Mesh(F.box(0.3, dims[1] + 0.01, dims[2] + 0.01, 0.02), paintMat);
      body.position.y = dims[1] / 2; cap.position.set(len / 2 + 0.003, dims[1] / 2, 0); ring.position.set(len / 2 - 0.2, dims[1] / 2, 0);
      void s;
    }
    cap.rotation.y = Math.PI / 2;
    [body, ring].forEach((m) => { m.castShadow = m.receiveShadow = true; });
    holder.add(body, cap, ring);
    holder.position.x = -0.25;
  }

  function setSpecimen({ grade, form }) {
    if (form && form !== current.form) { current.form = form; build(form); }
    if (grade) {
      current.grade = grade;
      const fin = FINISH[grade.fam] || FINISH.alloy;
      bodyMat.color.setHex(fin.color); bodyMat.roughness = fin.roughness;
      const fam = FAMILIES.find((f) => f.id === grade.fam);
      F.drawEndFace(endCanvas, grade.code, grade.paint, { sub: grade.sub || grade.eq?.[0], light: grade.fam === 'stainless' ? '#f1f4f7' : '#d9dee4', dark: grade.fam === 'tool' ? '#6f7884' : '#8c949e' });
      endTex.needsUpdate = true;
      paintMat.color.set(grade.paint);
      void fam;
    }
    needsRender = true;
  }
  build('round');

  /* ---------- Interaction ---------- */
  let yaw = -0.75, pitch = 0.32, targetYaw = yaw, dragging = false, lastX = 0, lastY = 0, autoSpin = true, needsRender = true;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; autoSpin = false; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    targetYaw += (e.clientX - lastX) * 0.01; pitch = Math.min(0.9, Math.max(0.05, pitch + (e.clientY - lastY) * 0.005));
    lastX = e.clientX; lastY = e.clientY; needsRender = true;
  });
  const end = () => { dragging = false; setTimeout(() => { autoSpin = true; }, 2500); };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); needsRender = true;
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  let visible = false, raf = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function loop() {
    raf = requestAnimationFrame(loop);
    if (autoSpin && !reduce) { targetYaw += 0.0035; needsRender = true; }
    yaw += (targetYaw - yaw) * 0.12;
    if (!needsRender && Math.abs(targetYaw - yaw) < 0.0005) return;
    needsRender = false;
    const d = 8.2;
    camera.position.set(Math.sin(yaw) * Math.cos(pitch) * d, 0.9 + Math.sin(pitch) * d, Math.cos(yaw) * Math.cos(pitch) * d);
    camera.lookAt(0, 0.8, 0);
    renderer.render(scene, camera);
  }
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) loop(); else if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
  }).observe(canvas);

  /* ---------- Product studio shots ---------- */
  function shoot(list, w = 720, h = 450) {
    const out = {};
    const prevSize = new THREE.Vector2(); renderer.getSize(prevSize);
    const prevAspect = camera.aspect; const prevPR = renderer.getPixelRatio();
    holder.visible = false;
    renderer.setPixelRatio(1.5); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const bright = F.steelMaterial({ color: 0xc3c9d0, roughness: 0.28 });
    const scaleM = F.millScaleMaterial(0x40454c);
    const blueM = F.millScaleMaterial(0x353c46);
    const strap = new THREE.MeshStandardMaterial({ color: 0xff8a3d, roughness: 0.5, metalness: 0.2 });
    const strapAround = (g, n, size) => {
      const bb = new THREE.Box3().setFromObject(g); const sz = bb.getSize(new THREE.Vector3()); const c = bb.getCenter(new THREE.Vector3());
      for (let i = 0; i < n; i++) {
        const x = c.x + (i - (n - 1) / 2) * sz.x * 0.32;
        const s = new THREE.Mesh(F.box(0.06, sz.y + 0.03, sz.z + 0.03, 0.01), strap); s.position.set(x, c.y, c.z); g.add(s);
      }
      void size;
      return g;
    };
    const hexBundle = () => {
      const g = new THREE.Group(); const geo = F.hexBarGeometry(0.2, 4.4);
      [[0, 0], [0.4, 0], [-0.4, 0], [0.2, 0.35], [-0.2, 0.35], [0, 0.7]].forEach(([z, y]) => {
        const m = new THREE.Mesh(geo, bright); m.position.set(Math.random() * 0.2, y + 0.18, z); m.rotation.x = Math.PI / 6; m.castShadow = true; g.add(m);
      });
      return g;
    };
    const makers = {
      'alloy-plates': () => F.plateStack(bright, { w: 2.6, d: 1.9, ts: [0.3, 0.22, 0.16, 0.12] }),
      'steel-plates': () => F.plateStack(scaleM, { w: 2.8, d: 2.0, ts: [0.08, 0.06, 0.1, 0.05, 0.08, 0.12, 0.06] }),
      flats: () => F.flatsBundle(blueM, { w: 0.62, t: 0.1, L: 4.0, cols: 3, rows: 5 }),
      rounds: () => { const g = F.roundBundle(bright, { r: 0.24, L: 4.2 }); g.position.y = g.userData.h; return g; },
      bars: hexBundle,
      squares: () => F.squareBundle(bright, { s: 0.34, L: 4.0 }),
      blocks: () => F.blockPair(scaleM),
      imported: () => { const g = F.roundBundle(bright, { r: 0.22, L: 4.2 }); g.position.y = g.userData.h; const w = new THREE.Group(); w.add(g); return strapAround(w, 3); },
      local: () => { const w = new THREE.Group(); const a = F.squareBundle(blueM, { s: 0.3, L: 4.0 }); w.add(a); return strapAround(w, 2); },
    };
    list.forEach((id) => {
      const make = makers[id]; if (!make) return;
      const g = make();
      g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      scene.add(g);
      const bb = new THREE.Box3().setFromObject(g); const c = bb.getCenter(new THREE.Vector3()); const sz = bb.getSize(new THREE.Vector3());
      g.position.x -= c.x; g.position.z -= c.z;
      const radius = sz.length() / 2;
      const dist = radius / Math.sin((camera.fov * Math.PI) / 360) * 0.62;
      camera.position.set(dist * 0.62, c.y + dist * 0.42, dist * 0.68);
      camera.lookAt(0, c.y * 0.8, 0);
      renderer.render(scene, camera);
      out[id] = renderer.domElement.toDataURL('image/webp', 0.86);
      scene.remove(g);
    });
    holder.visible = true;
    renderer.setPixelRatio(prevPR); renderer.setSize(prevSize.x, prevSize.y, false);
    camera.aspect = prevAspect; camera.updateProjectionMatrix();
    needsRender = true;
    return out;
  }

  return { setSpecimen, shoot, resize };
}
