# Agent Bot Studio — Free Safari Edition

**A free, original Safari-first AI agent workspace** for iPhone, iPad and desktop browsers. Inspired by the chat roster and explicit approval patterns of OpenMausBot, but not a port of its full runtime or a copy of its branded assets. Independent from Office HQ.

## Try it

This directory is a static web app. Serve it locally:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080` on the computer. For iPhone/iPad, host the directory on HTTPS (for example, GitHub Pages). Once available in Safari, tap **Share → Add to Home Screen**.

### Functional free local mode

- One preconfigured Marketing Manager named Mira; create, select, duplicate, rename or delete more employees.
- Separate saved chats, briefs, role instructions, task lists, activity history and manual routines per employee.
- Create and edit marketing assignments; prepare clearly marked local starter drafts **without AI**.
- Submit drafts for approval; approve or reject. Approval **never** posts content.
- Browser storage, offline frontend caching and JSON export/import backups.
- Responsive iPhone/iPad/desktop interface. No App Store needed and **no Agent Bot Studio subscription**.

### Optional live AI

Connect to the existing `server/` companion in the main repository using the Connections screen. Enter your HTTPS backend URL and a server access token. **Never enter the xAI key in Safari.** The backend stores the xAI key privately and requires its own `APP_ACCESS_TOKEN`. You may incur xAI model usage and hosting costs.

The companion API contract is `POST /api/respond` (Bearer token; payload has messages/brandBrief or task/brandBrief) and `GET /health`. The backend must allow the GitHub Pages origin via the `ALLOWED_ORIGIN` server setting, serve HTTPS, and be protected against abuse.

### Important boundaries

- **Not** the complete OpenMausBot runtime. No computer use, autonomous background agent execution, or connected social accounts in this release.
- **No** automatic publishing, sending, spending or scheduled execution.
- Approving a draft simply saves a decision.
- Static GitHub Pages cannot securely hold secret model keys or run 24/7 agents.
- Different devices have independent local data; use JSON export/import for manual transfer. Safari clearing site data also clears local history.
- Do not host an AI backend publicly without authentication, rate limiting, HTTPS and origin validation.

## GitHub Pages

Publish this folder at the repository root as `/` and enable **Settings → Pages → Deploy from a branch → main / (root)**. A GitHub Pages site for `Hostkris/Agent-bot-studio` would normally use `https://hostkris.github.io/Agent-bot-studio/`, but **do not treat that URL as live until deployment succeeds**. The application's relative asset URLs are compatible with that base path.

## Legal

Our new web app is authored independently and released under the MIT license in this folder. The upstream [OpenMausBot](https://github.com/milind-soni/OpenMausBot) open-source edition is separately under Apache 2.0 and includes additional third-party licenses and a separately licensed `enterprise/` directory. The OpenMausBot name and mascot are trademarks of their owner and are not reused here.