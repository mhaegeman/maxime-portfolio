// loader.js

const CONFIG = {
    githubUser: 'mhaegeman', // Replace with your actual GitHub username
    mediumUser: 'maximehaegeman', // Replace with your actual Medium username
    maxRepos: 6,
    maxArticles: 5
};

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

// --- MEDIUM FETCHER (RSS-TO-JSON) ---
async function loadMedium() {
    const container = document.getElementById('blog-list');
    if (!container) return; // Stop if we aren't on the blog page

    // We use rss2json to convert Medium's XML feed to JSON
    const rssUrl = `https://medium.com/feed/@${CONFIG.mediumUser}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        container.innerHTML = '';

        if (data.status === 'ok') {
            data.items.slice(0, CONFIG.maxArticles).forEach(item => {
                // Clean up the date
                const date = item.pubDate.split(' ')[0];
                
                // Create the entry
                const entry = document.createElement('div');
                entry.className = 'blog-entry';
                
                entry.innerHTML = `
                    <span class="json-string">[INFO]</span> 
                    <a href="${item.link}" target="_blank" style="font-weight: 600; font-size: 1.1rem;">${item.title}</a>
                    <div class="blog-meta">
                        Date: ${date} | Author: ${item.author}
                    </div>
                `;
                
                container.appendChild(entry);
            });
        } else {
            throw new Error('Failed to parse feed');
        }

    } catch (error) {
        container.innerHTML = `<p style="color: #ff5f56;">Error fetching articles. <br> Note: Ensure your Medium username is correct.</p>`;
    }
}

// --- EXPERIENCE FETCHER ---
async function loadExperience() {
    const container = document.getElementById('cv-timeline');
    if (!container) return; // Stop if we aren't on the CV page

    try {
        const response = await fetch('experience.json');
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadRepos();
    loadMedium();
    loadExperience();
});