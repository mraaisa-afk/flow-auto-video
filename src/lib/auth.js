// Google OAuth via chrome.identity.getAuthToken.
// Requires manifest.oauth2.client_id + a stable extension ID (pinned key).
import { $auth } from "./stores.js"

const REVOKE_URL = "https://accounts.google.com/o/oauth2/revoke"

function getAuthToken(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token) {
        return reject(new Error(chrome.runtime.lastError?.message || "No auth token"))
      }
      resolve(token)
    })
  })
}

function removeCachedToken(token) {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => resolve())
  })
}

async function fetchProfile(token) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Profile fetch failed (${res.status})`)
  const p = await res.json()
  return { email: p.email, name: p.name, picture: p.picture }
}

export async function signIn() {
  $auth.setKey("status", "signing_in")
  $auth.setKey("error", null)
  try {
    const token = await getAuthToken(true)
    const user = await fetchProfile(token)
    $auth.set({ status: "signed_in", user, error: null })
    return user
  } catch (e) {
    $auth.set({ status: "error", user: null, error: e?.message || String(e) })
    throw e
  }
}

export async function signOut() {
  try {
    const token = await getAuthToken(false).catch(() => null)
    if (token) {
      await removeCachedToken(token)
      try {
        const url = new URL(REVOKE_URL)
        url.searchParams.set("token", token)
        await fetch(url.toString())
      } catch (_) {}
    }
  } finally {
    $auth.set({ status: "signed_out", user: null, error: null })
  }
}

// Silent restore on open (non-interactive). Ignores not-signed-in.
export async function restoreSession() {
  try {
    const token = await getAuthToken(false)
    const user = await fetchProfile(token)
    $auth.set({ status: "signed_in", user, error: null })
  } catch (_) {
    // not signed in - leave state as-is
  }
}
