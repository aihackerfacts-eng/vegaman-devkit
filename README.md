# VEGAMAN DevKit

Free online developer utilities by **VEGAMAN**, built with plain HTML, CSS and JavaScript. No backend, no npm, no external libraries.

## Features
- **JSON Formatter and Validator**: validate (with line/column errors), format, minify, copy.
- **Base64 Encoder and Decoder**: Unicode-safe (UTF-8). Base64 is encoding, not encryption.
- **UUID Generator**: version 4 UUIDs, 1–100 at a time, from the browser's secure random generator.
- **Text Analyzer**: words, characters, characters without spaces, lines, reading time (200 wpm).
- **Text Compare**: line-by-line diff showing added, removed and unchanged lines.
- Tool search, sidebar navigation, dark/light theme, responsive layout, keyboard-friendly controls.

## Windows 11 setup
1. Install a modern browser (Edge or Chrome is already enough).
2. Optional editor: install [VS Code](https://code.visualstudio.com/) (free).
3. Extract `vegaman-devkit.zip` (right-click → Extract All).

## Run locally
- **Simplest:** double-click `index.html`.
- **Local server (recommended):** install Python from python.org, open PowerShell in the project folder and run `python -m http.server 8000`, then visit http://localhost:8000. Press Ctrl+C to stop.

## Publish on GitHub Pages
1. Create a public repository named `vegaman-devkit` on github.com.
2. Upload the project files (keep `index.html` at the top level of the repository) and commit.
3. Open **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
4. After a minute or two, the site is live at `https://YOUR-USERNAME.github.io/vegaman-devkit/`.

## Folder structure
```
vegaman-devkit/
├── index.html        page structure and all tool panels
├── styles.css        dark/light themes and layout
├── app.js            tool logic and interface code
├── assets/favicon.svg
├── README.md
└── LICENSE
```

## Troubleshooting
- **Page looks unstyled:** keep `index.html`, `styles.css` and `app.js` in the same folder.
- **Copy button says blocked:** the browser denied clipboard access. Select the text and press Ctrl+C.
- **Changes not showing:** hard refresh with Ctrl+F5.
- **GitHub Pages shows 404:** confirm `index.html` is in the repository root and Pages is set to the `main` branch.

## Privacy and limitations
- All input is processed locally in your browser and is never sent anywhere. The only thing stored is your theme choice (localStorage).
- Very large inputs (several MB) may be slow; Text Compare uses an O(n×m) line algorithm.
- Text Compare compares whole lines, not characters within a line.

## License
MIT © 2026 VEGAMAN. See `LICENSE`.
