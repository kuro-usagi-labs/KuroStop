# Architectural Decisions (ADR)

## ADR-001: Local-First Persistence with Expo SQLite

- **Status**: Accepted
- **Context**: KuroStop requires offline-first, private, local persistence for a single user without server dependencies or telemetry.
- **Decision**: Adopt `expo-sqlite` with asynchronous modern API (`openDatabaseAsync`, `execAsync`, `getAllAsync`, `runAsync`, `withTransactionAsync`).
- **Consequences**:
  - Full relational integrity with foreign keys and WAL mode.
  - Zero cloud lock-in.
  - Complete data privacy.

## ADR-002: Integer Rupiah (IDR) Financial Math

- **Status**: Accepted
- **Context**: JavaScript floating-point arithmetic (`0.1 + 0.2 = 0.30000000000000004`) causes subtle rounding errors in currency calculations.
- **Decision**: All financial amounts in the database and calculations are stored and processed strictly as integer IDR. Formatting with thousands separators is applied only at the display boundary.
- **Consequences**:
  - Deterministic balance and savings calculations.
  - No rounding drift over multiple transactions.

## ADR-003: Pure Function Consequence Engine

- **Status**: Accepted
- **Context**: The consequence zone (*Bersih*, *Awas*, *Bahaya*, *Kritis*) must be reliably reproducible and testable without UI dependencies.
- **Decision**: Implement `calculateDailyZone` as a pure function accepting typed events, user targets, thresholds, and boundary hours, returning zone classification, severity scores, and triggering factors.
- **Consequences**:
  - 100% testable with automated unit tests across all edge cases.
  - Consistent across app restarts and date shifts.

## ADR-004: Strict Verification vs Empty Days

- **Status**: Accepted
- **Context**: An empty event list does not prove the user abstained; they may simply have forgotten to log.
- **Decision**: A day is verified only if:
  - Events were logged within target limits, OR
  - An explicit check-in was recorded for that day (`daily_checkins`).
  Unverified days do not extend an abstinence streak.
- **Consequences**:
  - True accountability.
  - Honest streak tracking.

## ADR-005: Sleep Cross-Midnight Attribution

- **Status**: Accepted
- **Context**: Sleep sessions frequently begin before or after midnight (e.g., 00:45) and end the next morning (07:15).
- **Decision**: Sleep sessions store an explicit `night_day_key` calculated based on the day boundary (04:00 AM Asia/Jakarta). A sleep session starting at 00:45 on Nov 7 belongs to the evening of Nov 6.
- **Consequences**:
  - Lateness is calculated accurately relative to the night's bedtime target.
  - Daily sleep stats correctly reflect the night of rest, not the wake-up date alone.

## ADR-006: Optimistic UI Updates with Rollback Safety

- **Status**: Accepted
- **Context**: Offline mobile UX requires instant feedback without UI stutter, but unhandled asynchronous writes lead to dirty UI states if the database transaction fails.
- **Decision**: All store mutations (`add`, `update`, `remove`, `restore`, `setSettings`) return Promises, perform an immediate optimistic state dispatch, await the SQLite transaction, and automatically rollback the UI state if the write fails.
- **Consequences**:
  - Instantaneous UI response feel with 60fps animations.
  - Reliable data consistency: no unsaved ghost records lingering in the UI.

## ADR-007: Production Data Isolation from Demo Operations

- **Status**: Accepted
- **Context**: During prototyping and testing, demo reset utilities can mistakenly wipe real user records if sharing the same code paths or tables.
- **Decision**: Introduce explicit demo isolation mode (`isDemoMode`). Calling `resetDemo()` in production mode is blocked by a guard and will never execute destructive SQL on live tables. Onboarding defaults `withDemo` to `false`.
- **Consequences**:
  - Real user data is protected against accidental wiping.
  - Clean separation between evaluation datasets and authentic discipline logging.

## ADR-008: Native Biometric Authentication with Fallback

- **Status**: Accepted
- **Context**: KuroStop contains sensitive personal records requiring on-device authentication without exposing the user to permanent lockout.
- **Decision**: Implement `expo-local-authentication` supporting Face ID, Touch ID, and OS-managed passcode fallback. Toggling `appLock` requires successful biometric verification before enabling.
- **Consequences**:
  - Hardened local access control.
  - No risk of permanent lockout when biometrics temporarily fail or lighting is poor.

## ADR-009: App Switcher Multitasking Shield for Sensitive Records

- **Status**: Accepted
- **Context**: iOS automatically snapshots the active window when multitasking, displaying personal habit data in the app switcher carousel.
- **Decision**: Render an opaque privacy shield overlay on `inactive` and `background` AppState events to prevent sensitive screen contents from leaking into iOS task-switcher previews.
- **Consequences**:
  - Habit marks and records remain hidden from casual onlookers.
  - Zero leakage in multitasking snapshots.

## ADR-010: Offline Transactional JSON Backup with Checksum

- **Status**: Accepted
- **Context**: Private sideload updates and certificate refreshes risk database eviction if an app is reinstalled or the bundle identifier changes.
- **Decision**: Implement a versioned `KuroStopBackupV1` format with FNV-1a checksum and atomic transactional restore via `db.withTransactionAsync`.
- **Consequences**:
  - Portable offline backup independent of iOS cloud syncing.
  - Failed restorations automatically rollback, guaranteeing zero data corruption.

## ADR-011: Unsigned iOS Release IPA CI Pipeline for Sideloading

- **Status**: Accepted
- **Context**: The user requires a standalone iOS Release IPA for personal sideloading without storing sensitive Apple Developer credentials or distribution certificates in GitHub Actions.
- **Decision**: Configure GitHub Actions on a macOS-14 runner to prebuild Expo, install CocoaPods, build an unsigned Xcode Release archive (`CODE_SIGNING_ALLOWED=NO`), and package a valid `Payload/KuroStop.app` IPA artifact.
- **Consequences**:
  - Zero credential exposure in CI.
  - Reproducible, automated iOS Release artifact generation.
  - Sideload signing is performed by the user's local utility during physical installation.
