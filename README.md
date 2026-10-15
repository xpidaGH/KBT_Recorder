# KBT_Recorder — Multi-Platform Production-Grade Voice Recorder & International Capstone Hub

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
[![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8.svg)](https://tailwindcss.com/)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-WAV%2FMP3%2FFLAC-green.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Web Speech TTS](https://img.shields.io/badge/TTS-22%20Languages-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)

> Inspired by **RecForge II**, **Voice Record Pro**, **Rev Voice Recorder**, **Easy Voice Recorder**, and **Just Press Record**.  
> Engineered for international software engineering students spanning **Python, TypeScript, Java, C#, Kotlin, Flutter/Dart, Bash, Rust, Go, C++, C, PHP, Ruby, PowerShell, SQL, R, Scala, MATLAB, COBOL, and Assembly**.

---

## 🎧 Core Studio Application Features

### 1. Pro Digital Signal Processing (DSP) & Hardware Control
- **Stereo/Mono Real-Time Oscilloscope & FFT Spectrum Visualizer**: 2048-point FFT canvas renderer with 60 FPS refresh rate.
- **Dual Logarithmic VU Peak Meter**: Real-time dBFS channel tracking ($-60\text{ dBFS}$ to $0\text{ dBFS}$) with sticky red **CLIP** detection.
- **Manual Preamp Gain**: Floating-point scaling from $0.0\times$ (Mute) to $5.0\times$ ($+14\text{ dB}$ boost).
- **Automatic Gain Control (AGC)**: Dynamic compressor limiter with lookahead attack/release envelopes.
- **Silence Skipping (VAD)**: Voice Activity Detection engine with adjustable threshold ($-60\text{ dB}$ to $-20\text{ dB}$) and hold timer.
- **High-Definition Codecs**: Uncompressed WAV (PCM 16/24/32-bit Float), MP3, FLAC Lossless, M4A/AAC, and AMR.
- **Studio Sample Rates**: 8 kHz, 16 kHz (Whisper), 22.05 kHz, 44.1 kHz (CD), 48 kHz (Studio), and 96 kHz (Audiophile).
- **Input Hardware Selector**: Built-in microphone, external USB/Lightning audio interfaces, headsets, and loopback.

### 2. Security, Transcription & In-App Editing
- **Zero-Knowledge Local Cryptography**: In-memory PBKDF2-derived AES-256-GCM encryption with client-side salt and passphrase.
- **GPS Field Geolocation Tagging**: Precision WGS-84 coordinate capture, elevation altitude tracking, reverse-geocoded locality lookup, and interactive map visualizer.
- **Live Transcription Preview**: Real-time Web Speech recognition preview + server-side AI conversation analysis.
- **In-App Audio Editor**: Visual interactive canvas waveform, crop/trim handles ($[A \to B]$), gain amplify, silence insert, playback pitch/speed ($0.5\times$ to $2.0\times$), and format converter.
- **Unlimited Length Recording & Wake Lock**: Unlimited audio duration with IndexedDB chunked storage and Screen Wake Lock protection.

### 3. Multi-Cloud Synchronization & Scheduled Storage
- **Direct Multi-Cloud Export**: Dropbox, Google Drive, iCloud Drive, Evernote, Email dispatch, and Custom Webhooks.
- **Scheduled Automated Sync**: Immediate on stop, every 15 minutes, hourly, or daily on unmetered Wi-Fi.
- **Signed HMAC-SHA256 Transport Protocol**: Guarantees chunked payload integrity across edge brokers.

---

## 🏛️ System Architecture Blueprint

```text
+-----------------------------------------------------------------------+
|                       CROSS-PLATFORM FRONT-END UI                     |
|            Kotlin (Android Compose)   |   Dart/Flutter Core           |
+-----------------------------------+-----------------------------------+
                                    |
                                    v (MethodChannel / JNI Bridge)
+-----------------------------------------------------------------------+
|                            CORE C++ ENGINE                            |
|  [Low-Level Audio API Wrapper] -> [DSP & Silence VAD Pipeline]         |
|                                         |                             |
|                                         v (Memory Safe Inspection)    |
|                          [Rust RingBuffer Analyzer Extension]         |
+-----------------------------------------+------------------------------+
                                          |
                                          v (Encrypted File Output)
+-----------------------------------------------------------------------+
|                    SECURE LOCAL STORAGE & ROUTING HUB                 |
|   Windows Client (C# WASAPI)   |   Mainframe Audio Batch (COBOL/Asm)  |
+-----------------------------------------+------------------------------+
                                          |
                                          v (Encrypted Transport HTTPS)
+-----------------------------------------------------------------------+
|                         DISTRIBUTED CLOUD LAYER                       |
|   PHP Ingestion Broker   ->   Go Stream Multiplexer -> PostgreSQL Log |
|                                         |                             |
|       +---------------------------------+-------------------------+   |
|       |                                                           |   |
|       v                                                           v   |
|  Python Whisper AI Service                                  Scala/R Signal|
|  (Asynchronous Transcripts)                                 Analytics  |
+-----------------------------------------------------------------------+
```

---

## 🌐 21-Language Enterprise Implementation Matrix

| # | Language | Architectural Pattern | System Domain & Scope |
|---|---|---|---|
| 1 | **C++** | Pimpl Idiom + RAII | Core audio processing engine, lock-free threads, Oboe/CoreAudio |
| 2 | **Rust** | FFI Safe Memory Isolation | Thread-safe lock-free RingBuffer, zero data-race audio analyzer |
| 3 | **C** | Procedural Resource Blocks | Bare-metal byte transforms, direct RIFF WAV header structs |
| 4 | **Python** | Async Event Microservices | FastAPI + Celery asynchronous Whisper AI transcription chunking |
| 5 | **TypeScript/JS** | Component Strategy Pattern | Web Audio API graph nodes, Emscripten-Wasm bridge, Cloud adapters |
| 6 | **Java** | Android Bound Service | Sticky Foreground Service, Notification wrappers, Partial WakeLock |
| 7 | **Kotlin** | Clean Architecture (MVI) | Android Jetpack Compose, Coroutines StateFlow native JNI bridge |
| 8 | **C#** | Task Async Pattern (TAP) | Windows WASAPI hardware line inputs, thread-safe channels |
| 9 | **Dart / Flutter** | BLoC Design Pattern | Cross-platform iOS/Android native MethodChannel hardware abstraction |
| 10 | **Go (Golang)** | CSP Channel Multiplexer | High-concurrency audio chunk multiplexer & cloud streaming broker |
| 11 | **PHP** | RESTful Controller + DI | Multi-cloud storage broker (Dropbox/Evernote/Drive proxy) |
| 12 | **Ruby** | Service Object Pattern | Webhook alert dispatches, notification triggers, queue ingestion |
| 13 | **Bash / Shell** | Modular Automation Script | Cross-compilation target compiler, toolchain dependency verification |
| 14 | **PowerShell** | Task-Automation Script Block | Windows loopback driver installer & Group Policy background audit |
| 15 | **SQL** | Relational Normalized Schema | PostgreSQL schema, audit logs, metadata & sync state tracking |
| 16 | **R** | Declarative Vector Processing | Acoustic feature extraction, spectrogram matrix, frequency density |
| 17 | **Scala** | Akka/Pekko Monadic Streams | Distributed cluster audio mining and batch AI transcript matching |
| 18 | **MATLAB** | Matrix Vector Evaluations | High-pass/low-pass IIR Butterworth filter matrix prototyping |
| 19 | **COBOL** | Procedural Division Structure | Legacy mainframe fixed-length binary packing & transmission |
| 20 | **Assembly (x86_64)** | AVX2 SIMD Register Vector | Hardware-level vector gain multiplier & PCM sample unpacker |

---

## 🌍 22-Language Internationalization & TTS Voice Guide
The application contains native translations and interactive text-to-speech for 22 languages:
**English, French (Français), German (Deutsch), Italian (Italiano), Spanish (Español), Portuguese (Português), Indonesian (Bahasa Indonesia), Swahili (Kiswahili), Turkish (Türkçe), Russian (Русский), Chinese (中文), Japanese (日本語), Arabic (العربية), Urdu (اردو), Hindi (हिन्दी), Vietnamese (Tiếng Việt), Korean (한국어), Farsi/Persian (فارسی), Marathi (मराठी), Bangla/Bengali (বাংলা), Tamil (தமிழ்), and Telugu (తెలుగు).**

Native `window.speechSynthesis` dynamically hooks into system voices with Play, Pause, Resume, Stop, Speed, and Pitch controls.

---

## 🚀 Native Installation Guides
Refer to [INSTALLATION.md](INSTALLATION.md) for step-by-step instructions to compile:
- **Android**: APK and Google Play AAB via Capacitor / Android Studio.
- **iOS**: Xcode IPA and PWA Add-to-Home-Screen instructions.
- **Windows**: .exe and .msi desktop bundles via Electron Forge and Tauri.
- **macOS**: Universal .dmg disk images for Apple Silicon and Intel.
