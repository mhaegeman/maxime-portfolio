// CV section — vanilla JS renderer.
// Builds the density-map layout (roles timeline + skill heatmap) into #cv-timeline.

(function () {
    // Normalize legacy "../content/..." logo paths (from the canvas preview) to
    // the live site's root-relative form.
    if (window.CV_EXPERIENCE) {
        window.CV_EXPERIENCE = window.CV_EXPERIENCE.map(j => ({
            ...j,
            logo: (j.logo || '').replace(/^\.\.\//, ''),
        }));
    }

    // Disable loader.js's legacy timeline renderer on this page.
    window.renderExperience = function () {};

    function h(tag, attrs, children) {
        const el = document.createElement(tag);
        if (attrs) {
            for (const k in attrs) {
                const v = attrs[k];
                if (v == null || v === false) continue;
                if (k === 'class') el.className = v;
                else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
                else if (k === 'cssVars') {
                    for (const cv in v) el.style.setProperty(cv, v[cv]);
                }
                else if (k === 'dataset') Object.assign(el.dataset, v);
                else if (k.startsWith('on') && typeof v === 'function') {
                    el.addEventListener(k.slice(2).toLowerCase(), v);
                }
                else el.setAttribute(k, v);
            }
        }
        (children || []).forEach(c => {
            if (c == null || c === false) return;
            el.appendChild(typeof c === 'string' || typeof c === 'number'
                ? document.createTextNode(String(c))
                : c);
        });
        return el;
    }

    function createLogo(job) {
        const img = new Image();
        img.className = 'cv-logo-img';
        img.src = job.logo;
        img.alt = `${job.company} logo`;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('error', () => {
            const letters = (job.company || '').slice(0, 2).toUpperCase();
            const fallback = h('div', {
                class: 'cv-logo-fallback',
                style: {
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-code)', fontWeight: '600',
                    fontSize: '1rem', letterSpacing: '2px',
                    color: 'var(--accent-color)',
                    border: '1px dashed color-mix(in oklab, var(--accent-color) 40%, transparent)',
                    padding: '6px 10px', borderRadius: '2px',
                },
            }, [letters]);
            img.replaceWith(fallback);
        });
        return img;
    }

    function buildRole(job, state) {
        const article = h('article', {
            class: 'cv-role',
            'aria-expanded': 'false',
        }, [
            h('div', { class: 'cv-role-logo' }, [createLogo(job)]),
            h('div', { class: 'cv-role-main' }, [
                h('span', { class: 'year' }, [job.period]),
                h('p', { class: 'title' }, [job.role]),
                h('p', { class: 'company' }, [
                    `@ ${job.company}${job.companyNote ? ` (${job.companyNote})` : ''}`,
                ]),
            ]),
            h('span', { class: 'cv-pill' }, [window.CV_DURATION(job.start, job.end)]),
            h('div', { class: 'cv-role-detail' }, [
                h('div', { class: 'cv-role-detail-inner' }, [
                    h('p', { style: { margin: '0' } }, [job.description]),
                    h('ul', {}, (job.achievements || []).map(a => h('li', {}, [a]))),
                    h('div', { class: 'cv-role-stack' },
                        (job.stack || []).map(s => h('span', { class: `cv-chip c-${s.c}` }, [s.label]))
                    ),
                ]),
            ]),
        ]);

        article.addEventListener('click', () => {
            const isOpen = article.getAttribute('aria-expanded') === 'true';
            if (state.openEl && state.openEl !== article) {
                state.openEl.setAttribute('aria-expanded', 'false');
            }
            article.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
            state.openEl = isOpen ? null : article;
        });
        return article;
    }

    function buildMatrix(matrix) {
        const grid = h('div', {
            class: 'cv-matrix-grid',
            cssVars: { '--years': matrix.years.length },
        });

        const headerRow = h('div', {
            class: 'cv-matrix-row',
            cssVars: { '--years': matrix.years.length },
        }, [
            h('div', { class: 'cell-label', style: { opacity: '0' } }, ['_']),
            ...matrix.years.map(y => h('div', { class: 'cell-header' }, [String(y).slice(2)])),
        ]);
        grid.appendChild(headerRow);

        matrix.groups.forEach(group => {
            grid.appendChild(h('div', { class: 'cv-matrix-group-label' }, [group.label]));
            group.rows.forEach(row => {
                const rowEl = h('div', {
                    class: 'cv-matrix-row',
                    cssVars: { '--years': matrix.years.length },
                }, [
                    h('div', { class: 'cell-label' }, [row.label]),
                    ...row.values.map((v, i) => h('div', {
                        class: 'cv-cell',
                        dataset: { v: String(v) },
                        cssVars: { '--v': String(v) },
                        title: `${row.label} · ${matrix.years[i]} · lvl ${v}/4`,
                    })),
                ]);
                grid.appendChild(rowEl);
            });
        });

        const legend = h('div', { class: 'cv-legend' }, [
            h('span', {}, ['_intensity']),
            h('span', { class: 'scale' },
                [0, 1, 2, 3, 4].map(v => h('span', {
                    style: {
                        background: v === 0
                            ? 'transparent'
                            : `color-mix(in oklab, var(--accent-color) ${v * 20}%, transparent)`,
                        borderStyle: v === 0 ? 'dashed' : 'solid',
                    },
                }))
            ),
            h('span', {}, ['low → high']),
        ]);

        return h('div', { class: 'cv-matrix' }, [grid, legend]);
    }

    function buildSection() {
        const state = { openEl: null };
        const matrix = window.CV_SKILL_MATRIX;

        return h('div', { class: 'cv-section' }, [
            h('div', { class: 'cv-grid' }, [
                h('div', { class: 'cv-reveal' }, [
                    h('span', { class: 'cv-section-label' }, ['_roles.timeline']),
                    h('div', { class: 'cv-roles' },
                        (window.CV_EXPERIENCE || []).map(job => buildRole(job, state))
                    ),
                ]),
                h('div', { class: 'cv-reveal' }, [
                    h('span', { class: 'cv-section-label' }, ['_skill_density.heatmap']),
                    buildMatrix(matrix),
                ]),
            ]),
        ]);
    }

    function mount() {
        const host = document.getElementById('cv-timeline');
        if (!host) return;
        if (!window.CV_EXPERIENCE || !window.CV_SKILL_MATRIX) return;

        host.innerHTML = '';
        host.classList.remove('timeline');
        host.classList.add('cv-host');
        host.appendChild(buildSection());

        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('is-visible');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.12 });
        host.querySelectorAll('.cv-reveal').forEach(c => io.observe(c));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
