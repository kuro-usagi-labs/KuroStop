# KuroStop — Phase 5 Release Audit & CI/CD Pipeline Verification

## 1. Ringkasan Status Rilis

- **Repositori Target**: `kuro-usagi-labs/KuroStop`
- **Cabang Default**: `main`
- **Cabang Arsip Proyek Lama**: `archive/pre-lembar-phase5-20261107` (SHA: `470ed99c0a200675129d3a7c1fcb737aca82c54a`)
- **Cabang Penggantian Definitif**: `phase5/replace-legacy-with-lembar`
- **Arsitektur Aplikasi Baru**:
  - UI/UX: Sistem "Lembar" (Kertas Porselen `#F2F3F0`, aksen tinta sumi, kartu DaySheet reaktif 4 zona, tipografi tabular, Reanimated microinteractions).
  - Navigasi: Expo Router File-system (`src/app/`) dengan 10 layar utama.
  - Persistensi: SQLite lokal murni (tanpa backend/cloud) dengan migrasi idempoten & isolasi atomik.
  - Keamanan Native: Kunci Face ID/Touch ID/Passcode fallback, App Switcher Privacy Shield, mode PMO Cover.
  - Notifikasi Lokal: Pengingat jam tidur, refleksi harian malam, dan evaluasi mingguan.
  - Cadangan Offline: Format JSON `KuroStopBackupV1` dengan hash FNV-1a dan pemulihan transaksional.

---

## 2. Rincian Konfigurasi CI/CD & Perbaikan Runner macOS 26

### Pembaruan Kritis Runner macOS
- **Runner Sebelumnya**: `macos-14` (telah dipensiunkan oleh GitHub pada 2 November 2026).
- **Runner Baru**: `macos-26` (Apple Silicon `arm64`).
- **Versi Node.js**: Node 22 LTS (memenuhi persyaratan resmi Expo SDK 58, di mana Node 20 usang dan Node ganjil tidak didukung).
- **Versi Xcode**: Xcode 26.4+ yang disediakan secara native pada image `macos-26`.

### Tahapan Pipeline Kompilasi Unsigned IPA
1. **Checkout & Setup Node 22**: Mengambil repositori dan menyiapkan runtime Node 22 dengan *cache dependency*.
2. **Locked Dependency Installation**: `npm ci` menggunakan `package-lock.json` yang terverifikasi.
3. **Validasi Statis**:
   - `npx tsc --noEmit` (0 kesalahan tipe).
   - `npm test` (67 uji otomatis lulus 100%).
4. **Diagnostik Lingkungan**: Menampilkan versi sistem (`sw_vers`), versi node (`node --version`), serta instalasi dan SDK Xcode (`xcodebuild -version`, `xcodebuild -showsdks`).
5. **Validasi Konfigurasi Expo**: `npx expo config --type public` memastikan plugin native dan bundle identifier `com.kurostop.personal` valid.
6. **Prebuild Native**: `npx expo prebuild --platform ios --clean` menghasilkan proyek Xcode native bersih di folder `ios/`.
7. **Instalasi CocoaPods**: `pod install` di direktori `ios/`.
8. **Kompilasi & Pengarsipan Rilis Unsigned**:
   - Skema: `KuroStop`
   - Konfigurasi: `Release`
   - SDK: `iphoneos`
   - Argumen Penandatanganan:
     ```bash
     CODE_SIGNING_ALLOWED=NO
     CODE_SIGNING_REQUIRED=NO
     CODE_SIGN_IDENTITY=""
     AD_HOC_CODE_SIGNING_ALLOWED=YES
     ```
9. **Pengemasan IPA Standar**:
   - Memindahkan `KuroStop.app` ke dalam struktur `Payload/KuroStop.app`.
   - Mengompresi menjadi `KuroStop-unsigned.ipa` menggunakan opsi `zip -r -y`.
   - Menghasilkan SHA-256 hash di `KuroStop-unsigned.ipa.sha256`.
10. **Verifikasi Integritas IPA**:
    - Memeriksa keberadaan berkas `Info.plist` dan biner `KuroStop`.
    - Memeriksa arsitektur biner (`arm64`).
    - Memastikan tidak ada *embedded provisioning profile* yang tertinggal.
11. **Unggah Artefak**: Mengunggah berkas `KuroStop-unsigned.ipa` dan `KuroStop-unsigned.ipa.sha256` dengan nama artefak `KuroStop-Unsigned-IPA`.

---

## 3. Hasil Pengujian Unit & Integrasi

Semua 67 pengujian otomatis berjalan sukses:
- Database Migrations & Constraints: 5/5 PASS
- Offline Backup & Restore Integrity: 4/4 PASS
- Consequence Engine Pure Function: 8/8 PASS
- Financial Engine Calculations: 3/3 PASS
- Sleep Engine Cross-Midnight Attribution: 2/2 PASS
- Streak Engine with Strict Verification: 1/1 PASS
- Validation Guards: 4/4 PASS
- Finance Baseline Effective Date & Period Eligibility: 3/3 PASS
- Urge Outcome Preservation & Statistics: 2/2 PASS
- Habit Verification Integrity: 5/5 PASS
- Data Safety & Persistence Integrity: 6/6 PASS
- Smoking Vertical Slice (End-to-End): 5/5 PASS
- Repositories Integration Suite (Real SQLite): 6/6 PASS

Total: **67 tests passing (0 failures, 0 skipped, 0 todo)**.
