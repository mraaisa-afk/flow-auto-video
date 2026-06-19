# 🎬 Flow Auto Video

A professional **Manifest V3** Chrome extension for AI **image & video generation** through a local G-Labs–compatible webhook backend (`http://127.0.0.1:8765`).

Built to surpass the reference *G-Labs Automation* extension with smart account rotation, a pro generation workflow, proactive error handling, and premium UI.

> **Status:** 🚧 `Push 0` — project scaffold & configuration only. Not yet functional. Phase 1 (auth + foundation) lands next.

---

## Tech Stack

| Layer | Choice |
| --- | --- |
| UI | Preact + Tailwind CSS + Lucide icons |
| State | Nano Stores |
| Build | Vite + `@crxjs/vite-plugin` (MV3) |
| Target | Chrome **114+** (popup + side panel) |

## Project Structure

```
flow-auto-video/
├── src/
│   ├── manifest.json        # MV3 manifest (pinned key, permissions, entries)
│   ├── background/
│   │   └── service-worker.js # Ephemeral SW — uses chrome.alarms, never setInterval
│   ├── popup/                # Toolbar popup (Preact)
│   ├── sidepanel/            # Full workspace side panel (Chrome 114+)
│   ├── lib/
│   │   └── constants.js      # Webhook endpoints, storage keys, alarm names
│   └── styles/
│       └── tailwind.css
├── docs/
│   └── EXTENSION_KEY.md      # How to pin a stable extension ID (OAuth)
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Getting Started

```bash
npm install
npm run dev     # HMR dev build (Vite)
npm run build   # production build → dist/
```

Then load the built extension:
`chrome://extensions` → enable **Developer mode** → **Load unpacked** → select `dist/`.

## ⚠️ Before You Load It: Pin the Extension Key

Unpacked extensions get a **new ID on every reinstall**, and Google OAuth is bound to that ID — so auth silently breaks. We pin a `key` in `manifest.json` to keep a **stable ID from day 1**. See [`docs/EXTENSION_KEY.md`](docs/EXTENSION_KEY.md) for the exact commands.

## Roadmap

- [x] **Push 0** — Scaffold & config
- [ ] **Phase 1** — Foundation: OAuth, encrypted storage, tabbed nav, health heartbeat
- [ ] **Phase 2** — Core generation: image/video/Grok forms, submit→poll→download
- [ ] **Phase 3** — Account intelligence: health scoring, auto-rotation, quota dashboard
- [ ] **Phase 4** — Power features: history, templates, batch, notifications, retry
- [ ] **Phase 5** — Dev tools & premium polish

## License

MIT — see [LICENSE](LICENSE).
