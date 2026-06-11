# Robot-Car (Expo)

This app has been rewritten to use **Expo** while keeping your existing robot control flow:

- `Connection` screen to scan and connect to paired Bluetooth devices
- `Controller` screen with D-pad movement + fan toggle commands
- Bluetooth Classic serial commands for HC-05/HC-06

## Important: Bluetooth Classic requires a dev build

Because this project uses `react-native-bluetooth-classic` (a native module), it **will not run in Expo Go**.

Use an **Expo development build** instead.

## Prerequisites

- Node.js 18+
- Android Studio (for Android SDK/emulator) or a physical Android device
- (Optional for iOS) Xcode

## Install

```sh
npm install
```

## Run (Android)

```sh
npm run android
```

This will generate native projects on demand (`expo prebuild`) and launch Android.

For JS bundler only (after the development build is installed):

```sh
npm start
```

## Run (iOS)

```sh
npm run ios
```

Same behavior: native projects are generated when needed.


## Permissions

Bluetooth permissions are configured in `app.json`:

- `BLUETOOTH_CONNECT`
- `BLUETOOTH_SCAN`
- `ACCESS_FINE_LOCATION`

## Project structure

- `App.tsx` — navigation shell and providers
- `src/hooks/useBluetooth.ts` — Bluetooth connect/disconnect/send logic
- `src/screens/ConnectionScreen.tsx` — paired device listing and connect UI
- `src/screens/ControllerScreen.tsx` — command UI and safety behavior

## Notes

- Pair HC-05/HC-06 in Android system Bluetooth settings before opening the app.
- This repo is set up as Expo-managed-first, so `android/` and `ios/` are intentionally not committed.
- If you later use EAS Build, keep package/bundle IDs in `app.json` aligned with your deployment setup.

