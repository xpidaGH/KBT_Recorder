import { DSPSettings } from '../types/recorder';
import { applySpectralSubtraction } from './spectralSubtraction';

export const DEFAULT_DSP_SETTINGS: DSPSettings = {
  bypassAll: false,
  highPass: {
    enabled: false,
    frequency: 80,
    q: 0.707
  },
  lowPass: {
    enabled: false,
    frequency: 6000,
    q: 0.707
  },
  noiseReduction: {
    enabled: false,
    thresholdDb: -36,
    reductionDb: 24,
    attackMs: 10,
    releaseMs: 150
  },
  noiseGate: {
    enabled: false,
    floorThresholdDb: -42,
    reductionDb: 36,
    attackMs: 5,
    holdMs: 40,
    releaseMs: 150,
    hysteresisDb: 3
  },
  spectralSubtraction: {
    enabled: false,
    strengthAlpha: 1.8,
    noiseFloorBeta: 0.02,
    spectralSmoothing: 0.35,
    fftSize: 1024,
    noiseProfileMode: 'auto_silence'
  },
  outputGainDb: 0
};

export interface DSPPreset {
  id: string;
  name: string;
  description: string;
  type: 'highpass' | 'lowpass' | 'noise' | 'combo';
  settings: Partial<DSPSettings>;
}

