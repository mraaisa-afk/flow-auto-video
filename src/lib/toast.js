// Flow Auto Video — lightweight toast notifications (UI page context only).
// Renders via <ToastHost/>. Auto-dismisses after `duration` ms (0 = sticky).
import { atom } from "nanostores"

export const $toasts = atom([])

let seq = 0

export function toast(message, opts = {}) {
  const id = `tt_${++seq}_${Date.now().toString(36)}`
  const item = {
    id,
    message,
    type: opts.type || "info", // info | success | error
    duration: opts.duration == null ? 3200 : opts.duration,
  }
  $toasts.set([...$toasts.get(), item])
  if (item.duration > 0) {
    setTimeout(() => dismissToast(id), item.duration)
  }
  return id
}

export function dismissToast(id) {
  $toasts.set($toasts.get().filter((t) => t.id !== id))
}

export const toastSuccess = (m, o) => toast(m, { ...o, type: "success" })
export const toastError = (m, o) => toast(m, { ...o, type: "error" })
export const toastInfo = (m, o) => toast(m, { ...o, type: "info" })
