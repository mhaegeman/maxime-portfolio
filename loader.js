// loader.js

// Skill tags per repo: { label, category }
// Categories: ml | nlp | analytics | engineering | cloud
const REPO_TAGS = {
    'scoring-bank-project': [
        { label: 'LightGBM',             category: 'ml' },
        { label: 'Classification',        category: 'ml' },
        { label: 'Imbalanced Learning',   category: 'ml' },
        { label: 'Feature Engineering',   category: 'ml' },
        { label: 'Streamlit',             category: 'analytics' },
        { label: 'Dashboard',             category: 'analytics' },
        { label: 'EDA',                   category: 'analytics' },
        { label: 'Data Visualization',    category: 'analytics' },
    ],
    'seattle-building-energy-forecast': [
        { label: 'Regression',            category: 'ml' },
        { label: 'Predictive Modeling',   category: 'ml' },
        { label: 'Scikit-learn',          category: 'ml' },
        { label: 'EDA',                   category: 'analytics' },
        { label: 'Data Visualization',    category: 'analytics' },
    ],
    'nextrank': [
        { label: 'Generative AI',         category: 'nlp' },
        { label: 'LLM',                   category: 'nlp' },
        { label: 'Vertex AI',             category: 'nlp' },
        { label: 'Content Generation',    category: 'nlp' },
        { label: 'Streamlit',             category: 'analytics' },
    ],
    'fruit-classifier-aws': [
        { label: 'PySpark',               category: 'engineering' },
        { label: 'Distributed Computing', category: 'engineering' },
        { label: 'Image Classification',  category: 'ml' },
        { label: 'Deep Learning',         category: 'ml' },
        { label: 'AWS S3',                category: 'cloud' },
        { label: 'AWS EMR',               category: 'cloud' },
    ],
    'python-client-segmentation': [
        { label: 'Clustering',            category: 'ml' },
        { label: 'Customer Segmentation', category: 'ml' },
        { label: 'K-Means',               category: 'ml' },
        { label: 'EDA',                   category: 'analytics' },
        { label: 'pandas',                category: 'analytics' },
    ],
    'Python-Object-Clasifier': [
        { label: 'NLP',                   category: 'nlp' },
        { label: 'LDA',                   category: 'nlp' },
        { label: 'Text Classification',   category: 'nlp' },
        { label: 'Topic Modeling',        category: 'ml' },
    ],
    'nutriscore-predictor': [
        { label: 'Linear Regression',     category: 'ml' },
        { label: 'Scikit-learn',          category: 'ml' },
        { label: 'Predictive Modeling',   category: 'ml' },
        { label: 'EDA',                   category: 'analytics' },
    ],
    'openweather': [
        { label: 'REST API',              category: 'engineering' },
        { label: 'Python',                category: 'engineering' },
        { label: 'Data Fetching',         category: 'engineering' },
    ],
    'Verba': [
        { label: 'RAG',                   category: 'nlp' },
        { label: 'LLM',                   category: 'nlp' },
        { label: 'Vector DB',             category: 'nlp' },
        { label: 'Weaviate',              category: 'nlp' },
        { label: 'Chatbot',               category: 'nlp' },
        { label: 'Python',                category: 'engineering' },
    ],
    'sgtm-cloud-run-shell': [
        { label: 'GCP',                   category: 'cloud' },
        { label: 'Cloud Run',             category: 'cloud' },
        { label: 'Google Tag Manager',    category: 'cloud' },
        { label: 'Shell',                 category: 'engineering' },
        { label: 'DevOps',                category: 'engineering' },
    ],
    'docker-stacks-pyspark': [
        { label: 'Docker',                category: 'engineering' },
        { label: 'PySpark',               category: 'engineering' },
        { label: 'Jupyter',               category: 'engineering' },
    ],
};


