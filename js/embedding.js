/**
 * js/embedding.js
 *
 * Animated embedding space — a t-SNE / UMAP style visualization of skill clusters.
 * Pure Canvas 2D, zero external dependencies. Designed for Maxime's portfolio.
 *
 * Five clusters represent Maxime's technical identity:
 *   Blue   → Languages & data tooling
 *   Purple → ML / AI
 *   Teal   → Data Engineering
 *   Amber  → Cloud & Infrastructure
 *   Lime   → Outputs & results
 */
(function () {
    'use strict';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // ─────────────────────────────────────────────────────────────────────────
    // SCENE DEFINITION
    // ─────────────────────────────────────────────────────────────────────────

    const CLUSTERS = [
        {
            rgb: [121, 192, 255],        // #79c0ff  blue
            center: [-2.1,  0.6,  0.3],
            spread: 0.80,
            count:  50,
            labels: ['Python', 'SQL', 'Bash', 'YAML', 'R', 'pandas', 'NumPy', 'regex'],
        },
        {
            rgb: [210, 168, 255],        // #d2a8ff  purple
            center: [ 0.3, -0.9,  2.1],
            spread: 1.05,
            count:  64,
            labels: ['GPT', 'BERT', 'PyTorch', 'TensorFlow', 'HuggingFace',
                     'XGBoost', 'MLflow', 'SpaCy', 'NLP', 'embeddings', 'fine-tuning', 'RAG'],
        },
        {
            rgb: [32, 217, 210],         // #20d9d2  teal
            center: [ 2.2,  0.4, -0.4],
            spread: 0.90,
            count:  58,
            labels: ['PySpark', 'Airflow', 'Delta Lake', 'Kafka',
                     'dbt', 'Snowflake', 'Databricks', 'ETL', 'streaming', 'batch'],
        },
        {
            rgb: [255, 166, 87],         // #ffa657  amber
            center: [-0.9, -1.9, -1.6],
            spread: 0.76,
            count:  52,
            labels: ['Azure', 'GCP', 'AWS', 'Docker', 'GitHub Actions', 'CI/CD', 'k8s', 'Terraform'],
        },
        {
            rgb: [204, 255, 0],          // #ccff00  lime
            center: [ 0.9,  2.1,  0.3],
            spread: 0.66,
            count:  46,
            labels: ['predictions', 'insights', 'dashboards', 'APIs', 'models', 'reports'],
        },
    ];

    // Hand-picked cross-cluster "bridge" pairs (indices into pts[]) — filled after init
    // Represents real skill overlaps: Python↔ML, Data Eng↔Cloud, ML↔Data Eng
    const BRIDGE_CLUSTER_PAIRS = [[0, 1], [1, 2], [2, 3]];

    // ─────────────────────────────────────────────────────────────────────────
    // RUNTIME STATE
    // ─────────────────────────────────────────────────────────────────────────

    let canvas, ctx;
    let W, H, cx, cy, unitScale;

    let pts   = [];   // all points
    let conns = [];   // flat i,j pairs: same-cluster connections
    let bridges = []; // flat i,j pairs: cross-cluster bridges (very faint)
    let sortedIdx = [];

    let camY = 0.0,  camX = -0.12;   // actual camera angles
    let tgtY = 0.0,  tgtX = -0.12;   // target (mouse drives tgtX, auto-rotate drives tgtY)

    let lastT   = 0;
    let sortTick = 0;

    // Activation pulses: { ci, bx, by, bz, t0 }
    let pulses  = [];
    let lastPulse = 0;
    const PULSE_INTERVAL = 3600;  // ms

    // Per-point pulse accumulator (reset each frame after rendering)
    // stored directly on point objects as .pgl

    // ─────────────────────────────────────────────────────────────────────────
    // MATH HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    function gauss() {
        // Box-Muller
        let u, v;
        do { u = Math.random(); } while (u === 0);
        do { v = Math.random(); } while (v === 0);
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENE INIT
    // ─────────────────────────────────────────────────────────────────────────

    function initScene() {
        pts = [];

        CLUSTERS.forEach((cl, ci) => {
            for (let i = 0; i < cl.count; i++) {
                const labeled = i < cl.labels.length;
                pts.push({
                    // Base 3-D position (not animated — float is added per-frame)
                    bx: cl.center[0] + gauss() * cl.spread,
                    by: cl.center[1] + gauss() * cl.spread,
                    bz: cl.center[2] + gauss() * cl.spread,
                    ci,
                    rgb: cl.rgb,
                    // Visual size (base radius before projection scale)
                    r: labeled ? 2.6 + Math.random() * 1.8 : 0.9 + Math.random() * 1.7,
                    label: labeled ? cl.labels[i] : null,
                    // Oscillation
                    phase:      Math.random() * Math.PI * 2,
                    phaseSpeed: 0.00026 + Math.random() * 0.00032,
                    // Projected (filled each frame)
                    sx: 0, sy: 0, depth: 0, ps: 0,
                    // Pulse glow accumulator
                    pgl: 0,
                });
            }
        });

        // ── Same-cluster connections ──────────────────────────────────
        conns = [];
        const MAX_D2 = 1.55 * 1.55;
        for (let i = 0; i < pts.length; i++) {
            for (let j = i + 1; j < pts.length; j++) {
                if (pts[i].ci !== pts[j].ci) continue;
                const dx = pts[i].bx - pts[j].bx;
                const dy = pts[i].by - pts[j].by;
                const dz = pts[i].bz - pts[j].bz;
                if (dx*dx + dy*dy + dz*dz < MAX_D2) conns.push(i, j);
            }
        }

        // ── Cross-cluster bridges ─────────────────────────────────────
        // Find the two closest labeled points between each bridge pair
        bridges = [];
        BRIDGE_CLUSTER_PAIRS.forEach(([ca, cb]) => {
            let best = Infinity, bi = -1, bj = -1;
            pts.forEach((a, i) => {
                if (a.ci !== ca || !a.label) return;
                pts.forEach((b, j) => {
                    if (b.ci !== cb || !b.label) return;
                    const dx = a.bx - b.bx, dy = a.by - b.by, dz = a.bz - b.bz;
                    const d2 = dx*dx + dy*dy + dz*dz;
                    if (d2 < best) { best = d2; bi = i; bj = j; }
                });
            });
            if (bi >= 0) bridges.push(bi, bj);
        });

        sortedIdx = pts.map((_, i) => i);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROJECTION
    // ─────────────────────────────────────────────────────────────────────────

    function project(p, t) {
        // Gentle per-point float (gives each dot its own personality)
        const fx = Math.cos(p.phase       + t * p.phaseSpeed)        * 0.020;
        const fy = Math.sin(p.phase * 1.3 + t * p.phaseSpeed * 0.82) * 0.028;

        let x = p.bx + fx;
        let y = p.by + fy;
        let z = p.bz;

        // Rotate around Y axis (horizontal orbit)
        const cY = Math.cos(camY), sY = Math.sin(camY);
        const rx  =  x * cY - z * sY;
        const rz  =  x * sY + z * cY;

        // Rotate around X axis (vertical tilt)
        const cX = Math.cos(camX), sX = Math.sin(camX);
        const ry  =  y * cX - rz * sX;
        const rz2 =  y * sX + rz * cX;

        // Perspective divide  (camera at z = +7, fov = 5)
        const d   = rz2 + 7.0;
        const prj = 5.0  / d;

        p.sx    = cx + rx  * prj * unitScale;
        p.sy    = cy + ry  * prj * unitScale;
        p.depth = d;
        p.ps    = prj * unitScale;  // used to scale radius + font
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER FRAME
    // ─────────────────────────────────────────────────────────────────────────

    function frame(ts) {
        const dt = Math.min(ts - lastT, 50);
        lastT = ts;

        // ── Camera smooth follow ──────────────────────────────────────
        camY += (tgtY - camY) * 0.020;
        camX += (tgtX - camX) * 0.020;
        tgtY += 0.000055 * dt;          // auto-rotate ~3 deg/s

        ctx.clearRect(0, 0, W, H);

        // ── Project all points ────────────────────────────────────────
        pts.forEach(p => project(p, ts));

        // ── Depth sort every 4 frames ─────────────────────────────────
        if (++sortTick % 4 === 0) {
            sortedIdx.sort((a, b) => pts[b].depth - pts[a].depth);
        }

        // ── Spawn / expire pulses ─────────────────────────────────────
        if (ts - lastPulse > PULSE_INTERVAL) {
            lastPulse = ts;
            const src = pts[Math.floor(Math.random() * pts.length)];
            pulses.push({ ci: src.ci, bx: src.bx, by: src.by, bz: src.bz, t0: ts });
        }
        pulses = pulses.filter(p => ts - p.t0 < 1600);

        // ── Accumulate pulse glow per point ───────────────────────────
        pulses.forEach(pulse => {
            const age  = (ts - pulse.t0) / 1600;
            const wave = age * 5.8;           // wave front expands in 3-D units
            pts.forEach(p => {
                if (p.ci !== pulse.ci) return;
                const dx = p.bx - pulse.bx;
                const dy = p.by - pulse.by;
                const dz = p.bz - pulse.bz;
                const d  = Math.sqrt(dx*dx + dy*dy + dz*dz);
                const diff = Math.abs(d - wave);
                if (diff < 0.55) {
                    p.pgl = Math.max(p.pgl, (1 - diff / 0.55) * (1 - age) * 0.9);
                }
            });
        });

        // ── Draw cross-cluster bridges (very faint dashed lines) ──────
        ctx.setLineDash([3, 8]);
        ctx.lineWidth = 0.45;
        for (let k = 0; k < bridges.length; k += 2) {
            const a = pts[bridges[k]], b = pts[bridges[k + 1]];
            const [r1, g1, b1_] = a.rgb;
            const [r2, g2, b2_] = b.rgb;
            const avgD = (a.depth + b.depth) * 0.5;
            const alpha = Math.max(0, 0.055 * (1 - (avgD - 5) / 8));
            if (alpha < 0.003) continue;
            // Gradient stroke for the bridge — blends both cluster colors
            const grad = ctx.createLinearGradient(a.sx, a.sy, b.sx, b.sy);
            grad.addColorStop(0, `rgba(${r1},${g1},${b1_},${alpha.toFixed(3)})`);
            grad.addColorStop(1, `rgba(${r2},${g2},${b2_},${alpha.toFixed(3)})`);
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.strokeStyle = grad;
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // ── Draw same-cluster connections ─────────────────────────────
        ctx.lineWidth = 0.55;
        for (let k = 0; k < conns.length; k += 2) {
            const a = pts[conns[k]], b = pts[conns[k + 1]];
            const avgD  = (a.depth + b.depth) * 0.5;
            const fade  = Math.min(1, Math.max(0, (avgD - 4) / 9));
            const dx    = a.bx - b.bx, dy = a.by - b.by, dz = a.bz - b.bz;
            const d3    = Math.sqrt(dx*dx + dy*dy + dz*dz);
            const alpha = 0.11 * (1 - d3 / 1.55) * (1 - fade * 0.55);
            if (alpha < 0.004) continue;
            const [r, g, bl] = a.rgb;
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.strokeStyle = `rgba(${r},${g},${bl},${alpha.toFixed(3)})`;
            ctx.stroke();
        }

        // ── Draw points (back to front) ───────────────────────────────
        sortedIdx.forEach(i => {
            const p   = pts[i];
            const [r, g, bl] = p.rgb;
            const pgl = p.pgl;
            p.pgl = 0;   // reset accumulator

            // Depth-based opacity: far points are dimmer
            const dAlpha = Math.min(1, Math.max(0.18, (p.depth - 2.5) / 9.5));
            // Projected radius
            const sz = Math.max(0.7, p.r * p.ps * 0.68);

            // ── Outer atmospheric glow ────────────────────────────────
            const gr1 = sz * (3.4 + pgl * 4.0);
            if (gr1 > 1.5) {
                const g1 = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, gr1);
                g1.addColorStop(0, `rgba(${r},${g},${bl},${((0.050 + pgl * 0.10) * dAlpha).toFixed(3)})`);
                g1.addColorStop(1, `rgba(${r},${g},${bl},0)`);
                ctx.beginPath();
                ctx.arc(p.sx, p.sy, gr1, 0, 6.2832);
                ctx.fillStyle = g1;
                ctx.fill();
            }

            // ── Inner tight glow ──────────────────────────────────────
            const gr2 = sz * 2.0;
            if (gr2 > 0.8) {
                const g2 = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, gr2);
                g2.addColorStop(0, `rgba(${r},${g},${bl},${((0.22 + pgl * 0.30) * dAlpha).toFixed(3)})`);
                g2.addColorStop(1, `rgba(${r},${g},${bl},0)`);
                ctx.beginPath();
                ctx.arc(p.sx, p.sy, gr2, 0, 6.2832);
                ctx.fillStyle = g2;
                ctx.fill();
            }

            // ── Core dot ──────────────────────────────────────────────
            const coreAlpha = (0.80 + pgl * 0.20) * dAlpha;
            ctx.beginPath();
            ctx.arc(p.sx, p.sy, sz, 0, 6.2832);
            ctx.fillStyle = `rgba(${r},${g},${bl},${coreAlpha.toFixed(3)})`;
            ctx.fill();

            // ── Label ─────────────────────────────────────────────────
            // Only render when the point is large enough (i.e. close to camera)
            if (p.label && sz > 3.0 && dAlpha > 0.45) {
                const la = Math.min(0.52, (sz - 3.0) / 5.5) * dAlpha;
                if (la > 0.04) {
                    const fs = Math.max(8, Math.round(8 + sz * 0.85));
                    ctx.font      = `300 ${fs}px 'Fira Code', monospace`;
                    ctx.fillStyle = `rgba(${r},${g},${bl},${la.toFixed(3)})`;
                    ctx.fillText(p.label, p.sx + sz + 4, p.sy + 3.5);
                }
            }
        });

        requestAnimationFrame(frame);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESIZE
    // ─────────────────────────────────────────────────────────────────────────

    function resize() {
        W  = canvas.width  = window.innerWidth;
        H  = canvas.height = window.innerHeight;
        cx = W * 0.50;
        cy = H * 0.43;                              // slightly above center
        unitScale = Math.min(W, H) * 0.130;
        // On narrow viewports pull the scale in further so clusters stay on-screen
        if (W < 600) unitScale *= 0.78;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BOOTSTRAP
    // ─────────────────────────────────────────────────────────────────────────

    function boot() {
        canvas = document.createElement('canvas');
        canvas.id = 'embedding-bg';

        Object.assign(canvas.style, {
            position:        'fixed',
            top:             '0',
            left:            '0',
            width:           '100%',
            height:          '100%',
            zIndex:          '0',
            pointerEvents:   'none',
            // Fade out below hero — content below stays clean
            maskImage:       'linear-gradient(to bottom, black 48%, transparent 86%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 48%, transparent 86%)',
        });

        document.body.prepend(canvas);
        ctx = canvas.getContext('2d');

        resize();
        initScene();

        window.addEventListener('resize', resize, { passive: true });

        window.addEventListener('mousemove', e => {
            // Gentle vertical parallax tilt from mouse Y
            tgtX = -0.12 + (e.clientY / window.innerHeight - 0.5) * 0.20;
        }, { passive: true });

        lastT = performance.now();
        requestAnimationFrame(frame);
    }

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', boot)
        : boot();

})();
