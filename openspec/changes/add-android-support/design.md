# Design: Android Support Architecture

## Context

Sanctuary is a React 19 + Vite 6 web application designed mobile-first. The existing codebase uses several Web APIs that require native equivalents on Android:

- MediaRecorder for voice notes
- Clipboard API for invite codes
- localStorage for persistence
- Web Notifications for alerts
- File input for photo selection

The challenge is adding Android support without breaking or modifying existing web functionality.

## Goals

- Package existing React web app as native Android APK
- Achieve 100% feature parity with web version
- Reuse all existing UI components, styles, and assets
- Provide native-quality experience for Android-specific APIs

## Non-Goals

- iOS support (separate future effort)
- Rewriting existing components
- Adding Android-exclusive features
- Backend modifications
- Changing existing web behavior

## Decisions

### Decision 1: Use Capacitor (not React Native or Cordova)

**What**: Use Ionic Capacitor as the native wrapper framework.

**Why**:
- Capacitor is designed specifically for existing web apps
- Maintains the web view approach - no UI rewrite needed
- Modern plugin ecosystem with TypeScript support
- Official plugins for all required native APIs
- Better performance than Cordova
- React Native would require rewriting all 24 pages

**Alternatives considered**:
- **React Native**: Rejected - requires complete UI rewrite
- **Cordova**: Rejected - legacy, worse plugin support
- **PWA only**: Rejected - limited native API access, no Play Store presence
- **Tauri**: Rejected - less mature mobile support

### Decision 2: Platform Abstraction Pattern

**What**: Create a utility layer that detects platform and routes to appropriate implementation.

```typescript
// client/src/shared/utils/platform.ts
export const Platform = {
  isNative: () => typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform(),
  isAndroid: () => Platform.isNative() && Capacitor.getPlatform() === 'android',
  isWeb: () => !Platform.isNative()
};
```

**Why**:
- Single source of truth for platform detection
- Allows conditional behavior without code duplication
- Web code paths remain unchanged

### Decision 3: Feature Hooks for Native APIs

**What**: Create abstraction hooks that wrap both web and native implementations.

```typescript
// Example: useClipboard hook
export function useClipboard() {
  const copyToClipboard = async (text: string) => {
    if (Platform.isNative()) {
      await Clipboard.write({ string: text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };
  return { copyToClipboard };
}
```

**Why**:
- Existing components can use hooks without knowing the platform
- Web implementation stays in place, native added alongside
- Easy to test both paths

### Decision 4: WebView-based Audio Recording

**What**: On Android, use Capacitor's native audio recording plugins instead of MediaRecorder API.

**Why**:
- MediaRecorder support varies across Android WebViews
- Native recording provides better quality and reliability
- Capacitor Community Audio plugin handles permissions properly

**Implementation approach**:
- Detect platform in VoiceRecorder component
- Use @capacitor-community/media plugin or custom native code
- Return same data format (base64 audio) to maintain compatibility

### Decision 5: Asset Reuse Strategy

**What**: Copy web assets to Android resource directories during build.

| Web Asset | Android Location |
|-----------|------------------|
| `public/icon.svg` | `android/app/src/main/res/mipmap-*/ic_launcher.png` |
| `public/images/*` | Served from WebView (no copy needed) |
| `public/fonts/*` | Served from WebView (no copy needed) |

**Why**:
- SVG icons converted to PNG at various densities for Android
- Images/fonts served directly from the web bundle in WebView
- Minimizes duplication while meeting Android requirements

### Decision 6: Build Configuration

**What**: Add npm scripts for Android builds that extend existing workflow.

```json
{
  "scripts": {
    "build": "vite build",
    "build:android": "vite build && cap sync android",
    "android": "cap open android",
    "android:run": "cap run android"
  }
}
```

**Why**:
- Web build process unchanged
- Android build adds Capacitor sync step
- Developers can choose which target to build

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| WebView performance limitations | Profile early; most UI is CSS which performs well |
| MediaRecorder WebView inconsistency | Use native audio plugin, not web API |
| Large APK size due to embedded web assets | Enable Vite minification; consider lazy loading |
| Firebase Auth token handling in WebView | Capacitor Firebase plugin handles this |
| Deep linking configuration complexity | Follow Capacitor docs exactly; test thoroughly |

## Component Modification Strategy

Components requiring platform-aware changes:

1. **VoiceRecorder.tsx** (client/src/features/memory/components/)
   - Add native audio recording path
   - Keep web MediaRecorder as fallback

2. **CreateSpace.tsx** (client/src/pages/)
   - Replace `navigator.clipboard` with `useClipboard` hook

3. **useLocalStorage.ts** (client/src/shared/hooks/)
   - Add Capacitor Preferences fallback for native

4. **NotificationContext.tsx** (client/src/shared/context/)
   - Add Capacitor Push Notifications for native

5. **NewMemory.tsx, EditMemory.tsx** (client/src/pages/)
   - Add Capacitor Camera plugin for photo selection

6. **MemoryMap.tsx** (client/src/pages/)
   - Geolocation already abstracted via map libraries
   - May need Capacitor Geolocation for permissions

## Migration Plan

1. **Phase 1: Setup** - Install Capacitor, create Android project
2. **Phase 2: Platform Utils** - Add platform detection and hooks
3. **Phase 3: Core Features** - Migrate clipboard, storage, basic navigation
4. **Phase 4: Media Features** - Audio recording, camera, file access
5. **Phase 5: Notifications** - Push notification setup
6. **Phase 6: Polish** - Icons, splash screens, deep links
7. **Phase 7: Testing** - Comprehensive testing on physical devices

Each phase results in a working (though possibly incomplete) Android build.

## Open Questions

1. **Minimum Android version target?** Recommend API 24 (Android 7.0) for WebView features
2. **Firebase configuration for Android?** Need `google-services.json` from Firebase console
3. **Signing configuration for release builds?** Need keystore setup instructions
4. **AMap SDK for Android?** Current web uses JS API; may need native AMap SDK consideration