// ─── Curated display metadata (for the Editorial projects cards) ───
// name → { title, desc, cats: [string] }
const PROJECT_META = {
    'Python-Object-Clasifier': {
        title: 'Topic Modeling Classifier',
        desc: 'Latent Dirichlet Allocation pipeline that discovers topics from raw text and routes documents to the right bucket. Classic NLP foundation work.',
        cats: ['NLP', 'ML'],
    },
    'nextrank': {
        title: 'SEO Content Generator',
        desc: 'Automated content generation tool optimized for SEO performance. LLM-powered pipeline that researches keywords, drafts copy, and scores readability against competitor SERPs.',
        cats: ['NLP', 'GENERATIVE AI', 'FULL STACK'],
    },
    'scoring-bank-project': {
        title: 'Bank Credit Scoring',
        desc: 'End-to-end credit risk model with imbalanced learning. LightGBM + SHAP explainability, served through a Streamlit dashboard where loan officers can interrogate any prediction.',
        cats: ['ML', 'ANALYTICS', 'FINANCE'],
    },
    'openweather': {
        title: 'OpenWeather Integration',
        desc: 'Lightweight Python client for the OpenWeather API. Fetches and normalizes real-time meteorological data for downstream pipelines.',
        cats: ['ENGINEERING', 'API'],
    },
    'fruit-classifier-aws': {
        title: 'Distributed Fruit Classifier',
        desc: 'Image classification at scale on AWS EMR. PySpark broadcasts a TensorFlow model across executors to process 50k+ images in parallel — distributed deep learning on cloud infra.',
        cats: ['ML', 'CLOUD', 'DISTRIBUTED'],
    },
    'nutriscore-predictor': {
        title: 'Nutriscore Prediction',
        desc: 'Linear regression to predict the Nutri-Score of food products from nutritional facts. Showcases predictive modeling on a public OpenFoodFacts dataset.',
        cats: ['ML', 'ANALYTICS'],
    },
    'python-client-segmentation': {
        title: 'Customer Segmentation',
        desc: 'K-Means clustering on customer behavior data to surface actionable marketing personas. Pandas-driven feature engineering and silhouette-based cluster validation.',
        cats: ['ML', 'ANALYTICS', 'MARKETING'],
    },
    'seattle-building-energy-forecast': {
        title: 'Energy Consumption Prediction',
        desc: 'Regression models forecasting building energy use from weather and occupancy features. Scikit-learn pipelines with full EDA and visualization of feature importance.',
        cats: ['ML', 'ANALYTICS', 'FORECASTING'],
    },
    'Verba': {
        title: 'Verba RAG Chatbot',
        desc: 'Open-source retrieval-augmented chatbot with Weaviate vector store. Indexes any document corpus and answers questions with citations — pluggable LLM backends.',
        cats: ['NLP', 'RAG', 'FULL STACK'],
    },
    'sgtm-cloud-run-shell': {
        title: 'Server-side GTM on Cloud Run',
        desc: 'Shell scaffolding to deploy a server-side Google Tag Manager container on GCP Cloud Run. DevOps recipe for privacy-friendly tracking infra.',
        cats: ['CLOUD', 'DEVOPS', 'GCP'],
    },
    'docker-stacks-pyspark': {
        title: 'Docker PySpark Stacks',
        desc: 'Reproducible Docker images bundling Jupyter + PySpark for local distributed-data prototyping. Works as a base for ML notebooks needing Spark.',
        cats: ['ENGINEERING', 'DEVOPS'],
    },
};

// Ordered list of repos to feature on the projects page. Edit to curate.
const FEATURED_ORDER = [
    'Python-Object-Clasifier',
    'nextrank',
    'scoring-bank-project',
    'openweather',
    'fruit-classifier-aws',
    'nutriscore-predictor',
    'python-client-segmentation',
    'seattle-building-energy-forecast',
];

const CONFIG = {
    githubUser: 'mhaegeman', // Replace with your actual GitHub username
    mediumUser: 'maximehaegeman', // Replace with your actual Medium username
    maxRepos: 6,
    maxArticles: 8
};

// --- THEME SWITCHER LOGIC ---
function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    // Load saved preference
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        toggleBtn.innerText = currentTheme === 'light' ? '☾' : '☀';
    } else {
        // Set default to dark and icon to sun
        document.documentElement.setAttribute('data-theme', 'dark');
        toggleBtn.innerText = '☀';
    }

    // Handle Click
    toggleBtn.addEventListener('click', function () {
        let theme = document.documentElement.getAttribute('data-theme');

        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            toggleBtn.innerText = '☀';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            toggleBtn.innerText = '☾';
        }
    });
}

