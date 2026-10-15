import { AudioConfig, AudioID3Metadata, BitDepth } from '../types/recorder';

/**
 * Encodes Float32Array channel buffers into an uncompressed RIFF WAV Blob
 * Supporting 16-bit, 24-bit integer PCM, 32-bit IEEE Float PCM,
 * and embedding RIFF LIST INFO metadata chunks (INAM, IART, IPRD, ICRD, IGNR, ICMT).
 */
export function encodeWAV(
  channelsData: Float32Array[],
  sampleRate: number,
  bitDepth: BitDepth = 16,
  metadata?: AudioID3Metadata
): Blob {
  const numChannels = channelsData.length;
  const numSamples = channelsData[0].length;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;

  // Prepare LIST INFO subchunks if metadata is provided
  const infoSubchunks: { id: string; text: string }[] = [];
  if (metadata) {
    if (metadata.title) infoSubchunks.push({ id: 'INAM', text: metadata.title });
    if (metadata.artist) infoSubchunks.push({ id: 'IART', text: metadata.artist });
    if (metadata.album) infoSubchunks.push({ id: 'IPRD', text: metadata.album });
    if (metadata.year) infoSubchunks.push({ id: 'ICRD', text: metadata.year });
    if (metadata.genre) infoSubchunks.push({ id: 'IGNR', text: metadata.genre });
    if (metadata.comment) infoSubchunks.push({ id: 'ICMT', text: metadata.comment });
    if (metadata.track) infoSubchunks.push({ id: 'ITRK', text: metadata.track });
  }

  // Calculate size of LIST INFO chunk
  let listChunkSize = 0; // Size inside the LIST chunk (excluding 'LIST' and 4-byte size)
  if (infoSubchunks.length > 0) {
    listChunkSize = 4; // for 'INFO'
    for (const chunk of infoSubchunks) {
      const textLen = chunk.text.length + 1; // null-terminated
      const paddedLen = textLen + (textLen % 2); // WORD aligned
      listChunkSize += 8 + paddedLen; // 4 id + 4 size + data
    }
  }

  const totalListChunkBytes = infoSubchunks.length > 0 ? 8 + listChunkSize : 0;
  const totalBufferSize = 44 + dataSize + totalListChunkBytes;
  const buffer = new ArrayBuffer(totalBufferSize);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* RIFF chunk length: total file size - 8 */
  view.setUint32(4, 36 + dataSize + totalListChunkBytes, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (1 = PCM, 3 = IEEE Float) */
  const audioFormat = bitDepth === 32 ? 3 : 1;
  view.setUint16(20, audioFormat, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate */
  view.setUint32(28, byteRate, true);
  /* block align */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, dataSize, true);

  // Interleave and quantize channel samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channelsData[ch][i];
      // Hard clamp to [-1, 1]
      sample = Math.max(-1, Math.min(1, sample));

      if (bitDepth === 16) {
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, Math.floor(int16), true);
        offset += 2;
      } else if (bitDepth === 24) {
        const int24 = sample < 0 ? sample * 0x800000 : sample * 0x7fffff;
        const intVal = Math.floor(int24);
        view.setUint8(offset, intVal & 0xff);
        view.setUint8(offset + 1, (intVal >> 8) & 0xff);
        view.setUint8(offset + 2, (intVal >> 16) & 0xff);
        offset += 3;
      } else if (bitDepth === 32) {
        view.setFloat32(offset, sample, true);
        offset += 4;
      }
    }
  }

  // Write RIFF LIST INFO chunk if subchunks exist
  if (infoSubchunks.length > 0) {
    writeString(offset, 'LIST');
    view.setUint32(offset + 4, listChunkSize, true);
    writeString(offset + 8, 'INFO');
    offset += 12;

    for (const chunk of infoSubchunks) {
      writeString(offset, chunk.id);
      const textLen = chunk.text.length + 1; // includes null terminator
      view.setUint32(offset + 4, textLen, true);
      offset += 8;

      for (let c = 0; c < chunk.text.length; c++) {
        view.setUint8(offset + c, chunk.text.charCodeAt(c));
      }
      view.setUint8(offset + chunk.text.length, 0); // null terminator
      offset += textLen;

      if (textLen % 2 !== 0) {
        view.setUint8(offset, 0); // Word alignment pad byte
        offset += 1;
      }
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export interface MeterData {
  leftDb: number;
  rightDb: number;
  rmsDb: number;
  isClipping: boolean;
  isSpeaking: boolean;
}

export class ProAudioEngine {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private splitterNode: ChannelSplitterNode | null = null;
  private leftAnalyser: AnalyserNode | null = null;
  private rightAnalyser: AnalyserNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;

  private recordedSamplesLeft: Float32Array[] = [];
  private recordedSamplesRight: Float32Array[] = [];
  private totalSampleCount = 0;

  private isRecording = false;
  private isPaused = false;
  private config: AudioConfig;

  // VAD state
  private consecutiveSilenceMs = 0;
  private totalSkippedSamples = 0;
  private lastUpdateTime = 0;

  // Wake lock reference
  private wakeLock: any = null;

  constructor(config: AudioConfig) {
    this.config = config;
  }

  public updateConfig(newConfig: Partial<AudioConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (this.gainNode && newConfig.gain !== undefined) {
      this.gainNode.gain.setTargetAtTime(newConfig.gain, this.audioCtx?.currentTime || 0, 0.05);
    }
  }

  public async start(): Promise<void> {
    // Acquire screen wake lock if available to prevent sleep during recording
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.warn('Screen WakeLock request error:', err);
      }
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioContextClass({
      sampleRate: this.config.sampleRate
    });

    // Request user media with selected input device
    const constraints: MediaStreamConstraints = {
      audio: {
        deviceId: this.config.inputDeviceId ? { exact: this.config.inputDeviceId } : undefined,
        channelCount: this.config.channels,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false // We provide software AGC
      }
    };

    this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);

    // Create Preamp Gain
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(this.config.gain, this.audioCtx.currentTime);

    // Create Software AGC (Compressor / Limiter)
    this.compressorNode = this.audioCtx.createDynamicsCompressor();
    this.compressorNode.threshold.setValueAtTime(-18, this.audioCtx.currentTime);
    this.compressorNode.knee.setValueAtTime(10, this.audioCtx.currentTime);
    this.compressorNode.ratio.setValueAtTime(12, this.audioCtx.currentTime);
    this.compressorNode.attack.setValueAtTime(0.008, this.audioCtx.currentTime);
    this.compressorNode.release.setValueAtTime(0.25, this.audioCtx.currentTime);

    // Create Stereo Analyser nodes
    this.leftAnalyser = this.audioCtx.createAnalyser();
    this.leftAnalyser.fftSize = 2048;
    this.rightAnalyser = this.audioCtx.createAnalyser();
    this.rightAnalyser.fftSize = 2048;

    this.splitterNode = this.audioCtx.createChannelSplitter(2);

    // Audio Graph routing:
    // sourceNode -> gainNode -> (optional compressor) -> splitter -> analysers
    let currentOut: AudioNode = this.sourceNode;
    currentOut.connect(this.gainNode);
    currentOut = this.gainNode;

    if (this.config.agc) {
      currentOut.connect(this.compressorNode);
      currentOut = this.compressorNode;
    }

    currentOut.connect(this.splitterNode);
    this.splitterNode.connect(this.leftAnalyser, 0);
    this.splitterNode.connect(this.rightAnalyser, 1);

    // Record raw PCM samples via 4096 buffer size
    const bufferSize = 4096;
    this.processorNode = this.audioCtx.createScriptProcessor(bufferSize, this.config.channels, this.config.channels);
    currentOut.connect(this.processorNode);
    // Connect to destination dummy to keep processor alive
    this.processorNode.connect(this.audioCtx.destination);

    this.recordedSamplesLeft = [];
    this.recordedSamplesRight = [];
    this.totalSampleCount = 0;
    this.isRecording = true;
    this.isPaused = false;
    this.consecutiveSilenceMs = 0;
    this.totalSkippedSamples = 0;
    this.lastUpdateTime = performance.now();

    this.processorNode.onaudioprocess = (e) => {
      if (!this.isRecording || this.isPaused) return;

      const left = e.inputBuffer.getChannelData(0);
      const right = this.config.channels === 2 ? e.inputBuffer.getChannelData(1) : left;

      // Calculate buffer RMS dB
      let sumSquares = 0;
      for (let i = 0; i < left.length; i++) {
        sumSquares += left[i] * left[i];
      }
      const rms = Math.sqrt(sumSquares / left.length);
      const rmsDb = rms > 0.00001 ? 20 * Math.log10(rms) : -100;

      const now = performance.now();
      const elapsedMs = now - this.lastUpdateTime;
      this.lastUpdateTime = now;

      // Silence skipping (VAD)
      if (this.config.vadEnabled && rmsDb < this.config.vadThreshold) {
        this.consecutiveSilenceMs += elapsedMs;
        if (this.consecutiveSilenceMs > this.config.vadDuration) {
          // Skip recording this silent chunk
          this.totalSkippedSamples += left.length;
          return;
        }
      } else {
        this.consecutiveSilenceMs = 0;
      }

      this.recordedSamplesLeft.push(new Float32Array(left));
      if (this.config.channels === 2) {
        this.recordedSamplesRight.push(new Float32Array(right));
      }
      this.totalSampleCount += left.length;
    };
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public getMeterData(): MeterData {
    if (!this.leftAnalyser) {
      return { leftDb: -60, rightDb: -60, rmsDb: -60, isClipping: false, isSpeaking: false };
    }

    const dataLeft = new Float32Array(this.leftAnalyser.fftSize);
    this.leftAnalyser.getFloatTimeDomainData(dataLeft);

    let maxLeft = 0;
    let sumSqLeft = 0;
    let clipping = false;

    for (let i = 0; i < dataLeft.length; i++) {
      const val = Math.abs(dataLeft[i]);
      if (val > maxLeft) maxLeft = val;
      sumSqLeft += val * val;
      if (val >= 0.99) clipping = true;
    }

    let maxRight = maxLeft;
    let sumSqRight = sumSqLeft;

    if (this.rightAnalyser && this.config.channels === 2) {
      const dataRight = new Float32Array(this.rightAnalyser.fftSize);
      this.rightAnalyser.getFloatTimeDomainData(dataRight);
      maxRight = 0;
      sumSqRight = 0;
      for (let i = 0; i < dataRight.length; i++) {
        const val = Math.abs(dataRight[i]);
        if (val > maxRight) maxRight = val;
        sumSqRight += val * val;
        if (val >= 0.99) clipping = true;
      }
    }

    const rms = Math.sqrt((sumSqLeft + sumSqRight) / (dataLeft.length * (this.config.channels === 2 ? 2 : 1)));
    const rmsDb = rms > 0.0001 ? 20 * Math.log10(rms) : -60;
    const leftDb = maxLeft > 0.0001 ? 20 * Math.log10(maxLeft) : -60;
    const rightDb = maxRight > 0.0001 ? 20 * Math.log10(maxRight) : -60;

    const isSpeaking = rmsDb > (this.config.vadEnabled ? this.config.vadThreshold : -45);

    return {
      leftDb: Math.max(-60, Math.min(0, leftDb)),
      rightDb: Math.max(-60, Math.min(0, rightDb)),
      rmsDb: Math.max(-60, Math.min(0, rmsDb)),
      isClipping: clipping,
      isSpeaking
    };
  }

  public getVisualizerData(): {
    waveform: Float32Array;
    frequency: Uint8Array;
  } {
    if (!this.leftAnalyser) {
      return {
        waveform: new Float32Array(0),
        frequency: new Uint8Array(0)
      };
    }

    const waveform = new Float32Array(this.leftAnalyser.frequencyBinCount);
    this.leftAnalyser.getFloatTimeDomainData(waveform);

    const frequency = new Uint8Array(this.leftAnalyser.frequencyBinCount);
    this.leftAnalyser.getByteFrequencyData(frequency);

    return { waveform, frequency };
  }

  public async stop(): Promise<{
    blob: Blob;
    duration: number;
    sampleRate: number;
    channels: number;
    peakData: number[];
  }> {
    this.isRecording = false;

    // Disconnect audio nodes
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      await this.audioCtx.close();
    }
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
      } catch (err) {
        // ignore
      }
    }

    // Merge recorded chunks into flat channel buffers
    const totalSamples = this.totalSampleCount;
    const mergedLeft = new Float32Array(totalSamples);
    let offset = 0;
    for (const chunk of this.recordedSamplesLeft) {
      mergedLeft.set(chunk, offset);
      offset += chunk.length;
    }

    const channelsData: Float32Array[] = [mergedLeft];

    if (this.config.channels === 2 && this.recordedSamplesRight.length > 0) {
      const mergedRight = new Float32Array(totalSamples);
      let rOffset = 0;
      for (const chunk of this.recordedSamplesRight) {
        mergedRight.set(chunk, rOffset);
        rOffset += chunk.length;
      }
      channelsData.push(mergedRight);
    }

    // Compute 64-point normalized waveform peak summary for instant rendering in library
    const peakPoints = 64;
    const peakData: number[] = [];
    const step = Math.max(1, Math.floor(totalSamples / peakPoints));
    for (let p = 0; p < peakPoints; p++) {
      let maxPeak = 0;
      const start = p * step;
      const end = Math.min(start + step, totalSamples);
      for (let s = start; s < end; s++) {
        const val = Math.abs(mergedLeft[s]);
        if (val > maxPeak) maxPeak = val;
      }
      peakData.push(Number(maxPeak.toFixed(3)));
    }

    const duration = totalSamples / this.config.sampleRate;
    const blob = encodeWAV(channelsData, this.config.sampleRate, this.config.bitDepth);

    return {
      blob,
      duration,
      sampleRate: this.config.sampleRate,
      channels: this.config.channels,
      peakData
    };
  }

  public getRecordedSampleCount(): number {
    return this.totalSampleCount;
  }
}
