# Agent Bot Studio — Free Safari Edition

**NEW: Browser version for iPhone and iPad — no App Store required.** Open [index.html](./index.html) or enable GitHub Pages at **Settings → Pages → Deploy from a branch → main / (root)**. After Pages is enabled, the expected site address is `https://hostkris.github.io/Agent-bot-studio/` (verify the deployment before calling it live).

The free local mode includes a bot roster, Marketing Manager, personal agent profiles, chat records, assignments, local content drafts, approvals, manual routines, backups, and offline frontend caching. An optional self-hosted backend can provide real Grok responses; provider or server costs are separate. Nothing automatically posts or sends messages. [Full free edition instructions](docs/FREE_SAFARI_EDITION.md).

---

## Previous iOS prototype and server

# Agent Bot Studio — iOS Marketing Agent (Milestone 01)

An **independent, original iPhone app** inspired by the *interaction patterns* of [OpenMausBot](https://github.com/milind-soni/OpenMausBot) and the marketing-first workflow of [Grok's Distro Bot](https://x.ai/bot/marketplace/bots/distro-bot). It is **not** their source code, brand, assets, services, or an official xAI Grok Bot client. No private/proprietary code was copied.

## What Milestone 01 does

- One editable marketing AI employee (default name: Mira), chat-first dark iOS interface.
- Chat with Grok through **your own xAI API key on a separate backend**, with optional live web search and source links.
- Create marketing assignments, select channels, and generate AI drafts (when the backend is connected).
- Make **local starter drafts** without a backend; these are templates, not falsely presented as AI research.
- Store business notes, tasks, conversation, decisions, and a short audit trail on the iPhone.
- Review and approve/reject **drafts**, with explicit warnings that approval DOES NOT publish, send, or spend.
- Access token stored via iOS SecureStore. xAI API key never shipped in the mobile code.
- Native iOS app project using React Native / Expo SDK 57 (compatible with currently available Expo Go; SDK 58 Expo Go rollout is pending at the time of creation).

## Not implemented yet

No OAuth connections or actual access to Instagram, TikTok, Facebook, X, Shopify or Gmail; no publishing, ad buying, inbox actions, scheduling, autonomous background execution, voice, browser/computer use, cloud sync, or multiple bots. This is a **real but narrow first milestone**, not a clone of all Grok Bot capabilities.

## Preview without building

Open `preview.html` in a browser to try the marketing task and approval flow. It is a **local interactive interface preview**, not a connected AI agent.

## Folder structure

```
preview.html    Clickable browser preview without real AI
mobile/        Expo iOS app: chat, tasks, draft review, business profile, settings
server/        Small no-dependency Node.js server: bearer auth + xAI Responses API
server/test/   Backend tests, including a fake xAI response
```

## Quick start

### 1 — Backend (Mac, Node.js 22+)

```bash
cd server
cp .env.example .env
# Edit .env: XAI_API_KEY and a long random APP_ACCESS_TOKEN
node --env-file=.env src/server.js
npm test
```

`XAI_API_KEY` is an **xAI API credential** from [console.x.ai](https://console.x.ai/), billed separately from any Grok Bot subscription. A Grok/ChatGPT subscription is not automatically an API key.

To create a random token on your Mac:

```bash
openssl rand -hex 32
```

The backend listens on port `8787`. The health-check endpoint is `GET /health`. All AI requests are `POST /api/respond` with the `Authorization: Bearer <APP_ACCESS_TOKEN>` header. The server allows no actual external actions, only answers and drafts.

**Security:** For a real iPhone on a different network, host behind HTTPS and authentication. Do not place an xAI key inside any Expo `EXPO_PUBLIC_` variable or directly in the app. The access token is a single-user prototype measure, not a production multi-user authentication system. The server's `HOST=0.0.0.0` is for LAN testing; don't expose that port directly to the public internet.

### 2 — Native iPhone app (Mac + Expo)

The native app uses Expo SDK 57 because the current Expo Go app may not yet support SDK 58. Expo account login is required for Expo Go.

```bash
cd mobile
npm install
npx expo install --fix
npx expo start
```

On your iPhone, install **Expo Go** and scan the QR code. A Mac and iPhone on the same Wi-Fi are easiest. In **Settings** in the app, enter the running server URL and the `APP_ACCESS_TOKEN`, then tap **Save connection** and **Test server**.

- Local network example: `http://192.168.1.25:8787`, using your Mac's **actual** Wi-Fi IP, not `localhost`. iOS and your network may block plain HTTP; use an HTTPS tunnel to avoid restrictions. Never reuse the example IP blindly.
- Remote test: use your own HTTPS reverse proxy/tunnel. Treat URLs and bearer tokens as secrets.
- Without a server, use **Tasks → Start with a template → Create local starter draft** to test the full UI without pretending to run AI.

### 3 — Test a marketing assignment

1. Go to **Profile** and enter a business name and brand brief.
2. Go to **Tasks** and select the **7-day content calendar** template.
3. Tap the task, then **Run Grok marketing agent** if connected, or **Create local starter draft** if offline.
4. Read the resulting draft and tap **Request my approval**.
5. Open **Approvals** and choose **Approve draft** or **Reject**.
6. Go to **Chat** to ask follow-up questions when the backend is connected.

**Approval is only a recorded decision.** Nothing is actually posted or sent in this version.

## iOS App Store route (later)

To create a distributable iOS build rather than running it in Expo Go, use EAS Build after configuring your unique iOS bundle identifier, Apple Developer account, App Store Connect information, icons, privacy disclosures, and a production HTTPS backend. The included `eas.json` is only a starting point. It is **not an IPA** or an App Store approved submission. Do not publish without properly securing user login and completing production testing.

```bash
cd mobile
npx eas-cli login
npx eas-cli build --platform ios --profile preview
```

## Implementation notes

- Backend uses native Node `http` and `fetch`, no external packages.
- xAI Responses API: `POST https://api.x.ai/v1/responses` with `model`, `input` messages, and optionally `tools: [{"type":"web_search"}]`.
- The backend supplies the employee's boundaries as system instructions, enforces input limits, and contains no endpoints capable of publishing or spending.
- App state uses AsyncStorage (local, **not encrypted**). Do not put highly sensitive business information in its notes. The backend access token is held separately in Expo SecureStore.
- No central database yet, so uninstalling the application or changing phones can lose the local history. No automatic background operation is provided.
- Reference sources: https://docs.x.ai/developers/rest-api-reference/inference/responses and https://docs.x.ai/developers/tools/web-search

## Tests & verification

Run `cd server && npm test` to run the local mocked backend suite. The iOS JSX was syntax-parsed separately. Actual Expo runtime and a real xAI request were **not tested in this environment**, because npm packages and API credentials are unavailable here. Before distribution, install packages, run Expo Doctor, test on the iPhone, and validate an authenticated live Grok request.

## Next development milestones

- Phase 02: per-platform OAuth permission requests and permission-gated *read-only* insights.
- Phase 03: reviewed publishing through an official platform API with idempotency, audit records, and revocation.
- Phase 04: cloud-backed tasks, scheduling, isolated bot sessions and multiple employees.

## GitHub upload

Create a new repo named `agent-bot-studio` (or your own name), upload all **contents** of this folder with `mobile/`, `server/`, `README.md` at the root, and commit. Do not upload `server/.env`; only `.env.example` should be in Git. This package does not modify Office HQ.

## License and provenance

All new project code in this archive was authored independently for the prototype, with a similar high-level agent-chat/approval pattern. OpenMausBot source is NOT redistributed. See `docs/REFERENCES.md`. Names and marks of Grok, xAI, OpenMausBot, and third parties belong to their respective owners.