# KuroStop — Verifikasi Perangkat iOS & Runtime (Phase 5)

## 1. Pendahuluan & Prinsip Kejujuran Teknis

Dokumen ini mencatat matriks verifikasi fungsionalitas aplikasi KuroStop pada lingkungan runtime iOS. Sesuai dengan instruksi kejujuran teknis, pengujian yang membutuhkan sensor perangkat keras fisik (seperti kamera TrueDepth Face ID atau pengantaran notifikasi push ke APNs/lockscreen fisik) diberi label status yang jelas (**PASSED** vs **BLOCKED - MEMERLUKAN HARDWARE FISIK**) dan tidak dipalsukan.

---

## 2. Matriks Pengujian Fungsionalitas & Runtime

| Fitur / Alur Kerja | Lingkungan Uji | Status | Catatan / Hasil Verifikasi |
| :--- | :--- | :--- | :--- |
| **Cold Launch & Inisialisasi SQLite** | Node SQLite Harness & Expo Prebuild Native | **PASSED** | Migrasi tabel v1 dieksekusi secara idempoten, skema terverifikasi, pengaturan default tersimpan. |
| **Alur Onboarding** | Unit Logic & UI Typecheck | **PASSED** | Validasi target rokok, jam tidur, harga rokok integer, dan mode ketegasan konsekuensi. |
| **Pencatatan Rokok (+1 & Batang Khusus)** | Integration Suite (`vertical_slice.test.ts`) | **PASSED** | Tercatat ke SQLite, memicu pergeseran zona konsekuensi reaktif secara instan. |
| **Pembatalan Atomik (*Atomic Undo*)** | Integration Suite (`data_safety.test.ts`) | **PASSED** | Menghapus record spesifik dari SQLite dan memulihkan kartu DaySheet ke zona sebelumnya. |
| **Pencatatan Sesi PMO** | Integration Suite (`repositories.test.ts`) | **PASSED** | Menolak jenis PMO tidak valid, menghitung durasi dan pemicu (*trigger*), memperbarui status abstinensia. |
| **Pelacakan Tidur Lintas Tengah Malam** | Domain Test (`engines.test.ts`) | **PASSED** | Tidur pukul 01:30 AM diatribusikan secara deterministik ke malam sebelumnya. |
| **Kalkulasi Keuangan & Baseline Jujur** | Domain Test (`finance_baseline.test.ts`) | **PASSED** | Integer IDR, penghematan baseline hanya dihitung sejak tanggal efisiensi baseline disetel. |
| **Reaktivitas Kartu DaySheet** | Pure Function Engine (`engines.test.ts`) | **PASSED** | Evaluasi murni memetakan skor pelanggaran ke 4 zona (*Clear, Warning, Danger, Critical*). |
| **Refleksi Harian (Daily Check-in)** | Integration Suite (`verified_compliance.test.ts`) | **PASSED** | Check-in eksplisit memverifikasi hari untuk rekor kepatuhan berturut-turut (*streak*). |
| **Ekspor Cadangan Data Offline (JSON)** | Backup Suite (`backup_restore.test.ts`) | **PASSED** | Menghasilkan format `KuroStopBackupV1` lengkap 6 tabel dengan hash checksum FNV-1a. |
| **Pemulihan Transaksional Atomik** | Backup Suite (`backup_restore.test.ts`) | **PASSED** | Berhasil memulihkan seluruh tabel; *rollback* terverifikasi 100% jika terjadi korupsi berkas. |
| **Kunci Biometrik (Face ID / Touch ID)** | Simulasi API & Tipe Native | **BLOCKED - MEMERLUKAN HARDWARE FISIK** | Logika pemanggilan `LocalAuthentication.authenticateAsync` terpasang. Diperlukan iPhone fisik dengan sensor biometrik aktif. Fallback kode sandi perangkat tersedia. |
| **App Switcher Multitasking Shield** | State Listener (`AppLockProvider.tsx`) | **PASSED** (State Logic) / **BLOCKED** (Render Frame iOS) | Logika `AppState` menyembunyikan tampilan saat status beralih ke `inactive`/`background`. Verifikasi snapshot riil di App Switcher memerlukan perangkat fisik. |
| **Penyamaran Konten PMO (`pmoCover`)** | Frontend Store Selector | **PASSED** | Teks dan angka sensitif disamarkan dengan label netral saat mode aktif. |
| **Notifikasi Lokal Terjadwal** | Modul Native (`src/lib/notifications.ts`) | **BLOCKED - MEMERLUKAN HARDWARE FISIK** | Jadwal 3 pengingat (tidur -30m, check-in 21:30, mingguan 20:00) terdaftar dengan payload netral. Pengujian visual di Layar Terkunci memerlukan iPhone fisik. |
| **Kompilasi Unsigned IPA** | GitHub Actions (`macos-26` runner) | **PASSED DI CI** | Proyek Expo dikompilasi dengan Xcode Release unsigned menjadi berkas `KuroStop-unsigned.ipa`. |
| **Instalasi Sideloading Mandiri** | Sideloadly / AltStore / SideStore | **BLOCKED - MEMERLUKAN HARDWARE FISIK** | Mengharuskan pengguna mengunduh IPA dan menandatanganinya dengan Apple ID pribadi di komputer pengguna. |

---

## 3. Batasan & Panduan Pengguna

1. **Sideload Signature Expiry**: Aplikasi yang di-sideload menggunakan Apple ID gratis memiliki masa berlaku sertifikat 7 hari dan harus di-refresh secara berkala (otomatis via SideStore/AltStore, atau manual via Sideloadly).
2. **Kemandirian Data**: Seluruh data tersimpan secara lokal di sandbox aplikasi iOS. Pengguna disarankan mengekspor berkas cadangan JSON sebelum melakukan pembaruan versi atau instalasi ulang.
