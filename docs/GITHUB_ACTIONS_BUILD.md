# GitHub Actions — Unsigned iOS Release IPA CI/CD

## 1. Overview

KuroStop uses GitHub Actions on a GitHub-hosted macOS runner to produce a clean, unsigned iOS Release `.ipa` artifact suitable for personal sideloading.
- **Workflow File**: `.github/workflows/build-ios-unsigned.yml`
- **Target Platform**: Physical iOS Devices (`iphoneos`, `arm64`)
- **Code Signing**: Explicitly disabled (`CODE_SIGNING_ALLOWED=NO`, `CODE_SIGNING_REQUIRED=NO`)
- **Apple Developer Credentials**: **Zero required**. No certificates, provisioning profiles, or API keys needed.
- **Runner**: `macos-26` (Apple Silicon M-series) with Xcode 26.4+ and Node.js 22 LTS (Expo SDK 58 requirement).

---

## 2. CI/CD Architecture & Pipeline

```text
GitHub Push (tag: v*) / Manual Dispatch
               │
               ▼
GitHub-hosted macOS-26 Runner (Apple Silicon)
               │
         Node.js 22 Setup & npm ci
               │
    TypeScript Typecheck & Test Suite (67 tests)
               │
    Environment Diagnostics (Xcode, sw_vers, SDKs)
               │
    Expo Configuration Validation
               │
    npx expo prebuild --platform ios --clean
               │
    CocoaPods Installation (pod install)
               │
    Xcode Release Archive
    -configuration Release -sdk iphoneos
    CODE_SIGNING_ALLOWED=NO CODE_SIGN_IDENTITY=""
               │
    Packaging: Payload/KuroStop.app -> KuroStop-unsigned.ipa
               │
    Checksum Generation: KuroStop-unsigned.ipa.sha256
               │
    Validation: Info.plist, Executable, arm64, No mobileprovision
               │
    Upload Artifact: KuroStop-Unsigned-IPA
```

---

## 3. How to Trigger the Build

### Option A: Manual Trigger (GitHub Web Interface)
1. Go to your GitHub repository for KuroStop.
2. Click on the **Actions** tab.
3. In the left sidebar, select **Build Unsigned iOS Release IPA**.
4. Click the **Run workflow** dropdown on the right.
5. Keep `Release` selected and click the green **Run workflow** button.

### Option B: Tag Release Trigger
Pushing any Git tag matching `v*` (e.g. `v1.0.0`) automatically kicks off the workflow:
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## 4. Downloading the Built Artifact
1. Once the Actions run finishes (usually 8-15 minutes), open the run summary.
2. Scroll to the bottom to find **Artifacts**.
3. Download `KuroStop-Unsigned-IPA.zip`.
4. Extract it to obtain:
   - `KuroStop-unsigned.ipa` (the unsigned application)
   - `KuroStop-unsigned.ipa.sha256` (the integrity verification checksum)

See `docs/SIDELOAD_GUIDE.md` for complete installation instructions using Sideloadly, AltStore, or SideStore.
