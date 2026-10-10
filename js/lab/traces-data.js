// traces-data.js — demo agent traces for the trace viewer.
// Synthetic runs, modelled on the span structure of real production traces
// (OpenTelemetry-style: every span has a parent, start/end in ms and a payload).
// kind: agent | llm | tool | retrieval | eval

window.LAB_TRACES = [
    {
        id: 'run_7f3a91',
        title: 'Support copilot',
        tagline: 'RAG · rerank · grounded answer',
        speed: 1,
        input: 'Our nightly export to S3 started failing after we rotated credentials. How do I fix it?',
        spans: [
            {
                id: 'root', name: 'copilot.run', kind: 'agent', start: 0, end: 5480,
                input: { user: 'Our nightly export to S3 started failing after we rotated credentials. How do I fix it?', tenant: 'acme-data', channel: 'support-widget' },
                output: { status: 'answered', citations: 3, groundedness: 0.96 },
            },
            {
                id: 'plan', parent: 'root', name: 'llm.plan', kind: 'llm', start: 0, end: 640,
                model: 'llm-large', tokens: { in: 486, out: 112 },
                input: { system: 'You are the support copilot for a data platform. Plan before you answer. Never invent config keys.', user: 'Our nightly export to S3 started failing after we rotated credentials. How do I fix it?' },
                output: 'Credential rotation + failing exports suggests the export workers still hold the old key, or the new secret never reached them. Plan: (1) retrieve docs on export auth and key rotation, (2) check recent incidents in parallel, (3) answer with concrete steps and cite sources.',
            },
            {
                id: 'ret', parent: 'root', name: 'retrieve.hybrid', kind: 'retrieval', start: 660, end: 842,
                input: { query: 'S3 export failing after credential rotation', k: 20, fusion: 'rrf(k=60)' },
                output: { candidates: 20, after_rerank: 4 },
            },
            {
                id: 'emb', parent: 'ret', name: 'embed.query', kind: 'tool', start: 660, end: 676,
                model: 'MiniLM-L6-v2',
                input: { text: 'S3 export failing after credential rotation' },
                output: { dims: 384, norm: 1.0 },
            },
            {
                id: 'bm25', parent: 'ret', name: 'bm25.search', kind: 'retrieval', start: 678, end: 683,
                input: { terms: ['s3', 'export', 'fail', 'credential', 'rotat'], k: 20 },
                output: { hits: [{ doc: 'docs/exports/s3-auth.md', score: 11.42 }, { doc: 'runbooks/key-rotation.md', score: 9.87 }, { doc: 'docs/exports/scheduling.md', score: 4.10 }] },
            },
            {
                id: 'vec', parent: 'ret', name: 'vector.search', kind: 'retrieval', start: 678, end: 702,
                input: { index: 'docs-v12', metric: 'cosine', k: 20, filter: { product: 'exports' } },
                output: { hits: [{ doc: 'runbooks/key-rotation.md', score: 0.81 }, { doc: 'docs/exports/s3-auth.md', score: 0.78 }, { doc: 'docs/exports/gcs-auth.md', score: 0.71 }] },
            },
            {
                id: 'rrf', parent: 'ret', name: 'rrf.fuse', kind: 'tool', start: 704, end: 706,
                input: { lists: 2, k: 60 },
                output: { merged: 31, top: ['runbooks/key-rotation.md', 'docs/exports/s3-auth.md', 'docs/exports/gcs-auth.md', 'faq/exports.md'] },
            },
            {
                id: 'rerank', parent: 'ret', name: 'rerank.cross_encoder', kind: 'tool', start: 708, end: 842,
                model: 'cross-encoder-small',
                input: { pairs: 20 },
                output: { top: [{ doc: 'runbooks/key-rotation.md', score: 0.94 }, { doc: 'docs/exports/s3-auth.md', score: 0.91 }, { doc: 'docs/exports/gcs-auth.md', score: 0.42 }, { doc: 'faq/exports.md', score: 0.39 }] },
            },
            {
                id: 'inc', parent: 'root', name: 'tool.incidents.search', kind: 'tool', start: 660, end: 1020,
                input: { query: 's3 export auth failure', window: '7d' },
                output: { incidents: [{ id: 'INC-2291', title: 'Exports fail with InvalidAccessKeyId after key rotation', status: 'resolved', fix: 'restart export workers to reload the secret' }] },
            },
            {
                id: 'grade', parent: 'root', name: 'llm.grade_context', kind: 'llm', start: 1040, end: 1620,
                model: 'llm-small', tokens: { in: 1840, out: 64 },
                input: { task: 'Keep only passages that help answer the question.', passages: 4 },
                output: '{"keep": [1, 2, 4], "drop": [3], "reason": "passage 3 covers GCS auth, not S3"}',
            },
            {
                id: 'answer', parent: 'root', name: 'llm.answer', kind: 'llm', start: 1640, end: 5160,
                model: 'llm-large', tokens: { in: 2210, out: 356 },
                input: { context: ['runbooks/key-rotation.md', 'docs/exports/s3-auth.md', 'faq/exports.md', 'INC-2291'], style: 'steps + citations' },
                output: 'This is almost certainly a stale credential. Export workers read the S3 secret at startup, so a rotated key is not picked up until they restart [1].\n\n1. Confirm that the new key is in the secret store under exports/s3 and that the old key is revoked [2].\n2. Restart the export workers so they reload the secret (the same fix as INC-2291) [3].\n3. Re-run last night\'s export from the scheduler; it is idempotent per partition [2].\n\nTo avoid a repeat, switch the export role to short-lived credentials so rotation never needs a restart [1].',
            },
            {
                id: 'eval', parent: 'root', name: 'eval.groundedness', kind: 'eval', start: 5180, end: 5480,
                model: 'llm-small',
                input: { claims: 6, citations: 3 },
                output: { score: 0.96, unsupported_claims: 0, citations_valid: true, verdict: 'pass' },
            },
        ],
    },
    {
        id: 'run_c40e12',
        title: 'Pipeline incident',
        tagline: 'tools · failed test · self-repair',
        speed: 2,
        input: 'ALERT: analytics.orders_daily is 6h stale (SLA < 2h)',
        spans: [
            {
                id: 'root', name: 'oncall.run', kind: 'agent', start: 0, end: 18900,
                input: { alert: 'freshness_sla_breach', table: 'analytics.orders_daily', lag: '6h12m', sla: '2h' },
                output: { status: 'mitigated', pr: '#318', human_merge_required: true },
            },
            {
                id: 'triage', parent: 'root', name: 'llm.triage', kind: 'llm', start: 0, end: 900,
                model: 'llm-large', tokens: { in: 612, out: 98 },
                input: { system: 'You are the data on-call agent. Read-only on prod; changes go through PRs.', alert: 'analytics.orders_daily is 6h stale' },
                output: 'Freshness breach on a daily table. Check the last successful load and the DAG run in parallel, then read the failing task logs.',
            },
            {
                id: 'sql', parent: 'root', name: 'warehouse.query', kind: 'tool', start: 920, end: 2140,
                input: { sql: 'SELECT max(loaded_at) AS last_load,\n       now() - max(loaded_at) AS lag\nFROM analytics.orders_daily;' },
                output: { last_load: '2026-10-10T02:04:11Z', lag: '6h12m', rows_scanned: 1 },
            },
            {
                id: 'dag', parent: 'root', name: 'airflow.get_dag_run', kind: 'tool', start: 920, end: 1310,
                input: { dag_id: 'orders_daily', run: 'latest' },
                output: { run_id: 'scheduled__2026-10-10T04:00', state: 'failed', failed_task: 'transform_orders', try_number: 3 },
            },
            {
                id: 'logs', parent: 'root', name: 'airflow.get_task_logs', kind: 'tool', start: 1330, end: 1980,
                input: { dag_id: 'orders_daily', task_id: 'transform_orders', tail: 40 },
                output: { tail: 'pyspark.errors.exceptions.AnalysisException: [UNRESOLVED_COLUMN] A column or function parameter with name `discount_code` cannot be resolved. Did you mean `discount_cd`?' },
            },
            {
                id: 'diag', parent: 'root', name: 'llm.diagnose', kind: 'llm', start: 2000, end: 3600,
                model: 'llm-large', tokens: { in: 1934, out: 141 },
                input: { evidence: ['sql', 'dag', 'logs'] },
                output: 'Root cause is probably upstream: `discount_code` no longer exists and Spark suggests `discount_cd`, which looks like a rename in raw.orders. I will verify it in the catalog before touching code.',
            },
            {
                id: 'schema', parent: 'root', name: 'catalog.schema_history', kind: 'tool', start: 3620, end: 4100,
                input: { table: 'raw.orders', since: '24h' },
                output: { change: 'RENAME COLUMN discount_code TO discount_cd', at: '2026-10-10T03:41:52Z', by: 'svc-ingest' },
            },
            {
                id: 'grep', parent: 'root', name: 'repo.search_code', kind: 'tool', start: 4120, end: 4600,
                input: { query: 'discount_code', path: 'transforms/' },
                output: { matches: [{ file: 'transforms/orders.py', line: 42 }, { file: 'tests/test_orders.py', line: 18 }] },
            },
            {
                id: 'patch1', parent: 'root', name: 'llm.write_patch', kind: 'llm', start: 4620, end: 6900,
                model: 'llm-large', tokens: { in: 2406, out: 188 },
                input: { file: 'transforms/orders.py', goal: 'read the renamed column' },
                output: '--- a/transforms/orders.py\n+++ b/transforms/orders.py\n@@ -40,3 +40,3 @@\n-    F.col("discount_code"),\n+    F.col("discount_cd"),',
            },
            {
                id: 'test1', parent: 'root', name: 'ci.run_tests', kind: 'tool', start: 6920, end: 10400, status: 'error',
                input: { suite: 'transforms', changed: ['transforms/orders.py'] },
                output: { passed: 41, failed: 1, failure: 'test_orders_output_contract: expected column `discount_code` in output, found `discount_cd`' },
            },
            {
                id: 'patch2', parent: 'root', name: 'llm.fix', kind: 'llm', start: 10420, end: 11900,
                model: 'llm-large', tokens: { in: 2980, out: 164 },
                input: { failure: 'output contract broken for downstream consumers' },
                output: 'Downstream dashboards depend on `discount_code`, so the output contract must not change. Read the new column and alias it back:\n\n-    F.col("discount_cd"),\n+    F.col("discount_cd").alias("discount_code"),',
            },
            {
                id: 'test2', parent: 'root', name: 'ci.run_tests', kind: 'tool', start: 11920, end: 15300,
                input: { suite: 'transforms', changed: ['transforms/orders.py'] },
                output: { passed: 42, failed: 0, duration: '3.4s' },
            },
            {
                id: 'pr', parent: 'root', name: 'github.open_pr', kind: 'tool', start: 15320, end: 16100,
                input: { branch: 'fix/orders-discount-rename', reviewers: ['data-platform'] },
                output: { pr: '#318', title: 'fix(orders_daily): read renamed discount_cd, keep output contract', checks: 'passing' },
            },
            {
                id: 'notify', parent: 'root', name: 'slack.post', kind: 'tool', start: 16120, end: 16480,
                input: { channel: '#data-incidents' },
                output: { ok: true, ts: '1760091712.4401' },
            },
            {
                id: 'summary', parent: 'root', name: 'llm.summarize', kind: 'llm', start: 16500, end: 18500,
                model: 'llm-small', tokens: { in: 3120, out: 210 },
                input: { audience: 'on-call human' },
                output: 'orders_daily is stale because raw.orders renamed discount_code to discount_cd at 03:41 UTC (svc-ingest). PR #318 reads the new column and aliases it back, so the output contract is unchanged; tests pass (42/42). After merge, re-run orders_daily for 2026-10-10. No prod writes were made.',
            },
            {
                id: 'policy', parent: 'root', name: 'eval.policy_check', kind: 'eval', start: 18520, end: 18900,
                input: { rules: ['no prod writes', 'changes via PR', 'human merge'] },
                output: { prod_writes: 0, destructive_actions: 0, human_merge_required: true, verdict: 'pass' },
            },
        ],
    },
    {
        id: 'run_92bd5e',
        title: 'Research swarm',
        tagline: 'multi-agent · parallel · retries',
        speed: 1,
        input: 'Which vector store fits 10M chunks with heavy metadata filtering?',
        spans: [
            {
                id: 'root', name: 'orchestrator.run', kind: 'agent', start: 0, end: 12600,
                input: { question: 'Which vector store fits 10M chunks with heavy metadata filtering?', budget: { agents: 3, max_tool_calls: 24 } },
                output: { status: 'answered', sources: 9, tool_calls: 11 },
            },
            {
                id: 'decomp', parent: 'root', name: 'llm.decompose', kind: 'llm', start: 0, end: 1000,
                model: 'llm-large', tokens: { in: 402, out: 133 },
                input: { question: 'Which vector store fits 10M chunks with heavy metadata filtering?' },
                output: 'Three independent sub-questions, one researcher each: (a) how filtered ANN search behaves at 10M vectors, (b) operational cost and hosting, (c) fit with the existing Postgres stack.',
            },
            { id: 'a1', parent: 'root', name: 'agent.filtering', kind: 'agent', start: 1020, end: 7400, input: { focus: 'filtered ANN at scale' }, output: { notes: 3, sources: 4 } },
            { id: 'a1s', parent: 'a1', name: 'web.search', kind: 'tool', start: 1040, end: 1700, input: { q: 'filtered HNSW search pre-filter vs post-filter recall' }, output: { results: 8 } },
            { id: 'a1f', parent: 'a1', name: 'web.fetch', kind: 'tool', start: 1720, end: 3300, input: { urls: 3 }, output: { pages: 3, tokens: 11840 } },
            {
                id: 'a1x', parent: 'a1', name: 'llm.extract', kind: 'llm', start: 3320, end: 7400,
                model: 'llm-small', tokens: { in: 12210, out: 286 },
                input: { schema: 'claim, evidence, source' },
                output: 'Post-filtering on a plain HNSW index drops recall when filters are selective. Engines that integrate the filter into graph traversal (filterable HNSW) keep recall up, and payload indexes on filter fields matter more than the ANN parameters.',
            },
            { id: 'a2', parent: 'root', name: 'agent.ops_cost', kind: 'agent', start: 1020, end: 8600, input: { focus: 'cost and operations' }, output: { notes: 2, sources: 3 } },
            { id: 'a2s', parent: 'a2', name: 'web.search', kind: 'tool', start: 1040, end: 1620, input: { q: 'self-hosted vector database memory footprint quantization' }, output: { results: 8 } },
            { id: 'a2f', parent: 'a2', name: 'web.fetch', kind: 'tool', start: 1640, end: 3640, status: 'error', input: { url: 'https://example.org/benchmarks' }, output: { error: 'timeout after 2000ms' } },
            { id: 'a2r', parent: 'a2', name: 'web.fetch (retry)', kind: 'tool', start: 3900, end: 5100, input: { url: 'https://example.org/benchmarks', backoff: '250ms' }, output: { pages: 1, tokens: 6020 } },
            {
                id: 'a2x', parent: 'a2', name: 'llm.extract', kind: 'llm', start: 5120, end: 8600,
                model: 'llm-small', tokens: { in: 6480, out: 241 },
                input: { schema: 'claim, evidence, source' },
                output: 'At 10M x 384-d float32 vectors, raw storage is about 15 GB before index overhead. Scalar or product quantization cuts memory 4 to 16 times for a small recall hit, so it is worth measuring against the eval set.',
            },
            { id: 'a3', parent: 'root', name: 'agent.stack_fit', kind: 'agent', start: 1020, end: 6200, input: { focus: 'fit with Postgres' }, output: { notes: 2, sources: 2 } },
            { id: 'a3s', parent: 'a3', name: 'web.search', kind: 'tool', start: 1040, end: 1560, input: { q: 'pgvector HNSW filtering large tables' }, output: { results: 8 } },
            { id: 'a3f', parent: 'a3', name: 'web.fetch', kind: 'tool', start: 1580, end: 2900, input: { urls: 2 }, output: { pages: 2, tokens: 7310 } },
            {
                id: 'a3x', parent: 'a3', name: 'llm.extract', kind: 'llm', start: 2920, end: 6200,
                model: 'llm-small', tokens: { in: 7702, out: 198 },
                input: { schema: 'claim, evidence, source' },
                output: 'Staying in Postgres keeps transactions, joins and access control in one place. Filtered vector queries need careful indexing and query planning as tables grow, so it is worth load-testing at the target size.',
            },
            {
                id: 'synth', parent: 'root', name: 'llm.synthesize', kind: 'llm', start: 8620, end: 11900,
                model: 'llm-large', tokens: { in: 4630, out: 402 },
                input: { notes: 7, sources: 9 },
                output: 'Short answer: it depends on how selective your filters are, so measure before you migrate.\n\n• Mostly broad filters, Postgres already in place: start with pgvector and HNSW, add indexes on the filter columns, and load-test at 10M.\n• Highly selective filters on many fields: use an engine with filter-aware graph traversal and payload indexes; recall holds up where post-filtering collapses.\n• Either way, budget about 15 GB of raw vectors and try scalar quantization against your eval set.\n\nNext step: replay 200 real queries with their filters against both options and compare recall@10 and p95 latency.',
            },
            {
                id: 'cite', parent: 'root', name: 'eval.citation_check', kind: 'eval', start: 11920, end: 12600,
                model: 'llm-small',
                input: { claims: 9 },
                output: { supported: 9, unsupported: 0, verdict: 'pass' },
            },
        ],
    },
];
