/* Scroll-driven steel hero.
   Stages (p = 0..5): 0 hero · 1 raw · 2 precision · 3 quality · 4 supply · 5 delivery
   Loaded lazily on capable desktops only (see main.js). */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const BLUE = new THREE.Color('#4EA1FF');
const AMBER = new THREE.Color('#F0A04B');

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const range = (p, a, b) => smooth(clamp((p - a) / (b - a)));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// Keyframe value at progress p (one value per stage 0..5)
function kf(values, p) {
  const i = Math.min(Math.floor(p), values.length - 2);
  return lerp(values[i], values[i + 1], smooth(clamp(p - i)));
}

const KEY = {
  rotY:   [-0.62, -0.42, -0.06, 0.30, 0.50, 0.62],
  rotX:   [0.40, 0.34, 0.16, 0.28, 0.30, 0.30],
  rotZ:   [-0.16, -0.10, 0.0, -0.04, 0.0, 0.0],
  rough:  [0.40, 0.52, 0.36, 0.12, 0.20, 0.20],
  sparks: [0.30, 1.0, 0.0, 0.0, 0.0, 0.0],
  camZ:   [12.5, 11.6, 12.0, 11.4, 12.8, 15.0],
  camY:   [0.6, 0.45, 0.3, 0.55, 1.6, 3.2],
  offset: [0.47, 0.47, 0.44, 0.44, 0.44, 0.40],
  idle:   [1.0, 0.7, 0.0, 0.0, 0.2, 0.2],
};

/* ---------- Procedural textures ---------- */
function brushedTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#8a8a8a'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 2600; i++) {
    const y = Math.random() * c.height;
    const v = 100 + Math.random() * 110;
    g.strokeStyle = `rgba(${v},${v},${v},${0.06 + Math.random() * 0.14})`;
    g.lineWidth = Math.random() * 1.4 + 0.2;
    const x = Math.random() * c.width;
    g.beginPath(); g.moveTo(x - 400, y); g.lineTo(x + 400 + Math.random() * 400, y + (Math.random() - 0.5) * 0.6); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function radialTexture(inner = 'rgba(0,0,0,0.75)') {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, inner); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function textSprite(text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96;
  const g = c.getContext('2d');
  g.font = '500 38px "JetBrains Mono", ui-monospace, monospace';
  if ('letterSpacing' in g) g.letterSpacing = '8px';
  g.fillStyle = '#4EA1FF'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, 50);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const s = new THREE.Sprite(mat); s.scale.set(1.5, 0.28, 1);
  return s;
}

