# omaraldulimay.github.io

Portfolio site of Omar Abdullah, software developer in Hamburg: https://omaraldulimay.github.io

Plain HTML, CSS and a little vanilla JavaScript – no build step. GitHub Pages serves the `main` branch as is.

## Structure

```
index.html                    Home: hero, project index (01–03), skills, contact
projekte/
  retail-data-pipeline.html   One full page per project:
  courtyard.html              hero, "Auf einen Blick" stats, feature rows with
  inventory-sync.html         screenshots, inline-SVG flow diagram, tech chips, prev/next
assets/
  style.css                   Design tokens (light + dark via prefers-color-scheme) and all styles
  main.js                     "Projekte" dropdown / phone menu, scroll-in reveals, animated demo
  img/                        WebP images, lazy-loaded; og-*.jpg / og-image.png for social previews
```

- The navigation (OA monogram, "Projekte" dropdown, "Über mich", "Kontakt") is repeated in every page; change it in all four files.
- Without JavaScript the content stays visible and the dropdown opens on hover or focus.
- Animations respect `prefers-reduced-motion`; the pipeline demo then stays a still poster.

## Update

- Text and stats live directly in the HTML. Every stat must come from the project's README.
- Images go into `assets/img/` as WebP, about 1000 px wide for screenshots, 400 px for phone screens.

## Add a project

1. Copy one `projekte/*.html` page and edit title, claim, stats, feature rows, flow diagram and chips.
2. Add its `<a class="pj">` block to the project index in `index.html` and its entry to the `.dd-menu` list in all pages' navigation.
3. Add images and real `alt` texts, plus an `og-<name>.jpg` (1200×630) and update prev/next links.
4. Check locally with `python3 -m http.server` and open http://localhost:8000 – phone width included.
