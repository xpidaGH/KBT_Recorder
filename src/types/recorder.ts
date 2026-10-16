export type AudioFormat = 'wav' | 'mp3' | 'flac' | 'm4a' | 'amr';

export type BitDepth = 16 | 24 | 32;

export interface GeoLocationData {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  timestamp: number;
  placeName?: string;
}

export interface AudioConfig {
  sampleRate: number; // 8000, 16000, 22050, 44100, 48000, 96000
  channels: 1 | 2; // Mono or Stereo
  bitDepth: BitDepth;
  format: AudioFormat;
  gain: number; // 0.0 to 5.0 (0 to +14 dB)
  agc: boolean; // Automatic Gain Control
  vadEnabled: boolean; // Silence skipping
  vadThreshold: number; // dB (-60 to -20)
  vadDuration: number; // ms to consider silence (500 to 3000)
  inputDeviceId: string;
  gpsTaggingEnabled: boolean; // Automatic GPS geolocation tagging
}

export type CloudProvider = 'dropbox' | 'googledrive' | 'icloud' | 'evernote' | 'email' | 'webhook';

export type ScheduleMode = 'immediate' | '15m' | '1h' | 'daily_wifi';

export interface SyncLog {
  provider: CloudProvider;
  timestamp: string;
  transactionId: string;
  signature: string;
  status: 'synced' | 'pending' | 'failed';
}

export interface AudioID3Metadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  genre?: string;
  comment?: string;
  track?: string;
}

export interface SpectralSubtractionSettings {
  enabled: boolean;
  strengthAlpha: number; // 0.5 - 4.0 (over-subtraction factor)
  noiseFloorBeta: number; // 0.005 - 0.15 (spectral floor to prevent musical noise)
  spectralSmoothing: number; // 0.0 - 0.8 (frame temporal smoothing)
  fftSize: number; // 512, 1024, 2048
  noiseProfileMode: 'auto_silence' | 'selection' | 'adaptive';
  capturedProfile?: number[]; // FFT magnitude bins
  noiseSnrEstimateDb?: number;
}

export interface DSPSettings {
  bypassAll: boolean;
  highPass: {
    enabled: boolean;
    frequency: number; // 20 - 2000 Hz
    q: number; // 0.5 - 5.0
  };
  lowPass: {
    enabled: boolean;
    frequency: number; // 200 - 20000 Hz
    q: number; // 0.5 - 5.0
  };
  noiseReduction: {
    enabled: boolean;
    thresholdDb: number; // -60 to -12 dB
    reductionDb: number; // 6 to 48 dB
    attackMs: number; // 1 to 50 ms
    releaseMs: number; // 20 to 500 ms
  };
  spectralSubtraction: SpectralSubtractionSettings;
  outputGainDb: number; // -12 to +12 dB
}

export interface RecordingItem {
  id: string;
  name: string;
  timestamp: number;
  duration: number; // in seconds
  sizeBytes: number;
  format: AudioFormat;
  sampleRate: number;
  channels: number;
  bitDepth: BitDepth;
  blob?: Blob;
  blobUrl?: string;
  waveformPeakData: number[]; // Normalized peaks 0..1 for mini-waveform render
  isEncrypted: boolean;
  encryptionSalt?: string; // hex
  encryptionIv?: string; // hex
  transcript?: string;
  tags: string[];
  syncHistory: SyncLog[];
  location?: GeoLocationData;
  metadata?: AudioID3Metadata;
  dspFilters?: DSPSettings;
}

export type VisualizerMode = 'oscilloscope' | 'spectrum' | 'stereo_vu' | 'all';

export interface VADState {
  isSpeaking: boolean;
  silenceTimeMs: number;
  totalSkippedSec: number;
  currentDb: number;
}
