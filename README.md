# Shree Radhe Steel Industries website

A static site with no build step: plain HTML, CSS and ES modules. Three.js, GSAP and Lenis load from public CDNs. The 3D yard only loads on devices with WebGL. Every other device gets a static backdrop with the same content.

```
index.html             The whole homepage: story, products, grade studio, ordering, contact, quotation form
assets/css/site.css    Design tokens, layout, the studio, dialogs and responsive rules
assets/js/app.js       Smooth scroll, the scroll-driven story (camera keyframes and chapter state), loader, nav, form wiring
assets/js/scene.js     The 3D yard: hero bar, stock bundles, truck, lighting, bloom, adaptive quality
assets/js/yard.js      Gantry crane and the crew (cutter, two carriers, truck helper, signaller, supervisor), with procedural walk and work poses
assets/js/grades.js    Reference grade library: 49 grades with chemistry ranges, heat treatment, hardness, equivalents and uses
assets/js/catalog.js   Grade studio (filters, tabs, composition ring, compare), product details, enquiry list, toast
assets/js/specimen.js  3D specimen in the grade studio (lazy-loaded)
assets/js/forms.js     Quotation form: Netlify Forms when hosted there, WhatsApp or email elsewhere
docs/BRIEF.md          Original brief and design notes
v1/                    Archived first version
```

## Run locally
```bash
python3 -m http.server 4173 --directory website
```
Then open http://localhost:4173. On localhost the form shows a preview notice and sends nothing.

## How the pieces connect
- **Story.** The page's scroll position maps to a progress value from 0 to 7, one step per chapter. Camera keyframes (`K_WIDE` and `K_TALL` in `app.js`) and scene values such as `truckIn`, `load` and `drive` come from that value. The scene smooths them over time, so scrolling backwards replays the crane and crew in reverse.
- **Enquiry list.** Visitors add grades and products, then fill in section, size and quantity. The list is saved in the visitor's own browser (`localStorage`, key `srs-enquiry-v1`). It can go out as one WhatsApp message or email, or be copied into the quotation form's hidden `enquiry_list` field.
- **Deep links.** `#grade=EN24` opens the studio on that grade, and the "Copy link" button creates these links.

## Deploy
- **GitHub Pages (current).** Pushing to `main` publishes the site. Pages cannot receive form posts, so the form hands the enquiry to WhatsApp or email instead.
- **Netlify (recommended once you want form submissions in an inbox).** Import the repo and leave the publish directory as `.`. Then go to **Site → Forms → Notifications** and add `shreeradhe.steel.alloys@gmail.com`. `netlify.toml` already sets a strict Content-Security-Policy. If you edit either inline `<script>` in `index.html`, regenerate its sha256 hash in that file or the browser will block it.
- No API keys or secrets are used anywhere in the site.

## Still to replace or confirm
Search the code for `PLACEHOLDER` and `VERIFY`.

| Item | Where |
|---|---|
| PIN code (110063 or 110018). It is deliberately not shown anywhere yet | address blocks, JSON-LD |
| Grade library: confirm which grades are actually traded. It is labelled as a reference, not a stock list | `assets/js/grades.js` |
| Product details and related grades | `assets/js/catalog.js` (`PRODUCTS`) |
| Loading routine copy ("Counted, checked, then loaded.") | `index.html`, chapter 5 |
| Number of units, founding year and first location | `#story` |
| Logo, family photographs, family quote | header, `#story` |
| Google Maps embed | `#contact` |
| Share image (1200×630) and Apple touch icon | `<head>` |
| Domain | canonical, OG tags, sitemap, robots, JSON-LD |