export const DSP_PRESETS: DSPPreset[] = [
  {
    id: 'clean_vocal',
    name: 'Clean Voice Clarity',
    description: 'High-pass 100Hz rumble cut + subtle noise reduction for podcasts & lectures',
    type: 'combo',
    settings: {
      bypassAll: false,
      highPass: { enabled: true, frequency: 100, q: 0.707 },
      lowPass: { enabled: true, frequency: 8500, q: 0.707 },
      noiseReduction: { enabled: true, thresholdDb: -38, reductionDb: 18, attackMs: 8, releaseMs: 120 },
      outputGainDb: 1.5
    }
  },
  {
    id: 'wind_rumble_cut',
    name: 'Wind & Mic Rumble Cut',
    description: 'Steep high-pass filter at 120Hz to eliminate outdoor breeze and handling noise',
    type: 'highpass',
    settings: {
      bypassAll: false,
      highPass: { enabled: true, frequency: 120, q: 0.8 },
      lowPass: { enabled: false, frequency: 12000, q: 0.707 }
    }
  },
  {
    id: 'speech_clarity',
    name: 'Speech De-Mud (180 Hz)',
    description: 'Cuts low chest resonance and proximity effect for clearer speech intelligibility',
    type: 'highpass',
    settings: {
      highPass: { enabled: true, frequency: 180, q: 0.707 }
    }
  },
  {
    id: 'tape_hiss_cut',
    name: 'Hiss & Fan Hum Removal',
    description: 'Low-pass filter at 6.5kHz with noise reduction targeting hiss and computer fans',
    type: 'lowpass',
    settings: {
      bypassAll: false,
      lowPass: { enabled: true, frequency: 6500, q: 0.707 },
      noiseReduction: { enabled: true, thresholdDb: -34, reductionDb: 24, attackMs: 10, releaseMs: 160 }
    }
  },
  {
    id: 'warm_vintage_radio',
    name: 'Warm AM Radio / Vintage',
    description: 'Band-limited audio response between 300Hz and 3.4kHz for telephone/radio vibe',
    type: 'combo',
    settings: {
      bypassAll: false,
      highPass: { enabled: true, frequency: 320, q: 1.0 },
      lowPass: { enabled: true, frequency: 3400, q: 1.0 },
      noiseReduction: { enabled: false, thresholdDb: -36, reductionDb: 24, attackMs: 10, releaseMs: 150 },
      outputGainDb: 2.0
    }
  },
  {
    id: 'gentle_room_denoise',
    name: 'Gentle Room Denoise',
    description: 'Subtle gate that drops AC and ambient air hum without clipping whisper transients',
    type: 'noise',
    settings: {
      noiseReduction: { enabled: true, thresholdDb: -42, reductionDb: 16, attackMs: 12, releaseMs: 180 }
    }
  },
  {
    id: 'aggressive_speech_gate',
    name: 'Aggressive Noise Gate',
    description: 'Heavy gate for noisy environments like cafes, traffic, and loud computer rigs',
    type: 'noise',
    settings: {
      noiseReduction: { enabled: true, thresholdDb: -28, reductionDb: 36, attackMs: 5, releaseMs: 220 }
    }
  },
  {
    id: 'spectral_background_cut',
    name: 'Spectral Subtraction De-Noise',
    description: 'Removes constant background room hum, fan whirl & air hiss using FFT spectral subtraction',
    type: 'noise',
    settings: {
      bypassAll: false,
      highPass: { enabled: true, frequency: 80, q: 0.707 },
      lowPass: { enabled: true, frequency: 12000, q: 0.707 },
      spectralSubtraction: {
        enabled: true,
        strengthAlpha: 2.0,
        noiseFloorBeta: 0.02,
        spectralSmoothing: 0.35,
        fftSize: 1024,
        noiseProfileMode: 'auto_silence'
      },
      outputGainDb: 1.0
    }
  },
  {
    id: 'deep_fan_removal',
    name: 'Heavy Fan & HVAC Removal',
    description: 'Aggressive spectral subtraction (alpha 2.8x) combined with steep rumble cut for noisy rooms',
    type: 'combo',
    settings: {
      bypassAll: false,
      highPass: { enabled: true, frequency: 120, q: 0.8 },
      lowPass: { enabled: true, frequency: 9500, q: 0.707 },
      spectralSubtraction: {
        enabled: true,
        strengthAlpha: 2.8,
        noiseFloorBeta: 0.015,
        spectralSmoothing: 0.4,
        fftSize: 1024,
        noiseProfileMode: 'auto_silence'
      },
      outputGainDb: 1.5
    }
  },
  {
    id: 'studio_vocal_noise_gate',
    name: 'Podcast Vocal Noise Gate',
    description: 'Precision noise gate with -42dB floor threshold, 50ms hold, and 36dB attenuation floor',
    type: 'noise',
    settings: {
      bypassAll: false,
      noiseGate: {
        enabled: true,
        floorThresholdDb: -42,
        reductionDb: 36,
        attackMs: 4,
        holdMs: 50,
        releaseMs: 160,
        hysteresisDb: 3
      },
      noiseReduction: { enabled: true, thresholdDb: -42, reductionDb: 36, attackMs: 4, releaseMs: 160 }
    }
  },
  {
    id: 'hard_floor_mute_gate',
    name: 'Hard Floor Mute Gate (-80dB)',
    description: 'Complete silence floor for dead quiet pauses during voice recordings and voiceovers',
    type: 'noise',
    settings: {
      bypassAll: false,
      noiseGate: {
        enabled: true,
        floorThresholdDb: -40,
        reductionDb: 80,
        attackMs: 2,
        holdMs: 40,
        releaseMs: 120,
        hysteresisDb: 4
      },
      noiseReduction: { enabled: true, thresholdDb: -40, reductionDb: 48, attackMs: 2, releaseMs: 120 }
    }
  },
  {
    id: 'gentle_room_air_gate',
    name: 'Gentle Room & Air Gate',
    description: 'Gentle -52dB floor threshold that drops soft air conditioning without choking subtle syllables',
    type: 'noise',
    settings: {
      bypassAll: false,
      noiseGate: {
        enabled: true,
        floorThresholdDb: -52,
        reductionDb: 22,
        attackMs: 8,
        holdMs: 80,
        releaseMs: 220,
        hysteresisDb: 2
      },
      noiseReduction: { enabled: true, thresholdDb: -52, reductionDb: 22, attackMs: 8, releaseMs: 220 }
    }
  }
];

export { applySpectralSubtraction, captureNoiseProfile, autoEstimateNoiseProfile } from './spectralSubtraction';

