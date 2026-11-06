/* Shree Radhe Steel Industries — site behaviour
   No third-party trackers, no API keys. */

const BUSINESS = {
  whatsapp: '919911194545',
  phoneDisplay: '+91 99111 94545',
  phoneTel: '+919911194545',
  email: 'shreeradhe.steel.alloys@gmail.com',
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const waLink = (text) => `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(text)}`;

document.documentElement.classList.add('js');
window.__srsReady = true;

/* ---------- Load-in ---------- */
function markLoaded() {
  $$('.hero__title .reveal-line > span').forEach((el, i) => el.style.setProperty('--i', i));
  requestAnimationFrame(() => document.body.classList.add('is-loaded'));
}
if (document.fonts && document.fonts.ready) {
  Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 600))]).then(markLoaded);
} else {
  markLoaded();
}

/* ---------- Header + nav ---------- */
const header = $('[data-header]');
const navToggle = $('[data-nav-toggle]');
const navMenu = $('[data-nav-menu]');

function setNav(open) {
  navToggle.setAttribute('aria-expanded', String(open));
  navMenu.classList.toggle('is-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
navToggle?.addEventListener('click', () => setNav(navToggle.getAttribute('aria-expanded') !== 'true'));
navMenu?.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navToggle?.getAttribute('aria-expanded') === 'true') { setNav(false); navToggle.focus(); }
});
matchMedia('(min-width: 900px)').addEventListener('change', (e) => { if (e.matches) setNav(false); });

// Highlight current section in nav
const navLinks = $$('.nav__menu a');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.setAttribute('aria-current', String(a.hash === `#${entry.target.id}`)));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
['products', 'why', 'story', 'ordering', 'contact', 'quote', 'supply'].forEach((id) => {
  const el = document.getElementById(id); if (el) sectionObserver.observe(el);
});

/* ---------- Reveal on scroll ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('is-in'); revealObserver.unobserve(entry.target); }
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

$$('[data-reveal]').forEach((el) => {
  const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
  el.style.setProperty('--delay', `${Math.min(siblings.indexOf(el), 6) * 0.06}s`);
  revealObserver.observe(el);
});

/* ---------- Count-up (40+) ---------- */
$$('[data-count]').forEach((el) => {
  if (reducedMotion.matches) return;
  const target = Number(el.dataset.count);
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / 1400, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, { threshold: 0.5 });
  io.observe(el);
});

/* ---------- Open-now status (India time) ---------- */
function updateOpenStatus() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const day = get('weekday');
  const mins = Number(get('hour')) * 60 + Number(get('minute'));
  const open = day !== 'Sun' && mins >= 9 * 60 && mins < 21 * 60;
  let text;
  if (open) text = 'Open now · until 9 PM';
  else if (day === 'Sun') text = 'Closed today · opens Mon 9 AM';
  else if (mins < 9 * 60) text = 'Closed · opens 9 AM today';
  else text = day === 'Sat' ? 'Closed · opens Mon 9 AM' : 'Closed · opens 9 AM tomorrow';
  $$('[data-open-status]').forEach((el) => { el.textContent = text; el.dataset.state = open ? 'open' : 'closed'; });
}
updateOpenStatus();
setInterval(updateOpenStatus, 60_000);

/* ---------- Product actions ---------- */
$$('[data-ask]').forEach((a) => {
  a.href = waLink(`Hello Shree Radhe Steel, please share availability for: ${a.dataset.ask}.\nGrade: \nSize: \nQuantity: \nDelivery location: `);
});

const productSelect = $('#f-product');
$$('[data-quote]').forEach((a) => {
  a.addEventListener('click', () => {
    const value = a.dataset.quote;
    const opt = [...productSelect.options].find((o) => o.value === value || o.text === value);
    if (opt) productSelect.value = opt.value;
    productSelect.dispatchEvent(new Event('change'));
    setTimeout(() => $('#f-name').focus({ preventScroll: true }), reducedMotion.matches ? 0 : 700);
  });
});

