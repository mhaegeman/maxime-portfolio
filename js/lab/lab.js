// lab.js — page-level behaviour for the AI lab: scroll reveal + section index.

(function () {
    'use strict';

    function initReveal() {
        const targets = document.querySelectorAll('.lab-exp-head, .lab-window, .nb-card, .lab-index');
        if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        targets.forEach((el, i) => {
            el.classList.add('reveal');
            if (el.classList.contains('nb-card')) el.style.setProperty('--stagger-index', i % 3);
        });
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('visible');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
        targets.forEach(el => io.observe(el));
    }

    // Highlight the experiment currently in view in the index strip.
    function initIndex() {
        const links = Array.from(document.querySelectorAll('.lab-index-link'));
        if (!links.length || !('IntersectionObserver' in window)) return;
        const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const link = byId.get(entry.target.id);
                if (link) link.classList.toggle('in-view', entry.isIntersecting);
            });
        }, { rootMargin: '-45% 0px -45% 0px' });
        byId.forEach((_, id) => {
            const section = document.getElementById(id);
            if (section) io.observe(section);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initReveal();
        initIndex();
    });
})();
