// Encrypted chrome.storage.local wrapper using Web Crypto (AES-GCM).
//
// HONEST THREAT MODEL: this protects stored values against casual inspection,
// NOT against a determined local attacker — the wrapping key lives in the same
// chrome.storage on the same machine. Do not treat it as bulletproof.

const KEY_STORAGE = "fav.__cryptoKey"

async function getCryptoKey() {
  const existing = await chrome.storage.local.get(KEY_STORAGE)
  if (existing[KEY_STORAGE]) {
    return crypto.subtle.importKey(
      "jwk",
      existing[KEY_STORAGE],
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    )
  }
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  )
  const jwk = await crypto.subtle.exportKey("jwk", key)
  await chrome.storage.local.set({ [KEY_STORAGE]: jwk })
  return key
}

function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function b64ToBuf(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

export async function setSecure(key, value) {
  const cryptoKey = await getCryptoKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = new TextEncoder().encode(JSON.stringify(value))
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, data)
  await chrome.storage.local.set({
    [key]: { __enc: true, iv: bufToB64(iv), data: bufToB64(cipher) },
  })
}

export async function getSecure(key, fallback = null) {
  const stored = await chrome.storage.local.get(key)
  const rec = stored[key]
  if (!rec || !rec.__enc) return fallback
  try {
    const cryptoKey = await getCryptoKey()
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBuf(rec.iv) },
      cryptoKey,
      b64ToBuf(rec.data)
    )
    return JSON.parse(new TextDecoder().decode(plain))
  } catch (e) {
    console.error("[storage] decrypt failed", e)
    return fallback
  }
}

export async function removeSecure(key) {
  await chrome.storage.local.remove(key)
}
