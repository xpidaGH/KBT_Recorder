# KBT_Recorder — Comprehensive Production User Guide
*Multi-Platform Professional Voice Recording & Multi-Cloud Archival Ecosystem*

---

## 1. Executive Summary & Capabilities
**KBT_Recorder** is a professional-grade audio recording, digital signal processing (DSP), and multi-cloud synchronization platform inspired by industry benchmarks including **RecForge II**, **Voice Record Pro**, **Rev Voice Recorder**, **Easy Voice Recorder**, and **Just Press Record**. 

Engineered for professional journalists, field researchers, audio engineers, and international software engineering students, KBT_Recorder bridges low-level high-performance audio capture with zero-knowledge cryptographic security, local transcription pipelines, and cross-platform native deployment targets.

---

## 2. Quick Start: One-Tap High-Fidelity Recording
1. **Select Input Hardware**: Choose between Built-in Microphone, External USB/Lightning Mic, Bluetooth Headset, or System Loopback.
2. **Configure Codec & Fidelity**: Select target format (**WAV PCM 16/24/32-bit**, **MP3 CBR/VBR**, **FLAC Lossless**, **M4A/AAC**, or **AMR**).
3. **Calibrate Preamp Gain & AGC**: Adjust the manual preamp slider ($-12\text{ dB}$ to $+18\text{ dB}$) or enable Automatic Gain Control (AGC) for dynamic leveling.
4. **Arm Voice Activity Detection (VAD)**: Toggle **Silence Skipping** with threshold calibration (default $-42\text{ dB}$) to eliminate dead silence during long recording sessions.
5. **Press Record**: Monitor the real-time Stereo VU peak meters and oscilloscope waveform. 
6. **Live Transcription**: View real-time interim speech-to-text preview in English or target student languages.
7. **Save & Encrypt**: Store directly in persistent local IndexedDB with optional **Zero-Knowledge AES-256-GCM** encryption.
8. **Export & Sync**: Dispatch to Dropbox, Google Drive, iCloud Drive, Evernote, Email, or Webhooks immediately or on scheduled intervals.

---

## 3. Digital Signal Processing (DSP) & Hardware Controls

### 3.1 Preamp Gain & Automatic Gain Control (AGC)
* **Manual Preamp Gain**: Operates on real-time 32-bit floating-point audio frames. Provides fine adjustments from $0.0\times$ (mute) to $5.0\times$ ($+14\text{ dB}$ boost) to amplify distant speakers or quiet whisper sources.
* **AGC (Automatic Gain Control)**: Employs a multi-stage lookahead compressor/limiter algorithm with $12\text{ms}$ attack and $240\text{ms}$ release times to prevent hard clipping while lifting soft transients.

### 3.2 Real-Time Dual VU Peak Meter & Clipping Alerts
* **Stereo VU Channels**: Left and Right channel bars rendered with logarithmic dBFS scaling ($-60\text{ dBFS}$ to $0\text{ dBFS}$).
* **Color Zones**:
  * **Green ($-60\text{ dB}$ to $-12\text{ dB}$)**: Nominal speech floor.
  * **Amber ($-12\text{ dB}$ to $-3\text{ dB}$)**: Dynamic peak headroom.
  * **Red ($-3\text{ dB}$ to $0\text{ dB}$)**: Warning zone.
  * **CLIP Indicator (Sticky red hold)**: Flags any sample exceeding $-0.1\text{ dBFS}$ to alert the engineer to lower gain.

### 3.3 Silence Skipping & Voice Activity Detection (VAD)
* **Energy Threshold**: Set between $-60\text{ dB}$ (hyper-sensitive) and $-20\text{ dB}$ (noisy environments).
* **Hold Duration**: Configurable $500\text{ms}$ to $3000\text{ms}$ window to avoid cutting off natural pauses between sentences.
* **Stream Compression**: When silence is detected, audio frame buffering pauses or stamps metadata markers, drastically reducing disk footprint during overnight surveillance or lectures.

### 3.4 Studio Sample Rates & Formats
* **8,000 Hz**: Narrowband Telephony & Dictation.
* **16,000 Hz**: Standard Speech Recognition & Whisper AI model ingestion.
* **22,050 Hz**: AM Radio broadcast speech.
* **44,100 Hz**: CD Audio Standard.
* **48,000 Hz**: Professional Video & Studio Standard (Default).
* **96,000 Hz**: Audiophile Master & Ultrasonic Acoustic Analysis.

### 3.5 Field GPS Geolocation Tagging & Mapping
* **High-Accuracy WGS-84 Coordinates**: Automatically captures latitude, longitude, elevation/altitude, and precision accuracy radius in meters using high-precision hardware GPS.
* **Reverse Geocoding**: Automatically resolves geographic coordinates to local city, district, and country names.
* **Interactive Map Inspection**: Inspect recording locations on interactive OpenStreetMap and Google Maps directly from the Vault Library.
* **Privacy Toggle**: GPS tagging can be toggled on or off at any time in the hardware calibration panel.

---

