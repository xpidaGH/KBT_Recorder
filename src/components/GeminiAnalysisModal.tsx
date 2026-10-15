import React, { useEffect, useState } from 'react';
import { RecordingItem } from '../types/recorder';
import { X, Sparkles, CheckCircle2, ListTodo, Gauge, RefreshCw, MessageSquare } from 'lucide-react';

interface GeminiAnalysisModalProps {
  item: RecordingItem | null;
  onClose: () => void;
}

export const GeminiAnalysisModal: React.FC<GeminiAnalysisModalProps> = ({
  item,
  onClose
}) => {
  if (!item) return null;

  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    const currentItem = item;
    let cancelled = false;
    async function runAnalysis() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch('/api/gemini/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: currentItem.transcript || 'Professional voice recording session in progress.',
            audioMeta: {
              name: currentItem.name,
              durationSeconds: currentItem.duration,
              sampleRate: currentItem.sampleRate,
              format: currentItem.format,
              channels: currentItem.channels
            }
          })
        });

        const data = await res.json();
        if (!cancelled) {
          if (!res.ok) throw new Error(data.error || 'AI analysis request failed');
          setAnalysis(data);
        }
      } catch (err: any) {
        if (!cancelled) setErrorMsg(err.message || 'Failed to retrieve AI analysis');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    runAnalysis();
    return () => {
      cancelled = true;
    };
  }, [item]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-5 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <h2 className="text-base font-bold text-white">AI Conversation Analysis & Diarization</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
            <span className="text-xs font-medium">Extracting conversational insights via Gemini AI...</span>
          </div>
        ) : errorMsg ? (
          <div className="bg-red-950/60 border border-red-800 rounded-xl p-4 text-xs text-red-300">
            {errorMsg}
          </div>
        ) : analysis ? (
          <div className="flex flex-col gap-4 text-xs">
            {/* Executive Summary */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-pink-400" />
                <span>Executive Summary</span>
              </span>
              <p className="text-slate-300 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Score & Sentiment */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-0.5">
                <span className="text-slate-400 text-[11px]">Intelligibility Score</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {analysis.intelligibilityScore || 98} / 100
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-0.5">
                <span className="text-slate-400 text-[11px]">Conversational Tone</span>
                <span className="text-sm font-semibold text-sky-400">
                  {analysis.sentiment || 'Professional'}
                </span>
              </div>
            </div>

            {/* Key Takeaways */}
            {analysis.keyPoints && analysis.keyPoints.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Key Discussion Points</span>
                </span>
                <ul className="space-y-1.5 pl-2">
                  {analysis.keyPoints.map((pt: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1.5 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {analysis.actionItems && analysis.actionItems.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-amber-400" />
                  <span>Action Items & Next Steps</span>
                </span>
                <ul className="space-y-1.5 pl-2">
                  {analysis.actionItems.map((act: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
