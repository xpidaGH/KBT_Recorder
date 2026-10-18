import React, { useState, useEffect, useMemo } from 'react';
import { AudioConfig, RecordingPreset } from '../types/recorder';
import {
  BUILT_IN_RECORDING_PRESETS,
  getCustomRecordingPresets,
  saveCustomRecordingPreset,
  deleteCustomRecordingPreset,
  matchActivePreset
} from '../utils/recordingPresets';
import {
  Mic,
  Music,
  FileText,
  Radio,
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  Check,
  X,
  Volume2,
  CheckCircle2,
  Info,
  Compass
} from 'lucide-react';

interface RecordingPresetsBarProps {
  config: AudioConfig;
  onApplyPreset: (preset: RecordingPreset) => void;
  disabled?: boolean;
}

export const RecordingPresetsBar: React.FC<RecordingPresetsBarProps> = ({
  config,
  onApplyPreset,
  disabled = false
}) => {
  const [customPresets, setCustomPresets] = useState<RecordingPreset[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load custom presets on mount
  useEffect(() => {
    setCustomPresets(getCustomRecordingPresets());
  }, []);

  const allPresets = useMemo(() => {
    return [...BUILT_IN_RECORDING_PRESETS, ...customPresets];
  }, [customPresets]);

  // Find active preset matching current configuration
  const activePreset = useMemo(() => {
    return matchActivePreset(config, allPresets);
  }, [config, allPresets]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  const handleSelectPreset = (preset: RecordingPreset) => {
    if (disabled) return;
    onApplyPreset(preset);
    showToast(`Applied preset: ${preset.name} (${preset.sampleRate / 1000}kHz, ${preset.bitDepth}-bit, ${preset.vadEnabled ? 'VAD ON' : 'Continuous'})`);
  };

  const handleOpenSaveModal = () => {
    if (disabled) return;
    // Pre-fill smart default name
    const defaultName = activePreset
      ? `${activePreset.name} (Customized)`
      : `My ${config.format.toUpperCase()} ${config.sampleRate / 1000}k Preset`;
    setNewPresetName(defaultName);
    setNewPresetDesc(`Recorded at ${config.sampleRate}Hz, ${config.bitDepth}-bit, ${config.channels === 1 ? 'Mono' : 'Stereo'}, ${config.vadEnabled ? `VAD ${config.vadThreshold}dB` : 'No VAD'}`);
    setIsSaveModalOpen(true);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const saved = saveCustomRecordingPreset({
      name: newPresetName.trim(),
      description: newPresetDesc.trim() || `Configured ${config.sampleRate}Hz ${config.bitDepth}-bit`,
      category: 'custom',
      sampleRate: config.sampleRate,
      bitDepth: config.bitDepth,
      vadEnabled: config.vadEnabled,
      vadThreshold: config.vadThreshold,
      vadDuration: config.vadDuration,
      format: config.format,
      channels: config.channels,
      gain: config.gain,
      agc: config.agc,
      gpsTaggingEnabled: config.gpsTaggingEnabled
    });

    setCustomPresets(getCustomRecordingPresets());
    setIsSaveModalOpen(false);
    showToast(`Saved new preset: "${saved.name}"!`);
  };

  const handleDeleteCustom = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    deleteCustomRecordingPreset(id);
    setCustomPresets(getCustomRecordingPresets());
    showToast(`Removed preset "${name}"`);
  };

  const getPresetIcon = (preset: RecordingPreset) => {
    switch (preset.category) {
      case 'podcasting':
        return <Mic className="w-3.5 h-3.5 text-purple-400" />;
      case 'voicememo':
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'music':
        return <Music className="w-3.5 h-3.5 text-emerald-400" />;
      case 'field':
        return <Compass className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-pink-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm flex flex-col gap-3">
      {/* Toast notification banner */}
      {toastMessage && (
        <div className="px-3 py-1.5 bg-sky-950/80 border border-sky-800 text-sky-200 text-xs rounded-lg flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header with Active Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Recording Environment Presets</span>
              <span className="text-[10px] text-slate-400 font-normal normal-case">
                (Sample Rate • Bit Depth • VAD)
              </span>
            </h3>
          </div>
        </div>

        {/* Current Active Preset Chip */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-mono">
            <span className="text-slate-400 text-[11px]">ACTIVE:</span>
            <span className="font-semibold text-slate-100 flex items-center gap-1">
              {activePreset ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{activePreset.name}</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-amber-300">Custom Tuning</span>
                </>
              )}
            </span>
            <span className="text-slate-500 text-[10px] pl-1 border-l border-slate-800">
              {config.sampleRate / 1000}kHz/{config.bitDepth}b/{config.vadEnabled ? 'VAD' : 'CONT'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenSaveModal}
            disabled={disabled}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
            title="Save current hardware and DSP settings as a reusable preset"
          >
            <Plus className="w-3.5 h-3.5 text-red-400" />
            <span>Save Preset...</span>
          </button>
        </div>
      </div>

      {/* Preset Buttons Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {allPresets.map((p) => {
          const isActive = activePreset?.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPreset(p)}
              disabled={disabled}
              className={`shrink-0 group px-3 py-2 rounded-xl border text-xs text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                isActive
                  ? 'bg-slate-800/95 border-red-500/70 shadow-md shadow-red-950/20 ring-1 ring-red-500/30'
                  : 'bg-slate-950/70 hover:bg-slate-800/70 border-slate-800 hover:border-slate-700 text-slate-300'
              } disabled:opacity-50`}
              title={p.description}
            >
              <div className="p-1 rounded-md bg-slate-900 border border-slate-800 group-hover:border-slate-700 shrink-0">
                {getPresetIcon(p)}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className={`font-semibold ${isActive ? 'text-white' : 'text-slate-200'}`}>
                    {p.name}
                  </span>
                  {isActive && <Check className="w-3 h-3 text-red-400" />}
                </div>

                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                  <span>{p.sampleRate / 1000}kHz</span>
                  <span>•</span>
                  <span>{p.bitDepth}-bit</span>
                  <span>•</span>
                  <span className={p.vadEnabled ? 'text-emerald-400' : 'text-slate-400'}>
                    {p.vadEnabled ? `VAD ${p.vadThreshold}dB` : 'Continuous'}
                  </span>
                </div>
              </div>

              {!p.isBuiltIn && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteCustom(e, p.id, p.name)}
                  className="ml-1 p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                  title="Delete custom preset"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </button>
          );
        })}
      </div>

      {/* Save Custom Preset Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Save Recording Preset</h4>
                  <span className="text-[11px] text-slate-400">Capture current sample rate, bit depth & VAD configuration</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustom} className="p-4 flex flex-col gap-4 text-xs">
              {/* Snapshot of settings being saved */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/90 flex flex-col gap-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                  Captured Audio Parameters:
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div className="flex justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-slate-400">Sample Rate:</span>
                    <span className="font-mono text-white font-bold">{config.sampleRate} Hz</span>
                  </div>
                  <div className="flex justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-slate-400">Bit Depth:</span>
                    <span className="font-mono text-white font-bold">{config.bitDepth}-bit PCM</span>
                  </div>
                  <div className="flex justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-slate-400">Silence Skip (VAD):</span>
                    <span className="font-mono text-white font-bold">
                      {config.vadEnabled ? `${config.vadThreshold} dB` : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-slate-400">Channels:</span>
                    <span className="font-mono text-white font-bold">
                      {config.channels === 1 ? 'Mono (1 Ch)' : 'Stereo (2 Ch)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preset Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Preset Name *</label>
                <input
                  type="text"
                  required
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g., Acoustic Guitar Master, Lecture Room..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500 font-medium"
                />
              </div>

              {/* Preset Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Description / Usage Notes</label>
                <textarea
                  rows={2}
                  value={newPresetDesc}
                  onChange={(e) => setNewPresetDesc(e.target.value)}
                  placeholder="Brief note describing best environment or microphone..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500 resize-none font-normal"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-md"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
