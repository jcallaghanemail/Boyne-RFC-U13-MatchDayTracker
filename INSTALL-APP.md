# Boyne RFC U13 app installation

## Repository changes

1. Copy all files from this pack to the repository root beside `index.html`.
2. Add the contents of `pwa-head-snippet.html` inside the `<head>` of `index.html`.
3. Keep the supplied `firebase-messaging-sw.js` as the single root service worker. It contains both Firebase Messaging and PWA asset caching.
4. Commit to `main` and allow the existing Azure Static Web Apps workflow to deploy.

## Verify after deployment

- Open `/manifest.webmanifest` on the live site and confirm JSON appears.
- View page source and confirm `rel="manifest"` exists.
- In Chrome or Edge DevTools, open Application > Manifest and confirm the app name and icons appear.
- Do not cache `/api/` responses. The supplied service worker deliberately bypasses them.

## Install on Android

Open the live site in Chrome, open the browser menu, and choose **Install app** or **Add to Home screen**.

## Install on iPhone or iPad

Open the live site in Safari, tap **Share**, then **Add to Home Screen**.

## Native store release

This pack creates an installable PWA for Android and Apple devices. Publishing through Google Play or the Apple App Store is a separate native packaging and signing step. The existing Azure-hosted app remains the source of data and APIs.
