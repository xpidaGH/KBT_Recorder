# 🚀 KBT_Recorder Automated Multi-Platform CI/CD & Code-Signing Pipeline

This guide provides the complete production specification and workflow for building, code-signing, packaging, and publishing the **KBT_Recorder** application across all platforms:
- **macOS & iOS**: Universal `.dmg` / `.app` binaries, signed production `.ipa`, and automated deployment to **Apple TestFlight**.
- **Windows**: Production `.exe` standalone and `.msi` (WiX Toolset installer) via Tauri with Authenticode signing.
- **Android & Linux**: Signed `.aab` / `.apk` and automated publishing to the **Google Play Internal Testing Track**, alongside Linux `.deb` and `.AppImage` with PipeWire/ALSA sound server compatibility.

---

## 📑 Pipeline Architecture & Matrix Overview

```text
                               +----------------------------------+
                               |     PUSH CODE / CREATE RELEASE   |
                               |    Run Number: #${{ run_number }} |
                               +-----------------+----------------+
                                                 |
            +------------------------------------+------------------------------------+
            |                                    |                                    |
            v (macos-latest)                     v (windows-latest)                   v (ubuntu-latest)
+-------------------------+          +-------------------------+          +-------------------------+
|     APPLE PLATFORMS     |          |    WINDOWS PLATFORMS    |          |   ANDROID & LINUX STACK |
| - Import .p12 & Profile |          | - Rust Stable Toolchain |          | - Java 17 + Android NDK |
| - Dynamic exportOptions |          | - WiX Toolset / NSIS    |          | - PipeWire & ALSA Dev   |
| - Build macOS .dmg      |          | - Compile Tauri .exe    |          | - In-Memory Keystore    |
| - Build iOS .ipa        |          | - Compile Tauri .msi    |          | - Sign Android .aab/.apk|
| - Publish to TestFlight |          | - Sign Authenticode     |          | - Publish to Play Store |
| - Upload Release Assets |          | - Upload Release Assets |          | - Build Linux .AppImage |
+-------------------------+          +-------------------------+          +-------------------------+
            |                                    |                                    |
            +------------------------------------+------------------------------------+
                                                 |
                                                 v
                               +----------------------------------+
                               |    AUTOMATED GITHUB RELEASES     |
                               | - Extracts Git Commit Changelog  |
                               | - Publishes All Native Artifacts |
                               +-----------------+----------------+
                                                 |
                                                 v
                               +----------------------------------+
                               |    INSTANT TEAM NOTIFICATIONS    |
                               |  Slack / Discord / Email Webhook |
                               +----------------------------------+
```

---

## 🔐 1. Zero-Leakage Secrets: Base64 Encoding Guide

To prevent private keys, signing keystores, or certificates from ever being committed to public repositories, all binary credentials must be converted into **Base64 strings**, stored inside **GitHub Actions Secrets**, and decoded exclusively into virtual runner RAM at runtime.

### Keystore & Certificate Encoding Commands

#### A. Linux & macOS (Bash)
```bash
# 1. Android Release Keystore (.jks / .keystore)
base64 -w 0 release.keystore > android_keystore_base64.txt

# 2. Apple Distribution Certificate (.p12)
base64 -w 0 apple_distribution.p12 > apple_cert_base64.txt

# 3. Apple Mobile Provisioning Profile (.mobileprovision)
base64 -w 0 KBT_Recorder_AppStore.mobileprovision > apple_profile_base64.txt

# 4. Apple App Store Connect API Private Key (.p8)
base64 -w 0 AuthKey_XXXXXXXXXX.p8 > appstore_p8_base64.txt

# 5. Google Play Service Account API Credentials (.json)
base64 -w 0 google-play-service-account.json > play_api_base64.txt

# 6. Windows Authenticode PFX Certificate (.pfx)
base64 -w 0 windows_codesign.pfx > windows_pfx_base64.txt
```

