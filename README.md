<p align="center">
  <img src="content/icon.svg" width="80" alt="mh">
</p>

<h3 align="center">maximehaegeman.com</h3>
<p align="center">Personal portfolio — Data Engineer & ML Engineer based in Copenhagen</p>

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
index.html      Hero, skills grid, featured projects, interactive contact terminal
projects.html   Curated project cards, hydrated live from the GitHub API
blog.html       Medium posts via RSS (CORS-proxy fallback chain)
cv.html         Work history timeline + skill density heatmap
404.html        Terminal-styled not-found page
```

## Quick Start

```bash
python -m http.server 8000
# → http://localhost:8000
```

## Structure

```
├── index.html / blog.html / cv.html / projects.html / 404.html
├── style.css                 # Global styles, themes, palette/terminal/aurora
├── css/index.css             # Homepage-specific styles
├── js/
│   ├── i18n.js               # Translations + language switcher + typewriter
│   ├── index.js              # Homepage interactions (reveal, rotation, stagger)
│   ├── palette.js            # ⌘K command palette
│   └── terminal.js           # Interactive contact terminal
├── theme-init.js             # Blocks FOUC — sets saved theme before paint
├── loader.js                 # API integrations, caching, theme toggle, nav
├── tests/run_tests.sh        # CI checks: structure, assets, SEO, contrast
└── content/
    ├── icon.svg              # Favicon
    ├── preview-card.png      # Open Graph / social preview card
    ├── resume_2026.pdf       # Downloadable resume
    └── img/scandinavia/      # Hero photos (WebP, 760px)
```

## Features

- **⌘K command palette** — keyboard-first navigation, theme & language switching
- **Interactive contact terminal** — type `help` on the homepage
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
