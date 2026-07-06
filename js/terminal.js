// terminal.js — interactive faux-terminal in the homepage contact section.
// Progressive enhancement: the container ships with [hidden]; JS reveals it.
// The plain mailto link + social icons below remain the no-JS fallback.

(function () {
    'use strict';

    const EMAIL = 'maximehaegeman@gmail.com';

    const COMMANDS = {
        help: () => [
            ['t-accent', 'available commands:'],
            ['', '  help        show this list'],
            ['', '  whoami      about me'],
            ['', '  email       get my email address'],
            ['', '  resume      download my resume (pdf)'],
            ['', '  projects    open the projects page'],
            ['', '  blog        open the blog'],
            ['', '  github      my GitHub profile'],
            ['', '  linkedin    my LinkedIn profile'],
            ['', '  medium      my Medium profile'],
            ['', '  theme       toggle dark / light'],
            ['', '  clear       clear the terminal'],
        ],
        whoami: () => [
            ['t-accent', 'Maxime Haegeman'],
            ['', 'Senior Data / ML Engineer — Copenhagen, Denmark'],
            ['', 'From messy data to reliable predictions, at scale.'],
        ],
        email: () => [
            ['html', `<a href="mailto:${EMAIL}">${EMAIL}</a> — say hi!`],
        ],
        resume: () => {
            const a = document.createElement('a');
            a.href = 'content/resume_2026.pdf';
            a.download = 'Maxime_Haegeman_2026.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            return [['t-accent', 'downloading resume_2026.pdf…']];
        },
        cv: () => COMMANDS.resume(),
        projects: () => { window.location.href = 'projects.html'; return [['', 'cd ~/projects']]; },
        blog: () => { window.location.href = 'blog.html'; return [['', 'cd ~/blog']]; },
        github: () => { window.open('https://github.com/mhaegeman', '_blank', 'noopener'); return [['', 'opening github.com/mhaegeman ↗']]; },
        linkedin: () => { window.open('https://linkedin.com/in/maxime-haegeman', '_blank', 'noopener'); return [['', 'opening linkedin.com/in/maxime-haegeman ↗']]; },
        medium: () => { window.open('https://medium.com/@maximehaegeman', '_blank', 'noopener'); return [['', 'opening medium.com/@maximehaegeman ↗']]; },
        theme: () => {
            const btn = document.getElementById('theme-toggle');
            if (btn) btn.click();
            return [['t-accent', 'theme toggled.']];
        },
        sudo: () => [['t-accent', 'nice try. this incident will be reported. 😄']],
        ls: () => [['', 'projects/  blog/  cv.pdf  contact.txt']],
        pwd: () => [['', '/home/visitor']],
        hello: () => [['t-accent', 'hej! 👋']],
        hi: () => COMMANDS.hello(),
    };

    function init() {
        const box = document.getElementById('contact-terminal');
        const output = document.getElementById('terminal-output');
        const input = document.getElementById('terminal-input');
        if (!box || !output || !input) return;

        box.hidden = false;

        function print(lines) {
            lines.forEach(([cls, text]) => {
                const div = document.createElement('div');
                if (cls === 'html') {
                    // Only trusted, hardcoded strings from COMMANDS reach this branch.
                    div.innerHTML = text;
                } else {
                    if (cls) div.className = cls;
                    div.textContent = text;
                }
                output.appendChild(div);
            });
            output.scrollTop = output.scrollHeight;
        }

        print([
            ['t-accent', '# interactive shell — type \'help\' to explore'],
        ]);

        const history = [];
        let histIdx = -1;

        input.addEventListener('keydown', (ev) => {
            if (ev.key === 'ArrowUp') {
                ev.preventDefault();
                if (history.length) {
                    histIdx = histIdx <= 0 ? history.length - 1 : histIdx - 1;
                    input.value = history[histIdx];
                }
                return;
            }
            if (ev.key === 'ArrowDown') {
                ev.preventDefault();
                if (histIdx >= 0 && histIdx < history.length - 1) {
                    histIdx++;
                    input.value = history[histIdx];
                } else {
                    histIdx = -1;
                    input.value = '';
                }
                return;
            }
            if (ev.key !== 'Enter') return;

            const raw = input.value.trim();
            input.value = '';
            if (!raw) return;
            history.push(raw);
            histIdx = -1;

            const echo = document.createElement('div');
            echo.innerHTML = '<span class="t-accent">$ </span><span class="t-cmd"></span>';
            echo.querySelector('.t-cmd').textContent = raw;
            output.appendChild(echo);

            const cmd = raw.toLowerCase().split(/\s+/)[0];
            if (cmd === 'clear') {
                output.innerHTML = '';
                return;
            }
            const handler = COMMANDS[cmd];
            if (handler) {
                print(handler());
            } else {
                print([['', `command not found: ${cmd} — try 'help'`]]);
            }
            output.scrollTop = output.scrollHeight;
        });

        // Focus the input when the terminal chrome is clicked
        box.addEventListener('click', (ev) => {
            if (ev.target.closest('a')) return;
            input.focus({ preventScroll: true });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