/**
 * Applies a precision Noise Gate with adjustable Floor Threshold (dB),
 * Floor Reduction depth (dB), Hysteresis, Hold time, and Attack/Release envelope smoothing
 * to eliminate low-level background noise, room hum, and microphone hiss.
 */
export function applyNoiseGateToChannel(
  channel: Float32Array,
  sampleRate: number,
  floorThresholdDb: number, // -80 to -12 dB (floor threshold)
  reductionDb: number = 36, // 6 to 80 dB attenuation floor
  attackMs: number = 5, // 0.5 to 50 ms
  holdMs: number = 50, // 0 to 300 ms
  releaseMs: number = 150, // 10 to 600 ms
  hysteresisDb: number = 3 // 0 to 12 dB
): Float32Array {
  const output = new Float32Array(channel.length);
  const windowSize = Math.max(16, Math.floor(sampleRate * 0.005)); // 5ms RMS window for prompt gate response
  const minGain = Math.pow(10, -Math.abs(reductionDb) / 20); // Floor attenuation (e.g. -40dB -> 0.01)

  const openThresholdLinear = Math.pow(10, floorThresholdDb / 20);
  const closeThresholdLinear = Math.pow(10, (floorThresholdDb - Math.max(0, hysteresisDb)) / 20);

  const attackCoeff = Math.exp(-1 / (Math.max(0.0005, attackMs / 1000) * sampleRate));
  const releaseCoeff = Math.exp(-1 / (Math.max(0.005, releaseMs / 1000) * sampleRate));
  const holdSamples = Math.floor((Math.max(0, holdMs) / 1000) * sampleRate);

  let currentGain = 1.0;
  let runningSumSq = 0;
  let gateState: 'OPEN' | 'HOLD' | 'CLOSED' = 'CLOSED';
  let holdCounter = 0;

  // Prime initial window sum
  for (let i = 0; i < Math.min(windowSize, channel.length); i++) {
    runningSumSq += channel[i] * channel[i];
  }

  for (let i = 0; i < channel.length; i++) {
    // Sliding RMS calculation
    const leavingIndex = i - Math.floor(windowSize / 2);
    const enteringIndex = i + Math.floor(windowSize / 2);

    if (leavingIndex >= 0) {
      runningSumSq -= channel[leavingIndex] * channel[leavingIndex];
    }
    if (enteringIndex < channel.length) {
      runningSumSq += channel[enteringIndex] * channel[enteringIndex];
    }
    if (runningSumSq < 0) runningSumSq = 0;

    const rms = Math.sqrt(runningSumSq / windowSize);

    // Gate state machine with floor threshold & hysteresis
    if (rms >= openThresholdLinear) {
      gateState = 'OPEN';
      holdCounter = holdSamples;
    } else if (gateState === 'OPEN') {
      if (rms < closeThresholdLinear) {
        if (holdCounter > 0) {
          gateState = 'HOLD';
          holdCounter--;
        } else {
          gateState = 'CLOSED';
        }
      }
    } else if (gateState === 'HOLD') {
      if (holdCounter > 0) {
        holdCounter--;
      } else {
        gateState = 'CLOSED';
      }
    }

    let targetGain = 1.0;
    if (gateState === 'CLOSED') {
      targetGain = minGain;
    } else {
      targetGain = 1.0;
    }

    // Apply attack/release smoothing
    if (targetGain > currentGain) {
      // Opening gate
      currentGain = attackCoeff * currentGain + (1 - attackCoeff) * targetGain;
    } else {
      // Closing gate
      currentGain = releaseCoeff * currentGain + (1 - releaseCoeff) * targetGain;
    }

    output[i] = Math.max(-1, Math.min(1, channel[i] * currentGain));
  }

  return output;
}

/**
 * Applies smooth downward noise reduction / gating to Float32Array PCM samples.
 * Uses a sliding RMS window and exponential attack/release envelope follower
 * to prevent clicks, pumping, or harsh cutoffs.
 */
