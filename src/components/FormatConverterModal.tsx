import React, { useState } from 'react';
import { AudioFormat, BitDepth, RecordingItem } from '../types/recorder';
import { X, Repeat, CheckCircle, RefreshCw, FileAudio } from 'lucide-react';

interface FormatConverterModalProps {
  item: RecordingItem | null;
  onClose: () => void;
  onConversionCompleted: (newItem: RecordingItem) => void;
}

export const FormatConverterModal: React.FC<FormatConverterModalProps> = ({
  item,
  onClose,
  onConversionCompleted
}) => {
  if (!item) return null;

  const [targetFormat, setTargetFormat] = useState<AudioFormat>('mp3');
  const [targetSampleRate, setTargetSampleRate] = useState<number>(44100);
  const [targetBitDepth, setTargetBitDepth] = useState<BitDepth>(16);
  const [isConverting, setIsConverting] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const handleConvert = async () => {
    setIsConverting(true);
    setResultMsg(null);

    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: item.name,
          sourceFormat: item.format,
          targetFormat,
          targetSampleRate,
          targetBitDepth
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Conversion failed');

      setResultMsg(data.message);

      // Create cloned converted record with new format metadata
      const convertedItem: RecordingItem = {
        ...item,
        id: crypto.randomUUID(),
        name: data.convertedFileName,
        format: targetFormat,
        sampleRate: targetSampleRate,
        bitDepth: targetBitDepth,
        timestamp: Date.now(),
        tags: [`Transcoded_${targetFormat.toUpperCase()}`, ...item.tags],
        syncHistory: []
      };

      onConversionCompleted(convertedItem);
    } catch (err: any) {
      setResultMsg(`Error: ${err.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">Audio Format Transcoder</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current source info */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3 text-xs">
          <FileAudio className="w-6 h-6 text-slate-500 shrink-0" />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-100">{item.name}</span>
            <span className="text-slate-500 font-mono">
              Source: {item.format.toUpperCase()} · {item.sampleRate}Hz · {item.channels === 1 ? 'Mono' : 'Stereo'}
            </span>
          </div>
        </div>

        {/* Target Format */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300">Target Output Codec</label>
          <div className="grid grid-cols-5 gap-2">
            {(['mp3', 'wav', 'flac', 'm4a', 'amr'] as AudioFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setTargetFormat(fmt)}
                className={`py-2 text-xs font-mono font-semibold rounded-lg border text-center transition-colors ${
                  targetFormat === fmt
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Target Sample Rate */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300">Re-sample Frequency</label>
          <select
            value={targetSampleRate}
            onChange={(e) => setTargetSampleRate(parseInt(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="8000">8,000 Hz (Telephony Narrowband)</option>
            <option value="16000">16,000 Hz (Whisper AI Speech Standard)</option>
            <option value="22050">22,050 Hz (Broadcast Voice)</option>
            <option value="44100">44,100 Hz (CD Audio Standard)</option>
            <option value="48000">48,000 Hz (Broadcast Studio Standard)</option>
            <option value="96000">96,000 Hz (Master Audiophile 96k)</option>
          </select>
        </div>

        {/* Quantization Bit Depth */}
        {targetFormat === 'wav' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">PCM Quantization</label>
            <div className="grid grid-cols-3 gap-2">
              {([16, 24, 32] as BitDepth[]).map((bits) => (
                <button
                  key={bits}
                  onClick={() => setTargetBitDepth(bits)}
                  className={`py-1.5 text-xs font-mono rounded-lg border text-center transition-colors ${
                    targetBitDepth === bits
                      ? 'bg-purple-600 border-purple-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {bits}-bit PCM
                </button>
              ))}
            </div>
          </div>
        )}

        {resultMsg && (
          <div className="bg-purple-950/50 border border-purple-800 rounded-xl p-3 text-xs text-purple-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{resultMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConvert}
            disabled={isConverting}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
          >
            {isConverting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Transcoding...</span>
              </>
            ) : (
              <>
                <Repeat className="w-4 h-4" />
                <span>Convert to {targetFormat.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
