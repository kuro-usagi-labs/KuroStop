# KuroStop — Every Choice Leaves a Mark

> **A premium, personal-use iOS discipline system for quitting cigarettes, PMO, and late-night scrolling.**  
> *Bahasa Indonesia-first • Offline-first • Private • Light-Theme Consequence Engine*

---

## 1. Product Philosophy & Identity

KuroStop is **not** a generic habit tracker, gamified motivational app, or fitness counter.

It is built on a single core axiom:

**YOUR ACTIONS VISIBLY CHANGE YOUR ENVIRONMENT.**

Every recorded action has an immediate visual consequence inside the application. When you remain disciplined, KuroStop presents a pristine, mint-tinted light canvas with a calm, breathing organic orb. The more you violate your personal targets, the more intimidating and corrupted the interface becomes:

1. **CLEAR (Zona Bersih)**: Light background (`#F8FAF9`), gentle mint atmosphere (`#54C98A`), calm 3.5s breathing orb, soothing haptic feedback.
2. **WARNING (Zona Waspada)**: Soft amber transition (`#E9AA40`), tighter pulse, warning ring around violated habits.
3. **DANGER (Zona Bahaya)**: Orange flares (`#E76B40`), asymmetrical tension pulse, atmospheric edge tension.
4. **CRITICAL (Zona Kritis)**: Visceral deep-red tension (`#D83D52` / `#922539`), heavy tension pulse, screen-edge fracture vignette, direct harsh accountability messages.

At the next local calendar midnight boundary, the visual environment resets fresh and clean, while all underlying historical records remain stored permanently.

---

## 2. Core Habit Modules

### A. Merokok & Pengeluaran Rokok (Smoking)
- Quick log: `+1 Batang`, custom count stepper, personal triggers, and notes.
- Dedicated purchase tracker: Packs (`bungkus`) vs Sticks (`ketengan`), price presets (Rp 20.000, Rp 25.000, Rp 28.000, Rp 35.000, Rp 42.000) or custom price.
- Honest separation between *buying* cigarettes and *smoking* them.

### B. Pornografi & Masturbasi (PMO)
- Tracks individual event types: Pornografi Saja, Masturbasi Saja, or Sesi Lengkap (PMO).
- Prevents double-counting combined sessions.
- Private, direct Indonesian terminology.
- Personal trigger logging: Sendirian di Kamar, Larut Malam, Media Sosial, Kelelahan, Bosan.

### C. Tidur & Begadang (Sleep)
- Target bedtime (e.g. `23:00`) and target wake time (e.g. `06:00`).
- Simple manual actions: *"Aku Mau Tidur"* & *"Aku Sudah Bangun"*.
- Calculates lateness minutes past bedtime. Provisional warning if active on phone after target bedtime.
- Night sessions crossing midnight correctly belong to the originating sleep night date.

---

## 3. Kalkulator Keuangan Rokok (Financial Engine)

All calculations strictly use **integer Indonesian Rupiah (IDR)** to eliminate IEEE-754 floating-point inaccuracies.

- **Actual Spending**: $\text{actualSpending} = \sum(\text{valid purchase totals})$
- **Baseline Spending**: $\text{baselineExpected} = \text{dailyBaselineRate} \times \text{trackedDaysCount}$
- **Avoided Spending (Penghematan yang Dihindari)**:
  $$\text{avoidedSpending} = \text{baselineExpected} - \text{actualSpending}$$
  - Accurately supports **negative values** if the user overspends their baseline.
  - Honestly labeled as *"Perkiraan pengeluaran yang dihindari"*, never fake cash-in-hand.
- Monthly breakdown reports and 1-year projections.

---

## 4. Brutal Honesty Engine

Configurable accountability intensity:
- **Normal**: Netral & objektif berbasis angka.
- **Strict**: Tegas & berfokus pada komitmen.
- **Brutal (Default)**: Menghadapkanmu langsung pada kenyataan keputusanmu tanpa kompromi.

---

