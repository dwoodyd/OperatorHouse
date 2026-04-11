# Operator House — Capacitor / Expo Readiness Report

**Date:** April 2026  
**Stack:** React 19 + tRPC + Express (Manus Auth)  
**Wrapper target:** Capacitor v6 (preferred) or Expo with bare workflow

---

## Executive Summary

The codebase is **largely Capacitor-compatible** with no showstopper issues. The six areas below require targeted changes before wrapping. Most are one-line swaps. The biggest structural consideration is the OAuth redirect flow, which requires a custom URL scheme in Capacitor.

---

## 1. Browser-Specific API Calls — Full Inventory

### 1.1 `sessionStorage` — Splash screen flag

| File | Line | Usage |
|---|---|---|
| `client/src/App.tsx` | 46, 50 | `sessionStorage.getItem/setItem("oh_splash_shown")` |

**Problem:** `sessionStorage` is cleared when the WebView is backgrounded on iOS. The splash will replay on every app resume.

**Capacitor-friendly fix:**
```ts
// Replace sessionStorage with Capacitor Preferences plugin
import { Preferences } from "@capacitor/preferences";

// Write
await Preferences.set({ key: "oh_splash_shown", value: "true" });

// Read
const { value } = await Preferences.get({ key: "oh_splash_shown" });
const shown = value === "true";
```

**Web fallback:** Keep `sessionStorage` as fallback when `Capacitor.isNativePlatform()` returns false.

---

### 1.2 `localStorage` — Auth redirect path + sidebar width + theme

| File | Line | Usage |
|---|---|---|
| `client/src/_core/hooks/useAuth.ts` | 45 | `localStorage.setItem("oh_redirect_path", ...)` |
| `client/src/components/DashboardLayout.tsx` | 46, 52 | `localStorage.getItem/setItem("oh_sidebar_width")` |
| `client/src/contexts/ThemeContext.tsx` | 26, 41 | `localStorage.getItem/setItem("theme")` |

**Problem:** `localStorage` works in Capacitor WebView but is not encrypted and may be cleared by the OS on low-memory conditions on Android.

**Capacitor-friendly fix:** Same `@capacitor/preferences` swap as above for auth redirect and theme. Sidebar width is non-critical — `localStorage` is acceptable here.

---

### 1.3 `window.location.href` — Auth redirects

| File | Line | Usage |
|---|---|---|
| `client/src/_core/hooks/useAuth.ts` | 70 | `window.location.href = redirectPath` |
| `client/src/components/DashboardLayout.tsx` | 73 | `window.location.href = getLoginUrl()` |
| `client/src/main.tsx` | 21 | `window.location.href = getLoginUrl()` |

**Problem:** OAuth redirects open an external browser URL. In Capacitor, this navigates the WebView away from the app, breaking the session.

**Capacitor-friendly fix:**
```ts
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

const openAuth = async (url: string) => {
  if (Capacitor.isNativePlatform()) {
    // Opens in in-app browser; register custom scheme for callback
    await Browser.open({ url, windowName: "_self" });
  } else {
    window.location.href = url;
  }
};
```

**Required:** Register a custom URL scheme (e.g., `operatorhouse://`) in `capacitor.config.ts` and update the OAuth callback URL in Manus OAuth settings to accept `operatorhouse://api/oauth/callback`.

---

### 1.4 `window.location.origin` — OAuth redirect URI construction

| File | Line | Usage |
|---|---|---|
| `client/src/const.ts` | 7 | `window.location.origin` in `getLoginUrl()` |

**Problem:** In a Capacitor app, `window.location.origin` is `capacitor://localhost` or `http://localhost`, not a real domain. The OAuth server will reject this as an invalid redirect URI.

**Capacitor-friendly fix:**
```ts
// client/src/const.ts
import { Capacitor } from "@capacitor/core";

const getOrigin = () =>
  Capacitor.isNativePlatform()
    ? "operatorhouse://localhost"  // registered custom scheme
    : window.location.origin;

export const getLoginUrl = (returnPath = "/dashboard") => {
  const origin = getOrigin();
  // ... rest of URL construction
};
```

---

### 1.5 `navigator.clipboard.writeText` — Copy to clipboard

| File | Line | Usage |
|---|---|---|
| `client/src/components/CommandLine.tsx` | 102 | Copy AI response |
| `client/src/pages/StrategyGen.tsx` | 83 | Copy strategy content |

**Problem:** `navigator.clipboard` requires HTTPS and user gesture in browsers. In Capacitor WebView it works on iOS 14.5+ and Android API 33+, but silently fails on older versions.

