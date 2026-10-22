# Agent Chat

A responsive direct-messaging app built with Next.js 15, React, TypeScript, MUI, Firebase Authentication/Firestore, Redux Toolkit, and Cloudinary.

## Implemented

- Email/password signup and login, server-verified HTTP-only sessions, and logout.
- A signed-in people directory, transactional direct-conversation creation, and paginated inbox/people lists.
- Live messages, latest-message loading with older history, typing indicators, read receipts, unread indicators, and numeric date sorting.
- JPG, PNG, WebP, and PDF attachments up to 10 MiB, optional captions, previews, and membership-checked downloads.
- Draft retention and visible retry states for failed sends, uploads, downloads, and data subscriptions.
- Mobile inbox navigation, dismissible copilot drawer, accessible controls, and persistent light/dark theme.
- A Gemini AI Assistant for active-chat summaries, reply drafts, rewriting, explanations, and translations. Drafts are inserted for review and never sent automatically.

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

## Gemini AI Assistant

Set server-only `GEMINI_API_KEY` from Google AI Studio. `GEMINI_MODEL` defaults to `gemini-3.5-flash-lite`; the implementation uses the official `@google/genai` SDK. Older `gemini-2.5-flash` configurations may return 404 for new accounts; update that environment variable and restart/redeploy. Gemini 3 models use thinking levels rather than the legacy Gemini 2.5 thinking budget. No paid fallback is configured. Keep the project on the free tier if you require zero inference spend; actual quotas are account-specific and shown in AI Studio. Missing credentials disable assistant requests with a clear message without blocking chat.

The server verifies the session, request origin, and conversation membership before loading the latest 30 messages. Only bounded message text/captions are included: no attachments, file URLs, other conversations, or profile emails. Context is capped at 12,000 characters; prompts at 2,000 characters, assistant history at six turns, and answers at 512 tokens. The panel clears on conversation changes and informs users that relevant text goes to Gemini.

An initial structured scope classifier allows only summaries, replies, rewriting, explanations, and translations for the active conversation. Uncertain, malformed, mixed-scope, and unrelated requests are refused before answer generation. Server-controlled instructions treat all message content and supplied history as untrusted data; clients cannot supply system roles. These controls are behavioral safeguards, not model fine-tuning or a guarantee of perfect model compliance. The assistant has no tools, browser access, or message-sending ability.

Classification and generation share a 30-second cancellation signal. Each assistant request uses up to two Gemini calls. A transactional, server-only `aiRateLimits/{uid}` document limits each user to five requests per fixed minute across application instances; existing default-deny Firestore rules prevent client access. Quota and provider failures return safe, actionable errors without exposing provider details. Automated tests mock Gemini; live smoke verification requires a configured key.

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

Firebase Admin's `jwks-rsa` dependency synchronously requires `jose`. A scoped `jwks-rsa -> jose@5.10.0` override preserves CommonJS compatibility on serverless runtimes where synchronous `require(ESM)` is unavailable. Other packages can retain their own `jose` versions. Commit both `package.json` and `package-lock.json`, then redeploy when changing this override. The runtime regression test loads Firebase Admin with `--no-experimental-require-module` and imports/verifies a generated RSA signing key through JWKS. Revisit the override when upstream ships a compatible loader.

## Verification record (2026-10-21)

- Production build, TypeScript, and ESLint passed.
- Five unit tests and eight Firestore emulator regression tests passed.
- Browser suite passed signup, messaging, refresh, unread state, logout/login, failed-send recovery, upload-error feedback, 100+ message pagination, mobile navigation, drawer dismissal, and outsider access errors.
- Real Cloudinary PNG upload, caption, preview, and authenticated download passed; the temporary asset was deleted.
- Firebase and Cloudinary credentials passed read-only checks.
- `npm audit --omit=dev`: zero reported vulnerabilities. Seven high-severity advisories remain in development-tool dependency chains involving `braces`; no upstream compatible fix was available.
- Live Firebase rules/index publication and hosting deployment were not performed.

## UI and Gemini update (2026-10-22)

- Production build, TypeScript, ESLint, and 13 unit/API tests passed.
- Browser regression passed auth layouts at 360px/390px/desktop, password visibility, real two-user typing, messaging, history pagination, failed-send recovery, Gemini response/draft insertion with a mocked API, touch swipes, drawer dismissal, reduced viewport height, and unauthorized access.
- Nine Firestore emulator tests cover the existing access rules plus denial of client reads/writes to assistant quota documents.
- Production dependency audit reports zero vulnerabilities, including optional dependencies.
- Firebase/Cloudinary read-only service checks passed. A Gemini key is not configured locally; live model behavior still requires a smoke test with a key. No live rules or hosting deployment was performed.

### Gemini model compatibility fix

After a key was added, live testing found `gemini-2.5-flash` returned 404 for this account and the newer full Flash model intermittently returned 503 overload. The configured default is now `gemini-3.5-flash-lite`, with the supported Gemini 3 thinking-level configuration. Live synthetic tests passed both an allowed conversation summary and refusal of an unrelated coding request. Model availability, credentials, invalid configuration, and overload now produce distinct safe errors. Update the hosting environment's `GEMINI_MODEL` and redeploy when applying this fix.

### File-send compatibility fix

The inspected live legacy Firestore rules reject the optional `caption` field. File-only messages now omit empty captions instead of always sending `caption: ""`. Upload errors preserve the server's actionable error, and attachment permission failures explain that file-sharing rules need updating while retaining the selected file and draft.

A minimal caption-only migration was prepared from the live release and validated against that exact rules source in the isolated emulator: file-only and captioned messages succeed, while invalid/oversized captions, outsiders, sender spoofing, and edits fail. The original release and candidate source are saved under ignored `test-results/` for review and rollback. Publication requires explicit authorization; the live rules were not changed. The checked-in full `firestore.rules` already supports captions but represents a broader hardening release and should be coordinated with deployed clients rather than substituted for this minimal compatibility fix.
