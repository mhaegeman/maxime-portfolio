# \~/maxime\_haegeman | Personal Data Science Portfolio

A minimal, terminal-themed personal website designed for Data Scientists and Engineers. This static site features a cyberpunk aesthetic and dynamically fetches content from external APIs to keep your portfolio up-to-date automatically.

## ⚡ Features

  * **Terminal Aesthetic:** Dark mode, monospace fonts, and typewriter effects.
  * **Dynamic GitHub Integration:** Automatically fetches and displays your latest top repositories using the GitHub API.
  * **Dynamic Blog Integration:** Fetches your latest Medium articles via RSS-to-JSON.
  * **JSON-Driven CV:** Update your work experience by editing a simple `experience.json` file—no HTML editing required for updates.
  * **Responsive Design:** Fully optimized for desktop and mobile screens.

## 📂 Project Structure

```bash
.
├── index.html              # Landing page (Hero section)
├── projects.html           # Git repositories grid
├── blog.html               # Medium article logs
├── cv.html                 # Work experience timeline
├── games.html              # Games landing page
├── anomaly_detector.html   # Anomaly Detector game
├── survivor.html           # Survivor Protocol game (Three.js)
├── css/                    # External stylesheets
│   ├── index.css
│   ├── anomaly-detector.css
│   └── survivor.css
├── js/                     # External scripts
│   ├── index.js
│   ├── anomaly-detector.js
│   └── survivor.js
├── style.css               # Global styles and terminal themes
├── loader.js               # Logic for fetching GitHub, Medium, and JSON data
├── experience.json         # Database for your work history
└── resume.pdf              # (Optional) Your downloadable PDF resume
```

## 🛠 Configuration

### 1\. Update Usernames (`loader.js`)

Open `loader.js` and update the `CONFIG` object at the very top to point to your profiles:

```javascript
const CONFIG = {
    githubUser: 'maximehaegeman', // Your GitHub username
    mediumUser: 'maximehaegeman', // Your Medium username
    maxRepos: 6,                  // Number of repos to display
    maxArticles: 5                // Number of articles to display
};
```

### 2\. Update Work Experience (`experience.json`)

To add or change jobs, edit the `experience.json` file. Follow this format:

```json
[
    {
        "period": "2023 - Present",
        "role": "Senior Data Scientist",
        "company": "TechCorp",
        "description": "Brief description of the role...",
        "achievements": [
            "Achievement 1",
            "Achievement 2"
        ]
    }
]
```

### 3\. Add your PDF

Export your actual CV as a PDF, rename it to `resume.pdf`, and place it in the root folder. The "Download" button in `cv.html` links to this specific filename.

## 🚀 Local Development

Because this site uses `fetch()` to load local JSON files and external APIs, **it will not work correctly if you simply double-click the `.html` files** (due to browser CORS security policies).

You must run it via a local server.

**Option A: VS Code (Recommended)**

1.  Install the "Live Server" extension.
2.  Right-click `index.html` and select **"Open with Live Server"**.

**Option B: Python**
Open your terminal in the project folder and run:

```bash
# Python 3
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## 🌍 Deployment

This site is designed to be hosted on **GitHub Pages**.

1.  Push this code to a GitHub repository (e.g., `portfolio`).
2.  Go to **Settings** \> **Pages**.
3.  Select `main` branch as the source.
4.  Your site will be live at `https://yourusername.github.io/portfolio`.

## 🎨 Customization

  * **Colors:** Edit the CSS Variables in `:root` inside `style.css` to change the accent color (currently Terminal Green `#00ff41`).
  * **Fonts:** The site uses *Fira Code* via Google Fonts. You can change this in the `<head>` of the HTML files and `style.css`.

-----

*Built by [Maxime Haegeman](https://www.google.com/search?q=https://github.com/maximehaegeman)*
