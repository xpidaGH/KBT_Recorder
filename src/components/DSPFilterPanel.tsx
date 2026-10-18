import React, { useEffect, useRef, useState, useMemo } from 'react';
import { DSPSettings, SpectralSubtractionSettings, NoiseGateSettings } from '../types/recorder';
import {
  DSP_PRESETS,
  DSPPreset,
  computeFrequencyResponse,
  captureNoiseProfile,
  autoEstimateNoiseProfile,
  applyNoiseGateToChannel
} from '../utils/dspEngine';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Activity,
  Layers,
  Disc,
  Wand2,
  Play,
  Square,
  Cpu,
  RefreshCw,
  Scissors,
  CheckCircle2,
  Info,
  Sliders,
  ShieldCheck,
  DoorClosed,
  DoorOpen,
  Zap,
  Gauge
} from 'lucide-react';

interface DSPFilterPanelProps {
  settings: DSPSettings;
  onChange: (newSettings: DSPSettings) => void;
  onApplyAndExport?: () => void;
  isProcessing?: boolean;
  audioBuffer?: AudioBuffer | null;
  selectionRange?: { startSec: number; endSec: number };
  onPreviewToggle?: () => void;
  isPreviewPlaying?: boolean;
  onApplyCleanToEditor?: () => void;
  onPreviewNoiseGateToggle?: () => void;
  isNoiseGatePreviewPlaying?: boolean;
  onApplyNoiseGateToEditor?: () => void;
}

