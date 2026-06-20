// Flow Auto Video — shared UI state (Nano Stores)
import { atom, map } from "nanostores"

// Google auth: status = signed_out | signing_in | signed_in | error
export const $auth = map({
  status: "signed_out",
  user: null, // { email, name, picture }
  error: null,
})

// Backend health: state = connected | partial | disconnected | unknown
export const $health = map({
  state: "unknown",
  lastChecked: null,
  detail: null,
})

// Active tab in the shell
export const $activeTab = atom("dashboard")

// Generation tasks, most recent first.
// task: { key, id, kind, prompt, status, results, error, errorCode, createdAt }
export const $tasks = atom([])

export function upsertTask(patch) {
  const list = $tasks.get()
  const idx = list.findIndex((t) => t.key === patch.key)
  if (idx === -1) {
    $tasks.set([patch, ...list].slice(0, 20))
  } else {
    const next = list.slice()
    next[idx] = { ...next[idx], ...patch }
    $tasks.set(next)
  }
}

export function clearTasks() {
  $tasks.set([])
}
