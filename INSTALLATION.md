# KBT_Recorder — Native Multi-Platform Installation Guide
*Step-by-Step Production Deployment for Android (APK/AAB), iOS (PWA/Xcode), Windows (.exe/.msi), and macOS (.dmg)*

---

## 1. Overview
This guide provides verified, production-ready build instructions and configuration files for compiling and packaging **KBT_Recorder** as native binaries across all primary consumer and enterprise operating systems.

---

## 2. Progressive Web App (PWA) Direct Browser Install (All Platforms)
KBT_Recorder functions as an installable standalone Progressive Web App out of the box with offline caching:
1. Open the deployed application URL in Chrome, Safari, Edge, or Firefox.
2. In the browser address bar, click the **Install App** icon or choose **Menu > Install KBT_Recorder**.
3. **On iOS Safari**: Tap the **Share** button at the bottom of the screen, scroll down, and tap **"Add to Home Screen"**. The app runs full-screen in standalone mode without browser chrome.
4. **On Android Chrome**: Tap the three dots menu > **"Install application"** or **"Add to Home Screen"**.

---

## 3. Android Native Packaging (APK & AAB via Capacitor / Android Studio)

### 3.1 Prerequisites
* Node.js v20+, npm v10+
* Android Studio Ladybug (2024.2+) or later
* Android SDK 34+ (API Level 34) & Android NDK (r26b or later for Core C++ engine)
* Java Development Kit (JDK 17 or 21)

### 3.2 Automated Steps
```bash
# 1. Install Capacitor CLI and Android core in project
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize Capacitor project
npx cap init "KBT_Recorder" "com.kbt.recorder.pro" --web-dir="dist"

# 3. Build the production web distribution
npm run build

# 4. Add Android native platform container
npx cap add android

# 5. Copy built assets into Android platform
npx cap copy android
npx cap sync android
```

### 3.3 Audio Permissions Configuration (`AndroidManifest.xml`)
Open `android/app/src/main/AndroidManifest.xml` and ensure the following hardware permissions and foreground services are declared:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.kbt.recorder.pro">

    <!-- Audio Recording & Microphone Hardware -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    
    <!-- Background Recording with Screen-Off -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Storage & Cloud Sync -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="KBT Recorder"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        
        <service
            android:name=".RecordingForegroundService"
            android:foregroundServiceType="microphone"
            android:exported="false" />
            
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:theme="@style/AppTheme.NoActionBarLaunch">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### 3.4 Build APK / AAB
```bash
cd android
# Build Universal Debug APK
./gradlew assembleDebug
# Generated at: android/app/build/outputs/apk/debug/app-debug.apk

# Build Production Signed Android App Bundle (AAB for Google Play Store)
./gradlew bundleRelease
# Generated at: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 4. iOS Native Packaging (Xcode IPA & Swift Integration)

### 4.1 Prerequisites
* macOS Sonoma or Sequoia with Xcode 15+
* CocoaPods installed (`sudo gem install cocoapods`)
* Apple Developer Account (for provisioning profile & App Store signing)

### 4.2 Automated Steps
```bash
# 1. Install iOS Capacitor platform
npm install @capacitor/ios
npx cap add ios

# 2. Sync web bundle
npm run build
npx cap sync ios

# 3. Open project in Xcode
npx cap open ios
```

### 4.3 Configure Privacy Keys (`Info.plist`)
In Xcode, open `App/App/Info.plist` and add the required microphone and background audio capabilities:
```xml
<dict>
    <key>NSMicrophoneUsageDescription</key>
    <string>KBT_Recorder requires microphone access to record studio-quality audio, lectures, and interviews.</string>
    
    <key>UIBackgroundModes</key>
    <array>
        <string>audio</string>
        <string>processing</string>
    </array>
    
    <key>UISupportsDocumentBrowser</key>
    <true/>
    
    <key>LSSupportsOpeningDocumentsInPlace</key>
    <true/>
</dict>
```

### 4.4 Build & Archive IPA
1. In Xcode, select target **"Any iOS Device (arm64)"**.
2. Select **Product > Archive**.
3. Use the Organizer to distribute via TestFlight or export the ad-hoc `.ipa` for student sideloading.

---

## 5. Windows Desktop Native Packaging (.exe & .msi via Tauri / Electron)

### 5.1 Option A: Using Electron Forge
```bash
# 1. Install Electron and Forge
npm install --save-dev electron @electron-forge/cli
npx electron-forge import

# 2. Create electron-main.cjs
cat << 'EOF' > electron-main.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: '#090d16',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
EOF

# 3. Package Windows Executables (.exe / .msi)
npm run build
npx electron-forge make --platform=win32 --arch=x64
# Generated outputs: out/make/squirrel.windows/x64/KBT_Recorder-Setup.exe and .msi
```

### 5.2 Option B: Using Tauri (Rust Native Backend for Lowest Latency)
```bash
# 1. Install Tauri CLI
npm install --save-dev @tauri-apps/cli

# 2. Initialize Tauri configuration
npx tauri init

# 3. Build optimized lightweight Windows executable (< 10 MB)
npx tauri build
# Outputs to: src-tauri/target/release/bundle/msi/KBT_Recorder_x64_en-US.msi
```

---

## 6. macOS Desktop Native Packaging (.dmg & Universal Binary)

### 6.1 Build DMG Installer
```bash
# Using Electron Builder
npm install --save-dev electron-builder

# Configure package.json with mac build options:
# "build": {
#   "appId": "com.kbt.recorder.pro",
#   "mac": {
#     "category": "public.app-category.music",
#     "target": ["dmg", "zip"],
#     "hardenedRuntime": true,
#     "entitlements": "entitlements.mac.plist"
#   }
# }

# Package Universal macOS .dmg (Apple Silicon M1/M2/M3/M4 + Intel x86_64)
npx electron-builder --mac --universal
# Generated at: dist/KBT_Recorder-1.0.0-universal.dmg
```

### 6.2 Hardened Runtime Entitlements (`entitlements.mac.plist`)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.device.audio-input</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
</dict>
</plist>
```

---

## 7. Hosting Direct Download Links for Students
Deploy the compiled binaries to your release server or AWS S3 / Cloudflare R2 bucket:
* **Android**: `https://your-domain.edu/downloads/kbt-recorder-latest.apk`
* **Windows**: `https://your-domain.edu/downloads/kbt-recorder-setup.exe`
* **macOS**: `https://your-domain.edu/downloads/kbt-recorder-universal.dmg`
* **iOS**: Publish to TestFlight or direct users to Safari **Add to Home Screen (PWA)**.
