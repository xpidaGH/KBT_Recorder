import React, { useState } from 'react';
import { CAPSTONE_LANGUAGES, CapstoneProjectSpec } from '../data/capstoneLanguages';
import { Code2, Copy, Check, Terminal, Layers, Cpu, ShieldCheck, Network, Database } from 'lucide-react';

export const CapstoneExplorer: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('cpp_core');
  const [copied, setCopied] = useState(false);

  const currentProject = CAPSTONE_LANGUAGES.find((p) => p.id === selectedId) || CAPSTONE_LANGUAGES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentProject.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col gap-2">
        <div className="flex items-center gap-2 text-white">
          <Layers className="w-5 h-5 text-red-500" />
          <h2 className="text-base font-bold">KBT_Recorder Multi-Platform Capstone Architecture Hub</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
          Engineered for advanced international programming students. The system is decomposed into a <strong>Core C++ Engine</strong> (handling high-performance hardware audio, digital signal processing, lookahead AGC, silence VAD, and Libsodium cryptography) and <strong>language-specific integration layers</strong> implementing cloud synchronization, background OS pipelines, and idiomatic enterprise patterns.
        </p>
      </div>

      {/* Architecture Blueprint Diagram */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold text-slate-200">Part 3: Unified Multi-Language Architecture Blueprint</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">INTEROP SPECIFICATION</span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-lg border border-slate-800/80 font-mono text-[11px] text-sky-300/90 overflow-x-auto leading-relaxed select-text">
          <pre>{`+-----------------------------------------------------------------------+
|                       CROSS-PLATFORM FRONT-END UI                     |
|            Kotlin (Android Compose)   |   Dart/Flutter Core           |
+-----------------------------------+-----------------------------------+
                                    |
                                    v (MethodChannel / JNI Bridge)
+-----------------------------------------------------------------------+
|                            CORE C++ ENGINE                            |
|  [Low-Level Audio API Wrapper] -> [DSP & Silence VAD Pipeline]         |
|                                         |                             |
|                                         v (Memory Safe Inspection)    |
|                          [Rust RingBuffer Analyzer Extension]         |
+-----------------------------------------+------------------------------+
                                          |
                                          v (Encrypted File Output)
+-----------------------------------------------------------------------+
|                    SECURE LOCAL STORAGE & ROUTING HUB                 |
|   Windows Client (C# WASAPI)   |   Mainframe Audio Batch (COBOL/Asm)  |
+-----------------------------------------+------------------------------+
                                          |
                                          v (Encrypted Transport HTTPS)
+-----------------------------------------------------------------------+
|                         DISTRIBUTED CLOUD LAYER                       |
|   PHP Ingestion Broker   ->   Go Stream Multiplexer -> PostgreSQL Log |
|                                         |                             |
|       +---------------------------------+-------------------------+   |
|       |                                                           |   |
|       v                                                           v   |
|  Python Whisper AI Service                                  Scala/R Signal|
|  (Asynchronous Transcripts)                                 Analytics  |
+-----------------------------------------------------------------------+`}</pre>
        </div>

        {/* Hardware & Protocols Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 flex flex-col gap-1 text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Hardware Interoperability Protocols:</span>
            </span>
            <p className="text-[11px] text-slate-400">
              Mobile presentation layers communicate with the C++ core via continuous C-style opaque pointers. Real-time audio threads write into a shared lock-free thread-safe RingBuffer, isolating audio drivers from UI rendering.
            </p>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 flex flex-col gap-1 text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Knowledge Multi-Cloud Strategy:</span>
            </span>
            <p className="text-[11px] text-slate-400">
              Audio frames are encrypted in-memory before disk flushing using AES-256-GCM / XChaCha20. Network chunk payloads carry signed SHA-256 HMAC signatures so edge nodes verify integrity without decryption.
            </p>
          </div>
        </div>
      </div>

      {/* Language Selector Grid (21 Environments) */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300">
          Select Capstone Ecosystem Target ({CAPSTONE_LANGUAGES.length} Languages):
        </label>
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
          {CAPSTONE_LANGUAGES.map((lang) => {
            const isSelected = selectedId === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setSelectedId(lang.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-red-600 text-white font-semibold shadow-sm shadow-red-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {lang.language}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Language Spec & Production Code Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col gap-5">
        {/* Spec Overview Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">{currentProject.title}</span>
              <span className="text-[11px] font-mono bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded">
                {currentProject.language}
              </span>
            </div>
            <span className="text-xs text-slate-400">{currentProject.domain}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Code Copied' : 'Copy Source Code'}</span>
            </button>
          </div>
        </div>

        {/* Pattern & Responsibilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-1.5">
            <span className="font-semibold text-slate-200">Architectural Pattern:</span>
            <p className="text-slate-400 leading-relaxed font-mono text-[11px] text-sky-400">
              {currentProject.architecturalPattern}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-1.5">
            <span className="font-semibold text-slate-200">Key Production Responsibilities:</span>
            <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-1">
              {currentProject.responsibilities.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Production Code Snippet Viewer */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
            <span className="text-slate-300 font-semibold">{currentProject.filename}</span>
            <span>Production-Grade Implementation</span>
          </div>

          <div className="relative bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto max-h-[460px] leading-relaxed">
            <pre>
              <code>{currentProject.codeSnippet}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
