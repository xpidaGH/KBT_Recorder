/**
 * Spectral Subtraction Digital Signal Processing (DSP) Engine
 *
 * Implements Short-Time Fourier Transform (STFT) spectral subtraction
 * for background noise reduction (fan hum, air conditioning, hiss, room rumble).
 *
 * Includes:
 * - Optimized in-place Radix-2 Cooley-Tukey FFT & IFFT
 * - Hanning windowing with 50% overlap-add (OLA) perfect reconstruction
 * - Noise profile estimation (auto from silence / pauses or user-selected range)
 * - Power / Magnitude over-subtraction with configurable alpha (subtraction factor)
 * - Spectral floor beta to eliminate musical noise / tonal chirping artifacts
 * - Inter-frame spectral magnitude smoothing for clean vocal transparency
 */

import { SpectralSubtractionSettings } from '../types/recorder';

/**
 * Pre-computes bit-reversal indices for a given power-of-two size N.
 */
function getBitReversedIndices(n: number): Uint32Array {
  const indices = new Uint32Array(n);
  const bits = Math.round(Math.log2(n));
  for (let i = 0; i < n; i++) {
    let rev = 0;
    for (let j = 0; j < bits; j++) {
      if ((i >> j) & 1) {
        rev |= 1 << (bits - 1 - j);
      }
    }
    indices[i] = rev;
  }
  return indices;
}

// Cache of bit-reversal tables and twiddle factors for standard FFT sizes
const bitRevCache = new Map<number, Uint32Array>();
const cosCache = new Map<number, Float32Array>();
const sinCache = new Map<number, Float32Array>();

function getTwiddles(n: number): { cosTable: Float32Array; sinTable: Float32Array } {
  if (!cosCache.has(n)) {
    const cosTable = new Float32Array(n / 2);
    const sinTable = new Float32Array(n / 2);
    for (let i = 0; i < n / 2; i++) {
      const angle = (-2 * Math.PI * i) / n;
      cosTable[i] = Math.cos(angle);
      sinTable[i] = Math.sin(angle);
    }
    cosCache.set(n, cosTable);
    sinCache.set(n, sinTable);
  }
  return { cosTable: cosCache.get(n)!, sinTable: sinCache.get(n)! };
}

/**
 * Fast in-place Radix-2 Cooley-Tukey FFT.
 * Modifies real and imag arrays in-place.
 */
export function fft(real: Float32Array, imag: Float32Array): void {
  const n = real.length;
  if ((n & (n - 1)) !== 0) {
    throw new Error(`FFT size must be a power of 2, received ${n}`);
  }

  // Bit reversal permutation
  let bitRev = bitRevCache.get(n);
  if (!bitRev) {
    bitRev = getBitReversedIndices(n);
    bitRevCache.set(n, bitRev);
  }

  for (let i = 0; i < n; i++) {
    const j = bitRev[i];
    if (j > i) {
      const tr = real[i];
      real[i] = real[j];
      real[j] = tr;

      const ti = imag[i];
      imag[i] = imag[j];
      imag[j] = ti;
    }
  }

  // Cooley-Tukey butterflies
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const step = n / len;
    const { cosTable, sinTable } = getTwiddles(n);

    for (let i = 0; i < n; i += len) {
      for (let j = 0; j < half; j++) {
        const twiddleIdx = j * step;
        const cos = cosTable[twiddleIdx];
        const sin = sinTable[twiddleIdx];

        const evenR = real[i + j];
        const evenI = imag[i + j];
        const oddR = real[i + j + half];
        const oddI = imag[i + j + half];

        // Complex multiplication: (oddR + j*oddI) * (cos + j*sin)
        const tR = oddR * cos - oddI * sin;
        const tI = oddR * sin + oddI * cos;

        real[i + j] = evenR + tR;
        imag[i + j] = evenI + tI;
        real[i + j + half] = evenR - tR;
        imag[i + j + half] = evenI - tI;
      }
    }
  }
}

/**
 * Fast in-place Radix-2 Inverse FFT (IFFT).
 * Modifies real and imag arrays in-place.
 */
export function ifft(real: Float32Array, imag: Float32Array): void {
  const n = real.length;
  // Conjugate imaginary parts
  for (let i = 0; i < n; i++) {
    imag[i] = -imag[i];
  }

  // Run forward FFT
  fft(real, imag);

  // Conjugate and scale by 1/n
  const invN = 1 / n;
  for (let i = 0; i < n; i++) {
    real[i] *= invN;
    imag[i] = -imag[i] * invN;
  }
}

