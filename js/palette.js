// palette.js — ⌘K command palette (vanilla JS, no deps)
// Terminal-styled quick navigation: pages, theme, language, links.
// Opens with Cmd/Ctrl+K or the nav "⌘K" hint button.

(function () {
    'use strict';

    function t(key, fallback) {
        return (window.i18n && window.i18n.t) ? window.i18n.t(key) : fallback;
    }

    function buildCommands() {
        return [
            { group: 'GOTO', icon: '~/', label: t('nav.about', 'About'), hint: 'index', run: () => { window.location.href = 'index.html'; } },
            { group: 'GOTO', icon: '~/', label: t('nav.projects', 'Projects'), hint: 'github', run: () => { window.location.href = 'projects.html'; } },
            { group: 'GOTO', icon: '~/', label: t('nav.blog', 'Blog'), hint: 'medium', run: () => { window.location.href = 'blog.html'; } },
            { group: 'GOTO', icon: '~/', label: t('nav.resume', 'Resume'), hint: 'cv', run: () => { window.location.href = 'cv.html'; } },
            { group: 'RUN', icon: '$', label: 'toggle_theme', hint: 'dark/light', keepOpen: false, run: () => {
                const btn = document.getElementById('theme-toggle');
                if (btn) btn.click();
            } },
            { group: 'RUN', icon: '$', label: 'download_resume --pdf', hint: 'file', run: () => {
                const a = document.createElement('a');
                a.href = 'content/resume_2026.pdf';
                a.download = 'Maxime_Haegeman_2026.pdf';
                document.body.appendChild(a);
                a.click();
                a.remove();
            } },
            { group: 'RUN', icon: '$', label: 'lang --set en', hint: 'English', run: () => window.i18n && window.i18n.setLang('en') },
            { group: 'RUN', icon: '$', label: 'lang --set es', hint: 'Español', run: () => window.i18n && window.i18n.setLang('es') },
            { group: 'RUN', icon: '$', label: 'lang --set fr', hint: 'Français', run: () => window.i18n && window.i18n.setLang('fr') },
            { group: 'RUN', icon: '$', label: 'lang --set da', hint: 'Dansk', run: () => window.i18n && window.i18n.setLang('da') },
            { group: 'CONNECT', icon: '@', label: 'github.com/mhaegeman', hint: '↗', run: () => window.open('https://github.com/mhaegeman', '_blank', 'noopener') },
            { group: 'CONNECT', icon: '@', label: 'linkedin.com/in/maxime-haegeman', hint: '↗', run: () => window.open('https://linkedin.com/in/maxime-haegeman', '_blank', 'noopener') },
            { group: 'CONNECT', icon: '@', label: 'medium.com/@maximehaegeman', hint: '↗', run: () => window.open('https://medium.com/@maximehaegeman', '_blank', 'noopener') },
            { group: 'CONNECT', icon: '@', label: 'mail maximehaegeman@gmail.com', hint: '✉', run: () => { window.location.href = 'mailto:maximehaegeman@gmail.com'; } },
        ];
    }

    let overlay, input, list, commands, filtered, selectedIdx;

    function fuzzyMatch(q, text) {
        // Every query char must appear in order (case-insensitive)
        q = q.toLowerCase();
        text = text.toLowerCase();
        let i = 0;
        for (const ch of text) {
            if (ch === q[i]) i++;
            if (i === q.length) return true;
        }
        return q.length === 0;
    }

    function render() {
        list.innerHTML = '';
        if (!filtered.length) {
            const empty = document.createElement('li');
            empty.className = 'palette-empty';
            empty.textContent = 'command not found — try "projects" or "theme"';
            list.appendChild(empty);
            return;
        }
        let lastGroup = null;
        filtered.forEach((cmd, idx) => {
            if (cmd.group !== lastGroup) {
                lastGroup = cmd.group;
                const g = document.createElement('li');
                g.className = 'palette-group-label';
                g.textContent = '// ' + cmd.group;
                g.setAttribute('aria-hidden', 'true');
                list.appendChild(g);
            }
            const li = document.createElement('li');
            li.className = 'palette-item' + (idx === selectedIdx ? ' selected' : '');
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', idx === selectedIdx ? 'true' : 'false');
            li.innerHTML = '<span class="palette-item-icon"></span><span class="palette-item-label"></span><span class="palette-item-hint"></span>';
            li.querySelector('.palette-item-icon').textContent = cmd.icon;
            li.querySelector('.palette-item-label').textContent = cmd.label;
            li.querySelector('.palette-item-hint').textContent = cmd.hint || '';
            li.addEventListener('click', () => execute(cmd));
            li.addEventListener('mousemove', () => {
                if (selectedIdx !== idx) { selectedIdx = idx; render(); }
            });
            list.appendChild(li);
        });
        const sel = list.querySelector('.palette-item.selected');
        if (sel) sel.scrollIntoView({ block: 'nearest' });
    }

    function filter() {
        const q = input.value.trim();
        filtered = commands.filter(c => fuzzyMatch(q, c.label + ' ' + c.group + ' ' + (c.hint || '')));
        selectedIdx = 0;
        render();
    }

    function execute(cmd) {
        close();
        cmd.run();
    }

    function open() {
        commands = buildCommands(); // rebuild for current language
        overlay.classList.add('open');
        input.value = '';
        filter();
        // Delay focus until the overlay is interactable
        requestAnimationFrame(() => input.focus());
        document.body.style.overflow = 'hidden';
    }

    function close() {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    function isOpen() {
        return overlay.classList.contains('open');
    }

    function build() {
        overlay = document.createElement('div');
        overlay.className = 'palette-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Command palette');
        overlay.innerHTML = `
            <div class="palette-panel">
                <div class="palette-input-row">
                    <span class="palette-ps1">$</span>
                    <input type="text" class="palette-input" placeholder="run a command or jump to a page…"
                        autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search commands">
                    <span class="palette-esc">ESC</span>
                </div>
                <ul class="palette-list" role="listbox"></ul>
            </div>`;
        document.body.appendChild(overlay);

        input = overlay.querySelector('.palette-input');
        list = overlay.querySelector('.palette-list');

        overlay.addEventListener('click', (ev) => {
            if (!overlay.querySelector('.palette-panel').contains(ev.target)) close();
        });

        input.addEventListener('input', filter);
        input.addEventListener('keydown', (ev) => {
            if (ev.key === 'ArrowDown') {
                ev.preventDefault();
                selectedIdx = Math.min(selectedIdx + 1, filtered.length - 1);
                render();
            } else if (ev.key === 'ArrowUp') {
                ev.preventDefault();
                selectedIdx = Math.max(selectedIdx - 1, 0);
                render();
            } else if (ev.key === 'Enter') {
                ev.preventDefault();
                if (filtered[selectedIdx]) execute(filtered[selectedIdx]);
            }
        });

        document.addEventListener('keydown', (ev) => {
            if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
                ev.preventDefault();
                isOpen() ? close() : open();
            } else if (ev.key === 'Escape' && isOpen()) {
                close();
            }
        });

        // Nav hint button (desktop)
        const navControls = document.querySelector('.nav-controls');
        if (navControls) {
            const hint = document.createElement('button');
            hint.className = 'palette-hint';
            hint.type = 'button';
            hint.textContent = '⌘K';
            hint.setAttribute('aria-label', 'Open command palette');
            hint.addEventListener('click', open);
            navControls.insertBefore(hint, navControls.firstChild);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
})();