## 5. Interupsi Dorongan ("Gue Lagi Pengen...")

A distraction-free, 1-tap interruption modal:
- Choose habit: Rokok, PMO, or Begadang.
- **90-Second Guided Breathing**: Box breathing animation (Tarik Napas 4s, Tahan 4s, Hembuskan 4s, Tenang 2s).
- **5-Minute Delay Challenge**: Scientific delay timer allowing impulsive dopamine spikes to subside.
- **"Aku Berhasil Menahan"**: Logs a resisted urge victory.
- **"Aku Khilaf (Catat)"**: Logs the event honestly.

---

## 6. Architecture & Tech Stack

- **Framework**: Expo SDK 58 / React Native 0.88
- **Language**: TypeScript (strict mode, zero errors)
- **State Management**: Zustand
- **Local Database**: Expo SQLite with indexed SQL tables
- **Motion & Physics**: React Native Reanimated & Gesture Handler
- **Haptics**: Expo Haptics
- **Testing**: Jest & ts-jest (22 unit tests passing)

```text
KuroStop/
├── src/
│   ├── animations/          # LivingOrb, AtmosphereDecay
│   ├── components/
│   │   ├── common/          # Button, Card, Header, Badge, Stepper
│   │   ├── dashboard/       # HeroOrbSection, HabitSummaryCard, QuickActionsRow
│   │   └── modals/          # QuickLogModal, BuyCigarettesModal, UrgeInterruptionModal
│   ├── database/            # schema.ts, database.ts
│   ├── features/
│   │   ├── consequences/    # engine.ts, honestyEngine.ts & tests
│   │   └── finance/         # calculator.ts & tests
│   ├── screens/             # Onboarding, Dashboard, Details, Wallet, History, Settings
│   ├── stores/              # useKuroStore.ts
│   ├── theme/               # colors.ts, typography.ts, spacing.ts, tokens.ts
│   ├── types/               # index.ts
│   └── utils/               # date.ts, currency.ts & tests
├── docs/
│   ├── ARCHITECTURE.md      # Full architecture & state machine diagrams
│   ├── DECISIONS.md         # ADRs (Visual direction, Scoring, Finance)
│   ├── PROGRESS.md          # Implementation progress tracking
│   ├── DESIGN_AUDIT.md      # Apple HIG & Huashu Design verification
│   └── SKILL_VERIFICATION.md # Phase 0 four-repository audit
├── .github/workflows/       # GitHub Actions CI pipeline
├── app.json                 # iOS bundle & config
├── eas.json                 # Expo EAS build configuration
└── package.json
```

---

## 7. Local Development & Testing

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- Expo Go app on iPhone (for wireless preview) OR macOS with Xcode (for local simulator)

### Commands
```bash
# 1. Install dependencies
npm install

# 2. Run TypeScript type-check
npx tsc --noEmit

# 3. Run automated Jest tests
npm test

# 4. Start Expo development server
npx expo start
```

---

## 8. iOS Build & Apple Signing Instructions

KuroStop is configured for internal ad-hoc distribution via **Expo Application Services (EAS Build)**.

### A. Prerequisites for Building an iOS IPA
1. An Apple Developer Account (Individual or Organization) at [developer.apple.com](https://developer.apple.com).
2. Registered iPhone UDID (for ad-hoc provisioning) or TestFlight access.
3. An Expo account at [expo.dev](https://expo.dev).

### B. EAS Build Steps
```bash
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Login to your Expo account
eas login

# 3. Configure iOS project credentials
eas build:configure

# 4. Build an iOS Simulator binary (no Apple developer account required)
eas build --platform ios --profile development

# 5. Build an Ad-Hoc IPA for physical iPhone installation
eas build --platform ios --profile preview
```

### C. Installing on Physical iPhone Without App Store
- Once the `preview` build finishes on EAS servers, scan the generated QR code or download the signed `.ipa` file.
- Install directly via Apple Configurator, Sideloadly, or the EAS install page on Safari.
