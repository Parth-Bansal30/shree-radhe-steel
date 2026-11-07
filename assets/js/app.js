/* Shree Radhe Steel Industries — site behaviour (v2)
   No trackers, no API keys. GSAP, ScrollTrigger and Lenis load from CDNs; everything degrades without them. */
import { FAMILIES } from './grades.js';
import { initCatalog } from './catalog.js';

const BUSINESS = {
  whatsapp: '919911194545',
  phoneDisplay: '+91 99111 94545',
  phoneTel: '+919911194545',
  email: 'shreeradhe.steel.alloys@gmail.com',
};
// Hosts that cannot receive form posts (static preview hosting). Everywhere else the form posts to
// Netlify Forms, which emails each verified submission to the business inbox.
const STATIC_HOSTS = ['github.io'];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const gsap = window.gsap;
const ST = window.ScrollTrigger;
const waLink = (t) => `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(t)}`;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

html.classList.add('js');
window.__srsReady = true;
if (gsap && ST) gsap.registerPlugin(ST);

/* ---------- Smooth scroll ---------- */
let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
  if (gsap && ST) {
    lenis.on('scroll', ST.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}
function scrollToEl(el) {
  const y = el.id === 'top' ? 0 : el;
  if (lenis) lenis.scrollTo(y, { offset: el.id === 'top' ? 0 : -84, duration: 1.4 });
  else if (el.id === 'top') scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  const el = document.getElementById(a.getAttribute('href').slice(1));
  if (!el) return;
  e.preventDefault();
  setNav(false);
  scrollToEl(el);
  history.replaceState(null, '', a.getAttribute('href'));
});

/* ---------- Split text ---------- */
function splitWords(el, { mask = true } = {}) {
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          if (mask) {
            const m = document.createElement('span'); m.className = 'wm';
            const i = document.createElement('span'); i.className = 'wi'; i.textContent = part;
            m.appendChild(i); frag.appendChild(m);
          } else {
            const w = document.createElement('span'); w.className = 'w'; w.textContent = part; frag.appendChild(w);
          }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
}
$$('[data-split]').forEach((el) => splitWords(el));
$$('[data-fill]').forEach((el) => splitWords(el, { mask: false }));

/* ---------- Header + nav ---------- */
const header = $('[data-header]');
const navToggle = $('[data-nav-toggle]');
const navMenu = $('[data-nav-menu]');
function setNav(open) {
  if (!navToggle) return;
  navToggle.setAttribute('aria-expanded', String(open));
  navMenu.classList.toggle('is-open', open);
  if (lenis) open ? lenis.stop() : lenis.start();
  document.body.style.overflow = open ? 'hidden' : '';
}
navToggle?.addEventListener('click', () => setNav(navToggle.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && navToggle?.getAttribute('aria-expanded') === 'true') { setNav(false); navToggle.focus(); } });
matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setNav(false); });
const navLinks = $$('.nav__menu a[href^="#"]');
['products', 'grades', 'why', 'story', 'ordering', 'contact', 'quote', 'supply'].forEach((id) => {
  const el = document.getElementById(id); if (!el) return;
  new IntersectionObserver(([en]) => { if (en.isIntersecting) navLinks.forEach((a) => a.setAttribute('aria-current', String(a.hash === `#${id}`))); }, { rootMargin: '-45% 0px -50% 0px' }).observe(el);
});
let lastY = scrollY;

/* ---------- Open-now (India time) ---------- */
function updateOpenStatus() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const day = get('weekday'); const mins = Number(get('hour')) * 60 + Number(get('minute'));
  const open = day !== 'Sun' && mins >= 540 && mins < 1260;
  const text = open ? 'Open now · until 9 PM'
    : day === 'Sun' ? 'Closed today · opens Mon 9 AM'
      : mins < 540 ? 'Closed · opens 9 AM today'
        : day === 'Sat' ? 'Closed · opens Mon 9 AM' : 'Closed · opens 9 AM tomorrow';
  $$('[data-open-status]').forEach((el) => { el.textContent = text; el.dataset.state = open ? 'open' : 'closed'; });
  $$('[data-open-dot]').forEach((el) => { el.dataset.state = open ? 'open' : 'closed'; });
}
updateOpenStatus(); setInterval(updateOpenStatus, 60000);