export const DSPFilterPanel: React.FC<DSPFilterPanelProps> = ({
  settings,
  onChange,
  onApplyAndExport,
  isProcessing = false,
  audioBuffer,
  selectionRange,
  onPreviewToggle,
  isPreviewPlaying = false,
  onApplyCleanToEditor,
  onPreviewNoiseGateToggle,
  isNoiseGatePreviewPlaying = false,
  onApplyNoiseGateToEditor
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const profileCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [profilerFeedback, setProfilerFeedback] = useState<string | null>(null);
  const [gateFeedback, setGateFeedback] = useState<string | null>(null);

  // Safe fallback for spectral subtraction settings
  const spectralSettings: SpectralSubtractionSettings = useMemo(() => {
    return (
      settings.spectralSubtraction || {
        enabled: false,
        strengthAlpha: 1.8,
        noiseFloorBeta: 0.02,
        spectralSmoothing: 0.35,
        fftSize: 1024,
        noiseProfileMode: 'auto_silence'
      }
    );
  }, [settings.spectralSubtraction]);

  // Safe fallback for Noise Gate settings
  const gateSettings: NoiseGateSettings = useMemo(() => {
    return (
      settings.noiseGate || {
        enabled: settings.noiseReduction?.enabled || false,
        floorThresholdDb: settings.noiseReduction?.thresholdDb ?? -42,
        reductionDb: settings.noiseReduction?.reductionDb ?? 36,
        attackMs: settings.noiseReduction?.attackMs ?? 5,
        holdMs: 40,
        releaseMs: settings.noiseReduction?.releaseMs ?? 150,
        hysteresisDb: 3
      }
    );
  }, [settings.noiseGate, settings.noiseReduction]);

  // Measure recording noise floor and dynamic peak if audioBuffer is available
  const measuredNoiseFloorDb = useMemo(() => {
    if (!audioBuffer) return null;
    try {
      const data = audioBuffer.getChannelData(0);
      const step = Math.max(1, Math.floor(data.length / 500));
      const windowSamples = Math.min(data.length, Math.floor(audioBuffer.sampleRate * 0.05)); // 50ms windows
      let minRms = 1.0;
      let maxPeak = 0.0;

      for (let i = 0; i < data.length - windowSamples; i += windowSamples) {
        let sumSq = 0;
        for (let j = 0; j < windowSamples; j += 4) {
          const s = data[i + j];
          sumSq += s * s;
          const absVal = Math.abs(s);
          if (absVal > maxPeak) maxPeak = absVal;
        }
        const rms = Math.sqrt(sumSq / (windowSamples / 4));
        if (rms > 1e-5 && rms < minRms) {
          minRms = rms;
        }
      }

      const floorDb = Math.round(20 * Math.log10(Math.max(1e-5, minRms)));
      const peakDb = Math.round(20 * Math.log10(Math.max(1e-5, maxPeak)));
      return { floorDb, peakDb };
    } catch (e) {
      return null;
    }
  }, [audioBuffer]);

  // Update helpers
  const updateSetting = <K extends keyof DSPSettings>(key: K, value: DSPSettings[K]) => {
    onChange({
      ...settings,
      [key]: value
    });
  };

  const updateHighPass = (field: keyof DSPSettings['highPass'], value: any) => {
    onChange({
      ...settings,
      highPass: {
        ...settings.highPass,
        [field]: value
      }
    });
  };

  const updateLowPass = (field: keyof DSPSettings['lowPass'], value: any) => {
    onChange({
      ...settings,
      lowPass: {
        ...settings.lowPass,
        [field]: value
      }
    });
  };

  const updateNoiseGate = (field: keyof NoiseGateSettings, value: any) => {
    const updatedGate: NoiseGateSettings = {
      ...gateSettings,
      [field]: value
    };
    onChange({
      ...settings,
      noiseGate: updatedGate,
      noiseReduction: {
        ...settings.noiseReduction,
        enabled: updatedGate.enabled,
        thresholdDb: updatedGate.floorThresholdDb,
        reductionDb: Math.min(48, updatedGate.reductionDb),
        attackMs: updatedGate.attackMs,
        releaseMs: updatedGate.releaseMs
      }
    });
  };

  const handleAutoDetectFloorThreshold = () => {
    if (!measuredNoiseFloorDb) {
      setGateFeedback('No audio loaded to measure noise floor.');
      setTimeout(() => setGateFeedback(null), 3000);
      return;
    }
    // Set floor threshold 4dB above measured background noise floor
    const recommendedThreshold = Math.min(-18, Math.max(-70, measuredNoiseFloorDb.floorDb + 4));
    updateNoiseGate('floorThresholdDb', recommendedThreshold);
    updateNoiseGate('enabled', true);
    setGateFeedback(`Noise floor auto-detected at ${measuredNoiseFloorDb.floorDb} dB. Floor threshold set to ${recommendedThreshold} dB.`);
    setTimeout(() => setGateFeedback(null), 4000);
  };

  const updateSpectral = (field: keyof SpectralSubtractionSettings, value: any) => {
    onChange({
      ...settings,
      spectralSubtraction: {
        ...spectralSettings,
        [field]: value
      }
    });
  };

  // Capture noise profile from current selection range [startSec, endSec]
  const handleCaptureSelectionProfile = () => {
    if (!audioBuffer) {
      setProfilerFeedback('No audio loaded in editor to sample.');
      setTimeout(() => setProfilerFeedback(null), 3000);
      return;
    }

    try {
      const channel = audioBuffer.getChannelData(0);
      const start = selectionRange?.startSec ?? 0;
      const end = selectionRange?.endSec ?? Math.min(0.6, audioBuffer.duration);
      const duration = Math.max(0.08, end - start);

      const profile = captureNoiseProfile(
        channel,
        audioBuffer.sampleRate,
        spectralSettings.fftSize || 1024,
        start,
        duration
      );

      onChange({
        ...settings,
        spectralSubtraction: {
          ...spectralSettings,
          enabled: true,
          capturedProfile: profile,
          noiseProfileMode: 'selection'
        }
      });

      setProfilerFeedback(
        `Noise profile sampled from ${start.toFixed(2)}s - ${end.toFixed(2)}s (${profile.length} FFT bins)`
      );
      setTimeout(() => setProfilerFeedback(null), 3500);
    } catch (e) {
      console.error(e);
      setProfilerFeedback('Failed to sample noise profile from selection.');
      setTimeout(() => setProfilerFeedback(null), 3000);
    }
  };

  // Auto-detect noise profile from quiet pauses / silence
  const handleAutoEstimateProfile = () => {
    if (!audioBuffer) {
      setProfilerFeedback('No audio loaded in editor to analyze.');
      setTimeout(() => setProfilerFeedback(null), 3000);
      return;
    }

    try {
      const channel = audioBuffer.getChannelData(0);
      const profile = autoEstimateNoiseProfile(
        channel,
        audioBuffer.sampleRate,
        spectralSettings.fftSize || 1024
      );

      onChange({
        ...settings,
        spectralSubtraction: {
          ...spectralSettings,
          enabled: true,
          capturedProfile: profile,
          noiseProfileMode: 'auto_silence'
        }
      });

      setProfilerFeedback(
        `Auto-detected room noise profile across quiet intervals (${profile.length} bins)`
      );
      setTimeout(() => setProfilerFeedback(null), 3500);
    } catch (e) {
      console.error(e);
      setProfilerFeedback('Failed to auto-estimate noise profile.');
      setTimeout(() => setProfilerFeedback(null), 3000);
    }
  };

  // Clear captured noise profile to revert to adaptive mode
  const handleClearProfile = () => {
    const updated = { ...spectralSettings };
    delete updated.capturedProfile;
    updated.noiseProfileMode = 'auto_silence';
    onChange({
      ...settings,
      spectralSubtraction: updated
    });
    setProfilerFeedback('Reverted to dynamic adaptive noise estimation.');
    setTimeout(() => setProfilerFeedback(null), 3000);
  };

  // Preset selector
  const handleApplyPreset = (preset: DSPPreset) => {
    const updatedGate = preset.settings.noiseGate
      ? { ...gateSettings, ...preset.settings.noiseGate }
      : (preset.settings.noiseReduction
          ? {
              ...gateSettings,
              enabled: preset.settings.noiseReduction.enabled ?? gateSettings.enabled,
              floorThresholdDb: preset.settings.noiseReduction.thresholdDb ?? gateSettings.floorThresholdDb,
              reductionDb: preset.settings.noiseReduction.reductionDb ?? gateSettings.reductionDb,
              attackMs: preset.settings.noiseReduction.attackMs ?? gateSettings.attackMs,
              releaseMs: preset.settings.noiseReduction.releaseMs ?? gateSettings.releaseMs
            }
          : gateSettings);

    onChange({
      ...settings,
      ...preset.settings,
      highPass: preset.settings.highPass
        ? { ...settings.highPass, ...preset.settings.highPass }
        : settings.highPass,
      lowPass: preset.settings.lowPass
        ? { ...settings.lowPass, ...preset.settings.lowPass }
        : settings.lowPass,
      noiseGate: updatedGate,
      noiseReduction: preset.settings.noiseReduction
        ? { ...settings.noiseReduction, ...preset.settings.noiseReduction }
        : {
            ...settings.noiseReduction,
            enabled: updatedGate.enabled,
            thresholdDb: updatedGate.floorThresholdDb,
            reductionDb: Math.min(48, updatedGate.reductionDb),
            attackMs: updatedGate.attackMs,
            releaseMs: updatedGate.releaseMs
          },
      spectralSubtraction: preset.settings.spectralSubtraction
        ? { ...spectralSettings, ...preset.settings.spectralSubtraction }
        : spectralSettings
    });
  };

  // Reset to default
  const handleReset = () => {
    onChange({
      bypassAll: false,
      highPass: { enabled: false, frequency: 80, q: 0.707 },
      lowPass: { enabled: false, frequency: 6000, q: 0.707 },
      noiseReduction: { enabled: false, thresholdDb: -36, reductionDb: 24, attackMs: 10, releaseMs: 150 },
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
    });
  };

  // Draw Frequency Response Curve on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Grid coordinates
    const minFreq = 20;
    const maxFreq = 20000;
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);

    const minDb = -36;
    const maxDb = 12;

    const freqToX = (freq: number) => {
      const logF = Math.log10(Math.max(minFreq, Math.min(maxFreq, freq)));
      return ((logF - logMin) / (logMax - logMin)) * width;
    };

    const dbToY = (db: number) => {
      const clamped = Math.max(minDb, Math.min(maxDb, db));
      return height - ((clamped - minDb) / (maxDb - minDb)) * height;
    };

    // Draw grid horizontal dB lines
    const gridDbs = [12, 6, 0, -6, -12, -24, -36];
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';

    for (const db of gridDbs) {
      const y = dbToY(db);
      ctx.strokeStyle = db === 0 ? '#334155' : '#1e293b';
      ctx.lineWidth = db === 0 ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      ctx.fillStyle = db === 0 ? '#94a3b8' : '#475569';
      ctx.fillText(`${db > 0 ? `+${db}` : db}dB`, 30, y + 3);
    }

    // Vertical frequency grid lines
    const gridFreqs = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    ctx.textAlign = 'center';
    for (const freq of gridFreqs) {
      const x = freqToX(freq);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 16);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
      ctx.fillText(label, x, height - 5);
    }

    // Compute frequency response curve
    const steps = 180;
    const testFreqs = new Float32Array(steps);
    for (let i = 0; i < steps; i++) {
      const logF = logMin + (i / (steps - 1)) * (logMax - logMin);
      testFreqs[i] = Math.pow(10, logF);
    }

    const { combinedDb, hpDb, lpDb } = computeFrequencyResponse(testFreqs, settings);

    // Draw High-Pass Curve (Amber)
    if (settings.highPass.enabled && !settings.bypassAll) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < steps; i++) {
        const x = freqToX(testFreqs[i]);
        const y = dbToY(hpDb[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw Low-Pass Curve (Sky)
    if (settings.lowPass.enabled && !settings.bypassAll) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < steps; i++) {
        const x = freqToX(testFreqs[i]);
        const y = dbToY(lpDb[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw Composite Frequency Response (Emerald line with gradient fill)
    ctx.strokeStyle = settings.bypassAll ? '#64748b' : '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < steps; i++) {
      const x = freqToX(testFreqs[i]);
      const y = dbToY(combinedDb[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Area fill under composite
    ctx.lineTo(width, height - 16);
    ctx.lineTo(freqToX(testFreqs[0]), height - 16);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    if (settings.bypassAll) {
      grad.addColorStop(0, 'rgba(100, 116, 139, 0.15)');
      grad.addColorStop(1, 'rgba(100, 116, 139, 0)');
    } else {
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    // Cutoff markers
    if (settings.highPass.enabled && !settings.bypassAll) {
      const hpX = freqToX(settings.highPass.frequency);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(hpX, dbToY(-3), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (settings.lowPass.enabled && !settings.bypassAll) {
      const lpX = freqToX(settings.lowPass.frequency);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(lpX, dbToY(-3), 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [settings]);

  // Draw Noise Profile Spectrum Canvas
  useEffect(() => {
    const canvas = profileCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

    const profile = spectralSettings.capturedProfile;
    if (!profile || profile.length === 0) {
      // Draw simulated adaptive noise floor placeholder
      ctx.fillStyle = '#334155';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Dynamic Auto-Adaptive Noise Profile Active', width / 2, height / 2 - 4);
      ctx.fillStyle = '#475569';
      ctx.font = '9px monospace';
      ctx.fillText('(Click "Auto-Detect Silence Profile" or "Sample Selection" to lock noise profile)', width / 2, height / 2 + 10);
      return;
    }

    const bins = profile.length;
    let maxMag = 1e-4;
    for (let i = 0; i < bins; i++) {
      if (profile[i] > maxMag) maxMag = profile[i];
    }

    // Draw spectrum bars
    const barWidth = Math.max(1, width / bins);
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#a855f7');
    grad.addColorStop(1, '#6366f1');

    ctx.fillStyle = grad;
    for (let i = 0; i < bins; i++) {
      const normalized = Math.min(1, Math.pow(profile[i] / maxMag, 0.6));
      const barHeight = normalized * (height - 12);
      const x = i * barWidth;
      const y = height - barHeight;
      ctx.fillRect(x, y, barWidth - 0.5, barHeight);
    }

    // Top frequency annotations
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('0 Hz', 4, 10);
    ctx.textAlign = 'center';
    ctx.fillText('5 kHz', width / 2, 10);
    ctx.textAlign = 'right';
    ctx.fillText('20 kHz', width - 4, 10);
  }, [spectralSettings.capturedProfile]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Acoustic DSP Studio & Spectral Clean
            </h3>
            <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800/60 px-2 py-0.5 rounded-full font-mono">
              Web Audio & FFT Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time biquad filtering, spectral subtraction background noise removal, and dynamic envelope gating.
          </p>
        </div>

        {/* Master Bypass & Reset Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => updateSetting('bypassAll', !settings.bypassAll)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              settings.bypassAll
                ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Bypass all DSP filters to compare clean unprocessed audio"
          >
            {settings.bypassAll ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{settings.bypassAll ? 'DSP Bypassed' : 'Bypass All'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
            title="Reset all filters to flat default settings"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Quick Presets Strip */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-1">
          Acoustic & Noise Removal Presets:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {DSP_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="shrink-0 px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={p.description}
            >
              <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Visual Frequency Response Spectrum Curve */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">Frequency Response Curve (20 Hz – 20 kHz)</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> High-Pass (Low-Cut)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-sky-400 inline-block" /> Low-Pass (High-Cut)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Composite
            </span>
          </div>
        </div>

        <div className="relative w-full h-36 bg-[#090d16] rounded-lg overflow-hidden border border-slate-800/90 shadow-inner">
          <canvas
            ref={canvasRef}
            width={720}
            height={144}
            className="w-full h-full block"
          />
        </div>
      </div>

      {/* PREMIER FEATURE: Background Noise Removal (Spectral Subtraction) */}
      <div
        className={`p-4 rounded-xl border transition-all flex flex-col gap-4 ${
          spectralSettings.enabled && !settings.bypassAll
            ? 'bg-slate-900/95 border-purple-500/60 shadow-lg shadow-purple-950/25 ring-1 ring-purple-500/30'
            : 'bg-slate-950/60 border-slate-800 opacity-85'
        }`}
      >
        {/* Module Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                spectralSettings.enabled && !settings.bypassAll
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              <Wand2 className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white block">Background Noise Removal</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/70 font-mono font-medium">
                  Spectral Subtraction STFT
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Transforms audio into frequency bins and subtracts stationary room air, AC hum, and fan buzz without muffling speech
              </span>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => updateSpectral('enabled', !spectralSettings.enabled)}
            className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center shrink-0 ${
              spectralSettings.enabled ? 'bg-purple-600 justify-end' : 'bg-slate-800 justify-start'
            }`}
            title={spectralSettings.enabled ? 'Disable Spectral Subtraction' : 'Enable Spectral Subtraction'}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        {/* Profiler Feedback Alert */}
        {profilerFeedback && (
          <div className="px-3 py-2 bg-purple-950/60 border border-purple-700/80 rounded-lg text-xs text-purple-200 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{profilerFeedback}</span>
          </div>
        )}

        {/* Noise Profile Profiler Toolbar */}
        <div className="bg-slate-950/90 p-3 rounded-lg border border-slate-800 flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-slate-200">Noise Profile Fingerprint:</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                  spectralSettings.capturedProfile
                    ? 'bg-purple-950 text-purple-300 border border-purple-700'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {spectralSettings.capturedProfile
                  ? `Locked (${spectralSettings.capturedProfile.length} bins, ${spectralSettings.noiseProfileMode})`
                  : 'Auto-Adaptive (Silence Tracking)'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleAutoEstimateProfile}
                disabled={!audioBuffer}
                className="px-2.5 py-1 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/70 text-purple-200 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
                title="Automatically detect noise from quiet pauses across the recording"
              >
                <RefreshCw className="w-3 h-3 text-purple-300" />
                <span>Auto-Detect Silence Profile</span>
              </button>

              <button
                type="button"
                onClick={handleCaptureSelectionProfile}
                disabled={!audioBuffer}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
                title="Capture noise footprint specifically from the selected range in timeline"
              >
                <Scissors className="w-3 h-3 text-slate-300" />
                <span>Sample Selection [A..B]</span>
              </button>

              {spectralSettings.capturedProfile && (
                <button
                  type="button"
                  onClick={handleClearProfile}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-md text-[11px] transition-colors cursor-pointer"
                  title="Clear captured profile and return to adaptive silence estimation"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Mini Noise Spectrum Preview Canvas */}
          <div className="relative w-full h-12 bg-[#0a0f1d] rounded border border-slate-800/80 overflow-hidden">
            <canvas
              ref={profileCanvasRef}
              width={540}
              height={48}
              className="w-full h-full block"
            />
          </div>
        </div>

        {/* Algorithm Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Slider 1: Subtraction Strength (Alpha) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300 font-semibold">Subtraction Factor (α):</span>
                <span className="text-[10px] text-slate-400 font-mono">(Noise Attenuation)</span>
              </div>
              <span className="font-mono text-purple-400 font-bold">
                {spectralSettings.strengthAlpha.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.1"
              value={spectralSettings.strengthAlpha}
              disabled={!spectralSettings.enabled}
              onChange={(e) => updateSpectral('strengthAlpha', Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer disabled:opacity-40"
            />
            {/* Quick buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {[
                { val: 1.0, label: '1.0x (Gentle)' },
                { val: 1.8, label: '1.8x (Balanced)' },
                { val: 2.6, label: '2.6x (Heavy Air)' },
                { val: 3.5, label: '3.5x (Max Cut)' }
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  disabled={!spectralSettings.enabled}
                  onClick={() => updateSpectral('strengthAlpha', opt.val)}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors cursor-pointer border ${
                    Math.abs(spectralSettings.strengthAlpha - opt.val) < 0.05
                      ? 'bg-purple-950 text-purple-300 border-purple-600 font-bold'
                      : 'bg-slate-850 text-slate-400 hover:text-slate-200 border-slate-700/80 disabled:opacity-40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slider 2: Spectral Floor (Beta) to prevent musical noise */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300 font-semibold">Spectral Floor (β):</span>
                <span className="text-[10px] text-slate-400 font-mono">(Anti-Musical Chirp)</span>
              </div>
              <span className="font-mono text-purple-400 font-bold">
                {(spectralSettings.noiseFloorBeta * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0.005"
              max="0.12"
              step="0.005"
              value={spectralSettings.noiseFloorBeta}
              disabled={!spectralSettings.enabled}
              onChange={(e) => updateSpectral('noiseFloorBeta', Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer disabled:opacity-40"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.5% (Deep Cut)</span>
              <span className="text-purple-400/80">2.0% (Natural Floor)</span>
              <span>12% (Zero Artifacts)</span>
            </div>
          </div>
        </div>

        {/* Secondary parameters: Smoothing & FFT Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60 text-xs">
          {/* Temporal Frame Smoothing */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Inter-Frame Temporal Smoothing:</span>
              <span className="font-mono text-slate-300 font-bold">
                {Math.round(spectralSettings.spectralSmoothing * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.8"
              step="0.05"
              value={spectralSettings.spectralSmoothing}
              disabled={!spectralSettings.enabled}
              onChange={(e) => updateSpectral('spectralSmoothing', Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer disabled:opacity-40"
            />
            <span className="text-[10px] text-slate-500">
              Smooths spectral changes across consecutive frames to prevent isolated watery artifacts.
            </span>
          </div>

          {/* FFT Window Resolution */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">FFT Window Size:</span>
              <span className="font-mono text-slate-300 font-bold">
                {spectralSettings.fftSize || 1024} bins
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { size: 512, label: '512 (11.6ms)' },
                { size: 1024, label: '1024 (23.2ms)' },
                { size: 2048, label: '2048 (46.4ms)' }
              ].map((opt) => (
                <button
                  key={opt.size}
                  type="button"
                  disabled={!spectralSettings.enabled}
                  onClick={() => updateSpectral('fftSize', opt.size)}
                  className={`py-1 rounded-md text-[11px] font-mono transition-colors border cursor-pointer ${
                    (spectralSettings.fftSize || 1024) === opt.size
                      ? 'bg-purple-950 text-purple-300 border-purple-600 font-bold'
                      : 'bg-slate-850 text-slate-400 hover:text-slate-200 border-slate-750 disabled:opacity-40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500">
              1024 is optimal for human voice. 2048 gives sharper frequency resolution for low AC hums.
            </span>
          </div>
        </div>

        {/* Audition & Clean Action Bar */}
        {(onPreviewToggle || onApplyCleanToEditor) && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 bg-purple-950/20 p-2.5 rounded-lg border border-purple-900/30">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="text-[11px] text-purple-200">
                Audition or apply spectral subtraction directly to clean background noise in the editor
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onPreviewToggle && (
                <button
                  type="button"
                  onClick={onPreviewToggle}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    isPreviewPlaying
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                      : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-sm'
                  }`}
                >
                  {isPreviewPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPreviewPlaying ? 'Stop Preview' : 'Audition Clean Audio'}</span>
                </button>
              )}

              {onApplyCleanToEditor && (
                <button
                  type="button"
                  onClick={onApplyCleanToEditor}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  title="Applies spectral subtraction directly into active timeline audio buffer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Apply Clean to Audio</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Module 1: High-Pass Filter (Low Cut) */}
        <div
          className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
            settings.highPass.enabled && !settings.bypassAll
              ? 'bg-slate-900/90 border-amber-500/50 shadow-md shadow-amber-950/20'
              : 'bg-slate-950/60 border-slate-800 opacity-80'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                  settings.highPass.enabled && !settings.bypassAll
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                HP
              </div>
              <div>
                <span className="text-xs font-bold text-white block">High-Pass (Low-Cut) Filter</span>
                <span className="text-[11px] text-slate-400">Cuts handling thumps, mic wind, and AC sub-bass</span>
              </div>
            </div>

            {/* Enable switch */}
            <button
              type="button"
              onClick={() => updateHighPass('enabled', !settings.highPass.enabled)}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
                settings.highPass.enabled ? 'bg-amber-600 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {/* Cutoff frequency slider */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Cutoff Frequency:</span>
              <span className="font-mono text-amber-400 font-bold">{settings.highPass.frequency} Hz</span>
            </div>
            <input
              type="range"
              min="20"
              max="1500"
              step="10"
              value={settings.highPass.frequency}
              disabled={!settings.highPass.enabled}
              onChange={(e) => updateHighPass('frequency', Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {[40, 80, 120, 160, 240].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  disabled={!settings.highPass.enabled}
                  onClick={() => updateHighPass('frequency', freq)}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors cursor-pointer border ${
                    settings.highPass.frequency === freq
                      ? 'bg-amber-950 text-amber-300 border-amber-600 font-bold'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700 disabled:opacity-40'
                  }`}
                >
                  {freq}Hz
                </button>
              ))}
            </div>
          </div>

          {/* Q / Resonance slider */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Resonance (Q):</span>
              <span className="font-mono text-slate-300">{settings.highPass.q.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.05"
              value={settings.highPass.q}
              disabled={!settings.highPass.enabled}
              onChange={(e) => updateHighPass('q', Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>

        {/* Module 2: Low-Pass Filter (High Cut) */}
        <div
          className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
            settings.lowPass.enabled && !settings.bypassAll
              ? 'bg-slate-900/90 border-sky-500/50 shadow-md shadow-sky-950/20'
              : 'bg-slate-950/60 border-slate-800 opacity-80'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                  settings.lowPass.enabled && !settings.bypassAll
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                LP
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Low-Pass (High-Cut) Filter</span>
                <span className="text-[11px] text-slate-400">Cuts high hiss, electronics hum & sibilance</span>
              </div>
            </div>

            {/* Enable switch */}
            <button
              type="button"
              onClick={() => updateLowPass('enabled', !settings.lowPass.enabled)}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
                settings.lowPass.enabled ? 'bg-sky-600 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {/* Cutoff frequency slider */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Cutoff Frequency:</span>
              <span className="font-mono text-sky-400 font-bold">
                {settings.lowPass.frequency >= 1000
                  ? `${(settings.lowPass.frequency / 1000).toFixed(1)} kHz`
                  : `${settings.lowPass.frequency} Hz`}
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="20000"
              step="100"
              value={settings.lowPass.frequency}
              disabled={!settings.lowPass.enabled}
              onChange={(e) => updateLowPass('frequency', Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer disabled:opacity-40"
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {[1500, 3400, 5000, 7000, 12000].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  disabled={!settings.lowPass.enabled}
                  onClick={() => updateLowPass('frequency', freq)}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors cursor-pointer border ${
                    settings.lowPass.frequency === freq
                      ? 'bg-sky-950 text-sky-300 border-sky-600 font-bold'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700 disabled:opacity-40'
                  }`}
                >
                  {freq >= 1000 ? `${freq / 1000}k` : `${freq}Hz`}
                </button>
              ))}
            </div>
          </div>

          {/* Q / Resonance slider */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Resonance (Q):</span>
              <span className="font-mono text-slate-300">{settings.lowPass.q.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.05"
              value={settings.lowPass.q}
              disabled={!settings.lowPass.enabled}
              onChange={(e) => updateLowPass('q', Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>
      </div>

      {/* Module 3: Precision Noise Gate & Floor Threshold */}
      <div
        className={`p-4 rounded-xl border transition-all flex flex-col gap-4 ${
          gateSettings.enabled && !settings.bypassAll
            ? 'bg-slate-900/90 border-teal-500/50 shadow-md shadow-teal-950/20'
            : 'bg-slate-950/60 border-slate-800 opacity-80'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                gateSettings.enabled && !settings.bypassAll
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {gateSettings.enabled && !settings.bypassAll ? (
                <DoorOpen className="w-4 h-4 text-teal-400" />
              ) : (
                <DoorClosed className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white block">Noise Gate (Floor Threshold)</span>
                {gateSettings.enabled && !settings.bypassAll && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700/60 font-mono font-medium">
                    FLOOR ACTIVE
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">
                Eliminates low-level background noise, room hum, hiss & breath below a configured floor threshold
              </span>
            </div>
          </div>

          {/* Enable switch */}
          <button
            type="button"
            onClick={() => updateNoiseGate('enabled', !gateSettings.enabled)}
            className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
              gateSettings.enabled ? 'bg-teal-600 justify-end' : 'bg-slate-800 justify-start'
            }`}
            title={gateSettings.enabled ? 'Disable Noise Gate' : 'Enable Noise Gate'}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        {gateFeedback && (
          <div className="bg-teal-950/60 border border-teal-800/80 p-2.5 rounded-lg text-xs text-teal-300 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{gateFeedback}</span>
          </div>
        )}

        {/* Visual Noise Floor & Dynamic Gate Level Meter */}
        <div className="bg-slate-950/90 rounded-lg p-3 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-semibold text-slate-300">Floor Threshold Dynamic Range:</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              {measuredNoiseFloorDb && (
                <span className="text-slate-400">
                  Room Floor: <span className="text-amber-400 font-bold">{measuredNoiseFloorDb.floorDb} dB</span>
                </span>
              )}
              <span className="text-teal-400 font-bold">
                Floor Cutoff: {gateSettings.floorThresholdDb} dB
              </span>
            </div>
          </div>

          {/* Stylized Visual Bar with Threshold Pointer */}
          <div className="relative w-full h-7 bg-slate-900 rounded-md border border-slate-750 overflow-hidden flex items-center">
            {/* Visual zones */}
            {(() => {
              // Convert dB [-80 .. 0] to percentage [0 .. 100%]
              const threshPct = Math.max(0, Math.min(100, ((gateSettings.floorThresholdDb - (-80)) / 80) * 100));
              const floorPct = measuredNoiseFloorDb
                ? Math.max(0, Math.min(100, ((measuredNoiseFloorDb.floorDb - (-80)) / 80) * 100))
                : 25;

              return (
                <>
                  {/* Gated Zone */}
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-red-950/35 border-r-2 border-teal-400 flex items-center justify-start pl-2 transition-all duration-150"
                    style={{ width: `${threshPct}%` }}
                  >
                    <span className="text-[10px] font-mono text-red-300/80 truncate font-semibold">
                      GATED OUT (MUTED FLOOR)
                    </span>
                  </div>

                  {/* Passing Signal Zone */}
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-teal-950/30 flex items-center justify-end pr-2 transition-all duration-150"
                    style={{ left: `${threshPct}%` }}
                  >
                    <span className="text-[10px] font-mono text-teal-300/90 truncate font-semibold">
                      VOICE & SIGNAL (PASSING)
                    </span>
                  </div>

                  {/* Measured Floor Marker */}
                  {measuredNoiseFloorDb && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400/90 shadow-sm z-10"
                      style={{ left: `${floorPct}%` }}
                      title={`Detected Ambient Noise Floor: ${measuredNoiseFloorDb.floorDb} dB`}
                    >
                      <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full" />
                    </div>
                  )}

                  {/* Floor Threshold Cursor */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-teal-400 shadow-md z-20"
                    style={{ left: `calc(${threshPct}% - 2px)` }}
                  >
                    <div className="absolute -bottom-1 -translate-x-1/2 px-1 py-0.2 bg-teal-400 text-slate-950 font-mono text-[9px] font-bold rounded shadow">
                      {gateSettings.floorThresholdDb}dB
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-0.5">
            <span>-80 dB (Deep Silence)</span>
            <span>-60 dB</span>
            <span>-40 dB</span>
            <span>-20 dB</span>
            <span>0 dB (Clipping)</span>
          </div>
        </div>

        {/* Primary Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Floor Threshold Slider */}
          <div className="flex flex-col gap-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-850">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-200">Floor Threshold:</span>
                <span className="text-[11px] text-slate-500">(Eliminate below this)</span>
              </div>
              <span className="font-mono text-teal-400 font-bold text-sm">
                {gateSettings.floorThresholdDb} dB
              </span>
            </div>
            <input
              type="range"
              min="-80"
              max="-12"
              step="1"
              value={gateSettings.floorThresholdDb}
              disabled={!gateSettings.enabled}
              onChange={(e) => updateNoiseGate('floorThresholdDb', Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer disabled:opacity-40"
            />

            {/* Quick Threshold Presets */}
            <div className="flex items-center justify-between gap-1 flex-wrap pt-1">
              {[
                { db: -60, label: '-60dB (Quiet)' },
                { db: -48, label: '-48dB (Clean)' },
                { db: -42, label: '-42dB (Default)' },
                { db: -36, label: '-36dB (Fan/AC)' },
                { db: -28, label: '-28dB (Loud)' }
              ].map((p) => (
                <button
                  key={p.db}
                  type="button"
                  disabled={!gateSettings.enabled}
                  onClick={() => updateNoiseGate('floorThresholdDb', p.db)}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors cursor-pointer border ${
                    gateSettings.floorThresholdDb === p.db
                      ? 'bg-teal-950 text-teal-300 border-teal-600 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-755 disabled:opacity-40'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* One-Click Auto Detect Floor */}
            {audioBuffer && (
              <button
                type="button"
                disabled={!gateSettings.enabled}
                onClick={handleAutoDetectFloorThreshold}
                className="mt-1.5 w-full py-1.5 px-2.5 bg-teal-950/60 hover:bg-teal-900/80 text-teal-300 border border-teal-800/80 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-Detect Room Noise Floor</span>
                {measuredNoiseFloorDb && (
                  <span className="font-mono text-amber-400 font-bold">
                    ({measuredNoiseFloorDb.floorDb}dB)
                  </span>
                )}
              </button>
            )}
          </div>

          {/* 2. Floor Reduction / Attenuation Depth */}
          <div className="flex flex-col gap-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-850">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-200">Floor Reduction Depth:</span>
                <span className="text-[11px] text-slate-500">(Attenuation)</span>
              </div>
              <span className="font-mono text-teal-400 font-bold text-sm">
                -{gateSettings.reductionDb} dB
              </span>
            </div>
            <input
              type="range"
              min="6"
              max="80"
              step="2"
              value={gateSettings.reductionDb}
              disabled={!gateSettings.enabled}
              onChange={(e) => updateNoiseGate('reductionDb', Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer disabled:opacity-40"
            />

            {/* Quick Reduction Presets */}
            <div className="flex items-center justify-between gap-1 flex-wrap pt-1">
              {[
                { db: 18, label: '18dB (Natural)' },
                { db: 36, label: '36dB (Standard)' },
                { db: 54, label: '54dB (Heavy)' },
                { db: 80, label: '80dB (Total Mute)' }
              ].map((p) => (
                <button
                  key={p.db}
                  type="button"
                  disabled={!gateSettings.enabled}
                  onClick={() => updateNoiseGate('reductionDb', p.db)}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors cursor-pointer border ${
                    gateSettings.reductionDb === p.db
                      ? 'bg-teal-950 text-teal-300 border-teal-600 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-755 disabled:opacity-40'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <span className="text-[10px] text-slate-500 pt-1">
              {gateSettings.reductionDb >= 75
                ? 'Dead silence floor: drops all background noise to zero during pauses.'
                : 'Smooth floor attenuation: keeps natural room ambience while suppressing loud noise.'}
            </span>
          </div>
        </div>

        {/* Envelope Attack, Hold, Release & Anti-Chatter Hysteresis */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60 bg-slate-950/40 p-3 rounded-lg border border-slate-850/80">
          {/* Attack Time */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Attack:</span>
              <span className="font-mono text-slate-200 font-semibold">{gateSettings.attackMs} ms</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="40"
              step="0.5"
              value={gateSettings.attackMs}
              disabled={!gateSettings.enabled}
              onChange={(e) => updateNoiseGate('attackMs', Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer disabled:opacity-40"
            />
            <span className="text-[9px] text-slate-500">Fast gate open</span>
          </div>

          {/* Hold Time */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Hold:</span>
              <span className="font-mono text-teal-400 font-semibold">{gateSettings.holdMs} ms</span>
            </div>
            <input
              type="range"
              min="0"
              max="250"
              step="5"
              value={gateSettings.holdMs}
              disabled={!gateSettings.enabled}
              onChange={(e) => updateNoiseGate('holdMs', Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer disabled:opacity-40"
            />
            <span className="text-[9px] text-slate-500">Preserves word tails</span>
          </div>

          {/* Release Time */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Release:</span>
              <span className="font-mono text-slate-200 font-semibold">{gateSettings.releaseMs} ms</span>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              step="10"
              value={gateSettings.releaseMs}
              disabled={!gateSettings.enabled}
              onChange={(e) => updateNoiseGate('releaseMs', Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer disabled:opacity-40"
            />
            <span className="text-[9px] text-slate-500">Smooth decay fade</span>
          </div>

          {/* Hysteresis */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Hysteresis:</span>
              <span className="font-mono text-slate-200 font-semibold">{gateSettings.hysteresisDb} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={gateSettings.hysteresisDb}
              disabled={!gateSettings.enabled}
              onChange={(e) => updateNoiseGate('hysteresisDb', Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer disabled:opacity-40"
            />
            <span className="text-[9px] text-slate-500">Anti-chatter offset</span>
          </div>
        </div>

        {/* Audition & Apply Action Bar for Noise Gate */}
        {(onPreviewNoiseGateToggle || onApplyNoiseGateToEditor) && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 bg-teal-950/20 p-2.5 rounded-lg border border-teal-900/30">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="text-[11px] text-teal-200">
                Audition the noise gate or bake it directly into the active recording waveform
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onPreviewNoiseGateToggle && (
                <button
                  type="button"
                  onClick={onPreviewNoiseGateToggle}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    isNoiseGatePreviewPlaying
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                      : 'bg-teal-600 hover:bg-teal-500 text-white border-teal-500 shadow-sm'
                  }`}
                >
                  {isNoiseGatePreviewPlaying ? (
                    <Square className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>{isNoiseGatePreviewPlaying ? 'Stop Audition' : 'Audition Noise Gate'}</span>
                </button>
              )}

              {onApplyNoiseGateToEditor && (
                <button
                  type="button"
                  onClick={onApplyNoiseGateToEditor}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  title="Permanently applies noise gate floor to active timeline audio buffer"
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>Apply Gate to Audio</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Module 4: Master Output Make-Up Gain */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-200">Master Output Make-Up Gain:</span>
          </div>
          <span className="font-mono text-sky-400 font-bold">
            {settings.outputGainDb > 0 ? `+${settings.outputGainDb}` : settings.outputGainDb} dB
          </span>
        </div>
        <input
          type="range"
          min="-12"
          max="12"
          step="0.5"
          value={settings.outputGainDb}
          onChange={(e) => updateSetting('outputGainDb', Number(e.target.value))}
          className="w-full accent-sky-500 cursor-pointer"
        />
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>-12 dB</span>
          <button
            type="button"
            onClick={() => updateSetting('outputGainDb', 0)}
            className="text-slate-400 hover:text-white underline cursor-pointer"
          >
            0 dB (Unity)
          </button>
          <span>+12 dB</span>
        </div>
      </div>

      {/* Direct Apply & Export Action Card in DSP tab */}
      {onApplyAndExport && (
        <div className="bg-emerald-950/40 border border-emerald-800/80 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-white block">Render & Export DSP Processed Audio</span>
            <span className="text-slate-400">
              Applies spectral subtraction noise removal, low-pass, and high-pass filters directly into high-fidelity uncompressed WAV.
            </span>
          </div>
          <button
            type="button"
            onClick={onApplyAndExport}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 shrink-0"
          >
            <Disc className="w-4 h-4" />
            <span>{isProcessing ? 'Rendering Audio...' : 'Save DSP Filtered Copy'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
