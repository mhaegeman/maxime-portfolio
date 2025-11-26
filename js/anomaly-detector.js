// --- Game Setup Variables ---
const OUTPUT = document.getElementById('game-output');
const SCORE_EL = document.getElementById('score');
const STRIKES_EL = document.getElementById('strikes');
const START_BTN = document.getElementById('start-button');
const DETECT_BTN = document.getElementById('detect-button');
const NAME_INPUT = document.getElementById('player-name');

let score = 0;
let strikes = 0;
let gameInterval = null;
let isAnomalyPresent = false;
let anomalyRowAge = 0; // Tracks how long the anomaly has been on screen
let gameRunning = false;
let currentAnomalyElement = null;

const LEADERBOARD_KEY = 'anomaly_leaderboard';
const MAX_SCORES = 5;
const BASE_DELAY = 180; // Speed of data stream
const ANOMALY_CHANCE = 0.12;
const NORMAL_RANGE = { min: 50, max: 150 };

// --- Leaderboard Functions ---

function loadLeaderboard() {
    const scores = localStorage.getItem(LEADERBOARD_KEY);
    return scores ? JSON.parse(scores) : [];
}

function saveScore(newScore) {
    let scores = loadLeaderboard();
    let playerName = NAME_INPUT.value.trim().toUpperCase() || 'ANON';
    playerName = playerName.substring(0, 10);

    scores.push({ name: playerName, score: newScore, date: new Date().toLocaleDateString() });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, MAX_SCORES);

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(scores));
    displayLeaderboard(scores);
}

function displayLeaderboard(scores = loadLeaderboard()) {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;

    list.innerHTML = '';

    if (scores.length === 0) {
        list.innerHTML = `<li style="color: var(--text-secondary); border-left-width: 3px;">No scores recorded yet. Time to play!</li>`;
        return;
    }

    scores.forEach((entry, index) => {
        const item = document.createElement('li');
        const namePadded = entry.name.padEnd(10, ' ');
        const scorePadded = String(entry.score).padStart(4, ' ');

        item.innerHTML = `
            <span style="color: var(--accent-color); font-weight: bold;">[${index + 1}]</span> 
            ${namePadded}: 
            <span style="float: right;">${scorePadded} pts</span>
        `;
        list.appendChild(item);
    });
}

// --- Game Logic Functions ---

function updateDisplay() {
    SCORE_EL.textContent = score;
    STRIKES_EL.textContent = `${strikes} / 3`;

    if (strikes > 0) {
        STRIKES_EL.style.color = '#ff5f56';
    } else {
        STRIKES_EL.style.color = 'var(--accent-color)';
    }
}

function generateDataPoint() {
    const timestamp = new Date().toLocaleTimeString('en-GB');

    // 1. Increment anomaly age if it exists
    if (isAnomalyPresent) {
        anomalyRowAge++;
    }

    // 2. Determine if a NEW anomaly should appear
    const shouldBeAnomaly = Math.random() < ANOMALY_CHANCE && !isAnomalyPresent;

    // Create a new div wrapper for the log line
    const logElement = document.createElement('div');
    logElement.style.marginBottom = '2px';

    if (shouldBeAnomaly) {
        isAnomalyPresent = true;
        anomalyRowAge = 0; // Reset age counter for new anomaly

        if (Math.random() < 0.5) {
            // Type 1 Anomaly: Narrowly out-of-range number
            const anomalyValue = Math.random() < 0.5 ?
                (Math.random() * 5 + 1).toFixed(3) :
                (Math.random() * 50 + 150).toFixed(3);

            logElement.innerHTML = `<span class="anomaly">[${timestamp}] DATA: data_point=${anomalyValue}</span>`;
        } else {
            // Type 2 Anomaly: Unexpected format
            const anomalyValue = Math.random().toString(36).substring(2, 12);
            logElement.innerHTML = `<span class="anomaly">[${timestamp}] DATA: hash_point=${anomalyValue}</span>`;
        }

        currentAnomalyElement = logElement;
    } else {
        // Normal data point
        const normalValue = (Math.random() * (NORMAL_RANGE.max - NORMAL_RANGE.min) + NORMAL_RANGE.min).toFixed(3);
        logElement.innerHTML = `<span style="color: var(--text-secondary);">[${timestamp}] INFO: data_point=${normalValue}</span>`;
    }

    OUTPUT.appendChild(logElement);
    // Scroll to bottom immediately
    setTimeout(() => {
        OUTPUT.scrollTop = OUTPUT.scrollHeight;
    }, 0);
}

