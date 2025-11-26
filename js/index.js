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

    // 3. Play the transformation video
    video.style.display = 'block';
    gif.style.display = 'none';

    video.currentTime = 0;
    video.play().catch(error => console.log("Video play error:", error));

    // 4. When video ends, swap to the looping GIF
    video.onended = function () {
        video.style.display = 'none';

        // Lazy load the GIF
        if (!gif.src && gif.dataset.src) {
            gif.src = gif.dataset.src;
        }

        gif.style.display = 'block';
    };
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    typeWriter();
    updateTime();
    setInterval(updateTime, 1000);

    // Bind Saiyan Button if it exists (it has onclick in HTML, but better here if we remove onclick)
    const saiyanBtn = document.getElementById('saiyan-btn');
    if (saiyanBtn) {
        saiyanBtn.addEventListener('click', triggerSaiyanMode);
    }
});
