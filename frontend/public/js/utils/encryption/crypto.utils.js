export async function importECDHPublic(base64) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'spki', bytes.buffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    true, []
  );
}

export async function deriveKey(privateKey, publicKey) {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export function bufToArr(buf) {
  return Array.from(new Uint8Array(buf));
}
export function arrToBuf(arr) {
  return new Uint8Array(arr).buffer;
}
