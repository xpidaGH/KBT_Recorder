import React, { useState } from 'react';
import { CloudProvider, RecordingItem, ScheduleMode, SyncLog } from '../types/recorder';
import { Cloud, X, CheckCircle, ShieldCheck, Clock, Send, ArrowRight, RefreshCw } from 'lucide-react';

interface CloudSyncModalProps {
  item: RecordingItem | null;
  onClose: () => void;
  onSyncCompleted: (updatedItem: RecordingItem) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  item,
  onClose,
  onSyncCompleted
}) => {
  if (!item) return null;

  const [selectedProvider, setSelectedProvider] = useState<CloudProvider>('dropbox');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('immediate');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const providers: { id: CloudProvider; name: string; description: string }[] = [
    { id: 'dropbox', name: 'Dropbox', description: 'Direct chunked upload to Apps/KBT_Recorder' },
    { id: 'googledrive', name: 'Google Drive', description: 'Multipart encrypted upload to Google Drive vault' },
    { id: 'icloud', name: 'iCloud Drive', description: 'Apple CloudKit container document synchronization' },
    { id: 'evernote', name: 'Evernote', description: 'Audio note encapsulation with transcript text body' },
    { id: 'email', name: 'Email Dispatch', description: 'Secure presigned download link to team inbox' },
    { id: 'webhook', name: 'Enterprise Webhook', description: 'Direct HTTP POST streaming with HMAC-SHA256 signature' }
  ];

  const handleExecuteSync = async () => {
    setIsSyncing(true);
    setErrorMsg(null);
    setSyncResult(null);

    try {
      const response = await fetch('/api/cloud-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          fileName: item.name,
          size: item.sizeBytes,
          format: item.format,
          scheduleMode
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Cloud sync failed');
      }

      setSyncResult(data);

      const newLog: SyncLog = {
        provider: selectedProvider,
        timestamp: data.syncedAt,
        transactionId: data.transactionId,
        signature: data.integritySignature,
        status: 'synced'
      };

      const updated: RecordingItem = {
        ...item,
        syncHistory: [...(item.syncHistory || []), newLog]
      };
      onSyncCompleted(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred during synchronization');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-5 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">Multi-Cloud Storage & Scheduled Export</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Audio Info */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex flex-col">
            <span className="font-semibold text-slate-100">{item.name}</span>
            <span className="text-slate-500 font-mono">
              {(item.duration).toFixed(1)}s · {(item.sizeBytes / 1024).toFixed(1)} KB · {item.format.toUpperCase()}
            </span>
          </div>
          {item.isEncrypted ? (
            <span className="bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded text-[11px] font-mono">
              Zero-Knowledge Encrypted
            </span>
          ) : (
            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[11px] font-mono">
              Unencrypted Master
            </span>
          )}
        </div>

        {/* Cloud Provider Grid */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300">Target Cloud Storage</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {providers.map((p) => {
              const isSelected = selectedProvider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-sky-500 shadow-sm shadow-sky-500/20'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className={`text-xs font-semibold ${isSelected ? 'text-sky-400' : 'text-slate-200'}`}>
                    {p.name}
                  </span>
                  <span className="text-[11px] text-slate-400 line-clamp-1">{p.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule Mode */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Scheduled Auto-Export Cadence</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { id: 'immediate', label: 'Immediate' },
              { id: '15m', label: 'Every 15 min' },
              { id: '1h', label: 'Hourly' },
              { id: 'daily_wifi', label: 'Daily (Wi-Fi)' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setScheduleMode(m.id as ScheduleMode)}
                className={`py-2 px-2.5 rounded-lg border text-center font-medium transition-colors ${
                  scheduleMode === m.id
                    ? 'bg-red-600 border-red-500 text-white font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Signed HMAC-SHA256 Transport Protocol Info */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Transfers are authenticated using a signed <strong>SHA-256 HMAC payload signature</strong>. Edge brokers verify stream integrity dynamically before writing into cloud storage nodes.
          </span>
        </div>

        {/* Sync Success Results */}
        {syncResult && (
          <div className="bg-emerald-950/50 border border-emerald-800 rounded-xl p-4 flex flex-col gap-2 text-xs text-emerald-300">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span>{syncResult.message}</span>
            </div>
            <div className="font-mono text-[11px] text-emerald-300/80 flex flex-col gap-1">
              <div>Transaction ID: <span className="text-white font-bold">{syncResult.transactionId}</span></div>
              <div className="truncate">HMAC Signature: <span className="text-white">{syncResult.integritySignature}</span></div>
              <div>Remote Target: <span className="text-white">{syncResult.endpoint}</span></div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-950/60 border border-red-800 rounded-xl p-3 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleExecuteSync}
            disabled={isSyncing}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synchronizing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Dispatch to {providers.find(p => p.id === selectedProvider)?.name}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