## 4. Zero-Knowledge Local Cryptography Matrix
For investigative journalists and enterprise confidentiality:
1. **Client-Side Key Derivation**: When encryption is activated, your custom passphrase is fed into a **PBKDF2-HMAC-SHA256** key derivation function with 100,000 iterations and a unique 128-bit cryptographic salt.
2. **AES-256-GCM In-Memory Envelope**: Audio frames are encrypted using authenticated Galois/Counter Mode (**AES-256-GCM**) with a 96-bit initialization vector (IV).
3. **No Key Storage**: The encryption key is never saved to disk, transmitted over network sockets, or cached in unmanaged heap memory.
4. **Decryption Verification**: Files display a lock badge. Entering the correct passphrase decrypts the file in-memory for playback, waveform inspection, or exporting.

---

## 5. In-App Audio Editing Suite
* **Interactive Waveform Visualizer**: Scrub, zoom, and inspect audio tracks with millisecond precision.
* **Non-Destructive Trimming**: Set Start Marker ($[A$) and End Marker ($B]$) to crop unwanted pre-roll or ambient chatter.
* **Gain Amplification**: Apply post-recording gain adjustments ($-12\text{ dB}$ to $+12\text{ dB}$).
* **Format Transcoding**: Transcode existing WAV files to MP3, FLAC, M4A, or AMR directly within the applet.
* **Playback Speed & Pitch**: Variable tempo control ($0.5\times$ to $2.0\times$) with pitch preservation for swift transcription auditing.

---

## 6. Multi-Cloud Synchronization & Scheduled Dispatch
* **Supported Cloud Storage Providers**:
  * **Dropbox**: Direct chunked upload via API v2 endpoints.
  * **Google Drive**: Multipart file upload with automated folder indexing.
  * **iCloud Drive**: Native Files app integration and cloud container sync.
  * **Evernote**: Direct audio note packaging with embedded transcript bodies.
  * **Email & Messaging**: Formatted MIME attachments with secure presigned download links.
  * **Enterprise Webhook**: Direct HTTP POST streaming with HMAC-SHA256 integrity signatures.
* **Scheduled Auto-Sync Modes**:
  * **Immediate**: Syncs instantly upon pressing Stop.
  * **Periodic (15 min / 1 hour)**: Batches completed recordings in background queue.
  * **Daily on Wi-Fi**: Uploads overnight when connected to unmetered connections.

---

## 7. Capstone Architecture & 21-Language Student Ecosystem
International students can inspect, execute, and adapt production source code across 21 core programming languages and environments:
* **Part 1 (Core C++ Engine)**: Cross-platform Oboe/CoreAudio hardware wrapper, DSP AGC, Silence VAD, Lock-Free RingBuffer, and Libsodium encryption.
* **Part 2 (Systems & Backend Ecosystems)**:
  1. **Python**: FastAPI + Celery + Whisper async audio processing pipeline.
  2. **TypeScript / JavaScript**: Web Audio API audio graph nodes & Emscripten Wasm bridge.
  3. **Java**: Enterprise Android Sticky Foreground Service with Partial WakeLock.
  4. **C#**: Windows WASAPI hardware audio pipeline with TAP channels.
  5. **Kotlin**: Modern Android Jetpack Compose MVI with Coroutines StateFlow.
  6. **Dart / Flutter**: BLoC pattern with native MethodChannel bridging.
  7. **Bash / Shell**: DevOps automated toolchain validation and compilation.
  8. **Rust**: Lock-free RingBuffer with Foreign Function Interface (FFI) memory safety.
  9. **Go (Golang)**: High-concurrency CSP chunk multiplexing pipeline.
  10. **C++**: Pimpl Idiom with RAII real-time lock-free thread processing.
  11. **C**: Direct RIFF WAV binary header structs and POSIX file IO.
  12. **PHP**: Enterprise multi-cloud sync broker with chunked stream forwarding.
  13. **Ruby**: Service Object webhook alert dispatcher and notification queues.
  14. **PowerShell**: Windows hardware loopback driver installer & Group Policy audit.
  15. **SQL**: PostgreSQL relational metadata schema with audit logs.
  16. **R**: Acoustic feature extraction, spectrogram matrix, and frequency density.
  17. **Scala**: Distributed Pekko/Akka streams for batch audio mining.
  18. **MATLAB**: High-pass/low-pass IIR Butterworth filter matrix prototyping.
  19. **COBOL**: Legacy mainframe fixed-length record packing.
  20. **Assembly (x86_64 AVX2)**: Vectorized SIMD gain multiplier & PCM sample unpacker.

---

## 8. Cross-Browser TTS Voice Assistance
KBT_Recorder includes native Web Speech Synthesis integration supporting 22 international languages (English, French, German, Italian, Spanish, Portuguese, Indonesian, Swahili, Turkish, Russian, Chinese, Japanese, Arabic, Urdu, Hindi, Vietnamese, Korean, Farsi, Marathi, Bangla, Tamil, Telugu). Click the **TTS Voice Guide** to listen to the guide spoken natively in your preferred language.