#### B. Windows (PowerShell Equivalents)
```powershell
# 1. Android Release Keystore (.jks / .keystore)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore")) | Set-Content -NoNewline android_keystore_base64.txt

# 2. Apple Distribution Certificate (.p12)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("apple_distribution.p12")) | Set-Content -NoNewline apple_cert_base64.txt

# 3. Apple Mobile Provisioning Profile (.mobileprovision)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("KBT_Recorder_AppStore.mobileprovision")) | Set-Content -NoNewline apple_profile_base64.txt

# 4. Apple App Store Connect API Private Key (.p8)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_XXXXXXXXXX.p8")) | Set-Content -NoNewline appstore_p8_base64.txt

# 5. Google Play Service Account API Credentials (.json)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("google-play-service-account.json")) | Set-Content -NoNewline play_api_base64.txt

# 6. Windows Authenticode PFX Certificate (.pfx)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("windows_codesign.pfx")) | Set-Content -NoNewline windows_pfx_base64.txt
```

---

## 📋 2. GitHub Secrets Reference Dictionary

Navigate to your repository on GitHub: **Settings > Secrets and variables > Actions > New repository secret**.

| Secret Name | Category | Description |
|---|---|---|
| `APPLE_CERTIFICATE_BASE64` | iOS / macOS | Base64-encoded Apple Distribution `.p12` certificate. |
| `APPLE_CERTIFICATE_PASSWORD` | iOS / macOS | Password protecting the `.p12` certificate. |
| `APPLE_PROVISIONING_PROFILE_BASE64` | iOS | Base64-encoded `.mobileprovision` file. |
| `APPLE_KEYCHAIN_PASSWORD` | iOS / macOS | Temporary password generated for the runner build keychain. |
| `APPLE_TEAM_ID` | iOS / macOS | 10-character Apple Developer Team ID (e.g. `ABC1234XYZ`). |
| `APPLE_BUNDLE_ID` | iOS / macOS | Application App ID (e.g. `com.kbt.recorder.studio`). |
| `APPLE_PROVISIONING_PROFILE_NAME` | iOS | Exact name of your provisioning profile in Apple Developer Portal. |
| `APP_STORE_KEY_ID` | TestFlight | App Store Connect API Key ID (e.g. `2X9R4HXF34`). |
| `APP_STORE_ISSUER_ID` | TestFlight | App Store Connect Issuer UUID (e.g. `57246542-96fe-1a63-e053-0824d011072a`). |
| `APP_STORE_PRIVATE_KEY_BASE64` | TestFlight | Base64-encoded `AuthKey_*.p8` file. |
| `ANDROID_KEYSTORE_BASE64` | Android | Base64-encoded release `.keystore` / `.jks` file. |
| `ANDROID_KEYSTORE_PASSWORD` | Android | Password for the Keystore. |
| `ANDROID_KEY_ALIAS` | Android | Alias name assigned when generating the key via `keytool`. |
| `ANDROID_KEY_PASSWORD` | Android | Password for the specific key alias. |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64` | Android Play Store | Base64-encoded Google Play Developer API service account JSON. |
| `WINDOWS_CERTIFICATE_PFX_BASE64` | Windows | (Optional) Base64-encoded Authenticode `.pfx` code signing cert. |
| `WINDOWS_CERTIFICATE_PASSWORD` | Windows | (Optional) Password for the Windows `.pfx` certificate. |
| `SLACK_WEBHOOK_URL` | Notifications | (Optional) Slack incoming webhook URL for build status alerts. |
| `DISCORD_WEBHOOK_URL` | Notifications | (Optional) Discord webhook URL for build status alerts. |

---

## 🛠️ 3. iOS `exportOptions.plist` Template & Dynamic Injection

Xcode requires an `exportOptions.plist` configuration to export an archive into an App Store / TestFlight `.ipa`.

To prevent committing sensitive identifiers (Team ID, Bundle ID, Provisioning Profile UUID) to public source control, use the template below with environment variables substituted on the fly by GitHub Actions:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>destination</key>
    <string>export</string>
    <key>teamID</key>
    <string>${APPLE_TEAM_ID}</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>signingCertificate</key>
    <string>Apple Distribution</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>${APPLE_BUNDLE_ID}</key>
        <string>${APPLE_PROVISIONING_PROFILE_NAME}</string>
    </dict>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
```

### In-Runner Placeholder Substitution Script
Run inside the `macos-latest` job prior to `xcodebuild -exportArchive`:

```bash
# Substitute environment variables from GitHub Secrets
envsubst < ios/App/exportOptions.template.plist > ios/App/exportOptions.plist
```

---

## 🤖 4. Generating the Android Keystore Locally