function endGame(message) {
    clearInterval(gameInterval);
    gameRunning = false;

    const endMsg = document.createElement('div');
    endMsg.innerHTML = `<br><span style="color: #ff5f56; font-weight: bold;">[SYSTEM ALERT] GAME OVER: ${message}</span><br>` +
        `<span style="color: var(--accent-color); font-weight: bold;">Final Score: ${score} pts</span><br>`;
    OUTPUT.appendChild(endMsg);
    OUTPUT.scrollTop = OUTPUT.scrollHeight;

    if (score > 0) {
        saveScore(score);
    }

    // Reset UI
    START_BTN.textContent = '[ RESTART_GAME ]';
    START_BTN.disabled = false;
    DETECT_BTN.disabled = true;
    NAME_INPUT.disabled = false;
    document.removeEventListener('keydown', handleKeyPress);
}

// --- Event Handlers ---

// Central function to handle detection (Button or Spacebar)
function triggerDetection(e) {
    if (!gameRunning) return;

    // Prevent default behavior (like scrolling) if triggered by event
    if (e && e.type === 'keydown') {
        e.preventDefault();
    }

    if (isAnomalyPresent) {
        // CORRECT DETECTION
        // Scoring Logic: Max 100 points. Lose 1 point for every row that printed since appearance. Min 0.
        const points = Math.max(0, 100 - anomalyRowAge);
        score += points;

        // Reset states
        isAnomalyPresent = false;
        anomalyRowAge = 0;

        // Highlight the anomaly green
        if (currentAnomalyElement) {
            currentAnomalyElement.querySelector('.anomaly').classList.add('detected-anomaly');
            currentAnomalyElement.querySelector('.anomaly').style.animation = 'none';
        }

        // Feedback Message
        const successMsg = document.createElement('div');
        successMsg.innerHTML = `<span style="color: var(--accent-color); font-weight: bold;">[SUCCESS] Anomaly neutralized! (+${points})</span><br>`;
        OUTPUT.appendChild(successMsg);

        currentAnomalyElement = null;

    } else {
        // FALSE ALARM
        strikes++;
        const warningMsg = document.createElement('div');
        warningMsg.innerHTML = `<span style="color: #ff5f56;">[WARNING] False positive! (-1 Strike)</span><br>`;
        OUTPUT.appendChild(warningMsg);
    }

    updateDisplay();
    OUTPUT.scrollTop = OUTPUT.scrollHeight;

    if (strikes >= 3) {
        endGame("Too many false alarms detected.");
    }
}

function handleKeyPress(event) {
    if (!gameRunning) return;
    // Spacebar check
    if (event.key === ' ' || event.keyCode === 32) {
        triggerDetection(event);
    }
}

function startGame() {
    if (!NAME_INPUT.value.trim()) {
        const errorMsg = document.createElement('div');
        errorMsg.innerHTML = `<span style="color: #ff5f56; font-weight: bold;">[ERROR] Player_ID_Required.</span><br>`;
        OUTPUT.appendChild(errorMsg);
        OUTPUT.scrollTop = OUTPUT.scrollHeight;
        return;
    }

    // Reset Game State
    score = 0;
    strikes = 0;
    isAnomalyPresent = false;
    anomalyRowAge = 0;
    currentAnomalyElement = null;
    gameRunning = true;
    updateDisplay();

    OUTPUT.innerHTML = '';
    const startMsg = document.createElement('div');
    startMsg.innerHTML = `<span style="color: var(--accent-color);">> Data_stream_initiated...</span><br>`;
    OUTPUT.appendChild(startMsg);
    OUTPUT.scrollTop = OUTPUT.scrollHeight;

    // UI Updates
    START_BTN.textContent = '[ RUNNING ]';
    START_BTN.disabled = true;
    DETECT_BTN.disabled = false; // Enable detection button
    NAME_INPUT.disabled = true;

    if (gameInterval) clearInterval(gameInterval);

    // Start Loop
    gameInterval = setInterval(generateDataPoint, BASE_DELAY);

    // Listen for Spacebar
    document.addEventListener('keydown', handleKeyPress);
}

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    displayLeaderboard();
    START_BTN.addEventListener('click', startGame);
    DETECT_BTN.addEventListener('click', triggerDetection); // Bind click for mobile users

    // Scroll Listener: Check if anomaly scrolled off screen
    OUTPUT.addEventListener('scroll', () => {
        // If anomaly exists AND is scrolled out of view
        if (isAnomalyPresent && OUTPUT.scrollTop < (OUTPUT.scrollHeight - OUTPUT.clientHeight - 50)) {
            // Missed Anomaly
            strikes++;
            isAnomalyPresent = false;
            currentAnomalyElement = null;

            const criticalMsg = document.createElement('div');
            criticalMsg.innerHTML = `<span style="color: #ff5f56; font-weight: bold;">[CRITICAL] Anomaly missed! Data integrity compromised! (-1 Strike)</span><br>`;
            OUTPUT.appendChild(criticalMsg);

            updateDisplay();
            OUTPUT.scrollTop = OUTPUT.scrollHeight;

            if (strikes >= 3) {
                endGame("Critical anomalies were missed.");
            }
        }
    });
});
