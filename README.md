<p align="center">
  <img src="content/icon.svg" width="80" alt="mh">
</p>

<h3 align="center">maximehaegeman.com</h3>
<p align="center">Personal portfolio — AI Engineer based in Copenhagen</p>

<p align="center">
  <a href="https://www.maximehaegeman.com">Live Site</a> &middot;
  <a href="https://linkedin.com/in/maxime-haegeman">LinkedIn</a> &middot;
  <a href="https://medium.com/@maximehaegeman">Blog</a>
</p>

---

## Stack

| Layer | Tech |
|-------|------|
| Markup | Vanilla HTML / CSS / JS — no build step |
| Fonts | Playfair Display, Fira Code, DM Sans (Google Fonts) |
| Data | GitHub API (projects), Medium RSS (blog), localized data in `js/i18n.js` |
| i18n | EN / ES / FR / DA, persisted in `localStorage` |
| Hosting | GitHub Pages |

## Pages

```
index.html      Hero, skills grid, lab teaser, featured projects, interactive contact terminal
lab.html        AI lab: hybrid semantic search, agent trace replay, lab notebook
projects.html   Curated project cards, hydrated live from the GitHub API
blog.html       Medium posts via RSS (CORS-proxy fallback chain)
cv.html         Archived work history (noindex, not linked from nav — `cat .resume.txt` in the terminal)
404.html        Terminal-styled not-found page
llms.txt        Machine-readable site summary for LLMs / AI crawlers
```

## Quick Start

```bash
python -m http.server 8000
# → http://localhost:8000
```

## Structure

```
├── index.html / lab.html / blog.html / cv.html / projects.html / 404.html
├── style.css                 # Global styles, themes, palette/terminal/aurora
├── css/index.css             # Homepage-specific styles
├── css/lab.css               # AI lab (search app, trace viewer, notebook)
├── js/
│   ├── i18n.js               # Translations + language switcher + typewriter
│   ├── index.js              # Homepage interactions (reveal, rotation, stagger)
│   ├── palette.js            # ⌘K command palette
│   ├── terminal.js           # Interactive contact terminal (+ hidden files)
│   └── lab/
│       ├── lab-search.js     # Ingest → chunk → BM25/TF-IDF → embeddings → RRF → PCA map
│       ├── embed-worker.js   # Module worker running MiniLM via transformers.js (CDN)
│       ├── traces-data.js    # Demo agent traces (edit to add runs)
│       ├── trace-viewer.js   # Span waterfall + inspector + playback
│       └── lab.js            # Lab page reveal + section index
├── theme-init.js             # Blocks FOUC — sets saved theme before paint
├── loader.js                 # API integrations, caching, theme toggle, nav
├── tests/run_tests.sh        # CI checks: structure, assets, SEO, contrast
└── content/
    ├── icon.svg              # Favicon
    ├── preview-card.png      # Open Graph / social preview card
    ├── resume_2026.pdf       # Archived resume
    └── img/
        ├── scandinavia/      # Hero photos (WebP, 760px)
        └── cat.webp          # Terminal easter egg (ASCII fallback if missing)
```

## AI Lab

Everything runs client-side; there is no backend and no API key.

- **Ask the archive** — the Medium feed, project notes and lab notebook are chunked
  (~120 words) and indexed with BM25 instantly. "Load embedding model" fetches
  `Xenova/all-MiniLM-L6-v2` (q8 ONNX, ~23 MB) + transformers.js from jsDelivr into a
  module Web Worker; passages are embedded once and cached in `localStorage`, the
  weights in Cache Storage. Hybrid mode fuses BM25 and cosine rankings with
  Reciprocal Rank Fusion (k = 60). The map is a PCA projection (power iteration)
  of TF-IDF or embedding space; the query is projected onto the same basis.
  If the CDN or WASM is unavailable it degrades to BM25 only. `?q=` pre-fills a query.
- **Agent trace replay** — `js/lab/traces-data.js` holds OpenTelemetry-style spans
  (`id`, `parent`, `kind`, `start`, `end`, `input`, `output`, `tokens`). The viewer
  replays them as a waterfall with an inspector and streamed LLM output.
  Space = play/pause, ← → = step between spans.

## Features

- **⌘K command palette** — keyboard-first navigation, theme & language switching
- **Interactive contact terminal** — type `help` on the homepage (and `ls -a`)
- **View Transitions API** — smooth cross-page navigation (progressive enhancement)
- **Session caching** — GitHub/Medium responses cached 1h in `sessionStorage`;
  project cards render instantly from curated metadata even if the API is down
- **Dark / light themes** — WCAG-checked contrast, `prefers-reduced-motion` respected

## Theming

Two themes controlled via `data-theme` attribute on `<html>`:

| | Dark (default) | Light |
|---|---|---|
| Background | `#080c08` | `#f5f2eb` |
| Accent | `#ccff00` | `#1a5c00` |
| Display font | Playfair Display | Playfair Display |
| Code font | Fira Code | Fira Code |

Edit CSS variables in `:root` and `[data-theme="light"]` in `style.css`.

## Configuration

Update `CONFIG` in `loader.js` to point to your own profiles:

```js
const CONFIG = {
    githubUser: 'mhaegeman',
    mediumUser: 'maximehaegeman',
    maxRepos: 6,
    maxArticles: 8
};
```

Work history and project descriptions (all languages) live in `js/i18n.js`.

## Tests

```bash
bash tests/run_tests.sh
```

Runs in CI on every push/PR: HTML structure, asset references, SEO metadata,
CSP regressions (inline styles, JSON-LD hash), and light-theme contrast ratios.

---

Built by [Maxime Haegeman](https://github.com/mhaegeman)
