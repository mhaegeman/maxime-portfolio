// lab-search.js — "Ask the archive": hybrid retrieval that runs in the browser.
//
// Pipeline: ingest (Medium RSS + project notes + lab notebook) → chunk →
// BM25 + TF-IDF (instant) → optional MiniLM embeddings in a Web Worker →
// Reciprocal Rank Fusion → PCA map of the vector space.
// Everything is computed client-side; nothing is sent to a server.

(function () {
    'use strict';

    const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
    const MODEL_LABEL = 'MiniLM-L6-v2';
    const WORKER_URL = 'js/lab/embed-worker.js';
    const K1 = 1.2;
    const B = 0.75;
    const RRF_K = 60;
    const CANDIDATES = 50;
    const TOP_K = 6;
    const PER_DOC = 1;
    const EMBED_BATCH = 12;
    const STORE_EMB = 'lab-emb-v1';
    const STORE_MODEL_OK = 'lab-model-ok';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const SUGGESTIONS = [
        'how do I evaluate a RAG system?',
        'scaling Spark jobs on the cloud',
        'putting ML models into production',
        'vector databases and retrieval',
        'credit scoring with imbalanced data',
        'LLM content generation',
    ];

    // ─── small helpers ─────────────────────────────────────────────
    function t(key, fallback) {
        const v = window.i18n && window.i18n.t ? window.i18n.t(key) : null;
        return v && v !== key ? v : fallback;
    }

    function tEn(key, fallback) {
        const v = window.i18n && window.i18n.t ? window.i18n.t(key, 'en') : null;
        return v && v !== key ? v : fallback;
    }

    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function el(tag, cls, text) {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }

    function fmtMs(ms) {
        if (ms < 0.1) return '<0.1ms';
        if (ms < 1) return ms.toFixed(2) + 'ms';
        if (ms < 100) return ms.toFixed(1) + 'ms';
        if (ms < 1000) return Math.round(ms) + 'ms';
        return (ms / 1000).toFixed(2) + 's';
    }

    function fmtK(n) {
        return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
    }

    function hash(str) {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        return (h >>> 0).toString(36);
    }

    // ─── text processing ───────────────────────────────────────────
    const STOP = new Set(('a about above after again against all am an and any are as at be because been before being below ' +
        'between both but by can could did do does doing down during each few for from further had has have having he her ' +
        'here hers him his how i if in into is it its itself just me more most my no nor not of off on once only or other ' +
        'our ours out over own same she should so some such than that the their theirs them then there these they this ' +
        'those through to too under until up very was we were what when where which while who whom why will with would ' +
        'you your yours yourself also get got use used using via vs one two new like make made way well really thing things ' +
        'let lets im ive dont doesnt cant youre').split(' '));

    function stem(w) {
        if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
        if (w.length > 6 && w.endsWith('ations')) w = w.slice(0, -4);
        else if (w.length > 5 && w.endsWith('ation')) w = w.slice(0, -3);
        if (w.length > 3 && w.endsWith('s') && !/(ss|us|is)$/.test(w)) w = w.slice(0, -1);
        if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
        else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
        if (/([bdfgmnprt])\1$/.test(w)) w = w.slice(0, -1);
        if (w.length > 4 && w.endsWith('e')) w = w.slice(0, -1);
        return w;
    }

    function normWord(w) {
        return w.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
    }

    function tokenize(text) {
        const words = normWord(text).match(/[a-z0-9]+/g) || [];
        const out = [];
        for (const w of words) {
            if (w.length < 2 || STOP.has(w)) continue;
            out.push(stem(w));
        }
        return out;
    }

    function htmlToText(html, title) {
        // DOMParser documents are inert: no scripts run, no images load.
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('figure, img, script, style, pre, iframe').forEach(n => n.remove());
        const blocks = Array.from(doc.body.querySelectorAll('p, h1, h2, h3, h4, li, blockquote'))
            .filter(n => !n.querySelector('p, li'))
            .map(n => n.textContent.replace(/\s+/g, ' ').trim())
            .filter(Boolean)
            .filter(b => !title || b.toLowerCase() !== title.trim().toLowerCase());
        return blocks.length ? blocks.join('\n\n') : doc.body.textContent.replace(/\s+/g, ' ').trim();
    }

    function chunkText(text, target = 110, max = 170) {
        const sentences = text.split(/\n{2,}/)
            .flatMap(p => p.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || [p])
            .map(s => s.trim())
            .filter(s => s.length > 1);
        const chunks = [];
        let cur = [];
        let n = 0;
        const count = s => s.split(/\s+/).length;
        const flush = () => {
            if (!cur.length) return;
            chunks.push(cur.join(' '));
            const last = cur[cur.length - 1];
            cur = count(last) < 30 ? [last] : [];
            n = cur.reduce((a, s) => a + count(s), 0);
        };
        for (const s of sentences) {
            const w = count(s);
            if (n + w > max && n >= 40) flush();
            cur.push(s);
            n += w;
            if (n >= target) flush();
        }
        if (cur.length && (n > 25 || !chunks.length)) chunks.push(cur.join(' '));
        return chunks;
    }

    // ─── corpus ────────────────────────────────────────────────────
    async function loadBlogDocs() {
        if (typeof fetchRssXml !== 'function' || typeof CONFIG === 'undefined') throw new Error('rss loader unavailable');
        let xml = typeof cacheGet === 'function' ? cacheGet('medium-rss-v1') : null;
        if (!xml) {
            xml = await fetchRssXml(`https://medium.com/feed/@${CONFIG.mediumUser}`);
            if (typeof cacheSet === 'function') cacheSet('medium-rss-v1', xml);
        }
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const items = Array.from(doc.getElementsByTagName('item')).slice(0, 12);
        return items.map(item => {
            const get = tag => (item.getElementsByTagName(tag)[0] || {}).textContent || '';
            const encoded = item.getElementsByTagNameNS('*', 'encoded')[0];
            const html = (encoded && encoded.textContent) || get('description');
            // The feed arrives through third-party CORS proxies: only trust https links.
            const raw = (get('link') || get('guid')).trim().split('?')[0];
            const link = /^https:\/\/[^\s"'<>]+$/.test(raw) ? raw : '';
            const date = new Date(get('pubDate'));
            const title = get('title').trim() || 'Untitled';
            return {
                type: 'blog',
                title,
                url: link || `https://medium.com/@${CONFIG.mediumUser}`,
                date: isNaN(date) ? null : date,
                tags: Array.from(item.getElementsByTagName('category')).map(c => c.textContent.trim()).filter(Boolean),
                text: htmlToText(html, title),
            };
        }).filter(d => d.text.length > 40);
    }

    function projectDocs() {
        if (typeof PROJECT_META === 'undefined') return [];
        const user = (typeof CONFIG !== 'undefined' && CONFIG.githubUser) || 'mhaegeman';
        return Object.entries(PROJECT_META).map(([name, meta]) => {
            const tags = ((typeof REPO_TAGS !== 'undefined' && REPO_TAGS[name]) || []).map(x => x.label);
            return {
                type: 'project',
                title: meta.title,
                url: `https://github.com/${user}/${name}`,
                date: null,
                tags,
                text: meta.desc,
                extra: `${(meta.cats || []).join(' ')} ${tags.join(' ')}`,
            };
        });
    }

    function labDocs() {
        // Notebook cards that point at a GitHub repo are already indexed as projects.
        return Array.from(document.querySelectorAll('.nb-card'))
            .filter(card => !/github\.com/.test((card.querySelector('.v1-links a') || {}).href || ''))
            .map(card => {
            const id = card.dataset.nb;
            const link = card.querySelector('.v1-links a');
            const tags = Array.from(card.querySelectorAll('.v1-tags span')).map(s => s.textContent);
            const title = tEn(`lab.${id}.title`, card.querySelector('.v1-title').textContent);
            const desc = tEn(`lab.${id}.desc`, card.querySelector('.v1-desc').textContent);
            return {
                type: 'lab',
                title,
                url: link ? link.getAttribute('href') : '#notebook',
                date: null,
                tags,
                text: desc,
                extra: tags.join(' '),
            };
        });
    }

    function buildChunks(docs) {
        const chunks = [];
        docs.forEach((d, di) => {
            const parts = d.type === 'blog' ? chunkText(d.text).slice(0, 12) : [d.text];
            parts.forEach((text, pi) => {
                const tokens = tokenize(`${d.title} ${(d.tags || []).join(' ')} ${d.extra || ''} ${text}`);
                const tf = new Map();
                tokens.forEach(tok => tf.set(tok, (tf.get(tok) || 0) + 1));
                chunks.push({ i: chunks.length, doc: di, part: pi, text, tf, len: tokens.length, key: hash(d.title + '|' + text) });
            });
        });
        return chunks;
    }

    // ─── BM25 + TF-IDF ─────────────────────────────────────────────
    function buildLexical(chunks) {
        const df = new Map();
        let total = 0;
        chunks.forEach(c => {
            total += c.len;
            c.tf.forEach((_, term) => df.set(term, (df.get(term) || 0) + 1));
        });
        const N = chunks.length;
        const avgdl = total / Math.max(1, N);
        const idf = new Map();
        df.forEach((n, term) => idf.set(term, Math.log(1 + (N - n + 0.5) / (n + 0.5))));

        // TF-IDF basis for the lexical map: the most shared terms.
        let vocab = Array.from(df.entries()).filter(([, n]) => n >= 2);
        if (vocab.length < 40) vocab = Array.from(df.entries());
        vocab = vocab.sort((a, b) => b[1] - a[1]).slice(0, 1500).map(([term]) => term);
        const vocabIdx = new Map(vocab.map((term, i) => [term, i]));

        return { df, idf, avgdl, N, vocab, vocabIdx };
    }

    function bm25(lex, chunks, qTerms) {
        const scores = new Float64Array(chunks.length);
        const uniq = Array.from(new Set(qTerms));
        for (const c of chunks) {
            let s = 0;
            for (const term of uniq) {
                const f = c.tf.get(term);
                if (!f) continue;
                s += lex.idf.get(term) * (f * (K1 + 1)) / (f + K1 * (1 - B + B * c.len / lex.avgdl));
            }
            scores[c.i] = s;
        }
        return scores;
    }

    function tfidfVector(lex, tf) {
        const v = new Float32Array(lex.vocab.length);
        let norm = 0;
        tf.forEach((f, term) => {
            const j = lex.vocabIdx.get(term);
            if (j === undefined) return;
            const w = (1 + Math.log(f)) * lex.idf.get(term);
            v[j] = w;
            norm += w * w;
        });
        if (norm > 0) {
            norm = Math.sqrt(norm);
            for (let j = 0; j < v.length; j++) v[j] /= norm;
        }
        return v;
    }

    // ─── PCA (power iteration with deflation) ──────────────────────
    function pca2(rows, dim) {
        const n = rows.length;
        const mean = new Float64Array(dim);
        rows.forEach(r => { for (let j = 0; j < dim; j++) mean[j] += r[j]; });
        for (let j = 0; j < dim; j++) mean[j] /= n;
        const X = new Float32Array(n * dim);
        let totalVar = 0;
        rows.forEach((r, i) => {
            for (let j = 0; j < dim; j++) {
                const x = r[j] - mean[j];
                X[i * dim + j] = x;
                totalVar += x * x;
            }
        });

        const comps = [];
        const eig = [];
        const u = new Float64Array(n);
        for (let c = 0; c < 2; c++) {
            let v = new Float64Array(dim);
            for (let j = 0; j < dim; j++) v[j] = Math.sin(j * 12.9898 + c * 78.233) + 0.01;
            for (let it = 0; it < 70; it++) {
                for (let i = 0; i < n; i++) {
                    let s = 0;
                    const o = i * dim;
                    for (let j = 0; j < dim; j++) s += X[o + j] * v[j];
                    u[i] = s;
                }
                const w = new Float64Array(dim);
                for (let i = 0; i < n; i++) {
                    const ui = u[i];
                    if (!ui) continue;
                    const o = i * dim;
                    for (let j = 0; j < dim; j++) w[j] += X[o + j] * ui;
                }
                for (const p of comps) {
                    let d = 0;
                    for (let j = 0; j < dim; j++) d += w[j] * p[j];
                    for (let j = 0; j < dim; j++) w[j] -= d * p[j];
                }
                let norm = 0;
                for (let j = 0; j < dim; j++) norm += w[j] * w[j];
                norm = Math.sqrt(norm);
                if (!norm) break;
                for (let j = 0; j < dim; j++) w[j] /= norm;
                v = w;
            }
            comps.push(v);
            let lam = 0;
            for (let i = 0; i < n; i++) {
                let s = 0;
                const o = i * dim;
                for (let j = 0; j < dim; j++) s += X[o + j] * v[j];
                lam += s * s;
            }
            eig.push(lam);
        }

        const raw = rows.map((_, i) => comps.map(p => {
            let s = 0;
            const o = i * dim;
            for (let j = 0; j < dim; j++) s += X[o + j] * p[j];
            return s;
        }));
        // Robust scale (90th percentile) + tanh squash: a few outliers must not
        // crush every other point into the middle of the map.
        const scale = [0, 1].map(k => {
            const abs = raw.map(r => Math.abs(r[k])).sort((a, b) => a - b);
            return Math.max(1e-9, abs[Math.floor((abs.length - 1) * 0.9)]);
        });
        const squash = z => Math.tanh(0.85 * z) / Math.tanh(0.85 * 1.5);
        const project = vec => comps.map((p, k) => {
            let s = 0;
            for (let j = 0; j < dim; j++) s += (vec[j] - mean[j]) * p[j];
            return squash(s / scale[k]);
        });
        return {
            coords: raw.map(r => [squash(r[0] / scale[0]), squash(r[1] / scale[1])]),
            project,
            explained: totalVar ? (eig[0] + eig[1]) / totalVar : 0,
            flip(k) { comps[k] = comps[k].map(x => -x); this.coords.forEach(c => { c[k] = -c[k]; }); },
        };
    }

    // ─── embeddings (Web Worker) ───────────────────────────────────
    function createEmbedder(onProgress) {
        let worker = null;
        let seq = 0;
        const pending = new Map();
        const files = new Map();

        function failAll(message) {
            pending.forEach(p => p.reject(new Error(message)));
            pending.clear();
        }

        function ensureWorker() {
            if (worker) return worker;
            worker = new Worker(WORKER_URL, { type: 'module' });
            worker.onmessage = ({ data }) => {
                if (data.type === 'progress') {
                    if (data.file) {
                        const prev = files.get(data.file) || { loaded: 0, total: 0 };
                        files.set(data.file, {
                            loaded: data.status === 'done' ? (prev.total || data.loaded) : (data.loaded || prev.loaded),
                            total: data.total || prev.total,
                        });
                        let loaded = 0;
                        let total = 0;
                        files.forEach(f => { loaded += f.loaded; total += f.total; });
                        onProgress(loaded, total);
                    }
                    return;
                }
                const p = pending.get(data.id);
                if (!p) return;
                pending.delete(data.id);
                if (data.type === 'error') p.reject(new Error(data.message));
                else p.resolve(data);
            };
            worker.onerror = (ev) => {
                ev.preventDefault();
                failAll('worker failed to start');
            };
            return worker;
        }

        function call(msg) {
            return new Promise((resolve, reject) => {
                let w;
                try { w = ensureWorker(); } catch (err) { reject(err); return; }
                const id = ++seq;
                pending.set(id, { resolve, reject });
                w.postMessage(Object.assign({ id }, msg));
            });
        }

        return {
            load: () => call({ type: 'load', model: MODEL_ID }),
            async embed(texts) {
                const res = await call({ type: 'embed', texts });
                const flat = new Float32Array(res.buffer);
                const out = [];
                for (let i = 0; i < texts.length; i++) out.push(flat.subarray(i * res.dims, (i + 1) * res.dims));
                return out;
            },
        };
    }

    function b64FromVec(v) {
        const bytes = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
        let s = '';
        for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
        return btoa(s);
    }

    function vecFromB64(s) {
        const bin = atob(s);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new Float32Array(bytes.buffer);
    }

    function readEmbCache() {
        try {
            const raw = JSON.parse(localStorage.getItem(STORE_EMB) || 'null');
            return raw && raw.model === MODEL_ID ? raw.v : {};
        } catch (_) { return {}; }
    }

    function writeEmbCache(chunks) {
        try {
            const v = {};
            chunks.forEach(c => { if (c.emb) v[c.key] = b64FromVec(c.emb); });
            localStorage.setItem(STORE_EMB, JSON.stringify({ model: MODEL_ID, v }));
        } catch (_) { /* quota or blocked storage: embeddings are recomputed next time */ }
    }

    function storageGet(key) {
        try { return localStorage.getItem(key); } catch (_) { return null; }
    }

    function storageSet(key, value) {
        try { localStorage.setItem(key, value); } catch (_) { /* not fatal */ }
    }

    // ─── snippet + highlighting ────────────────────────────────────
    function snippet(text, qStems, size = 34) {
        const words = text.split(/\s+/);
        let best = 0;
        let bestScore = -1;
        if (qStems.size) {
            const hit = words.map(w => {
                const n = (normWord(w).match(/[a-z0-9]+/) || [''])[0];
                return n && qStems.has(stem(n)) ? 1 : 0;
            });
            for (let i = 0; i < Math.max(1, words.length - size + 1); i++) {
                let s = 0;
                for (let j = i; j < Math.min(words.length, i + size); j++) s += hit[j];
                if (s > bestScore) { bestScore = s; best = i; }
            }
        }
        const start = Math.max(0, Math.min(best - 4, words.length - size));
        const slice = words.slice(start, start + size).join(' ');
        const html = slice.split(/([A-Za-z0-9À-ɏ]+)/).map((part, i) => {
            if (i % 2 === 0) return esc(part);
            const n = normWord(part);
            return qStems.has(stem(n)) && !STOP.has(n) ? `<mark>${esc(part)}</mark>` : esc(part);
        }).join('');
        return (start > 0 ? '… ' : '') + html + (start + size < words.length ? ' …' : '');
    }

    // ─── the embedding map (canvas) ────────────────────────────────
    function createMap(stage, canvas, tooltip, app) {
        const ctx = canvas.getContext('2d');
        const state = {
            w: 0, h: 0, dpr: 1,
            points: [],
            query: null,
            hits: [],
            focus: -1,
            hover: -1,
            morph: null,
            visible: true,
            raf: 0,
            colors: {},
            onOpen: null,
        };

        function readColors() {
            const cs = getComputedStyle(app);
            const get = name => cs.getPropertyValue(name).trim();
            state.colors = {
                blog: get('--rag-c-blog'),
                project: get('--rag-c-project'),
                lab: get('--rag-c-lab'),
                accent: get('--accent-color'),
                grid: get('--rag-grid'),
                muted: get('--text-muted'),
                bg: get('--bg-color'),
            };
        }

        function resize() {
            const r = stage.getBoundingClientRect();
            state.dpr = Math.min(2, window.devicePixelRatio || 1);
            state.w = Math.max(10, r.width);
            state.h = Math.max(10, r.height);
            canvas.width = Math.round(state.w * state.dpr);
            canvas.height = Math.round(state.h * state.dpr);
            draw();
        }

        const PAD = 22;
        function toScreen(x, y) {
            const cx = Math.max(-1.12, Math.min(1.12, x));
            const cy = Math.max(-1.12, Math.min(1.12, y));
            return [
                PAD + (cx + 1) / 2 * (state.w - 2 * PAD),
                PAD + (1 - (cy + 1) / 2) * (state.h - 2 * PAD),
            ];
        }

        function ease(p) { return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p); }

        function current(p) {
            if (!state.morph) return [p.x, p.y];
            const k = ease(Math.min(1, (performance.now() - state.morph.t0) / state.morph.dur));
            return [p.fx + (p.x - p.fx) * k, p.fy + (p.y - p.fy) * k];
        }

        function alpha(hex, a) {
            const m = /^#?([0-9a-f]{6})$/i.exec(hex);
            if (!m) return hex;
            const n = parseInt(m[1], 16);
            return `rgba(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255}, ${a})`;
        }

        function draw() {
            const { w, h, dpr, colors } = state;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);

            // grid
            ctx.strokeStyle = colors.grid;
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.beginPath();
            for (let k = 0; k <= 4; k++) {
                const x = Math.round(PAD + k / 4 * (w - 2 * PAD)) + 0.5;
                const y = Math.round(PAD + k / 4 * (h - 2 * PAD)) + 0.5;
                ctx.moveTo(x, PAD); ctx.lineTo(x, h - PAD);
                ctx.moveTo(PAD, y); ctx.lineTo(w - PAD, y);
            }
            ctx.stroke();
            ctx.fillStyle = colors.muted;
            ctx.font = '10px "Fira Code", monospace';
            ctx.fillText('PC1 →', w - PAD - 36, h - 7);
            ctx.save();
            ctx.translate(11, PAD + 30);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('PC2 →', 0, 0);
            ctx.restore();

            const active = state.hits.length > 0;
            const hitRank = new Map(state.hits.map((idx, r) => [idx, r]));
            const pos = state.points.map(current);

            // base points
            state.points.forEach((p, i) => {
                if (hitRank.has(i)) return;
                const [x, y] = toScreen(pos[i][0], pos[i][1]);
                ctx.fillStyle = alpha(colors[p.type] || colors.muted, active ? 0.22 : 0.62);
                ctx.beginPath();
                ctx.arc(x, y, 2.6, 0, Math.PI * 2);
                ctx.fill();
            });

            // query → hit links
            let q = null;
            if (state.query) {
                q = toScreen(...current(state.query));
                ctx.setLineDash([3, 4]);
                ctx.lineDashOffset = reduceMotion ? 0 : -(performance.now() / 60) % 14;
                state.hits.slice(0, 5).forEach((idx, r) => {
                    const [x, y] = toScreen(pos[idx][0], pos[idx][1]);
                    ctx.strokeStyle = alpha(colors.accent, 0.75 - r * 0.12);
                    ctx.lineWidth = r === 0 ? 1.4 : 1;
                    ctx.beginPath();
                    ctx.moveTo(q[0], q[1]);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                });
                ctx.setLineDash([]);
            }

            // hits
            state.hits.forEach((idx, r) => {
                const p = state.points[idx];
                const [x, y] = toScreen(pos[idx][0], pos[idx][1]);
                const c = colors[p.type] || colors.accent;
                ctx.fillStyle = c;
                ctx.beginPath();
                ctx.arc(x, y, idx === state.focus ? 6 : 4.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = alpha(c, idx === state.focus ? 0.9 : 0.45);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(x, y, idx === state.focus ? 11 : 8, 0, Math.PI * 2);
                ctx.stroke();
                if (r < 3) {
                    ctx.fillStyle = colors.muted;
                    ctx.font = '600 10px "Fira Code", monospace';
                    ctx.fillText(String(r + 1).padStart(2, '0'), x + 10, y - 8);
                }
            });

            // hover ring
            if (state.hover >= 0 && state.points[state.hover]) {
                const [x, y] = toScreen(pos[state.hover][0], pos[state.hover][1]);
                ctx.strokeStyle = colors.accent;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(x, y, 7, 0, Math.PI * 2);
                ctx.stroke();
            }

            // query point with pulse
            if (q) {
                const phase = reduceMotion ? 0.35 : (performance.now() % 1800) / 1800;
                ctx.strokeStyle = alpha(colors.accent, 1 - phase);
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(q[0], q[1], 6 + phase * 16, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = colors.accent;
                ctx.strokeStyle = colors.bg;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(q[0], q[1] - 7);
                ctx.lineTo(q[0] + 7, q[1]);
                ctx.lineTo(q[0], q[1] + 7);
                ctx.lineTo(q[0] - 7, q[1]);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }

        function loop() {
            state.raf = 0;
            draw();
            const morphing = state.morph && performance.now() - state.morph.t0 < state.morph.dur;
            if (!morphing && state.morph) state.morph = null;
            if (state.visible && !reduceMotion && (morphing || state.query)) {
                state.raf = requestAnimationFrame(loop);
            }
        }

        function kick() {
            if (!state.raf) state.raf = requestAnimationFrame(loop);
        }

        function nearest(mx, my) {
            let best = -1;
            let bestD = 14 * 14;
            state.points.forEach((p, i) => {
                const [x, y] = toScreen(...current(p));
                const d = (x - mx) * (x - mx) + (y - my) * (y - my);
                if (d < bestD) { bestD = d; best = i; }
            });
            return best;
        }

        function showTooltip(i) {
            if (i < 0) { tooltip.hidden = true; return; }
            const p = state.points[i];
            const [x, y] = toScreen(...current(p));
            tooltip.innerHTML = `<span class="rag-tt-type rag-src--${p.type}">${p.type}</span><strong>${esc(p.title)}</strong><span class="rag-tt-text">${esc(p.text.slice(0, 110))}…</span>`;
            tooltip.hidden = false;
            const tw = tooltip.offsetWidth;
            const th = tooltip.offsetHeight;
            let left = x + 14;
            let top = y - th - 10;
            if (left + tw > state.w - 6) left = x - tw - 14;
            if (top < 6) top = y + 14;
            tooltip.style.transform = `translate(${Math.max(6, left)}px, ${Math.max(6, top)}px)`;
        }

        canvas.addEventListener('pointermove', ev => {
            const r = canvas.getBoundingClientRect();
            const i = nearest(ev.clientX - r.left, ev.clientY - r.top);
            if (i !== state.hover) {
                state.hover = i;
                canvas.classList.toggle('is-pointing', i >= 0);
                showTooltip(i);
                draw();
            }
        });
        canvas.addEventListener('pointerleave', () => {
            state.hover = -1;
            showTooltip(-1);
            draw();
        });
        canvas.addEventListener('click', ev => {
            const r = canvas.getBoundingClientRect();
            const i = nearest(ev.clientX - r.left, ev.clientY - r.top);
            if (i >= 0 && state.onOpen) state.onOpen(state.points[i]);
        });

        new ResizeObserver(resize).observe(stage);
        new IntersectionObserver(entries => {
            state.visible = entries[0].isIntersecting;
            if (state.visible) kick();
        }).observe(stage);
        new MutationObserver(() => { readColors(); draw(); })
            .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        readColors();

        return {
            state,
            setPoints(points, animate) {
                const prev = state.points;
                const canMorph = animate && !reduceMotion && prev.length === points.length;
                state.points = points.map((p, i) => Object.assign(p, {
                    fx: canMorph ? current(prev[i])[0] : p.x,
                    fy: canMorph ? current(prev[i])[1] : p.y,
                }));
                if (state.query && canMorph) {
                    const [qx, qy] = current(state.query);
                    state.query.fx = qx;
                    state.query.fy = qy;
                }
                state.morph = canMorph ? { t0: performance.now(), dur: 1100 } : null;
                kick();
                draw();
            },
            setQuery(xy, hits) {
                if (!xy) {
                    state.query = null;
                    state.hits = [];
                } else {
                    const keepFrom = state.query && state.morph;
                    state.query = { x: xy[0], y: xy[1], fx: keepFrom ? state.query.fx : xy[0], fy: keepFrom ? state.query.fy : xy[1] };
                    state.hits = hits;
                }
                state.focus = -1;
                kick();
                draw();
            },
            setFocus(i) {
                state.focus = i;
                draw();
            },
            set onOpen(fn) { state.onOpen = fn; },
        };
    }

    // ─── the app ───────────────────────────────────────────────────
    function init() {
        const app = document.getElementById('rag-app');
        if (!app) return;

        const $ = id => document.getElementById(id);
        const input = $('rag-input');
        const resultsEl = $('rag-results');
        const footer = $('rag-footer');
        const statusEl = $('rag-status');
        const mapSpace = $('rag-map-space');
        const cta = $('rag-map-cta');
        const map = createMap(app.querySelector('.rag-map-stage'), $('rag-canvas'), $('rag-tooltip'), app);

        const S = {
            docs: [],
            chunks: [],
            lex: null,
            lexPca: null,
            semPca: null,
            mode: 'bm25',
            semantic: 'off',       // off | loading | embedding | ready | error
            ready: false,
            seq: 0,
            qCache: new Map(),
            timings: {},
            lastQuery: '',
        };

        // pipeline stages
        const STAGES = [
            ['fetch', 'ingest'],
            ['chunk', 'chunk'],
            ['bm25', 'bm25'],
            ['embed', 'embed'],
            ['map', 'pca'],
        ];
        const pipe = $('rag-pipeline');
        const stageEls = {};
        STAGES.forEach(([key, label], i) => {
            const s = el('div', 'rag-stage');
            s.dataset.state = 'idle';
            const head = el('span', 'rag-stage-head');
            head.appendChild(el('span', 'lab-dot'));
            head.appendChild(el('span', 'rag-stage-name', `${String(i + 1).padStart(2, '0')} ${label}`));
            const val = el('span', 'rag-stage-val', '—');
            const bar = el('span', 'rag-stage-bar');
            bar.appendChild(el('i'));
            s.append(head, val, bar);
            pipe.appendChild(s);
            stageEls[key] = { root: s, val, bar: bar.firstChild };
        });

        function stage(key, state, value, progress) {
            const s = stageEls[key];
            s.root.dataset.state = state;
            if (value instanceof Node) {
                s.val.textContent = '';
                s.val.appendChild(value);
            } else if (value != null) {
                s.val.textContent = value;
            }
            s.bar.style.transform = `scaleX(${progress == null ? (state === 'done' ? 1 : 0) : Math.max(0, Math.min(1, progress))})`;
        }

        function status(state, text) {
            statusEl.dataset.state = state;
            statusEl.querySelector('.lab-window-status-text').textContent = text;
        }

        // modes
        const MODES = [['hybrid', 'Hybrid'], ['semantic', 'Semantic'], ['bm25', 'BM25']];
        const modesEl = $('rag-modes');
        MODES.forEach(([key, label]) => {
            const b = el('button', 'rag-mode', label);
            b.type = 'button';
            b.dataset.mode = key;
            b.setAttribute('role', 'radio');
            b.addEventListener('click', () => setMode(key, true));
            modesEl.appendChild(b);
        });

        function syncModes() {
            modesEl.querySelectorAll('.rag-mode').forEach(b => {
                const on = b.dataset.mode === S.mode;
                b.classList.toggle('active', on);
                b.setAttribute('aria-checked', on ? 'true' : 'false');
                const needsModel = b.dataset.mode !== 'bm25';
                b.classList.toggle('needs-model', needsModel && S.semantic !== 'ready');
                b.disabled = needsModel && S.semantic === 'error';
            });
        }

        function setMode(mode, user) {
            if (mode !== 'bm25' && S.semantic === 'error') return;
            S.mode = mode;
            syncModes();
            if (mode !== 'bm25' && S.semantic === 'off' && user) loadSemantic();
            updateSpace(true);
            run(input.value);
        }

        function effectiveMode() {
            return S.mode !== 'bm25' && S.semantic === 'ready' ? S.mode : 'bm25';
        }

        // suggestions
        const sug = $('rag-suggest');
        sug.appendChild(el('span', 'rag-suggest-label', t('lab.search.try', 'try') + ' →'));
        SUGGESTIONS.forEach(q => {
            const b = el('button', 'rag-chip', q);
            b.type = 'button';
            b.addEventListener('click', () => {
                input.value = q;
                run(q);
                input.focus({ preventScroll: true });
            });
            sug.appendChild(b);
        });

        // map CTA (shown until the semantic space exists)
        function renderCta() {
            cta.textContent = '';
            if (S.semantic === 'ready') { cta.hidden = true; return; }
            cta.hidden = false;
            if (S.semantic === 'error') {
                cta.appendChild(el('span', 'rag-cta-text', 'embedding model unavailable, lexical space only'));
                return;
            }
            if (S.semantic === 'off') {
                const b = el('button', 'rag-cta-btn', t('lab.search.load', 'Load embedding model'));
                b.type = 'button';
                b.addEventListener('click', () => { loadSemantic(); setMode('hybrid', false); });
                cta.append(b, el('span', 'rag-cta-text', t('lab.search.load_hint', '~30 MB once, then cached by your browser')));
                return;
            }
            cta.appendChild(el('span', 'rag-cta-text rag-cta-text--busy', S.semantic === 'loading' ? 'loading model…' : 'embedding passages…'));
        }

        function updateSpace(animate) {
            const semantic = effectiveMode() !== 'bm25' && S.semPca;
            const pca = semantic ? S.semPca : S.lexPca;
            if (!pca) return;
            mapSpace.textContent = (semantic ? t('lab.search.map_semantic', 'MiniLM space · PCA 2-D') : t('lab.search.map_lexical', 'TF-IDF space · PCA 2-D'))
                + ` · ${Math.round(pca.explained * 100)}% var`;
            mapSpace.dataset.space = semantic ? 'semantic' : 'lexical';
            const points = S.chunks.map((c, i) => {
                const d = S.docs[c.doc];
                return { x: pca.coords[i][0], y: pca.coords[i][1], type: d.type, title: d.title, text: c.text, url: d.url, chunk: i };
            });
            if (S.space !== (semantic ? 'semantic' : 'lexical') || !map.state.points.length) {
                S.space = semantic ? 'semantic' : 'lexical';
                map.setPoints(points, animate);
                stage('map', 'done', `${S.space === 'semantic' ? '384' : fmtK(S.lex.vocab.length)}→2d · ${Math.round(pca.explained * 100)}%`);
            }
        }

        function openDoc(p) {
            if (!p.url) return;
            if (p.url.startsWith('#') || !/^https?:/.test(p.url)) window.location.href = p.url;
            else window.open(p.url, '_blank', 'noopener');
        }
        map.onOpen = openDoc;

        // ─── results ──────────────────────────────────────────────
        function renderIdle() {
            resultsEl.innerHTML = '';
            const box = el('div', 'rag-idle');
            box.appendChild(el('span', 'rag-idle-glyph', '⌕'));
            box.appendChild(el('p', 'rag-idle-text', t('lab.search.idle', 'Results appear here. Pick a suggestion or type a question.')));
            if (S.ready) box.appendChild(corpusCard());
            resultsEl.appendChild(box);
        }

        // What is in the index: passages per source + the most distinctive shared terms.
        function corpusCard() {
            const card = el('div', 'rag-corpus');
            ['blog', 'project', 'lab'].forEach(type => {
                const docs = S.docs.filter(d => d.type === type).length;
                if (!docs) return;
                const passages = S.chunks.filter(c => S.docs[c.doc].type === type).length;
                const row = el('div', 'rag-corpus-row');
                row.appendChild(el('span', `rag-src rag-src--${type}`, type));
                row.appendChild(el('span', '', `${docs} doc${docs > 1 ? 's' : ''}`));
                row.appendChild(el('b', '', `${passages} passages`));
                card.appendChild(row);
            });
            const top = Array.from(S.lex.df.entries())
                .filter(([term, n]) => n >= 2 && n < S.chunks.length * 0.6 && term.length > 2 && !/^\d+$/.test(term))
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8);
            if (top.length) {
                // Show the most common surface form of each stem ("pipeline", not "pipelin").
                const surface = new Map();
                S.chunks.forEach(c => (normWord(c.text).match(/[a-z0-9]+/g) || []).forEach(w => {
                    const st = stem(w);
                    if (!surface.has(st)) surface.set(st, new Map());
                    const m = surface.get(st);
                    m.set(w, (m.get(w) || 0) + 1);
                }));
                const word = st => {
                    const m = surface.get(st);
                    return m ? Array.from(m.entries()).sort((a, b) => b[1] - a[1])[0][0] : st;
                };
                const terms = el('div', 'rag-corpus-terms');
                top.forEach(([term]) => terms.appendChild(el('span', '', word(term))));
                card.appendChild(terms);
            }
            return card;
        }

        function renderResults(hits, qStems, mode) {
            resultsEl.innerHTML = '';
            if (!hits.length) {
                const box = el('div', 'rag-idle');
                box.appendChild(el('span', 'rag-idle-glyph', '∅'));
                box.appendChild(el('p', 'rag-idle-text', t('lab.search.empty', 'No passage matches yet. Try fewer or broader words.')));
                resultsEl.appendChild(box);
                return;
            }
            const ol = el('ol', 'rag-list');
            const maxBm = Math.max(...hits.map(h => h.bm25), 1e-9);
            const maxF = Math.max(...hits.map(h => h.fused || 0), 1e-9);
            hits.forEach((h, r) => {
                const c = S.chunks[h.idx];
                const d = S.docs[c.doc];
                const li = el('li', 'rag-hit');
                li.style.setProperty('--i', r);
                const external = /^https?:/.test(d.url);
                const a = el('a', 'rag-hit-link');
                a.href = d.url;
                if (external) { a.target = '_blank'; a.rel = 'noopener'; }
                const date = d.date ? d.date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '';
                const metric = (label, val, w, on) => `
                    <span class="rag-score${on ? '' : ' is-off'}">
                        <span class="rag-score-k">${label}</span>
                        <span class="rag-score-bar"><i style="--w:${on ? Math.max(0.03, Math.min(1, w)).toFixed(3) : 0}"></i></span>
                        <span class="rag-score-v">${on ? val : '—'}</span>
                    </span>`;
                a.innerHTML = `
                    <div class="rag-hit-top">
                        <span class="rag-rank">${String(r + 1).padStart(2, '0')}</span>
                        <span class="rag-src rag-src--${d.type}">${d.type}</span>
                        ${date ? `<span class="rag-date">${esc(date)}</span>` : ''}
                        <span class="rag-open" aria-hidden="true">${external ? '↗' : '↓'}</span>
                    </div>
                    <h3 class="rag-hit-title">${esc(d.title)}</h3>
                    <p class="rag-hit-snippet">${snippet(c.text, qStems)}</p>
                    <div class="rag-scores">
                        ${metric('bm25', h.bm25.toFixed(2), h.bm25 / maxBm, h.bm25 > 0)}
                        ${metric('cos', h.cos == null ? '' : h.cos.toFixed(3), h.cos, h.cos != null)}
                        ${metric('rrf', h.fused == null ? '' : h.fused.toFixed(4), (h.fused || 0) / maxF, mode === 'hybrid' && h.fused != null)}
                    </div>`;
                li.appendChild(a);
                li.addEventListener('pointerenter', () => map.setFocus(h.idx));
                li.addEventListener('pointerleave', () => map.setFocus(-1));
                a.addEventListener('focus', () => map.setFocus(h.idx));
                a.addEventListener('blur', () => map.setFocus(-1));
                ol.appendChild(li);
            });
            resultsEl.appendChild(ol);
        }

        function renderFooter() {
            const T = S.timings;
            const parts = [
                ['passages', String(S.chunks.length)],
                ['vocab', fmtK(S.lex ? S.lex.df.size : 0)],
                ['bm25', T.bm25 != null ? fmtMs(T.bm25) : '—'],
                ['embed q', T.embedQ != null ? fmtMs(T.embedQ) : '—'],
                ['cosine', T.cos != null ? fmtMs(T.cos) : '—'],
                ['mode', effectiveMode() === 'hybrid' ? `rrf k=${RRF_K}` : effectiveMode()],
            ];
            footer.innerHTML = parts.map(([k, v]) => `<span class="rag-metric"><span class="rag-metric-k">${k}</span><span class="rag-metric-v">${esc(v)}</span></span>`).join('');
        }

        // ─── query ────────────────────────────────────────────────
        async function embedQuery(q) {
            if (S.qCache.has(q)) return { vec: S.qCache.get(q), ms: 0 };
            const t0 = performance.now();
            const [vec] = await S.embedder.embed([q]);
            const ms = performance.now() - t0;
            if (S.qCache.size > 50) S.qCache.clear();
            S.qCache.set(q, vec);
            return { vec, ms };
        }

        async function run(raw) {
            const q = (raw || '').trim();
            const my = ++S.seq;
            S.lastQuery = q;
            if (!S.ready) return;
            if (!q) {
                renderIdle();
                map.setQuery(null);
                S.timings = {};
                renderFooter();
                return;
            }

            const mode = effectiveMode();
            const qTerms = tokenize(q);
            const qStems = new Set(qTerms);

            let t0 = performance.now();
            const bm = bm25(S.lex, S.chunks, qTerms);
            S.timings.bm25 = performance.now() - t0;

            let cos = null;
            let qVec = null;
            S.timings.embedQ = null;
            S.timings.cos = null;
            if (mode !== 'bm25') {
                try {
                    const r = await embedQuery(q);
                    if (my !== S.seq) return;
                    qVec = r.vec;
                    S.timings.embedQ = r.ms;
                    t0 = performance.now();
                    cos = new Float64Array(S.chunks.length);
                    S.chunks.forEach(c => {
                        let s = 0;
                        for (let j = 0; j < qVec.length; j++) s += qVec[j] * c.emb[j];
                        cos[c.i] = s;
                    });
                    S.timings.cos = performance.now() - t0;
                } catch (_) {
                    cos = null;
                }
            }

            const idx = S.chunks.map(c => c.i);
            const bmRank = idx.filter(i => bm[i] > 0).sort((a, b) => bm[b] - bm[a]).slice(0, CANDIDATES);
            const cosRank = cos ? idx.slice().sort((a, b) => cos[b] - cos[a]).slice(0, CANDIDATES) : [];

            let order;
            const fused = new Map();
            if (mode === 'hybrid' && cos) {
                bmRank.forEach((i, r) => fused.set(i, (fused.get(i) || 0) + 1 / (RRF_K + r + 1)));
                cosRank.forEach((i, r) => fused.set(i, (fused.get(i) || 0) + 1 / (RRF_K + r + 1)));
                order = Array.from(fused.keys()).sort((a, b) => fused.get(b) - fused.get(a));
            } else if (mode === 'semantic' && cos) {
                order = cosRank;
            } else {
                order = bmRank;
            }

            const perDoc = new Map();
            const hits = [];
            for (const i of order) {
                const d = S.chunks[i].doc;
                if ((perDoc.get(d) || 0) >= PER_DOC) continue;
                perDoc.set(d, (perDoc.get(d) || 0) + 1);
                hits.push({ idx: i, bm25: bm[i], cos: cos ? cos[i] : null, fused: fused.size ? (fused.get(i) || 0) : null });
                if (hits.length >= TOP_K) break;
            }

            renderResults(hits, qStems, mode);
            renderFooter();

            // project the query into whichever space the map shows
            let xy = null;
            if (S.space === 'semantic' && qVec) {
                xy = S.semPca.project(qVec);
            } else if (S.lexPca) {
                const tf = new Map();
                qTerms.forEach(term => tf.set(term, (tf.get(term) || 0) + 1));
                xy = S.lexPca.project(tfidfVector(S.lex, tf));
            }
            map.setQuery(hits.length ? xy : null, hits.map(h => h.idx));
        }

        let debounce = 0;
        input.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => run(input.value), 140);
        });
        input.addEventListener('keydown', ev => {
            if (ev.key === 'Enter') { clearTimeout(debounce); run(input.value); }
            if (ev.key === 'Escape') { input.value = ''; run(''); }
        });
        document.addEventListener('keydown', ev => {
            if (ev.key !== '/' || ev.metaKey || ev.ctrlKey) return;
            const tag = (ev.target.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || ev.target.isContentEditable) return;
            ev.preventDefault();
            input.focus();
        });

        // ─── semantic layer ───────────────────────────────────────
        async function loadSemantic() {
            if (S.semantic !== 'off') return;
            S.semantic = 'loading';
            syncModes();
            renderCta();
            status('busy', 'loading model');
            stage('embed', 'active', 'fetching weights…', 0);
            S.embedder = createEmbedder((loaded, total) => {
                if (S.semantic !== 'loading' || !total) return;
                stage('embed', 'active', `${(loaded / 1048576).toFixed(1)} / ${(total / 1048576).toFixed(1)} MB`, loaded / total);
                status('busy', `loading model ${Math.round(loaded / total * 100)}%`);
            });
            try {
                const t0 = performance.now();
                await S.embedder.load();
                S.timings.modelLoad = performance.now() - t0;
                S.semantic = 'embedding';
                renderCta();
                await embedCorpus();
                storageSet(STORE_MODEL_OK, '1');
            } catch (err) {
                S.semantic = 'error';
                stage('embed', 'error', 'model unavailable · bm25 only', 0);
                status('warn', 'ready · bm25 only');
                if (S.mode !== 'bm25') S.mode = 'bm25';
                syncModes();
                renderCta();
                renderFooter();
                if (window.console) console.warn('[lab] embedding model unavailable:', err.message);
            }
        }

        async function embedCorpus() {
            const cache = readEmbCache();
            const todo = [];
            S.chunks.forEach(c => {
                if (cache[c.key]) c.emb = vecFromB64(cache[c.key]);
                else todo.push(c);
            });
            const total = S.chunks.length;
            let done = total - todo.length;
            const t0 = performance.now();
            stage('embed', 'active', `${done}/${total} passages`, done / total);
            status('busy', 'embedding');
            for (let i = 0; i < todo.length; i += EMBED_BATCH) {
                const batch = todo.slice(i, i + EMBED_BATCH);
                const vecs = await S.embedder.embed(batch.map(c => {
                    const d = S.docs[c.doc];
                    return `${d.title}. ${c.text}${d.extra ? ' (' + d.extra + ')' : ''}`;
                }));
                batch.forEach((c, k) => { c.emb = vecs[k]; });
                done += batch.length;
                stage('embed', 'active', `${done}/${total} passages`, done / total);
            }
            if (todo.length) writeEmbCache(S.chunks);
            const ms = performance.now() - t0;

            const sem = pca2(S.chunks.map(c => c.emb), S.chunks[0].emb.length);
            // Align axes with the lexical map so the morph reads as a reorganisation, not a mirror.
            [0, 1].forEach(k => {
                let dot = 0;
                sem.coords.forEach((c, i) => { dot += c[k] * S.lexPca.coords[i][k]; });
                if (dot < 0) sem.flip(k);
            });
            S.semPca = sem;
            S.semantic = 'ready';
            stage('embed', 'done', `MiniLM · 384d · ${todo.length ? fmtMs(ms) : 'cached'}`);
            stageEls.embed.root.title = `${MODEL_LABEL} (q8 ONNX), ${total} passages embedded ${todo.length ? 'in ' + fmtMs(ms) : 'from cache'}`;
            status('ok', 'ready · hybrid');
            if (S.mode === 'bm25') S.mode = 'hybrid';
            syncModes();
            renderCta();
            updateSpace(true);
            run(input.value);
        }

        // ─── boot ─────────────────────────────────────────────────
        async function boot() {
            status('busy', 'indexing');
            stage('fetch', 'active', 'rss + notes…');
            renderIdle();
            renderFooter();
            syncModes();

            const local = [...labDocs(), ...projectDocs()];
            let blog = [];
            let blogFailed = false;
            try {
                blog = await loadBlogDocs();
            } catch (_) {
                blogFailed = true;
            }
            S.docs = [...blog, ...local];
            const nLab = local.filter(d => d.type === 'lab').length;
            stage('fetch', blogFailed ? 'warn' : 'done',
                blogFailed ? `rss offline · ${local.length} notes` : `${blog.length} posts · ${local.length} notes`);
            stageEls.fetch.root.title = `${blog.length} blog posts, ${local.length - nLab} project notes, ${nLab} lab notes`;

            stage('chunk', 'active', '…');
            let t0 = performance.now();
            S.chunks = buildChunks(S.docs);
            stage('chunk', 'done', `${S.chunks.length} passages · ${fmtMs(performance.now() - t0)}`);

            stage('bm25', 'active', '…');
            t0 = performance.now();
            S.lex = buildLexical(S.chunks);
            stage('bm25', 'done', `${fmtK(S.lex.df.size)} terms · ${fmtMs(performance.now() - t0)}`);

            stage('map', 'active', '…');
            S.lexPca = pca2(S.chunks.map(c => tfidfVector(S.lex, c.tf)), S.lex.vocab.length);
            S.ready = true;
            updateSpace(false);

            status('ok', 'ready · bm25');
            const btn = el('button', 'rag-stage-btn', t('lab.search.load', 'Load embedding model'));
            btn.type = 'button';
            btn.addEventListener('click', () => { loadSemantic(); setMode('hybrid', false); });
            stage('embed', 'idle', btn);
            renderCta();
            renderFooter();
            renderIdle();

            const params = new URLSearchParams(window.location.search);
            const q = params.get('q');
            if (q) input.value = q;
            run(input.value || S.lastQuery);

            // Returning visitors already have the weights cached: load straight away.
            if (storageGet(STORE_MODEL_OK) === '1') {
                loadSemantic();
                S.mode = 'hybrid';
                syncModes();
            }
        }

        window.addEventListener('langchange', () => {
            sug.querySelector('.rag-suggest-label').textContent = t('lab.search.try', 'try') + ' →';
            renderCta();
            if (S.ready) {
                updateSpace(false);
                if (!S.lastQuery) renderIdle();
            }
        });

        boot();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