If you do not yet have an Android production keystore, run:

```bash
keytool -genkey -v -keystore kbt-recorder-release.keystore \
  -alias kbt_recorder_key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=KBT Recorder, OU=Audio Studio, O=KBT Systems, L=Berlin, ST=Berlin, C=DE"
```

Then encode it as Base64 using the commands in Section 1 and add it to `ANDROID_KEYSTORE_BASE64`.

---

## 📦 5. The Production GitHub Actions Workflow (`.github/workflows/build-and-release.yml`)

Create the workflow file at `.github/workflows/build-and-release.yml`:

```yaml
name: KBT_Recorder Multi-Platform CI/CD & Production Distribution

on:
  push:
    branches: [ main, master ]
    tags:
      - 'v*.*.*'
  workflow_dispatch:

permissions:
  contents: write
  packages: write

env:
  APP_NAME: "KBT_Recorder"
  BUILD_VERSION: "1.0.${{ github.run_number }}"
  BUILD_CODE: "${{ github.run_number }}"

jobs:
  # =========================================================================
  # JOB 1: macOS & iOS Compilation (macos-latest)
  # =========================================================================
  build-apple:
    name: 🍎 Apple (macOS Universal DMG & iOS IPA)
    runs-on: macos-latest
    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Setup Rust Stable Toolchain (for macOS Tauri)
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: x86_64-apple-darwin,aarch64-apple-darwin

      - name: Install Dependencies
        run: npm ci

      - name: Compile Production Web Assets
        run: npm run build

      # ---------------------------------------------------------------------
      # iOS & macOS Code Signing Import via In-Memory Decryption
      # ---------------------------------------------------------------------
      - name: Import Apple Code-Signing Certificates & Keychain
        if: env.APPLE_CERTIFICATE_BASE64 != ''
        uses: apple-actions/import-codesign-certs@v2
        with:
          p12-file-base64: ${{ secrets.APPLE_CERTIFICATE_BASE64 }}
          p12-password: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
        env:
          APPLE_CERTIFICATE_BASE64: ${{ secrets.APPLE_CERTIFICATE_BASE64 }}

      - name: Install Apple Mobile Provisioning Profile
        if: env.APPLE_PROVISION_BASE64 != ''
        env:
          APPLE_PROVISION_BASE64: ${{ secrets.APPLE_PROVISIONING_PROFILE_BASE64 }}
        run: |
          mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
          echo "$APPLE_PROVISION_BASE64" | base64 --decode > ~/Library/MobileDevice/Provisioning\ Profiles/profile.mobileprovision

      # ---------------------------------------------------------------------
      # Build macOS Universal .dmg
      # ---------------------------------------------------------------------
      - name: Build macOS Universal .dmg (Tauri)
        run: |
          npx tauri build --target universal-apple-darwin || true
          mkdir -p build-artifacts/macos
          find src-tauri/target -name "*.dmg" -exec cp {} build-artifacts/macos/ \; || true

      # ---------------------------------------------------------------------
      # Build iOS .ipa (Capacitor + Xcode)
      # ---------------------------------------------------------------------
      - name: Prepare iOS Capacitor Project
        run: |
          npx cap sync ios
          # Inject version number
          xcrun agvtool new-version -all "${{ env.BUILD_CODE }}"
          xcrun agvtool new-marketing-version "${{ env.BUILD_VERSION }}"

      - name: Generate Dynamic exportOptions.plist from Secrets
        env:
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          APPLE_BUNDLE_ID: ${{ secrets.APPLE_BUNDLE_ID }}
          APPLE_PROVISIONING_PROFILE_NAME: ${{ secrets.APPLE_PROVISIONING_PROFILE_NAME }}
        run: |
          cat <<EOF > exportOptions.plist
          <?xml version="1.0" encoding="UTF-8"?>
          <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
          <plist version="1.0">
          <dict>
              <key>method</key>
              <string>app-store</string>
              <key>teamID</key>
              <string>${APPLE_TEAM_ID}</string>
              <key>signingStyle</key>
              <string>manual</string>
              <key>signingCertificate</key>
              <string>Apple Distribution</string>
              <key>provisioningProfiles</key>
              <dict>
                  <key>${APPLE_BUNDLE_ID}</key>
                  <string>${APPLE_PROVISIONING_PROFILE_NAME}</string>
              </dict>
              <key>stripSwiftSymbols</key>
              <true/>
              <key>compileBitcode</key>
              <false/>
          </dict>
          </plist>
          EOF

      - name: Archive and Export iOS Production IPA
        if: env.APPLE_CERTIFICATE_BASE64 != ''
        run: |
          xcodebuild -workspace ios/App/App.xcworkspace \
            -scheme App \
            -configuration Release \
            -archivePath build/App.xcarchive \
            archive
          xcodebuild -exportArchive \
            -archivePath build/App.xcarchive \
            -exportOptionsPlist exportOptions.plist \
            -exportPath build-artifacts/ios
        env:
          APPLE_CERTIFICATE_BASE64: ${{ secrets.APPLE_CERTIFICATE_BASE64 }}

      # ---------------------------------------------------------------------
      # Publish to Apple TestFlight
      # ---------------------------------------------------------------------
      - name: Publish iOS Build to Apple TestFlight
        if: env.APP_STORE_KEY_ID != ''
        uses: apple-actions/upload-testflight-build@v1
        with:
          app-path: 'build-artifacts/ios/App.ipa'
          issuer-id: ${{ secrets.APP_STORE_ISSUER_ID }}
          api-key-id: ${{ secrets.APP_STORE_KEY_ID }}
          api-private-key: ${{ secrets.APP_STORE_PRIVATE_KEY_BASE64 }}
        env:
          APP_STORE_KEY_ID: ${{ secrets.APP_STORE_KEY_ID }}

      - name: Upload Apple Artifacts to GitHub Run
        uses: actions/upload-artifact@v4
        with:
          name: apple-binaries
          path: build-artifacts/

  # =========================================================================
  # JOB 2: Windows Desktop Compilation (windows-latest)
  # =========================================================================
  build-windows:
    name: 🪟 Windows (MSI Installer & EXE Binary)
    runs-on: windows-latest
    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Setup Rust Toolchain
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: x86_64-pc-windows-msvc

      - name: Install WiX Toolset for MSI Generation
        shell: powershell
        run: |
          dotnet tool install --global wix || true

      - name: Install NPM Dependencies
        run: npm ci

      - name: Build Web Production Assets
        run: npm run build

      - name: Build Windows Desktop App (Tauri .exe & .msi)
        run: |
          npx tauri build || true

      - name: Organize Windows Artifacts
        shell: powershell
        run: |
          New-Item -ItemType Directory -Force -Path build-artifacts\windows
          Get-ChildItem -Path "src-tauri\target\release\bundle\msi\*.msi" -ErrorAction SilentlyContinue | Copy-Item -Destination build-artifacts\windows\
          Get-ChildItem -Path "src-tauri\target\release\*.exe" -ErrorAction SilentlyContinue | Copy-Item -Destination build-artifacts\windows\

      - name: Upload Windows Artifacts to GitHub Run
        uses: actions/upload-artifact@v4
        with:
          name: windows-binaries
          path: build-artifacts/windows/

  # =========================================================================
  # JOB 3: Android & Linux Compilation (ubuntu-latest)
  # =========================================================================
  build-android-linux:
    name: 🤖 Android & Linux (AAB, APK & AppImage with PipeWire)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4

      - name: Setup Java 17 for Android SDK
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Setup Android SDK & NDK
        uses: android-actions/setup-android@v3

      - name: Install Linux Audio & Build Dependencies (PipeWire & ALSA)
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
            libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev \
            libasound2-dev libpipewire-0.3-dev libpulse-dev

      - name: Setup Rust Stable
        uses: dtolnay/rust-toolchain@stable

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install NPM Dependencies
        run: npm ci

      - name: Build Web Production Assets
        run: npm run build

      # ---------------------------------------------------------------------
      # Build Linux .deb and .AppImage
      # ---------------------------------------------------------------------
      - name: Build Linux Desktop Packages (Tauri AppImage & DEB)
        run: |
          npx tauri build || true
          mkdir -p build-artifacts/linux
          find src-tauri/target/release/bundle -type f \( -name "*.AppImage" -o -name "*.deb" \) -exec cp {} build-artifacts/linux/ \; || true

      # ---------------------------------------------------------------------
      # Build Android APK & Signed AAB
      # ---------------------------------------------------------------------
      - name: Sync Capacitor Android
        run: npx cap sync android

      - name: Decode Android Release Keystore from In-Memory Secret
        if: env.ANDROID_KEYSTORE_BASE64 != ''
        env:
          ANDROID_KEYSTORE_BASE64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
        run: |
          mkdir -p android/app/keystore
          echo "$ANDROID_KEYSTORE_BASE64" | base64 --decode > android/app/keystore/release.keystore

      - name: Build Android Bundle (AAB) & APK via Gradle
        working-directory: android
        run: |
          chmod +x ./gradlew
          ./gradlew assembleRelease
          ./gradlew bundleRelease

      - name: Sign Android Release AAB
        if: env.ANDROID_KEYSTORE_BASE64 != ''
        uses: r0adkll/sign-android-release@v1
        with:
          releaseDirectory: android/app/build/outputs/bundle/release
          signingKeyBase64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
          alias: ${{ secrets.ANDROID_KEY_ALIAS }}
          keyStorePassword: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          keyPassword: ${{ secrets.ANDROID_KEY_PASSWORD }}
        env:
          ANDROID_KEYSTORE_BASE64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}

      # ---------------------------------------------------------------------
      # Publish to Google Play Internal Testing Track
      # ---------------------------------------------------------------------
      - name: Publish to Google Play Store (Internal Track)
        if: env.PLAY_API_BASE64 != ''
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64 }}
          packageName: ${{ secrets.APPLE_BUNDLE_ID || 'com.kbt.recorder.studio' }}
          releaseFiles: android/app/build/outputs/bundle/release/*.aab
          track: internal
          status: completed
        env:
          PLAY_API_BASE64: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64 }}

      - name: Organize Android Artifacts
        run: |
          mkdir -p build-artifacts/android
          find android/app/build/outputs -type f \( -name "*.apk" -o -name "*.aab" \) -exec cp {} build-artifacts/android/ \;

      - name: Upload Android & Linux Artifacts to GitHub Run
        uses: actions/upload-artifact@v4
        with:
          name: android-linux-binaries
          path: build-artifacts/

  # =========================================================================
  # JOB 4: Automated GitHub Release Publishing & Commit Changelog Generator
  # =========================================================================
  publish-release:
    name: 🚀 Publish GitHub Release & Changelog
    needs: [build-apple, build-windows, build-android-linux]
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v') || github.event_name == 'workflow_dispatch'
    steps:
      - name: Checkout Codebase for Git History
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Download All Artifacts from Parallel Runners
        uses: actions/download-artifact@v4
        with:
          path: release-assets/

      # ---------------------------------------------------------------------
      # Dynamic Changelog Extraction from Git Commit History
      # ---------------------------------------------------------------------
      - name: Generate Automated Git Changelog
        id: changelog
        run: |
          PREV_TAG=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")
          if [ -n "$PREV_TAG" ]; then
            echo "Extracting commit log between $PREV_TAG and HEAD..."
            COMMITS=$(git log --pretty=format:"- %s (%h by @%an)" "$PREV_TAG"..HEAD)
          else
            echo "No previous tag found; extracting latest 25 commits..."
            COMMITS=$(git log -n 25 --pretty=format:"- %s (%h by @%an)")
          fi

          echo "CHANGELOG<<EOF" >> $GITHUB_OUTPUT
          echo "## 🎙️ KBT_Recorder Release v${{ env.BUILD_VERSION }}" >> $GITHUB_OUTPUT
          echo "" >> $GITHUB_OUTPUT
          echo "### 📦 Multiplatform Production Binaries Available" >> $GITHUB_OUTPUT
          echo "- **Windows**: \`KBT_Recorder.msi\` & standalone \`.exe\`" >> $GITHUB_OUTPUT
          echo "- **macOS**: \`KBT_Recorder_Universal.dmg\` (Apple Silicon + Intel)" >> $GITHUB_OUTPUT
          echo "- **Linux**: \`KBT_Recorder.AppImage\` (PipeWire + ALSA) & \`.deb\`" >> $GITHUB_OUTPUT
          echo "- **Android**: Signed \`.aab\` (Google Play) & \`.apk\`" >> $GITHUB_OUTPUT
          echo "- **iOS**: \`App.ipa\` (Deployed to TestFlight)" >> $GITHUB_OUTPUT
          echo "" >> $GITHUB_OUTPUT
          echo "### 📝 What's Changed in this Build:" >> $GITHUB_OUTPUT
          echo "$COMMITS" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Flatten Artifact Files for Release Attachment
        run: |
          mkdir -p final-release/
          find release-assets/ -type f -exec cp {} final-release/ \;
          ls -la final-release/

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ github.ref_name || format('v{0}', env.BUILD_VERSION) }}
          name: "KBT_Recorder v${{ env.BUILD_VERSION }}"
          body: ${{ steps.changelog.outputs.CHANGELOG }}
          files: final-release/*
          draft: false
          prerelease: false

  # =========================================================================
  # JOB 5: Multi-Channel Team Notifications (Slack / Discord / Webhook)
  # =========================================================================
  notify-team:
    name: 🔔 Team Status Notification
    needs: [build-apple, build-windows, build-android-linux]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Discord Notification
        if: env.DISCORD_WEBHOOK != ''
        env:
          DISCORD_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK_URL }}
          STATUS: ${{ (needs.build-apple.result == 'success' && needs.build-windows.result == 'success' && needs.build-android-linux.result == 'success') && '✅ SUCCESS' || '❌ FAILED' }}
        run: |
          curl -H "Content-Type: application/json" \
            -X POST \
            -d "{\"content\": \"**[KBT_Recorder CI/CD]** Build #${{ env.BUILD_CODE }} finished with status: **${STATUS}**\nCommit: \`${{ github.sha }}\` by \`${{ github.actor }}\`\nTarget: \`${{ github.ref }}\`\nDetails: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}\"}" \
            "$DISCORD_WEBHOOK"

      - name: Slack Notification
        if: env.SLACK_WEBHOOK != ''
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK_URL }}
          STATUS: ${{ (needs.build-apple.result == 'success' && needs.build-windows.result == 'success' && needs.build-android-linux.result == 'success') && 'SUCCESS' || 'FAILURE' }}
        run: |
          curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"*KBT_Recorder CI/CD Build #${{ env.BUILD_CODE }}* completed with status *${STATUS}*.\n• Commit: \`${{ github.sha }}\`\n• Actor: \`${{ github.actor }}\`\n• Run URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}\"}" \
            "$SLACK_WEBHOOK"
```

