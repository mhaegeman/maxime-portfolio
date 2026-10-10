# CLAUDE.md

## Project
Maxime Haegeman's personal portfolio (AI Engineer) — editorial dark aesthetic with terminal elements. No build step.

## Stack
- Vanilla HTML/CSS/JS
- GitHub API (projects) + Medium RSS via CORS-proxy chain (blog) in `loader.js`
- Localized content (EN/ES/FR/DA) in `js/i18n.js`
- Deployed via GitHub Pages

## Dev
```bash
python -m http.server 8000
bash tests/run_tests.sh   # CI test suite
```

## Structure
- `index.html` / `js/index.js` / `css/index.css` — homepage (hero, skills, contact terminal)
- `projects.html` — curated cards hydrated from GitHub API
- `blog.html` — Medium posts via RSS
- `lab.html` / `css/lab.css` / `js/lab/` — AI lab: hybrid semantic search (BM25 + MiniLM in a module worker + RRF + PCA map) and agent trace replay (`js/lab/traces-data.js`)
- `cv.html` — archived work history (noindex, intentionally not linked; reachable via terminal `cat .resume.txt`)
- `llms.txt` — site summary for LLMs
- `404.html` — terminal-styled not-found page
- `style.css` — global styles + light/dark themes + palette/terminal/aurora
- `loader.js` — API integrations, sessionStorage caching, theme toggle
- `js/palette.js` — ⌘K command palette
- `js/terminal.js` — interactive contact terminal

## Conventions
- No frameworks, no build tools — keep it vanilla
- Editorial dark aesthetic: deep green-black bg (`#080c08`), neon yellow-green accent (`#ccff00`), serif display headings (`Playfair Display`) + monospace terminals (`Fira Code`)
- Theme toggle: `[data-theme="light"]` selector overrides in CSS
- Respect `prefers-reduced-motion` for every animation
- CSP: no inline `style=` attributes in HTML (blocked; tests enforce this).
  `lab.html` additionally allows jsDelivr/Hugging Face + `'wasm-unsafe-eval'` for the embedding model.
  If you edit the JSON-LD block in `index.html`, recompute its sha256 CSP hash
  (`tests/run_tests.sh` verifies it).
- All `target="_blank"` links need `rel="noopener"` (tests enforce this)
- Branch prefix: `claude/`