export function applyNoiseReductionToChannel(
  channel: Float32Array,
  sampleRate: number,
  thresholdDb: number,
  reductionDb: number,
  attackMs: number,
  releaseMs: number
): Float32Array {
  const output = new Float32Array(channel.length);
  const windowSize = Math.max(16, Math.floor(sampleRate * 0.008)); // 8ms RMS window
  const minGain = Math.pow(10, -reductionDb / 20); // Floor gain when below threshold
  const thresholdLinear = Math.pow(10, thresholdDb / 20);

  // Time constants for exponential smoothing
  const attackCoeff = Math.exp(-1 / ((attackMs / 1000) * sampleRate));
  const releaseCoeff = Math.exp(-1 / ((releaseMs / 1000) * sampleRate));

  let currentGain = 1.0;
  let runningSumSq = 0;

  // Initial window sum
  for (let i = 0; i < Math.min(windowSize, channel.length); i++) {
    runningSumSq += channel[i] * channel[i];
  }

  for (let i = 0; i < channel.length; i++) {
    // Sliding RMS calculation
    const leavingIndex = i - Math.floor(windowSize / 2);
    const enteringIndex = i + Math.floor(windowSize / 2);

    if (leavingIndex >= 0) {
      runningSumSq -= channel[leavingIndex] * channel[leavingIndex];
    }
    if (enteringIndex < channel.length) {
      runningSumSq += channel[enteringIndex] * channel[enteringIndex];
    }
    if (runningSumSq < 0) runningSumSq = 0;

    const rms = Math.sqrt(runningSumSq / windowSize);

    // Calculate target gain
    let targetGain = 1.0;
    if (rms < thresholdLinear) {
      if (rms <= 1e-6) {
        targetGain = minGain;
      } else {
        const levelDb = 20 * Math.log10(rms);
        const diffDb = thresholdDb - levelDb; // How many dB below threshold
        const attenDb = Math.min(reductionDb, diffDb * 1.5);
        targetGain = Math.max(minGain, Math.pow(10, -attenDb / 20));
      }
    }

    // Apply attack (opening gate faster) or release (closing gate gradually)
    if (targetGain > currentGain) {
      currentGain = attackCoeff * currentGain + (1 - attackCoeff) * targetGain;
    } else {
      currentGain = releaseCoeff * currentGain + (1 - releaseCoeff) * targetGain;
    }

    output[i] = Math.max(-1, Math.min(1, channel[i] * currentGain));
  }

  return output;
}

/**
 * Renders an AudioBuffer through the active DSP chain (High-Pass, Low-Pass, Gain, Noise Reduction)
 * using Web Audio OfflineAudioContext for sample-accurate, hardware-accelerated processing.
 */
