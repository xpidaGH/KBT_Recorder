import React, { useEffect, useRef, useState, useMemo } from 'react';
import { DSPSettings, SpectralSubtractionSettings } from '../types/recorder';
import {
  DSP_PRESETS,
  DSPPreset,
  computeFrequencyResponse,
  captureNoiseProfile,
  autoEstimateNoiseProfile
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
  Sliders
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
  onApplyCleanToEditor
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const profileCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [profilerFeedback, setProfilerFeedback] = useState<string | null>(null);

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

  const updateNoiseReduction = (field: keyof DSPSettings['noiseReduction'], value: any) => {
    onChange({
      ...settings,
      noiseReduction: {
        ...settings.noiseReduction,
        [field]: value
      }
    });
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
    onChange({
      ...settings,
      ...preset.settings,
      highPass: preset.settings.highPass
        ? { ...settings.highPass, ...preset.settings.highPass }
        : settings.highPass,
      lowPass: preset.settings.lowPass
        ? { ...settings.lowPass, ...preset.settings.lowPass }
        : settings.lowPass,
      noiseReduction: preset.settings.noiseReduction
        ? { ...settings.noiseReduction, ...preset.settings.noiseReduction }
        : settings.noiseReduction,
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

      {/* Module 3: Downward Noise Reduction & Gate */}
      <div
        className={`p-4 rounded-xl border transition-all flex flex-col gap-4 ${
          settings.noiseReduction.enabled && !settings.bypassAll
            ? 'bg-slate-900/90 border-emerald-500/50 shadow-md shadow-emerald-950/20'
            : 'bg-slate-950/60 border-slate-800 opacity-80'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                settings.noiseReduction.enabled && !settings.bypassAll
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              NR
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Noise Gate & Envelope Gating</span>
              <span className="text-[11px] text-slate-400">
                Smoothly silences residual background air and room hum during pauses
              </span>
            </div>
          </div>

          {/* Enable switch */}
          <button
            type="button"
            onClick={() => updateNoiseReduction('enabled', !settings.noiseReduction.enabled)}
            className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
              settings.noiseReduction.enabled ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Threshold Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Noise Threshold:</span>
              <span className="font-mono text-emerald-400 font-bold">{settings.noiseReduction.thresholdDb} dB</span>
            </div>
            <input
              type="range"
              min="-60"
              max="-12"
              step="1"
              value={settings.noiseReduction.thresholdDb}
              disabled={!settings.noiseReduction.enabled}
              onChange={(e) => updateNoiseReduction('thresholdDb', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer disabled:opacity-40"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-60dB (Quiet Room)</span>
              <span>-12dB (Loud Noise)</span>
            </div>
          </div>

          {/* Attenuation / Reduction Depth Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Reduction Depth:</span>
              <span className="font-mono text-emerald-400 font-bold">{settings.noiseReduction.reductionDb} dB</span>
            </div>
            <input
              type="range"
              min="6"
              max="48"
              step="2"
              value={settings.noiseReduction.reductionDb}
              disabled={!settings.noiseReduction.enabled}
              onChange={(e) => updateNoiseReduction('reductionDb', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer disabled:opacity-40"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>6dB (Subtle)</span>
              <span>48dB (Maximum Cut)</span>
            </div>
          </div>
        </div>

        {/* Envelope Attack & Release */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-slate-800/60">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Attack Time:</span>
              <span className="font-mono text-slate-300">{settings.noiseReduction.attackMs} ms</span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="1"
              value={settings.noiseReduction.attackMs}
              disabled={!settings.noiseReduction.enabled}
              onChange={(e) => updateNoiseReduction('attackMs', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer disabled:opacity-40"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Release (Fade) Time:</span>
              <span className="font-mono text-slate-300">{settings.noiseReduction.releaseMs} ms</span>
            </div>
            <input
              type="range"
              min="30"
              max="400"
              step="10"
              value={settings.noiseReduction.releaseMs}
              disabled={!settings.noiseReduction.enabled}
              onChange={(e) => updateNoiseReduction('releaseMs', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>
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
