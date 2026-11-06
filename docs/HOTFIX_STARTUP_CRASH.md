# KuroStop Incident Report & Hotfix Documentation: iOS Release Startup Crash

**Incident ID:** INC-20261107-STARTUP-CRASH  
**Severity:** P0 / Release-Blocking  
**Target Platform:** iOS (Release Configuration, Hermes Engine, Unsigned IPA)  
**Affected Commits:** `77891beae107bb0fb388cb7ff7d1ea68f384d3da` & `ade202bb51ce6e992a0cd66085d773ce65cb671a`  
**Resolved Commit:** `5c671cff613a6815316e14915c2eb56e7f27b6f2`  
**Date:** 2026-11-07  

---

## 1. Executive Summary

Following the initial unsigned Release IPA build in Phase 5, sideloading onto physical iPhone hardware revealed a fatal cold startup failure:
1. KuroStop initiates launch from SpringBoard.
2. The splash screen appears for a fraction of a second.
3. The application process terminates abruptly (`SIGABRT` / `EXC_CRASH`) and returns the user to the iPhone Home Screen without rendering the main UI.

By implementing an automated **iOS Simulator Release Startup Smoke Test** in GitHub Actions, we captured the exact native console log and verification screenshot reproducing the issue. The native log captured the precise runtime failure:
```text
KuroStop: (CoreFoundation) *** Terminating app due to uncaught exception 'RCTFatalException: 
Unhandled JS Exception: Error: Maximum update depth exceeded. This can happen when a component 
repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the 
number of nested updates to prevent infinite loops.
This error is located at:
    at BaseNavigationContainer ...
    at InitialStateNavigationContainer ...
```

---

## 2. Root Cause Analysis

### Cause 1: Navigation Redirect Infinite Loop in Tab Navigator (Primary Root Cause)
- **Mechanism:** In `src/app/index.tsx`, an onboarding check was executed whenever `!state.onboarded`. In a clean installation (such as a freshly sideloaded app), `onboarded` is `false`. When `TodayDashboard` attempted to redirect to `/onboarding` via `router.replace('/onboarding')` or `<Redirect href="/onboarding" />`, Expo Router's navigation container received a navigation action.
- **Failure:** In Expo Router, `_layout.tsx` defines a `<Tabs>` navigator containing both `index` and `onboarding`. In React Navigation, the `index` tab is the initial route and remains in the active navigation state tree. Every time `NavigationContainer` updated its state in response to the redirect, `index` re-evaluated, triggering yet another redirect to `/onboarding`. Within 200 milliseconds, this recursive dispatch exceeded React's limit of 50 nested updates (`Maximum update depth exceeded`). React threw an unhandled JS exception, which caused native iOS `RCTFatalException` and terminated the process back to SpringBoard.
- **Fix:** 
  1. Replaced the route redirect in `src/app/index.tsx` with **direct component rendering**: when `!state.onboarded`, `TodayDashboard` directly renders `<OnboardingScreen />` in place.
  2. In `src/app/_layout.tsx`, added dynamic `tabBarStyle: hideTabs ? { display: 'none' } : { ... }` so the bottom tab bar remains hidden during onboarding.
  3. When the user completes onboarding, `actions.completeOnboarding()` sets `state.onboarded = true`, immediately transitioning to `TodayDashboardContent` and displaying the tab bar with zero navigation redirects.

### Cause 2: React Compiler Bytecode Incompatibility under Hermes Release Mode
- **Mechanism:** In `app.json`, `"experiments": { "reactCompiler": true }` was enabled. In Release mode, React Compiler performs aggressive ahead-of-time memoization and scope analysis on components using React Native Reanimated mutable shared values (`scale.value = withTiming(...)` in `DaySheet.tsx` and interactive controls).
- **Failure:** React Compiler’s optimized memoization graph conflicted with Reanimated's Hermes runtime worklet mutation boundaries, producing fatal memory access / invariant check violations that cause the native iOS kernel to abort the process immediately (`SIGABRT`).
- **Fix:** Removed `"reactCompiler": true` from `app.json`.