export async function renderDSPAudioBuffer(
  inputBuffer: AudioBuffer,
  settings: DSPSettings,
  rangeSec?: { startSec: number; endSec: number }
): Promise<AudioBuffer> {
  const sampleRate = inputBuffer.sampleRate;
  const numChannels = inputBuffer.numberOfChannels;

  const startSec = rangeSec ? Math.max(0, rangeSec.startSec) : 0;
  const endSec = rangeSec ? Math.min(inputBuffer.duration, rangeSec.endSec) : inputBuffer.duration;
  const durationSec = Math.max(0.01, endSec - startSec);
  const lengthSamples = Math.floor(durationSec * sampleRate);

  // If completely bypassed and no gain boost, return slice directly
  if (settings.bypassAll && settings.outputGainDb === 0) {
    const offlineCtx = new OfflineAudioContext(numChannels, lengthSamples, sampleRate);
    const sliced = offlineCtx.createBuffer(numChannels, lengthSamples, sampleRate);
    const startSample = Math.floor(startSec * sampleRate);
    for (let ch = 0; ch < numChannels; ch++) {
      const src = inputBuffer.getChannelData(ch);
      const dst = sliced.getChannelData(ch);
      for (let s = 0; s < lengthSamples; s++) {
        dst[s] = src[startSample + s] || 0;
      }
    }
    return sliced;
  }

  // Create Offline Context
  const offlineCtx = new OfflineAudioContext(numChannels, lengthSamples, sampleRate);

  // Buffer source
  const sourceNode = offlineCtx.createBufferSource();
  sourceNode.buffer = inputBuffer;

  let lastNode: AudioNode = sourceNode;

  // 1. High-Pass Biquad Filter
  if (settings.highPass.enabled && !settings.bypassAll) {
    const hpNode = offlineCtx.createBiquadFilter();
    hpNode.type = 'highpass';
    hpNode.frequency.setValueAtTime(settings.highPass.frequency, 0);
    hpNode.Q.setValueAtTime(settings.highPass.q, 0);
    lastNode.connect(hpNode);
    lastNode = hpNode;
  }

  // 2. Low-Pass Biquad Filter
  if (settings.lowPass.enabled && !settings.bypassAll) {
    const lpNode = offlineCtx.createBiquadFilter();
    lpNode.type = 'lowpass';
    lpNode.frequency.setValueAtTime(settings.lowPass.frequency, 0);
    lpNode.Q.setValueAtTime(settings.lowPass.q, 0);
    lastNode.connect(lpNode);
    lastNode = lpNode;
  }

  // 3. Output Gain Node
  const gainNode = offlineCtx.createGain();
  const linearGain = Math.pow(10, settings.outputGainDb / 20);
  gainNode.gain.setValueAtTime(linearGain, 0);
  lastNode.connect(gainNode);
  lastNode = gainNode;

  lastNode.connect(offlineCtx.destination);

  // Start slice
  sourceNode.start(0, startSec, durationSec);

  // Render biquad filters + gain
  const renderedBuffer = await offlineCtx.startRendering();

  // 4. Apply Spectral Subtraction and/or Noise Gate / Noise Reduction if enabled
  const needSpectral = settings.spectralSubtraction?.enabled && !settings.bypassAll;
  const needNoiseGate = settings.noiseGate?.enabled && !settings.bypassAll;
  const needLegacyReduction = settings.noiseReduction?.enabled && !settings.bypassAll && !needNoiseGate;

  if (needSpectral || needNoiseGate || needLegacyReduction) {
    const finalBuffer = offlineCtx.createBuffer(numChannels, lengthSamples, sampleRate);
    for (let ch = 0; ch < numChannels; ch++) {
      let channelData: Float32Array<ArrayBufferLike> = renderedBuffer.getChannelData(ch);

      // 4a. Spectral Subtraction (frequency-domain background noise removal)
      if (needSpectral && settings.spectralSubtraction) {
        channelData = applySpectralSubtraction(
          channelData as any,
          sampleRate,
          settings.spectralSubtraction
        );
      }

      // 4b. Dedicated Precision Noise Gate with Floor Threshold
      if (needNoiseGate && settings.noiseGate) {
        channelData = applyNoiseGateToChannel(
          channelData as any,
          sampleRate,
          settings.noiseGate.floorThresholdDb,
          settings.noiseGate.reductionDb,
          settings.noiseGate.attackMs,
          settings.noiseGate.holdMs,
          settings.noiseGate.releaseMs,
          settings.noiseGate.hysteresisDb
        );
      } else if (needLegacyReduction) {
        // 4c. Backward-compatible noise reduction / gate
        channelData = applyNoiseReductionToChannel(
          channelData as any,
          sampleRate,
          settings.noiseReduction.thresholdDb,
          settings.noiseReduction.reductionDb,
          settings.noiseReduction.attackMs,
          settings.noiseReduction.releaseMs
        );
      }

      const targetChannel = finalBuffer.getChannelData(ch);
      targetChannel.set(channelData as any);
    }
    return finalBuffer;
  }

  return renderedBuffer;
}

/**
 * Calculates theoretical combined frequency response (in dB)
 * for visualization on canvas across logarithmic frequencies [20 Hz .. 20 kHz].
 */
