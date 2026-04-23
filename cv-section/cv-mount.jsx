/* global React, ReactDOM */
// Mount script for site/cv.html — renders the CV section into #cv-timeline.

(function () {
    // Fix logo paths: data.js uses "../content/..." (legacy from the canvas
    // preview at project root), but on the live site we're at site/ already.
    if (window.CV_EXPERIENCE) {
        window.CV_EXPERIENCE = window.CV_EXPERIENCE.map(j => ({
            ...j,
            logo: j.logo.replace(/^\.\.\//, ''),
        }));
    }

    // Override loader.js's renderExperience for this page — we render our own.
    window.renderExperience = function () {};

    function mount() {
        const host = document.getElementById('cv-timeline');
        if (!host) return;
        host.innerHTML = '';
        host.classList.remove('timeline');
        host.classList.add('cv-host');
        ReactDOM.createRoot(host).render(<window.CVSection />);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
