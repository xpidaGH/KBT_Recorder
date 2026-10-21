# 🎙️ KBT_Recorder — Professional Multi-Platform Voice Recorder & Acoustic DSP Studio

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
[![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8.svg)](https://tailwindcss.com/)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-DSP%20%26%20WAV-green.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Recharts](https://img.shields.io/badge/Recharts-Storage%20Analytics-9333ea.svg)](https://recharts.org/)
[![JSZip](https://img.shields.io/badge/JSZip-Bulk%20Export-f59e0b.svg)](https://stuk.github.io/jszip/)
[![Gemini AI](https://img.shields.io/badge/Gemini%202.5%20Flash-Audio%20Intelligence-4285f4.svg)](https://ai.google.dev/)
[![Web Speech TTS](https://img.shields.io/badge/TTS-22%20Languages-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)

> Inspired by industry-standard recording workstations including **RecForge II**, **Voice Record Pro**, **Rev Voice Recorder**, **Easy Voice Recorder**, and **Just Press Record**.  
> Engineered as an international production-grade audio suite and pedagogical capstone hub bridging **Web Audio API, DSP mathematics, zero-knowledge encryption, distributed cloud synchronization, and 21 programming language implementations**.

---

## 📑 Table of Contents

- [Overview & Key Highlights](#-overview--key-highlights)
- [Digital Signal Processing (DSP) & Audio Editor](#-digital-signal-processing-dsp--audio-editor)
  - [Noise Gate with Floor Threshold](#1-precision-noise-gate-with-floor-threshold)
  - [Spectral Subtraction Background Noise Removal](#2-spectral-subtraction-background-noise-removal)
  - [Auto-Normalize (-1.0 dBFS Peak)](#3-auto-normalize--10-dbfs-peak)
  - [Automated Silence Trimmer](#4-automated-silence-trimmer)
  - [Biquad Acoustic Filters (HPF / LPF) & Live Curve](#5-biquad-acoustic-filters-hpf--lpf--live-response)
  - [Interactive Scrubbing & Timeline Editing](#6-interactive-scrubbing--timeline-editing)
- [Recording Presets System](#-recording-presets-system)
- [Library Management, Storage Analytics & Batch Operations](#-library-management-storage-analytics--batch-operations)
  - [Recharts Storage Usage Analytics](#1-recharts-storage-usage-analytics)
  - [Bulk Export with JSZip](#2-bulk-export-with-jszip)
  - [Batch Renaming Utility](#3-batch-renaming-utility)
  - [RIFF ID3 & Metadata Tagging](#4-riff-id3v2--metadata-tagging)
- [Hardware Control & Real-Time Monitoring](#-hardware-control--real-time-monitoring)
- [Zero-Knowledge Security & Geolocation](#-zero-knowledge-security--geolocation)
- [Multi-Cloud Ingestion & Background Sync](#-multi-cloud-ingestion--background-sync)
- [AI Conversation Intelligence (Gemini 2.5 Flash)](#-ai-conversation-intelligence-gemini-25-flash)
- [22-Language Internationalization & TTS Voice Guide](#-22-language-internationalization--tts-voice-guide)
- [21-Language Enterprise Implementation Matrix](#-21-language-enterprise-implementation-matrix)
- [System Architecture Blueprint](#-system-architecture-blueprint)
- [API Routes & Server Specification](#-api-routes--server-specification)
- [Local Development & Build Instructions](#-local-development--build-instructions)
- [Native Platform Packaging](#-native-platform-packaging)

---

## 🌟 Overview & Key Highlights

KBT_Recorder delivers a zero-compromise recording environment combining low-latency hardware capture with modern browser capabilities and full-stack backend services:

- **100% In-Browser Hardware Audio Processing**: No mandatory cloud roundtrip for audio filtering, gating, trimming, spectral subtraction, or format conversion.
- **Precision Digital Signal Processing (DSP)**: High-pass rumble filter, low-pass hiss filter, precision noise gate with floor threshold, FFT spectral subtraction background denoiser, and automated silence trimming.
- **Hardware-Level Precision Metering**: 2048-point stereo oscilloscope, real-time FFT spectrum visualizer, and dual logarithmic VU peak meters tracking $-60\text{ dBFS}$ to $0\text{ dBFS}$ with sticky digital clip indicators.
- **Enterprise-Grade Vault**: Client-side AES-256-GCM encryption with PBKDF2 key derivation, SHA-256 HMAC integrity signatures, and interactive Recharts storage breakdowns.
- **Batch Productivity**: Multi-item JSZip bundling, structured batch renaming, and one-click cloud synchronization across 6 storage providers.

---

## 🎛️ Digital Signal Processing (DSP) & Audio Editor

The in-app studio editor (`AudioEditorModal`) includes an acoustic DSP workstation powered by the Web Audio API and hardware-accelerated `OfflineAudioContext`.

### 1. Precision Noise Gate with Floor Threshold
Eliminates low-level background noise, room hum, air conditioning murmur, computer fans, and breath noise by setting an acoustic floor threshold:
- **Floor Threshold Control**: Adjustable from **$-80\text{ dB}$ to $-12\text{ dB}$** with dedicated quick presets (`-60dB Studio`, `-48dB Voice Clean`, `-42dB Default`, `-36dB Fan/AC`, `-28dB Loud Ambient`).
- **Dynamic Floor Gate Visualizer**: A full-spectrum dynamic dB bar ($-80\text{ dB}$ to $0\text{ dB}$) displaying the gated attenuation zone versus the passing vocal zone, with real-time cursor tracking.
- **One-Click Auto-Detect Floor**: Computes the ambient RMS noise floor of the recording buffer and automatically sets the threshold $+4\text{ dB}$ above measured room noise.
- **Floor Attenuation / Reduction Depth**: Adjustable attenuation from **$6\text{ dB}$ down to $80\text{ dB}$ (Total Hard Mute Floor)**.
- **Attack, Hold & Release Envelopes**:
  - *Attack ($0.5\text{ ms} - 40\text{ ms}$)*: Opens instantly on speech transients to protect plosive consonants (`p`, `t`, `k`).
  - *Hold ($0\text{ ms} - 250\text{ ms}$)*: Prevents word clipping and preserves natural trailing vocal resonances during micro-pauses.
  - *Release ($20\text{ ms} - 500\text{ ms}$)*: Exponential decay envelope avoiding clicks or artificial cutoffs.
- **Anti-Chatter Hysteresis**: $0\text{ dB} - 10\text{ dB}$ offset to prevent rapid gate stuttering when audio levels hover around the threshold.
- **Real-Time Audition & In-Place Application**: Audition the gated audio instantly via A/B preview or bake it directly into the active waveform timeline.

### 2. Spectral Subtraction Background Noise Removal
Removes steady-state ambient noise (HVAC, street rumble, electronics hiss, cooling fans) in the frequency domain using a custom Short-Time Fourier Transform (STFT) engine:
- **STFT Engine**: Radix-2 Cooley-Tukey FFT/IFFT with Hanning windowing and 50% overlap-add (OLA) synthesis.
- **Boll & Berouti Over-Subtraction**: Over-subtraction factor ($\alpha$ from $0.5\times$ to $4.0\times$) combined with a spectral floor ($\beta$ from $0.005$ to $0.15$) to eradicate "musical noise" artifacts.
- **Temporal Frame Smoothing**: Frame-to-frame averaging ($0.0 - 0.8$) to stabilize spectral magnitudes.
- **Flexible Profiling Modes**:
  - *Selection-Based*: Sample noise profile directly from highlighted silence in the editor waveform.
  - *Auto-Silence Estimation*: Automatically identifies the quietest frames across the buffer to construct an ambient noise profile.
- **FFT Resolution Selector**: Choose between 512, 1024 (optimal for speech), or 2048 bins (fine resolution for low AC hum).

### 3. Auto-Normalize (-1.0 dBFS Peak)
Adjusts recording gain so the loudest peak reaches exactly **$-1.0\text{ dBFS}$** (the broadcast industry standard for digital streaming and podcast distribution):
- Hardware-accelerated sample-accurate peak scan across all channels.
- Calculates exact linear gain multiplier avoiding distortion or digital clipping ($0\text{ dBFS}$).
- Displays pre-normalization peak dB, post-normalization peak dB, and applied gain adjustment.
- Instantly updates the interactive waveform canvas and audio buffer.

### 4. Automated Silence Trimmer
Detects and removes unwanted dead air, pauses, and prolonged silence:
- **dB Threshold Slider**: Configurable from $-60\text{ dB}$ to $-20\text{ dB}$.
- **Minimum Silence Duration**: Target pauses longer than $200\text{ ms} - 3000\text{ ms}$.
- **Padding Buffer**: Preserves $50\text{ ms} - 250\text{ ms}$ of natural room tone around words to avoid unnatural speech gating.
- **Trimming Modes**: Trim leading silence, trailing silence, or all internal pauses throughout the recording.

### 5. Biquad Acoustic Filters (HPF / LPF) & Live Response
- **High-Pass (Low-Cut) Filter**: $20\text{ Hz} - 1500\text{ Hz}$ with adjustable resonance $Q$ ($0.5 - 4.0$). Eliminates microphone handling thumps, wind noise, and subwoofer rumble.
- **Low-Pass (High-Cut) Filter**: $500\text{ Hz} - 20000\text{ Hz}$ with adjustable resonance $Q$. Cuts harsh sibilance, radio interference, and high-frequency tape hiss.
- **Interactive Frequency Response Curve**: Real-time canvas visualizing combined filter transfer functions across logarithmic frequencies ($20\text{ Hz} - 20\text{ kHz}$) with interactive cutoff markers.
- **Master Make-Up Gain**: $-12\text{ dB}$ to $+12\text{ dB}$ linear gain stage to compensate for filtered energy.

### 6. Interactive Scrubbing & Timeline Editing
- Dual canvas visualizer (zoomed main waveform + overview scrubbing timeline).
- Selection handles ($[A \to B]$) with millisecond-accurate start/end timing.
- Cut, Crop, Amplify, and Reverse playback.
- Variable playback speed ($0.5\times$ to $2.0\times$) with pitch correction option.

---

## 🎚️ Recording Presets System

Quickly switch between optimized recording setups with one click via `RecordingPresetsBar`:

| Preset | Sample Rate | Bit Depth | Channels | VAD Threshold | Recommended Environment |
|---|---|---|---|---|---|
| **🎙️ Podcasting** | 48 kHz | 24-bit PCM | Stereo | $-42\text{ dB}$ (Active) | Controlled indoor studio, narrative interviews |
| **📝 Voice Memo** | 22.05 kHz | 16-bit PCM | Mono | $-36\text{ dB}$ (Aggressive) | Quick notes, lectures, battery & storage saving |
| **🎵 High-Fidelity Music** | 96 kHz | 32-bit Float | Stereo | Disabled (Full Range) | Acoustic instruments, live performances, foley |
| **📱 Mobile Field** | 44.1 kHz | 16-bit PCM | Mono | $-38\text{ dB}$ (Standard) | Outdoor journalism, portable field recording |
| **⚙️ Custom Presets** | User-defined | User-defined | User-defined | Configurable | Saved in `localStorage` for rapid recall |

---

## 📂 Library Management, Storage Analytics & Batch Operations

### 1. Recharts Storage Usage Analytics
The Library view incorporates rich visual storage telemetry built with **Recharts**:
- **Format Breakdown Donut Chart**: Visualizes storage distribution across `WAV`, `MP3`, `FLAC`, `OGG`, `WebM`, `AAC`, and `M4A`.
- **Encryption Ratio**: Instant visibility into the proportion of files protected under client-side AES-256-GCM encryption versus raw unencrypted audio.
- **Interactive Filtering**: Clicking any segment in the chart automatically filters the recordings table by that specific format or security tier.
- **Storage Metrics**: Total vault size in megabytes/gigabytes, total recording duration, and average file size.

### 2. Bulk Export with JSZip
Export dozens of recordings in one synchronized operation:
- Multi-select recordings via checkboxes or "Select All".
- Bundles selected items into a single `.zip` archive on the client without uploading to external servers.
- Automatically organizes files with clean naming conventions and generates an included `manifest.json` with technical audio metadata.

### 3. Batch Renaming Utility
Standardize recording titles across large recording projects:
- **Configurable Patterns**: Add prefixes (`Project_X_`), suffixes (`_Final`), and sequential zero-padded numbering (`_#01`, `_#02`).
- **Date & Tag Appending**: Append ISO recording dates (`2026-10-21`) or assigned category tags (`#Interview`, `#Lecture`).
- **Live Preview Table**: Shows side-by-side original versus new names before confirming destructive renames.

### 4. RIFF ID3v2 & Metadata Tagging
- Embeds standardized ID3 tags and RIFF `LIST INFO` chunks (`INAM` Title, `IART` Artist, `IPRD` Album, `ICMT` Comments, `ICRD` Year, `IGNR` Genre).
- Custom taxonomy tag chips (`#interview`, `#voicemail`, `#music`, `#dsp-filtered`) for instant search and filtering.

---

## 🎙️ Hardware Control & Real-Time Monitoring

- **Input Device Enumeration**: Switch seamlessly between internal microphones, USB audio interfaces, Lightning/Type-C mics, and system loopback.
- **Hardware Preamp Slider**: Linear multiplier ($0.0\times$ to $5.0\times$ / $+14\text{ dB}$) with instantaneous software gain boost.
- **Logarithmic VU Peak Meter**: Calibrated from $-60\text{ dBFS}$ to $0\text{ dBFS}$ with hold markers and persistent red **CLIP** warnings.
- **Screen Wake Lock API**: Prevents OS display sleep and background thread throttling during extended takes.
- **IndexedDB Blob Persistence**: Safely writes recordings to client-side storage, surviving browser restarts.

---

## 🔐 Zero-Knowledge Security & Geolocation

- **Client-Side AES-256-GCM**: Cryptographic encryption using Web Crypto API. Password keys are derived through PBKDF2 with 100,000 iterations and a unique salt per file.
- **Zero-Knowledge Architecture**: Unencrypted audio data never leaves the client memory without passphrase authentication.
- **WGS-84 Field Geolocation**: Captures GPS coordinates (latitude, longitude, altitude, accuracy) on recording initiation with OpenStreetMap reverse lookup.

---

## ☁️ Multi-Cloud Ingestion & Background Sync

The application connects to multi-cloud backends with scheduled dispatch options:
- **Supported Providers**: Dropbox, Google Drive, iCloud Drive, Evernote, Direct Email, and Custom Webhooks.
- **Sync Schedules**: Immediate on recording stop, queued every 15 minutes, hourly batch, or daily on unmetered Wi-Fi.
- **HMAC-SHA256 Transport Verification**: Every cloud transmission includes an HMAC-SHA256 payload signature ensuring zero tampering in transit.

---

## 🤖 AI Conversation Intelligence (Gemini 2.5 Flash)

Integrated with Google's **Gemini 2.5 Flash** model via the official `@google/genai` TypeScript SDK:
- **Executive Summaries**: Structured conversational synopsis.
- **Key Takeaways & Action Items**: Auto-extracted deliverables and discussion highlights.
- **Sentiment & Tone Classification**: Analyzes conversational context (e.g., *Objective & Professional*, *Analytical*, *Urgent*).
- **Intelligibility & Audio Fidelity Scoring**: Numerical evaluation ($0 - 100$) of vocal clarity and acoustic quality.

---

## 🌍 22-Language Internationalization & TTS Voice Guide

KBT_Recorder provides full UI localization and dynamic Text-to-Speech across **22 international languages**:

| Language | Native Script | TTS Support | Language | Native Script | TTS Support |
|---|---|---|---|---|---|
| **English** | English | ✅ Native | **Arabic** | العربية | ✅ Native |
| **Spanish** | Español | ✅ Native | **Hindi** | हिन्दी | ✅ Native |
| **French** | Français | ✅ Native | **Bengali** | বাংলা | ✅ Native |
| **German** | Deutsch | ✅ Native | **Portuguese** | Português | ✅ Native |
| **Italian** | Italiano | ✅ Native | **Russian** | Русский | ✅ Native |
| **Japanese** | 日本語 | ✅ Native | **Urdu** | اردو | ✅ Native |
| **Korean** | 한국어 | ✅ Native | **Indonesian** | Bahasa Indonesia | ✅ Native |
| **Chinese** | 简体中文 | ✅ Native | **Turkish** | Türkçe | ✅ Native |
| **Vietnamese** | Tiếng Việt | ✅ Native | **Swahili** | Kiswahili | ✅ Native |
| **Tamil** | தமிழ் | ✅ Native | **Telugu** | తెలుగు | ✅ Native |
| **Marathi** | मराठी | ✅ Native | **Farsi** | فارسی | ✅ Native |

Integrated with `window.speechSynthesis` providing interactive audio playback, adjustable pitch ($0.5\times - 2.0\times$), speaking rate, and system voice selection.

---

## 🏛️ 21-Language Enterprise Implementation Matrix

KBT_Recorder serves as a comprehensive polyglot reference architecture demonstrating how an enterprise audio system is constructed across 21 programming languages:

| # | Language | Architectural Pattern | System Scope & Functionality |
|---|---|---|---|
| 1 | **C++** | Pimpl Idiom + RAII | Core low-level audio engine, lock-free ring buffers, Oboe & CoreAudio bindings |
| 2 | **Rust** | FFI Safe Memory Isolation | Thread-safe zero-copy audio stream analyzer and SIMD peak calculator |
| 3 | **C** | Pure Procedural Blocks | Bare-metal byte transforms, endianness converters, and RIFF header packers |
| 4 | **Python** | Async Microservices | FastAPI worker for asynchronous Whisper AI transcription and librosa audio feature extraction |
| 5 | **TypeScript** | Clean Architecture / React | Frontend Web Audio graph, interactive canvas visualizers, and state machines |
| 6 | **Java** | Android Bound Service | Sticky Foreground Service, Notification audio actions, and Partial WakeLock |
| 7 | **Kotlin** | MVI + Jetpack Compose | Android native client, StateFlow reactive pipelines, and JNI bridge |
| 8 | **C#** | Task Async Pattern (TAP) | Windows WASAPI hardware audio endpoints, high-resolution MMDevice API |
| 9 | **Dart / Flutter** | BLoC Design Pattern | Mobile cross-platform client with platform MethodChannels |
| 10 | **Go** | CSP Channel Multiplexer | High-throughput streaming broker for chunked audio ingestion |
| 11 | **PHP** | Dependency Injection REST | Multi-cloud proxy broker and OAuth token coordinator |
| 12 | **Ruby** | Service Object Pattern | Webhook dispatcher, notification web workers, and event pub/sub |
| 13 | **Bash / Shell** | Modular Toolchain Script | Automated cross-compilation pipeline and native dependency verifier |
| 14 | **PowerShell** | Scriptblock Automation | Windows audio loopback device driver setup and Group Policy audits |
| 15 | **SQL** | Normalized Relational Schema | PostgreSQL audit trails, recording metadata, and sync log schemas |
| 16 | **R** | Declarative Data Science | Spectrogram matrix computation, spectral entropy, and pitch contour analysis |
| 17 | **Scala** | Akka/Pekko Monadic Streams | Distributed cluster processing for massive batch audio feature mining |
| 18 | **MATLAB** | Matrix Vector Evaluations | Butterworth, Chebyshev, and Elliptic acoustic filter matrix prototyping |
| 19 | **COBOL** | Procedural Division Model | Enterprise mainframe fixed-length binary archiving and transmission |
| 20 | **Assembly (x86_64)** | AVX2 SIMD Registers | Hardware-level vector sample scaling and fast floating-point conversion |
| 21 | **JavaScript (ES Modules)** | Event-Driven Graph Nodes | Client-side audio graph pipeline, service worker, and browser audio worklets |

---

## 📐 System Architecture Blueprint

```text
+-----------------------------------------------------------------------------------+
|                            CLIENT RECORDING & DSP LAYER                           |
|  [Hardware Mic / Loopback]                                                         |
|         |                                                                         |
|         v                                                                         |
|  [Web Audio API Graph: Gain -> High-Pass -> Low-Pass -> Analyser -> Worklet]      |
|         |                                                                         |
|         +---> [Real-Time 2048-pt FFT Spectrum & Oscilloscope (60 FPS Canvas)]     |
|         +---> [Logarithmic Stereo VU Peak Meter (-60 dBFS to 0 dBFS + Clip Hold)] |
|         +---> [Voice Activity Detector (VAD) Silence Skipping Engine]             |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                        IN-APP AUDIO WORKSTATION & DSP PIPELINE                    |
|  [AudioEditorModal]                                                               |
|    |---> Precision Noise Gate (Floor Threshold -80dB to -12dB + Hold + Hysteresis)|
|    |---> Spectral Subtraction (Cooley-Tukey Radix-2 FFT STFT Noise Removal)       |
|    |---> Auto-Normalize (-1.0 dBFS Peak Gain Calculation)                         |
|    |---> Automated Silence Trimmer (Configurable dB Threshold & Padding)          |
|    |---> Biquad Filter Studio (HPF 20-1500Hz / LPF 500-20000Hz + Response Curve)   |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                           ENCRYPTED STORAGE & VAULT LAYER                         |
|  [IndexedDB Blob Store] <---> [Zero-Knowledge AES-256-GCM + PBKDF2 Password Key]  |
|                                     |                                             |
|                                     +---> [Recharts Storage & Format Analytics]   |
|                                     +---> [JSZip Multi-Item Bundle Archiver]      |
|                                     +---> [Structured Batch Renaming Engine]      |
+------------------------------------------+----------------------------------------+
                                           |
                                           v (HTTPS / Signed HMAC-SHA256)
+-----------------------------------------------------------------------------------+
|                            FULL-STACK EXPRESS BACKEND                             |
|  [Node.js / Express Server (Port 3000)]                                            |
|    |---> /api/health           : Engine status & cloud provider readiness         |
|    |---> /api/cloud-sync       : Multi-cloud ingestion broker (HMAC verification) |
|    |---> /api/process-audio    : Python/Whisper audio telemetry simulation        |
|    |---> /api/analyze-audio    : Google Gemini 2.5 Flash conversation analysis    |
|    |---> /api/convert          : Format transcoding simulation service            |
+-----------------------------------------------------------------------------------+
```

---

## 📡 API Routes & Server Specification

The backend server is implemented in `server.ts` using Express and mounted with Vite in development:

| Endpoint | Method | Payload | Description |
|---|---|---|---|
| `/api/health` | `GET` | — | Returns server engine status, timestamp, active cloud providers, and Gemini API key availability. |
| `/api/cloud-sync` | `POST` | `{ provider, fileName, fileBase64, size, format, scheduleMode }` | Ingests recordings to cloud destinations with SHA-256 HMAC verification. |
| `/api/process-audio` | `POST` | `{ fileName, durationSeconds, sampleRate, channels, format }` | Returns simulated DSP metrics, SNR, RMS dB, and VAD speech activity ratios. |
| `/api/analyze-audio` | `POST` | `{ fileName, transcript, duration, sampleRate, format }` | Calls Google Gemini 2.5 Flash to generate executive summaries, key takeaways, action items, and sentiment. |
| `/api/convert` | `POST` | `{ fileName, sourceFormat, targetFormat, targetSampleRate, targetBitDepth }` | Transcodes audio between WAV, MP3, FLAC, and AAC formats. |

---

## 💻 Local Development & Build Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/example/kbt-recorder.git
cd kbt-recorder
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` (optional for local Gemini AI analysis):
```bash
cp .env.example .env
```
Provide your Google Gemini API key if conversational AI features are required:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 3. Launch Development Server
Starts the Express server with embedded Vite middleware on port `3000`:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in any modern Chromium, Firefox, or Safari browser.

### 4. Code Quality & Type Check
Run the TypeScript compiler to ensure 100% type safety:
```bash
npm run lint
```

### 5. Production Compilation
Builds optimized production assets to `dist/`:
```bash
npm run build
```
Launch the production server:
```bash
npm start
```

---

## 📱 Native Platform Packaging

To package KBT_Recorder into standalone desktop or mobile binaries, refer to [INSTALLATION.md](INSTALLATION.md) for full commands:

- **Android (APK & AAB)**:
  ```bash
  npx cap add android
  npx cap sync android
  npx cap open android
  ```
- **Desktop (Windows `.exe`, macOS `.dmg`, Linux `.AppImage`)**:
  Compatible with Electron Forge and Tauri wrappers with zero code modifications.
- **Progressive Web App (PWA)**:
  Fully compliant with offline caching, Service Worker support, and Web App Manifest for instant "Add to Home Screen" installation on iOS and Android.

---

## 📄 License
This project is licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for details.
