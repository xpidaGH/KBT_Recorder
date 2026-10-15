import React, { useState } from 'react';
import { X, Download, Smartphone, Apple, Monitor, Terminal, Check, Copy } from 'lucide-react';

interface InstallationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallationModal: React.FC<InstallationModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [platform, setPlatform] = useState<'android' | 'ios' | 'windows' | 'macos'>('android');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-red-500" />
            <div>
              <h2 className="text-base font-bold text-white">Native App Installation Guide (INSTALLATION.md)</h2>
              <span className="text-xs text-slate-400">Deploy KBT_Recorder across Android, iOS, Windows, and macOS</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 pt-2 gap-2">
          {[
            { id: 'android', label: 'Android (APK / AAB)', icon: Smartphone },
            { id: 'ios', label: 'iOS (PWA / Xcode)', icon: Apple },
            { id: 'windows', label: 'Windows (.exe / .msi)', icon: Monitor },
            { id: 'macos', label: 'macOS (.dmg)', icon: Terminal }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = platform === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPlatform(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-red-500 text-white bg-slate-900 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 text-xs leading-relaxed">
          {platform === 'android' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="font-semibold text-white text-sm">Direct Download Link for Students:</span>
                <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded border border-slate-800 font-mono text-slate-300">
                  <span>https://kbt-recorder.internal/downloads/kbt-recorder-universal.apk</span>
                  <button
                    onClick={() => copyToClipboard('https://kbt-recorder.internal/downloads/kbt-recorder-universal.apk', 1)}
                    className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300"
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

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                <strong>Background Permissions:</strong> Android requires <code className="text-slate-200">RECORD_AUDIO</code>, <code className="text-slate-200">WAKE_LOCK</code>, and <code className="text-slate-200">FOREGROUND_SERVICE_MICROPHONE</code> in <code className="text-slate-200">AndroidManifest.xml</code> to record with screen turned off.
              </div>
            </div>
          )}

          {platform === 'ios' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="font-semibold text-white text-sm">Method 1: Instant PWA Install (No App Store Needed)</span>
                <ol className="list-decimal list-inside text-slate-300 space-y-1">
                  <li>Open this web URL in <strong>Safari</strong> on iOS.</li>
                  <li>Tap the <strong>Share button</strong> at the bottom bar.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Launch from Home Screen: KBT_Recorder operates full-screen with offline audio caching!</li>
                </ol>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-semibold text-slate-200">Method 2: Compile Native Xcode IPA</span>
                <div className="relative bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto">
                  <pre>{`npm run build
npx cap add ios
npx cap sync ios
npx cap open ios

# In Xcode:
# 1. Configure Signing & Capabilities -> Add "Background Modes: Audio"
# 2. Add NSMicrophoneUsageDescription to Info.plist
# 3. Product -> Archive -> Export .ipa`}</pre>
                </div>
              </div>
            </div>
          )}

          {platform === 'windows' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="font-semibold text-white text-sm">Windows .exe / .msi Setup Package</span>
                <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded border border-slate-800 font-mono text-slate-300">
                  <span>https://kbt-recorder.internal/downloads/KBT_Recorder_Setup_x64.exe</span>
                  <button
                    onClick={() => copyToClipboard('https://kbt-recorder.internal/downloads/KBT_Recorder_Setup_x64.exe', 2)}
                    className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300"
                  >
                    {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 2 ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-semibold text-slate-200">Compiling with Electron Forge or Tauri:</span>
                <div className="relative bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto">
                  <pre>{`# Option A: Electron Forge
npm install --save-dev @electron-forge/cli
npm run build
npx electron-forge make --platform=win32 --arch=x64
# Outputs: out/make/squirrel.windows/x64/KBT_Recorder-Setup.exe

# Option B: Tauri (Rust backend < 10MB binary)
npm run build
npx tauri build
# Outputs: src-tauri/target/release/bundle/msi/KBT_Recorder.msi`}</pre>
                </div>
              </div>
            </div>
          )}

          {platform === 'macos' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="font-semibold text-white text-sm">macOS Universal .dmg Bundle</span>
                <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded border border-slate-800 font-mono text-slate-300">
                  <span>https://kbt-recorder.internal/downloads/KBT_Recorder_Universal.dmg</span>
                  <button
                    onClick={() => copyToClipboard('https://kbt-recorder.internal/downloads/KBT_Recorder_Universal.dmg', 3)}
                    className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300"
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
npx electron-builder --mac --universal
# Outputs: dist/KBT_Recorder-1.0.0-universal.dmg`}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>See full INSTALLATION.md in repository root for detailed signing certificates.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
