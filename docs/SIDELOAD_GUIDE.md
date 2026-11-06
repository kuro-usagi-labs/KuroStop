# KuroStop iOS Sideloading Guide

## 1. Important Understanding: Unsigned IPAs & iOS Sideloading

An **unsigned IPA** cannot be installed on a stock iPhone directly through AirDrop or Safari. iOS requires all executables to be signed with a valid cryptographic signature before running.

The GitHub Actions workflow builds an **unsigned IPA** so that you do not need to share Apple Developer certificates or private keys with GitHub. Instead, your personal sideloading tool (such as Sideloadly, AltStore, or SideStore) signs the IPA using your personal Apple ID during installation.

---

## 2. Step-by-Step Installation

### Step 1: Download the Unsigned IPA Artifact
1. Go to your GitHub repository > **Actions** > select the completed run of **Build Unsigned iOS Release IPA**.
2. Download the artifact named **`KuroStop-Unsigned-IPA`**.
3. Extract the downloaded ZIP file to reveal `KuroStop-unsigned.ipa` and `KuroStop-unsigned.ipa.sha256`.
4. (Optional) Verify checksum in terminal:
   ```bash
   shasum -a 256 KuroStop-unsigned.ipa
   ```

---

### Step 2: Sideloading via Sideloadly (Recommended for Mac & Windows)

1. Download and install **Sideloadly** from [sideloadly.io](https://sideloadly.io/).
2. Connect your iPhone to your computer using a USB cable (or ensure Wi-Fi sync is enabled).
3. Open Sideloadly:
   - Your connected device should appear under **Device**.
   - Enter your personal **Apple ID** (used strictly for generating the local 7-day developer certificate).
4. Drag and drop `KuroStop-unsigned.ipa` into the Sideloadly window.
5. Click **Start**.
6. Enter your Apple ID password / 2FA code when prompted by Sideloadly.
7. Wait until the status displays **Done**. KuroStop will appear on your iPhone home screen.

---

### Step 3: Trust the Developer Certificate on iOS

The first time you install an app signed with a personal Apple ID:
1. On your iPhone, open **Settings** (*Pengaturan*).
2. Go to **General** > **VPN & Device Management** (*Umum > Manajemen VPN & Perangkat*).
3. Tap on your Apple ID under **Developer App** (*Aplikasi Pengembang*).
4. Tap **Trust [Your Apple ID]** (*Percayai*).
5. (iOS 16+) Go to **Settings > Privacy & Security > Developer Mode** and toggle **Developer Mode** to **ON**, then restart your device when prompted.

---

### Step 4: Sideloading via AltStore / SideStore

1. **AltStore**:
   - Open AltStore on your iPhone.
   - Go to **My Apps** > tap the **+** button in the top left corner.
   - Select `KuroStop-unsigned.ipa` from your Files app.
   - AltStore will sign and install the app.
2. **SideStore**:
   - Open SideStore on your iPhone.
   - In **My Apps**, tap **+** and choose `KuroStop-unsigned.ipa`.
   - SideStore handles signing over on-device WireGuard VPN.

---

## 3. Preserving Your Data Across Updates

1. **Never delete the app before updating**: When a new version is released, sideload the new IPA **over** the existing installation. As long as the bundle identifier remains `com.kurostop.personal` and the same Apple ID is used, iOS preserves the internal SQLite database.
2. **Always export a backup first**: Open *KuroStop > Lainnya > Pengaturan > Cadangan Data (Offline Backup)* and export your data before updating.
3. **7-Day Expiration for Free Apple IDs**: Apps signed with a free Apple ID expire after 7 days. Refresh them via AltStore/SideStore/Sideloadly weekly to keep the app operational without reinstallation.
