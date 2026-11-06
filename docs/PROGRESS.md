# KuroStop Engineering Progress Log

## Phase 2: Local Database & Core Business Logic [COMPLETED]

### Milestone 1: Planning & Architecture [COMPLETED]
- [x] Baseline project inspection & code assessment
- [x] Layered architecture specification (`docs/ARCHITECTURE.md`)
- [x] Architectural decisions recorded (`docs/DECISIONS.md`)
- [x] Complete SQLite schema defined (`docs/DATABASE_SCHEMA.md`)
- [x] Deterministic business rules defined (`docs/BUSINESS_RULES.md`)

### Milestone 2: SQLite Database Foundation [COMPLETED]
- [x] Database client abstraction (`src/db/database.interface.ts`)
- [x] Expo SQLite implementation (`src/db/expo-sqlite.adapter.ts`)
- [x] Node / in-memory SQLite implementation (`src/db/node-sqlite.adapter.ts`)
- [x] Schema migrations runner (`src/db/migrations.ts`)
- [x] Automated database migrations and constraints tests (`test/db/database.test.ts`)

### Milestone 3: Domain Engines & Business Logic [COMPLETED]
- [x] Consequence calculation engine (`src/domain/consequence.ts`)
- [x] Financial calculation engine with integer IDR (`src/domain/finance.ts`)
- [x] Sleep cross-midnight & lateness engine (`src/domain/sleep.ts`)
- [x] Streak calculation engine with strict verification (`src/domain/streaks.ts`)
- [x] Validation guards (`src/domain/validation.ts`)
- [x] Automated unit tests for all domain engines (`test/domain/engines.test.ts`)

### Milestone 4: Repositories [COMPLETED]
- [x] Smoking repository with validation & undo (`src/repositories/smoking.repository.ts`)
- [x] PMO repository with session integrity (`src/repositories/pmo.repository.ts`)
- [x] Sleep repository with active session management (`src/repositories/sleep.repository.ts`)
- [x] Cigarette purchase repository with integer IDR (`src/repositories/finance.repository.ts`)
- [x] Settings repository with singleton management (`src/repositories/settings.repository.ts`)
- [x] Urge and checkin repositories (`src/repositories/urge.repository.ts`, `src/repositories/checkin.repository.ts`)
- [x] Automated repository integration test suite (`test/repositories/repositories.test.ts`)

### Milestone 5: App Integration & UI Persistence [COMPLETED]
- [x] Upgraded `src/data/store.tsx` connected to SQLite repositories
- [x] Real-time updates to `useToday`, `useNow`, and `src/data/selectors.ts`
- [x] Persistent settings and targets across restarts
- [x] Onboarding state persistence
- [x] End-to-end smoking tracking vertical slice verified (`test/integration/vertical_slice.test.ts`)
- [x] Preserved "Lembar" UI visual design and animations intact

---

## Phase 3: Full Application Integration, Data Integrity & Reliability [COMPLETED]

### Milestone 1: Source-Code Audit & Assessment [COMPLETED]
- [x] Full codebase audit for data-loss risks, fire-and-forget writes, and query limits
- [x] Audit report documented in `docs/PHASE3_AUDIT.md`

### Milestone 2: Data Safety & Demo Isolation [COMPLETED]
- [x] Isolated demo data: production database (`kurostop.db`) is strictly protected from demo resets
- [x] Safety guard in `resetDemo()` prevents accidental deletion of user records
- [x] Explicit wipe action reserved for user-initiated data clearing with alert confirmation
- [x] Automated data safety test suite (`test/integration/data_safety.test.ts`)

### Milestone 3: Store Hardening & Optimistic UI with Rollback [COMPLETED]
- [x] Refactored `src/data/store.tsx` mutations (`add`, `update`, `remove`, `restore`, `setSettings`) to async Promises
- [x] Implemented optimistic state updates with rollback on database write failures
- [x] Added initialization states (`initializing`, `ready`, `error`) and `retryInit()` recovery
- [x] Removed hardcoded query limits (`getAll(limit?: number)`) across all 6 repositories

### Milestone 4: Domain & Selector Precision [COMPLETED]
- [x] Habit verification integrity: purchases and urges do not falsely verify habit abstinence
- [x] Financial calculation transparency: avoided spend honestly displays negative values (deficits)
- [x] Automated verification compliance tests (`test/domain/verified_compliance.test.ts`)

### Milestone 5: End-to-End Screen Integration [COMPLETED]
- [x] `src/app/log.tsx`: Awaited async mutations with error handling and toast feedback
- [x] `src/app/sleep.tsx`: Awaited async session start/end with error handling
- [x] `src/app/urge.tsx`: Awaited async urge resolution
- [x] `src/app/onboarding.tsx`: Defaulted `withDemo` to `false`, awaited persistence before routing
- [x] `src/app/index.tsx`: First-launch onboarding guard, isolated manual zone simulator to demo mode, removed obsolete prototype notes
- [x] `src/app/settings.tsx` & `src/app/more.tsx`: Protected data management actions, updated offline-first SQLite branding
- [x] Removed all obsolete `PrototypeNote` elements

---

## Phase 4: Native iOS, Privacy, Backup & Unsigned IPA CI/CD [COMPLETED]

