# Shree Radhe Steel Industries website

A static site with no build step: plain HTML, CSS and ES modules. Three.js, GSAP and Lenis load from public CDNs. The 3D yard only loads on devices with WebGL. Every other device gets a static backdrop with the same content.

```
index.html             The whole homepage: story, products, grade studio, ordering, contact, quotation form
assets/css/site.css    Design tokens, layout, the studio, dialogs and responsive rules
assets/js/app.js       Smooth scroll, the scroll-driven story (camera keyframes and chapter state), loader, nav, quotation form
privacy.html, thanks.html, 404.html   Privacy note, the no-JavaScript form confirmation, and the not-found page
assets/js/scene.js     The 3D yard: hero bar, stock bundles, truck, lighting, bloom, adaptive quality
assets/js/yard.js      Gantry crane and the crew (cutter, two carriers, truck helper, signaller, supervisor), with procedural walk and work poses
assets/js/grades.js    Reference grade library: 49 grades with chemistry ranges, heat treatment, hardness, equivalents and uses
assets/js/catalog.js   Grade studio (filters, tabs, composition ring, compare), product details, enquiry list, toast
assets/js/specimen.js  3D specimen in the grade studio (lazy-loaded)
assets/js/forms.js     Shared steel geometry, materials and textures (used by the yard and the studio)
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
- **GitHub Pages (review copy).** Pushing to `main` publishes https://parth-bansal30.github.io/shree-radhe-steel/. Pages cannot receive form posts, so there the form offers WhatsApp or email instead.
- **Netlify (form submissions to the Gmail inbox).** On any host other than GitHub Pages or localhost, the form posts to Netlify Forms. One-time setup:
  1. Sign up at netlify.com, ideally with `shreeradhe.steel.alloys@gmail.com`. Netlify only sends notifications to members of the Netlify team, so if you sign up with another address, invite this one under Team → Members.
  2. **Add new project → Import an existing project → GitHub**, then pick this repo. `netlify.toml` already sets the publish directory to `.`. Choose **Deploy**.
  3. **Forms → Enable form detection**, then **Deploys → Trigger deploy** once, so Netlify finds the `quote` form.
  4. **Forms → Submission notifications → Add notification → Email notification**: `shreeradhe.steel.alloys@gmail.com`.
  5. Send one test enquiry from the netlify.app address and check the inbox, including the spam folder the first time.
- Each email's subject reads like "Steel enquiry: Round bars · EN24 from Name". If the customer gives an email address, replying goes to them. Netlify filters spam with Akismet and a hidden honeypot field. The whole request is capped at 8 MB, so the form accepts drawings up to 7 MB.
- After Netlify is live, every push to `main` redeploys both copies. `netlify.toml` sets a strict Content-Security-Policy and stops serving the archived `v1/`. If you edit either inline `<script>` in `index.html`, regenerate its sha256 hash there, or the browser will block it.
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
