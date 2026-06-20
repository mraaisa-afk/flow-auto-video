// Flow Auto Video — file helpers for reference uploads & result downloads.

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = () => reject(fr.error || new Error("Failed to read file"))
    fr.readAsDataURL(file)
  })
}

export function filenameFromUrl(url) {
  try {
    const u = new URL(url)
    return decodeURIComponent(u.pathname.split("/").pop() || "output")
  } catch (_) {
    return url.split("/").pop() || "output"
  }
}

export function isVideoUrl(url) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url || "")
}

// Download via fetch → blob → anchor (no "downloads" permission needed).
export async function downloadFile(url, filename) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed (${res.status})`)
  const blob = await res.blob()
  const objUrl = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = objUrl
  a.download = filename || filenameFromUrl(url)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(objUrl), 5000)
}
