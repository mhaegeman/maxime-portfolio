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
    'Energy-consumption-prediction': [
        { label: 'Regression',            category: 'ml' },
        { label: 'Predictive Modeling',   category: 'ml' },
        { label: 'Scikit-learn',          category: 'ml' },
        { label: 'EDA',                   category: 'analytics' },
        { label: 'Data Visualization',    category: 'analytics' },
    ],
    'seo-content-generator': [
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
    'Nutriscore-Prediction': [
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
async function loadRepos() {
    const container = document.getElementById('repo-grid');
    if (!container) return; // Stop if we aren't on the projects page

    try {
        // 1. Fetch repos (we get up to 100 to ensure we find the most starred ones)
        // We cannot sort by stars in the API url, so we just fetch the list.
        const response = await fetch(`https://api.github.com/users/${CONFIG.githubUser}/repos?per_page=100&type=owner`);
        let data = await response.json();

        // 2. Manually sort by stars (Descending: High -> Low)
        data.sort((a, b) => b.stargazers_count - a.stargazers_count);

        // Clear the "Loading..." text
        container.innerHTML = '';

        // 3. Slice to limit number of repos
        data.slice(0, CONFIG.maxRepos).forEach(repo => {
            // Skip forked repos if you want only your own work
            // if (repo.fork) return; 

            const card = document.createElement('article');
            card.className = 'card proj-card';

            const lang = repo.language || 'Code';
            const desc = repo.description
                ? (repo.description.length > 120 ? repo.description.slice(0, 117) + '…' : repo.description)
                : 'No description provided.';

            const skillTags = (REPO_TAGS[repo.name] || [])
                .map(t => `<span class="tag-${t.category}">${t.label}</span>`)
                .join('');

            card.innerHTML = `
                <div class="proj-header">
                    <h3 class="card-header">
                        <span class="proj-prompt">~/</span>${repo.name}
                    </h3>
                    <a href="${repo.html_url}" target="_blank" class="btn-link">git_clone&nbsp;→</a>
                </div>
                <div class="card-tags">
                    <span class="tag">${lang}</span>
                    <span class="proj-stat">★ ${repo.stargazers_count}</span>
                    <span class="proj-stat">⑂ ${repo.forks_count}</span>
                </div>
                ${skillTags ? `<div class="card-skill-tags">${skillTags}</div>` : ''}
                <p class="card-desc">${desc}</p>
            `;

            container.appendChild(card);
        });

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

    } catch (error) {
        container.innerHTML = `<p style="color: #ff5f56;">[ERROR] Connection refused: ${error.message}</p>`;
    }
}

// --- EXPERIENCE FETCHER ---
async function loadExperience() {
    const container = document.getElementById('cv-timeline');
    if (!container) return; // Stop if we aren't on the CV page

    try {
        const response = await fetch('content/experience.json');
        const data = await response.json();

        container.innerHTML = '';

        data.forEach(job => {
            // Create the timeline item wrapper
            const item = document.createElement('div');
            item.className = 'timeline-item';

            // Generate the bullets HTML
            // We map over the array of strings and turn them into <li> tags
            const achievementsList = job.achievements
                .map(ach => `<li>${ach}</li>`)
                .join('');

            item.innerHTML = `
                <span class="job-date">${job.period}</span>
                <h3 style="margin-top: 5px;">${job.role} <span style="color: var(--text-secondary);">@ ${job.company}</span></h3>
                <p class="card-desc" style="margin-top: 10px; margin-bottom: 10px;">
                    ${job.description}
                </p>
                <ul style="list-style: disc; margin-left: 20px; color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6;">
                    ${achievementsList}
                </ul>
            `;

            container.appendChild(item);
        });

    } catch (error) {
        container.innerHTML = `<p style="color: #ff5f56;">Error loading experience data.</p>`;
        console.error(error);
    }
}

// --- PRINT BUTTON LOGIC ---
function initPrintButton() {
    const printBtn = document.getElementById('print-btn');
    if (!printBtn) return;

    printBtn.addEventListener('click', () => {
        window.print();
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
    initParticleNetwork();
    initThemeToggle();
    initHamburgerMenu();
    initNavEnhancements();
    loadRepos();
    loadMedium();
    loadExperience();
    initPrintButton();
});
