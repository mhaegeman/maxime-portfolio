/* global React */
const { useState, useEffect, useRef } = React;

// ───────────────────────── Shared UI bits ─────────────────────────
function LogoImg({ job, className = '' }) {
    const [err, setErr] = useState(false);
    if (err) {
        // Typographic fallback: wordmark in Fira Code
        const letters = (job.company || '').slice(0, 2).toUpperCase();
        return (
            <div className={`cv-logo-fallback ${className}`} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-code)', fontWeight: 600,
                fontSize: '1rem', letterSpacing: '2px',
                color: 'var(--accent-color)',
                border: '1px dashed color-mix(in oklab, var(--accent-color) 40%, transparent)',
                padding: '6px 10px', borderRadius: '2px',
            }}>{letters}</div>
        );
    }
    return (
        <img
            className={`cv-logo-img ${className}`}
            src={job.logo}
            alt={`${job.company} logo`}
            onError={() => setErr(true)}
            loading="lazy"
            decoding="async"
        />
    );
}

function useReveal(ref) {
    useEffect(() => {
        if (!ref.current) return;
        const el = ref.current;
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('is-visible');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.12 });
        el.querySelectorAll('.cv-reveal').forEach(c => io.observe(c));
        return () => io.disconnect();
    }, []);
}

// ───────────────────────── CV Section (Density Map) ─────────────────────────
function CVSection() {
    const rootRef = useRef(null);
    const [openRole, setOpenRole] = useState(null);
    useReveal(rootRef);

    const matrix = window.CV_SKILL_MATRIX;

    return (
        <div className="cv-section" ref={rootRef}>
            <div className="cv-grid">
                <div className="cv-reveal">
                    <span className="cv-section-label">_roles.timeline</span>
                    <div className="cv-roles">
                        {window.CV_EXPERIENCE.map(job => {
                            const isOpen = openRole === job.id;
                            return (
                                <article key={job.id}
                                         className="cv-role"
                                         aria-expanded={isOpen}
                                         onClick={() => setOpenRole(isOpen ? null : job.id)}>
                                    <div className="cv-role-logo"><LogoImg job={job} /></div>
                                    <div className="cv-role-main">
                                        <span className="year">{job.period}</span>
                                        <p className="title">{job.role}</p>
                                        <p className="company">@ {job.company}{job.companyNote ? ` (${job.companyNote})` : ''}</p>
                                    </div>
                                    <span className="cv-pill">{window.CV_DURATION(job.start, job.end)}</span>
                                    <div className="cv-role-detail">
                                        <div className="cv-role-detail-inner">
                                            <p style={{ margin: 0 }}>{job.description}</p>
                                            <ul>{job.achievements.map((a, i) => <li key={i}>{a}</li>)}</ul>
                                            <div className="cv-role-stack">
                                                {job.stack.map((s, i) => <span key={i} className={`cv-chip c-${s.c}`}>{s.label}</span>)}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
                <div className="cv-reveal">
                    <span className="cv-section-label">_skill_density.heatmap</span>
                    <div className="cv-matrix">
                        <div className="cv-matrix-grid" style={{ '--years': matrix.years.length }}>
                            {/* header row */}
                            <div className="cv-matrix-row" style={{ '--years': matrix.years.length }}>
                                <div className="cell-label" style={{ opacity: 0 }}>_</div>
                                {matrix.years.map(y => <div key={y} className="cell-header">{String(y).slice(2)}</div>)}
                            </div>
                            {matrix.groups.map(group => (
                                <React.Fragment key={group.label}>
                                    <div className="cv-matrix-group-label">{group.label}</div>
                                    {group.rows.map(row => (
                                        <div key={row.label} className="cv-matrix-row" style={{ '--years': matrix.years.length }}>
                                            <div className="cell-label">{row.label}</div>
                                            {row.values.map((v, i) => (
                                                <div key={i} className="cv-cell" data-v={v} style={{ '--v': v }} title={`${row.label} · ${matrix.years[i]} · lvl ${v}/4`} />
                                            ))}
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="cv-legend">
                            <span>_intensity</span>
                            <span className="scale">
                                {[0, 1, 2, 3, 4].map(v => (
                                    <span key={v} style={{
                                        background: v === 0 ? 'transparent' : `color-mix(in oklab, var(--accent-color) ${v * 20}%, transparent)`,
                                        borderStyle: v === 0 ? 'dashed' : 'solid',
                                    }} />
                                ))}
                            </span>
                            <span>low → high</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Expose for the mount script
Object.assign(window, { CVSection });
