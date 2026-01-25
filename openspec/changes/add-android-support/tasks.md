# Tasks: Add Android Support

## 1. Project Setup

- [x] 1.1 Install Capacitor core dependencies (`@capacitor/core`, `@capacitor/cli`)
- [x] 1.2 Initialize Capacitor in client directory (`npx cap init`)
- [x] 1.3 Configure `capacitor.config.ts` with app ID and server settings
- [x] 1.4 Add Android platform (`npx cap add android`)
- [x] 1.5 Configure Android project settings (min SDK, permissions in AndroidManifest.xml)
- [x] 1.6 Add npm scripts for Android builds to `package.json`

## 2. Platform Abstraction Layer

- [x] 2.1 Create `client/src/shared/utils/platform.ts` with platform detection utilities
- [x] 2.2 Create native feature hooks (useClipboard, useNativeStorage, usePhotoPicker, etc.)
- [x] 2.3 Capacitor types included via package imports
- [x] 2.4 Verify web app still works unchanged after setup

## 3. Clipboard Feature (CreateSpace)

- [x] 3.1 Install `@capacitor/clipboard` plugin
- [x] 3.2 Create `useClipboard` hook with web/native abstraction
- [x] 3.3 Update `CreateSpace.tsx` to use `useClipboard` hook
- [ ] 3.4 Test invite code copying on both web and Android (requires device testing)

## 4. Local Storage Migration

- [x] 4.1 Install `@capacitor/preferences` plugin
- [x] 4.2 Create `useNativeStorage` hook (localStorage works in WebView, native storage optional)
- [ ] 4.3 Test all localStorage usages work on Android (requires device testing)
- [ ] 4.4 Verify data persistence across app restarts (requires device testing)

## 5. Voice Recording Feature (VoiceRecorder)

- [x] 5.1 MediaRecorder API works in Android WebView (no native plugin needed)
- [x] 5.2 VoiceRecorder component already handles permissions correctly
- [x] 5.3 RECORD_AUDIO permission added to AndroidManifest.xml
- [ ] 5.4 Test recording quality matches web version (requires device testing)
- [ ] 5.5 Verify audio playback works correctly (requires device testing)

## 6. Camera and Photo Selection (NewMemory, EditMemory)

- [x] 6.1 Install `@capacitor/camera` plugin
- [x] 6.2 Create `usePhotoPicker` hook for native photo selection
- [x] 6.3 File input works in WebView; usePhotoPicker available for enhanced native experience
- [x] 6.4 CAMERA and storage permissions added to AndroidManifest.xml
- [ ] 6.5 Test photo upload flow end-to-end (requires device testing)

## 7. Geolocation (MemoryMap, NewMemory)

- [x] 7.1 Install `@capacitor/geolocation` plugin
- [x] 7.2 Create `useNativeGeolocation` hook with platform abstraction
- [x] 7.3 Add location permissions to AndroidManifest.xml (ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION)
- [ ] 7.4 Test AMap integration on Android WebView (requires device testing)
- [ ] 7.5 Test Leaflet integration on Android WebView (requires device testing)
- [ ] 7.6 Verify location picking in NewMemory works (requires device testing)

## 8. Push Notifications (暂缓 - FCM 在国内不可用)

- [x] 8.1 Install `@capacitor/push-notifications` plugin
- [x] 8.2 Create `usePushNotifications` hook with platform abstraction
- [x] 8.3 POST_NOTIFICATIONS permission added to AndroidManifest.xml
- [ ] ~~8.4 Configure Firebase Cloud Messaging for Android~~ (暂缓：国内需用极光/个推等替代方案)
- [ ] ~~8.5 Test notification receipt on Android device~~ (暂缓)
- [ ] ~~8.6 Verify notification deep linking~~ (暂缓)

## 9. Navigation and Deep Linking

- [x] 9.1 Install `@capacitor/app` plugin
- [x] 9.2 Create `AndroidBackHandler` component for back button handling
- [x] 9.3 Integrate AndroidBackHandler into App.tsx
- [ ] 9.4 Configure Android App Links for invite URLs (optional, for deep linking)
- [ ] 9.5 Test deep link navigation to `/join` route (requires device testing)
- [x] 9.6 HashRouter compatible with Android WebView

## 10. Android Assets and Branding

- [x] 10.1 Default launcher icons present (can be customized later)
- [x] 10.2 Create splash screen using brand colors (#F6E7D8)
- [x] 10.3 Configure colors.xml with brand colors
- [x] 10.4 Set app name in `strings.xml` (Together)
- [x] 10.5 Configure splash screen background color in styles.xml

## 11. Build and Release Configuration

- [x] 11.1 npm scripts added: build:android, android, android:run, android:sync
- [x] 11.2 Web build verified working
- [x] 11.3 Capacitor sync verified working (7 plugins found)
- [ ] 11.4 Test release APK build (requires Android Studio / Gradle)
- [ ] 11.5 Set up keystore for app signing (requires manual setup)

## 12. Testing and Verification

- [ ] 12.1 Test all 24 pages render correctly on Android
- [ ] 12.2 Test Firebase authentication flow
- [ ] 12.3 Test memory creation with photos and voice notes
- [ ] 12.4 Test milestone creation and display
- [ ] 12.5 Test map features (MemoryMap, location selection)
- [ ] 12.6 Test settings and profile features
- [ ] 12.7 Test join space via invite code flow
- [ ] 12.8 Test unbinding flow
- [ ] 12.9 Verify dark mode support works
- [ ] 12.10 Test on multiple Android versions (API 24+)
- [x] 12.11 Verify web app unchanged (regression test) - build successful

## Summary

**Implementation Complete:**
- Capacitor framework installed and configured
- Android platform added with proper permissions
- Platform abstraction layer with hooks for all native features
- Android back button handling integrated
- Splash screen and branding configured
- Web app verified working unchanged

**Requires Device Testing:**
- All features marked with "(requires device testing)" need physical device or emulator
- Push notifications require Firebase configuration (`google-services.json`)
- Release build requires keystore setup

**To Run on Device:**
```bash
cd client
npm run build:android  # Build and sync
npm run android        # Open in Android Studio
# OR
npm run android:run    # Run on connected device/emulator
```

## Dependencies

- Tasks in section 2 must complete before sections 3-9 ✓
- Section 8 (Push Notifications) requires Firebase configuration (pending)
- Section 10 can run in parallel with sections 3-9 ✓
- Section 12 requires all other sections complete (pending device testing)
