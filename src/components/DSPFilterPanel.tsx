import React, { useEffect, useRef } from 'react';
import { DSPSettings } from '../types/recorder';
import { DSP_PRESETS, DSPPreset, computeFrequencyResponse } from '../utils/dspEngine';
import {
  Sliders,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Activity,
  Layers,
  Info,
  Check,
  Disc,
  Filter
} from 'lucide-react';

interface DSPFilterPanelProps {
  settings: DSPSettings;
  onChange: (newSettings: DSPSettings) => void;
  onApplyAndExport?: () => void;
  isProcessing?: boolean;
}

export const DSPFilterPanel: React.FC<DSPFilterPanelProps> = ({
  settings,
  onChange,
  onApplyAndExport,
  isProcessing = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Update helper
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
        : settings.noiseReduction
    });
  };

  // Reset to default
  const handleReset = () => {
    onChange({
      bypassAll: false,
      highPass: { enabled: false, frequency: 80, q: 0.707 },
      lowPass: { enabled: false, frequency: 6000, q: 0.707 },
      noiseReduction: { enabled: false, thresholdDb: -36, reductionDb: 24, attackMs: 10, releaseMs: 150 },
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
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      ctx.fillStyle = db === 0 ? '#94a3b8' : '#475569';
      ctx.fillText(`${db > 0 ? '+' : ''}${db}dB`, width - 6, y - 3);
    }

    // Draw vertical frequency grid lines
    const gridFreqs = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    ctx.textAlign = 'center';
    for (const freq of gridFreqs) {
      const x = freqToX(freq);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
      ctx.fillStyle = '#64748b';
      ctx.fillText(label, x, height - 6);
    }

    // Generate frequency sample points across width
    const sampleCount = Math.floor(width / 2);
    const freqs = new Float32Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      const ratio = i / (sampleCount - 1);
      const logF = logMin + ratio * (logMax - logMin);
      freqs[i] = Math.pow(10, logF);
    }

    const { combinedDb, hpDb, lpDb } = computeFrequencyResponse(freqs, settings);

    // 1. Draw High-Pass individual curve if active
    if (settings.highPass.enabled && !settings.bypassAll) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)'; // Amber
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < sampleCount; i++) {
        const x = freqToX(freqs[i]);
        const y = dbToY(hpDb[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Cutoff marker
      const hpX = freqToX(settings.highPass.frequency);
      ctx.strokeStyle = '#f59e0b';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hpX, 0);
      ctx.lineTo(hpX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Draw Low-Pass individual curve if active
    if (settings.lowPass.enabled && !settings.bypassAll) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'; // Sky
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < sampleCount; i++) {
        const x = freqToX(freqs[i]);
        const y = dbToY(lpDb[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Cutoff marker
      const lpX = freqToX(settings.lowPass.frequency);
      ctx.strokeStyle = '#38bdf8';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(lpX, 0);
      ctx.lineTo(lpX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Draw Combined Composite Response Curve with Gradient Fill
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = settings.bypassAll ? '#64748b' : '#10b981'; // Emerald when active, slate when bypassed

    ctx.beginPath();
    for (let i = 0; i < sampleCount; i++) {
      const x = freqToX(freqs[i]);
      const y = dbToY(combinedDb[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill underneath curve
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, settings.bypassAll ? 'rgba(100, 116, 139, 0.12)' : 'rgba(16, 185, 129, 0.18)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Zero dB reference marker text
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'left';
    ctx.font = '10px monospace font-semibold';
    ctx.fillText(
      settings.bypassAll
        ? 'BYPASS (Flat 0 dB)'
        : `EQ OUT: ${settings.outputGainDb >= 0 ? '+' : ''}${settings.outputGainDb} dB`,
      12,
      18
    );
  }, [settings]);

  const activeFiltersCount =
    (settings.highPass.enabled ? 1 : 0) +
    (settings.lowPass.enabled ? 1 : 0) +
    (settings.noiseReduction.enabled ? 1 : 0);

  return (
    <div className="flex flex-col gap-5 text-slate-200">
      {/* Top DSP Header / Master Status & Presets */}
      <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
              settings.bypassAll
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-emerald-950/80 text-emerald-400 border-emerald-700/80'
            }`}
          >
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">DSP Filter Studio & Noise Reduction</h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold uppercase tracking-wider ${
                  settings.bypassAll
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                }`}
              >
                {settings.bypassAll ? 'Bypassed' : `${activeFiltersCount} Active`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live auditioning and offline PCM filtering with noise suppression, low-cut, and high-cut
            </p>
          </div>
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
          Acoustic Filter Presets:
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
                <span className="text-[11px] text-slate-400">Removes mic wind, desk thumps & low hum</span>
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
              step="5"
              value={settings.highPass.frequency}
              disabled={!settings.highPass.enabled}
              onChange={(e) => updateHighPass('frequency', Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {[60, 80, 120, 180, 320].map((freq) => (
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
              <span className="text-xs font-bold text-white block">Noise Reduction & Dynamic Gate</span>
              <span className="text-[11px] text-slate-400">
                Smoothly suppresses background air, hiss, and AC noise during pauses
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
              Applies noise reduction, low-pass, and high-pass filters directly into high-fidelity uncompressed WAV.
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
