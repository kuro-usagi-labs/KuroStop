# KuroStop Native iOS Features & Privacy Protections

## 1. Overview

KuroStop is tailored exclusively for single-user adult iPhone devices, combining a privacy-first local architecture with native iOS platform features:
- **Biometric App Lock** via `expo-local-authentication` (Face ID, Touch ID, Passcode fallback).
- **App Switcher Privacy Shield** preventing sensitive habit snapshots in iOS multitasking.
- **PMO Content Masking** (`pmoCover`) obscuring sensitive terminology from general views and summaries.
- **Local Notifications** via `expo-notifications` for bedtime, daily check-in, and weekly review reminders.
- **Offline SQLite WAL Persistence** with zero cloud sync and zero telemetry.

---

## 2. Biometric App Lock (`expo-local-authentication`)

### Implementation
- **Component**: `src/components/security/AppLockProvider.tsx`
- **Service**: `src/lib/biometrics.ts`
- **Configuration**:
  - `NSFaceIDUsageDescription`: *"KuroStop memerlukan izin Face ID untuk mengamankan catatan disiplin pribadi Anda."*
  - Configured in `app.json` under `ios.infoPlist` and Expo plugins.

### Lifecycle Behavior
1. **Cold Launch**:
   If `settings.appLock` is active, the app opens directly into a locked state, displaying the porcelain-paper lock screen with the Sumi emblem.
2. **Background Transition**:
   When the app is sent to the background and resumes after >2 seconds, the lock screen activates immediately.
3. **Passcode Fallback**:
   If Face ID or Touch ID is cancelled or temporarily unavailable, device passcode entry is supported through iOS standard authentication sheets without crashing.
4. **Configuration Safety**:
   In `SettingsScreen`, toggling `appLock` requires successful biometric verification before the setting can be enabled or disabled, preventing false-positive security configurations.

---

## 3. Privacy Protections

### 3.1 iOS App Switcher Multitasking Shield
- In iOS multitasking (App Switcher), the operating system captures screen snapshots for the card carousel.
- `AppLockProvider` listens to `AppState` transitions (`inactive` and `background`).
- When transitioning away from the active state, an opaque shield (`color.paper`) with the minimalist KuroStop emblem is rendered on top of the UI hierarchy at `zIndex: 99999`.
- As a result, sensitive consequence marks, cigarette logs, and PMO records are never visible in the iOS App Switcher.

### 3.2 PMO Content Masking (`pmoCover`)
- When `settings.pmoCover` is enabled:
  - DaySheet footer displays neutral copy: *"Refleksi"* instead of *"PMO"*, and *"Tercatat / Bersih"* instead of session breakdown.
  - Today Dashboard summary cards label the habit as *"Disiplin Pribadi"* with subtitle *"Data tersamarkan (Mode Privasi Aktif)"*.
  - Notifications strictly exclude PMO terms.
  - The dedicated PMO screen (`/pmo`) remains available when navigated to intentionally.

### 3.3 Zero Telemetry & Local Storage
- All habit records reside strictly in `kurostop.db` using SQLite with Write-Ahead Logging (`WAL`).
- No analytics SDKs, advertising trackers, or external endpoints are included in the bundle.
