# KuroStop — Every Choice Leaves a Mark

**KuroStop** adalah aplikasi disiplin pribadi berarsitektur *offline-first* untuk iOS (iPhone), dirancang khusus untuk membantu pengguna menghentikan kebiasaan merokok, mengelola dorongan pornografi dan masturbasi (PMO), serta mendisiplinkan jam tidur malam melalui sistem konsekuensi visual deterministik bernama **"Lembar" (Porcelain Paper & Sumi Ink)**.

---

## 🌟 Pilar Utama Aplikasi

1. **Local-First & Privasi Mutlak**:
   - Seluruh data aktivitas disimpan secara lokal di perangkat iPhone menggunakan database relasional **SQLite (WAL Mode)**.
   - Tanpa server backend, tanpa registrasi akun, tanpa cloud sync, dan **nol telemetri / pelacak pihak ketiga**.

2. **Identitas Visual "Lembar"**:
   - Tema *premium light* terinspirasi dari kertas porselen (`#F2F3F0`) dan tinta sumi.
   - Kartu konsekuensi harian (*DaySheet*) dengan 4 zona deterministik: *Bersih*, *Awas*, *Bahaya*, dan *Kritis*.
   - Transisi pegas responsif menggunakan React Native Reanimated dan umpan balik haptic iOS.

3. **Keamanan & Fitur Native iOS**:
   - **Kunci Biometrik (Face ID / Touch ID)** dengan fallback kode sandi perangkat via `expo-local-authentication`.
   - **App Switcher Privacy Shield**: Perlindungan otomatis layar multitasking dari intipan orang lain.
   - **Penyelubungan PMO (`pmoCover`)**: Masking rincian sensitif pada kartu ringkasan harian.
   - **Notifikasi Lokal**: Pengingat waktu tidur, check-in lembar malam, dan evaluasi mingguan via `expo-notifications`.

4. **Cadangan & Pemulihan Mandiri (Offline Backup)**:
   - Ekspor seluruh basis data ke berkas JSON terstruktur dengan verifikasi checksum FNV-1a.
   - Pemulihan transaksional atomik dengan proteksi *rollback* otomatis jika integritas berkas gagal.

5. **Distribusi Sideloading Mandiri & CI/CD**:
   - Alur kerja otomatis **GitHub Actions** (`.github/workflows/build-ios-unsigned.yml`) pada runner `macos-26` untuk memproduksi berkas **Release IPA Unsigned**.
   - Siap dipasang ke iPhone fisik menggunakan Sideloadly, AltStore, atau SideStore tanpa mengekspos sertifikat Apple Developer di CI.

---

## 🚀 Perintah Pengembangan & Pengujian

### 1. Menjalankan Server Pengembangan
```bash
npm install
npx expo start --ios
```

### 2. Menjalankan Rangkaian Uji Otomatis (67 Tests)
```bash
npm test
```

### 3. Pemeriksaan Tipe TypeScript
```bash
npx tsc --noEmit
```

### 4. Pemeriksaan Linting
```bash
npm run lint
```

---

## 📚 Indeks Dokumentasi Teknis

- [PHASE5_RELEASE_AUDIT.md](docs/PHASE5_RELEASE_AUDIT.md): Laporan audit rilis Phase 5 & verifikasi CI/CD.
- [REPOSITORY_MIGRATION.md](docs/REPOSITORY_MIGRATION.md): Dokumentasi migrasi dan pergantian repositori dari legacy ke Lembar.
- [IOS_DEVICE_TESTS.md](docs/IOS_DEVICE_TESTS.md): Matriks verifikasi runtime perangkat iOS & batasan perangkat keras fisik.
- [PHASE4_AUDIT.md](docs/PHASE4_AUDIT.md): Laporan audit & implementasi Fase 4.
- [IOS_NATIVE_FEATURES.md](docs/IOS_NATIVE_FEATURES.md): Panduan fitur native iOS, biometrik, dan privasi.
- [BACKUP_RESTORE.md](docs/BACKUP_RESTORE.md): Spesifikasi format cadangan dan pemulihan data.
- [GITHUB_ACTIONS_BUILD.md](docs/GITHUB_ACTIONS_BUILD.md): Dokumentasi alur kerja kompilasi IPA unsigned (`macos-26`).
- [SIDELOAD_GUIDE.md](docs/SIDELOAD_GUIDE.md): Panduan instalasi sideload via Sideloadly & AltStore.
- [ARCHITECTURE.md](docs/ARCHITECTURE.md): Arsitektur berlapis local-first KuroStop.
- [DECISIONS.md](docs/DECISIONS.md): Catatan keputusan arsitektural (ADR-001 hingga ADR-011).
- [BUSINESS_RULES.md](docs/BUSINESS_RULES.md): Formula matematika konsekuensi, finansial integer IDR, dan streak.
- [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md): Skema lengkap 8 tabel SQLite.
