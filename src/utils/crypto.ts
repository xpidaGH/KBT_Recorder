/**
 * Zero-Knowledge Client-Side Cryptography Module
 * Implements PBKDF2 (100,000 iterations, SHA-256) + AES-256-GCM authenticated encryption.
 * Passphrases never leave the client device memory.
 */

function buf2hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

function hex2buf(hexString: string): ArrayBuffer {
  const bytes = new Uint8Array(Math.ceil(hexString.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
}

export async function encryptAudioBlob(blob: Blob, passphrase: string): Promise<{
  encryptedBlob: Blob;
  saltHex: string;
  ivHex: string;
}> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit standard for GCM

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const arrayBuffer = await blob.arrayBuffer();
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    arrayBuffer
  );

  const encryptedBlob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });
  return {
    encryptedBlob,
    saltHex: buf2hex(salt.buffer),
    ivHex: buf2hex(iv.buffer)
  };
}

export async function decryptAudioBlob(
  encryptedBlob: Blob,
  passphrase: string,
  saltHex: string,
  ivHex: string,
  originalMimeType: string = 'audio/wav'
): Promise<Blob> {
  const enc = new TextEncoder();
  const salt = hex2buf(saltHex);
  const iv = hex2buf(ivHex);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const encryptedBuffer = await encryptedBlob.arrayBuffer();
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    encryptedBuffer
  );

  return new Blob([decryptedBuffer], { type: originalMimeType });
}