/**
 * Generate Hanning Window for windowing frames
 */
export function createHanningWindow(size: number): Float32Array {
  const window = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }
  return window;
}

/**
 * Capture or estimate a noise magnitude spectrum profile from a specific audio region
 * (e.g. initial silence or user-selected range [startSec, endSec]).
 */
export function captureNoiseProfile(
  channel: Float32Array,
  sampleRate: number,
  fftSize: number = 1024,
  startSec: number = 0,
  durationSec: number = 0.5
): number[] {
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const lengthSamples = Math.min(channel.length - startSample, Math.floor(durationSec * sampleRate));
  const numBins = fftSize / 2;
  const avgSpectrum = new Float32Array(numBins);

  if (lengthSamples < fftSize) {
    // If segment is too short, return flat minimum floor
    return Array.from({ length: numBins }, () => 1e-4);
  }

  const window = createHanningWindow(fftSize);
  const hopSize = fftSize / 2;
  const numFrames = Math.max(1, Math.floor((lengthSamples - fftSize) / hopSize) + 1);

  const real = new Float32Array(fftSize);
  const imag = new Float32Array(fftSize);

  let validFrames = 0;

  for (let f = 0; f < numFrames; f++) {
    const offset = startSample + f * hopSize;
    if (offset + fftSize > channel.length) break;

    for (let i = 0; i < fftSize; i++) {
      real[i] = channel[offset + i] * window[i];
      imag[i] = 0;
    }

    fft(real, imag);

    // Compute magnitude for first numBins
    for (let k = 0; k < numBins; k++) {
      const mag = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
      avgSpectrum[k] += mag;
    }
    validFrames++;
  }

  if (validFrames === 0) validFrames = 1;

  const result: number[] = new Array(numBins);
  for (let k = 0; k < numBins; k++) {
    result[k] = Math.max(1e-5, avgSpectrum[k] / validFrames);
  }

  return result;
}

/**
 * Automatically estimates the noise spectrum across an entire recording
 * by finding the quietest frames (minimum statistics / non-speech percentile).
 */
export function autoEstimateNoiseProfile(
  channel: Float32Array,
  sampleRate: number,
  fftSize: number = 1024
): number[] {
  const numBins = fftSize / 2;
  const window = createHanningWindow(fftSize);
  const hopSize = fftSize / 2;
  const totalFrames = Math.floor((channel.length - fftSize) / hopSize);

  if (totalFrames <= 0) {
    return Array.from({ length: numBins }, () => 1e-4);
  }

  // Calculate energy for each frame to identify quiet background noise intervals
  interface FrameMeta {
    index: number;
    offset: number;
    energy: number;
  }

  // Sample up to 200 frames evenly distributed across audio to keep analysis ultra fast
  const step = Math.max(1, Math.floor(totalFrames / 200));
  const sampledFrames: FrameMeta[] = [];

  for (let f = 0; f < totalFrames; f += step) {
    const offset = f * hopSize;
    let sumSq = 0;
    for (let i = 0; i < fftSize; i += 4) {
      const s = channel[offset + i] || 0;
      sumSq += s * s;
    }
    sampledFrames.push({
      index: f,
      offset,
      energy: sumSq
    });
  }

  // Sort by energy and take bottom 20% (quietest frames containing ambient background noise)
  sampledFrames.sort((a, b) => a.energy - b.energy);
  const noiseFramesCount = Math.max(4, Math.floor(sampledFrames.length * 0.2));
  const noiseFrames = sampledFrames.slice(0, noiseFramesCount);

  const avgSpectrum = new Float32Array(numBins);
  const real = new Float32Array(fftSize);
  const imag = new Float32Array(fftSize);

  for (const frame of noiseFrames) {
    const offset = frame.offset;
    for (let i = 0; i < fftSize; i++) {
      real[i] = (channel[offset + i] || 0) * window[i];
      imag[i] = 0;
    }

    fft(real, imag);

    for (let k = 0; k < numBins; k++) {
      avgSpectrum[k] += Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
    }
  }

  const result: number[] = new Array(numBins);
  for (let k = 0; k < numBins; k++) {
    result[k] = Math.max(1e-5, avgSpectrum[k] / noiseFrames.length);
  }

  return result;
}

/**
 * Applies Spectral Subtraction algorithm to Float32Array PCM samples:
 * Y[k] = max( |X[k]|^gamma - alpha * |N[k]|^gamma, beta * |N[k]|^gamma ) ^ (1/gamma)
 *
 * Parameters:
 * - channel: PCM samples
 * - sampleRate: sample rate (e.g. 44100 / 48000)
 * - settings: SpectralSubtractionSettings
 * - customNoiseProfile: optional pre-captured noise spectrum
 */
