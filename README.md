# Game Result Analyzer

A mobile-first, installable PWA for manually recording and reviewing historical
Coin, Mini Roulette, Wheel, and Dice results. Data remains in the current
browser/device unless the user exports a backup.

The app shows historical frequencies, streaks, transitions, pattern matches,
confidence ranges, and backtest summaries. These are descriptive statistics,
not a guarantee of a future result or a reliable betting edge.

## Run locally

Prerequisite: Node.js 22 or newer.

```bash
npm install
npm run check
npm run dev
```

Open the local address printed by Vite.

## Free deployment with GitHub Pages

This project already includes an automatic GitHub Pages workflow.

1. Create a public GitHub repository, for example `game-result-analyzer`.
2. Upload the full contents of this project to the repository's `main` branch.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Open the **Actions** tab and wait for **Deploy to GitHub Pages** to finish.
6. The deployment job displays the public app URL.

The Vite base path is calculated automatically from the repository name, so no
username or repository name needs to be hard-coded.

## Install on Android

Open the published URL in Chrome, then use **⋮ → Add to Home screen** or
**Install app**. After the first successful online load, the service worker
caches the app shell for offline use.

Browser data can be removed by clearing site data or uninstalling the PWA.
Export a backup from the app before clearing browser data or changing devices.

## Verification commands

```bash
npm run lint
npm test
npm run build
```

`npm test` executes the app's 12 built-in diagnostic scenarios. The GitHub
Pages workflow runs all three checks before every deployment.