### Milestone 1: Phase 3 Final Defect Resolution [COMPLETED]
- [x] Preserved `unresolved` urge outcome in store, types, selectors (`test/domain/urge_outcomes.test.ts`)
- [x] Hardened database readiness: mutations reject with explicit errors when SQLite is not ready
- [x] Isolated demo mode: demo resets never touch production tables; demo modifications stay isolated
- [x] Corrected baseline effective date calculations in `src/domain/finance.ts` and `src/app/money.tsx` (`test/domain/finance_baseline.test.ts`)

### Milestone 2: Native Biometric App Lock & Privacy Protections [COMPLETED]
- [x] Integrated `expo-local-authentication` (`src/lib/biometrics.ts`) with Face ID, Touch ID, and passcode fallback
- [x] Implemented `AppLockProvider` (`src/components/security/AppLockProvider.tsx`) with foreground/background lifecycle handling
- [x] Implemented iOS App Switcher Multitasking Shield preventing task-switcher preview data leakage
- [x] Connected PMO Content Masking (`pmoCover`) to DaySheet and summary statistics
- [x] Verification requirement in `SettingsScreen` before toggling App Lock

### Milestone 3: Local Notification Engine [COMPLETED]
- [x] Integrated `expo-notifications` (`src/lib/notifications.ts`)
- [x] Implemented bedtime reminder (30m before target bedtime)
- [x] Implemented evening daily check-in reminder (21:30 WIB)
- [x] Implemented Sunday weekly review reminder (20:00 WIB)
- [x] Permission requests and settings synchronization in `src/app/settings.tsx`

### Milestone 4: Offline Backup & Restore Engine [COMPLETED]
- [x] Versioned JSON format `KuroStopBackupV1` with FNV-1a checksum (`src/lib/backup.ts`)
- [x] Export of all 6 SQLite tables and settings
- [x] Strict schema validation and tamper detection
- [x] Transactional restore with atomic rollback on failure (`test/domain/backup_restore.test.ts`)
- [x] Export action wired to Settings UI

### Milestone 5: iOS Native Configuration & Unsigned IPA Workflow [COMPLETED]
- [x] Configured `app.json`: bundle ID `com.kurostop.personal`, Face ID usage descriptions, plugins, Lembar light theme
- [x] Created GitHub Actions CI workflow (`.github/workflows/build-ios-unsigned.yml`) for `macos-14` runner
- [x] Prebuild, CocoaPods, Xcode Release build for physical devices (`iphoneos`, `arm64`) with signing disabled
- [x] Valid `Payload/*.app` ZIP packaging into `.ipa` with SHA-256 checksum artifact upload
- [x] Prepared comprehensive documentation: `docs/IOS_NATIVE_FEATURES.md`, `docs/BACKUP_RESTORE.md`, `docs/GITHUB_ACTIONS_BUILD.md`, `docs/SIDELOAD_GUIDE.md`, `docs/PHASE4_AUDIT.md`


---

## Phase 5: GitHub Repository Replacement, Release Build & iOS Validation [COMPLETED]

### Milestone 1: Remote Repository Inspection & Safe Archive [COMPLETED]
- [x] Connected to GitHub remote `https://github.com/kuro-usagi-labs/KuroStop`
- [x] Identified existing `main` commit SHA: `470ed99c0a200675129d3a7c1fcb737aca82c54a`
- [x] Created and pushed dedicated archive branch: `archive/pre-lembar-phase5-20261107`
- [x] Verified remote archive branch existence and accessibility

### Milestone 2: Codebase Synchronization & Cleanup [COMPLETED]
- [x] Created replacement working branch `phase5/replace-legacy-with-lembar`
- [x] Purged legacy files: `App.tsx`, `index.ts`, `src/screens/`, `src/features/`, `src/stores/`, `src/database/`, `src/animations/`, `.claude/`, `ios-build.yml`, `eas.json`
- [x] Replaced with authoritative Phase 4 Lembar application: `src/app/`, `src/components/`, `src/db/`, `src/domain/`, `src/repositories/`, `src/lib/`, `test/`, `docs/`
- [x] Resolved ESLint warnings and React 19 compiler compatibility

### Milestone 3: CI/CD Pipeline Upgrade [COMPLETED]
- [x] Upgraded runner to `macos-26` (Apple Silicon `arm64`) following macOS 14 deprecation
- [x] Upgraded Node runtime to Node 22 LTS (Expo SDK 58 requirement)
- [x] Added environment diagnostics (`sw_vers`, `xcodebuild -version`, `node --version`)
- [x] Added public Expo configuration validation step
- [x] Validated unsigned IPA packaging with SHA-256 generation

### Milestone 4: Verification Suite & Documentation [COMPLETED]
- [x] 67 automated tests passing (`npm test`)
- [x] 0 TypeScript compilation errors (`npx tsc --noEmit`)
- [x] 0 ESLint errors (`npx eslint "src/**/*.{ts,tsx}" --quiet`)
- [x] Created `docs/PHASE5_RELEASE_AUDIT.md`, `docs/REPOSITORY_MIGRATION.md`, `docs/IOS_DEVICE_TESTS.md`
- [x] Updated `README.md`, `docs/GITHUB_ACTIONS_BUILD.md`, `docs/SIDELOAD_GUIDE.md`, `docs/ARCHITECTURE.md`
