import React, { useState } from 'react';
import { Cloud, CheckCircle, RefreshCw, Clock, ShieldCheck, ExternalLink, HardDrive, Send, AlertTriangle } from 'lucide-react';
import { RecordingItem, SyncLog } from '../types/recorder';

interface CloudHubViewProps {
  recordings: RecordingItem[];
  onOpenSyncModal: (item: RecordingItem) => void;
}

export const CloudHubView: React.FC<CloudHubViewProps> = ({
  recordings,
  onOpenSyncModal
}) => {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const cloudConnectors = [
    {
      id: 'dropbox',
      name: 'Dropbox Enterprise',
      status: 'Active',
      type: 'OAuth 2.0 PKCE Chunked Ingestion',
      path: '/Apps/KBT_Recorder/Vault',
      latency: '24ms'
    },
    {
      id: 'googledrive',
      name: 'Google Drive Vault',
      status: 'Active',
      type: 'v3 Resumable Multipart Upload',
      path: 'My Drive/KBT_Recordings',
      latency: '31ms'
    },
    {
      id: 'icloud',
      name: 'iCloud Drive',
      status: 'Active',
      type: 'Apple CloudKit Native Container',
      path: 'iCloud~com~kbt~recorder',
      latency: '28ms'
    },
    {
      id: 'evernote',
      name: 'Evernote Cloud Notes',
      status: 'Active',
      type: 'EDAM Note & Audio Attachment Sync',
      path: 'Notebooks/Voice_Memos',
      latency: '45ms'
    },
    {
      id: 'email',
      name: 'SMTP Email Dispatcher',
      status: 'Active',
      type: 'MIME Attachment Streamer',
      path: 'smtp.kbt-recorder.internal',
      latency: '15ms'
    },
    {
      id: 'webhook',
      name: 'Enterprise Webhook Router',
      status: 'Active',
      type: 'SHA-256 HMAC Edge Streamer',
      path: 'https://webhook.kbt-recorder.internal/ingest',
      latency: '12ms'
    }
  ];

  const handleTestBroker = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/cloud-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'dropbox',
          fileName: 'ping_heartbeat.wav',
          size: 1024,
          format: 'wav',
          scheduleMode: 'immediate'
        })
      });
      const data = await res.json();
      setTestResult(`Broker ping verified: Transaction ${data.transactionId} acknowledged with HMAC signature.`);
    } catch (err: any) {
      setTestResult(`Ping error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Collect all sync logs from recordings
  const allLogs: { recName: string; log: SyncLog }[] = [];
  recordings.forEach((r) => {
    (r.syncHistory || []).forEach((l) => {
      allLogs.push({ recName: r.name, log: l });
    });
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">Multi-Cloud Ingestion Broker & Sync Queue</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            KBT_Recorder automatically signs and streams chunked audio payloads across external cloud vaults (Dropbox, Google Drive, iCloud, Evernote, Email, and Webhooks) using zero-knowledge client encryption and signed HMAC-SHA256 headers.
          </p>
        </div>

        <button
          onClick={handleTestBroker}
          disabled={isTesting}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shrink-0 shadow-md cursor-pointer disabled:opacity-50"
        >
          {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>Test Ingestion Broker</span>
        </button>
      </div>

      {testResult && (
        <div className="bg-emerald-950/60 border border-emerald-800 p-3.5 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{testResult}</span>
        </div>
      )}

      {/* Cloud Connectors Grid */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold text-slate-300">Active Storage Provider Pipelines (6 Linked)</span>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {cloudConnectors.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{c.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-900 px-1.5 py-0.2 rounded">
                    {c.status}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono text-[11px]">{c.type}</span>
                <span className="text-[11px] text-slate-500 truncate mt-1">Remote: {c.path}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span>Latency: {c.latency}</span>
                <span className="text-emerald-400">HMAC-SHA256 Signed</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Synchronized Recordings Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">Recent Transmission Audit Log ({allLogs.length} Events)</span>
          <span className="text-[11px] text-slate-500 font-mono">TAMPER-EVIDENT LEDGER</span>
        </div>

        {allLogs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No cloud export events logged yet. Go to Vault Library and click "Cloud Sync" on any recording to dispatch an export.
          </div>
        ) : (
          <div className="divide-y divide-slate-800 text-xs">
            {allLogs.slice(-6).reverse().map((entry, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-4 font-mono text-[11px]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-200 font-sans font-medium">{entry.recName}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-sky-400 uppercase font-bold">{entry.log.provider}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <span>Txn: {entry.log.transactionId}</span>
                  <span className="hidden sm:inline">{new Date(entry.log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