// --- NAVIGATION ENHANCEMENTS (Active Link & Smart Scroll) ---
function initNavEnhancements() {
    // 1. Highlight Current Page
    const menuItems = document.querySelectorAll('.nav-links a');
    const path = window.location.pathname.split('/').pop() || 'index.html'; // Get the page filename

    menuItems.forEach(item => {
        const itemPath = item.href.split('/').pop() || 'index.html';
        if (itemPath === path) {
            item.classList.add('active');
        }
    });

    // 2. Smart Scroll (Hide/Show Navbar)
    let lastScrollTop = 0;
    const navbar = document.querySelector('nav');
    if (!navbar) return;

    window.addEventListener('scroll', function () {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Only trigger movement if scrolling past the initial top section
        if (scrollTop > 50) {
            if (scrollTop > lastScrollTop) {
                // Scrolling DOWN -> Hide Nav
                navbar.style.transform = "translateY(-100%)";
            } else {
                // Scrolling UP -> Show Nav
                navbar.style.transform = "translateY(0)";
            }
        } else {
            // Always show nav at the very top
            navbar.style.transform = "translateY(0)";
        }
        lastScrollTop = scrollTop;
    }, { passive: true }); // Use passive listener for performance
}

// --- GITHUB FETCHER ---

// Cache of raw GitHub data + a reference to the container so we can
// re-render in place when the language changes without re-hitting the API.
let _reposCache = null;

function renderRepos() {
    const container = document.getElementById('repo-grid');
    if (!container || !_reposCache) return;

    const byName = _reposCache;

    const featured = FEATURED_ORDER
        .map(name => {
            const repo = byName[name];
            if (!repo) return null;
            const meta = PROJECT_META[name] || {};
            // Prefer localized title/desc from i18n; fall back to meta then repo.
            const loc = (window.i18n && window.i18n.getProject)
                ? window.i18n.getProject(name)
                : null;
            return {
                name,
                title: (loc && loc.title) || meta.title || name,
                desc:  (loc && loc.desc)  || meta.desc  || repo.description || 'No description provided.',
                cats: meta.cats || [(repo.language || 'Code').toUpperCase()],
                tags: REPO_TAGS[name] || [],
                html_url: repo.html_url,
                homepage: repo.homepage,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
            };
        })
        .filter(Boolean);

    container.innerHTML = '';

    // Link labels are themselves localizable.
    const liveLabel   = (window.i18n && window.i18n.t) ? window.i18n.t('projects.live_link')   : 'Live\u00a0\u2197';
    const sourceLabel = (window.i18n && window.i18n.t) ? window.i18n.t('projects.source_link') : 'GitHub\u00a0\u2197';

    featured.forEach(p => {
        const card = document.createElement('article');
        card.className = 'v1-card';

        const catsHtml = p.cats
            .map((c, i) => (i === 0 ? '' : '<span class="v1-cats-sep">·</span>') + `<span class="v1-cat">${c}</span>`)
            .join('');

        const tagsHtml = (p.tags || [])
            .map(t => `<span class="tag-${t.category}">${t.label}</span>`)
            .join('');

        const liveLink = (p.homepage && p.homepage.trim())
            ? `<a href="${p.homepage}" target="_blank" rel="noopener" class="v1-link">${liveLabel}</a>`
            : '';
        const sourceLink = `<a href="${p.html_url}" target="_blank" rel="noopener" class="v1-link">${sourceLabel}</a>`;

        card.innerHTML = `
            <div class="v1-corner v1-corner-tl">+</div>
            <div class="v1-corner v1-corner-br">+</div>
            <header class="v1-header">
                <div class="v1-cats">${catsHtml}</div>
                <div class="v1-links">${liveLink}${sourceLink}</div>
            </header>
            <h3 class="v1-title">${p.title}</h3>
            <p class="v1-desc">${p.desc}</p>
            ${tagsHtml ? `<div class="v1-tags">${tagsHtml}</div>` : ''}
        `;

        container.appendChild(card);
    });

    // Trigger scroll reveal on dynamically injected cards
    if (typeof window.observeRevealItems === 'function') {
        window.observeRevealItems(container);
    }
}

async function loadRepos() {
    const container = document.getElementById('repo-grid');
    if (!container) return; // Stop if we aren't on the projects page

    try {
        // 1. Fetch all repos so we can look up star counts + html_url by name.
        const response = await fetch(`https://api.github.com/users/${CONFIG.githubUser}/repos?per_page=100&type=owner`);
        const data = await response.json();
        _reposCache = Object.fromEntries(data.map(r => [r.name, r]));

        renderRepos();

    } catch (error) {
        container.innerHTML = `<p style="color: #ff5f56;">Error fetching repos: ${error.message}</p>`;
    }
}

// --- MEDIUM FETCHER (Card Grid Style) ---

