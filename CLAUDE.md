# CLAUDE.md

## Project
Maxime Haegeman's personal portfolio — editorial dark aesthetic with terminal elements. No build step.

## Stack
- Vanilla HTML/CSS/JS
- GitHub API + RSS-to-JSON (Medium) via `loader.js`
- Three.js for interactive games
- Deployed via GitHub Pages

## Dev
```bash
python -m http.server 8000
```

## Structure
- `index.html` / `js/index.js` / `css/index.css` — homepage (hero, contact)
- `projects.html` — GitHub repos via API
- `blog.html` — Medium posts via RSS
- `cv.html` — work history from `content/experience.json`
- `style.css` — global styles + light/dark themes
- `loader.js` — API integrations

## Conventions
- No frameworks, no build tools — keep it vanilla
- Editorial dark aesthetic: deep green-black bg (`#0a0f00`), neon yellow-green accent (`#ccff00`), serif display headings (`Playfair Display`) + monospace terminals (`Fira Code`)
- Theme toggle: `[data-theme="light"]` selector overrides in CSS
- Branch prefix: `claude/`
