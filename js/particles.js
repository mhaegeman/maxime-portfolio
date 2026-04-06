// js/particles.js — Particle network background animation

function initParticleNetwork() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-bg';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId = null;
    let w, h;

    // ── Theme colors ──────────────────────────────────────────────
    const THEMES = {
        dark:  { r: 204, g: 255, b: 0 },   // lime (#ccff00)
        light: { r: 61,  g: 122, b: 0 }     // forest green (#3d7a00)
    };

    function getThemeColor() {
        const theme = document.documentElement.getAttribute('data-theme');
        return THEMES[theme] || THEMES.dark;
    }

    // ── Config ────────────────────────────────────────────────────
    const CONFIG = {
        particleOpacity: 0.35,
        lineOpacity: 0.15,
        maxDistance: 150,
        minRadius: 1.5,
        maxRadius: 3,
        minSpeed: 0.15,
        maxSpeed: 0.4
    };

    function getParticleCount() {
        if (w < 480) return 20;
        if (w < 900) return 30;
        return 50;
    }

    // ── Particle ──────────────────────────────────────────────────
    function createParticle() {
        const r = CONFIG.minRadius + Math.random() * (CONFIG.maxRadius - CONFIG.minRadius);
        const speed = CONFIG.minSpeed + Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed);
        const angle = Math.random() * Math.PI * 2;
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            r: r
        };
    }

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;

        const target = getParticleCount();
        while (particles.length < target) particles.push(createParticle());
        while (particles.length > target) particles.pop();
    }

    // ── Animation loop ────────────────────────────────────────────
    function draw() {
        ctx.clearRect(0, 0, w, h);
        const { r: cr, g: cg, b: cb } = getThemeColor();

        // Move & draw particles
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off edges
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;

            // Clamp inside viewport
            p.x = Math.max(0, Math.min(w, p.x));
            p.y = Math.max(0, Math.min(h, p.y));

            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${CONFIG.particleOpacity})`;
            ctx.fill();
        }

        // Draw connecting lines
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.maxDistance) {
                    const alpha = CONFIG.lineOpacity * (1 - dist / CONFIG.maxDistance);
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }

        animId = requestAnimationFrame(draw);
    }

    // ── Init ──────────────────────────────────────────────────────
    resize();

    // Respect reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
        // Render one static frame
        draw();
        cancelAnimationFrame(animId);
        animId = null;
    } else {
        draw();
    }

    // Pause/resume on preference change
    motionQuery.addEventListener('change', function (e) {
        if (e.matches) {
            if (animId) { cancelAnimationFrame(animId); animId = null; }
        } else {
            if (!animId) draw();
        }
    });

    // Resize handler (debounced)
    let resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    // Watch for theme changes
    new MutationObserver(function () {
        // Colors update on next frame automatically via getThemeColor()
    }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
}