export function computeFrequencyResponse(
  frequencies: Float32Array,
  settings: DSPSettings,
  sampleRate: number = 44100
): { combinedDb: Float32Array; hpDb: Float32Array; lpDb: Float32Array } {
  const count = frequencies.length;
  const combinedDb = new Float32Array(count);
  const hpDb = new Float32Array(count);
  const lpDb = new Float32Array(count);

  if (settings.bypassAll) {
    for (let i = 0; i < count; i++) {
      combinedDb[i] = settings.outputGainDb;
      hpDb[i] = 0;
      lpDb[i] = 0;
    }
    return { combinedDb, hpDb, lpDb };
  }

  try {
    const ctx = new OfflineAudioContext(1, 128, sampleRate);
    const magHP = new Float32Array(count);
    const phaseHP = new Float32Array(count);
    const magLP = new Float32Array(count);
    const phaseLP = new Float32Array(count);

    // Dummy filters to sample Web Audio transfer function
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = settings.highPass.frequency;
    hp.Q.value = settings.highPass.q;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = settings.lowPass.frequency;
    lp.Q.value = settings.lowPass.q;

    hp.getFrequencyResponse(frequencies as any, magHP as any, phaseHP as any);
    lp.getFrequencyResponse(frequencies as any, magLP as any, phaseLP as any);

    for (let i = 0; i < count; i++) {
      const hpGain = settings.highPass.enabled ? magHP[i] : 1.0;
      const lpGain = settings.lowPass.enabled ? magLP[i] : 1.0;

      const hpVal = 20 * Math.log10(Math.max(1e-4, hpGain));
      const lpVal = 20 * Math.log10(Math.max(1e-4, lpGain));

      hpDb[i] = hpVal;
      lpDb[i] = lpVal;
      combinedDb[i] = hpVal + lpVal + settings.outputGainDb;
    }
  } catch (e) {
    // Fallback if offline context is unavailable
    for (let i = 0; i < count; i++) {
      combinedDb[i] = settings.outputGainDb;
    }
  }

  return { combinedDb, hpDb, lpDb };
}

export interface NormalizationResult {
  peakLinear: number;
  peakDb: number;
  targetPeakDb: number; // -1.0 dB
  gainFactor: number;
  gainDb: number;
}

/**
 * Calculates peak amplitude across all channels and computes the gain factor
 * required to normalize the signal to target peak (-1.0 dBFS by default).
 */
export function computeNormalizationGain(
  audioBuffer: AudioBuffer,
  targetPeakDb: number = -1.0
): NormalizationResult {
  const numChannels = audioBuffer.numberOfChannels;
  const numSamples = audioBuffer.length;
  let maxPeak = 0;

  for (let ch = 0; ch < numChannels; ch++) {
    const data = audioBuffer.getChannelData(ch);
    for (let i = 0; i < numSamples; i++) {
      const abs = Math.abs(data[i]);
      if (abs > maxPeak) maxPeak = abs;
    }
  }

  const peakLinear = Math.max(1e-7, maxPeak);
  const peakDb = 20 * Math.log10(peakLinear);
  const targetLinear = Math.pow(10, targetPeakDb / 20); // ~0.89125 for -1.0 dB
  const gainFactor = targetLinear / peakLinear;
  const gainDb = targetPeakDb - peakDb;

  return {
    peakLinear,
    peakDb,
    targetPeakDb,
    gainFactor,
    gainDb
  };
}

/**
 * Normalizes an AudioBuffer to target peak (-1.0 dBFS) using Web Audio OfflineAudioContext.
 */
export async function normalizeAudioBuffer(
  audioBuffer: AudioBuffer,
  targetPeakDb: number = -1.0
): Promise<{ normalizedBuffer: AudioBuffer; result: NormalizationResult }> {
  const result = computeNormalizationGain(audioBuffer, targetPeakDb);
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;

  const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  const gainNode = offlineCtx.createGain();
  gainNode.gain.setValueAtTime(result.gainFactor, 0);

  source.connect(gainNode);
  gainNode.connect(offlineCtx.destination);
  source.start(0);

  const normalizedBuffer = await offlineCtx.startRendering();
  return { normalizedBuffer, result };
}
