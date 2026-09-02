# Coach login setup

## 1. Firebase Authentication

In Firebase Console, open **Build > Authentication > Sign-in method** and enable **Email/Password**.

Create each coach under **Authentication > Users**. Do not add a public sign-up screen to the app.

## 2. Azure Static Web App settings

Keep the existing settings and add:

- `COACH_EMAILS`: comma-separated lower-case coach email addresses, for example `coach1@example.com,coach2@example.com`.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: the existing one-line service-account JSON used by notifications.

If `COACH_EMAILS` is blank, any authenticated Firebase account is accepted as a coach. Set this value before adding parent accounts later.

## 3. Deploy

Copy the supplied files into the matching locations in the repository. The workflow still uses `app_location: "/"`, `api_location: "api"`, and `output_location: ""`.

## 4. Test

1. Open the parent portal and confirm fixtures and parent RSVPs still work without a login.
2. Tap **Coach**. The coach login dialog should open.
3. Sign in with a Firebase coach account.
4. Confirm Dashboard, Squad, Selection, Stats and coach controls appear.
5. Open Options and use **Log Out of Coach Area**.
6. After logout, confirm coach controls are no longer available.
7. Try an incorrect password and the password reset link.

## Security applied

- Coach mode is not activated until Firebase reports an authenticated user.
- Coach API changes carry a Firebase ID token.
- Schedule, roster, team, score, check-in, notes, polls and other coach-managed storage writes require a verified coach token.
- Sending push notifications requires a verified coach token.
- Parent RSVP writes and poll voting remain available without parent login for this phase.

## Important scope note

This phase secures coach actions. Parent data is still accessed through the anonymous parent experience. A later parent-login phase should add user-to-player linking and narrower read permissions.
