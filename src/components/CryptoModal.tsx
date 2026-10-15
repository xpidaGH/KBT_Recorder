import React, { useState } from 'react';
import { RecordingItem } from '../types/recorder';
import { X, Lock, Unlock, KeyRound, ShieldAlert, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { encryptAudioBlob, decryptAudioBlob } from '../utils/crypto';

interface CryptoModalProps {
  item: RecordingItem | null;
  onClose: () => void;
  onUpdateItem: (updatedItem: RecordingItem) => void;
}

export const CryptoModal: React.FC<CryptoModalProps> = ({
  item,
  onClose,
  onUpdateItem
}) => {
  if (!item) return null;

  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEncrypt = async () => {
    if (!passphrase || passphrase.length < 4) {
      setErrorMsg('Please enter a secure passphrase with at least 4 characters.');
      return;
    }
    if (!item.blob) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const { encryptedBlob, saltHex, ivHex } = await encryptAudioBlob(item.blob, passphrase);

      const updated: RecordingItem = {
        ...item,
        blob: encryptedBlob,
        blobUrl: undefined, // Clears plaintext URL
        isEncrypted: true,
        encryptionSalt: saltHex,
        encryptionIv: ivHex
      };

      onUpdateItem(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(`Encryption failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!passphrase) {
      setErrorMsg('Please enter your decryption passphrase.');
      return;
    }
    if (!item.blob || !item.encryptionSalt || !item.encryptionIv) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const decryptedBlob = await decryptAudioBlob(
        item.blob,
        passphrase,
        item.encryptionSalt,
        item.encryptionIv,
        'audio/wav'
      );

      const updated: RecordingItem = {
        ...item,
        blob: decryptedBlob,
        blobUrl: URL.createObjectURL(decryptedBlob),
        isEncrypted: false,
        encryptionSalt: undefined,
        encryptionIv: undefined
      };

      onUpdateItem(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg('Decryption failed! Incorrect passphrase or corrupted ciphertext MAC.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-5 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            {item.isEncrypted ? (
              <Unlock className="w-5 h-5 text-amber-400" />
            ) : (
              <Lock className="w-5 h-5 text-emerald-400" />
            )}
            <h2 className="text-base font-bold text-white">
              {item.isEncrypted ? 'Decrypt Audio File' : 'Zero-Knowledge Encrypt'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-slate-400 leading-relaxed">
          {item.isEncrypted ? (
            <span>
              This file is protected with <strong>AES-256-GCM</strong>. Enter the passphrase used during encryption to unlock playback and editing in memory.
            </span>
          ) : (
            <span>
              Encrypt this recording using authenticated <strong>AES-256-GCM</strong> with 100,000 PBKDF2 key-derivation iterations. The secret key is never transmitted or saved to disk.
            </span>
          )}
        </div>

        {/* Passphrase Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            <span>Passphrase</span>
          </label>
          <div className="relative">
            <input
              type={showPassphrase ? 'text' : 'password'}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter cryptographic passphrase..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-red-500"
            />
            <button
              type="button"
              onClick={() => setShowPassphrase(!showPassphrase)}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
            >
              {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Security Matrix Pill */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Standard: <strong>PBKDF2-HMAC-SHA256 (100k rounds)</strong> + <strong>AES-256-GCM (96-bit IV)</strong>. Zero-Knowledge client architecture.
          </span>
        </div>

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
            Cancel
          </button>

          {item.isEncrypted ? (
            <button
              onClick={handleDecrypt}
              disabled={isProcessing}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>{isProcessing ? 'Decrypting...' : 'Unlock & Decrypt'}</span>
            </button>
          ) : (
            <button
              onClick={handleEncrypt}
              disabled={isProcessing}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{isProcessing ? 'Encrypting...' : 'Encrypt File'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