/* ---------- WhatsApp + quote links ---------- */
$$('[data-wa]').forEach((a) => { a.href = waLink(a.dataset.wa); });
$$('[data-ask]').forEach((a) => { a.href = waLink(`Hello Shree Radhe Steel, please share availability for: ${a.dataset.ask}.\nGrade: \nSize: \nQuantity: \nDelivery location: `); });
const productSelect = $('#f-product');
function preselectQuote({ product, grade, form } = {}) {
  if (product) { const o = [...productSelect.options].find((x) => x.value === product || x.text === product); if (o) productSelect.value = o.value; }
  if (grade !== undefined) $('#f-grade').value = grade;
  if (form) { const r = $(`input[name="form_type"][value="${form}"]`); if (r) r.checked = true; }
  productSelect.dispatchEvent(new Event('change', { bubbles: true }));
  setTimeout(() => $('#f-name').focus({ preventScroll: true }), reduced ? 0 : 1300);
}
$$('[data-quote]').forEach((a) => a.addEventListener('click', () => preselectQuote({ product: a.dataset.quote })));

/* ---------- Reveals + counters ---------- */
const revealIO = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); }
}), { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
$$('[data-reveal]').forEach((el) => {
  const sib = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
  el.style.setProperty('--delay', `${Math.min(sib.indexOf(el), 7) * 0.07}s`);
  revealIO.observe(el);
});
$$('[data-count]').forEach((el) => {
  if (reduced) return;
  const target = Number(el.dataset.count);
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return; io.disconnect();
    const t0 = performance.now();
    const tick = (now) => { const t = Math.min((now - t0) / 1600, 1); el.textContent = Math.round(target * (1 - Math.pow(1 - t, 4))); if (t < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, { threshold: 0.6 });
  io.observe(el);
});

/* ---------- Pointer niceties ---------- */
if (finePointer && !reduced) {
  $$('[data-glow], .pcard').forEach((el) => el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));
  $$('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', `${(x - 0.5) * 8}deg`); el.style.setProperty('--rx', `${(0.5 - y) * 6}deg`);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  });
  $$('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* =========================================================
   STORY: scroll progress → 3D state
   ========================================================= */
const story = $('[data-story]');
const chapters = $$('[data-chapter]', story);
const hudNum = $('[data-hud-num]'), hudLabel = $('[data-hud-label]'), hudBar = $('[data-hud-bar]');
const CH_NAMES = ['Shree Radhe Steel', 'Raw material', 'Precision', 'Grade', 'Supply', 'Loading', 'Delivery'];
const KEYS = ['cx', 'cy', 'cz', 'lx', 'ly', 'lz', 'dusk', 'heat', 'sparks', 'xray', 'dims', 'grid'];
const K_WIDE = [
  [10.5, 2.3, 15.5, -2.6, 1.25, 0, 0, 0, 0.14, 0, 0, 0],
  [8.4, 1.3, 5.6, 2.3, 0.85, 0.7, 0.12, 1, 1, 0, 0, 0],
  [0.4, 3.4, 18.5, -2.3, 1.0, 0, 0.88, 0, 0, 1, 1, 1],
  [8.9, 1.0, 2.5, 3.6, 0.86, 1.3, 0.3, 0, 0, 0, 0, 0.12],
  [6, 13, 20, -3.0, 0, -2.6, 0, 0, 0, 0, 0, 0],
  [11.5, 5.8, 17.5, -2.4, 1.9, 0.8, 0.02, 0, 0, 0, 0, 0],
  [7.5, 3.4, 16.5, -4.2, 1.5, 1, 0.05, 0, 0, 0, 0, 0],
  [1.6, 2.4, 17.5, -5.2, 1.6, -30, 0.18, 0, 0, 0, 0, 0],
];
const K_TALL = [
  [9.5, 2.8, 18.5, 0.4, -0.9, 0, 0, 0, 0.14, 0, 0, 0],
  [8.2, 1.6, 5.4, 3.0, 0.0, 0.3, 0.12, 1, 1, 0, 0, 0],
  [0.2, 3.6, 17.5, 0.0, -0.8, 0, 0.88, 0, 0, 1, 1, 1],
  [8.6, 1.3, 0.9, 3.6, 0.2, 0.25, 0.3, 0, 0, 0, 0, 0.12],
  [14.5, 11, 19.5, -1.2, -1.6, -2.4, 0, 0, 0, 0, 0, 0],
  [9.5, 6.5, 19, -2.2, 0.6, 1.6, 0.02, 0, 0, 0, 0, 0],
  [8, 4.4, 19.5, -4.4, -0.2, 0, 0.05, 0, 0, 0, 0, 0],
  [2.2, 2.8, 19, -5.2, 0.2, -30, 0.18, 0, 0, 0, 0, 0],
];
const state = { fill: 0.2, follow: 0, grade: 0, assemble: 0, truckIn: 0, load: 0, drive: 0, exposure: 1, parallax: 1 };
KEYS.forEach((k, i) => { state[k] = K_WIDE[0][i]; });
let storyP = 0, activeCh = -1, world = null;

// Chapter centres in page coordinates, measured once per layout change (no layout reads while scrolling)
let centers = [], storyTop = 0, storyBottom = 0;
function measureStory() {
  const y = scrollY;
  centers = chapters.map((el) => { const r = el.getBoundingClientRect(); return r.top + y + r.height / 2; });
  const sr = story.getBoundingClientRect(); storyTop = sr.top + y; storyBottom = sr.bottom + y;
}
function computeStoryP() {
  if (!centers.length) measureStory();
  const y = lenis ? lenis.scroll : scrollY;
  const vc = y + innerHeight / 2;
  const c = centers, n = c.length;
  const bottom = storyBottom - y;
  let p;
  if (vc <= c[0]) p = 0;
  else if (vc >= c[n - 1]) {
    // after the last chapter's centre, run on until the story's bottom reaches the viewport bottom
    const span = Math.max(1, storyBottom - c[n - 1] - innerHeight / 2);
    p = n - 1 + clamp01((vc - c[n - 1]) / span);
  } else {
    for (let i = 0; i < n - 1; i++) if (vc >= c[i] && vc < c[i + 1]) { p = i + (vc - c[i]) / (c[i + 1] - c[i]); break; }
  }
  storyP = p;
  return { p, inStory: bottom > innerHeight * 0.35, past: bottom < 0 };
}
addEventListener('resize', () => { centers = []; }, { passive: true });
addEventListener('load', () => { centers = []; queueTick(); });
document.fonts?.ready.then(() => { centers = []; queueTick(); });
ST?.addEventListener?.('refresh', () => { centers = []; queueTick(); });

function applyState(p) {
  const K = innerWidth / innerHeight < 0.9 ? K_TALL : K_WIDE;
  const i = Math.min(K.length - 2, Math.floor(p));
  const t = smooth(0.12, 0.88, p - i);
  KEYS.forEach((k, j) => { state[k] = lerp(K[i][j], K[i + 1][j], t); });
  state.grade = 6 * smooth(2.5, 3.45, p);
  state.assemble = smooth(3.25, 3.95, p);
  state.truckIn = smooth(4.05, 4.75, p);
  state.load = clamp01((p - 4.55) / 1.15);
  state.drive = clamp01((p - 5.9) / 0.95);
  state.follow = smooth(5.85, 6.5, p) * 0.9;
  state.fill = 0.2 + 0.7 * smooth(3.3, 4.0, p) - 0.35 * smooth(6.0, 6.8, p);
}

function storyTick() {
  const { p, inStory, past } = computeStoryP();
  applyState(p);
  const a = Math.min(chapters.length - 1, Math.round(p));
  if (a !== activeCh) {
    activeCh = a;
    chapters.forEach((el, i) => el.classList.toggle('is-active', i === a));
    hudNum.textContent = String(a).padStart(2, '0');
    hudLabel.textContent = CH_NAMES[a];
  }
  hudBar.style.transform = `scaleX(${Math.max(0.02, p / chapters.length)})`;
  html.classList.toggle('in-story', inStory && p > 0.35 && p < chapters.length - 0.1);
  story.classList.toggle('is-past', past);
  const off = past;
  $('[data-world]').classList.toggle('is-off', off);
  $('.world-fallback').classList.toggle('is-off', off);
  if (world) { if (off || document.hidden) world.running && world.stop(); else !world.running && world.start(); }
  // header hide on scroll down
  const y = scrollY;
  header.dataset.scrolled = String(y > 30);
  if (Math.abs(y - lastY) > 6) { header.classList.toggle('is-hidden', y > lastY && y > 700 && !navMenu.classList.contains('is-open')); lastY = y; }
}
let tickQueued = false;
const queueTick = () => { if (tickQueued) return; tickQueued = true; requestAnimationFrame(() => { tickQueued = false; storyTick(); }); };
addEventListener('scroll', queueTick, { passive: true });
addEventListener('resize', queueTick, { passive: true });
document.addEventListener('visibilitychange', queueTick);
storyTick();

// Readout (chapter 3) synced with the bar-end stamp
const dots = $('[data-readout-dots]');
for (let i = 0; i < 7; i++) dots.appendChild(document.createElement('i'));
function onGrade(g, i) {
  $('[data-readout-code]').textContent = g.code;
  $('[data-readout-fam]').textContent = FAMILIES.find((f) => f.id === g.fam)?.name || '';
  $('[data-readout-eq]').textContent = g.eq.slice(0, 3).map(([, v]) => v.split(' (')[0]).join(' · ');
  $$('i', dots).forEach((d, k) => { d.classList.toggle('is-on', k <= i); d.style.setProperty('--paint', g.paint); });
}

/* ---------- Loader + 3D world ---------- */
const loader = $('[data-loader]');
const loaderBar = $('[data-loader-bar]');
const loaderPct = $('[data-loader-pct]');
let shown = 0;
function setLoad(v) {
  shown = Math.max(shown, v);
  loaderBar.style.transform = `scaleX(${shown})`;
  loaderPct.textContent = Math.round(shown * 100);
}
let introDone = false;
function finishLoading() {
  if (introDone) return; introDone = true;
  setLoad(1);
  setTimeout(() => { loader.classList.add('is-done'); heroIntro(); }, 250);
}
setTimeout(finishLoading, 6000); // never block the page

function canUse3D() {
  if (reduced) return false;
  if (navigator.connection?.saveData) return false;
  if (navigator.deviceMemory && navigator.deviceMemory < 2) return false;
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

async function boot3D() {
  if (!canUse3D()) { html.classList.add('no-3d'); setLoad(0.9); finishLoading(); return; }
  const lite = innerWidth < 900 || (navigator.hardwareConcurrency || 8) <= 4;
  try {
    setLoad(0.1);
    await Promise.race([document.fonts?.load('700 60px "JetBrains Mono"'), new Promise((r) => setTimeout(r, 1500))]);
    const { initWorld } = await import('./scene.js');
    setLoad(0.2);
    world = await initWorld({ canvas: $('[data-world]'), state, lite, onProgress: (v) => setLoad(0.2 + v * 0.75), onGrade });
    html.classList.add('is-world');
    storyTick();
    world.start();
    finishLoading();
  } catch (err) {
    console.warn('3D unavailable; using static backdrop.', err);
    html.classList.add('no-3d');
    finishLoading();
  }
}
boot3D();

function heroIntro() {
  const words = $$('.hero__title .wi');
  const fades = $$('.hero [data-fade]');
  if (gsap && !reduced) {
    gsap.fromTo(words, { yPercent: 115, rotate: 4 }, { yPercent: 0, rotate: 0, duration: 1.25, ease: 'expo.out', stagger: 0.055, delay: 0.05 });
    gsap.to(fades, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, delay: 0.55 });
  } else fades.forEach((f) => { f.style.opacity = 1; f.style.transform = 'none'; });
}
if (gsap && !reduced) gsap.set($$('.hero__title .wi'), { yPercent: 115 });

/* ---------- GSAP-driven sections ---------- */
if (gsap && ST && !reduced) {
  // Titles rise word by word
  $$('[data-split]').forEach((el) => {
    if (el.closest('.hero')) return;
    const w = $$('.wi', el);
    gsap.set(w, { yPercent: 115 });
    ST.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => gsap.to(w, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.045 }) });
  });

  // Statement fills word by word
  $$('[data-fill]').forEach((el) => {
    const w = $$('.w', el);
    ST.create({
      trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: true,
      onUpdate: (s) => { const n = Math.round(s.progress * w.length); w.forEach((x, i) => x.classList.toggle('is-on', i < n)); },
    });
  });

  // Products: horizontal track pinned on desktop
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', () => {
    html.classList.add('is-pinned-x');
    const track = $('[data-track]'); const bar = $('[data-track-bar]');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const tw = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.products', pin: true, start: 'top top', end: () => `+=${dist()}`, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (s) => { bar.style.transform = `scaleX(${Math.max(0.02, s.progress)})`; } },
    });
    return () => { html.classList.remove('is-pinned-x'); tw.scrollTrigger?.kill(); tw.kill(); gsap.set(track, { x: 0 }); };
  });

  // Ordering line
  const steps = $$('.step');
  ST.create({
    trigger: '[data-steps]', start: 'top 75%', end: 'bottom 55%', scrub: true,
    onUpdate: (s) => { $('[data-steps-line]').style.transform = `scaleX(${s.progress})`; steps.forEach((el, i) => el.classList.toggle('is-on', s.progress >= i / 3.2)); },
  });
} else {
  $$('.statement__text .w').forEach((w) => w.classList.add('is-on'));
  $$('.step').forEach((s) => s.classList.add('is-on'));
  const l = $('[data-steps-line]'); if (l) l.style.transform = 'scaleX(1)';
}
addEventListener('load', () => ST?.refresh());

