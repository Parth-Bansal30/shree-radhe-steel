/* Hero world: a steel yard at golden hour.
   Scroll story (driven from app.js through `state`):
   hero → heat & sparks → x-ray / precision → grade stamp → stock assembles → truck loads and leaves.
   No external models: everything is procedural, so the page stays light. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as F from './forms.js';
import { STORY_GRADES, gradeByCode, stampSub } from './grades.js';
import { createYard } from './yard.js';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

const SUN = new THREE.Vector3(0.3, 0.12, -1).normalize();
const R = 0.62;   // hero bar radius
const L = 7.2;    // hero bar length
const BAR_Y = 0.22 + R;

const SKY = {
  gold: { horizon: [1.0, 0.6, 0.32], low: [0.86, 0.42, 0.26], mid: [0.28, 0.27, 0.42], top: [0.05, 0.075, 0.15] },
  dusk: { horizon: [0.14, 0.18, 0.26], low: [0.07, 0.09, 0.15], mid: [0.03, 0.045, 0.085], top: [0.008, 0.012, 0.025] },
};
const lin = (a) => new THREE.Color().setRGB(a[0], a[1], a[2], THREE.SRGBColorSpace); // sRGB design values → linear
const v3 = (a) => { const c = lin(a); return new THREE.Vector3(c.r, c.g, c.b); };

export async function initWorld({ canvas, state, lite = false, onProgress = () => {}, onGrade = () => {} }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, powerPreference: 'high-performance' });
  let dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 1.6);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1200);
  onProgress(0.25);

  /* ---------- Sky ---------- */
  const skyUniforms = {
    uSun: { value: SUN.clone() }, uDusk: { value: 0 },
    uHorizon: { value: v3(SKY.gold.horizon) }, uLow: { value: v3(SKY.gold.low) }, uMid: { value: v3(SKY.gold.mid) }, uTop: { value: v3(SKY.gold.top) },
    uHorizon2: { value: v3(SKY.dusk.horizon) }, uLow2: { value: v3(SKY.dusk.low) }, uMid2: { value: v3(SKY.dusk.mid) }, uTop2: { value: v3(SKY.dusk.top) },
  };
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun, uHorizon, uLow, uMid, uTop, uHorizon2, uLow2, uMid2, uTop2; uniform float uDusk;
      varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        // warm toward the sun, dusty blue-violet away from it
        float az = dot(normalize(d.xz + 1e-5), normalize(uSun.xz));
        float warm = smoothstep(-0.35, 0.95, az);
        vec3 hzW = uHorizon, loW = uLow;
        vec3 hzC = vec3(0.30, 0.30, 0.40), loC = vec3(0.16, 0.18, 0.30);
        vec3 hz = mix(mix(hzC, hzW, warm), uHorizon2, uDusk), lo = mix(mix(loC, loW, warm), uLow2, uDusk), mi = mix(uMid, uMid2, uDusk), tp = mix(uTop, uTop2, uDusk);
        vec3 col;
        if (h < 0.0) col = mix(hz * 0.55, vec3(0.03,0.028,0.03), clamp(-h * 5.0, 0.0, 1.0));
        else {
          col = mix(hz, lo, smoothstep(0.0, 0.07, h));
          col = mix(col, mi, smoothstep(0.05, 0.28, h));
          col = mix(col, tp, smoothstep(0.22, 0.75, h));
        }
        float s = max(dot(d, normalize(uSun)), 0.0);
        float day = 1.0 - uDusk;
        col += vec3(1.0, 0.62, 0.34) * pow(s, 6.0) * 0.45 * day;
        col += vec3(1.0, 0.8, 0.55) * pow(s, 60.0) * 1.2 * day;
        col += vec3(1.0, 0.86, 0.66) * smoothstep(0.99955, 0.9998, s) * 9.0 * day;
        // faint cool stars at dusk
        float st = fract(sin(dot(floor(d.xy * 420.0 + d.z * 77.0), vec2(12.9898, 78.233))) * 43758.5453);
        col += vec3(0.6, 0.8, 1.0) * step(0.9985, st) * smoothstep(0.15, 0.5, h) * uDusk * 0.9;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), skyMat);
  sky.frustumCulled = false;
  scene.add(sky);

  /* ---------- Environment (reflections) from the same sky ---------- */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), skyMat.clone()));
  envScene.children[0].material.uniforms = THREE.UniformsUtils.clone(skyUniforms);
  const cardMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.45, 1.4), side: THREE.DoubleSide });
  const card1 = new THREE.Mesh(new THREE.PlaneGeometry(30, 6), cardMat); card1.position.set(0, 28, 6); card1.lookAt(0, 0, 0); envScene.add(card1);
  const card2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 26), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 1.0, 1.15), side: THREE.DoubleSide }));
  card2.position.set(-22, 10, 22); card2.lookAt(0, 4, 0); envScene.add(card2);
  const card3 = new THREE.Mesh(new THREE.PlaneGeometry(40, 2.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 1.1, 1.15), side: THREE.DoubleSide }));
  card3.position.set(4, 7, 30); card3.lookAt(0, 1, 0); envScene.add(card3);
  const groundEnv = new THREE.Mesh(new THREE.CircleGeometry(50, 32), new THREE.MeshBasicMaterial({ color: 0x15110e }));
  groundEnv.rotation.x = -Math.PI / 2; groundEnv.position.y = -2; envScene.add(groundEnv);
  const envRT = pmrem.fromScene(envScene, 0.015);
  scene.environment = envRT.texture;
  onProgress(0.45);

  /* ---------- Lights ---------- */
  const sun = new THREE.DirectionalLight(0xffc48a, 3.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(lite ? 1024 : 2048, lite ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 1, far: 90 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  const shadowCenter = new THREE.Vector3(-2, 0, 1);
  sun.position.copy(shadowCenter).addScaledVector(SUN, 45);
  sun.target.position.copy(shadowCenter);
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0x8094c4, 0x3a2a1f, 0.55);
  scene.add(hemi);
  const heatLight = new THREE.PointLight(0xff6a1a, 0, 7, 1.6);
  scene.add(heatLight);
  const scanLight = new THREE.PointLight(0x7fd8ff, 0, 5, 1.5);
  scene.add(scanLight);

  scene.fog = new THREE.Fog(0xb07050, 40, 300);

  /* ---------- Ground, road, grid ---------- */
  const concrete = F.concreteTexture(); concrete.repeat.set(90, 90);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshPhysicalMaterial({ color: 0x6d6258, map: concrete, roughness: 0.82, clearcoat: 0.35, clearcoatRoughness: 0.32, envMapIntensity: 0.5 }),
  );
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);

  const roadTex = (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#26252a'; g.fillRect(0, 0, 128, 512);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? 0 : 255},${Math.random() < 0.5 ? 0 : 255},255,0.03)`; g.fillRect(Math.random() * 128, Math.random() * 512, 2, 2); }
    g.fillStyle = 'rgba(240,190,110,0.75)'; g.fillRect(6, 0, 4, 512); g.fillRect(118, 0, 4, 512);
    g.fillStyle = 'rgba(235,235,230,0.8)'; g.fillRect(62, 40, 4, 220);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 70); t.anisotropy = 8;
    return t;
  })();
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 520),
    new THREE.MeshPhysicalMaterial({ map: roadTex, roughness: 0.55, clearcoat: 0.5, clearcoatRoughness: 0.25, polygonOffset: true, polygonOffsetFactor: -2, envMapIntensity: 0.6 }),
  );
  road.rotation.x = -Math.PI / 2; road.position.set(-5.2, 0.004, -210); road.receiveShadow = true;
  scene.add(road);

  const gridMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uGrid: { value: 0 }, uColor: { value: new THREE.Color(0x7fd8ff) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vP,1.0); }',
    fragmentShader: /* glsl */`
      uniform float uGrid; uniform vec3 uColor; varying vec3 vP;
      void main(){
        vec2 c = vP.xz; vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
        float line = 1.0 - min(min(g.x, g.y), 1.0);
        vec2 c2 = vP.xz / 5.0; vec2 g2 = abs(fract(c2 - 0.5) - 0.5) / fwidth(c2);
        float major = 1.0 - min(min(g2.x, g2.y), 1.0);
        float fade = 1.0 - smoothstep(4.0, 26.0, length(vP.xz));
        float a = (line * 0.35 + major * 0.8) * fade * uGrid;
        gl_FragColor = vec4(uColor * 1.4, a);
      }`,
  });
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), gridMat);
  grid.rotation.x = -Math.PI / 2; grid.position.y = 0.01;
  scene.add(grid);

  /* ---------- Hero bar ---------- */
  const heatU = { value: 0 };
  const barMat = F.steelMaterial({ color: 0xd2d7dd, roughness: 0.2 });
  barMat.transparent = true;
  barMat.onBeforeCompile = (sh) => {
    sh.uniforms.uHeat = heatU;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vLX;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLX = position.x;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vLX;\nuniform float uHeat;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float hz = smoothstep(${(L / 2 - 1.3).toFixed(2)}, ${(L / 2).toFixed(2)}, vLX);
        totalEmissiveRadiance += mix(vec3(0.9,0.12,0.01), vec3(1.0,0.72,0.32), hz * hz) * hz * hz * uHeat * 1.1;`);
  };
  const barGroup = new THREE.Group();
  const bar = new THREE.Mesh(F.roundBarGeometry(R, L, 0.06, 128), barMat);
  bar.castShadow = bar.receiveShadow = true;
  barGroup.add(bar);

  const endCanvas = document.createElement('canvas'); endCanvas.width = endCanvas.height = lite ? 512 : 1024;
  const endTex = new THREE.CanvasTexture(endCanvas); endTex.colorSpace = THREE.SRGBColorSpace; endTex.anisotropy = 8;
  const endMat = new THREE.MeshStandardMaterial({ map: endTex, metalness: 0.55, roughness: 0.42, transparent: true });
  const endCap = new THREE.Mesh(new THREE.CircleGeometry(R - 0.055, 96), endMat);
  endCap.rotation.y = Math.PI / 2; endCap.position.x = L / 2 + 0.003;
  barGroup.add(endCap);
  const paintMat = new THREE.MeshStandardMaterial({ color: 0x2f7bd8, roughness: 0.55, metalness: 0.15, transparent: true });
  const paintRing = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.004, R + 0.004, 0.26, 96, 1, true), paintMat);
  paintRing.rotation.z = Math.PI / 2; paintRing.position.x = L / 2 - 0.2;
  barGroup.add(paintRing);

  let gradeIdx = -1;
  function setGrade(i) {
    i = Math.max(0, Math.min(STORY_GRADES.length - 1, i));
    if (i === gradeIdx) return;
    gradeIdx = i;
    const g = gradeByCode(STORY_GRADES[i]);
    F.drawEndFace(endCanvas, g.code, g.paint, { sub: stampSub(g) });
    endTex.needsUpdate = true;
    paintMat.color.set(g.paint);
    onGrade(g, i);
  }
  setGrade(0);

  // X-ray: rings + longitudinal lines + inner "grain"
  const xrayMat = new THREE.LineBasicMaterial({ color: new THREE.Color(0.5, 1.4, 2.0), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  {
    const pts = [];
    const RR = R * 1.006;
    for (let x = -L / 2 + 0.06; x <= L / 2 - 0.05; x += 0.3) {
      for (let k = 0; k < 64; k++) {
        const a0 = (k / 64) * Math.PI * 2, a1 = ((k + 1) / 64) * Math.PI * 2;
        pts.push(x, Math.cos(a0) * RR, Math.sin(a0) * RR, x, Math.cos(a1) * RR, Math.sin(a1) * RR);
      }
    }
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2;
      pts.push(-L / 2 + 0.06, Math.cos(a) * RR, Math.sin(a) * RR, L / 2 - 0.06, Math.cos(a) * RR, Math.sin(a) * RR);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    barGroup.add(new THREE.LineSegments(g, xrayMat));
  }
  const grainMat = new THREE.PointsMaterial({ color: new THREE.Color(0.6, 1.5, 2.2), size: 0.03, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  {
    const n = lite ? 900 : 2600; const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const rr = Math.sqrt(Math.random()) * R * 0.97, a = Math.random() * Math.PI * 2;
      p[i * 3] = (Math.random() - 0.5) * (L - 0.1); p[i * 3 + 1] = Math.cos(a) * rr; p[i * 3 + 2] = Math.sin(a) * rr;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    barGroup.add(new THREE.Points(g, grainMat));
  }
  const scanMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 2.2, 3.2), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const scanRing = new THREE.Mesh(new THREE.TorusGeometry(R * 1.07, 0.012, 8, 128), scanMat);
  scanRing.rotation.y = Math.PI / 2;
  const scanDisc = new THREE.Mesh(new THREE.CircleGeometry(R * 1.06, 64), new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  scanDisc.rotation.y = Math.PI / 2;
  barGroup.add(scanRing, scanDisc);

  // Dimension lines + labels
  const dimMat = new THREE.LineBasicMaterial({ color: new THREE.Color(0.55, 1.3, 1.9), transparent: true, opacity: 0, depthWrite: false });
  const dimGeo = new THREE.BufferGeometry();
  {
    const y = R + 0.55, ex = L / 2 + 0.7, t = 0.12;
    const p = [
      -L / 2, y, 0, L / 2, y, 0,
      -L / 2, R + 0.12, 0, -L / 2, y + 0.16, 0, L / 2, R + 0.12, 0, L / 2, y + 0.16, 0,
      -L / 2, y, 0, -L / 2 + t, y + t * 0.6, 0, -L / 2, y, 0, -L / 2 + t, y - t * 0.6, 0,
      L / 2, y, 0, L / 2 - t, y + t * 0.6, 0, L / 2, y, 0, L / 2 - t, y - t * 0.6, 0,
      ex, -R, 0, ex, R, 0,
      L / 2 + 0.08, R, 0, ex + 0.16, R, 0, L / 2 + 0.08, -R, 0, ex + 0.16, -R, 0,
      ex, R, 0, ex - t * 0.6, R - t, 0, ex, R, 0, ex + t * 0.6, R - t, 0,
      ex, -R, 0, ex - t * 0.6, -R + t, 0, ex, -R, 0, ex + t * 0.6, -R + t, 0,
    ];
    dimGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  }
  const dimLines = new THREE.LineSegments(dimGeo, dimMat);
  barGroup.add(dimLines);
  const dimCount = dimGeo.attributes.position.count;
  const labels = [
    ['LENGTH · AS SPECIFIED', [0, R + 0.82, 0]],
    ['Ø · AS SPECIFIED', [L / 2 + 0.72, R + 0.38, 0]],
  ].map(([text, p]) => {
    const { texture, aspect } = F.makeLabelTexture(text, { size: 44 });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0, depthWrite: false }));
    s.scale.set(0.3 * aspect, 0.3, 1);
    s.position.set(...p);
    barGroup.add(s);
    return s;
  });

  barGroup.position.set(0, BAR_Y, 0);
  scene.add(barGroup);

  const timber = new THREE.MeshStandardMaterial({ color: 0x4a3324, roughness: 0.9 });
  [-2.3, 2.3].forEach((x) => {
    const s = new THREE.Mesh(F.box(0.42, 0.22, 1.7, 0.02), timber);
    s.position.set(x, 0.11, 0); s.castShadow = s.receiveShadow = true; scene.add(s);
  });
  onProgress(0.6);

  /* ---------- Sparks (GPU) ---------- */
  const sparkU = { uTime: { value: 0 }, uStrength: { value: 0 }, uOrigin: { value: new THREE.Vector3() }, uSize: { value: lite ? 5 : 6 } };
  const sparks = (() => {
    const n = lite ? 380 : 1100; const seeds = new Float32Array(n * 4); const pos = new Float32Array(n * 3);
    for (let i = 0; i < n * 4; i++) seeds[i] = Math.random();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    const m = new THREE.ShaderMaterial({
      uniforms: sparkU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute vec4 aSeed; uniform float uTime, uStrength, uSize; uniform vec3 uOrigin; varying float vK;
        void main(){
          float life = 0.45 + aSeed.w * 0.85;
          float t = mod(uTime * 0.95 + aSeed.x * 17.0, life);
          vK = t / life;
          vec3 v = vec3(1.0 + aSeed.z * 3.2, (aSeed.y - 0.25) * 3.6, (aSeed.w - 0.5) * 4.2);
          vec3 p = uOrigin + v * t + vec3(0.0, -5.2, 0.0) * t * t;
          p.y = max(p.y, 0.02);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * (1.0 - vK) * (12.0 / -mv.z) * step(0.01, uStrength) * (0.6 + aSeed.y);
        }`,
      fragmentShader: /* glsl */`
        uniform float uStrength; varying float vK;
        void main(){
          vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard;
          vec3 col = mix(vec3(1.0, 0.92, 0.7), vec3(1.0, 0.42, 0.08), smoothstep(0.0, 0.5, vK));
          col = mix(col, vec3(0.7, 0.12, 0.02), smoothstep(0.55, 1.0, vK));
          float a = (1.0 - smoothstep(0.1, 0.5, d)) * (1.0 - vK) * uStrength;
          gl_FragColor = vec4(col * 3.2, a);
        }`,
    });
    const p = new THREE.Points(g, m); p.frustumCulled = false; return p;
  })();
  scene.add(sparks);

  /* ---------- Dust motes in the sunlight ---------- */
  const dustU = { uTime: { value: 0 }, uOpacity: { value: 0.55 } };
  const dust = (() => {
    const n = lite ? 260 : 700; const p = new Float32Array(n * 3); const s = new Float32Array(n);
    for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - 0.5) * 34; p[i * 3 + 1] = Math.random() * 6 + 0.2; p[i * 3 + 2] = (Math.random() - 0.6) * 30; s[i] = Math.random(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aS', new THREE.BufferAttribute(s, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: dustU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute float aS; uniform float uTime; varying float vA;
        void main(){
          vec3 p = position; p.x += sin(uTime * 0.13 + aS * 40.0) * 0.6; p.y += sin(uTime * 0.21 + aS * 20.0) * 0.35; p.z += cos(uTime * 0.11 + aS * 30.0) * 0.5;
          vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.5 + aS * 2.5) * (14.0 / -mv.z);
          vA = 0.35 + 0.65 * sin(uTime * (0.6 + aS) + aS * 12.0) * 0.5 + 0.5;
        }`,
      fragmentShader: /* glsl */`
        uniform float uOpacity; varying float vA;
        void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vec3(1.0, 0.78, 0.52) * 1.4, (1.0 - d * 2.0) * vA * uOpacity * 0.5); }`,
    });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; return pts;
  })();
  scene.add(dust);

  /* ---------- Stock that assembles in the yard ---------- */
  const bright = F.steelMaterial({ color: 0xc3c9d0, roughness: 0.3 });
  const scale = F.millScaleMaterial(0x3d4248);
  const scaleBlue = F.millScaleMaterial(0x343b44);
  const rounds = F.roundBundle(bright, { r: 0.16, L: 5 });
  const squares = F.squareBundle(bright, { s: 0.26, L: 4.6 });
  const flats = F.flatsBundle(scaleBlue, {});
  const plates = F.plateStack(scale, {});
  const blocks = F.blockPair(scale);
  const roundsLift = rounds.userData.h;
  // yard: [x, y, z, yaw]; truck: [x, y, z, yaw] in truck space. Items with `top` are loaded by the crane.
  const items = [
    { obj: plates, yard: [-1.0, 0, -3.6, 0.12] },
    { obj: rounds, yard: [2.6, roundsLift, -3.2, 0], truck: [0.62, 1.47 + roundsLift, -0.6, Math.PI / 2], top: roundsLift, len: 5 },
    { obj: flats, yard: [0.4, 0, -6.6, 0.25] },
    { obj: squares, yard: [4.4, 0, -6.0, -0.25], truck: [0.62, 1.47, 4.5, Math.PI / 2], top: 0.79, len: 4.6 },
    { obj: blocks, yard: [-2.7, 0, -6.4, 0.5], truck: [-0.6, 1.47, 5.4, 0], top: 0.86, len: 1.1 },
  ];
  items.forEach((it, k) => {
    it.k = k;
    it.obj.position.set(it.yard[0], it.yard[1] + 9, it.yard[2]);
    it.obj.rotation.y = it.yard[3];
    it.obj.visible = false;
    it.spin = new THREE.Euler((Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.4);
    it.yardPos = new THREE.Vector3(); it.yardQuat = new THREE.Quaternion();
    scene.add(it.obj);
  });
  const barItem = { obj: barGroup, yard: [0, BAR_Y, 0, 0], truck: [-0.6, 1.47 + R, 0.9, Math.PI / 2], top: R, len: L, k: 0, yardPos: new THREE.Vector3(0, BAR_Y, 0), yardQuat: new THREE.Quaternion() };
  const cargo = [barItem, items[1], items[3], items[4]];

  /* ---------- Truck (unbranded, illustrative) ---------- */
  const truck = new THREE.Group();
  const bodyMats = [];
  const wire = new THREE.LineBasicMaterial({ color: new THREE.Color(1.6, 0.9, 0.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const addPart = (geo, mat, pos, { edges = false, rot } = {}) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(...pos); if (rot) m.rotation.set(...rot);
    m.castShadow = m.receiveShadow = true; truck.add(m);
    if (edges) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), wire); e.position.copy(m.position); e.rotation.copy(m.rotation); truck.add(e); }
    return m;
  };
  const paint = new THREE.MeshPhysicalMaterial({ color: 0x1d2730, metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12, transparent: true });
  const deckMat = new THREE.MeshPhysicalMaterial({ color: 0x2a2f35, metalness: 0.7, roughness: 0.5, transparent: true });
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xd9dde2, metalness: 1, roughness: 0.12, transparent: true });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0f1012, roughness: 0.92, transparent: true });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0b1016, metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.95 });
  const ember = new THREE.MeshStandardMaterial({ color: 0xff8a3d, emissive: 0xff6a1a, emissiveIntensity: 0.4, roughness: 0.4, transparent: true });
  const lamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.6, 3.0), transparent: true });
  const tail = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.5, 0.25, 0.15), transparent: true });
  bodyMats.push(paint, deckMat, chrome, rubber, glass, ember, lamp, tail);

  // chassis + deck
  addPart(F.box(0.28, 0.32, 12, 0.03), deckMat, [-0.55, 0.92, 1.9]);
  addPart(F.box(0.28, 0.32, 12, 0.03), deckMat, [0.55, 0.92, 1.9]);
  addPart(F.box(2.5, 0.16, 11.2, 0.03), deckMat, [0, 1.39, 2.4], { edges: true });
  for (let z = -3; z <= 7.8; z += 1.35) {
    addPart(F.box(0.08, 0.5, 0.08, 0.01), chrome, [-1.21, 1.68, z]);
    addPart(F.box(0.08, 0.5, 0.08, 0.01), chrome, [1.21, 1.68, z]);
  }
  addPart(F.box(2.5, 0.9, 0.12, 0.02), deckMat, [0, 1.85, -3.12], { edges: true }); // headboard
  // cab
  const cabShape = new THREE.Shape();
  cabShape.moveTo(0, 0.75); cabShape.lineTo(0, 3.35); cabShape.lineTo(1.45, 3.35); cabShape.lineTo(2.2, 2.25); cabShape.lineTo(2.45, 2.1); cabShape.lineTo(2.45, 0.75); cabShape.closePath();
  const cabGeo = new THREE.ExtrudeGeometry(cabShape, { depth: 2.46, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 3 });
  cabGeo.rotateY(Math.PI / 2); cabGeo.translate(-1.23, 0, -3.3);
  addPart(cabGeo, paint, [0, 0, 0], { edges: true });
  const ws = addPart(new THREE.PlaneGeometry(2.2, 1.28), glass, [0, 2.84, -3.3 - 1.86]);
  ws.lookAt(ws.position.clone().add(new THREE.Vector3(0, 0.7, -1.1))); ws.position.add(new THREE.Vector3(0, 0.7, -1.1).normalize().multiplyScalar(0.075));
  [-1, 1].forEach((sx) => {
    const sw = addPart(new THREE.PlaneGeometry(1.05, 0.8), glass, [sx * 1.3, 2.78, -4.25]);
    sw.rotation.y = sx * Math.PI / 2;
    addPart(F.box(0.02, 0.12, 2.2, 0.005), ember, [sx * 1.3, 1.6, -4.45]);
  });
  addPart(F.box(2.55, 0.42, 0.22, 0.04), chrome, [0, 1.0, -5.84]);
  addPart(F.box(1.7, 0.75, 0.05, 0.02), deckMat, [0, 1.62, -5.82]); // grille
  [-0.95, 0.95].forEach((x) => addPart(F.box(0.42, 0.16, 0.06, 0.02), lamp, [x, 1.5, -5.84]));
  [-1.05, 1.05].forEach((x) => addPart(F.box(0.3, 0.14, 0.06, 0.02), tail, [x, 1.15, 8.0]));
  // wheels
  const wheels = [];
  const tyreGeo = new THREE.CylinderGeometry(0.56, 0.56, 0.44, 40); tyreGeo.rotateZ(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.46, 24); hubGeo.rotateZ(Math.PI / 2);
  [[-4.35], [4.5], [5.85]].forEach(([z]) => [-1.08, 1.08].forEach((x) => {
    const w = new THREE.Group(); w.position.set(x, 0.56, z);
    const t = new THREE.Mesh(tyreGeo, rubber); t.castShadow = true;
    const h = new THREE.Mesh(hubGeo, chrome);
    w.add(t, h); truck.add(w); wheels.push(w);
  }));
  truck.position.set(-5.2, 0, 60);
  truck.visible = false;
  scene.add(truck);

  /* ---------- Crane + crew ---------- */
  const yard = createYard({ scene, truck, cargo, barEnd: new THREE.Vector3(L / 2, BAR_Y, 0), lite });
  onProgress(0.8);

  /* ---------- Post ---------- */
  let composer = null, bloom = null;
  const size = new THREE.Vector2();
  function makeComposer() {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.6, 1.05);
    // bloom is soft by nature: blur at half resolution (about a quarter of the cost)
    const fullSize = bloom.setSize.bind(bloom);
    bloom.setSize = (w, h) => fullSize(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)));
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }
  if (!lite) makeComposer();

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep composition on narrow screens
    camera.fov = w / h < 0.9 ? 44 : w / h < 1.3 ? 36 : 30;
    camera.updateProjectionMatrix();
    if (composer) { composer.setPixelRatio(dpr); composer.setSize(w, h); }
    size.set(w, h);
  }
  resize();
  addEventListener('resize', resize);

  /* ---------- Pointer ---------- */
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', (e) => { pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });

  /* ---------- Frame ---------- */
  const clock = new THREE.Clock();
  const tmpV = new THREE.Vector3(), tmpE = new THREE.Euler(), up = new THREE.Vector3(0, 1, 0);
  const look = new THREE.Vector3(), camPos = new THREE.Vector3(), right = new THREE.Vector3();
  const fogA = lin(SKY.gold.horizon).multiplyScalar(0.62), fogB = lin(SKY.dusk.horizon).multiplyScalar(0.9);
  let elapsed = 0, ema = 16, slowFor = 0, lastDrive = 0, wheelAngle = 0;

  // Where each item sits in the yard (with the drop-in reveal). The crane takes over the loaded ones.
  function yardPlace(it, assemble) {
    const o = it.obj;
    const a = it === barItem ? 1 : easeOut(clamp01((assemble - it.k * 0.12) / 0.5));
    o.visible = it === barItem || a > 0.001;
    it.yardPos.set(it.yard[0], lerp(it.yard[1] + 9, it.yard[1], a), it.yard[2]);
    it.yardQuat.setFromEuler(tmpE.set(it.spin ? it.spin.x * (1 - a) : 0, it.yard[3] + (it.spin ? it.spin.y * (1 - a) : 0), it.spin ? it.spin.z * (1 - a) : 0));
    if (!it.top) { o.position.copy(it.yardPos); o.quaternion.copy(it.yardQuat); }
  }

  // Scroll values arrive in steps; ease them so motion has weight
  const sm = {};
  const RATE = { load: 3.2, truckIn: 3.6, drive: 3.6, assemble: 4, grade: 8 };
  function smoothState(dt) {
    for (const k in state) {
      const v = state[k];
      if (typeof v !== 'number') continue;
      if (sm[k] === undefined || dt <= 0) { sm[k] = v; continue; }
      sm[k] += (v - sm[k]) * (1 - Math.exp(-dt * (RATE[k] || 6.5)));
    }
    return sm;
  }

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;
    const s = smoothState(dt);

    // Sky / light mood
    const dusk = s.dusk;
    skyUniforms.uDusk.value = dusk;
    scene.fog.color.copy(fogA).lerp(fogB, dusk);
    scene.fog.near = lerp(40, 18, dusk); scene.fog.far = lerp(320, 140, dusk);
    sun.intensity = 3.0 * (1 - dusk * 0.85);
    // wide yard shots are backlit: lift the sky fill and reflections a little
    const fillK = s.fill ?? 0.2;
    hemi.intensity = 0.55 * (1 - dusk * 0.6) * (1 + fillK * 1.4);
    scene.environmentIntensity = lerp(1, 0.35, dusk) * (1 + fillK * 0.45);
    renderer.toneMappingExposure = lerp(1.0, 0.85, dusk) * (s.exposure ?? 1);
    gridMat.uniforms.uGrid.value = s.grid;
    dustU.uTime.value = elapsed; dustU.uOpacity.value = 0.55 * (1 - dusk * 0.5);

    // Hero bar states
    heatU.value = s.heat;
    const x = s.xray;
    barMat.opacity = 1 - x * 0.9; endMat.opacity = 1 - x * 0.85; paintMat.opacity = 1 - x * 0.85;
    barMat.depthWrite = x < 0.5;
    xrayMat.opacity = x * 0.55; grainMat.opacity = x * 0.7;
    const scanX = -L / 2 + ((elapsed * 0.22) % 1) * L;
    scanRing.position.x = scanX; scanDisc.position.x = scanX;
    scanMat.opacity = x; scanDisc.material.opacity = x * 0.12;
    dimMat.opacity = s.dims; dimGeo.setDrawRange(0, Math.floor(dimCount * clamp01(s.dims * 1.2) / 2) * 2);
    labels.forEach((l) => { l.material.opacity = smooth(0.6, 1, s.dims); });
    setGrade(Math.round(s.grade));

    // Stock + truck
    const arrive = s.truckIn, drive = s.drive;
    truck.visible = arrive > 0.001;
    const tz = lerp(70, -0.8, easeOut(arrive)) - Math.pow(drive, 2.2) * 420;
    truck.position.z = tz;
    const moved = tz - lastDrive; lastDrive = tz;
    wheelAngle += moved / 0.56;
    wheels.forEach((w) => { w.rotation.x = wheelAngle; });
    const fade = smooth(0.25, 0.85, arrive);
    bodyMats.forEach((m) => { m.opacity = m === glass ? fade * 0.95 : fade; m.depthWrite = fade > 0.5; });
    wire.opacity = Math.sin(Math.PI * smooth(0, 0.9, arrive)) * 0.9 + drive * 0;
    truck.updateMatrixWorld();
    items.forEach((it) => yardPlace(it, s.assemble));
    yard.update(dt, elapsed, s);
    barGroup.updateMatrixWorld();

    // heat glow + sparks follow the bar end
    tmpV.set(L / 2 + 0.05, R * 0.55, 0); barGroup.localToWorld(tmpV);
    sparkU.uOrigin.value.copy(tmpV); sparkU.uTime.value = elapsed; sparkU.uStrength.value = s.sparks;
    heatLight.position.copy(tmpV).add(new THREE.Vector3(0.6, 0.4, 0.6)); heatLight.intensity = s.heat * 3 + s.sparks * 1.5;
    tmpV.set(scanX, R * 1.6, 0); barGroup.localToWorld(tmpV); scanLight.position.copy(tmpV); scanLight.intensity = x * 4;

    // Camera
    pointer.sx += (pointer.x - pointer.sx) * 0.05; pointer.sy += (pointer.y - pointer.sy) * 0.05;
    look.set(s.lx, s.ly, s.lz);
    if (s.follow > 0) {
      tmpV.copy(truck.position).add(new THREE.Vector3(0, 1.6, -2));
      look.lerp(tmpV, s.follow);
    }
    camPos.set(s.cx, s.cy + Math.sin(elapsed * 0.4) * 0.04, s.cz);
    camera.position.copy(camPos);
    camera.lookAt(look);
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    const par = s.parallax ?? 1;
    camera.position.addScaledVector(right, pointer.sx * 0.5 * par).addScaledVector(up, -pointer.sy * 0.28 * par);
    camera.lookAt(look);
    sky.position.copy(camera.position);

    if (composer && bloom) { bloom.strength = lerp(0.32, 0.85, Math.max(x, dusk * 0.6)); composer.render(dt); } else renderer.render(scene, camera);

    // adaptive quality
    ema = ema * 0.94 + dt * 1000 * 0.06;
    if (ema > 26) slowFor += dt; else slowFor = Math.max(0, slowFor - dt * 0.5);
    if (slowFor > 2.5) {
      slowFor = 0;
      if (dpr > 0.85) { dpr = Math.max(0.75, dpr - 0.25); renderer.setPixelRatio(dpr); resize(); }
      else if (composer) { composer = null; }
    }
  }

  // Warm up shaders before the first visible frame
  try { await renderer.compileAsync(scene, camera); } catch { /* older drivers */ }
  frame();
  onProgress(1);

  let running = false;
  return {
    start() { if (running) return; running = true; clock.getDelta(); renderer.setAnimationLoop(frame); },
    stop() { running = false; renderer.setAnimationLoop(null); },
    render: frame,
    debug: { renderer, scene, camera, get composer() { return composer; } },
    get running() { return running; },
  };
}
