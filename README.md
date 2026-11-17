# HireBridge

Resume hosting and messaging on Google Cloud (Firebase Spark plan, no billing account).

Stack: React + Vite, Firebase Authentication, Cloud Firestore (profiles, resumes, chat), Firebase Hosting.

## Run locally
1. Copy `.env.example` to `.env` and fill in the four values from the Firebase console.
2. `npm install`
3. `npm run dev` and open the printed address.

## Deploy
`bash setup.sh <your-firebase-project-id>`

## Design notes
- Resumes are stored as Base64 inside Firestore (limit: 700 KB PDFs) so the project stays on the free Spark plan. On a paid plan, move files to Cloud Storage and keep only the file path in Firestore.
- Security rules in `firestore.rules` enforce roles: candidates edit only their own data, employers can read profiles and resumes, and chats are visible only to the two participants.
- Known limit: anyone can pick "Employer" when signing up. A production system would verify employers.

## Common problems
- `permission-denied` in the browser: rules were not deployed, or the account has no role record. Redeploy rules and sign up again.
- Blank page after deploy: `.env` was empty at build time. Fill it in and rebuild.
- `auth/operation-not-allowed`: enable Email/Password in Firebase console > Authentication.
