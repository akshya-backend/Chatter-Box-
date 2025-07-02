// generateKeys.js

// --- Generate new ECDH key pair (P-256 curve) ---
export async function generateECDHKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );

  const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  const pub64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)));
  const priv64 = btoa(String.fromCharCode(...new Uint8Array(privateKey)));

  return { pub64, priv64 };
}

// --- Save key to IndexedDB ---
export function indexedDBSave(key, value) {
  return new Promise((resolve) => {
    const request = indexedDB.open("E2EE_Chat", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("keys");
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("keys", "readwrite");
      tx.objectStore("keys").put(value, key);
      tx.oncomplete = () => resolve(true);
    };
  });
}
export async function indexedDBLoad(key, fetchUrl = "/api/v1/auth/key") {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("E2EE_Chat", 1);

    request.onupgradeneeded = () => {
      console.log("🆕 IndexedDB upgrade triggered — creating object store");
      request.result.createObjectStore("keys");
    };

    request.onsuccess = async () => {
      const db = request.result;
      const tx = db.transaction("keys", "readonly");
      const store = tx.objectStore("keys");
      const getRequest = store.get(key);

      getRequest.onsuccess = async () => {
        const result = getRequest.result;

        if (result) {
          console.log(`📦 Key "${key}" found in IndexedDB ✅`);
          return resolve(result); // ✅ Found in IndexedDB
        }

        console.log(`🔍 Key "${key}" not found in IndexedDB — fetching from server...`);

        // ❌ Not found — fetch from backend
        try {
          const res = await fetch(fetchUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!res.ok) {
            console.error("❌ Server returned non-200 response");
            return reject("❌ Server returned error");
          }

          const data = await res.json();
          if (!data.success || !data.publicKey || !data.privateKey) {
            console.error("❌ Incomplete key data from server response:", data);
            return reject("❌ Incomplete key data from server");
          }

          console.log("📥 Keys received from server. Saving to IndexedDB...");

          const writeTx = db.transaction("keys", "readwrite");
          const store = writeTx.objectStore("keys");
          store.put(data.publicKey, "publicKey");
          store.put(data.privateKey, "privateKey");

          writeTx.oncomplete = () => {
            console.log(`✅ Saved both keys to IndexedDB. Returning "${key}"`);
            resolve(key === "publicKey" ? data.publicKey : data.privateKey);
          };
        } catch (err) {
          console.error("❌ Fetch error:", err);
          reject("❌ Fetch error: " + err.message);
        }
      };

      getRequest.onerror = () => {
        console.error("❌ IndexedDB read failed");
        reject("❌ IndexedDB read failed");
      };
    };

    request.onerror = () => {
      console.error("❌ Failed to open IndexedDB");
      reject("❌ Failed to open IndexedDB");
    };
  });
}