/* =========================================================
   CATALOGUE: grade studio, compare, products, enquiry list
   ========================================================= */
const catalog = initCatalog({ waLink, scrollToEl, lenis, reduced, canUse3D, BUSINESS });

/* =========================================================
   EMBERS (why section)
   ========================================================= */
(() => {
  const c = $('[data-embers]'); if (!c || reduced) return;
  const g = c.getContext('2d'); let w = 0, h = 0, raf = 0;
  const N = innerWidth < 700 ? 40 : 90;
  const P = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.8 + 0.4, s: Math.random() * 0.4 + 0.15, d: Math.random() * 6.28, a: Math.random() * 0.6 + 0.2 }));
  const size = () => { w = c.width = c.offsetWidth; h = c.height = c.offsetHeight; };
  size(); addEventListener('resize', size);
  const draw = () => {
    raf = requestAnimationFrame(draw);
    g.clearRect(0, 0, w, h); g.globalCompositeOperation = 'lighter';
    P.forEach((p) => {
      p.y -= p.s / h * 2.2; p.d += 0.01; p.x += Math.sin(p.d) * 0.0004;
      if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
      const x = p.x * w, y = p.y * h, fade = Math.min(1, (1 - p.y) * 3) * Math.min(1, p.y * 4);
      g.fillStyle = `rgba(255,${120 + p.r * 40 | 0},60,${p.a * 0.12 * fade})`; g.beginPath(); g.arc(x, y, p.r * 5, 0, 6.28); g.fill();
      g.fillStyle = `rgba(255,${190 + p.r * 20 | 0},140,${p.a * fade})`; g.beginPath(); g.arc(x, y, p.r, 0, 6.28); g.fill();
    });
  };
  new IntersectionObserver(([en]) => { if (en.isIntersecting && !raf) draw(); else if (!en.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; } }).observe(c);
})();

