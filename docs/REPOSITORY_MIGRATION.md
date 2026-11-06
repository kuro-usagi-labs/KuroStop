# KuroStop — Dokumentasi Migrasi & Pergantian Repositori (Phase 5)

## 1. Ikhtisar Migrasi

Pada Phase 5, repositori GitHub `https://github.com/kuro-usagi-labs/KuroStop` disinkronkan secara total dengan mengganti kode warisan (*legacy codebase*) generasi awal dengan basis kode definitif **KuroStop Phase 4 ("Lembar")**.

Pergantian ini dilakukan tanpa menghapus repositori GitHub, tanpa memotong riwayat Git, dan tanpa *force push* yang merusak cabang `main`.

---

## 2. Pengarsipan Proyek Warisan (*Pre-Replacement Archive*)

Sebelum berkas warisan dihapus, seluruh pohon kode `main` lama telah diamankan ke cabang arsip terdedikasi:

- **Target Repositori**: `kuro-usagi-labs/KuroStop`
- **Cabang Arsip**: `archive/pre-lembar-phase5-20261107`
- **Commit SHA Asli**: `470ed99c0a200675129d3a7c1fcb737aca82c54a`
- **Pesan Commit Asli**: `refactor(ui): complete Apple-grade UI overhaul, zero emojis, precision vector icons, and living caustic orb`
- **Verifikasi Remote**: Terkonfirmasi aktif dan dapat diakses di `https://github.com/kuro-usagi-labs/KuroStop/tree/archive/pre-lembar-phase5-20261107`

---

## 3. Matriks Berkas yang Dihapus vs Berkas Definitif Baru

### Berkas yang Dihapus (*Obsolete / Superseded*):
1. **Konfigurasi & Skrip Usang**:
   - `.claude/settings.json` — Dihapus permanen (kepatuhan mutlak larangan *claude-mem*).
   - `.github/workflows/ios-build.yml` — Digantikan oleh `build-ios-unsigned.yml`.
   - `eas.json` & `preview.html` & `jest.config.js` — Tidak lagi relevan dengan arsitektur Expo SDK 58 + Node Test Runner.
2. **Entri Root & Navigasi Usang**:
   - `App.tsx` & `index.ts` — Digantikan oleh struktur file-system Expo Router `src/app/`.
3. **Komponen Orb & Animasi Usang**:
   - `src/animations/LivingOrb.tsx` & `AtmosphereDecay.tsx` — Dihapus demi visual resmi "Lembar" (kertas porselen `#F2F3F0` & tinta sumi).
   - `src/components/dashboard/HeroOrbSection.tsx` — Digantikan oleh `DaySheet.tsx`.
4. **Layar & State Lama**:
   - `src/screens/*` (8 layar React Navigation lama) — Digantikan oleh 10 layar Expo Router di `src/app/`.
   - `src/stores/useKuroStore.ts` — Digantikan oleh `src/data/store.tsx` berbasis React Context + SQLite.
   - `src/database/*` & `src/features/*` — Digantikan oleh `src/db/`, `src/domain/`, dan `src/repositories/`.

### Berkas Definitif Baru (*Authoritative Implementation*):
1. **Sistem Desain & Tampilan Lembar**:
   - `src/components/consequence/DaySheet.tsx` (kartu konsekuensi 4 zona: clear, warning, danger, critical).
   - `src/components/ui/controls.tsx`, `layout.tsx`, `primitives.tsx`, `toast.tsx`.
   - `src/theme/tokens.ts` & `motion.ts`.
2. **Lapisan Database & Persistensi**:
   - `src/db/expo-sqlite.adapter.ts` & `node-sqlite.adapter.ts` (arsitektur antarmuka ganda).
   - `src/db/migrations.ts` & `schema.ts`.
   - `src/repositories/*` (smoking, pmo, sleep, finance, settings, urge, checkin).
3. **Logika Domain Murni**:
   - `src/domain/consequence.ts`, `finance.ts`, `sleep.ts`, `streaks.ts`, `validation.ts`.
4. **Fitur Native iOS & Keamanan**:
   - `src/lib/biometrics.ts` (Face ID / Touch ID / Passcode fallback via `expo-local-authentication`).
   - `src/components/security/AppLockProvider.tsx` (Layar kunci biometrik & App Switcher Multitasking Shield).
   - `src/lib/notifications.ts` (Notifikasi lokal tidur, refleksi harian, rangkuman mingguan).
   - `src/lib/backup.ts` (Cadangan offline JSON dengan checksum FNV-1a & pemulihan atomik transaksional).
5. **Rangkaian Uji Otomatis & Alur CI/CD**:
   - 67 pengujian otomatis di direktori `test/`.
   - `.github/workflows/build-ios-unsigned.yml` (menggunakan runner `macos-26`, Node 22, dan Xcode kompilasi unsigned IPA).

---

## 4. Keamanan Data & Kebersihan Repositori

- Tidak ada kredensial, sertifikat Apple Developer, atau kunci privat (*p12/mobileprovision*) yang dimasukkan ke repositori.
- Berkas database lokal (`*.db`, `*.db-wal`, `*.db-shm`), cadangan JSON (`kurostop-backup-*.json`), dan artefak build (`build/`, `*.ipa`) dikecualikan secara ketat dalam `.gitignore`.
- Seluruh riwayat komit tetap utuh dan transparan.
