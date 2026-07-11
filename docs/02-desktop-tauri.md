# Phase 10 — Desktop app (Tauri v2)

**Goal:** Ship the same web UI as a native desktop app (macOS, Windows, Linux) with a small binary, secure defaults, auto-update, and deep-link auth. The web build is the product; Tauri is a thin, hardened shell.

**Prerequisites:** finish Phases 0–9 first. Install Rust stable and the Tauri v2 system prerequisites per OS:
- **macOS:** Xcode Command Line Tools.
- **Windows:** Microsoft C++ Build Tools + WebView2 runtime (bundled on Win 11).
- **Linux:** `webkit2gtk-4.1`, `libayatana-appindicator3`, `librsvg2`, `build-essential`, etc.

---

## 10.1 Loading strategy — remote vs bundled

Two supported modes. **Recommended for v1: remote** (the desktop app points at your deployed web app).

| Mode | How | Use when |
|---|---|---|
| **Remote (recommended)** | `app.windows[].url` = `https://app.wedevs.cloud`; Tauri ships only the shell | Fastest to ship; web and desktop always in lockstep; no separate build to deploy |
| **Bundled** | `next build && next export`-style static output loaded from disk | Offline-first / air-gapped; more build work; SSR features must be reworked |

The rest of this doc assumes **remote**. (For bundled, add a static-export target to `apps/web` and set `frontendDist` to that folder.)

---

## 10.2 Scaffold

1. In `apps/desktop`, initialize Tauri v2: `pnpm create tauri-app@latest` (or `pnpm dlx @tauri-apps/cli@latest init`) targeting the existing repo. Add `@tauri-apps/api` and `@tauri-apps/cli` as dev deps at the workspace root.
2. Point the window at the deployed web app in `apps/desktop/src-tauri/tauri.conf.json`:

```json
{
  "productName": "Wedevs",
  "identifier": "cloud.wedevs.app",
  "version": "1.0.0",
  "app": {
    "windows": [{
      "title": "Wedevs",
      "url": "https://app.wedevs.cloud",
      "width": 1280, "height": 820, "minWidth": 900, "minHeight": 600,
      "decorations": true, "titleBarStyle": "Overlay"
    }],
    "security": {
      "csp": "default-src 'self' https://app.wedevs.cloud https://*.supabase.co; connect-src 'self' https://app.wedevs.cloud https://*.supabase.co wss://*.supabase.co; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'",
      "capabilities": ["default"]
    }
  },
  "bundle": {
    "active": true,
    "targets": ["dmg", "app", "nsis", "appimage", "deb"],
    "icon": ["icons/32x32.png","icons/128x128.png","icons/icon.icns","icons/icon.ico"]
  }
}
```

3. **Capabilities (Tauri v2 permission model):** create `src-tauri/capabilities/default.json` allowing only the plugins you use (updater, deep-link, notification, os, window). Do **not** enable the shell, fs, or http plugins unless a feature needs them — least privilege.

---

## 10.3 Deep-link auth

The web app authenticates via Supabase; the desktop shell must complete OAuth without an embedded insecure browser.

1. Add the **deep-link** plugin and register the scheme `wedevs://` in `tauri.conf.json` (`plugins.deep-link.schemes`).
2. In the Supabase Auth settings and each OAuth provider, add `wedevs://auth/callback` as an allowed redirect (done in Phase 2).
3. Flow: the app opens the system browser to the Supabase OAuth URL with `redirect_to=wedevs://auth/callback` → provider → Supabase redirects to `wedevs://auth/callback#access_token=…` → the OS hands the URL to the running app → a Rust deep-link handler forwards it to the web view, which calls `supabase.auth.setSession()` and lands in `/app`.
4. Handle the "app not yet running" case (cold-start deep link) by reading the launch URL on startup.

---

## 10.4 Native niceties (v1 scope)

- **Auto-update** (see 10.5).
- **Native notifications** via the `notification` plugin (e.g., "Pull request opened").
- **Window state** persistence (size/position) via the `window-state` plugin.
- **Tray icon** (optional): quick "New chat" and "Open Wedevs".
- **Single instance:** the single-instance plugin so a second launch focuses the existing window (and delivers the deep link to it).
- **Menu:** standard app menu (About, Settings → deep-links into `/app/settings`, Quit).

Keep native surface minimal for v1 — the value is a fast, real window around the web app, not deep OS integration.

---

## 10.5 Auto-update

1. Add the **updater** plugin. Generate a signing keypair with the Tauri CLI (`tauri signer generate`); keep the **private** key in CI secrets, put the **public** key in `tauri.conf.json` (`plugins.updater.pubkey`).
2. Host the update manifest + artifacts on **GitHub Releases** (matches the deploy CI in `03-deployment.md`). Set `plugins.updater.endpoints` to the `latest.json` URL for your repo/releases.
3. On launch (and on an interval), check for updates; if one exists, download, verify the signature, and prompt the user to restart. Show the version in the About dialog.
4. Every release: the CI build matrix (below) produces signed artifacts + `latest.json`; publishing the GitHub Release makes the update live.

---

## 10.6 Build & sign (per OS)

Build with `pnpm tauri build`. Signing/notarization is required for distribution:

- **macOS:** sign with an Apple Developer ID cert and **notarize** (`xcrun notarytool`), then staple. Provide the cert (base64) + Apple ID app-specific password + Team ID as CI secrets.
- **Windows:** sign the NSIS installer with a code-signing certificate (EV recommended to avoid SmartScreen warnings). Provide the cert + password as CI secrets.
- **Linux:** AppImage + `.deb`; GPG-sign the AppImage if you distribute outside a store.

**CI matrix** (`.github/workflows/desktop.yml`, triggered on version tags):

```yaml
name: desktop
on: { push: { tags: ['v*'] } }
jobs:
  build:
    strategy:
      matrix:
        include:
          - { os: macos-latest,  target: 'universal-apple-darwin' }
          - { os: windows-latest, target: '' }
          - { os: ubuntu-latest,  target: '' }
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - uses: dtolnay/rust-toolchain@stable
      - run: pnpm install --frozen-lockfile
      - uses: tauri-apps/tauri-action@v0
        env:
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_KEY_PASSWORD }}
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_APP_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          WINDOWS_CERTIFICATE: ${{ secrets.WINDOWS_CERTIFICATE }}
          WINDOWS_CERTIFICATE_PASSWORD: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
        with:
          projectPath: apps/desktop
          tagName: ${{ github.ref_name }}
          releaseName: 'Wedevs ${{ github.ref_name }}'
          releaseDraft: true
          includeUpdaterJson: true
```

---

## 10.7 Acceptance criteria (Phase 10)

- The desktop app launches, shows the Wedevs UI (remote), and matches the web app.
- OAuth sign-in completes via `wedevs://auth/callback` and lands in `/app`.
- A second launch focuses the existing window (single instance).
- Native notification fires on a real event (e.g., PR opened).
- Auto-update: bumping the version, building, and publishing a GitHub Release causes an installed older build to detect, verify, and install the update.
- Signed/notarized artifacts install without OS security warnings on macOS and Windows.

Continue to **[03-deployment.md](03-deployment.md)**.
