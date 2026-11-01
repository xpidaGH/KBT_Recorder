import React, { useState } from 'react';
import { X, Download, Smartphone, Apple, Monitor, Terminal, Check, Copy, Sparkles, Layers, ShieldCheck, GitBranch } from 'lucide-react';
import { KbtBrandLogo } from './KbtBrandLogo';

interface InstallationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallationModal: React.FC<InstallationModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [platform, setPlatform] = useState<'android' | 'ios' | 'windows' | 'macos' | 'icons' | 'cicd'>('icons');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <KbtBrandLogo useCase="web-header" />
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Multiplatform Distribution & App Icons</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-950 text-lime-400 border border-lime-800/60 font-mono">
                  Production Assets
                </span>
              </h2>
              <span className="text-xs text-slate-400">
                Desktop Title Bars, Mobile App Bars, Web Header Bars & GitHub Actions CI/CD
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 pt-2 gap-2 overflow-x-auto">
          {[
            { id: 'icons', label: 'App Icon & Brand Logos', icon: Sparkles },
            { id: 'cicd', label: 'GitHub Actions CI/CD', icon: GitBranch },
            { id: 'android', label: 'Android (APK / AAB)', icon: Smartphone },
            { id: 'ios', label: 'iOS (IPA / TestFlight)', icon: Apple },
            { id: 'windows', label: 'Windows (.msi / .exe)', icon: Monitor },
            { id: 'macos', label: 'macOS (.dmg Universal)', icon: Terminal }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = platform === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPlatform(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'border-lime-500 text-white bg-slate-900 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 text-lime-400" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 text-xs leading-relaxed">
          {/* TAB 1: BRAND LOGO & APP ICONS SHOWCASE */}
          {platform === 'icons' && (
            <div className="flex flex-col gap-6">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <KbtBrandLogo useCase="large" />
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>KBT Official Brand Icon (Cybernetic Spider)</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-yellow-950/80 text-yellow-400 border border-yellow-800/80 font-mono">
                        Vector Master
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      Generated per <code className="text-lime-300 font-mono">kbt-integration-guide.txt</code> featuring high-tech lime/cyber-yellow glowing accents, dark metallic exoskeleton, and authentic superellipse squircle masking.
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col gap-1 text-[11px] font-mono text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-lime-400 font-semibold">Master Assets:</span>
                  <span>• /public/assets/kbt-logo-transparent.png</span>
                  <span>• /public/assets/kbt-logo-desktop.png</span>
                  <span>• /public/assets/kbt-logo-mobile.png</span>
                </div>
              </div>

              {/* Showcase 3 Distinct Use Cases */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Desktop Title Bar */}
                <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5 text-lime-400" />
                      <span>Desktop Title Bar</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">20px - 24px Icon</span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Sized for native Windows 11 / macOS window header bars with crisp 1px borders and high contrast.
                  </p>

                  {/* Simulated Windows & macOS Title Bars */}
                  <div className="flex flex-col gap-2 mt-1">
                    {/* macOS Title Bar */}
                    <div className="bg-slate-900 rounded-md border border-slate-800 p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </div>
                        <div className="flex items-center gap-1.5 pl-2">
                          <KbtBrandLogo useCase="desktop-titlebar" />
                          <span className="text-[11px] font-medium text-slate-300 truncate">KBT_Recorder — macOS</span>
                        </div>
                      </div>
                    </div>

                    {/* Windows 11 Title Bar */}
                    <div className="bg-slate-900 rounded-md border border-slate-800 p-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <KbtBrandLogo useCase="desktop-titlebar" />
                        <span className="text-[11px] font-medium text-slate-300">KBT_Recorder (Win32)</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>—</span>
                        <span>▢</span>
                        <span>✕</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Mobile App Bar */}
                <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-lime-400" />
                      <span>Mobile App Bar</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">32px Squircle</span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Sized for iOS Navigation Bar & Android TopAppBar with authentic superellipse squircle mask.
                  </p>

                  {/* Simulated Mobile App Bar */}
                  <div className="bg-slate-900 rounded-md border border-slate-800 p-2.5 flex flex-col gap-2 mt-1">
                    <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono border-b border-slate-800 pb-1">
                      <span>9:41 AM</span>
                      <span>5G · 100%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KbtBrandLogo useCase="mobile-appbar" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-white">KBT_Recorder</span>
                          <span className="text-[9px] text-lime-400">Mobile Pro Suite</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">Menu</span>
                    </div>
                  </div>
                </div>

                {/* 3. Web Header Bar */}
                <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-lime-400" />
                      <span>Web Header Bar</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">32px - 36px</span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Active in KBT_Recorder top navigation with brand glow and responsive mobile/desktop scaling.
                  </p>

                  {/* Simulated Web Browser Bar */}
                  <div className="bg-slate-900 rounded-md border border-slate-800 p-2.5 flex flex-col gap-2 mt-1">
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded text-[10px] text-slate-400 font-mono">
                      <span className="text-emerald-400">🔒</span>
                      <span className="truncate">https://kbt-recorder.app/studio</span>
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex items-center gap-2">
                        <KbtBrandLogo useCase="web-header" />
                        <span className="text-[11px] font-bold text-white">KBT_Recorder</span>
                      </div>
                      <span className="text-[10px] text-lime-400 font-mono font-medium">LIVE</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Developer Command */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2 font-mono">
                <span className="text-xs font-semibold text-white">Tauri Multiplatform Icon Generator Command:</span>
                <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-300">
                  <span>npm run tauri icon ./public/assets/kbt-logo-transparent.png</span>
                  <button
                    onClick={() => copyToClipboard('npm run tauri icon ./public/assets/kbt-logo-transparent.png', 99)}
                    className="text-lime-400 hover:text-lime-300 flex items-center gap-1"
                  >
                    {copiedIndex === 99 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 99 ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GITHUB ACTIONS CI/CD */}
          {platform === 'cicd' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Automated Multi-Platform Build & Code-Signing Matrix</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-mono">
                      GitHub_Actions.md
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Continuous Integration & Deployment matrix running on 3 parallel virtual runners (<code className="text-slate-200">macos-latest</code>, <code className="text-slate-200">windows-latest</code>, <code className="text-slate-200">ubuntu-latest</code>).
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[11px] font-mono bg-slate-900 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800">
                    Run Number #{'{{ github.run_number }}'}
                  </span>
                </div>
              </div>

              {/* Runners Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Apple className="w-4 h-4 text-slate-300" />
                    <span>macos-latest</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    <li>iOS <strong className="text-slate-200">.ipa</strong> production binary</li>
                    <li>macOS Universal <strong className="text-slate-200">.dmg</strong> (Intel + M1/M2/M3)</li>
                    <li>Auto-deploys to Apple <strong className="text-amber-400">TestFlight</strong></li>
                    <li>In-memory base64 certificate import</li>
                  </ul>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Monitor className="w-4 h-4 text-sky-400" />
                    <span>windows-latest</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    <li>Windows <strong className="text-slate-200">.msi</strong> (WiX Toolset installer)</li>
                    <li>Windows standalone <strong className="text-slate-200">.exe</strong> binary</li>
                    <li>Rust + Tauri compiler toolchain</li>
                    <li>Optional Authenticode code signing</li>
                  </ul>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>ubuntu-latest</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    <li>Android <strong className="text-slate-200">.apk</strong> & signed <strong className="text-slate-200">.aab</strong></li>
                    <li>Linux <strong className="text-slate-200">.deb</strong> & <strong className="text-slate-200">.AppImage</strong> (PipeWire)</li>
                    <li>Auto-publishes to Google Play Internal Track</li>
                    <li>Keystore decoded directly in memory</li>
                  </ul>
                </div>
              </div>

              {/* Secrets Conversion Snippet */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
                <span className="font-semibold text-white">How to Encode Keystore & Certificates for GitHub Secrets:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-amber-400 block mb-1"># Linux / macOS (Bash)</span>
                    <code>base64 -w 0 release.keystore &gt; keystore.base64.txt</code>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-sky-400 block mb-1"># Windows (PowerShell)</span>
                    <code>[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore")) | Out-File keystore.base64.txt</code>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500">
                  Full production pipeline and step-by-step instructions available in <code className="text-lime-300">GitHub_Actions.md</code> in the repository root.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: ANDROID */}
          {platform === 'android' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="font-semibold text-white text-sm">Direct Download Link for Students:</span>
                <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded border border-slate-800 font-mono text-slate-300">
                  <span>https://kbt-recorder.internal/downloads/kbt-recorder-universal.apk</span>
                  <button
                    onClick={() => copyToClipboard('https://kbt-recorder.internal/downloads/kbt-recorder-universal.apk', 1)}
                    className="flex items-center gap-1 text-[11px] text-lime-400 hover:text-lime-300 cursor-pointer"
                  >
                    {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 1 ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-semibold text-slate-200">Building Native Android APK/AAB with Capacitor:</span>
                <div className="relative bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto">
                  <pre>{`# 1. Build the production React bundle
npm run build

# 2. Sync to Android capacitor project
npx cap add android
npx cap sync android

# 3. Compile Signed APK & AAB
cd android
./gradlew assembleDebug       # Output: app-debug.apk
./gradlew bundleRelease       # Output: app-release.aab (Play Store)`}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: IOS */}
          {platform === 'ios' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="font-semibold text-white text-sm">Install via Progressive Web App (PWA) on iPhone/iPad:</span>
                <ol className="list-decimal list-inside text-slate-300 space-y-1">
                  <li>Open Safari on iOS and navigate to <code className="text-lime-400">https://kbt-recorder.internal</code></li>
                  <li>Tap the <strong>Share</strong> button (box with upward arrow)</li>
                  <li>Scroll down and select <strong>"Add to Home Screen"</strong></li>
                  <li>Launch directly from your Home Screen with full offline IndexedDB and microphone hardware access</li>
                </ol>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-semibold text-slate-200">Xcode Native iOS Compilation (IPA / TestFlight):</span>
                <div className="relative bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto">
                  <pre>{`npm run build
npx cap add ios
npx cap sync ios
npx cap open ios   # Opens workspace in Xcode for signing and TestFlight distribution`}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WINDOWS */}
          {platform === 'windows' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="font-semibold text-white text-sm">Standalone Windows 64-bit Installer:</span>
                <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded border border-slate-800 font-mono text-slate-300">
                  <span>https://kbt-recorder.internal/downloads/KBT_Recorder_Setup.msi</span>
                  <button
                    onClick={() => copyToClipboard('https://kbt-recorder.internal/downloads/KBT_Recorder_Setup.msi', 2)}
                    className="flex items-center gap-1 text-[11px] text-lime-400 hover:text-lime-300 cursor-pointer"
                  >
                    {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 2 ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-semibold text-slate-200">Compiling with Tauri (Rust backend &lt; 10MB binary):</span>
                <div className="relative bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto">
                  <pre>{`npm run build
npx tauri build
# Outputs: src-tauri/target/release/bundle/msi/KBT_Recorder.msi`}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MACOS */}
          {platform === 'macos' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="font-semibold text-white text-sm">macOS Universal .dmg Bundle</span>
                <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded border border-slate-800 font-mono text-slate-300">
                  <span>https://kbt-recorder.internal/downloads/KBT_Recorder_Universal.dmg</span>
                  <button
                    onClick={() => copyToClipboard('https://kbt-recorder.internal/downloads/KBT_Recorder_Universal.dmg', 3)}
                    className="flex items-center gap-1 text-[11px] text-lime-400 hover:text-lime-300 cursor-pointer"
                  >
                    {copiedIndex === 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 3 ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-semibold text-slate-200">Packaging Universal DMG for Apple Silicon & Intel:</span>
                <div className="relative bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto">
                  <pre>{`npm run build
npx tauri build --target universal-apple-darwin
# Outputs: src-tauri/target/universal-apple-darwin/release/bundle/dmg/KBT_Recorder.dmg`}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-lime-400" />
            <span>KBT Asset Bundle & CI/CD verified for production distribution.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors cursor-pointer border border-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