function extractFirstImage(html) {
    const match = html.match(/<img[^>]+src="([^"]+)"/);
    return match ? match[1] : null;
}

function extractTagContent(block, tagName) {
    const pattern = new RegExp(`<${tagName}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tagName}>`, 'i');
    const match = block.match(pattern);
    return match ? match[1] : '';
}

function articleTagClass(label) {
    const l = label.toLowerCase();
    if (['llm', 'gpt', 'generative', 'nlp', 'natural language', 'text classification', 'rag', 'transformer', 'diffusion', 'chatgpt', 'openai', 'reasoning'].some(k => l.includes(k))) return 'tag-nlp';
    if (['machine learning', 'deep learning', 'neural', 'model', 'classification', 'regression', 'prediction'].some(k => l.includes(k))) return 'tag-ml';
    if (['data engineering', 'spark', 'airflow', 'pipeline', 'etl', 'sql', 'docker', 'engineering'].some(k => l.includes(k))) return 'tag-engineering';
    if (['cloud', 'aws', 'gcp', 'azure', 'google cloud'].some(k => l.includes(k))) return 'tag-cloud';
    return 'tag-analytics';
}

// Try multiple CORS proxies in order; return raw XML text or throw.
async function fetchRssXml(rssUrl) {
    // Each entry: { url: string, extractXml: (response) => Promise<string> }
    const proxies = [
        {
            // corsproxy.io — returns the raw content directly
            url: `https://corsproxy.io/?url=${encodeURIComponent(rssUrl)}`,
            extractXml: (r) => r.text()
        },
        {
            // allorigins.win — returns JSON { contents: "..." }
            url: `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`,
            extractXml: async (r) => { const d = await r.json(); return d.contents || ''; }
        },
        {
            // codetabs — returns raw content
            url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`,
            extractXml: (r) => r.text()
        }
    ];

    for (const proxy of proxies) {
        try {
            const response = await fetch(proxy.url, { signal: AbortSignal.timeout(8000) });
            if (!response.ok) continue;
            const xml = await proxy.extractXml(response);
            if (xml && xml.includes('<item>')) return xml;
        } catch (_) {
            // try next proxy
        }
    }
    throw new Error('All proxies failed to reach the Medium RSS feed');
}

async function loadMedium() {
    const container = document.getElementById('blog-list');
    if (!container) return; // Stop if we aren't on the blog page

    const rssUrl = `https://medium.com/feed/@${CONFIG.mediumUser}`;

    try {
        const xmlText = await fetchRssXml(rssUrl);

        // Parse the RSS XML directly in the browser
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, 'text/xml');
        const items = Array.from(xml.querySelectorAll('item'));

        if (!items.length) throw new Error('No articles found in feed');

        // Pre-extract content:encoded per item from raw XML to avoid namespace issues.
        // Split on <item> so each block belongs to exactly one item (no index drift).
        const rawItemBlocks = xmlText.split(/<item[\s>]/).slice(1);
        const contentBlocks = rawItemBlocks.map(block => {
            // Medium feeds can use either <content:encoded> or <description> for image markup.
            const encoded = extractTagContent(block, 'content:encoded');
            if (encoded) return encoded;

            const description = extractTagContent(block, 'description');
            return description || '';
        });

        container.innerHTML = '';

        items.slice(0, CONFIG.maxArticles).forEach((item, idx) => {
            const title = item.querySelector('title')?.textContent?.trim() || 'Untitled';
            const linkUrl = item.querySelector('link')?.nextSibling?.nodeValue?.trim()
                         || item.querySelector('guid')?.textContent?.trim()
                         || '#';

            const pubDate = new Date(item.querySelector('pubDate')?.textContent || Date.now());
            const dateStr = pubDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });

            // Extract featured image from pre-parsed content:encoded block
            const contentHtml = contentBlocks[idx] || '';
            const imgUrl = extractFirstImage(contentHtml);

            // Extract categories/tags
            const categories = Array.from(item.querySelectorAll('category'))
                .map(c => c.textContent.trim())
                .filter(Boolean);

            const tagsHtml = categories.slice(0, 4)
                .map(c => `<span class="${articleTagClass(c)}">${c}</span>`)
                .join('');

            const card = document.createElement('article');
            card.className = 'blog-card';
            const firstCategory = categories[0] || '';
            const overlayTag = firstCategory
                ? `<span class="blog-card-tag-overlay">${firstCategory}</span>`
                : '';

            card.innerHTML = `
                <a href="${linkUrl}" target="_blank" class="blog-card-link">
                    ${imgUrl
                        ? `<div class="blog-card-img">${overlayTag}<img src="${imgUrl}" alt="${title}" loading="lazy"></div>`
                        : `<div class="blog-card-img blog-card-img--empty">${overlayTag}</div>`}
                    <div class="blog-card-body">
                        <span class="blog-date">${dateStr}</span>
                        <h3 class="blog-title">${title}</h3>
                        ${tagsHtml ? `<div class="blog-tags">${tagsHtml}</div>` : ''}
                    </div>
                </a>
            `;

            container.appendChild(card);
        });

        // Trigger scroll reveal on dynamically injected blog cards
        if (typeof window.observeRevealItems === 'function') {
            window.observeRevealItems(container);
        }

    } catch (error) {
        container.innerHTML = `<p style="color: #ff5f56;">[ERROR] Connection refused: ${error.message}</p>`;
    }
}

