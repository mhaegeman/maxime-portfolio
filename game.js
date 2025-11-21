// game.js - Leaderboard Functions

const LEADERBOARD_KEY = 'anomaly_leaderboard';
const MAX_SCORES = 5;

// --- Load Scores from Local Storage ---
function loadLeaderboard() {
    const scores = localStorage.getItem(LEADERBOARD_KEY);
    return scores ? JSON.parse(scores) : [];
}

// --- Save Score and Update Leaderboard ---
function saveScore(newScore) {
    let scores = loadLeaderboard();
    
    // 1. Add new score (using a default placeholder name)
    scores.push({ name: 'PLAYER', score: newScore, date: new Date().toLocaleDateString() });
    
    // 2. Sort by score (descending)
    scores.sort((a, b) => b.score - a.score);
    
    // 3. Keep only the top 5
    scores = scores.slice(0, MAX_SCORES);
    
    // 4. Save back to local storage
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(scores));
    
    displayLeaderboard(scores);
}

// --- Display Leaderboard on the Page ---
function displayLeaderboard(scores = loadLeaderboard()) {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;

    list.innerHTML = '';
    
    if (scores.length === 0) {
        list.innerHTML = `<p style="color: var(--text-secondary);">No scores recorded yet. Time to play!</p>`;
        return;
    }

    scores.forEach((entry, index) => {
        const item = document.createElement('li');
        item.innerHTML = `
            <span style="color: var(--accent-color);">${index + 1}.</span> 
            ${entry.name}: 
            <span style="float: right;">${entry.score} pts</span>
        `;
        list.appendChild(item);
    });
}

// --- Example Game Initialization (To be called on game.html load) ---
document.addEventListener('DOMContentLoaded', () => {
    displayLeaderboard();
    
    // --- Hook this function to your actual game logic end ---
    // Example usage: saveScore(1250);
});