/* =========================================================
   SUPPLY MAP (illustrative)
   ========================================================= */
const CITIES = [
  ['Srinagar', 34.08, 74.8], ['Jammu', 32.73, 74.86], ['Amritsar', 31.63, 74.87], ['Ludhiana', 30.9, 75.85], ['Chandigarh', 30.73, 76.78],
  ['Shimla', 31.1, 77.17], ['Dehradun', 30.32, 78.03], ['Bikaner', 28.02, 73.31], ['Jaipur', 26.91, 75.79], ['Jodhpur', 26.24, 73.02],
  ['Udaipur', 24.58, 73.71], ['Agra', 27.18, 78.01], ['Gwalior', 26.22, 78.18], ['Lucknow', 26.85, 80.95], ['Kanpur', 26.45, 80.33],
  ['Varanasi', 25.32, 82.97], ['Patna', 25.59, 85.14], ['Siliguri', 26.73, 88.4], ['Guwahati', 26.14, 91.74], ['Shillong', 25.58, 91.89],
  ['Imphal', 24.82, 93.94], ['Agartala', 23.83, 91.29], ['Ranchi', 23.34, 85.31], ['Jamshedpur', 22.8, 86.2], ['Durgapur', 23.52, 87.31],
  ['Kolkata', 22.57, 88.36], ['Bhubaneswar', 20.3, 85.82], ['Raipur', 21.25, 81.63], ['Bilaspur', 22.08, 82.15], ['Jabalpur', 23.18, 79.95],
  ['Bhopal', 23.26, 77.41], ['Indore', 22.72, 75.86], ['Nagpur', 21.15, 79.09], ['Ahmedabad', 23.02, 72.57], ['Rajkot', 22.3, 70.8],
  ['Vadodara', 22.31, 73.18], ['Surat', 21.17, 72.83], ['Nashik', 20.0, 73.79], ['Aurangabad', 19.88, 75.34], ['Mumbai', 19.08, 72.88],
  ['Pune', 18.52, 73.86], ['Hyderabad', 17.39, 78.49], ['Visakhapatnam', 17.69, 83.22], ['Vijayawada', 16.51, 80.65], ['Goa', 15.49, 73.83],
  ['Belagavi', 15.85, 74.5], ['Hubballi', 15.36, 75.12], ['Bengaluru', 12.97, 77.59], ['Mangaluru', 12.91, 74.86], ['Chennai', 13.08, 80.27],
  ['Puducherry', 11.94, 79.81], ['Salem', 11.66, 78.15], ['Coimbatore', 11.02, 76.96], ['Kozhikode', 11.26, 75.78], ['Tiruchirappalli', 10.79, 78.7],
  ['Madurai', 9.93, 78.12], ['Kochi', 9.93, 76.27], ['Thiruvananthapuram', 8.52, 76.94], ['Faridabad', 28.41, 77.32], ['Gurugram', 28.46, 77.03],
  ['Meerut', 28.98, 77.71], ['Bareilly', 28.37, 79.43], ['Gorakhpur', 26.76, 83.37], ['Prayagraj', 25.44, 81.85], ['Kota', 25.18, 75.83],
  ['Ajmer', 26.45, 74.64], ['Jalandhar', 31.33, 75.58], ['Panipat', 29.39, 76.97], ['Hisar', 29.15, 75.72], ['Solapur', 17.66, 75.91],
  ['Kolhapur', 16.7, 74.24], ['Nellore', 14.44, 79.99], ['Kurnool', 15.83, 78.04], ['Warangal', 17.97, 79.6], ['Cuttack', 20.46, 85.88],
  ['Rourkela', 22.26, 84.85], ['Dhanbad', 23.8, 86.43], ['Bhilai', 21.21, 81.38], ['Jhansi', 25.45, 78.57], ['Sagar', 23.84, 78.74],
  ['Akola', 20.7, 77.0], ['Bhavnagar', 21.76, 72.15], ['Jamnagar', 22.47, 70.06], ['Haridwar', 29.95, 78.16], ['Silchar', 24.83, 92.78],
  ['Dibrugarh', 27.47, 94.91], ['Port Blair', 11.62, 92.73],
];
const HUBS = ['Ludhiana', 'Ahmedabad', 'Mumbai', 'Hyderabad', 'Bengaluru', 'Chennai', 'Kolkata', 'Guwahati'];
const HOME = ['New Delhi', 28.61, 77.21];
(function buildMap() {
  const svg = $('[data-map-svg]'); if (!svg) return;
  svg.setAttribute('viewBox', '0 0 600 660');
  const NS = 'http://www.w3.org/2000/svg';
  const proj = (lat, lon) => [28 + (lon - 68) * 0.92 * 20, 24 + (37 - lat) * 20];
  const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); return n; };
  const defs = el('defs', {});
  defs.innerHTML = '<linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd29a"/><stop offset="1" stop-color="#ff6a1a"/></linearGradient>';
  const gDots = el('g', {}), gArcs = el('g', {}), gLabels = el('g', {}), gRun = el('g', {});
  const [hx, hy] = proj(HOME[1], HOME[2]);
  let k = 0;
  CITIES.forEach(([name, lat, lon]) => {
    const [x, y] = proj(lat, lon); const hub = HUBS.includes(name);
    gDots.appendChild(el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: hub ? 3.6 : 2.1, class: hub ? 'map-hub' : 'map-dot' }));
    if (!hub) return;
    const left = ['Ahmedabad', 'Mumbai', 'Bengaluru'].includes(name);
    const lbl = el('text', { x: (left ? x - 8 : x + 8).toFixed(1), y: (y + 4).toFixed(1), class: 'map-label', 'text-anchor': left ? 'end' : 'start' });
    lbl.textContent = name; gLabels.appendChild(lbl);
    const dx = x - hx, dy = y - hy, len = Math.hypot(dx, dy), bend = Math.min(80, len * 0.22);
    const cx = (hx + x) / 2 - (dy / len) * bend, cy = (hy + y) / 2 + (dx / len) * bend;
    const d = `M${hx.toFixed(1)} ${hy.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    gArcs.appendChild(el('path', { d, class: 'map-arc' }));
    if (!reduced) {
      const run = el('circle', { r: 2.2, class: 'map-run' });
      const am = el('animateMotion', { dur: `${(2.6 + len / 180).toFixed(1)}s`, repeatCount: 'indefinite', path: d, begin: `${(2 + k * 0.35).toFixed(2)}s` });
      run.appendChild(am); gRun.appendChild(run);
    }
    k++;
  });
  const home = el('g', {});
  home.appendChild(el('circle', { cx: hx, cy: hy, r: 6, class: 'map-pulse', 'stroke-width': 1.5 }));
  home.appendChild(el('circle', { cx: hx, cy: hy, r: 6, class: 'map-home' }));
  const hl = el('text', { x: hx + 12, y: hy - 8, class: 'map-label map-label--home' }); hl.textContent = 'New Delhi'; home.appendChild(hl);
  svg.append(defs, gDots, gArcs, gRun, gLabels, home);
  $$('.map-arc', svg).forEach((p, i) => { p.style.setProperty('--len', p.getTotalLength().toFixed(1)); p.style.setProperty('--d', `${0.2 + i * 0.12}s`); });
  const fig = $('[data-supply-map]');
  const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { fig.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.25 });
  io.observe(fig);
})();

/* =========================================================
   QUOTATION FORM
   ========================================================= */
const form = $('[data-quote-form]');
const statusBox = $('[data-form-status]');
const submitBtn = $('[data-submit]');
const fileInput = $('#f-file');
const MAX_FILE = 7 * 1024 * 1024; // Netlify caps the whole request at 8 MB
const ALLOWED_EXT = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'dwg', 'dxf', 'xls', 'xlsx', 'doc', 'docx', 'csv'];
const host = location.hostname;
const FORM_MODE = ['localhost', '127.0.0.1', '[::1]', ''].includes(host) || host.endsWith('.localhost') || location.protocol === 'file:' ? 'local'
  : STATIC_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)) ? 'fallback' : 'netlify';

{ const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); $('#f-date').min = d.toISOString().slice(0, 10); }
function normalisePhone(v) {
  const d = v.replace(/\D/g, '');
  if (d.length === 10) return d;
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  if (d.length === 11 && d.startsWith('0')) return d.slice(1);
  return null;
}
function setError(input, msg) {
  const field = input.closest('.field'); const err = field.querySelector('.field__error');
  field.classList.toggle('has-error', !!msg); input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (err) { err.textContent = msg || ''; if (err.id) input.setAttribute('aria-describedby', err.id); }
}
function validate() {
  const errors = [];
  const name = $('#f-name'), phone = $('#f-phone'), wa = $('#f-wa'), email = $('#f-email');
  const check = (input, msg) => { setError(input, msg); if (msg) errors.push(input); };
  check(name, name.value.trim().length < 2 ? 'Please enter your name.' : '');
  check(phone, !phone.value.trim() ? 'Please enter a phone number so we can reply.' : !normalisePhone(phone.value) ? 'Enter a 10-digit Indian mobile or landline number.' : '');
  check(wa, wa.value.trim() && !normalisePhone(wa.value) ? 'Enter a valid 10-digit WhatsApp number, or leave blank.' : '');
  check(email, email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? 'That email address looks incomplete.' : '');
  check(productSelect, !productSelect.value ? 'Choose a product, or “Other / not sure”.' : '');
  const f = fileInput.files[0]; let fm = '';
  if (f) {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) fm = 'Please upload a PDF, image, DWG/DXF, Excel or Word file.';
    else if (f.size > MAX_FILE) fm = `This file is ${(f.size / 1048576).toFixed(1)} MB. The limit is 7 MB. Send larger drawings on WhatsApp or by email.`;
  }
  check(fileInput, fm);
  return errors;
}
let attempted = false;
form.addEventListener('input', () => { if (attempted) validate(); });
form.addEventListener('change', () => { if (attempted) validate(); });
const fileWrap = fileInput.closest('.file'); const fileName = $('[data-file-name]');
fileInput.addEventListener('change', () => {
  const f = fileInput.files[0]; fileWrap.classList.toggle('has-file', !!f);
  fileName.textContent = f ? `${f.name} · ${(f.size / 1048576).toFixed(1)} MB` : 'Choose a file or drop it here';
});
['dragenter', 'dragover'].forEach((t) => fileWrap.addEventListener(t, () => fileWrap.classList.add('is-drag')));
['dragleave', 'drop'].forEach((t) => fileWrap.addEventListener(t, () => fileWrap.classList.remove('is-drag')));

function enquiryLines() {
  const v = (id) => ($(id)?.value || '').trim();
  const ft = form.querySelector('input[name="form_type"]:checked')?.value || '';
  const lines = [
    ['Name', v('#f-name')], ['Company', v('#f-company')], ['Phone', v('#f-phone')], ['City / state', v('#f-city')],
    ['Product', v('#f-product')], ['Grade / spec', v('#f-grade')], ['Form', ft], ['Size', v('#f-size')], ['Quantity', v('#f-qty')],
    ['Delivery location', v('#f-loc')], ['Required by', v('#f-date')], ['Message', v('#f-msg')],
  ].filter((l) => l[1]).map((l) => `${l[0]}: ${l[1]}`);
  if (catalog.count) lines.push('', 'Enquiry list:', ...catalog.listLines());
  if (fileInput.files[0]) lines.push('', 'I will share my drawing / specification in this chat.');
  return lines;
}
const composeWhatsApp = () => waLink(['Hello Shree Radhe Steel, I would like a quotation.', '', ...enquiryLines()].join('\n'));
const composeEmail = () => `mailto:${BUSINESS.email}?subject=${encodeURIComponent('Steel enquiry from website')}&body=${encodeURIComponent(['Hello Shree Radhe Steel,', '', 'I would like a quotation.', '', ...enquiryLines()].join('\n'))}`;
$('[data-wa-from-form]').addEventListener('click', (e) => { e.preventDefault(); window.open(composeWhatsApp(), '_blank', 'noopener'); });

function showStatus(type, title, body, fallback = false) {
  statusBox.hidden = false; statusBox.dataset.type = type; statusBox.innerHTML = '';
  const h = document.createElement('h3'); h.textContent = title;
  const p = document.createElement('p'); p.textContent = body;
  statusBox.append(h, p);
  if (fallback) {
    const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:6px';
    const mk = (cls, href, text, blank) => { const a = document.createElement('a'); a.className = `btn ${cls} btn--sm`; a.href = href; a.textContent = text; if (blank) { a.target = '_blank'; a.rel = 'noopener'; } return a; };
    wrap.append(mk('btn--wa', composeWhatsApp(), 'Send on WhatsApp', true), mk('btn--line', composeEmail(), 'Send by email'), mk('btn--line', `tel:${BUSINESS.phoneTel}`, `Call ${BUSINESS.phoneDisplay}`));
    statusBox.append(wrap);
  }
  statusBox.focus({ preventScroll: true });
  if (lenis) lenis.scrollTo(statusBox, { offset: -innerHeight / 3 }); else statusBox.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
}
function setBusy(b) { submitBtn.setAttribute('aria-busy', String(b)); submitBtn.disabled = b; $('[data-submit-label]').textContent = b ? 'Sending…' : 'Submit enquiry'; }

form.addEventListener('submit', async (e) => {
  e.preventDefault(); attempted = true;
  const errors = validate();
  if (errors.length) {
    showStatus('error', 'Please check the highlighted fields', `${errors.length === 1 ? 'One field needs' : `${errors.length} fields need`} attention before we can send your enquiry.`);
    errors[0].focus(); return;
  }
  if (form.company_website.value) { form.reset(); showStatus('success', 'Enquiry received', 'Thank you. We will be in touch.'); return; }
  const name = $('#f-name').value.trim().split(' ')[0];
  const phone = normalisePhone($('#f-phone').value);
  if (FORM_MODE !== 'netlify') {
    showStatus('info', FORM_MODE === 'local' ? 'Preview mode: enquiry not sent' : 'Send your enquiry in one tap',
      FORM_MODE === 'local'
        ? 'This local copy isn\'t connected to the enquiry inbox. You can still send it on WhatsApp or by email now.'
        : 'This preview site isn\'t connected to the enquiry inbox yet. Your details are ready to send on WhatsApp or by email, with nothing to retype.', true);
    return;
  }
  setBusy(true);
  // inbox subject: what is wanted and by whom, so enquiries can be scanned at a glance
  const subj = [$('#f-product').value, $('#f-grade').value.trim()].filter(Boolean).join(' · ');
  form.subject.value = `Steel enquiry: ${subj || 'website'} from ${$('#f-name').value.trim()}`.slice(0, 140);
  const data = new FormData(form);
  if (!fileInput.files[0]) data.delete('attachment'); // never send an empty file part
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 40000); // uploads may take up to 30 s
  try {
    const res = await fetch('/', { method: 'POST', body: data, signal: ctrl.signal, headers: { Accept: 'text/html' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    form.reset(); fileInput.dispatchEvent(new Event('change')); attempted = false;
    showStatus('success', `Enquiry received. Thank you, ${name}.`, `We'll reply on ${phone.replace(/(\d{5})(\d{5})/, '$1 $2')} during business hours (Mon–Sat, 9 AM–9 PM). If it's urgent, call ${BUSINESS.phoneDisplay}.`);
  } catch {
    showStatus('error', 'Your enquiry couldn\'t be sent', 'This may be a connection problem. Your details are still in the form, so you can try again, or send the same requirement on WhatsApp in one tap.', true);
  } finally { clearTimeout(timer); setBusy(false); }
});

$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