// --- EXPERIENCE FETCHER ---
// Pulls localized entries from window.i18n.getExperience() and re-renders on langchange.
function renderExperience() {
    const container = document.getElementById('cv-timeline');
    if (!container) return;

    const data = (window.i18n && window.i18n.getExperience)
        ? window.i18n.getExperience()
        : [];

    if (!data.length) {
        container.innerHTML = `<p style="color: #ff5f56;">Error loading experience data.</p>`;
        return;
    }

    container.innerHTML = '';

    data.forEach(job => {
        const item = document.createElement('article');
        item.className = 'timeline-item';

        const achievementsList = (job.achievements || [])
            .map(ach => `<li>${ach}</li>`)
            .join('');

        const companyName = job.companyDisplay || job.company;
        const companyNote = job.companyNote ? `<span class="company-note">(${job.companyNote})</span>` : '';
        const companyLink = job.companyUrl
            ? `<a href="${job.companyUrl}" target="_blank" rel="noopener noreferrer" class="company-link" aria-label="Visit ${companyName} website">${companyName}</a>`
            : `<span class="company-link company-link--text">${companyName}</span>`;

        item.innerHTML = `
            <div class="timeline-content">
                <div class="timeline-text">
                    <span class="job-date">${job.period}</span>
                    <div class="job-header">
                        <div>
                            <h3 class="job-title">${job.role}</h3>
                            <p class="company-meta">
                                @ ${companyLink}
                                ${companyNote}
                            </p>
                        </div>
                    </div>
                    <p class="card-desc">
                        ${job.description}
                    </p>
                    <ul class="job-achievements">
                        ${achievementsList}
                    </ul>
                </div>
                <div class="timeline-logo">
                    <img src="${job.logo}" alt="${companyName} logo" class="company-logo" loading="lazy" decoding="async">
                </div>
            </div>
        `;

        container.appendChild(item);
    });

    if (typeof window.observeRevealItems === 'function') {
        window.observeRevealItems(container);
    }
}

function loadExperience() {
    renderExperience();
}

// --- PRINT BUTTON LOGIC ---
function initPrintButton() {
    const printBtn = document.getElementById('print-btn');
    if (!printBtn) return;

    printBtn.addEventListener('click', () => {
        const resumePdfPath = printBtn.dataset.resumePdf || 'content/resume_2026.pdf';

        const tempLink = document.createElement('a');
        tempLink.href = resumePdfPath;
        tempLink.setAttribute('download', 'Maxime_Haegeman_2026.pdf');
        tempLink.setAttribute('target', '_blank');
        tempLink.setAttribute('rel', 'noopener');
        document.body.appendChild(tempLink);
        tempLink.click();
        tempLink.remove();
    });
}

// --- HAMBURGER MENU ---
function initHamburgerMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (!menuToggle || !navLinks) return;

    menuToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        menuToggle.textContent = isOpen ? '✕' : '☰';
        menuToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when a nav link is clicked (single-page navigation)
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            menuToggle.textContent = '☰';
            menuToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

// Initialize all dynamic loading and functionality
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initParticleNetwork === 'function') initParticleNetwork();
    initThemeToggle();
    initHamburgerMenu();
    initNavEnhancements();
    loadRepos();
    loadMedium();
    loadExperience();
    initPrintButton();
});

// Re-render language-dependent sections when the user switches language.
// GitHub data is cached, so repo re-render is free; experience is synchronous.
window.addEventListener('langchange', () => {
    renderRepos();
    renderExperience();
});
