/**
 * Web Audio Silence Trimmer & Voice Segmentation Engine
 *
 * Automatically detects and excises silent intervals or compresses pauses
 * using root-mean-square (RMS) energy thresholding with customizable padding cushions
 * and micro-crossfading to guarantee pop-free, click-free audio splices.
 */

export type SilenceTrimMode = 'all_pauses' | 'lead_and_trail' | 'compress_pauses';

export interface SilenceDetectorOptions {
  thresholdDb: number; // -60 to -20 dB, default -40 dB
  minSilenceMs: number; // 150 to 2000 ms, default 350 ms
  paddingMs: number; // 30 to 200 ms cushion around speech, default 75 ms
  mode: SilenceTrimMode;
  compressTargetMs?: number; // Target pause duration in 'compress_pauses' mode (e.g. 350ms)
}

export const DEFAULT_SILENCE_OPTIONS: SilenceDetectorOptions = {
  thresholdDb: -40,
  minSilenceMs: 350,
  paddingMs: 75,
  mode: 'all_pauses',
  compressTargetMs: 350
};

export interface SilenceInterval {
  startSec: number;
  endSec: number;
  durationSec: number;
  startSample: number;
  endSample: number;
}

export interface KeptInterval {
  startSample: number;
  endSample: number;
  startSec: number;
  endSec: number;
}

export interface SilenceAnalysisResult {
  totalDurationSec: number;
  silentIntervals: SilenceInterval[];
  keptIntervals: KeptInterval[];
  totalSilenceSec: number;
  projectedDurationSec: number;
  percentSaved: number;
}

/**
 * Detects silent segments in an AudioBuffer based on RMS energy threshold.
 */
export function analyzeSilenceInAudioBuffer(
  audioBuffer: AudioBuffer,
  options: SilenceDetectorOptions
): SilenceAnalysisResult {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const totalSamples = audioBuffer.length;
  const totalDurationSec = totalSamples / sampleRate;

  const thresholdLinear = Math.pow(10, options.thresholdDb / 20);
  const minSilenceSamples = Math.floor((options.minSilenceMs / 1000) * sampleRate);
  const paddingSamples = Math.floor((options.paddingMs / 1000) * sampleRate);

  // 15ms frame step for high-precision boundary detection
  const frameSize = Math.max(16, Math.floor(sampleRate * 0.015));
  const numFrames = Math.floor(totalSamples / frameSize);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(audioBuffer.getChannelData(ch));
  }

  // Pre-calculate frame silence state
  const isFrameSilent = new Uint8Array(numFrames);

  for (let f = 0; f < numFrames; f++) {
    const start = f * frameSize;
    const end = Math.min(start + frameSize, totalSamples);
    const count = end - start;

    let sumSq = 0;
    for (let i = start; i < end; i++) {
      let mixed = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        mixed += channels[ch][i];
      }
      mixed /= numChannels;
      sumSq += mixed * mixed;
    }

    const rms = Math.sqrt(sumSq / Math.max(1, count));
    if (rms < thresholdLinear) {
      isFrameSilent[f] = 1;
    }
  }

  // Group contiguous silent frames
  const rawSilentIntervals: SilenceInterval[] = [];
  let inSilence = false;
  let silenceStartFrame = 0;

  for (let f = 0; f < numFrames; f++) {
    if (isFrameSilent[f] === 1) {
      if (!inSilence) {
        inSilence = true;
        silenceStartFrame = f;
      }
    } else {
      if (inSilence) {
        inSilence = false;
        const silenceEndFrame = f;
        const startSample = silenceStartFrame * frameSize;
        const endSample = silenceEndFrame * frameSize;
        if (endSample - startSample >= minSilenceSamples) {
          rawSilentIntervals.push({
            startSample,
            endSample,
            startSec: startSample / sampleRate,
            endSec: endSample / sampleRate,
            durationSec: (endSample - startSample) / sampleRate
          });
        }
      }
    }
  }

  // Handle trailing silence at end of buffer
  if (inSilence) {
    const startSample = silenceStartFrame * frameSize;
    const endSample = totalSamples;
    if (endSample - startSample >= minSilenceSamples) {
      rawSilentIntervals.push({
        startSample,
        endSample,
        startSec: startSample / sampleRate,
        endSec: endSample / sampleRate,
        durationSec: (endSample - startSample) / sampleRate
      });
    }
  }

  // Filter based on selected mode
  let effectiveSilentIntervals: SilenceInterval[] = [];

  if (options.mode === 'lead_and_trail') {
    // Only keep silence at very start and/or very end
    if (rawSilentIntervals.length > 0) {
      const first = rawSilentIntervals[0];
      if (first.startSample <= frameSize * 2) {
        effectiveSilentIntervals.push(first);
      }
      const last = rawSilentIntervals[rawSilentIntervals.length - 1];
      if (last.endSample >= totalSamples - frameSize * 2 && last !== first) {
        effectiveSilentIntervals.push(last);
      }
    }
  } else {
    // All pauses or compress pauses
    effectiveSilentIntervals = rawSilentIntervals;
  }

  // Build list of kept audio intervals with padding
  const keptIntervals: KeptInterval[] = [];

  if (effectiveSilentIntervals.length === 0) {
    keptIntervals.push({
      startSample: 0,
      endSample: totalSamples,
      startSec: 0,
      endSec: totalDurationSec
    });
  } else {
    let currentSample = 0;

    for (let idx = 0; idx < effectiveSilentIntervals.length; idx++) {
      const sil = effectiveSilentIntervals[idx];

      // Keep speech before this silence, respecting padding
      const keepEnd = Math.min(totalSamples, sil.startSample + paddingSamples);
      const keepStart = Math.max(0, currentSample);

      if (keepEnd > keepStart) {
        keptIntervals.push({
          startSample: keepStart,
          endSample: keepEnd,
          startSec: keepStart / sampleRate,
          endSec: keepEnd / sampleRate
        });
      }

      // Next speech block starts after silence minus pre-speech padding
      currentSample = Math.max(0, sil.endSample - paddingSamples);
    }

    // Remaining speech after last silence
    if (currentSample < totalSamples) {
      keptIntervals.push({
        startSample: currentSample,
        endSample: totalSamples,
        startSec: currentSample / sampleRate,
        endSec: totalDurationSec
      });
    }
  }

  // Calculate projected length
  let projectedSamples = 0;
  for (const interval of keptIntervals) {
    projectedSamples += Math.max(0, interval.endSample - interval.startSample);
  }

  // If compressing pauses instead of fully removing, add back target pause samples
  if (options.mode === 'compress_pauses' && effectiveSilentIntervals.length > 0) {
    const targetPauseSamples = Math.floor(((options.compressTargetMs || 350) / 1000) * sampleRate);
    projectedSamples += (effectiveSilentIntervals.length - 1) * targetPauseSamples;
  }

  projectedSamples = Math.min(totalSamples, Math.max(0, projectedSamples));
  const projectedDurationSec = projectedSamples / sampleRate;
  const totalSilenceSec = Math.max(0, totalDurationSec - projectedDurationSec);
  const percentSaved = totalDurationSec > 0 ? Math.round((totalSilenceSec / totalDurationSec) * 100) : 0;

  return {
    totalDurationSec,
    silentIntervals: effectiveSilentIntervals,
    keptIntervals,
    totalSilenceSec,
    projectedDurationSec,
    percentSaved
  };
}

