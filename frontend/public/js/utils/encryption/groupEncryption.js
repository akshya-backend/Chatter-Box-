// utils/groupEncryption.js

// 🔁 Base64 ↔ ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// 🔑 Import ECDH Private Key
async function importPrivateKey(base64) {
  const buf = base64ToArrayBuffer(base64);
  return await crypto.subtle.importKey(
    "pkcs8",
    buf,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey"]
  );
}

// 🔑 Import ECDH Public Key
 export async function importPublicKey(base64) {
  const buf = base64ToArrayBuffer(base64);
  return await crypto.subtle.importKey(
    "spki",
    buf,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
}

// 🔁 Derive shared key (ECDH)
async function deriveSharedKey(privateKey, publicKey) {
  return await crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// 🔐 Encrypt AES group key using derived shared key
async function encryptAESKeyForMember(aesKeyBuffer, sharedKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    aesKeyBuffer
  );
  return {
    encryptedKey: bufferToBase64(encrypted),
    iv: bufferToBase64(iv)
  };
}

// 🔐 AES-256 Group Key Generation and Encryption for Members// utils/groupEncryption.js

// ... (keep existing base64 conversion functions)

// 🔐 AES-256 Group Key Generation and Encryption for Members
export async function encryptGroupKeyForMembers({ ownPrivateKeyBase64, memberPublicKeysBase64 }) {
  if (!ownPrivateKeyBase64 || !memberPublicKeysBase64) {
    throw new Error("Missing required parameters");
  }

  const aesKey = crypto.getRandomValues(new Uint8Array(32)); // 256-bit AES key
  const encryptedMembers = [];

  for (const [userId, pubKeyBase64] of Object.entries(memberPublicKeysBase64)) {
    try {
      const publicKey = await importPublicKey(pubKeyBase64);
      const sharedKey = await deriveSharedKey(
        await importPrivateKey(ownPrivateKeyBase64), 
        publicKey
      );

      const { encryptedKey, iv } = await encryptAESKeyForMember(aesKey.buffer, sharedKey);
      encryptedMembers.push({ userId, encryptedKey, iv });
    } catch (error) {
      console.error(`Error encrypting key for user ${userId}:`, error);
      throw error;
    }
  }

  return {
    encryptedKeys: encryptedMembers,
    groupKey: bufferToBase64(aesKey.buffer) // ✅ Only return Base64 string
  };
}


// ✅ Improved AES key import with validation
export async function importAESKeyFromBase64(base64Key) {
  if (!base64Key) throw new Error("No key provided");
  
  // First decode to check length
  const keyBuffer = base64ToArrayBuffer(base64Key);
  
  // Validate length - must be 16 (128-bit) or 32 (256-bit) bytes
  if (keyBuffer.byteLength !== 32 && keyBuffer.byteLength !== 16) {
    throw new Error(`Invalid AES key length: ${keyBuffer.byteLength} bytes. Must be 16 or 32.`);
  }

  return crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

// ✅ Import AES key (used for encrypting/decrypting messages)


// 🔐 Encrypt message with AES-GCM
export async function encryptGroupMessage(plaintext, aesKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    enc.encode(plaintext)
  );
  return {
    encrypted: bufferToBase64(encrypted),
    iv: bufferToBase64(iv)
  };
}

// 🔓 Decrypt message with AES-GCM
export async function decryptGroupMessage(encryptedBase64, ivBase64, aesKey) {
      const key = await importAESKeyFromBase64(aesKey);

  const encryptedBytes = base64ToArrayBuffer(encryptedBase64);
  const ivBytes = base64ToArrayBuffer(ivBase64);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(ivBytes) },
    key,
    encryptedBytes
  );
  return new TextDecoder().decode(decryptedBuffer);
}