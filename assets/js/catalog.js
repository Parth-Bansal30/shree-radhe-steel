/* Catalogue features: grade studio (chemistry, heat treatment, equivalents), side-by-side
   compare, product details and the enquiry list that feeds WhatsApp, email and the form.
   The list is stored only in this browser (localStorage) until the visitor clears it. */
import { GRADES, FAMILIES, PROPS, ELEMENTS, EL_ORDER, EL_MAX, nominal, fmtRange, gradeByCode } from './grades.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const famName = (id) => FAMILIES.find((f) => f.id === id)?.name || '';

const EL_COLOR = {
  C: '#ffb866', Si: '#c9a86a', Mn: '#a8c08a', P: '#8a8f96', S: '#e8d86a', Cr: '#7fd8ff', Ni: '#9fb0ff', Mo: '#c79bff', V: '#ff8fa3',
  W: '#ff7a3d', Co: '#5fd0b5', Cu: '#e3905e', N: '#8fd3ff', Nb: '#d6d06a', Ti: '#b8c0c8', Pb: '#8a8f96',
};
const FILTER_ELS = ['Cr', 'Ni', 'Mo', 'V', 'W', 'Co'];
const FORM_LABEL = { round: 'Round bar', square: 'Square bar', flat: 'Flat', block: 'Block', plate: 'Plate', other: 'Other section' };
const FORM_PRODUCT = { round: 'Round bars', square: 'Square bars', flat: 'Flats', block: 'Square blocks', plate: 'Alloy steel plates', other: 'Other / not sure' };

/* VERIFY: product detail content. "Related grades" are links into the reference library, not stock. */
const TELL = {
  plate: ['Grade or specification', 'Thickness × width × length', 'Number of pieces or total weight', 'Delivery city', 'Whether you need a mill test certificate'],
  round: ['Grade or specification', 'Diameter × length', 'Number of pieces or total weight', 'Delivery city', 'Whether you need a mill test certificate'],
  flat: ['Grade or specification', 'Thickness × width × length', 'Number of pieces or total weight', 'Delivery city', 'Whether you need a mill test certificate'],
  square: ['Grade or specification', 'Side × length', 'Number of pieces or total weight', 'Delivery city', 'Whether you need a mill test certificate'],
  block: ['Grade or specification', 'Length × width × height', 'Number of pieces', 'Delivery city', 'Whether you need a mill test certificate'],
  any: ['Grade, or what the part does', 'Section and size', 'Quantity', 'Delivery city', 'Any origin or certificate requirement'],
};
const PRODUCTS = {
  'alloy-plates': { name: 'Alloy steel plates', option: 'Alloy steel plates', forms: ['Plate'], fams: ['alloy', 'tool', 'case'], grades: ['EN19', 'EN24', 'EN31', 'D2', 'H13', 'P20'], tell: 'plate' },
  'steel-plates': { name: 'Steel plates', option: 'Steel plates', forms: ['Plate'], fams: ['carbon'], grades: ['IS 2062 E250', 'IS 2062 E350', 'C45', 'EN8'], tell: 'plate' },
  flats: { name: 'Flats', option: 'Flats', forms: ['Flat'], fams: ['carbon', 'alloy', 'tool', 'bearing'], grades: ['EN8', 'EN9', 'EN19', 'EN31', 'EN45', 'EN47', 'D2', 'OHNS'], tell: 'flat' },
  rounds: { name: 'Round bars', option: 'Round bars', forms: ['Round'], fams: ['carbon', 'alloy', 'case', 'bearing', 'tool', 'stainless'], grades: ['EN8', 'EN19', 'EN24', 'EN353', 'EN31', 'D2', 'H13', 'SS 304', 'SS 316'], tell: 'round' },
  bars: { name: 'Bars', option: 'Bars', forms: ['Round', 'Square', 'Flat'], fams: ['carbon', 'alloy', 'case'], grades: ['EN1A', 'EN8', 'EN19', '20MnCr5', 'SAE 8620'], tell: 'any' },
  squares: { name: 'Square bars', option: 'Square bars', forms: ['Square'], fams: ['carbon', 'alloy', 'tool'], grades: ['EN8', 'EN19', 'EN24', 'D2', 'H13'], tell: 'square' },
  blocks: { name: 'Square & steel blocks', option: 'Square blocks', forms: ['Block'], fams: ['tool', 'alloy'], grades: ['D2', 'D3', 'H13', 'DB6', 'P20', 'P20+Ni', 'EN24'], tell: 'block' },
  imported: { name: 'Imported materials', option: 'Imported materials', forms: ['As specified'], fams: ['tool', 'stainless', 'alloy'], grades: ['D2', 'H13', 'M2', 'P20', 'SS 316', '17-4 PH'], tell: 'any' },
  local: { name: 'Locally sourced materials', option: 'Local materials', forms: ['As specified'], fams: ['carbon', 'alloy', 'case'], grades: ['IS 2062 E250', 'EN8', 'EN19', 'EN24', '20MnCr5'], tell: 'any' },
};