/**
 * Creates a new AudioBuffer with silence removed using Web Audio API and micro-crossfades.
 */
export async function trimSilenceFromAudioBuffer(
  audioBuffer: AudioBuffer,
  options: SilenceDetectorOptions
): Promise<{ trimmedBuffer: AudioBuffer; stats: SilenceAnalysisResult }> {
  const stats = analyzeSilenceInAudioBuffer(audioBuffer, options);
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;

  // If no silence detected or minimal change, return clone
  if (stats.silentIntervals.length === 0 || stats.keptIntervals.length === 0) {
    const offlineCtx = new OfflineAudioContext(numChannels, audioBuffer.length, sampleRate);
    const cloned = offlineCtx.createBuffer(numChannels, audioBuffer.length, sampleRate);
    for (let ch = 0; ch < numChannels; ch++) {
      cloned.copyToChannel(audioBuffer.getChannelData(ch), ch);
    }
    return { trimmedBuffer: cloned, stats };
  }

  // Crossfade length (3ms) to prevent boundary clicks
  const xfadeLength = Math.min(128, Math.floor(sampleRate * 0.003));

  // Calculate exact total length
  let totalLength = 0;
  for (let i = 0; i < stats.keptIntervals.length; i++) {
    const k = stats.keptIntervals[i];
    const span = Math.max(0, k.endSample - k.startSample);
    totalLength += span;
  }

  // If compressing pauses, add target pause buffers between kept intervals
  const compressPauseSamples = options.mode === 'compress_pauses'
    ? Math.floor(((options.compressTargetMs || 350) / 1000) * sampleRate)
    : 0;

  if (options.mode === 'compress_pauses' && stats.keptIntervals.length > 1) {
    totalLength += (stats.keptIntervals.length - 1) * compressPauseSamples;
  }

  totalLength = Math.max(128, totalLength);

  const offlineCtx = new OfflineAudioContext(numChannels, totalLength, sampleRate);
  const outputBuffer = offlineCtx.createBuffer(numChannels, totalLength, sampleRate);

  const srcChannels: Float32Array[] = [];
  const dstChannels: Float32Array[] = [];

  for (let ch = 0; ch < numChannels; ch++) {
    srcChannels.push(audioBuffer.getChannelData(ch));
    dstChannels.push(outputBuffer.getChannelData(ch));
  }

  let writeOffset = 0;

  for (let idx = 0; idx < stats.keptIntervals.length; idx++) {
    const interval = stats.keptIntervals[idx];
    const start = interval.startSample;
    const end = Math.min(audioBuffer.length, interval.endSample);
    const count = end - start;

    if (count <= 0) continue;

    for (let ch = 0; ch < numChannels; ch++) {
      const src = srcChannels[ch];
      const dst = dstChannels[ch];

      for (let s = 0; s < count; s++) {
        dst[writeOffset + s] = src[start + s];
      }

      // Apply subtle micro-fade at leading junction
      if (idx > 0 && count > xfadeLength * 2) {
        for (let x = 0; x < xfadeLength; x++) {
          const fadeFactor = x / xfadeLength;
          dst[writeOffset + x] *= fadeFactor;
        }
      }

      // Apply subtle micro-fade at trailing junction
      if (idx < stats.keptIntervals.length - 1 && count > xfadeLength * 2) {
        for (let x = 0; x < xfadeLength; x++) {
          const fadeFactor = 1 - (x / xfadeLength);
          dst[writeOffset + count - xfadeLength + x] *= fadeFactor;
        }
      }
    }

    writeOffset += count;

    // Insert tiny compressed silence pause if mode === 'compress_pauses'
    if (options.mode === 'compress_pauses' && idx < stats.keptIntervals.length - 1) {
      writeOffset += compressPauseSamples;
    }
  }

  return { trimmedBuffer: outputBuffer, stats };
}
