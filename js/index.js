// Typewriter Effect
const text = "Hi, I'm Maxime.";
const speed = 100;
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

    const now = new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Europe/Copenhagen',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });

    timeContainer.innerText = `Copenhagen: ${now}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    typeWriter();
    updateTime();
    setInterval(updateTime, 1000);
});