/* ---------- Main ---------- */
export function initSteel({ canvas, container, getProgress, onReady }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.5, 9);

  // Lights (env does most of the work; these add drama)
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-4, 6, 5); scene.add(key);
  const rim = new THREE.PointLight(BLUE, 30, 14, 2); rim.position.set(3, 2, -3); scene.add(rim);
  const forge = new THREE.PointLight(AMBER, 0, 6, 2); scene.add(forge);
  const scanLight = new THREE.PointLight(0xcfe4ff, 0, 4, 2); scene.add(scanLight);

  const rig = new THREE.Group(); scene.add(rig);

  /* Billet */
  const L = 3.9, W = 1.1;
  const brush = brushedTexture();
  const steel = new THREE.MeshPhysicalMaterial({
    color: 0xb4bcc6, metalness: 1, roughness: 0.4,
    roughnessMap: brush, bumpMap: brush, bumpScale: 0.35,
    envMapIntensity: 1.0,
  });
  const billet = new THREE.Mesh(new RoundedBoxGeometry(L, W, W, 4, 0.07), steel);
  const billetPivot = new THREE.Group(); billetPivot.add(billet); rig.add(billetPivot);

  // Contact shadow
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false, opacity: 0.8 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.45; shadow.scale.set(7, 3, 1); rig.add(shadow);

  /* Dimension lines (precision) */
  const dimMat = new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0, toneMapped: false });
  const hx = L / 2, hw = W / 2, off = 0.38, ext = 0.48, tk = 0.07;
  const segs = [
    // length
    [-hx, -hw - off, hw, hx, -hw - off, hw],
    [-hx, -hw - 0.06, hw, -hx, -hw - ext, hw], [hx, -hw - 0.06, hw, hx, -hw - ext, hw],
    [-hx - tk, -hw - off - tk, hw, -hx + tk, -hw - off + tk, hw], [hx - tk, -hw - off - tk, hw, hx + tk, -hw - off + tk, hw],
    // thickness (right end)
    [hx + off, -hw, hw, hx + off, hw, hw],
    [hx + 0.06, -hw, hw, hx + ext, -hw, hw], [hx + 0.06, hw, hw, hx + ext, hw, hw],
    [hx + off - tk, -hw - tk, hw, hx + off + tk, -hw + tk, hw], [hx + off - tk, hw - tk, hw, hx + off + tk, hw + tk, hw],
    // width (top of right end)
    [hx, hw + off, -hw, hx, hw + off, hw],
    [hx, hw + 0.06, -hw, hx, hw + ext, -hw], [hx, hw + 0.06, hw, hx, hw + ext, hw],
  ];
  const dimGeo = new THREE.BufferGeometry();
  dimGeo.setAttribute('position', new THREE.Float32BufferAttribute(segs.flat(), 3));
  const dims = new THREE.LineSegments(dimGeo, dimMat); billet.add(dims);
  const dimCount = segs.length * 2;

  // Centre line (dashed)
  const axisGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-hx - 0.6, 0, 0), new THREE.Vector3(hx + 0.6, 0, 0)]);
  const axisMat = new THREE.LineDashedMaterial({ color: BLUE, dashSize: 0.14, gapSize: 0.09, transparent: true, opacity: 0, toneMapped: false, depthTest: false });
  const axis = new THREE.Line(axisGeo, axisMat); axis.computeLineDistances(); billet.add(axis);

  const labels = [
    ['LENGTH', 0, -hw - off - 0.22, hw],
    ['THICKNESS', hx + off + 0.95, 0, hw],
    ['WIDTH', hx, hw + off + 0.24, 0],
  ].map(([text, x, y, z]) => { const s = textSprite(text); s.position.set(x, y, z); billet.add(s); return s; });

  /* Scan frame (quality) */
  const scan = new THREE.Group();
  const frameSize = W + 0.32;
  const frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(0.02, frameSize, frameSize)),
    new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0, toneMapped: false }),
  );
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(frameSize, frameSize),
    new THREE.MeshBasicMaterial({ map: radialTexture('rgba(120,185,255,1)'), color: BLUE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
  );
  glow.rotation.y = Math.PI / 2;
  scan.add(frame, glow); billet.add(scan);

  /* Stack (supply) */
  const stack = new THREE.Group(); rig.add(stack);
  const pieceMat = steel.clone(); pieceMat.roughness = 0.28;
  const PL = 3.3;
  const pieces = [];
  const addPiece = (geo, to, rotTo = new THREE.Euler()) => {
    const m = new THREE.Mesh(geo, pieceMat);
    const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.2, Math.random() - 0.5).normalize();
    m.userData = {
      to, rotTo,
      from: to.clone().add(dir.multiplyScalar(5 + Math.random() * 3)),
      rotFrom: new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3),
    };
    stack.add(m); pieces.push(m);
  };
  const plateGeo = new RoundedBoxGeometry(PL, 0.14, 1.5, 2, 0.02);
  const squareGeo = new RoundedBoxGeometry(PL, 0.42, 0.42, 2, 0.03);
  const roundGeo = new THREE.CylinderGeometry(0.22, 0.22, PL, 40, 1);
  [-1.02, -0.87, -0.72].forEach((y) => addPiece(plateGeo, new THREE.Vector3(0, y, 0)));
  [-0.5, 0, 0.5].forEach((z) => addPiece(squareGeo, new THREE.Vector3(0, -0.44, z)));
  [-0.46, 0, 0.46].forEach((z) => addPiece(roundGeo, new THREE.Vector3(0, -0.01, z), new THREE.Euler(0, 0, Math.PI / 2)));
  stack.visible = false;

  /* Route (delivery) */
  const route = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -1.1, 0.6), new THREE.Vector3(1.4, -1.1, -1.6), new THREE.Vector3(0.6, -1.1, -5.5),
    new THREE.Vector3(2.6, -1.1, -10.5), new THREE.Vector3(1.2, -1.1, -19),
  ]);
  const ROUTE_N = 240;
  const routeLine = new THREE.Mesh(
    new THREE.TubeGeometry(route, ROUTE_N, 0.022, 6, false),
    new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.85, toneMapped: false }),
  );
  const routeIndexCount = routeLine.geometry.index.count;
  routeLine.geometry.setDrawRange(0, 0); rig.add(routeLine);
  const PULSES = 28;
  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PULSES * 3), 3));
  const pulses = new THREE.Points(pulseGeo, new THREE.PointsMaterial({ color: 0xbfe0ff, size: 0.16, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  rig.add(pulses);

  /* Sparks (raw) */
  const SPARKS = 280;
  const sPos = new Float32Array(SPARKS * 3), sVel = new Float32Array(SPARKS * 3), sLife = new Float32Array(SPARKS), sMax = new Float32Array(SPARKS);
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  sparkGeo.setAttribute('aLife', new THREE.BufferAttribute(sLife, 1));
  const sparkMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uScale: { value: 1 }, uHot: { value: new THREE.Color('#FFF2D6') }, uWarm: { value: AMBER } },
    vertexShader: `
      attribute float aLife; varying float vLife; uniform float uScale;
      void main() {
        vLife = aLife;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (aLife > 0.0 ? (2.0 + 5.0 * aLife) : 0.0) * uScale / -mv.z * 8.0;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vLife; uniform vec3 uHot; uniform vec3 uWarm;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d) * vLife;
        gl_FragColor = vec4(mix(uWarm, uHot, vLife * vLife), a);
      }`,
  });
  const sparks = new THREE.Points(sparkGeo, sparkMat); sparks.frustumCulled = false; scene.add(sparks);
  const emitLocal = new THREE.Vector3(hx, -hw + 0.08, hw - 0.1);
  const emitWorld = new THREE.Vector3(), axisWorld = new THREE.Vector3();
  let spawnAcc = 0, nextSpark = 0;

  /* Dust */
  const DUST = 260;
  const dPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) { dPos[i * 3] = (Math.random() - 0.5) * 16; dPos[i * 3 + 1] = (Math.random() - 0.5) * 9; dPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2; }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x8fa3bf, size: 0.025, transparent: true, opacity: 0.35, depthWrite: false }));
  scene.add(dust);

  /* Pointer */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointer = (e) => { pointer.tx = (e.clientX / innerWidth) * 2 - 1; pointer.ty = (e.clientY / innerHeight) * 2 - 1; };
  addEventListener('pointermove', onPointer, { passive: true });

  /* Size */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    sparkMat.uniforms.uScale.value = renderer.getPixelRatio() * (h / 900);
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  /* Loop control */
  let running = false, visible = true, inView = true, raf = 0, last = performance.now();
  const clock = { t: 0 };
  const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; update(); }, { threshold: 0 });
  io.observe(container);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; update(); });
  function update() {
    const should = visible && inView;
    if (should && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frameLoop); }
    if (!should && running) { running = false; cancelAnimationFrame(raf); }
  }

  // Simple adaptive quality: drop pixel ratio if frames are slow
  let perfFrames = 0, perfTime = 0, degraded = false;
  let sp = 0; // smoothed progress
  const tmpV = new THREE.Vector3();

  function frameLoop(now) {
    if (!running) return;
    raf = requestAnimationFrame(frameLoop);
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    clock.t += dt;
    render(dt);

    if (!degraded && perfFrames < 120) {
      perfFrames++; perfTime += dt;
      if (perfFrames === 120 && perfTime / 120 > 1 / 40) {
        degraded = true; dpr = 1; renderer.setPixelRatio(dpr); resize(); dust.visible = false;
      }
    }
  }

  function render(dt) {
    const target = clamp(getProgress(), 0, 5);
    sp += (target - sp) * Math.min(1, dt * 6);
    const p = sp, t = clock.t;

    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);

    // Camera + rig placement (object sits in right half of viewport)
    camera.position.z = kf(KEY.camZ, p);
    camera.position.y = kf(KEY.camY, p);
    camera.lookAt(0, 0, 0);
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
    rig.position.x = halfW * kf(KEY.offset, p);
    rig.rotation.y = pointer.x * 0.22;
    rig.rotation.x = pointer.y * 0.10;

    // Billet pose
    const idle = kf(KEY.idle, p);
    billetPivot.rotation.set(
      kf(KEY.rotX, p) + Math.sin(t * 0.5) * 0.03 * idle,
      kf(KEY.rotY, p) + Math.sin(t * 0.22) * 0.28 * idle,
      kf(KEY.rotZ, p),
    );
    billetPivot.position.y = Math.sin(t * 0.8) * 0.05 * idle;
    steel.roughness = kf(KEY.rough, p);

    // Precision: draw dimension lines in
    const dimA = range(p, 1.5, 2.1) * (1 - range(p, 2.7, 3.2));
    dims.geometry.setDrawRange(0, Math.floor(dimCount * clamp(range(p, 1.4, 2.0) * 1.0001)) & ~1);
    dimMat.opacity = dimA;
    axisMat.opacity = dimA * 0.6;
    labels.forEach((s, i) => { s.material.opacity = range(p, 1.7 + i * 0.08, 2.05 + i * 0.08) * (1 - range(p, 2.6, 3.0)); });

    // Quality: scan sweep
    const scanA = range(p, 2.5, 2.8) * (1 - range(p, 3.4, 3.65));
    const scanT = clamp((p - 2.55) / 0.9);
    scan.position.x = lerp(-hx - 0.2, hx + 0.2, smooth(scanT));
    frame.material.opacity = scanA;
    glow.material.opacity = scanA * 0.55;
    scan.getWorldPosition(tmpV);
    scanLight.position.copy(tmpV).add(new THREE.Vector3(0, 0.6, 1.2));
    scanLight.intensity = scanA * 22;

    // Supply: billet resolves into a stack
    const shrink = range(p, 3.25, 3.75);
    const s = Math.max(0.0001, 1 - shrink);
    billetPivot.scale.setScalar(s);
    billetPivot.visible = s > 0.002;
    const assemble = range(p, 3.3, 4.05);
    stack.visible = assemble > 0.001;
    if (stack.visible) {
      pieces.forEach((m, i) => {
        const a = easeOut(clamp(assemble * 1.6 - i * 0.07));
        const u = m.userData;
        m.position.lerpVectors(u.from, u.to, a);
        m.rotation.set(lerp(u.rotFrom.x, u.rotTo.x, a), lerp(u.rotFrom.y, u.rotTo.y, a), lerp(u.rotFrom.z, u.rotTo.z, a));
        m.scale.setScalar(lerp(0.6, 1, a));
      });
      stack.rotation.set(0.0, lerp(-1.2, -0.72, assemble) + Math.sin(t * 0.25) * 0.04, 0);
    }

    // Delivery: route draws out, stack pulls back along it
    const d = range(p, 4.15, 5.0);
    routeLine.geometry.setDrawRange(0, Math.floor((routeIndexCount / 6) * d) * 6);
    routeLine.material.opacity = 0.85 * range(p, 4.1, 4.3);
    const along = route.getPointAt(clamp(d * 0.12));
    stack.position.set(along.x, 0, along.z - 0.6);
    pulses.material.opacity = d * 0.9;
    if (d > 0) {
      const arr = pulseGeo.attributes.position.array;
      for (let i = 0; i < PULSES; i++) {
        const u = ((i / PULSES + t * 0.06) % 1) * d;
        const pt = route.getPointAt(u);
        arr[i * 3] = pt.x; arr[i * 3 + 1] = pt.y + 0.02; arr[i * 3 + 2] = pt.z;
      }
      pulseGeo.attributes.position.needsUpdate = true;
    }
    shadow.material.opacity = 0.8 * (1 - d * 0.6);
    shadow.position.x = stack.visible ? stack.position.x * assemble : 0;

    // Raw: sparks
    const sparkAmt = kf(KEY.sparks, p) * (billetPivot.visible ? 1 : 0);
    billet.updateWorldMatrix(true, false);
    emitWorld.copy(emitLocal); billet.localToWorld(emitWorld);
    axisWorld.set(1, 0, 0).transformDirection(billet.matrixWorld);
    forge.position.copy(emitWorld).add(tmpV.set(0.4, 0.1, 0.6));
    forge.intensity = sparkAmt * (6 + Math.random() * 3);

    spawnAcc += dt * 170 * sparkAmt;
    while (spawnAcc >= 1) {
      spawnAcc -= 1;
      const i = nextSpark; nextSpark = (nextSpark + 1) % SPARKS;
      sPos[i * 3] = emitWorld.x; sPos[i * 3 + 1] = emitWorld.y; sPos[i * 3 + 2] = emitWorld.z;
      const sp0 = 2.2 + Math.random() * 2.6;
      sVel[i * 3] = axisWorld.x * sp0 + (Math.random() - 0.5) * 1.6;
      sVel[i * 3 + 1] = axisWorld.y * sp0 + Math.random() * 2.2 - 0.4;
      sVel[i * 3 + 2] = axisWorld.z * sp0 + (Math.random() - 0.3) * 1.8;
      sMax[i] = 0.5 + Math.random() * 0.7; sLife[i] = 1;
    }
    for (let i = 0; i < SPARKS; i++) {
      if (sLife[i] <= 0) continue;
      sLife[i] -= dt / sMax[i];
      if (sLife[i] <= 0) { sLife[i] = 0; continue; }
      sVel[i * 3 + 1] -= 7.5 * dt;
      sPos[i * 3] += sVel[i * 3] * dt; sPos[i * 3 + 1] += sVel[i * 3 + 1] * dt; sPos[i * 3 + 2] += sVel[i * 3 + 2] * dt;
    }
    sparkGeo.attributes.position.needsUpdate = true;
    sparkGeo.attributes.aLife.needsUpdate = true;

    // Dust drift
    if (dust.visible) { dust.rotation.y = t * 0.01; dust.position.y = Math.sin(t * 0.1) * 0.1; }

    // Rim light breathes; brighter on polish
    rim.intensity = 26 + Math.sin(t * 0.6) * 4 + (1 - steel.roughness) * 6;

    renderer.render(scene, camera);
  }

  // First frame, then reveal
  render(0.016);
  onReady?.();
  update();

  return {
    dispose() {
      running = false; cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect(); removeEventListener('pointermove', onPointer);
      renderer.dispose();
    },
  };
}
