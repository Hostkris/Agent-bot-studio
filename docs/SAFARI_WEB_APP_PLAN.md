# Safari-first OpenMausBot plan — Agent Bot Studio

Updated October 19, 2026. This document is a project plan, **not proof of a deployed website**.

## The important discovery

The upstream OpenMausBot project **already includes a server-hosted, browser-accessible UI for Safari on iPhone and iPad** and a Home Screen web-app installation guide. The desktop Electron wrapper is *not* a prerequisite for using the browser interface.

Official upstream documentation:
- [OpenMausBot source](https://github.com/milind-soni/OpenMausBot)
- [Phone web app (Safari)](https://github.com/milind-soni/OpenMausBot/blob/main/docs/phone-web-app.md)
- [Self hosting / remote access](https://github.com/milind-soni/OpenMausBot/blob/main/docs/self-hosting.md)
- [VPS deployment](https://github.com/milind-soni/OpenMausBot/blob/main/docs/deploy-vps.md)
- [Terminal onboarding](https://github.com/milind-soni/OpenMausBot/blob/main/docs/cli-onboarding.md)
- [Licensing and trademarks](https://github.com/milind-soni/OpenMausBot/blob/main/LICENSING.md)

## Intended product

Agent Bot Studio remains **separate from Office HQ**. We will first validate one Marketing Agent and later add specialized agents. The target is **responsive web/PWA in Safari**, not an App Store package. Existing React/Expo native source in `mobile/` remains a prototype, not the target client.

### Full feature architecture

```
Safari on iPhone / iPad (HTTPS, paired)
          |
          v
Responsive React web interface (or reused/adapted OpenMausBot OSS UI)
          |
          v
Authenticated OpenMausBot harness (always-on Mac, Linux VPS, or home server)
          |                |                  |
  Agent CLI engines      Bot memory       Permission broker
 (Codex/Claude/Grok)    and schedules      (approve / deny)
          |
          v
  Isolated bot tools / browser / approved connected apps
```

For a **faithful adaptation of the complete program**, use the upstream OSS project as the foundation instead of attempting to move Electron/Node processes into Safari. The web UI is the client; agent engines and tools run on a server. A static site such as GitHub Pages is **not sufficient** to host the complete agent runtime.

## Quick functional proof without a new App Store application

On a Mac or Linux computer with Node.js 24+, use an unprivileged account:

```sh
npx openmausbot
```

Choose a supported agent engine and sign in when prompted. To enable Safari access, choose the supported HTTPS / phone access option and follow the pairing instructions. The upstream documentation also supports these commands for a server already configured:

```sh
npx openmausbot login
npx openmausbot serve --tunnel
npx openmausbot pair --label "My iPad"
```

Use the printed **HTTPS pairing URL** in iPhone/iPad Safari. Choose **Connect**, then Safari Share → **Add to Home Screen**. The server must remain online. The phone cannot reach a server's `127.0.0.1` / `localhost` address.

For around-the-clock availability without leaving a Mac running, follow the official [Linux VPS instructions](https://github.com/milind-soni/OpenMausBot/blob/main/docs/deploy-vps.md). Use the project's authenticated tunnel, Tailscale, or properly configured HTTPS reverse proxy. **Never publicly expose the loopback agent/control port.**

## Marketing Agent acceptance test

1. From iPhone Safari, pair to the test workspace.
2. Create **one Marketing Agent** with brand brief, scope, and reporting expectations.
3. Confirm typed messages reach the **real server-side agent engine**, not a local demo.
4. Have the agent produce a product marketing brief and seven draft captions.
5. Require explicit user approval before publishing, messaging, changing settings, or spending.
6. Confirm every performed operation is logged and distinguish drafts from actions actually executed.
7. Reopen from iPad and verify the same saved work and appropriate device pairing.
8. Test small iPhone portrait, landscape, and large iPad layouts, keyboard/safe-area behavior, and session expiry.

## Permissions and model access

- Signed-in application access does not mean blanket authority for every agent. Enforce per-tool and per-platform permissions on the server.
- Do not put API keys, provider OAuth secrets, or service credentials in browser JavaScript, GitHub, or the static frontend.
- Per upstream docs, the project's simple API-key mode currently supports chat but not the full agent-tool/computer-use stack. For full autonomous behaviors, provision supported CLI agents on the always-on host.
- Safari/Home Screen mode does not supply native iPhone computer control, offline agent execution, or push notifications.

## Open-source legal boundary

OpenMausBot's OSS source is licensed under **Apache 2.0**. Its `enterprise/` directory has separate restrictions; do **not** assume production hosting/white-label rights for that directory. Preserve licenses and required notices for reused source and dependencies. The OpenMausBot name/mascot are trademarks, so the new product uses its **own Agent Bot Studio branding**.

## Deployment / publication status

- This repository currently contains our original Marketing Agent prototype and this Safari plan.
- **A production Safari URL is not yet deployed.**
- **The upstream OpenMausBot codebase has not been forked or copied into this repository.**
- A real server and HTTPS pairing flow are required before claiming the full engine works from Safari.
