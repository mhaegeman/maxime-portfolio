// embed-worker.js — runs the sentence-embedding model off the main thread.
// Loaded as a module worker by lab-search.js. transformers.js and the ONNX
// weights come from public CDNs on first use and are then cached by the
// browser (Cache Storage), so repeat visits load in a second or two.

const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';

let extractor = null;
let loading = null;

async function load(model) {
    const { pipeline, env } = await import(TRANSFORMERS_URL);
    env.allowLocalModels = false;
    // GitHub Pages is not cross-origin isolated, so WASM runs single-threaded.
    env.backends.onnx.wasm.numThreads = 1;

    extractor = await pipeline('feature-extraction', model, {
        dtype: 'q8',
        device: 'wasm',
        progress_callback: (p) => {
            if (p.status === 'progress' || p.status === 'done' || p.status === 'initiate') {
                self.postMessage({
                    type: 'progress',
                    status: p.status,
                    file: p.file,
                    loaded: p.loaded || 0,
                    total: p.total || 0,
                });
            }
        },
    });
}

self.onmessage = async (event) => {
    const { id, type } = event.data;
    try {
        if (type === 'load') {
            if (!loading) loading = load(event.data.model);
            await loading;
            self.postMessage({ id, type: 'ready' });
        } else if (type === 'embed') {
            if (!extractor) throw new Error('model not loaded');
            const output = await extractor(event.data.texts, { pooling: 'mean', normalize: true });
            // Copy into a fresh buffer we can transfer without cloning.
            const vectors = new Float32Array(output.data);
            self.postMessage({ id, type: 'vectors', dims: output.dims[output.dims.length - 1], buffer: vectors.buffer }, [vectors.buffer]);
        }
    } catch (err) {
        loading = type === 'load' ? null : loading;
        self.postMessage({ id, type: 'error', message: String((err && err.message) || err) });
    }
};
