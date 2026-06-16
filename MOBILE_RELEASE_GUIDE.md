# Lishka Mobile Release Guide (Capacitor)

This guide is your reference for shipping iOS/Android updates from this stage onward.

## Current Setup

- Web app: Vite/React
- Native wrapper: Capacitor
- iOS project: `ios/App/App.xcodeproj`
- Android project: `android/`
- Build script: `npm run cap:build`
- OTA plugin installed: `@capawesome/capacitor-live-update`

## Do We Need App Store Submission Every Time?

- `Yes` by default with Capacitor.
- `No` for some JS-only changes if shipped via Live Update (OTA).

## OTA vs App Store Matrix

| Change Type                                        | OTA (Live Update) | App Store / Play Store |
| -------------------------------------------------- | ----------------- | ---------------------- |
| Text/UI copy, styles, layout tweaks                | Yes               | No                     |
| React page logic changes (no native code)          | Yes               | No                     |
| API endpoint changes in frontend                   | Yes               | No                     |
| New Capacitor plugin                               | No                | Yes                    |
| iOS permissions (`Info.plist`)                     | No                | Yes                    |
| Android permissions (`AndroidManifest.xml`)        | No                | Yes                    |
| App icon / splash screen change                    | No                | Yes                    |
| Bundle ID / signing / provisioning changes         | No                | Yes                    |
| Native SDK update / Gradle / Xcode project changes | No                | Yes                    |

Rule of thumb: if it touches `ios/`, `android/`, native plugin list, or app metadata, submit a new binary.

## Standard Commands

From `lishka.app/`:

```bash
# Regular web build (Vercel path)
npm run build

# Mobile build + native sync
npm run cap:build

# Open iOS project
npm run cap:ios

# Open Android project
npm run cap:android
```

## Release Workflows

### A) OTA-Eligible Update (Fast Path)

1. Merge JS/CSS/frontend changes.
2. Build production web bundle.
3. Publish OTA bundle through your Live Update backend/provider.
4. Validate on installed TestFlight/production app.
5. Monitor crash/error analytics and rollback if needed.

### B) App Store Update (Binary Required)

1. Run:
   ```bash
   npm run cap:build
   ```
2. Open Xcode:
   ```bash
   npm run cap:ios
   ```
3. Bump version/build in Xcode:
   - Version (`CFBundleShortVersionString`) e.g. `1.0.1`
   - Build (`CFBundleVersion`) e.g. `2`
4. Product -> Archive
5. Distribute to App Store Connect
6. Test in TestFlight
7. Submit for review

## App Store Submission Checklist (iOS)

- [ ] App launches without white screen
- [ ] Login / signup / OAuth flows work
- [ ] Safe-area/header/footer look correct on notch devices
- [ ] API calls succeed in production mode
- [ ] Version/build incremented
- [ ] Privacy policy URL valid
- [ ] App icon/splash correct
- [ ] App Store screenshots updated (if UI changed)
- [ ] TestFlight smoke test done

## Troubleshooting Quick Notes

- `Error: supabaseUrl is required`
  - Missing `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` at build time.
  - Rebuild + sync:
    ```bash
    npm run cap:build
    ```

- Old UI/icon still appears
  - Clean + reinstall app in simulator/device.
  - In Xcode: Product -> Clean Build Folder, then run.

- Header under Dynamic Island
  - Ensure `viewport-fit=cover` is set in `index.html`.
  - Rebuild and resync native assets.

## Recommended Team Policy

- Use OTA only for low-risk frontend-only updates.
- Use phased App Store releases for higher-risk changes.
- Keep one release note template for:
  - What changed
  - OTA or Store path used
  - Rollback plan
