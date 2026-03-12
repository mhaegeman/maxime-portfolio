# CLAUDE.md

## Project
Maxime Haegeman's personal portfolio — terminal/cyberpunk-themed static site. No build step.

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
- `index.html` / `js/index.js` / `css/index.css` — homepage (hero, saiyan animation, contact)
- `projects.html` — GitHub repos via API
- `blog.html` — Medium posts via RSS
- `cv.html` — work history from `content/experience.json`
- `style.css` — global styles + light/dark themes
- `loader.js` — API integrations

## Conventions
- No frameworks, no build tools — keep it vanilla
- Dark terminal aesthetic: black bg, white/teal text, monospace fonts
- Theme toggle: `[data-theme="light"]` selector overrides in CSS
- Branch prefix: `claude/`
