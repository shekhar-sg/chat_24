# Agent Chat

A responsive direct-messaging app built with Next.js 15, React, TypeScript, MUI, Firebase Authentication/Firestore, Redux Toolkit, and Cloudinary.

## Implemented

- Email/password signup and login, server-verified HTTP-only sessions, and logout.
- A signed-in people directory, transactional direct-conversation creation, and paginated inbox/people lists.
- Live messages, latest-message loading with older history, typing indicators, read receipts, unread indicators, and numeric date sorting.
- JPG, PNG, WebP, and PDF attachments up to 10 MiB, optional captions, previews, and membership-checked downloads.
- Draft retention and visible retry states for failed sends, uploads, downloads, and data subscriptions.
- Mobile inbox navigation, dismissible copilot drawer, accessible controls, and persistent light/dark theme.
- A **Copilot UI demo** with predefined replies. No AI model or external AI provider is connected.

## Local setup

Use Node.js 22 LTS or 24 and npm. `.nvmrc` selects Node 22. If your shell says no Node version is configured, install/select Node in your version manager before running npm.

```sh
npm ci
```

Keep the existing `.env.local`, or copy `.env.example` to `.env.local` and fill it with your project's values. Never commit secrets. The browser and server Firebase project IDs must match; the private key supports literal `\n` escapes. `NEXT_PUBLIC_*` values are embedded in the browser build and must never contain private credentials.

```sh
npm run check:env
npm run check:services
npm run dev
```

Open [localhost:3000](http://localhost:3000). The environment checker prints only variable names/statuses. The service checker makes read-only Firebase database-metadata and Cloudinary ping requests.

Enable Email/Password authentication in the existing Firebase project's console. Add the local and production hostnames to Authentication's authorized domains where needed. The Firebase Admin service account needs Auth/session and Firestore access.

## Firebase rules and indexes

The app uses the existing **Standard edition `(default)` database** in `asia-south1`. `firebase.json` and `.firebaserc` select the existing project. No new database or automatic live deployment is performed.

After reviewing the target project and the local rules tests, deploy the checked-in rules and indexes using an authenticated Firebase CLI:

```sh
npx firebase deploy --only firestore:rules,firestore:indexes
```

Wait for indexes to finish building before testing the deployed inbox. The new rules are required for file captions, atomic message summaries, and own-user typing/read metadata. Deploy rules and application together; older application clients do not write the new summary message ID and should reload after release. Existing messages and conversations are readable without a backfill; optional captions and typing timestamps support older data.

Profiles are created/repaired through a verified server session, not client writes. The member directory intentionally exposes profile names and account emails to other signed-in members for discovery. Do not store secrets or unrelated private fields in `users` documents.

The rules include the current public Cloudinary cloud name in their URL validator. Update that validator when switching Cloudinary accounts and rerun the rules suite.

## Cloudinary

Set the existing cloud name, API key, and server-only API secret. Files pass through `/api/files/upload`; the server limits the streamed request body, checks conversation membership, and restricts Cloudinary formats. No arbitrary upload-signature endpoint is exposed.

Attachments use Cloudinary's public delivery URLs. Conversation documents and download endpoints are access-controlled, but an existing delivery URL can be shared. Confidential file storage would require authenticated/private Cloudinary assets and a separate delivery policy.

Some Cloudinary accounts disable PDF delivery by default. Enable PDF delivery in the account security settings if PDF previews/downloads return a Cloudinary error. Uploading a file and then removing it before sending can leave an unattached asset; configure an asset-retention process for long-running deployments.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

The local emulator suites require Java 21 or newer and may download Firebase emulator binaries on first use:

```sh
npm run test:rules
npm run test:e2e
```

They use the isolated `demo-beyond-chat` project. Browser tests use installed Microsoft Edge headlessly by default. Set `PLAYWRIGHT_CHANNEL=chrome` to use Chrome, or adapt the launch configuration for Playwright's installed Chromium. Screenshots and diagnostic logs are written to ignored `test-results/`.

The browser suite runs its own emulator-backed Next.js server on port 3100 and cleans up that process. Keep ports 3100, 4400, 8080, 9099, and 9150 available. It never creates accounts or sends messages in the live Firebase project. The default suite rejects an invalid upload without creating any Cloudinary asset. Optionally set `RUN_CLOUDINARY_SMOKE=true` to exercise one real image upload, caption, preview, and download; the suite deletes that asset during cleanup.

For manual emulator development, set the optional emulator variables shown in `.env.example`, use a demo project ID consistently on client/server, and start `npx firebase emulators:start --only auth,firestore --project demo-beyond-chat` before Next.js. Never enable emulator flags in production.

## Production build and deployment

```sh
npm run build
npm start
```

Configure the same environment values in the host before building. Use HTTPS so secure session cookies work. Run rules/index deployment as a separate reviewed release step. No hosting deployment is performed automatically.

`NEXT_BUILD_DIR` optionally changes Next's output directory. For example, use `.next-production` while a development server is running, then use that same value with `next start`. If Windows reports `EPERM` for build directories, stop processes using that output directory or use a fresh output directory; do not run development and production builds against the same cache.

Runtime dependencies include compatible security overrides for gRPC and PostCSS. Revalidate those overrides when upgrading dependencies. Run `npm audit --omit=dev` for the deployed dependency tree; development-tool advisories are reported separately and do not justify blindly forcing major-version downgrades/upgrades.

## Verification record (2026-10-21)

- Production build, TypeScript, and ESLint passed.
- Five unit tests and eight Firestore emulator regression tests passed.
- Browser suite passed signup, messaging, refresh, unread state, logout/login, failed-send recovery, upload-error feedback, 100+ message pagination, mobile navigation, drawer dismissal, and outsider access errors.
- Real Cloudinary PNG upload, caption, preview, and authenticated download passed; the temporary asset was deleted.
- Firebase and Cloudinary credentials passed read-only checks.
- `npm audit --omit=dev`: zero reported vulnerabilities. Seven high-severity advisories remain in development-tool dependency chains involving `braces`; no upstream compatible fix was available.
- Live Firebase rules/index publication and hosting deployment were not performed.
