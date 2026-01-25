# Change: Add Android Support via Capacitor

## Why

Sanctuary is a couples app with mobile-first design (430px max width) that currently only runs as a web application. To reach a broader audience and provide a native app experience on Android, we need to package the existing React web app as a native Android application. Using Capacitor allows us to reuse 100% of the existing web codebase while adding native capabilities.

## What Changes

- Add Capacitor framework to the project for cross-platform support
- Configure Android project with proper build settings
- Create platform abstraction layer for APIs that differ between web and native
- Implement native plugins for:
  - **Microphone/Audio recording** (VoiceRecorder component)
  - **Clipboard** (invite code copying in CreateSpace)
  - **Geolocation** (MemoryMap, NewMemory location features)
  - **Local storage** (already using localStorage, needs native equivalent)
  - **Push notifications** (currently web-based)
  - **Camera/Photo picker** (memory creation)
  - **File system access** (for media handling)
- Add Android-specific assets (icons, splash screens) using existing web resources
- Configure deep linking for invite flow
- **CRITICAL**: No changes to existing web functionality - web app must continue working exactly as before

## Impact

- Affected specs: None currently exist; creating new `android-platform` capability spec
- Affected code:
  - `client/package.json` - new Capacitor dependencies
  - `client/capacitor.config.ts` - new file for Capacitor configuration
  - `client/android/` - new directory for native Android project
  - `client/src/shared/utils/platform.ts` - new platform detection utility
  - `client/src/shared/hooks/useNativeFeatures.ts` - abstraction for native APIs
  - Individual components that use web APIs (VoiceRecorder, CreateSpace, MemoryMap, etc.)
- Resources reused from web:
  - `public/images/` - all images (sanctuary-hero.png, record-type-bg.avif, etc.)
  - `public/fonts/` - all font files (Plus Jakarta Sans, Playfair Display, Noto fonts)
  - `public/favicon.svg`, `public/icon.svg` - app icons (will be converted to Android formats)
  - `src/index.css` - all Tailwind theme configuration and styles

## Constraints

1. **Zero Web Regression**: The web app must continue to function identically
2. **1:1 UI Replication**: Android app must look and behave exactly like the web version
3. **Shared Resources**: All assets (images, fonts, icons) must be reused from web
4. **Feature Parity**: All 24 pages and their functionality must work on Android

## Web APIs Requiring Native Equivalents

| Web API | Usage | Native Plugin |
|---------|-------|---------------|
| `MediaRecorder` + `getUserMedia` | VoiceRecorder.tsx | @capacitor/microphone |
| `navigator.clipboard` | CreateSpace.tsx | @capacitor/clipboard |
| `localStorage` | useLocalStorage.ts | @capacitor/preferences |
| `Notification` API | NotificationContext.tsx | @capacitor/push-notifications |
| `window.location` | Various navigation | Capacitor App plugin |
| Geolocation (via AMap/Leaflet) | MemoryMap, NewMemory | @capacitor/geolocation |
| File input (`<input type="file">`) | NewMemory.tsx, EditMemory.tsx | @capacitor/camera + @capacitor/filesystem |

## Out of Scope

- iOS support (future proposal)
- Backend changes (API already serves both)
- New features beyond parity with web
- App store submission process