export function specimenSVG(g, size = 48) {
  const id = `s${Math.random().toString(36).slice(2, 8)}`;
  const light = g.fam === 'stainless' ? '#f4f6f8' : '#e3e7eb';
  const dark = g.fam === 'tool' ? '#5d6570' : g.fam === 'stainless' ? '#9aa6b3' : '#727b86';
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true"><defs><radialGradient id="${id}g" cx=".36" cy=".32" r=".8"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></radialGradient><clipPath id="${id}c"><circle cx="24" cy="24" r="20.5"/></clipPath></defs><circle cx="24" cy="24" r="22.5" fill="#0b0e11" stroke="rgba(255,255,255,.16)"/><circle cx="24" cy="24" r="20.5" fill="url(#${id}g)"/><g clip-path="url(#${id}c)"><path d="M0 31.5C12 29 30 35 48 30.5V48H0Z" fill="${g.paint}" opacity=".95"/></g><g fill="none" stroke="rgba(255,255,255,.22)" stroke-width=".6"><circle cx="24" cy="24" r="15"/><circle cx="24" cy="24" r="9.5"/><circle cx="24" cy="24" r="4.5"/></g></svg>`;
}

export function initCatalog({ waLink, scrollToEl, lenis, reduced, canUse3D, BUSINESS, onListChange = () => {} }) {
  const html = document.documentElement;

  /* ---------------- Toast ---------------- */
  const toastEl = $('[data-toast]'), toastText = $('[data-toast-text]'), toastBtn = $('[data-toast-action]');
  let toastTimer = 0, toastAction = null;
  function toast(text, action) {
    toastText.textContent = text;
    toastAction = action?.fn || null;
    toastBtn.hidden = !action; if (action) toastBtn.textContent = action.label;
    toastEl.hidden = false; requestAnimationFrame(() => toastEl.classList.add('is-on'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.classList.remove('is-on'); setTimeout(() => { toastEl.hidden = true; }, 300); }, 3600);
  }
  toastBtn.addEventListener('click', () => { toastAction?.(); toastEl.classList.remove('is-on'); toastEl.hidden = true; });

  /* ---------------- Sheets (dialogs) ---------------- */
  const anyOpen = () => $$('dialog[open]').length > 0;
  function syncScrollLock() { const o = anyOpen(); html.classList.toggle('sheet-open', o); if (lenis) o ? lenis.stop() : lenis.start(); }
  function openSheet(d) { if (!d.open) d.showModal(); d.setAttribute('data-lenis-prevent', ''); syncScrollLock(); }
  function closeSheet(d) { if (d.open) d.close(); syncScrollLock(); }
  $$('dialog.sheet').forEach((d) => {
    d.addEventListener('close', syncScrollLock);
    d.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) { closeSheet(d); return; }
      if (e.target === d) { const r = d.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeSheet(d); }
    });
    d.addEventListener('pointerdown', (e) => { if (e.target === d) d.dataset.downOnBackdrop = '1'; else delete d.dataset.downOnBackdrop; });
  });
  $$('[data-close-nav]').forEach((a) => a.addEventListener('click', () => { const d = a.closest('dialog'); if (d) closeSheet(d); }));

  /* ---------------- Enquiry list ---------------- */
  const KEY = 'srs-enquiry-v1';
  let list = [];
  try { list = JSON.parse(localStorage.getItem(KEY) || '[]').filter((x) => x && x.type); } catch { list = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* private mode */ } };
  const uid = () => Math.random().toString(36).slice(2, 9);
  const listBtn = $$('[data-list-open]');
  const countEl = $('[data-list-count]');
  const drawer = $('[data-list]');

  function itemTitle(it) {
    if (it.type === 'grade') return `${it.code} · ${FORM_LABEL[it.form] || 'Section to confirm'}`;
    return it.grade ? `${it.product} · ${it.grade}` : it.product;
  }
  function listLines() {
    return list.map((it, i) => {
      const bits = [itemTitle(it)];
      if (it.type === 'grade') { const g = gradeByCode(it.id); if (g) bits[0] += ` (${famName(g.fam)})`; }
      if (it.size) bits.push(`Size: ${it.size}`);
      if (it.qty) bits.push(`Qty: ${it.qty}`);
      return `${i + 1}. ${bits.join(' · ')}`;
    });
  }
  function listMessage() {
    return ['Hello Shree Radhe Steel, please quote for the following:', '', ...listLines(), '', 'Delivery location: ', 'Name: '].join('\n');
  }
  function syncListUI(bump) {
    const n = list.length;
    countEl.textContent = n;
    listBtn.forEach((b) => b.classList.toggle('has-items', n > 0));
    const hb = $('.hdr__list'); hb.setAttribute('aria-label', `Open enquiry list, ${n} item${n === 1 ? '' : 's'}`);
    if (bump && !reduced) { hb.classList.remove('is-bump'); void hb.offsetWidth; hb.classList.add('is-bump'); }
    $('[data-lempty]').hidden = n > 0;
    $('[data-lfoot]').hidden = n === 0;
    $('[data-list-wa]').href = waLink(listMessage());
    $('[data-list-mail]').href = `mailto:${BUSINESS.email}?subject=${encodeURIComponent('Enquiry list from website')}&body=${encodeURIComponent(listMessage())}`;
    // form summary
    const box = $('[data-flist]');
    box.hidden = n === 0;
    $('[data-flist-items]').innerHTML = listLines().map((l) => `<li>${esc(l.replace(/^\d+\.\s*/, ''))}</li>`).join('');
    $('[data-flist-field]').value = listLines().join('\n');
    onListChange(list);
  }
  function renderList() {
    const ol = $('[data-litems]');
    ol.innerHTML = '';
    list.forEach((it) => {
      const g = it.type === 'grade' ? gradeByCode(it.id) : null;
      const li = document.createElement('li');
      li.className = 'litem'; li.dataset.uid = it.uid;
      const swatch = g ? `<span class="litem__sw" style="--paint:${g.paint}">${specimenSVG(g, 40)}</span>` : '<span class="litem__sw litem__sw--p"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-layers"/></svg></span>';
      const sub = g ? famName(g.fam) : 'Product';
      const formSel = g ? `<label class="lf"><span>Section</span><select data-k="form">${Object.entries(FORM_LABEL).map(([k, v]) => `<option value="${k}"${k === it.form ? ' selected' : ''}>${v}</option>`).join('')}</select></label>` : `<label class="lf"><span>Grade</span><input data-k="grade" list="grade-list" value="${esc(it.grade)}" placeholder="e.g. EN8" autocomplete="off"></label>`;
      li.innerHTML = `
        <div class="litem__top">${swatch}<div class="litem__t"><b>${esc(g ? g.code : it.product)}</b><span>${esc(sub)}</span></div>
          <button class="litem__rm" type="button" data-rm aria-label="Remove ${esc(itemTitle(it))}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-trash"/></svg></button></div>
        <div class="litem__f">${formSel}
          <label class="lf"><span>Size</span><input data-k="size" value="${esc(it.size)}" placeholder="${g && it.form === 'round' ? 'e.g. Ø 60 × 3000 mm' : 'e.g. 25 × 100 × 2000 mm'}" autocomplete="off"></label>
          <label class="lf"><span>Quantity</span><input data-k="qty" value="${esc(it.qty)}" placeholder="kg, tonnes or pieces" autocomplete="off"></label>
        </div>`;
      ol.appendChild(li);
    });
    syncListUI(false);
  }
  $('[data-litems]').addEventListener('input', (e) => {
    const f = e.target.closest('[data-k]'); if (!f) return;
    const it = list.find((x) => x.uid === f.closest('.litem').dataset.uid); if (!it) return;
    it[f.dataset.k] = f.value.slice(0, 120); save(); syncListUI(false);
    if (f.dataset.k === 'form') { const t = f.closest('.litem').querySelector('[data-k="size"]'); t.placeholder = f.value === 'round' ? 'e.g. Ø 60 × 3000 mm' : 'e.g. 25 × 100 × 2000 mm'; }
  });
  $('[data-litems]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-rm]'); if (!b) return;
    const li = b.closest('.litem'); list = list.filter((x) => x.uid !== li.dataset.uid); save(); renderList();
  });
  $('[data-list-clear]').addEventListener('click', () => { list = []; save(); renderList(); toast('Enquiry list cleared.'); });
  $('[data-list-form]').addEventListener('click', () => {
    closeSheet(drawer);
    const forms = [...new Set(list.map((it) => (it.type === 'grade' ? FORM_PRODUCT[it.form] : PRODUCTS[it.shot]?.option)).filter(Boolean))];
    const sel = $('#f-product');
    if (!sel.value) sel.value = forms.length === 1 ? forms[0] : 'Other / not sure';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    scrollToEl($('#quote'));
    setTimeout(() => $('#f-name').focus({ preventScroll: true }), reduced ? 0 : 1300);
  });
  listBtn.forEach((b) => b.addEventListener('click', () => { const d = b.closest('dialog'); if (d && d !== drawer) closeSheet(d); renderList(); openSheet(drawer); }));

  function addToList(item, label) {
    const same = list.find((x) => x.type === item.type && (item.type === 'grade' ? x.id === item.id && x.form === item.form : x.shot === item.shot && !x.grade));
    const open = { label: 'View list', fn: () => { renderList(); openSheet(drawer); } };
    if (same) { toast(`${label} is already in your enquiry list.`, open); return; }
    list.push({ uid: uid(), size: '', qty: '', grade: '', ...item }); save(); renderList(); syncListUI(true);
    toast(`Added ${label} to your enquiry list.`, open);
  }

  /* ---------------- Grade studio ---------------- */
  const famBox = $('[data-fams]'), grid = $('[data-ggrid]'), search = $('[data-gsearch]'), empty = $('[data-gempty]');
  let famSel = 'all', gradeSel = gradeByCode('EN24'), formSel = 'round', studio = null, tab = 'over';
  const elSel = new Set();
  const cmp = [];
  $('[data-grade-total]').textContent = GRADES.length;

  function renderFams() {
    famBox.innerHTML = '';
    [{ id: 'all', name: 'All grades' }, ...FAMILIES].forEach((f) => {
      const n = f.id === 'all' ? GRADES.length : GRADES.filter((g) => g.fam === f.id).length;
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.fam = f.id;
      b.innerHTML = `${esc(f.name)} <span>${n}</span>`;
      b.setAttribute('aria-selected', String(f.id === famSel));
      b.addEventListener('click', () => { famSel = f.id; renderFams(); renderGrid(); });
      famBox.appendChild(b);
    });
  }
  const elBox = $('[data-elfilter]');
  elBox.innerHTML = `<span class="mono">Contains</span>${FILTER_ELS.map((e) => `<button type="button" aria-pressed="false" data-el="${e}" title="${ELEMENTS[e][0]}" style="--c:${EL_COLOR[e]}">${e}</button>`).join('')}`;
  elBox.addEventListener('click', (e) => {
    const b = e.target.closest('[data-el]'); if (!b) return;
    const el = b.dataset.el; elSel.has(el) ? elSel.delete(el) : elSel.add(el);
    b.setAttribute('aria-pressed', String(elSel.has(el))); renderGrid();
  });
  const hasEl = (g, el) => { const r = g.chem[el]; return r && r[0] !== null && r[0] > 0; };
  function matches(g, q) {
    if (!q) return true;
    const hay = [g.code, g.sub, g.aka, g.kind, g.std, ...g.eq.flat(), famName(g.fam), g.use, ...(g.apps || []), ...g.el.map((e) => ELEMENTS[e]?.[0])].join(' ').toLowerCase().replace(/[\s.-]+/g, '');
    return hay.includes(q.toLowerCase().replace(/[\s.-]+/g, ''));
  }
  function renderGrid() {
    const q = search.value.trim();
    const shown = GRADES.filter((g) => (famSel === 'all' || g.fam === famSel) && [...elSel].every((el) => hasEl(g, el)) && matches(g, q));
    grid.innerHTML = '';
    shown.forEach((g) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'gchip'; b.dataset.id = g.id;
      b.setAttribute('aria-pressed', String(g === gradeSel));
      b.classList.toggle('in-cmp', cmp.includes(g.id));
      b.innerHTML = `${specimenSVG(g)}<b>${esc(g.code)}${g.sub ? ` <small>${esc(g.sub)}</small>` : ''}</b><span>${esc(g.kind || famName(g.fam))}</span><i class="gchip__el">${g.el.slice(0, 4).map((e) => `<em style="--c:${EL_COLOR[e]}">${e}</em>`).join('')}</i>`;
      b.addEventListener('click', () => {
        selectGrade(g);
        // stacked layout: bring the details into view unless they already are
        if (innerWidth < 1181) { const t = $('[data-panel]').getBoundingClientRect().top; if (t < 60 || t > innerHeight * 0.6) scrollToEl($('[data-panel]')); }
      });
      li.appendChild(b); grid.appendChild(li);
    });
    const filtered = famSel !== 'all' || elSel.size || q;
    $('[data-gcount]').textContent = filtered ? `Showing ${shown.length} of ${GRADES.length} grades` : `${GRADES.length} grades in the library`;
    empty.hidden = shown.length > 0;
    if (!shown.length) $('[data-ask-search]').href = waLink(`Hello Shree Radhe Steel, do you have ${q || 'this grade'}?\nSize: \nQuantity: `);
  }
  search.addEventListener('input', renderGrid);

  function radar(rel) {
    const cx = 110, cy = 100, R = 68, n = PROPS.length;
    const pt = (i, r) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    let s = '';
    for (let k = 1; k <= 5; k++) s += `<polygon class="ax" points="${PROPS.map((_, i) => pt(i, (R * k) / 5).join(',')).join(' ')}"/>`;
    PROPS.forEach((_, i) => { const [x, y] = pt(i, R); s += `<line class="ax" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`; });
    s += `<polygon class="val" points="${rel.map((v, i) => pt(i, (R * v) / 5).join(',')).join(' ')}"/>`;
    PROPS.forEach((p, i) => {
      const [x, y] = pt(i, R + 14); const anchor = Math.abs(x - cx) < 6 ? 'middle' : x > cx ? 'start' : 'end';
      s += `<text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="${anchor}">${p.replace(' resistance', '')}</text>`;
    });
    return s;
  }

  // Composition ring: alloying content (Fe is the balance)
  function ring(g) {
    const nom = nominal(g);
    const els = EL_ORDER.filter((e) => nom[e] && e !== 'S' && e !== 'P');
    const alloy = els.reduce((a, e) => a + nom[e], 0);
    const fe = Math.max(0, 100 - alloy);
    const R = 54, C = 2 * Math.PI * R;
    let off = 0, arcs = '';
    const gap = els.length > 1 ? 1.2 : 0;
    els.forEach((e) => {
      const len = Math.max(0.6, (nom[e] / alloy) * C - gap);
      arcs += `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${EL_COLOR[e]}" stroke-width="12" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 70 70)"><title>${ELEMENTS[e][0]} ≈ ${nom[e].toFixed(2)}%</title></circle>`;
      off += (nom[e] / alloy) * C;
    });
    const legend = els.map((e) => `<li style="--c:${EL_COLOR[e]}"><b>${e}</b> ${nom[e] >= 1 ? nom[e].toFixed(1) : nom[e].toFixed(2)}</li>`).join('');
    return `<svg viewBox="0 0 140 140" role="img" aria-label="Nominal alloy content about ${alloy.toFixed(1)} percent; iron about ${fe.toFixed(1)} percent">
      <circle r="${R}" cx="70" cy="70" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="12"/>${arcs}
      <text x="70" y="64" text-anchor="middle" class="ring__k">Fe ≈</text>
      <text x="70" y="84" text-anchor="middle" class="ring__v">${fe.toFixed(1)}%</text>
    </svg>
    <figcaption><span class="mono">Alloy content ≈ ${alloy.toFixed(alloy < 10 ? 2 : 1)}% (mid-range)</span><ul role="list">${legend}</ul></figcaption>`;
  }
  function chemRows(g) {
    const rows = EL_ORDER.filter((e) => g.chem[e]).map((e) => {
      const [a, b] = g.chem[e]; const scale = (EL_MAX[e] || 1) * 1.08;
      const l = a !== null ? (a / scale) * 100 : 0; const r = ((b ?? (a * 1.25)) / scale) * 100;
      const cls = a === null ? 'is-max' : b === null ? 'is-min' : '';
      const note = g.notes[e] ? `<small>${esc(g.notes[e])}</small>` : '';
      return `<tr><th scope="row"><span class="eltile" style="--c:${EL_COLOR[e]}">${e}</span><span class="elname" title="${esc(ELEMENTS[e][1])}">${ELEMENTS[e][0]}${note}</span></th><td class="mono">${fmtRange(g.chem[e])}</td><td><span class="rbar ${cls}" style="--c:${EL_COLOR[e]}"><i style="left:${l.toFixed(1)}%;width:${Math.max(1.5, r - l).toFixed(1)}%"></i></span></td></tr>`;
    });
    rows.push('<tr class="is-fe"><th scope="row"><span class="eltile">Fe</span><span class="elname">Iron</span></th><td class="mono">Balance</td><td></td></tr>');
    return rows.join('');
  }

  function updatePanel() {
    const g = gradeSel;
    $('[data-g-fam]').textContent = famName(g.fam) + (g.kind ? ` · ${g.kind}` : '');
    $('[data-g-code]').textContent = g.code;
    $('[data-g-aka]').textContent = [g.sub, g.aka ? `aka ${g.aka}` : ''].filter(Boolean).join(' · ');
    $('[data-g-std]').textContent = g.std;
    $('[data-g-use]').textContent = g.use;
    $('[data-g-apps]').innerHTML = (g.apps || []).map((a) => `<li>${esc(a)}</li>`).join('');
    $('[data-g-el]').innerHTML = g.el.map((e) => `<li style="--c:${EL_COLOR[e]}" title="${esc(ELEMENTS[e][1])}"><b>${e}</b><span>${ELEMENTS[e][0]}</span></li>`).join('');
    $('[data-g-radar]').innerHTML = radar(g.rel);
    $('[data-g-ring]').innerHTML = ring(g);
    $('[data-g-chem] tbody').innerHTML = chemRows(g);
    $('[data-g-chem-note]').textContent = `Weight %, per ${g.std}. "≤" is a maximum and "≥" a minimum. The ring shows mid-range values. Actual heat analysis is on the mill test certificate.`;
    $('[data-g-ht]').innerHTML = g.ht.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('') || '<div><dt>Heat treatment</dt><dd>Ask us for the supply condition of the lot you need.</dd></div>';
    $('[data-g-hard]').innerHTML = g.hard.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    $('[data-g-hard-wrap]').hidden = !g.hard.length;
    $('[data-g-eqt]').innerHTML = `<tbody><tr><th scope="row">Standard</th><td>${esc(g.std)}</td></tr>${g.eq.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td class="mono">${esc(v)}</td></tr>`).join('')}</tbody>`;
    const formLabel = FORM_LABEL[formSel].toLowerCase();
    $('[data-g-wa]').href = waLink(`Hello Shree Radhe Steel, please share availability for ${g.code} ${formLabel}.\nSize: \nQuantity: \nDelivery location: `);
    $('[data-g-wa-label]').textContent = `Ask for ${g.code}`;
    $('[data-g-add-label]').textContent = `Add ${g.code} ${formLabel} to list`;
    const inCmp = cmp.includes(g.id);
    $('[data-g-compare]').setAttribute('aria-pressed', String(inCmp));
    $('[data-g-compare-label]').textContent = inCmp ? 'In compare' : 'Compare';
    $('[data-studio-fallback]').innerHTML = specimenSVG(g, 220);
    studio?.setSpecimen({ grade: g, form: formSel });
  }
  function selectGrade(g) {
    gradeSel = g;
    $$('.gchip', grid).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === g.id)));
    updatePanel();
  }
  $$('[data-form]').forEach((b) => b.addEventListener('click', () => {
    formSel = b.dataset.form;
    $$('[data-form]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    updatePanel();
  }));
  // tabs
  const tabs = $$('[data-gtab]');
  function setTab(id, focus) {
    tab = id;
    tabs.forEach((t) => { const on = t.dataset.gtab === id; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    $$('[data-gpane]').forEach((p) => { p.hidden = p.dataset.gpane !== id; });
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => setTab(t.dataset.gtab));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      e.preventDefault(); setTab(tabs[(i + d + tabs.length) % tabs.length].dataset.gtab, true);
    });
  });
  $('[data-g-add]').addEventListener('click', () => {
    const g = gradeSel;
    addToList({ type: 'grade', id: g.id, code: g.code, form: formSel }, `${g.code} ${FORM_LABEL[formSel].toLowerCase()}`);
  });
  $('[data-g-share]').addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}#grade=${encodeURIComponent(gradeSel.id)}`;
    try { await navigator.clipboard.writeText(url); toast(`Link to ${gradeSel.code} copied.`); }
    catch { history.replaceState(null, '', `#grade=${encodeURIComponent(gradeSel.id)}`); toast('Link is in the address bar, ready to copy.'); }
  });

  /* ---------------- Compare ---------------- */
  const tray = $('[data-ctray]'), cmpDlg = $('[data-cmp]');
  function syncCompare() {
    tray.hidden = cmp.length === 0;
    $('[data-ctray-items]').innerHTML = cmp.map((id) => { const g = gradeByCode(id); return `<li style="--paint:${g.paint}"><span>${esc(g.code)}</span><button type="button" data-cmp-rm="${esc(id)}" aria-label="Remove ${esc(g.code)} from comparison"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-close"/></svg></button></li>`; }).join('')
      + (cmp.length < 3 ? `<li class="is-hint mono">${cmp.length === 1 ? 'Pick another grade' : 'Add one more'}</li>` : '');
    $('[data-cmp-open]').disabled = cmp.length < 2;
    $$('.gchip', grid).forEach((b) => b.classList.toggle('in-cmp', cmp.includes(b.dataset.id)));
    updatePanel();
    if (cmpDlg.open) { if (cmp.length < 2) closeSheet(cmpDlg); else renderCompare(); }
  }
  function toggleCompare(id) {
    const i = cmp.indexOf(id);
    if (i >= 0) cmp.splice(i, 1);
    else if (cmp.length >= 3) { toast('You can compare up to three grades. Remove one first.'); return; }
    else cmp.push(id);
    syncCompare();
  }
  $('[data-g-compare]').addEventListener('click', () => toggleCompare(gradeSel.id));
  tray.addEventListener('click', (e) => { const b = e.target.closest('[data-cmp-rm]'); if (b) toggleCompare(b.dataset.cmpRm); });
  $('[data-cmp-clear]').addEventListener('click', () => { cmp.length = 0; syncCompare(); });
  $('[data-cmp-open]').addEventListener('click', () => { renderCompare(); openSheet(cmpDlg); });

  function renderCompare() {
    const gs = cmp.map(gradeByCode);
    const head = `<thead><tr><th scope="col"><span class="sr-only">Property</span></th>${gs.map((g) => `<th scope="col"><div class="cmp__g">${specimenSVG(g, 42)}<div><b>${esc(g.code)}</b><span>${esc(famName(g.fam))}</span></div></div></th>`).join('')}</tr></thead>`;
    const row = (label, cells, cls = '') => `<tr class="${cls}"><th scope="row">${label}</th>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
    const sec = (t) => `<tr class="cmp__sec"><th colspan="${gs.length + 1}" scope="colgroup"><span class="cmp__sec-l">${t}</span></th></tr>`;
    let body = row('Type', gs.map((g) => esc(g.kind || '—'))) + row('Standard', gs.map((g) => `<span class="mono">${esc(g.std)}</span>`));
    body += sec('Chemistry · weight %');
    EL_ORDER.filter((e) => gs.some((g) => g.chem[e])).forEach((e) => {
      const scale = Math.max(...gs.map((g) => (g.chem[e] ? (g.chem[e][1] ?? g.chem[e][0] * 1.25) : 0))) * 1.1 || 1;
      body += row(`<span class="eltile" style="--c:${EL_COLOR[e]}">${e}</span> ${ELEMENTS[e][0]}`, gs.map((g) => {
        const r = g.chem[e]; if (!r) return '<span class="dim">—</span>';
        const l = r[0] !== null ? (r[0] / scale) * 100 : 0, rr = ((r[1] ?? r[0] * 1.25) / scale) * 100;
        return `<span class="mono">${fmtRange(r)}</span><span class="rbar ${r[0] === null ? 'is-max' : r[1] === null ? 'is-min' : ''}" style="--c:${EL_COLOR[e]}"><i style="left:${l.toFixed(1)}%;width:${Math.max(2, rr - l).toFixed(1)}%"></i></span>`;
      }));
    });
    const union = (key) => [...new Set(gs.flatMap((g) => g[key].map(([k]) => k)))];
    const htKeys = union('ht');
    if (htKeys.length) { body += sec('Heat treatment · typical'); htKeys.forEach((k) => { body += row(esc(k), gs.map((g) => esc(g.ht.find(([x]) => x === k)?.[1] || '—'))); }); }
    const hdKeys = union('hard');
    if (hdKeys.length) { body += sec('Hardness or strength · typical'); hdKeys.forEach((k) => { body += row(esc(k), gs.map((g) => esc(g.hard.find(([x]) => x === k)?.[1] || '—'))); }); }
    const norm = (k) => k.replace(/^≈\s*/, '');
    const eqKeys = [...new Set(gs.flatMap((g) => g.eq.map(([k]) => norm(k))))];
    body += sec('Equivalents · approximate');
    eqKeys.forEach((k) => { body += row(esc(k), gs.map((g) => `<span class="mono">${esc(g.eq.find(([x]) => norm(x) === k)?.[1] || '—')}</span>`)); });
    body += sec('Use');
    body += row('Typical applications', gs.map((g) => esc((g.apps || []).join(', '))));
    body += row('Relative character', gs.map((g) => `<ul class="relbars" role="list">${PROPS.map((p, i) => `<li><span>${p.replace(' resistance', '')}</span><i style="--v:${g.rel[i] / 5}"></i></li>`).join('')}</ul>`));
    body += row('', gs.map((g) => `<button class="btn btn--line btn--sm" type="button" data-cmp-add="${esc(g.id)}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-plus"/></svg> Add to list</button>`), 'cmp__act');
    $('[data-cmp-table]').innerHTML = head + `<tbody>${body}</tbody>`;
  }
  cmpDlg.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cmp-add]'); if (!b) return;
    const g = gradeByCode(b.dataset.cmpAdd);
    addToList({ type: 'grade', id: g.id, code: g.code, form: 'round' }, `${g.code} round bar`);
  });

  /* ---------------- Products ---------------- */
  const pd = $('[data-pdlg]');
  const shots = {};
  let pdShot = null;
  function openProduct(shot) {
    const P = PRODUCTS[shot]; if (!P) return;
    pdShot = shot;
    const card = $(`[data-shot="${shot}"]`).closest('.pcard');
    $('[data-pd-idx]').textContent = `Product ${card.querySelector('.pcard__idx')?.textContent || ''}`;
    $('[data-pd-title]').textContent = P.name;
    $('[data-pd-use]').textContent = card.querySelector('.pcard__use')?.textContent || '';
    const media = $('[data-pd-media]');
    media.innerHTML = shots[shot] ? `<img src="${shots[shot]}" alt="">` : card.querySelector('.pcard__media svg')?.outerHTML || '';
    if (!shots[shot]) ensureStudio().then(() => { if (pdShot === shot && shots[shot]) media.innerHTML = `<img src="${shots[shot]}" alt="">`; });
    $('[data-pd-forms]').innerHTML = P.forms.map((f) => `<li>${esc(f)}</li>`).join('');
    $('[data-pd-fams]').innerHTML = P.fams.map((f) => `<li>${esc(famName(f))}</li>`).join('');
    $('[data-pd-grades]').innerHTML = P.grades.map(gradeByCode).filter(Boolean).map((g) => `<li><button type="button" data-pd-grade="${esc(g.id)}">${specimenSVG(g, 26)}<b>${esc(g.code)}${g.sub ? ` ${esc(g.sub)}` : ''}</b></button></li>`).join('');
    $('[data-pd-tell]').innerHTML = TELL[P.tell].map((t) => `<li><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check"/></svg>${esc(t)}</li>`).join('');
    $('[data-pd-wa]').href = waLink(`Hello Shree Radhe Steel, please share availability for: ${P.name}.\nGrade: \nSize: \nQuantity: \nDelivery location: `);
    openSheet(pd);
  }
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-product-open]'); if (o) { openProduct(o.dataset.productOpen); return; }
    const m = e.target.closest('.pcard__media'); if (m && !e.target.closest('a,button')) { openProduct(m.dataset.shot); return; }
    const a = e.target.closest('[data-add-product]'); if (a) { const P = PRODUCTS[a.dataset.addProduct]; addToList({ type: 'product', shot: a.dataset.addProduct, product: P.name }, P.name.toLowerCase()); }
  });
  $('[data-pd-add]').addEventListener('click', () => { const P = PRODUCTS[pdShot]; addToList({ type: 'product', shot: pdShot, product: P.name }, P.name.toLowerCase()); });
  pd.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pd-grade]'); if (!b) return;
    const g = gradeByCode(b.dataset.pdGrade);
    closeSheet(pd);
    famSel = 'all'; elSel.clear(); $$('[data-el]').forEach((x) => x.setAttribute('aria-pressed', 'false')); search.value = '';
    renderFams(); renderGrid(); selectGrade(g); setTab('chem');
    scrollToEl(innerWidth < 1181 ? $('[data-panel]') : $('#grades'));
  });

  /* ---------------- Boot ---------------- */
  $('[data-grade-list]').innerHTML = GRADES.map((g) => `<option value="${esc(g.code + (g.sub ? ` ${g.sub}` : ''))}">${esc(famName(g.fam))}</option>`).join('');
  renderFams(); renderGrid(); updatePanel(); renderList(); syncCompare();

  // Deep link: #grade=EN24
  const m = location.hash.match(/^#grade=(.+)$/);
  if (m) {
    const g = gradeByCode(decodeURIComponent(m[1]));
    if (g) {
      selectGrade(g);
      const go = () => setTimeout(() => scrollToEl($('#grades')), 350);
      if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
    }
  }

  // 3D studio + product renders (lazy, once the products are near)
  let studioBoot = null;
  const ensureStudio = () => (studioBoot ||= bootStudio());
  async function bootStudio() {
    if (!canUse3D()) { html.classList.add('no-studio'); return; }
    try {
      const { initStudio } = await import('./specimen.js');
      studio = initStudio({ canvas: $('[data-studio-canvas]') });
      studio.setSpecimen({ grade: gradeSel, form: formSel });
      const figs = $$('[data-shot]');
      Object.assign(shots, studio.shoot(figs.map((f) => f.dataset.shot)));
      figs.forEach((f) => {
        const src = shots[f.dataset.shot]; if (!src) return;
        const img = new Image(); img.alt = ''; img.decoding = 'async'; img.src = src;
        img.onload = () => { const btn = f.querySelector('.pcard__more'); f.innerHTML = ''; f.appendChild(img); if (btn) f.appendChild(btn); };
      });
    } catch (err) {
      console.warn('Studio unavailable', err);
      html.classList.add('no-studio');
    }
  }
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 400));
  const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); idle(ensureStudio, { timeout: 1200 }); } }, { rootMargin: '1200px 0px' });
  io.observe($('#products'));

  return { listLines, get count() { return list.length; } };
}
