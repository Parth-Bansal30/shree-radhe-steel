# Shree Radhe Steel Industries — Website Brief (Phase 1)

## 1. Sitemap

Phase 1 is a single, fast homepage with anchored sections (best for phone / WhatsApp conversion and for sharing one link on Instagram). Separate pages are added once real content exists.

```
/                      Homepage
├── #top               Hero + 3D steel story (raw → precision → quality → supply → delivery)
├── #products          Product categories (9 cards)
├── #why               Why customers choose us
├── #story             Family business story
├── #ordering          How ordering works (4 steps)
├── #supply            Nationwide supply
├── #quote             Quotation form
└── #contact           Contact, hours, map
/privacy.html          Privacy note for enquiry data
/404.html              Not found
/robots.txt, /sitemap.xml, /site.webmanifest
```

Planned Phase 2 pages (once catalogue / photos arrive): `/products/alloy-steel-plates`, `/products/round-bars`, … (one per category, for search ranking), `/about`, `/gallery`.

## 2. Homepage structure

| # | Section | Job | Primary action |
|---|---------|-----|----------------|
| 0 | Sticky header | Brand, nav, always-visible Call + Quote | Call / Quote |
| 1 | Hero | Who we are in 5 seconds; 40+ years; family trust line; hours + open-now | Request a quotation / WhatsApp us |
| 2 | Steel story (scroll) | Show capability through the 3D object | — |
| 3 | Products | What we supply; per-product WhatsApp availability check | Ask for availability / Quote |
| 4 | Why us | Nine verified strengths, no inflated numbers | — |
| 5 | Family story | Continuity: Khajanchi Mal Bansal → Vikas Bansal | — |
| 6 | Ordering | 4 steps + what is confirmed per order | Send requirement |
| 7 | Supply | India visualisation, honest wording | — |
| 8 | Quotation form | Structured requirement capture | Submit / WhatsApp instead / Call |
| 9 | Contact | NAP, hours, map placeholder | Call / WhatsApp / Email |
| — | Mobile action bar | Thumb-reach Call / WhatsApp / Quote on phones | — |

## 3. Visual direction — "Mill floor at night"

The look of polished stock under workshop lighting: deep graphite space, cool silver highlights, one controlled electric-blue "measurement" accent, and a small amount of warm forge amber that appears only as heat or sparks.

- **Strong:** large, tight display type, heavy weights, full-bleed dark sections.
- **Precise:** hairline rules, mono technical labels (`01 / RAW MATERIAL`), tick marks, dimension lines.
- **Trustworthy:** real names, plain claims, visible phone numbers and hours on every screen.
- **Not:** hi-vis yellow construction templates, catalogue clip-art, neon gaming effects, dashboard clutter.

## 4. Design system

Tokens live in `assets/css/main.css` under `:root`.

**Colour**
| Token | Value | Use |
|---|---|---|
| `--graphite` | `#0A0C0F` | Page background |
| `--charcoal` | `#12151A` | Alternate sections |
| `--gunmetal` | `#1B1F26` | Cards |
| `--gunmetal-2` | `#252B34` | Raised / hover |
| `--line` | `rgba(200,210,225,.12)` | Hairlines |
| `--steel` | `#8B95A3` | Secondary text (AA on graphite) |
| `--silver` | `#D9DEE5` | Body text |
| `--white` | `#F4F6F8` | Headlines |
| `--blue` | `#4EA1FF` | Accent: focus, links, measurement |
| `--amber` | `#F0A04B` | Forge accent: sparks, "open now" |
| `--wa` | `#25D366` | WhatsApp only |

**Type**
- Display & UI: **Archivo** (variable, width axis) — expanded heavy cuts for headlines, normal width for body.
- Technical labels: **JetBrains Mono** — step numbers, spec tags, status.
- Scale (fluid): h1 `clamp(2.6rem, 6.2vw, 5.6rem)`, h2 `clamp(2rem, 4vw, 3.4rem)`, body `1.0625rem / 1.6`.

**Space & shape** — 4-px base grid; section padding `clamp(80px, 12vw, 160px)`; radius 4 px (machined, not bubbly); max content width 1280 px.

**Components** — buttons (primary silver, secondary outline, WhatsApp green), product card, feature tile, timeline, step, form field, status pill, placeholder block (`.ph` — dashed outline + label, so missing assets are obvious).

**Motion** — 600 ms ease-out reveals, 8–12 px travel; all motion disabled under `prefers-reduced-motion`.

## 5. 3D hero concept — "One bar, five stages"

A brushed alloy square billet (Three.js, real-time reflections from a procedural studio environment, no external model files) stays pinned beside the copy while the visitor scrolls through five stages:

1. **Raw material** — billet turns slowly, sparks peel off one end as if fresh off the saw; cursor tilts it.
2. **Precision** — it rotates side-on; blue dimension lines and labels (`LENGTH`, `WIDTH`, `THICKNESS`) draw in. No numbers are shown, so no sizes are invented.
3. **Quality** — a scanning frame sweeps the length with a moving light; the surface goes from brushed to polished.
4. **Supply** — the billet resolves into a stack of plates, round bars and square bars assembling from different directions.
5. **Delivery** — the stack pulls back and a route line draws out toward the horizon.

**Performance:** Three.js (~170 KB gz) loads only after the page is idle, only on screens ≥ 900 px wide, only with WebGL, and never with Save-Data or reduced motion. Rendering pauses off-screen and in background tabs; pixel ratio capped at 1.5. Phones and reduced-motion users get a lightweight inline SVG billet (≈3 KB) and the stage copy as plain cards.

## 6. Headline options

1. **"The right steel. The right grade. Supplied across India."** — *in use*. Short, buyer-centred, true.
2. "Forty years in steel. One call to source your next order." — leans on heritage + ease.
3. "Alloy plates, bars and blocks, sourced by a family that has traded steel for over 40 years." — most descriptive, best for search.
