// terminal.js — interactive faux-terminal in the homepage contact section.
// Progressive enhancement: the container ships with [hidden]; JS reveals it.
// The plain mailto link + social icons below remain the no-JS fallback.

(function () {
    'use strict';

    const EMAIL = 'maximehaegeman@gmail.com';

    const CAT_SRC = 'content/img/cat.webp';
    const ASCII_CAT = [
        '    |\\__/,|   (`\\',
        '  _.|o o  |_   ) )',
        '-(((---(((--------',
    ].join('\n');

    // Builds the cat card. Falls back to ASCII art if the photo is missing.
    function catNode() {
        const fig = document.createElement('figure');
        fig.className = 't-cat';
        const img = document.createElement('img');
        img.src = CAT_SRC;
        img.alt = 'Maxime’s cat, chief morale officer';
        img.decoding = 'async';
        const cap = document.createElement('figcaption');
        cap.textContent = '~/.cat.webp · chief morale officer';
        const scrollDown = () => {
            const out = document.getElementById('terminal-output');
            if (out) out.scrollTop = out.scrollHeight;
        };
        img.addEventListener('error', () => {
            const pre = document.createElement('pre');
            pre.className = 't-ascii';
            pre.textContent = ASCII_CAT;
            img.replaceWith(pre);
            scrollDown();
        });
        img.addEventListener('load', scrollDown);
        fig.appendChild(img);
        fig.appendChild(cap);
        return fig;
    }

    function archivedResume() {
        return [
            ['t-accent', '.resume.txt (archived)'],
            ['t-dim', '─'.repeat(34)],
            ['', 'status   not looking for a new role'],
            ['', 'doing    building AI systems, happily'],
            ['html', 'cv       still on file at <a href="cv.html">/cv.html</a>, if you insist'],
            ['t-dim', '─'.repeat(34)],
            ['', 'here’s my cat instead:'],
            ['node', catNode()],
        ];
    }

    function go(href, label) {
        window.location.href = href;
        return [['', label]];
    }

    const FILES = {
        'contact.txt': () => COMMANDS.email(),
        '.resume.txt': archivedResume,
        'resume.txt': archivedResume,
        '.cat.webp': () => [['node', catNode()]],
    };

    const DIRS = {
        'lab': 'lab.html', 'lab/': 'lab.html',
        'projects': 'projects.html', 'projects/': 'projects.html',
        'blog': 'blog.html', 'blog/': 'blog.html',
        '~': 'index.html', '/': 'index.html',
    };

    const COMMANDS = {
        help: () => [
            ['t-accent', 'available commands:'],
            ['', '  help          show this list'],
            ['', '  whoami        about me'],
            ['', '  lab           open the AI lab'],
            ['', '  search <q>    semantic search over my writing'],
            ['', '  trace         replay an agent run'],
            ['', '  email         get my email address'],
            ['', '  projects      open the projects page'],
            ['', '  blog          open the blog'],
            ['', '  github        my GitHub profile'],
            ['', '  linkedin      my LinkedIn profile'],
            ['', '  medium        my Medium profile'],
            ['', '  ls            list files'],
            ['', '  theme         toggle dark / light'],
            ['', '  clear         clear the terminal'],
            ['t-dim', '  (some files are hidden)'],
        ],
        whoami: () => [
            ['t-accent', 'Maxime Haegeman'],
            ['', 'AI Engineer, Copenhagen, Denmark'],
            ['', 'LLM systems, agents and retrieval, built on solid data foundations.'],
            ['t-dim', 'status: happily building, not job hunting.'],
        ],
        email: () => [
            ['html', `<a href="mailto:${EMAIL}">${EMAIL}</a> — say hi!`],
        ],
        lab: () => go('lab.html', 'cd ~/lab'),
        search: (args) => {
            const q = args.join(' ').trim();
            if (!q) return [['', 'usage: search <question>   e.g. search how to evaluate rag']];
            return go('lab.html?q=' + encodeURIComponent(q) + '#search', `querying the archive for “${q}”…`);
        },
        trace: () => go('lab.html#traces', 'replaying agent trace…'),
        resume: archivedResume,
        cv: archivedResume,
        meow: () => [['node', catNode()]],
        cat: (args) => {
            if (!args.length) return [['', 'cat: missing operand (the animal lives in a hidden file)']];
            const out = [];
            args.forEach(name => {
                const file = FILES[name.replace(/^\.\//, '')];
                if (file) out.push(...file());
                else out.push(['', `cat: ${name}: No such file or directory`]);
            });
            return out;
        },
        ls: (args) => {
            const all = args.some(a => /^-[a-z]*a/.test(a));
            return all
                ? [['', '.  ..  .resume.txt  .cat.webp  lab/  projects/  blog/  contact.txt']]
                : [['', 'lab/  projects/  blog/  contact.txt']];
        },
        cd: (args) => {
            const target = DIRS[(args[0] || '~').toLowerCase()];
            if (!target) return [['', `cd: ${args[0]}: No such file or directory`]];
            return go(target, `cd ${args[0] || '~'}`);
        },
        projects: () => go('projects.html', 'cd ~/projects'),
        blog: () => go('blog.html', 'cd ~/blog'),
        github: () => { window.open('https://github.com/mhaegeman', '_blank', 'noopener'); return [['', 'opening github.com/mhaegeman ↗']]; },
        linkedin: () => { window.open('https://linkedin.com/in/maxime-haegeman', '_blank', 'noopener'); return [['', 'opening linkedin.com/in/maxime-haegeman ↗']]; },
        medium: () => { window.open('https://medium.com/@maximehaegeman', '_blank', 'noopener'); return [['', 'opening medium.com/@maximehaegeman ↗']]; },
        theme: () => {
            const btn = document.getElementById('theme-toggle');
            if (btn) btn.click();
            return [['t-accent', 'theme toggled.']];
        },
        sudo: () => [['t-accent', 'nice try. this incident will be reported. 😄']],
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
                if (cls === 'node') {
                    output.appendChild(text);
                    return;
                }
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

            const [first, ...args] = raw.split(/\s+/);
            const cmd = first.toLowerCase();
            if (cmd === 'clear') {
                output.innerHTML = '';
                return;
            }
            const handler = COMMANDS[cmd];
            if (handler) {
                print(handler(args));
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
