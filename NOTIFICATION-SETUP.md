# Boyne Rugby notification setup

## Files
- Put `index.html` and `firebase-messaging-sw.js` in the website root.
- Merge the supplied `api` files into the existing Azure Static Web Apps API folder. Keep the existing `store` function.
- If the API already has a `package.json`, add `firebase-admin`, `@azure/functions`, and `@azure/data-tables` to its dependencies instead of replacing it.

## Azure Static Web Apps application settings
Add these in Azure Portal > Static Web App > Configuration > Application settings:

- `FIREBASE_SERVICE_ACCOUNT_JSON`: the full one-line JSON from Firebase Console > Project settings > Service accounts > Generate new private key.
- `AZURE_STORAGE_CONNECTION_STRING`: the connection string for the same Azure Storage account used by the app, or another Storage account.

Do not put the Firebase service-account JSON in `index.html`, GitHub, or the service worker.

## Firebase web values
Keep the Firebase web configuration in both `index.html` and `firebase-messaging-sw.js`, and the VAPID public key in `index.html`.

## Implemented triggers
- Match created: New Fixture Added
- Training created: Training Added
- Team published: Team Announced
- Match set to Live: Game Live
- Any score recorded: Try Scored or Score Update
- Match set to Final: Full Time

## Important security note
The current coach portal is selected using `?portal=coach` and does not authenticate the coach. Therefore the notification endpoint is also callable without user authentication. Before wider distribution, protect coach actions with Azure Static Web Apps authentication and restrict `send-notification` to an authenticated coach role.
