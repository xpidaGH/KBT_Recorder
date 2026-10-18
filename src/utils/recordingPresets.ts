import { AudioConfig, RecordingPreset } from '../types/recorder';

export const BUILT_IN_RECORDING_PRESETS: RecordingPreset[] = [
  {
    id: 'preset_podcasting',
    name: 'Podcasting',
    description: '48kHz studio broadcast, 24-bit depth, mono voice, with balanced silence skipping (VAD -42dB) & AGC compression.',
    category: 'podcasting',
    sampleRate: 48000,
    bitDepth: 24,
    vadEnabled: true,
    vadThreshold: -42,
    vadDuration: 1200,
    format: 'wav',
    channels: 1,
    gain: 1.2,
    agc: true,
    gpsTaggingEnabled: false,
    isBuiltIn: true
  },
  {
    id: 'preset_voicememo',
    name: 'Voice Memo',
    description: '22.05kHz, 16-bit compact speech capture with aggressive silence skipping (VAD -36dB) for quick notes & lectures.',
    category: 'voicememo',
    sampleRate: 22050,
    bitDepth: 16,
    vadEnabled: true,
    vadThreshold: -36,
    vadDuration: 800,
    format: 'wav',
    channels: 1,
    gain: 1.0,
    agc: true,
    gpsTaggingEnabled: false,
    isBuiltIn: true
  },
  {
    id: 'preset_music',
    name: 'High-Fidelity Music',
    description: '96kHz, 32-bit float master stereo with VAD disabled for unbroken acoustic dynamics, reverb tails & musical decays.',
    category: 'music',
    sampleRate: 96000,
    bitDepth: 32,
    vadEnabled: false,
    vadThreshold: -50,
    vadDuration: 2000,
    format: 'wav',
    channels: 2,
    gain: 1.0,
    agc: false,
    gpsTaggingEnabled: false,
    isBuiltIn: true
  },
  {
    id: 'preset_broadcast',
    name: 'Studio Broadcast',
    description: '48kHz, 24-bit stereo master with uncompressed fidelity, natural acoustic ambience, and linear dynamics.',
    category: 'music',
    sampleRate: 48000,
    bitDepth: 24,
    vadEnabled: false,
    vadThreshold: -48,
    vadDuration: 1500,
    format: 'wav',
    channels: 2,
    gain: 1.0,
    agc: false,
    gpsTaggingEnabled: false,
    isBuiltIn: true
  },
  {
    id: 'preset_field',
    name: 'Field Journalism',
    description: '44.1kHz, 24-bit mono interview capture with moderate VAD noise gate and automatic GPS geolocation tagging.',
    category: 'field',
    sampleRate: 44100,
    bitDepth: 24,
    vadEnabled: true,
    vadThreshold: -38,
    vadDuration: 1000,
    format: 'wav',
    channels: 1,
    gain: 1.1,
    agc: true,
    gpsTaggingEnabled: true,
    isBuiltIn: true
  }
];

const CUSTOM_PRESETS_STORAGE_KEY = 'kbt_custom_recording_presets';

export function getCustomRecordingPresets(): RecordingPreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse custom recording presets from storage:', err);
    return [];
  }
}

export function saveCustomRecordingPreset(
  presetData: Omit<RecordingPreset, 'id' | 'isBuiltIn' | 'createdAt'>
): RecordingPreset {
  const customList = getCustomRecordingPresets();
  const newPreset: RecordingPreset = {
    ...presetData,
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    isBuiltIn: false,
    createdAt: Date.now()
  };

  const updatedList = [newPreset, ...customList];
  try {
    localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Failed to save custom recording preset to storage:', err);
  }
  return newPreset;
}

export function deleteCustomRecordingPreset(presetId: string): void {
  const customList = getCustomRecordingPresets();
  const filtered = customList.filter((p) => p.id !== presetId);
  try {
    localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete custom preset:', err);
  }
}

export function getAllRecordingPresets(): RecordingPreset[] {
  return [...BUILT_IN_RECORDING_PRESETS, ...getCustomRecordingPresets()];
}

/**
 * Checks if current AudioConfig matches any existing built-in or custom preset
 */
export function matchActivePreset(
  config: AudioConfig,
  presets: RecordingPreset[] = getAllRecordingPresets()
): RecordingPreset | null {
  for (const p of presets) {
    const matchesSampleRate = p.sampleRate === config.sampleRate;
    const matchesBitDepth = p.bitDepth === config.bitDepth;
    const matchesVadEnabled = p.vadEnabled === config.vadEnabled;
    const matchesChannels = p.channels === config.channels;

    // Core matching: sampleRate + bitDepth + vadEnabled
    if (matchesSampleRate && matchesBitDepth && matchesVadEnabled) {
      if (p.vadEnabled) {
        // If VAD is enabled, check threshold within 4dB tolerance
        if (Math.abs(p.vadThreshold - config.vadThreshold) <= 4 && matchesChannels) {
          return p;
        }
      } else if (matchesChannels) {
        return p;
      }
    }
  }
  return null;
}