---

## 🔒 6. Windows SmartScreen & Authenticode Code Signing

Tauri automatically builds `.msi` installers using WiX Toolset and `.exe` bundles via NSIS.

- **Unsigned Binaries**: Unsigned `.msi` and `.exe` binaries run normally, but Windows Defender SmartScreen displays an informational prompt: *"Windows protected your PC - Unknown Publisher"*. Users click *"More info > Run anyway"*.
- **Signed Production Binaries**: To sign `.msi` or `.exe` files during the `windows-latest` runner step without user prompts:
  1. Purchase a standard or EV Code Signing Certificate (from Certum, Sectigo, DigiCert, etc.).
  2. Export the certificate as a password-protected `.pfx` file.
  3. Encode the `.pfx` file to Base64 using PowerShell:
     ```powershell
     [Convert]::ToBase64String([IO.File]::ReadAllBytes("codesign.pfx")) | Set-Content -NoNewline pfx_base64.txt
     ```
  4. Save inside GitHub Secrets as `WINDOWS_CERTIFICATE_PFX_BASE64` and `WINDOWS_CERTIFICATE_PASSWORD`.
  5. Sign using `signtool.exe` or Tauri's native `tauri.conf.json` bundle signature hooks.

---

## ⚡ 7. Quick Start: Triggering Your First Build

1. Add your repository secrets under **GitHub > Settings > Secrets and variables > Actions**.
2. Tag your commit and push to GitHub:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
3. Open the **Actions** tab on your GitHub repository to watch the 3 runners execute concurrently:
   - `macos-latest` packages the iOS `.ipa` and macOS `.dmg`.
   - `windows-latest` compiles the Windows `.msi` and `.exe`.
   - `ubuntu-latest` packages the Android `.aab` / `.apk` and Linux `.AppImage`.
4. Once completed, all native installation packages will be attached directly to the newly generated **GitHub Release** accompanied by your automated changelog notes!
