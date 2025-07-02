import { indexedDBLoad } from "./create_key.js";

// e2eeMessaging.js
const sharedKeyCache = new Map();

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importPublicKey(pub64) {
  return crypto.subtle.importKey(
    "spki",
    base64ToBuffer(pub64),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
}

async function importPrivateKey(priv64) {
  return crypto.subtle.importKey(
    "pkcs8",
    base64ToBuffer(priv64),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey"]
  );
}

async function deriveSharedKey(recipientId, recipientPubKey64) {
  if (sharedKeyCache.has(recipientId)) {
    return sharedKeyCache.get(recipientId);
  }

  const priv64 = await indexedDBLoad("privateKey");
  const myPrivateKey = await importPrivateKey(priv64);
  const theirPublicKey = await importPublicKey(recipientPubKey64);

  const sharedKey = await crypto.subtle.deriveKey(
    { name: "ECDH", public: theirPublicKey },
    myPrivateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  sharedKeyCache.set(recipientId, sharedKey);
  return sharedKey;
}

export async function encryptMessage(message, recipientId, recipientPubKey64) {
  const sharedKey = await deriveSharedKey(recipientId, recipientPubKey64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(message);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    encoded
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

export async function decryptMessage(ciphertext64, iv64, senderId, senderPubKey64) {
  const sharedKey = await deriveSharedKey(senderId, senderPubKey64);

  const ctBytes = Uint8Array.from(atob(ciphertext64), c => c.charCodeAt(0));
  const ivBytes = Uint8Array.from(atob(iv64), c => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    sharedKey,
    ctBytes
  );

  return new TextDecoder().decode(decrypted);
} 