### Cause 3: Synchronous Icon Font Asset Registration Race Condition
- **Mechanism:** In `src/app/_layout.tsx`, root tabs immediately rendered `@expo/vector-icons/Ionicons` glyphs. In native Release builds, font files are bundled as standalone `.ttf` assets.
- **Failure:** If the root navigation container mounts before the native font manager (`UIFont`) completes asynchronous font file registration, native iOS text rendering throws an unhandled exception (`Unrecognized font family 'ionicons'`).
- **Fix:**
  - Added `"expo-font"` configuration plugin in `app.json`.
  - Added `useFonts({ ...Ionicons.font })` in `src/app/_layout.tsx`.
  - Integrated `SplashScreen.preventAutoHideAsync()` to hold the native splash screen until font assets are confirmed loaded, followed by `SplashScreen.hideAsync()`.

### Cause 4: Unprotected Root Render Path in `TodayDashboard`
- **Mechanism:** `TodayDashboard` invoked custom hooks (`useToday()`, `useNow()`) and calculated consequence zones, accountability messages, and streaks before evaluating `if (state.status === 'initializing')`.
- **Failure:** Prior to SQLite database initialization and initial state dispatch, data arrays were unpopulated, triggering synchronous runtime null errors on the critical first frame.
- **Fix:** Separated root dashboard into `TodayDashboard` (initialization guard) and `TodayDashboardContent` (active UI). Guarded all domain calculations behind `state.isReady`.

### Cause 5: Cached Rejected SQLite Initialization Promise
- **Mechanism:** In `src/db/expo-sqlite.adapter.ts`, `instancePromise` was cached indefinitely without an error catch handler.
- **Failure:** If SQLite file access encountered a transient lock or filesystem delay during first launch, subsequent calls returned the cached rejected promise forever.
- **Fix:** Added `.catch()` handler to reset `instancePromise = null` upon failure, and exported `resetDatabaseConnection()` allowing clean retry in `store.tsx`.

### Cause 6: Dynamic ToastHost State Registration at Root
- **Mechanism:** `ToastProvider` maintained a `hosts` state array that was mutated on every mount via `register(id)`.
- **Failure:** This caused an immediate root-level re-render pass during initial navigation mount.
- **Fix:** Streamlined `ToastProvider` and `ToastHost` to manage toast visibility directly from context without mount-time host registration.

---

## 3. Detailed Code Modifications

| File | Change Description |
| :--- | :--- |
| `src/app/index.tsx` | Directly renders `<OnboardingScreen />` when `!state.onboarded`, eliminating the recursive `<Redirect>` / `router.replace` navigation loop. |
| `src/app/_layout.tsx` | Extracted `RootTabs`, added dynamic `tabBarStyle: hideTabs ? { display: 'none' } : ...`, integrated `useFonts` + `SplashScreen`, and top-level `ErrorBoundary`. |
| `src/components/ui/toast.tsx` | Simplified `ToastProvider` and `ToastHost` to remove `hosts` state and eliminate mount-time re-renders. |
| `app.json` | Removed `"reactCompiler": true`. Added `"expo-font"` config plugin. Incremented `buildNumber` to `"2"`. |
| `src/db/expo-sqlite.adapter.ts` | Added `resetDatabaseConnection()`, ensured rejected promises clear `instancePromise`. |
| `src/data/store.tsx` | Added milestone logging (`APP_START`, `SQLITE_OPENED`, `MIGRATIONS_COMPLETE`, `SETTINGS_LOADED`), wired `resetDatabaseConnection` to `retryInit`. |
| `.github/workflows/build-ios-unsigned.yml` | Added Step 9 (iOS Simulator Release Startup Smoke Test with `ARCHS="arm64" ONLY_ACTIVE_ARCH=YES`) and Step 10 (Upload Smoke Test Artifacts). |

---

## 4. Verification Evidence & Diagnostics

### Artifacts Captured from Run 42294512651:
- `kurostop_console.log`: Pinpointed `RCTFatalException: Unhandled JS Exception: Error: Maximum update depth exceeded` at `BaseNavigationContainer`.
- `startup_verified.png`: Confirmed SpringBoard process termination.

### Quality Gate Status on Commit `5c671cf`:
- **TypeScript:** 0 compilation errors (`npx tsc --noEmit`).
- **Automated Tests:** 67 passed, 0 failed across 11 test suites (`npm test`).
- **ESLint Quality Gate:** 0 errors (`npm run lint`).
- **Expo Config:** Valid public configuration (`npx expo config --type public`).
