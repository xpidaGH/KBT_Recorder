import React from 'react';
import {
  SilenceDetectorOptions,
  SilenceAnalysisResult,
  SilenceTrimMode
} from '../utils/silenceTrimmer';
import {
  Scissors,
  VolumeX,
  Play,
  Square,
  Wand2,
  Disc,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Check,
  AlertCircle,
  Clock
} from 'lucide-react';

interface SilenceTrimmerPanelProps {
  audioBuffer: AudioBuffer | null;
  options: SilenceDetectorOptions;
  onChangeOptions: (newOptions: SilenceDetectorOptions) => void;
  stats: SilenceAnalysisResult | null;
  isProcessing: boolean;
  isPlayingPreview: boolean;
  onTogglePreview: () => void;
  onApplyToEditor: () => void;
  onExportCopy: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const SilenceTrimmerPanel: React.FC<SilenceTrimmerPanelProps> = ({
  audioBuffer,
  options,
  onChangeOptions,
  stats,
  isProcessing,
  isPlayingPreview,
  onTogglePreview,
  onApplyToEditor,
  onExportCopy,
  isOpen,
  onToggleOpen
}) => {
  const updateOption = <K extends keyof SilenceDetectorOptions>(
    key: K,
    val: SilenceDetectorOptions[K]
  ) => {
    onChangeOptions({
      ...options,
      [key]: val
    });
  };

  const formatSec = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden text-xs transition-all">
      {/* Header Bar */}
      <div
        onClick={onToggleOpen}
        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition-colors select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-xs">Auto Trim Silence</span>
              <span className="text-[10px] bg-red-950 text-red-300 border border-red-800/80 px-2 py-0.5 rounded-full font-mono">
                Web Audio API
              </span>
              {stats && stats.silentIntervals.length > 0 && (
                <span className="text-[10px] text-emerald-400 font-mono">
                  ({stats.silentIntervals.length} pauses · -{stats.percentSaved}%)
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 block">
              Automatically detect and excise silent pauses or edge dead-space below a dB threshold
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Controls Drawer */}
      {isOpen && (
        <div className="p-4 border-t border-slate-800/90 flex flex-col gap-4 bg-slate-900/40">
          {/* Analysis Summary Strip */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">DETECTED PAUSES</span>
                <span className="text-sm font-bold text-white">
                  {stats.silentIntervals.length} {stats.silentIntervals.length === 1 ? 'pause' : 'pauses'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">TOTAL SILENCE</span>
                <span className="text-sm font-bold text-red-400">
                  -{stats.totalSilenceSec.toFixed(2)}s
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">PROJECTED LENGTH</span>
                <span className="text-sm font-bold text-emerald-400">
                  {formatSec(stats.projectedDurationSec)}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">REDUCTION RATIO</span>
                <span className="text-sm font-bold text-sky-400">
                  {stats.percentSaved}% saved
                </span>
              </div>
            </div>
          )}

          {/* Mode Selector Tabs */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 font-semibold flex items-center justify-between">
              <span>Silence Removal Mode:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  id: 'all_pauses' as SilenceTrimMode,
                  label: 'Strip All Pauses',
                  desc: 'Removes all internal & edge silent pauses'
                },
                {
                  id: 'lead_and_trail' as SilenceTrimMode,
                  label: 'Lead & Trail Only',
                  desc: 'Trims dead-space from start and end only'
                },
                {
                  id: 'compress_pauses' as SilenceTrimMode,
                  label: 'Compress Long Pauses',
                  desc: 'Shortens long pauses to 350ms'
                }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => updateOption('mode', m.id)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                    options.mode === m.id
                      ? 'bg-red-950/40 border-red-500/70 text-white shadow-xs'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`font-semibold ${options.mode === m.id ? 'text-red-300' : 'text-slate-300'}`}>
                    {m.label}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            {/* 1. dB Threshold Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Silence dB Threshold:</span>
                <span className="font-mono text-red-400 font-bold">{options.thresholdDb} dB</span>
              </div>
              <input
                type="range"
                min="-60"
                max="-20"
                step="1"
                value={options.thresholdDb}
                onChange={(e) => updateOption('thresholdDb', parseInt(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                {[
                  { db: -50, label: '-50dB Studio' },
                  { db: -40, label: '-40dB Speech' },
                  { db: -32, label: '-32dB Cafe' }
                ].map((preset) => (
                  <button
                    key={preset.db}
                    type="button"
                    onClick={() => updateOption('thresholdDb', preset.db)}
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono transition-colors border cursor-pointer ${
                      options.thresholdDb === preset.db
                        ? 'bg-red-950 text-red-300 border-red-700 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Minimum Silence Length */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Min Silence Length:</span>
                <span className="font-mono text-slate-200 font-bold">{options.minSilenceMs} ms</span>
              </div>
              <input
                type="range"
                min="150"
                max="1500"
                step="50"
                value={options.minSilenceMs}
                onChange={(e) => updateOption('minSilenceMs', parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">
                Pauses shorter than this are preserved as natural speech rhythm.
              </span>
            </div>

            {/* 3. Padding / Cushion around Speech */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Speech Cushion (Padding):</span>
                <span className="font-mono text-slate-200 font-bold">{options.paddingMs} ms</span>
              </div>
              <input
                type="range"
                min="30"
                max="200"
                step="5"
                value={options.paddingMs}
                onChange={(e) => updateOption('paddingMs', parseInt(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">
                Buffers speech boundaries with micro-crossfades to protect consonant attacks.
              </span>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Red shaded zones on the waveform preview where silence will be excised</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Audition Preview */}
              <button
                type="button"
                onClick={onTogglePreview}
                disabled={!audioBuffer || !stats || stats.silentIntervals.length === 0}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isPlayingPreview
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                } disabled:opacity-40`}
                title="Listen to how the audio sounds with silence excised"
              >
                {isPlayingPreview ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlayingPreview ? 'Stop Preview' : 'Audition Trimmed'}</span>
              </button>

              {/* Apply directly to editor */}
              <button
                type="button"
                onClick={onApplyToEditor}
                disabled={isProcessing || !audioBuffer || !stats || stats.silentIntervals.length === 0}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-40"
                title="Trim silence directly inside the active editor waveform"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Apply Trim Silence</span>
              </button>

              {/* Export as new copy */}
              <button
                type="button"
                onClick={onExportCopy}
                disabled={isProcessing || !audioBuffer || !stats || stats.silentIntervals.length === 0}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-40"
                title="Export trimmed audio as a new recording in Vault"
              >
                <Disc className="w-3.5 h-3.5" />
                <span>Save as Trimmed Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
