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
| Background | Vanta.js NET effect (Three.js) |
| Data | GitHub API, Medium RSS, `content/experience.json` |
| Hosting | GitHub Pages |

## Pages

```
index.html      Hero, skills grid, featured projects, contact
projects.html   GitHub repos fetched via API
blog.html       Medium posts via RSS-to-JSON
cv.html         Work history from experience.json
```

## Quick Start

```bash
python -m http.server 8000
# → http://localhost:8000
```

## Structure

```
├── index.html / blog.html / cv.html / projects.html
├── style.css                 # Global styles + light/dark themes
├── css/index.css             # Homepage-specific styles
├── js/
│   ├── vanta-bg.js           # Animated NET background
│   └── index.js              # Homepage interactions
├── theme-init.js             # Blocks FOUC — sets saved theme before paint
├── loader.js                 # API integrations + theme toggle
└── content/
    ├── experience.json       # CV data
    ├── icon.svg              # Favicon
    └── profile_bnw.jpg       # Hero photo
```

## Theming

Two themes controlled via `data-theme` attribute on `<html>`:

| | Dark (default) | Light |
|---|---|---|
| Background | `#080c08` | `#f8f6f0` |
| Accent | `#ccff00` | `#3d7a00` |
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

Update work history in `content/experience.json`.

---

Built by [Maxime Haegeman](https://github.com/mhaegeman)