/* ---------- Card tilt + sheen (desktop pointers only) ---------- */
if (finePointer.matches && !reducedMotion.matches) {
  $$('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
      card.style.setProperty('--ry', `${(x - 0.5) * 18}deg`);
      card.style.setProperty('--rx', `${(0.5 - y) * 12}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

/* ---------- Stage: scroll progress, story steps, HUD ---------- */
const stage = $('[data-stage]');
const stageSteps = $$('[data-stage-step]', stage);
const hudLabel = $('[data-hud-label]');
const hudTicks = $$('.stage__ticks i');
const STAGE_NAMES = ['Raw material', 'Raw material', 'Precision', 'Quality', 'Supply', 'Delivery'];
let stageProgress = 0;

function computeStageProgress() {
  const vc = innerHeight / 2;
  const centers = stageSteps.map((el) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; });
  let p = 0;
  if (vc <= centers[0]) p = 0;
  else if (vc >= centers[centers.length - 1]) p = centers.length - 1;
  else {
    for (let i = 0; i < centers.length - 1; i++) {
      if (vc >= centers[i] && vc < centers[i + 1]) { p = i + (vc - centers[i]) / (centers[i + 1] - centers[i]); break; }
    }
  }
  stageProgress = p;
  const active = Math.round(p);
  stageSteps.forEach((el, i) => el.classList.toggle('is-active', i === active && i > 0));
  const n = Math.max(1, active);
  if (hudLabel) hudLabel.textContent = `0${n} / 05 · ${STAGE_NAMES[active]}`;
  hudTicks.forEach((t, i) => t.classList.toggle('is-on', i < n));
}

let scrollQueued = false;
function onScroll() {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    scrollQueued = false;
    header.dataset.scrolled = String(scrollY > 24);
    computeStageProgress();
  });
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll, { passive: true });
onScroll();

/* ---------- Lazy 3D hero ---------- */
function canUse3D() {
  if (reducedMotion.matches) return false;
  if (!matchMedia('(min-width: 900px)').matches) return false;
  if (navigator.connection && navigator.connection.saveData) return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

function load3D() {
  if (!canUse3D()) return;
  import('./hero3d.js')
    .then(({ initSteel }) => initSteel({
      canvas: $('[data-steel-canvas]'),
      container: stage,
      getProgress: () => stageProgress,
      onReady: () => { stage.dataset['3d'] = 'ready'; },
    }))
    .catch((err) => { console.warn('3D hero unavailable, using static illustration.', err); });
}
const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
if (document.readyState === 'complete') idle(load3D, { timeout: 1500 });
else addEventListener('load', () => idle(load3D, { timeout: 1500 }), { once: true });

/* ---------- Supply map (illustrative) ---------- */
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

function buildMap() {
  const svg = $('[data-map-svg]');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  const proj = (lat, lon) => [28 + (lon - 68) * 0.92 * 20, 24 + (37 - lat) * 20];
  const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); return n; };

  const gDots = el('g', {}); const gArcs = el('g', {}); const gLabels = el('g', {});
  const [hx, hy] = proj(HOME[1], HOME[2]);

  CITIES.forEach(([name, lat, lon]) => {
    const [x, y] = proj(lat, lon);
    const hub = HUBS.includes(name);
    gDots.appendChild(el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: hub ? 3.6 : 2.2, class: hub ? 'map-hub' : 'map-dot' }));
    if (hub) {
      const left = ['Ahmedabad', 'Mumbai', 'Bengaluru'].includes(name);
      const lbl = el('text', { x: (left ? x - 8 : x + 8).toFixed(1), y: (y + 4).toFixed(1), class: 'map-label', 'text-anchor': left ? 'end' : 'start' });
      lbl.textContent = name;
      gLabels.appendChild(lbl);
      const mx = (hx + x) / 2, my = (hy + y) / 2;
      const dx = x - hx, dy = y - hy, len = Math.hypot(dx, dy);
      const bend = Math.min(80, len * 0.22);
      const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
      gArcs.appendChild(el('path', { d: `M${hx.toFixed(1)} ${hy.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`, class: 'map-arc' }));
    }
  });

  const home = el('g', {});
  home.appendChild(el('circle', { cx: hx, cy: hy, r: 6, class: 'map-pulse', 'stroke-width': 1.5 }));
  home.appendChild(el('circle', { cx: hx, cy: hy, r: 6, class: 'map-home' }));
  const homeLbl = el('text', { x: hx + 12, y: hy - 8, class: 'map-label map-label--home' });
  homeLbl.textContent = 'New Delhi';
  home.appendChild(homeLbl);

  svg.append(gDots, gArcs, gLabels, home);
  $$('.map-arc', svg).forEach((p, i) => { p.style.setProperty('--len', p.getTotalLength().toFixed(1)); p.style.setProperty('--d', `${0.2 + i * 0.12}s`); });

  const fig = $('[data-supply-map]');
  const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { fig.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.25 });
  io.observe(fig);
}
buildMap();

/* ---------- Quotation form ---------- */
const form = $('[data-quote-form]');
const statusBox = $('[data-form-status]');
const submitBtn = $('[data-submit]');
const fileInput = $('#f-file');
const MAX_FILE = 8 * 1024 * 1024;
const ALLOWED_EXT = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'dwg', 'dxf', 'xls', 'xlsx', 'doc', 'docx', 'csv'];

// Required-by date can't be in the past
const dateInput = $('#f-date');
if (dateInput) {
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  dateInput.min = d.toISOString().slice(0, 10);
}

function normalisePhone(v) {
  const digits = v.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return null;
}

function setError(input, msg) {
  const field = input.closest('.field');
  const err = field.querySelector('.field__error');
  field.classList.toggle('has-error', !!msg);
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (err) { err.textContent = msg || ''; if (err.id) input.setAttribute('aria-describedby', err.id); }
}

function validate() {
  const errors = [];
  const name = $('#f-name'), phone = $('#f-phone'), wa = $('#f-wa'), email = $('#f-email');
  const check = (input, msg) => { setError(input, msg); if (msg) errors.push(input); };

  check(name, name.value.trim().length < 2 ? 'Please enter your name.' : '');
  check(phone, !phone.value.trim() ? 'Please enter a phone number so we can reply.' : (!normalisePhone(phone.value) ? 'Enter a 10-digit Indian mobile or landline number.' : ''));
  check(wa, wa.value.trim() && !normalisePhone(wa.value) ? 'Enter a valid 10-digit WhatsApp number, or leave blank.' : '');
  check(email, email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? 'That email address looks incomplete.' : '');
  check(productSelect, !productSelect.value ? 'Choose a product, or “Other / not sure”.' : '');

  const file = fileInput.files[0];
  let fileMsg = '';
  if (file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) fileMsg = 'Please upload a PDF, image, DWG/DXF, Excel or Word file.';
    else if (file.size > MAX_FILE) fileMsg = `This file is ${(file.size / 1048576).toFixed(1)} MB. The limit is 8 MB. Send larger drawings on WhatsApp or by email.`;
  }
  check(fileInput, fileMsg);
  return errors;
}

// Live re-validation after first attempt
let attempted = false;
form.addEventListener('input', () => { if (attempted) validate(); });
form.addEventListener('change', () => { if (attempted) validate(); });

// File picker UI
const fileWrap = fileInput.closest('.file');
const fileName = $('[data-file-name]');
fileInput.addEventListener('change', () => {
  const f = fileInput.files[0];
  fileWrap.classList.toggle('has-file', !!f);
  fileName.textContent = f ? `${f.name} · ${(f.size / 1048576).toFixed(1)} MB` : 'Choose a file or drop it here';
});
['dragenter', 'dragover'].forEach((t) => fileWrap.addEventListener(t, () => fileWrap.classList.add('is-drag')));
['dragleave', 'drop'].forEach((t) => fileWrap.addEventListener(t, () => fileWrap.classList.remove('is-drag')));

function composeWhatsApp() {
  const v = (id) => ($(id)?.value || '').trim();
  const formType = form.querySelector('input[name="form_type"]:checked')?.value || '';
  const lines = [
    'Hello Shree Radhe Steel, I would like a quotation.',
    '',
    ['Name', v('#f-name')], ['Company', v('#f-company')], ['City / state', v('#f-city')],
    ['Product', v('#f-product')], ['Grade / spec', v('#f-grade')], ['Form', formType],
    ['Size', v('#f-size')], ['Quantity', v('#f-qty')], ['Delivery location', v('#f-loc')],
    ['Required by', v('#f-date')], ['Message', v('#f-msg')],
  ].map((l) => (Array.isArray(l) ? (l[1] ? `${l[0]}: ${l[1]}` : null) : l)).filter((l) => l !== null);
  if (fileInput.files[0]) lines.push('', 'I will share my drawing / specification in this chat.');
  return waLink(lines.join('\n'));
}

function openWhatsAppFromForm(e) {
  e?.preventDefault();
  window.open(composeWhatsApp(), '_blank', 'noopener');
}
$('[data-wa-from-form]').addEventListener('click', openWhatsAppFromForm);
$('[data-wa-form]').addEventListener('click', openWhatsAppFromForm);

function showStatus(type, title, body, withFallback = false) {
  statusBox.hidden = false;
  statusBox.dataset.type = type;
  statusBox.innerHTML = '';
  const h = document.createElement('h3'); h.textContent = title;
  const p = document.createElement('p'); p.textContent = body;
  statusBox.append(h, p);
  if (withFallback) {
    const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
    const wa = document.createElement('a'); wa.className = 'btn btn--wa btn--sm'; wa.href = composeWhatsApp(); wa.target = '_blank'; wa.rel = 'noopener'; wa.textContent = 'Send on WhatsApp';
    const call = document.createElement('a'); call.className = 'btn btn--line btn--sm'; call.href = `tel:${BUSINESS.phoneTel}`; call.textContent = `Call ${BUSINESS.phoneDisplay}`;
    const mail = document.createElement('a'); mail.className = 'btn btn--line btn--sm'; mail.href = `mailto:${BUSINESS.email}?subject=${encodeURIComponent('Steel enquiry')}`; mail.textContent = 'Email us';
    wrap.append(wa, call, mail); statusBox.append(wrap);
  }
  statusBox.focus({ preventScroll: true });
  statusBox.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
}

function setBusy(busy) {
  submitBtn.setAttribute('aria-busy', String(busy));
  submitBtn.disabled = busy;
  $('[data-submit-label]').textContent = busy ? 'Sending…' : 'Submit enquiry';
}

const isLocalPreview = ['localhost', '127.0.0.1', '[::1]', ''].includes(location.hostname) || location.protocol === 'file:';

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  attempted = true;
  const errors = validate();
  if (errors.length) {
    showStatus('error', 'Please check the highlighted fields', `${errors.length === 1 ? 'One field needs' : `${errors.length} fields need`} attention before we can send your enquiry.`);
    errors[0].focus();
    return;
  }

  // Honeypot: bots fill hidden field; pretend success, send nothing
  if (form.company_website.value) { form.reset(); showStatus('success', 'Enquiry received', 'Thank you. We will be in touch.'); return; }

  const name = $('#f-name').value.trim().split(' ')[0];
  const phone = normalisePhone($('#f-phone').value);

  if (isLocalPreview) {
    showStatus('info', 'Preview mode: enquiry not sent',
      'This local copy isn\'t connected to the form service yet. Once the site is live on Netlify, enquiries will be delivered to the business inbox. You can still send this enquiry on WhatsApp now.', true);
    return;
  }

  setBusy(true);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch('/', { method: 'POST', body: new FormData(form), signal: ctrl.signal, headers: { Accept: 'text/html' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    form.reset();
    fileInput.dispatchEvent(new Event('change'));
    attempted = false;
    showStatus('success', `Enquiry received. Thank you, ${name}.`,
      `We'll reply on ${phone.replace(/(\d{5})(\d{5})/, '$1 $2')} during business hours (Mon–Sat, 9 AM–9 PM). If it's urgent, call ${BUSINESS.phoneDisplay}.`);
  } catch (err) {
    showStatus('error', 'Your enquiry couldn\'t be sent',
      'This may be a connection problem. Your details are still in the form, so you can try again, or send the same requirement on WhatsApp in one tap.', true);
  } finally {
    clearTimeout(timer);
    setBusy(false);
  }
});

/* ---------- Footer year ---------- */
$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