**Capacitor-friendly fix:**
```ts
import { Clipboard } from "@capacitor/clipboard";
import { Capacitor } from "@capacitor/core";

const copyToClipboard = async (text: string) => {
  if (Capacitor.isNativePlatform()) {
    await Clipboard.write({ string: text });
  } else {
    await navigator.clipboard.writeText(text);
  }
};
```

---

### 1.6 `document.createElement("a")` + `URL.createObjectURL` — File download

| File | Line | Usage |
|---|---|---|
| `client/src/pages/StrategyGen.tsx` | 91–97 | Download strategy as `.md` file |

**Problem:** `createObjectURL` + anchor click download does not work in Capacitor WebView on iOS (no file system access via browser download).

**Capacitor-friendly fix:**
```ts
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";

const downloadStrategy = async (content: string, filename: string) => {
  if (Capacitor.isNativePlatform()) {
    // Write to Documents directory, then trigger native share sheet
    await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Documents,
      encoding: "utf8",
    });
    await Share.share({
      title: filename,
      url: `file://${(await Filesystem.getUri({ path: filename, directory: Directory.Documents })).uri}`,
    });
  } else {
    // Existing browser download logic
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};
```

---

### 1.7 `window.matchMedia` / `window.innerWidth` — Responsive breakpoints

| File | Line | Usage |
|---|---|---|
| `client/src/hooks/useMobile.tsx` | 11–16 | Mobile breakpoint detection |
| `client/src/components/AppLayout.tsx` | 47 | Resize listener |

**Status:** These work fine in Capacitor WebView. No change required. The WebView respects CSS media queries and `window.innerWidth` correctly.

---

### 1.8 `document` event listeners — DashboardLayout drag resize

| File | Line | Usage |
|---|---|---|
| `client/src/components/DashboardLayout.tsx` | 140–150 | Mouse drag to resize sidebar |

**Status:** Works in Capacitor WebView. On mobile, this feature is irrelevant (sidebar is full-width overlay). No change required — the touch events on mobile will simply not trigger the drag handler.

---

### 1.9 Google Maps — `window.google.maps`

| File | Line | Usage |
|---|---|---|
| `client/src/components/Map.tsx` | 134 | `new window.google.maps.Map(...)` |

**Status:** Google Maps JavaScript SDK loads via a `<script>` tag injected into `document.head`. This works in Capacitor WebView. No change required for basic map display. If offline map tiles are needed, consider `@capacitor-community/capacitor-googlemaps-native` for native map rendering.

---

## 2. Capacitor Plugin Requirements

Install these plugins before wrapping:

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/preferences @capacitor/browser @capacitor/clipboard
npm install @capacitor/filesystem @capacitor/share
npx cap init "Operator House" "com.operatorhouse.app" --web-dir dist
npx cap add ios
npx cap add android
```

---

## 3. `capacitor.config.ts` Template

```ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.operatorhouse.app",
  appName: "Operator House",
  webDir: "dist",
  server: {
    // For development: point to your local dev server
    // Remove for production builds
    // url: "http://192.168.1.x:3000",
    // cleartext: true,
  },
  plugins: {
    Browser: {
      presentationStyle: "popover",
    },
  },
};

export default config;
```

---

## 4. Build Pipeline for Capacitor

```bash
# 1. Build the web app
pnpm build

# 2. Sync to native projects
npx cap sync

# 3. Open in Xcode / Android Studio
npx cap open ios
npx cap open android
```

---

## 5. Priority Order for Implementation

| Priority | Change | Effort |
|---|---|---|
| P0 | OAuth redirect via `@capacitor/browser` + custom URL scheme | Medium |
| P0 | `window.location.origin` → custom scheme in `getLoginUrl()` | Low |
| P1 | `sessionStorage` → `@capacitor/preferences` for splash flag | Low |
| P1 | `navigator.clipboard` → `@capacitor/clipboard` | Low |
| P1 | File download → `@capacitor/filesystem` + `@capacitor/share` | Medium |
| P2 | `localStorage` → `@capacitor/preferences` for auth + theme | Low |
| P3 | Native map tiles (optional) | High |

---

## 6. Expo Bare Workflow Note

If Expo is preferred over Capacitor, the same APIs apply via `expo-file-system`, `expo-clipboard`, `expo-web-browser`, and `expo-secure-store`. The OAuth flow uses `expo-auth-session` with `makeRedirectUri({ scheme: "operatorhouse" })`. The overall effort is equivalent.
