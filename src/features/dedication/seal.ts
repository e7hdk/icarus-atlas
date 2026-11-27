/** A sealed gift: a JSON value under AES-256-GCM, its key derived from a
 *  passphrase with PBKDF2-SHA-256. Nothing of the passphrase is stored: the
 *  authentication tag alone says whether a key opens the seal.
 *
 *  The atlas is a public repository and a public site, so what a dedication
 *  keeps for one person ships only in this form. A passphrase as short as a
 *  date keeps crawlers and the curious out; it would not stop someone who set
 *  a machine to try every date. Shared by the sealing script (Node) and the
 *  door (browser): both have WebCrypto. */

export interface Sealed {
  v: 1;
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  iv: string;
  /** Ciphertext and tag, base64. */
  data: string;
}

/** OWASP's floor for PBKDF2-HMAC-SHA-256: about half a second on a phone. */
export const SEAL_ITERATIONS = 600_000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let at = 0; at < bytes.length; at += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(at, at + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let at = 0; at < binary.length; at++) bytes[at] = binary.charCodeAt(at);
  return bytes;
}

/** True where the seal can be worked at all: WebCrypto needs a secure context. */
export const canUnseal = (): boolean => typeof crypto !== 'undefined' && crypto.subtle !== undefined;

/** The passphrase a day gives: `2000-01-31` for 31 January 2000. */
export function dayPassphrase(day: number, month: number, year: number): string {
  const pad = (value: number, width: number) => String(value).padStart(width, '0');
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

export async function deriveKey(passphrase: string, kdf: Sealed['kdf']): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: kdf.hash, iterations: kdf.iterations, salt: fromBase64(kdf.salt) },
    material,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

/** Opens the seal, or throws when the key is not the one that closed it. */
export async function openSealed<T>(sealed: Sealed, key: CryptoKey): Promise<T> {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(sealed.iv) }, key, fromBase64(sealed.data));
  return JSON.parse(decoder.decode(plain)) as T;
}

export async function sealJson(value: unknown, passphrase: string, iterations = SEAL_ITERATIONS): Promise<Sealed> {
  const salt = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)));
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
  const kdf: Sealed['kdf'] = { name: 'PBKDF2', hash: 'SHA-256', iterations, salt: toBase64(salt) };
  const key = await deriveKey(passphrase, kdf);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(value)));
  return { v: 1, kdf, iv: toBase64(iv), data: toBase64(new Uint8Array(data)) };
}

/** A key the visitor's own device may keep, so the door asks only once there. */
export async function exportKey(key: CryptoKey): Promise<string> {
  return toBase64(new Uint8Array(await crypto.subtle.exportKey('raw', key)));
}

export async function importKey(raw: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', fromBase64(raw), { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}
