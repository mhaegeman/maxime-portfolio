/**
 * js/vanta-bg.js
 *
 * Initializes Vanta.js NET effect as a full-page animated background.
 * Adapts colors to dark/light theme and reacts to theme toggles.
 */
(function () {
    'use strict';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var vantaEffect = null;

    function isDark() {
        return document.documentElement.getAttribute('data-theme') !== 'light';
    }

    function getColors() {
        if (isDark()) {
            return {
                color: 0x2a7a2a,
                backgroundColor: 0x080c08,
            };
        }
        return {
            color: 0x3d7a00,
            backgroundColor: 0xf8f6f0,
        };
    }

    function initVanta() {
        if (typeof VANTA === 'undefined' || !VANTA.NET) return;

        // Skip if embedding.js already provides a full-screen background animation
        if (document.getElementById('embedding-bg')) return;

        var el = document.getElementById('vanta-bg');
        if (!el) {
            el = document.createElement('div');
            el.id = 'vanta-bg';
            document.body.prepend(el);
        }

        var colors = getColors();
        vantaEffect = VANTA.NET({
            el: el,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200,
            minWidth: 200,
            scale: 1.0,
            scaleMobile: 1.0,
            color: colors.color,
            backgroundColor: colors.backgroundColor,
            points: 8,
            maxDistance: 20,
            spacing: 16,
            showDots: true,
        });

        // React to theme changes via data-theme attribute
        new MutationObserver(function () {
            if (!vantaEffect) return;
            vantaEffect.setOptions(getColors());
        }).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
    }

    // Vanta CDN scripts use defer, so wait for full load
    window.addEventListener('load', initVanta);
})();
