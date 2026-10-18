import React, { useEffect, useState } from 'react';
import { AudioConfig, AudioFormat, BitDepth, RecordingPreset } from '../types/recorder';
import { Sliders, Mic, ShieldAlert, Cpu, Radio, Gauge } from 'lucide-react';
import { RecordingPresetsBar } from './RecordingPresetsBar';

interface AudioSettingsPanelProps {
  config: AudioConfig;
  onChangeConfig: (newConfig: Partial<AudioConfig>) => void;
  disabled: boolean;
}

export const AudioSettingsPanel: React.FC<AudioSettingsPanelProps> = ({
  config,
  onChangeConfig,
  disabled
}) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    async function loadDevices() {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devs.filter((d) => d.kind === 'audioinput');
        setDevices(audioInputs);
      } catch (err) {
        console.warn('Failed to enumerate audio devices:', err);
      }
    }
    loadDevices();
  }, []);

  const gainDb = config.gain > 0 ? (20 * Math.log10(config.gain)).toFixed(1) : '-inf';

  const handleApplyPreset = (preset: RecordingPreset) => {
    onChangeConfig({
      sampleRate: preset.sampleRate,
      bitDepth: preset.bitDepth,
      vadEnabled: preset.vadEnabled,
      vadThreshold: preset.vadThreshold,
      vadDuration: preset.vadDuration,
      format: preset.format,
      channels: preset.channels,
      gain: preset.gain,
      agc: preset.agc,
      gpsTaggingEnabled: preset.gpsTaggingEnabled !== undefined ? preset.gpsTaggingEnabled : config.gpsTaggingEnabled
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Recording Presets Environment Selector */}
      <RecordingPresetsBar
        config={config}
        onApplyPreset={handleApplyPreset}
        disabled={disabled}
      />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col gap-4 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-semibold text-slate-100">Pro Audio Hardware & DSP Calibration</h2>
          </div>
          <span className="text-xs text-slate-400">RecForge II / Broadcast Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Hardware Input Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-slate-400" />
            <span>Audio Input Device</span>
          </label>
          <select
            value={config.inputDeviceId}
            disabled={disabled}
            onChange={(e) => onChangeConfig({ inputDeviceId: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500 disabled:opacity-50"
          >
            <option value="">Default Audio Source (Built-in / USB)</option>
            {devices.map((d, idx) => (
              <option key={d.deviceId || idx} value={d.deviceId}>
                {d.label || `Microphone ${idx + 1}`}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-500">Supports external USB interfaces & studio loopback</span>
        </div>

        {/* 2. Manual Preamp Gain Control */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              <span>Manual Preamp Gain</span>
            </label>
            <span className="text-xs font-mono tabular-nums text-slate-300">
              {config.gain.toFixed(2)}x ({gainDb} dB)
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="4.0"
            step="0.05"
            value={config.gain}
            onChange={(e) => onChangeConfig({ gain: parseFloat(e.target.value) })}
            className="w-full accent-red-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.1x (Attenuate)</span>
            <span>1.0x (Unity 0dB)</span>
            <span>4.0x (+12dB Boost)</span>
          </div>
        </div>

        {/* 3. Automatic Gain Control (AGC) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>Automatic Gain Control (AGC)</span>
          </label>
          <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="flex flex-col">
              <span className="text-xs text-slate-200">Dynamic Compressor & Limiter</span>
              <span className="text-[11px] text-slate-500">Normalizes soft voices & prevents clipping</span>
            </div>
            <button
              onClick={() => onChangeConfig({ agc: !config.agc })}
              disabled={disabled}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                config.agc ? 'bg-red-600 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>
        </div>

        {/* 4. Silence Skipping & Voice Activity Detection (VAD) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              <span>Silence Skipping (VAD)</span>
            </label>
            <button
              onClick={() => onChangeConfig({ vadEnabled: !config.vadEnabled })}
              disabled={disabled}
              className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
                config.vadEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {config.vadEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="-60"
              max="-20"
              step="1"
              value={config.vadThreshold}
              disabled={!config.vadEnabled || disabled}
              onChange={(e) => onChangeConfig({ vadThreshold: parseInt(e.target.value) })}
              className="flex-1 accent-emerald-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg disabled:opacity-40"
            />
            <span className="text-xs font-mono tabular-nums text-slate-300 w-14 text-right">
              {config.vadThreshold} dB
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Skips buffer accumulation when below threshold</span>
        </div>

        {/* 5. Sample Rate Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300">Sample Rate & Fidelity</label>
          <select
            value={config.sampleRate}
            disabled={disabled}
            onChange={(e) => onChangeConfig({ sampleRate: parseInt(e.target.value) })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500 disabled:opacity-50"
          >
            <option value="8000">8,000 Hz (Telephony Narrowband)</option>
            <option value="16000">16,000 Hz (Whisper AI Standard)</option>
            <option value="22050">22,050 Hz (Broadcast Voice)</option>
            <option value="44100">44,100 Hz (CD Audio Quality)</option>
            <option value="48000">48,000 Hz (Studio Master - Recommended)</option>
            <option value="96000">96,000 Hz (Audiophile 96k Master)</option>
          </select>
          <span className="text-[11px] text-slate-500">48kHz matches professional broadcast standards</span>
        </div>

        {/* 6. Codec Format & Bit Depth */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300">Codec & Channel Format</label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={config.format}
              disabled={disabled}
              onChange={(e) => onChangeConfig({ format: e.target.value as AudioFormat })}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500 disabled:opacity-50"
            >
              <option value="wav">WAV (PCM)</option>
              <option value="mp3">MP3 (MPEG)</option>
              <option value="flac">FLAC (Lossless)</option>
              <option value="m4a">M4A (AAC)</option>
              <option value="amr">AMR (Voice)</option>
            </select>

            <select
              value={config.channels}
              disabled={disabled}
              onChange={(e) => onChangeConfig({ channels: parseInt(e.target.value) as 1 | 2 })}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500 disabled:opacity-50"
            >
              <option value="1">Mono (1 Ch)</option>
              <option value="2">Stereo (2 Ch)</option>
            </select>
          </div>

          {config.format === 'wav' && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">PCM Quantization:</span>
              <div className="flex items-center gap-1">
                {([16, 24, 32] as BitDepth[]).map((bits) => (
                  <button
                    key={bits}
                    onClick={() => onChangeConfig({ bitDepth: bits })}
                    disabled={disabled}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                      config.bitDepth === bits
                        ? 'bg-red-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {bits}-bit
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 7. GPS Geolocation Tagging */}
        <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg border ${config.gpsTaggingEnabled ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200">
                  Field Geolocation Tagging (GPS Coordinates)
                </span>
                <span className="text-[11px] text-slate-500">
                  Attaches precision WGS-84 Latitude, Longitude, Altitude & Locality to recordings for field research & journalism
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">
                {config.gpsTaggingEnabled ? 'GPS AUTO-TAG ACTIVE' : 'TAGGING OFF'}
              </span>
              <button
                onClick={() => onChangeConfig({ gpsTaggingEnabled: !config.gpsTaggingEnabled })}
                disabled={disabled}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  config.gpsTaggingEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
