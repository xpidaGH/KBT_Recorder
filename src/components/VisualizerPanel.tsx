import React, { useEffect, useRef, useState } from 'react';
import { VisualizerMode } from '../types/recorder';
import { Activity, BarChart2, Radio, Volume2 } from 'lucide-react';

interface VisualizerPanelProps {
  isRecording: boolean;
  meterData: {
    leftDb: number;
    rightDb: number;
    rmsDb: number;
    isClipping: boolean;
    isSpeaking: boolean;
  };
  getVisualizerData: () => { waveform: Float32Array; frequency: Uint8Array };
  vadEnabled: boolean;
  silenceThresholdDb: number;
}

export const VisualizerPanel: React.FC<VisualizerPanelProps> = ({
  isRecording,
  meterData,
  getVisualizerData,
  vadEnabled,
  silenceThresholdDb
}) => {
  const [mode, setMode] = useState<VisualizerMode>('all');
  const canvasWaveformRef = useRef<HTMLCanvasElement | null>(null);
  const canvasSpectrumRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Peak hold logic for clipping indicator
  const [stickyClip, setStickyClip] = useState(false);
  useEffect(() => {
    if (meterData.isClipping) {
      setStickyClip(true);
      const timer = setTimeout(() => setStickyClip(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [meterData.isClipping]);

  // Real-time animation loop for canvas rendering
  useEffect(() => {
    const render = () => {
      const { waveform, frequency } = getVisualizerData();

      // Render Oscilloscope
      if (canvasWaveformRef.current && (mode === 'all' || mode === 'oscilloscope')) {
        const canvas = canvasWaveformRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          ctx.fillStyle = '#0f172a'; // slate-900
          ctx.fillRect(0, 0, width, height);

          // Grid lines
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, height / 2);
          ctx.lineTo(width, height / 2);
          ctx.stroke();

          // Waveform line
          if (isRecording && waveform.length > 0) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#38bdf8'; // sky-400
            ctx.beginPath();

            const sliceWidth = width / waveform.length;
            let x = 0;

            for (let i = 0; i < waveform.length; i++) {
              const v = waveform[i]; // range -1 to 1
              const y = (v * 0.9 * height) / 2 + height / 2;

              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
              x += sliceWidth;
            }
            ctx.stroke();
          } else {
            // Flat baseline
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#475569';
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();
          }
        }
      }

      // Render FFT Spectrum
      if (canvasSpectrumRef.current && (mode === 'all' || mode === 'spectrum')) {
        const canvas = canvasSpectrumRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, width, height);

          if (isRecording && frequency.length > 0) {
            const barCount = 48;
            const barWidth = (width / barCount) - 1.5;
            const step = Math.floor(frequency.length / barCount);

            for (let i = 0; i < barCount; i++) {
              let sum = 0;
              for (let s = 0; s < step; s++) {
                sum += frequency[i * step + s];
              }
              const avg = sum / step;
              const barHeight = (avg / 255) * (height - 4);

              // Gradient from cyan to yellow to red
              const ratio = avg / 255;
              let fill = '#10b981'; // emerald
              if (ratio > 0.65) fill = '#eab308'; // amber
              if (ratio > 0.88) fill = '#ef4444'; // red

              ctx.fillStyle = fill;
              ctx.fillRect(i * (barWidth + 1.5), height - barHeight, barWidth, barHeight);
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isRecording, mode, getVisualizerData]);

  // Convert dB to percentage for VU meters (-60 dB to 0 dB)
  const dbToPercent = (db: number) => {
    const clamped = Math.max(-60, Math.min(0, db));
    return ((clamped + 60) / 60) * 100;
  };

  const leftPercent = dbToPercent(meterData.leftDb);
  const rightPercent = dbToPercent(meterData.rightDb);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-md">
      {/* Visualizer Top Bar Controls */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <span className="text-sm font-semibold text-slate-100">DSP Signal Visualizer</span>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setMode('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'all' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Instruments
          </button>
          <button
            onClick={() => setMode('oscilloscope')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'oscilloscope' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Waveform
          </button>
          <button
            onClick={() => setMode('spectrum')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'spectrum' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            FFT Spectrum
          </button>
          <button
            onClick={() => setMode('stereo_vu')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'stereo_vu' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stereo VU Only
          </button>
        </div>
      </div>

      {/* Canvas Viewports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(mode === 'all' || mode === 'oscilloscope') && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Time Domain (Oscilloscope)</span>
              <span className="font-mono text-slate-500">2048 SAMPLES</span>
            </div>
            <div className="h-28 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
              <canvas
                ref={canvasWaveformRef}
                width={480}
                height={112}
                className="w-full h-full block"
              />
            </div>
          </div>
        )}

        {(mode === 'all' || mode === 'spectrum') && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Frequency Spectrum (FFT)</span>
              <span className="font-mono text-slate-500">48 BANDS</span>
            </div>
            <div className="h-28 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
              <canvas
                ref={canvasSpectrumRef}
                width={480}
                height={112}
                className="w-full h-full block"
              />
            </div>
          </div>
        )}
      </div>

      {/* Dual Stereo Peak VU Meter */}
      <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-medium text-slate-300">
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Stereo Peak VU Meters</span>
          </div>

          <div className="flex items-center gap-4 font-mono tabular-nums text-xs">
            <span className="text-slate-400">
              RMS: <strong className="text-slate-200">{meterData.rmsDb.toFixed(1)} dBFS</strong>
            </span>
            <span className="text-slate-400">
              Peak: <strong className="text-slate-200">{Math.max(meterData.leftDb, meterData.rightDb).toFixed(1)} dBFS</strong>
            </span>
            {stickyClip ? (
              <span className="bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded text-[11px] font-bold animate-pulse">
                CLIP DETECTED
              </span>
            ) : (
              <span className="text-slate-500 text-[11px]">HEADROOM OK</span>
            )}
          </div>
        </div>

        {/* Channel Left */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-slate-400 w-3 text-right">L</span>
          <div className="flex-1 h-3 bg-slate-900 rounded-sm overflow-hidden flex relative border border-slate-800">
            {/* Meter Fill */}
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
              style={{ width: `${leftPercent}%` }}
            />
          </div>
          <span className="font-mono text-xs tabular-nums text-slate-400 w-12 text-right">
            {meterData.leftDb.toFixed(1)} dB
          </span>
        </div>

        {/* Channel Right */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-slate-400 w-3 text-right">R</span>
          <div className="flex-1 h-3 bg-slate-900 rounded-sm overflow-hidden flex relative border border-slate-800">
            {/* Meter Fill */}
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
              style={{ width: `${rightPercent}%` }}
            />
          </div>
          <span className="font-mono text-xs tabular-nums text-slate-400 w-12 text-right">
            {meterData.rightDb.toFixed(1)} dB
          </span>
        </div>

        {/* Decibel Scale Markers */}
        <div className="flex justify-between text-[10px] text-slate-500 font-mono pl-6 pr-14">
          <span>-60 dB</span>
          <span>-40 dB</span>
          <span>-24 dB</span>
          <span>-12 dB</span>
          <span>-6 dB</span>
          <span className="text-amber-400">-3 dB</span>
          <span className="text-red-400">0 dB</span>
        </div>

        {/* VAD Silence Detection Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Voice Activity (VAD):</span>
            {vadEnabled ? (
              meterData.isSpeaking ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  SPEECH ACTIVE
                </span>
              ) : (
                <span className="text-amber-400/80 font-medium">
                  SILENCE SKIPPED (Below {silenceThresholdDb} dB)
                </span>
              )
            ) : (
              <span className="text-slate-500">Continuous Capture (VAD Disabled)</span>
            )}
          </div>

          <div className="text-slate-400 text-[11px]">
            Input Threshold: <span className="font-mono text-slate-300">{silenceThresholdDb} dB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
