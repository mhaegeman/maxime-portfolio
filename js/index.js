// Typewriter Effect
const text = "Hi, I'm Maxime.";
const speed = 100; // Speed in milliseconds
let i = 0;

function typeWriter() {
    const typewriterElement = document.getElementById("typewriter");
    if (typewriterElement && i < text.length) {
        typewriterElement.innerHTML += text.charAt(i);
        i++;
        setTimeout(typeWriter, speed);
    }
}

// Time Update
function updateTime() {
    const timeContainer = document.getElementById('cph-time');
    if (!timeContainer) return;

    // Get current time in Copenhagen (CET/CEST)
    const now = new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Europe/Copenhagen',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });

    timeContainer.innerText = `Copenhagen: ${now}`;
}

// Super Saiyan Mode
function triggerSaiyanMode() {
    const frame = document.getElementById('hero-frame');
    const video = document.getElementById('saiyan-video');
    const gif = document.getElementById('saiyan-gif');
    const btn = document.getElementById('saiyan-btn');

    if (!frame || !video || !gif || !btn) return;

    // 1. Change Border to Yellow/Gold using the new class
    frame.classList.add('saiyan-mode');

    // 2. Prepare the UI: Disable button to prevent double clicks
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
    btn.innerText = "max_evolution_reached";

    // 3. Start preloading GIF now (while video plays) to avoid blank frame later
    if (!gif.src && gif.dataset.src) {
        gif.src = gif.dataset.src;
    }

    // 4. Play the transformation video
    video.classList.add('active');
    video.currentTime = 0;
    video.play().catch(error => console.log("Video play error:", error));

    // 5. When video ends, crossfade to GIF
    video.onended = function () {
        video.classList.remove('active');
        gif.classList.add('active');
    };
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    typeWriter();
    updateTime();
    setInterval(updateTime, 1000);

    // Show the video poster (BW profile pic) on load
    const heroVideo = document.getElementById('saiyan-video');
    if (heroVideo) heroVideo.classList.add('active');

    // Bind Saiyan Button
    const saiyanBtn = document.getElementById('saiyan-btn');
    if (saiyanBtn) {
        saiyanBtn.addEventListener('click', triggerSaiyanMode);
    }
});
