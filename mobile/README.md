# Neo Expense Tracker — Android offline-first app

This is the native Android companion to the existing Neo Expense Tracker website. It uses Expo / React Native, Supabase Auth and SQLite.

## Current mobile scope
- Email/password sign-in and account creation using the existing Supabase Auth project.
- Each person signs into their own private account; existing Supabase row-level security remains the authority for cloud data.
- Transactions are stored in SQLite on the phone and remain readable offline.
- New transactions and deletes are queued locally and synchronised when a connection is available / the app is reopened.
- The app keeps the web dashboard separate; the website remains available on PC.

## Configure
1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the same public project values used by the website. Never put a service-role key in the app.
3. From this directory run `npm install`, then `npx expo start`.

## Build an installable APK
Install EAS CLI, sign in to the Expo account, then run:
`npx eas-cli build --platform android --profile preview`
The preview profile is configured to produce an APK. EAS will provide the install link when the cloud build completes.

## Sync notes
- Local SQLite is the read source for transaction history, including while offline.
- The sync queue uses stable client-generated UUIDs and idempotent upserts.
- Remote reads are scoped to the signed-in user; Supabase RLS is still enforced.
- Sign-out clears that user's local transaction cache and pending queue on this device.
- This initial mobile milestone synchronises transactions. Other web modules (budgets, goals, portfolio, liabilities and reports) remain on the website and are planned for subsequent mobile iterations.
