# Shree Radhe Steel Industries: website (Phase 1)

Static site with no build step. Plain HTML/CSS/JS, with Three.js loaded from jsDelivr only on capable desktops.

```
index.html            Homepage (all sections)
assets/css/main.css   Design tokens + layout
assets/js/main.js     Nav, reveals, open-now status, WhatsApp links, form, supply map, 3D loader
assets/js/hero3d.js   Scroll-driven Three.js steel scene (lazy)
privacy.html, thanks.html, 404.html
robots.txt, sitemap.xml, site.webmanifest, netlify.toml
docs/BRIEF.md         Sitemap, visual direction, design system, 3D concept, headline options
```

## Run locally
```bash
python3 -m http.server 4173 --directory website
```
Open http://localhost:4173. On localhost the form shows a "Preview mode" notice instead of pretending to send.

## Deploy (Netlify recommended: the form needs no server code or API keys)
1. Push this folder to GitHub, then in Netlify choose **Add new site → Import from Git** and set the publish directory to `website` (or deploy this folder by drag-and-drop).
2. Netlify detects the `quote` form automatically. In **Site → Forms → Form notifications**, add an email notification to `shreeradhe.steel.alloys@gmail.com`.
3. Attach the domain, then replace every `https://www.example.com` in `index.html`, `sitemap.xml` and `robots.txt`.
4. If you change an inline `<script>` in `index.html`, regenerate its sha256 hash in `netlify.toml` (Content-Security-Policy), or the browser will block it.

## Placeholders still to replace
Search the code for `PLACEHOLDER`, `TODO` and `VERIFY`.

| Item | Where |
|---|---|
| Logo (currently a drawn "billet" monogram) | `index.html` header, `assets/img/favicon.svg` |
| Founder / proprietor photos | `#story` |
| Family quote (currently a draft line) | `#story` blockquote |
| Google Maps embed (currently a styled placeholder + "Open in Google Maps" link) | `#contact` |
| OG share image 1200×630 → `assets/img/og-image.jpg` | `<head>` |
| Apple touch icon 180×180 → `assets/img/apple-touch-icon.png` | `<head>` |
| PIN code (110063 or 110018), deliberately not shown anywhere | address blocks, JSON-LD |
| Domain | canonical, OG, sitemap, robots, JSON-LD |
| Product photos (optional; cards use drawn profiles today) | `.card__media` |
