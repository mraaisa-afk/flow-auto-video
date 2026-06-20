// Flow Auto Video — background task queue model (persisted in chrome.storage).
//
// The queue is the single source of truth for generation tasks. The background
// service worker OWNS all writes (submit / poll / retry); the side panel READS
// it and renders, and asks the worker to mutate via runtime messages. Keeping
// writes in one context avoids races between the panel and the worker, and lets
// long video polls continue after the panel closes (MV3 Realities §3).
import { STORAGE_KEYS } from "./constants.js"

export const QUEUE_KEY = STORAGE_KEYS.taskQueue
export const MAX_TASKS = 40
export const ACTIVE_STATUSES = ["queued", "running"]
export const POLL_INTERVAL_MS = 4000
// Backoff per retry attempt (quota / transient). Last value repeats.
export const RETRY_BACKOFFS_MS = [8000, 20000, 45000]
export const DEFAULT_MAX_ATTEMPTS = 3

export function isActive(t) {
  return ACTIVE_STATUSES.includes(t.status)
}

export async function getQueue() {
  const r = await chrome.storage.local.get(QUEUE_KEY)
  const list = r[QUEUE_KEY]
  return Array.isArray(list) ? list : []
}

// Persist while preserving order (newest-first) and never dropping active tasks;
// only the oldest finished tasks are trimmed once we exceed MAX_TASKS.
export async function setQueue(list) {
  const activeCount = list.filter(isActive).length
  const finishedBudget = Math.max(0, MAX_TASKS - activeCount)
  let usedFinished = 0
  const capped = list.filter((t) => {
    if (isActive(t)) return true
    usedFinished += 1
    return usedFinished <= finishedBudget
  })
  await chrome.storage.local.set({ [QUEUE_KEY]: capped })
  return capped
}

export function makeTask({ kind, body, batch = null, maxAttempts = DEFAULT_MAX_ATTEMPTS }) {
  const key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  return {
    key,
    kind,
    body,
    prompt: body?.prompt || "",
    status: "queued",
    taskId: null,
    results: [],
    error: null,
    errorCode: null,
    errorDetail: null,
    attempts: 0,
    maxAttempts,
    nextAttemptAt: 0,
    accountId: null,
    accountEmail: null,
    batch, // { groupId, index, total } | null
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export async function enqueueTasks(tasks) {
  const cur = await getQueue()
  return setQueue([...tasks, ...cur])
}

export async function patchTask(key, patch) {
  const cur = await getQueue()
  const next = cur.map((t) => (t.key === key ? { ...t, ...patch, updatedAt: Date.now() } : t))
  await setQueue(next)
  return next.find((t) => t.key === key) || null
}

export async function removeTask(key) {
  const cur = await getQueue()
  await setQueue(cur.filter((t) => t.key !== key))
}

export async function clearFinished() {
  const cur = await getQueue()
  await setQueue(cur.filter(isActive))
}

export async function clearQueue() {
  await chrome.storage.local.set({ [QUEUE_KEY]: [] })
}