export function applySpectralSubtraction(
  channel: Float32Array,
  sampleRate: number,
  settings: SpectralSubtractionSettings,
  customNoiseProfile?: number[]
): Float32Array {
  const fftSize = settings.fftSize || 1024;
  const numBins = fftSize / 2;
  const hopSize = fftSize / 2; // 50% overlap for perfect Hanning reconstruction
  const window = createHanningWindow(fftSize);

  // 1. Obtain noise spectrum profile
  let noiseProfile: number[];
  if (customNoiseProfile && customNoiseProfile.length === numBins) {
    noiseProfile = customNoiseProfile;
  } else if (settings.capturedProfile && settings.capturedProfile.length === numBins) {
    noiseProfile = settings.capturedProfile;
  } else {
    // Auto-estimate noise profile
    noiseProfile = autoEstimateNoiseProfile(channel, sampleRate, fftSize);
  }

  const alpha = settings.strengthAlpha !== undefined ? settings.strengthAlpha : 1.8;
  const beta = settings.noiseFloorBeta !== undefined ? settings.noiseFloorBeta : 0.02;
  const smoothing = settings.spectralSmoothing !== undefined ? settings.spectralSmoothing : 0.35;

  const output = new Float32Array(channel.length);
  const totalFrames = Math.floor((channel.length - fftSize) / hopSize);

  if (totalFrames <= 0) {
    return new Float32Array(channel);
  }

  const real = new Float32Array(fftSize);
  const imag = new Float32Array(fftSize);

  // Buffer to track smoothed magnitudes across consecutive frames to eliminate musical noise
  const prevSmoothedMag = new Float32Array(numBins);

  // Pre-calculate squared noise spectrum for power subtraction (gamma = 2.0)
  const noisePower = new Float32Array(numBins);
  for (let k = 0; k < numBins; k++) {
    const nMag = noiseProfile[k] || 1e-5;
    noisePower[k] = nMag * nMag;
  }

  for (let f = 0; f < totalFrames; f++) {
    const offset = f * hopSize;

    // Apply analysis window
    for (let i = 0; i < fftSize; i++) {
      real[i] = channel[offset + i] * window[i];
      imag[i] = 0;
    }

    // Forward FFT into frequency domain
    fft(real, imag);

    // Process magnitude spectrum
    for (let k = 0; k < numBins; k++) {
      const r = real[k];
      const im = imag[k];
      const mag = Math.sqrt(r * r + im * im);
      const phase = Math.atan2(im, r);

      const signalPower = mag * mag;
      const nPower = noisePower[k];

      // Berouti spectral subtraction formula with over-subtraction factor alpha and floor beta:
      // Subtracted power = signalPower - alpha * noisePower
      const subPower = signalPower - alpha * nPower;
      const floorPower = beta * nPower;
      const cleanedPower = Math.max(subPower, floorPower);
      let cleanedMag = Math.sqrt(cleanedPower);

      // Frame-to-frame temporal smoothing to suppress isolated musical chirps
      if (f > 0 && smoothing > 0) {
        cleanedMag = (1 - smoothing) * cleanedMag + smoothing * prevSmoothedMag[k];
      }
      prevSmoothedMag[k] = cleanedMag;

      // Reconstruct symmetric complex spectrum for Inverse FFT
      const newReal = cleanedMag * Math.cos(phase);
      const newImag = cleanedMag * Math.sin(phase);

      real[k] = newReal;
      imag[k] = newImag;

      // Mirror for negative frequencies (k > 0)
      if (k > 0) {
        const mirrorIdx = fftSize - k;
        real[mirrorIdx] = newReal;
        imag[mirrorIdx] = -newImag;
      }
    }

    // DC and Nyquist are pure real
    imag[0] = 0;
    imag[numBins] = 0;

    // Inverse FFT back into time domain
    ifft(real, imag);

    // Overlap-Add (OLA) with 50% Hanning synthesis
    for (let i = 0; i < fftSize; i++) {
      output[offset + i] += real[i];
    }
  }

  // Handle remaining tail samples at the end
  const processedLength = (totalFrames - 1) * hopSize + fftSize;
  for (let i = processedLength; i < channel.length; i++) {
    output[i] = channel[i] * 0.1; // Gentle taper
  }

  return output;
}
