// trace-viewer.js — replays agent traces as a live span waterfall.
// Data: window.LAB_TRACES (js/lab/traces-data.js). No dependencies.

(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const KIND_GLYPH = { agent: '▣', llm: '◆', tool: '▸', retrieval: '◎', eval: '✓' };
    const SPEEDS = [1, 2, 4];

    function el(tag, cls, text) {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }

    function esc(s) {
        return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    }

    function fmt(ms) {
        if (ms < 1000) return Math.round(ms) + 'ms';
        return (ms / 1000).toFixed(2) + 's';
    }

    function fmtTokens(n) {
        return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n));
    }

    // Pretty JSON with syntax classes; multi-line strings keep their newlines.
    function jsonHtml(value) {
        const src = esc(JSON.stringify(value, null, 2));
        return src.replace(/("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, m => {
            if (m[0] === '"') {
                if (/:$/.test(m)) return `<span class="j-k">${m.replace(/:$/, '')}</span>:`;
                return `<span class="j-s">${m.replace(/\\n/g, '\n').replace(/\\"/g, '"')}</span>`;
            }
            if (/^(true|false|null)$/.test(m)) return `<span class="j-b">${m}</span>`;
            return `<span class="j-n">${m}</span>`;
        });
    }

    // Plain text with light diff colouring (lines starting with + / - / @@).
    function textHtml(text) {
        return text.split('\n').map(line => {
            const e = esc(line);
            if (/^\+(?!\+\+)/.test(line)) return `<span class="d-add">${e}</span>`;
            if (/^-(?!--)/.test(line)) return `<span class="d-del">${e}</span>`;
            if (/^(@@|\+\+\+|---)/.test(line)) return `<span class="d-hunk">${e}</span>`;
            return e;
        }).join('\n');
    }

    function init() {
        const app = document.getElementById('trace-app');
        const traces = window.LAB_TRACES;
        if (!app || !Array.isArray(traces) || !traces.length) return;

        const pathEl = document.getElementById('tr-path');
        const statusEl = document.getElementById('tr-status');

        // ── skeleton ────────────────────────────────────────────
        const tabs = el('div', 'tr-tabs');
        tabs.setAttribute('role', 'tablist');
        tabs.setAttribute('aria-label', 'Traces');

        const prompt = el('div', 'tr-prompt');
        const promptK = el('span', 'tr-prompt-k', 'input');
        const promptV = el('span', 'tr-prompt-v');
        prompt.append(promptK, promptV);

        const meta = el('div', 'tr-meta');
        const metric = (k) => {
            const c = el('div', 'tr-metric');
            const v = el('span', 'tr-metric-v', '—');
            c.append(el('span', 'tr-metric-k', k), v);
            meta.appendChild(c);
            return v;
        };
        const M = {
            elapsed: metric('elapsed'),
            llm: metric('llm calls'),
            tools: metric('tool calls'),
            tokens: metric('tokens'),
            errors: metric('errors'),
            verdict: metric('eval'),
        };

        const transport = el('div', 'tr-transport');
        const btn = (cls, label, glyph) => {
            const b = el('button', 'tr-btn ' + cls, glyph);
            b.type = 'button';
            b.setAttribute('aria-label', label);
            b.title = label;
            return b;
        };
        const bRestart = btn('tr-btn--restart', 'Restart', '⟲');
        const bPrev = btn('tr-btn--prev', 'Previous span', '⏮');
        const bPlay = btn('tr-btn--play', 'Play', '▶');
        const bNext = btn('tr-btn--next', 'Next span', '⏭');
        const scrub = el('div', 'tr-scrub');
        scrub.setAttribute('role', 'slider');
        scrub.setAttribute('aria-label', 'Trace time');
        scrub.tabIndex = 0;
        const scrubTrack = el('div', 'tr-scrub-track');
        const scrubFill = el('div', 'tr-scrub-fill');
        const scrubMarks = el('div', 'tr-scrub-marks');
        const scrubHandle = el('div', 'tr-scrub-handle');
        scrubTrack.append(scrubFill, scrubMarks, scrubHandle);
        scrub.appendChild(scrubTrack);
        const clock = el('span', 'tr-clock', '0ms');
        const speeds = el('div', 'tr-speeds');
        speeds.setAttribute('role', 'radiogroup');
        speeds.setAttribute('aria-label', 'Playback speed');
        const speedBtns = SPEEDS.map(s => {
            const b = el('button', 'tr-speed', s + '×');
            b.type = 'button';
            b.dataset.speed = s;
            b.setAttribute('role', 'radio');
            b.addEventListener('click', () => { P.speed = s; syncSpeed(); });
            speeds.appendChild(b);
            return b;
        });
        transport.append(bRestart, bPrev, bPlay, bNext, scrub, clock, speeds);

        const body = el('div', 'tr-body');
        const wf = el('div', 'tr-wf');
        const axis = el('div', 'tr-axis');
        const rowsEl = el('div', 'tr-rows');
        const playhead = el('div', 'tr-playhead');
        rowsEl.appendChild(playhead);
        wf.append(axis, rowsEl);

        const insp = el('aside', 'tr-insp');
        insp.setAttribute('aria-live', 'off');
        body.append(wf, insp);

        const output = el('div', 'tr-output');
        const outputHead = el('div', 'tr-output-head');
        const outputK = el('span', 'tr-output-k', 'final output');
        const outputSrc = el('span', 'tr-output-src');
        outputHead.append(outputK, outputSrc);
        const outputV = el('div', 'tr-output-v');
        output.append(outputHead, outputV);

        app.append(tabs, prompt, meta, transport, body, output);

        // ── state ───────────────────────────────────────────────
        const P = {
            trace: null,
            spans: [],
            byId: {},
            D: 1,
            t: 0,
            playing: false,
            speed: 1,
            selected: null,
            follow: true,
            last: 0,
            raf: 0,
            finalSpan: null,
            inspKey: '',
        };

        function depthOf(span) {
            let d = 0;
            let p = span.parent && P.byId[span.parent];
            while (p) { d++; p = p.parent && P.byId[p.parent]; }
            return d;
        }

        // Pre-order walk so children sit under their parent; siblings by start.
        function ordered(spans) {
            const kids = {};
            spans.forEach(s => { (kids[s.parent || '_'] = kids[s.parent || '_'] || []).push(s); });
            Object.values(kids).forEach(list => list.sort((a, b) => a.start - b.start));
            const out = [];
            (function walk(id) { (kids[id] || []).forEach(s => { out.push(s); walk(s.id); }); })('_');
            return out;
        }

        function load(idx, autoplay) {
            const trace = traces[idx];
            P.trace = trace;
            P.byId = {};
            trace.spans.forEach(s => { P.byId[s.id] = s; });
            P.spans = ordered(trace.spans);
            P.D = Math.max(...trace.spans.map(s => s.end));
            P.speed = trace.speed || 1;
            P.follow = true;
            P.selected = null;
            P.inspKey = '';
            const llms = trace.spans.filter(s => s.kind === 'llm' && typeof s.output === 'string');
            P.finalSpan = llms.sort((a, b) => b.end - a.end)[0] || null;

            tabs.querySelectorAll('.tr-tab').forEach((b, i) => {
                b.classList.toggle('active', i === idx);
                b.setAttribute('aria-selected', i === idx ? 'true' : 'false');
                b.tabIndex = i === idx ? 0 : -1;
            });
            pathEl.textContent = `trace://${trace.id}`;
            promptV.textContent = trace.input;
            outputSrc.textContent = P.finalSpan ? `← ${P.finalSpan.name}` : '';
            syncSpeed();
            buildAxis();
            buildRows();
            buildMarks();
            P.t = reduceMotion && !autoplay ? P.D : 0;
            update(true);
            if (autoplay) play(); else pause();
        }

        function buildAxis() {
            axis.innerHTML = '';
            axis.appendChild(el('span', 'tr-axis-name', 'span'));
            const ticks = el('span', 'tr-axis-track');
            [0, 0.25, 0.5, 0.75, 1].forEach(f => {
                const tick = el('span', 'tr-tick', fmt(P.D * f));
                tick.style.setProperty('--x', f);
                ticks.appendChild(tick);
            });
            axis.append(ticks, el('span', 'tr-axis-dur', 'dur'));
        }

        function buildRows() {
            rowsEl.querySelectorAll('.tr-row').forEach(r => r.remove());
            P.spans.forEach(s => {
                const row = el('button', 'tr-row');
                row.type = 'button';
                row.dataset.kind = s.kind;
                row.setAttribute('aria-label', `${s.kind} span ${s.name}`);
                row.dataset.state = 'pending';
                if (s.status === 'error') row.dataset.error = 'true';
                row.style.setProperty('--depth', depthOf(s));
                const name = el('span', 'tr-row-name');
                name.append(el('span', 'tr-glyph', KIND_GLYPH[s.kind] || '•'), el('span', 'tr-row-label', s.name));
                const track = el('span', 'tr-row-track');
                const bar = el('span', 'tr-row-bar');
                bar.style.setProperty('--l', s.start / P.D);
                track.appendChild(bar);
                const dur = el('span', 'tr-row-dur', '');
                row.append(name, track, dur);
                row.addEventListener('click', () => {
                    P.follow = false;
                    select(s);
                });
                s._row = row;
                s._bar = bar;
                s._dur = dur;
                s._state = '';
                rowsEl.appendChild(row);
            });
        }

        function buildMarks() {
            scrubMarks.innerHTML = '';
            P.spans.filter(s => s.kind !== 'agent').forEach(s => {
                const m = el('span', 'tr-mark');
                m.dataset.kind = s.status === 'error' ? 'error' : s.kind;
                m.style.setProperty('--x', s.end / P.D);
                scrubMarks.appendChild(m);
            });
        }

        function syncSpeed() {
            speedBtns.forEach(b => {
                const on = Number(b.dataset.speed) === P.speed;
                b.classList.toggle('active', on);
                b.setAttribute('aria-checked', on ? 'true' : 'false');
            });
        }

        // ── per-frame update ────────────────────────────────────
        function spanState(s) {
            if (P.t < s.start) return 'pending';
            if (P.t >= s.end) return 'done';
            return 'running';
        }

        function update(force) {
            const t = P.t;
            const f = t / P.D;
            rowsEl.style.setProperty('--t', f);
            scrubFill.style.transform = `scaleX(${f})`;
            scrubHandle.style.setProperty('--x', f);
            scrub.setAttribute('aria-valuenow', Math.round(t));
            scrub.setAttribute('aria-valuemax', Math.round(P.D));
            scrub.setAttribute('aria-valuetext', `${fmt(t)} of ${fmt(P.D)}`);
            clock.textContent = `${fmt(t)} / ${fmt(P.D)}`;

            let llmN = 0; let llmT = 0; let toolN = 0; let toolT = 0; let tokens = 0; let errors = 0;
            let latest = null;
            let verdict = null;
            P.spans.forEach(s => {
                const st = spanState(s);
                if (st !== s._state || force) {
                    s._state = st;
                    s._row.dataset.state = st;
                    s._dur.textContent = st === 'pending' ? '' : (st === 'done' ? fmt(s.end - s.start) : '…');
                }
                const w = st === 'pending' ? 0 : (Math.min(t, s.end) - s.start) / P.D;
                s._bar.style.setProperty('--w', w);
                if (s.kind === 'llm') { llmT++; if (st !== 'pending') llmN++; }
                if (s.kind === 'tool' || s.kind === 'retrieval') { toolT++; if (st !== 'pending') toolN++; }
                if (s.tokens && st !== 'pending') {
                    const p = st === 'done' ? 1 : (t - s.start) / (s.end - s.start);
                    tokens += s.tokens.in + s.tokens.out * p;
                }
                if (s.status === 'error' && st === 'done') errors++;
                if (s.kind === 'eval' && st === 'done' && s.output && s.output.verdict) verdict = s.output.verdict;
                if (st !== 'pending' && s.kind !== 'agent' && (!latest || s.start >= latest.start)) latest = s;
            });

            M.elapsed.textContent = fmt(t);
            M.llm.textContent = `${llmN}/${llmT}`;
            M.tools.textContent = `${toolN}/${toolT}`;
            M.tokens.textContent = fmtTokens(tokens);
            M.errors.textContent = String(errors);
            M.errors.parentNode.classList.toggle('is-bad', errors > 0);
            M.verdict.textContent = verdict || '—';
            M.verdict.parentNode.classList.toggle('is-good', verdict === 'pass');

            const done = t >= P.D;
            const running = P.playing && !done;
            statusEl.dataset.state = done ? 'ok' : (running ? 'busy' : 'idle');
            statusEl.querySelector('.lab-window-status-text').textContent = done ? (errors ? `done · ${errors} retried` : 'done') : (running ? 'running' : 'paused');

            if (P.follow && latest && latest !== P.selected) select(latest, true);
            else renderInspector();
            renderOutput();
        }

        function select(span, auto) {
            P.selected = span;
            P.spans.forEach(s => s._row.classList.toggle('selected', s === span));
            if (!auto && span._row.scrollIntoView) span._row.scrollIntoView({ block: 'nearest' });
            P.inspKey = '';
            renderInspector();
        }

        function streamText(s) {
            const st = spanState(s);
            if (st === 'done') return s.output;
            if (st === 'pending') return '';
            const p = (P.t - s.start) / (s.end - s.start);
            return s.output.slice(0, Math.floor(s.output.length * p));
        }

        function renderInspector() {
            const s = P.selected;
            if (!s) {
                if (P.inspKey !== 'empty') {
                    P.inspKey = 'empty';
                    insp.innerHTML = '<div class="tr-insp-empty"><span class="tr-insp-empty-glyph">◇</span><p>press play or pick a span</p></div>';
                }
                return;
            }
            const st = spanState(s);
            const streaming = typeof s.output === 'string';
            const progressKey = st === 'running' && streaming ? Math.floor((P.t - s.start) / (s.end - s.start) * s.output.length) : '';
            const key = `${s.id}|${st}|${progressKey}`;
            if (key === P.inspKey) return;
            const structural = P.inspKey.split('|').slice(0, 2).join('|') !== `${s.id}|${st}`;
            P.inspKey = key;

            if (structural) {
                const parent = s.parent ? P.byId[s.parent] : null;
                const rows = [
                    ['start', '+' + fmt(s.start)],
                    ['duration', st === 'pending' ? '—' : (st === 'done' ? fmt(s.end - s.start) : fmt(P.t - s.start) + '…')],
                    s.model ? ['model', s.model] : null,
                    s.tokens ? ['tokens', `${s.tokens.in} in · ${s.tokens.out} out`] : null,
                    parent ? ['parent', parent.name] : null,
                ].filter(Boolean);
                const stLabel = st === 'pending' ? 'scheduled' : (st === 'running' ? 'running' : (s.status === 'error' ? 'error' : 'ok'));
                insp.innerHTML = `
                    <div class="tr-insp-head">
                        <span class="tr-badge" data-kind="${s.kind}">${KIND_GLYPH[s.kind] || '•'} ${s.kind}</span>
                        <span class="tr-insp-state" data-state="${st === 'done' && s.status === 'error' ? 'error' : st}">${stLabel}</span>
                    </div>
                    <h4 class="tr-insp-name">${esc(s.name)}</h4>
                    <dl class="tr-insp-meta">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
                    <div class="tr-insp-block"><span class="tr-insp-k">input</span><pre class="tr-code">${jsonHtml(s.input || {})}</pre></div>
                    <div class="tr-insp-block"><span class="tr-insp-k">output</span><pre class="tr-code tr-code--out"></pre></div>`;
            } else if (st === 'running') {
                const dd = insp.querySelectorAll('.tr-insp-meta dd')[1];
                if (dd) dd.textContent = fmt(P.t - s.start) + '…';
            }

            const out = insp.querySelector('.tr-code--out');
            if (!out) return;
            if (st === 'pending') {
                out.innerHTML = `<span class="tr-wait">scheduled at +${fmt(s.start)}</span>`;
            } else if (streaming) {
                out.innerHTML = textHtml(streamText(s)) + (st === 'running' ? '<span class="tr-caret"></span>' : '');
            } else if (st === 'running') {
                out.innerHTML = '<span class="tr-wait">awaiting response<span class="tr-ellipsis"></span></span>';
            } else {
                out.innerHTML = jsonHtml(s.output || {});
            }
            if (st === 'running') out.scrollTop = out.scrollHeight;
        }

        let outKey = '';
        function renderOutput() {
            const s = P.finalSpan;
            if (!s) return;
            const st = spanState(s);
            const text = streamText(s);
            const key = st + text.length;
            if (key === outKey) return;
            outKey = key;
            output.dataset.state = st;
            if (st === 'pending') {
                outputV.innerHTML = '<span class="tr-wait">waiting for the agent…</span>';
            } else {
                outputV.innerHTML = textHtml(text) + (st === 'running' ? '<span class="tr-caret"></span>' : '');
            }
        }

        // ── playback ────────────────────────────────────────────
        function frame(now) {
            P.raf = 0;
            if (!P.playing) return;
            const dt = Math.min(64, now - P.last);
            P.last = now;
            P.t = Math.min(P.D, P.t + dt * P.speed);
            update();
            if (P.t >= P.D) { pause(); return; }
            P.raf = requestAnimationFrame(frame);
        }

        function play() {
            if (P.t >= P.D) { P.t = 0; P.follow = true; outKey = ''; }
            P.playing = true;
            bPlay.textContent = '❚❚';
            bPlay.setAttribute('aria-label', 'Pause');
            bPlay.title = 'Pause';
            app.classList.add('is-playing');
            P.last = performance.now();
            if (!P.raf) P.raf = requestAnimationFrame(frame);
            update();
        }

        function pause() {
            P.playing = false;
            bPlay.textContent = '▶';
            bPlay.setAttribute('aria-label', 'Play');
            bPlay.title = 'Play';
            app.classList.remove('is-playing');
            if (P.raf) { cancelAnimationFrame(P.raf); P.raf = 0; }
            update();
        }

        function seek(t, follow) {
            P.t = Math.max(0, Math.min(P.D, t));
            if (follow != null) P.follow = follow;
            outKey = '';
            update();
        }

        function step(dir) {
            pause();
            const ends = P.spans.filter(s => s.kind !== 'agent').slice().sort((a, b) => a.end - b.end);
            let target = null;
            if (dir > 0) target = ends.find(s => s.end > P.t + 0.5);
            else target = ends.slice().reverse().find(s => s.end < P.t - 0.5);
            if (!target) { seek(dir > 0 ? P.D : 0, true); return; }
            P.follow = false;
            seek(target.end);
            select(target);
        }

        bPlay.addEventListener('click', () => (P.playing ? pause() : play()));
        bRestart.addEventListener('click', () => { seek(0, true); play(); });
        bPrev.addEventListener('click', () => step(-1));
        bNext.addEventListener('click', () => step(1));

        // scrubbing
        function scrubTo(ev) {
            const r = scrubTrack.getBoundingClientRect();
            seek((ev.clientX - r.left) / r.width * P.D, true);
        }
        scrub.addEventListener('pointerdown', ev => {
            pause();
            scrub.setPointerCapture(ev.pointerId);
            scrub.classList.add('dragging');
            scrubTo(ev);
        });
        scrub.addEventListener('pointermove', ev => { if (scrub.classList.contains('dragging')) scrubTo(ev); });
        scrub.addEventListener('pointerup', () => scrub.classList.remove('dragging'));
        scrub.addEventListener('pointercancel', () => scrub.classList.remove('dragging'));

        app.addEventListener('keydown', ev => {
            if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
            if (ev.key === ' ') { ev.preventDefault(); P.playing ? pause() : play(); }
            else if (ev.key === 'ArrowRight') { ev.preventDefault(); step(1); }
            else if (ev.key === 'ArrowLeft') { ev.preventDefault(); step(-1); }
            else if (ev.key === 'Home') { ev.preventDefault(); pause(); seek(0, true); }
            else if (ev.key === 'End') { ev.preventDefault(); pause(); seek(P.D, true); }
        });

        // tabs
        traces.forEach((tr, i) => {
            const b = el('button', 'tr-tab');
            b.type = 'button';
            b.setAttribute('role', 'tab');
            b.innerHTML = `<span class="tr-tab-num">${String(i + 1).padStart(2, '0')}</span><span class="tr-tab-text"><span class="tr-tab-title">${esc(tr.title)}</span><span class="tr-tab-tag">${esc(tr.tagline)}</span></span>`;
            b.addEventListener('click', () => load(i, !reduceMotion));
            tabs.appendChild(b);
        });
        tabs.addEventListener('keydown', ev => {
            if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
            ev.stopPropagation();
            const cur = traces.indexOf(P.trace);
            const next = (cur + (ev.key === 'ArrowRight' ? 1 : traces.length - 1)) % traces.length;
            load(next, !reduceMotion);
            tabs.children[next].focus();
        });

        load(0, false);

        // Autoplay the first time the viewer's top reaches the upper 80% of the
        // viewport (a ratio threshold would never fire for a window taller than the screen).
        if (!reduceMotion && 'IntersectionObserver' in window) {
            const io = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting) {
                    io.disconnect();
                    if (!P.playing && P.t === 0) play();
                }
            }, { rootMargin: '0px 0px -20% 0px' });
            io.observe(app);
        }

        // Pause when the tab is hidden; nothing should spin in the background.
        document.addEventListener('visibilitychange', () => { if (document.hidden && P.playing) pause(); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
