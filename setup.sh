#!/usr/bin/env bash
# Usage: bash setup.sh <your-firebase-project-id>
set -e
ID="${1:?Usage: bash setup.sh <firebase-project-id>}"
[ -f .env ] || { echo "Missing .env. Copy .env.example to .env and fill it in (README step 5)."; exit 1; }
echo "{\"projects\":{\"default\":\"$ID\"}}" > .firebaserc
npm install
npx firebase-tools login
npm run build
npx firebase-tools deploy --only firestore:rules,hosting --project "$ID"
echo "Done. Your site is at https://$ID.web.app"
