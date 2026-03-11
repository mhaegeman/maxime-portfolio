// loader.js

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
            card.className = 'card';

            // Determine primary language (fallback to "Code")
            const lang = repo.language || 'Code';

            // Format date
            const date = new Date(repo.updated_at).toLocaleDateString();

            card.innerHTML = `
                <div>
                    <h3 class="card-header">
                        <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                    </h3>
                    <div class="card-tags">
                        <span class="tag">${lang}</span>
                    </div>
                    <p class="card-desc">
                        ${repo.description || 'No description provided.'}
                    </p>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 15px; font-family: var(--font-code);">
                        ★ ${repo.stargazers_count} &nbsp; ⑂ ${repo.forks_count}
                    </div>
                </div>
                <br>
                <a href="${repo.html_url}" target="_blank" class="btn-link">git_clone -></a>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        container.innerHTML = `<p style="color: #ff5f56;">Error fetching repos: ${error.message}</p>`;
    }
}

// --- MEDIUM FETCHER (Server Log Style) ---

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

        container.innerHTML = '';

        items.slice(0, CONFIG.maxArticles).forEach(item => {
            // Format the Date to look like a system timestamp
            const pubDate = new Date(item.querySelector('pubDate')?.textContent || Date.now());
            const timestamp = pubDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const time = pubDate.toTimeString().split(' ')[0]; // HH:MM:SS

            const title = item.querySelector('title')?.textContent?.trim() || 'Untitled';
            // <link> in RSS 2.0 is a text node sibling; textContent is reliable here
            const linkUrl = item.querySelector('link')?.nextSibling?.nodeValue?.trim()
                         || item.querySelector('guid')?.textContent?.trim()
                         || '#';

            // Create the entry line
            const entry = document.createElement('div');
            entry.style.marginBottom = '15px';
            entry.style.borderBottom = '1px dashed rgba(255,255,255,0.1)';
            entry.style.paddingBottom = '10px';

            // "Log Entry" Layout
            entry.innerHTML = `
                <div style="color: var(--text-secondary);">
                    <span style="color: #8b949e;">[${timestamp} ${time}]</span>
                    <span style="color: var(--accent-color);">INFO:</span> New_Article_Detected
                </div>
                <div style="margin-left: 20px; margin-top: 5px;">
                    <span style="color: #79c0ff;">>></span>
                    <a href="${linkUrl}" target="_blank" style="color: var(--text-primary); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.3s;">
                        ${title}
                    </a>
                </div>
            `;

            const link = entry.querySelector('a');
            link.onmouseover = () => link.style.borderBottom = "1px solid var(--accent-color)";
            link.onmouseout = () => link.style.borderBottom = "1px solid transparent";

            container.appendChild(entry);
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
    initThemeToggle();
    initHamburgerMenu();
    initNavEnhancements();
    loadRepos();
    loadMedium();
    loadExperience();
    initPrintButton();
});