// Flow Auto Video — MV3 background service worker (v0.2.0)
//
// MV3 reality: this worker is EPHEMERAL. We use chrome.alarms (never
// setInterval) for wake-ups and persist ALL state to chrome.storage. The task
// queue is processed HERE so long video polls survive the side panel closing
// (Technical Realities §3), and completion notifications fire from background.

import { ALARMS } from "../lib/constants.js"
import { checkHealth, applyBadge } from "../lib/health.js"
import { submitGeneration, getStatus, getApiConfig, rebaseFileUrl } from "../lib/api.js"
import { loadAccounts, selectAccount, recordResult, advanceCursor } from "../lib/accounts.js"
import { recordError } from "../lib/errorLog.js"
import {
  getQueue,
  patchTask,
  enqueueTasks,
  clearFinished,
  clearQueue,
  removeTask,
  isActive,
  POLL_INTERVAL_MS,
  RETRY_BACKOFFS_MS,
} from "../lib/taskQueue.js"

// 1x1 PNG data URL — keeps notifications valid without shipping a raster asset.
// Phase 5 polish can swap in branded notification icons.
const NOTIFY_ICON =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC"

function ensureAlarms() {
  chrome.alarms.create(ALARMS.healthCheck, { periodInMinutes: 1 })
  chrome.alarms.create(ALARMS.pollTasks, { periodInMinutes: 1 })
}

// Side-panel-first: clicking the toolbar icon opens the roomy, resizable side
// panel (the real workspace) instead of a cramped fixed-width popup.
async function enableSidePanelOnClick() {
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  } catch (_) {}
}

function notify(id, title, message) {
  try {
    chrome.notifications.create(id, {
      type: "basic",
      iconUrl: NOTIFY_ICON,
      title,
      message,
      priority: 1,
    })
  } catch (_) {}
}

// --- Queue processing -------------------------------------------------
let timer = null
let draining = false

function scheduleSoon(ms = POLL_INTERVAL_MS) {
  if (timer) return
  timer = setTimeout(() => {
    timer = null
    drainQueue()
  }, ms)
}

function backoffFor(attemptsDone) {
  const i = Math.min(Math.max(0, attemptsDone - 1), RETRY_BACKOFFS_MS.length - 1)
  return RETRY_BACKOFFS_MS[i]
}

async function submitTask(task) {
  // Advisory account selection. The webhook API has NO account selector — the
  // desktop app picks the real account. We track our local health/quota model
  // and drive rotation+backoff bookkeeping so the UI stays accurate.
  const acct = selectAccount(task.kind)
  await patchTask(task.key, {
    accountId: acct?.id || null,
    accountEmail: acct?.email || acct?.label || null,
    attempts: task.attempts + 1,
  })
  try {
    const sub = await submitGeneration(task.kind, task.body)
    await patchTask(task.key, { status: "running", taskId: sub.task_id, error: null })
  } catch (e) {
    // Submit failure (network / missing key / 4xx) — not quota; fail fast.
    await patchTask(task.key, {
      status: "failed",
      error: e?.message || "Submit failed",
      errorCode: e?.code ?? 0,
      errorDetail: e?.detail || null,
    })
    await recordError({
      kind: task.kind,
      taskKey: task.key,
      code: e?.code ?? 0,
      message: e?.message || "Submit failed",
      detail: e?.detail || null,
      account: acct?.email || acct?.label || null,
    })
    notify(`fav-fail-${task.key}`, "Generation failed", e?.message || "Submit failed")
  }
}

async function pollTask(task) {
  let s
  try {
    s = await getStatus(task.taskId)
  } catch (_) {
    // Transient status error — leave running; the next tick retries the poll.
    return
  }
  if (s.status === "pending" || s.status === "running") {
    if (task.status !== "running") await patchTask(task.key, { status: "running" })
    return
  }
  if (s.status === "completed") {
    const { host } = await getApiConfig()
    const results = (s.results || []).map((u) => rebaseFileUrl(u, host))
    await patchTask(task.key, { status: "completed", results, error: null, errorCode: null })
    if (task.accountId) await recordResult(task.accountId, { ok: true })
    const tag = task.batch ? ` (${task.batch.index}/${task.batch.total})` : ""
    notify(`fav-done-${task.key}`, "Generation complete", `${(task.prompt || "").slice(0, 80)}${tag}`)
    return
  }
  if (s.status === "failed") {
    const code = s.error_code ?? 0
    const isQuota = code === 429
    const canRetry = isQuota && task.attempts < task.maxAttempts
    if (task.accountId) await recordResult(task.accountId, { ok: false, errorCode: code, error: s.error })
    await recordError({
      kind: task.kind,
      taskKey: task.key,
      code,
      message: s.error || "Generation failed",
      detail: s.error_detail || null,
      account: task.accountEmail || null,
    })
    if (canRetry) {
      await advanceCursor() // move our rotation pointer toward the next account
      const delay = backoffFor(task.attempts)
      await patchTask(task.key, {
        status: "queued",
        taskId: null,
        nextAttemptAt: Date.now() + delay,
        error: `Quota hit — retrying in ${Math.round(delay / 1000)}s (attempt ${task.attempts + 1}/${task.maxAttempts})`,
        errorCode: code,
        errorDetail: s.error_detail || null,
      })
    } else {
      await patchTask(task.key, {
        status: "failed",
        error: s.error || "Generation failed",
        errorCode: code,
        errorDetail: s.error_detail || null,
      })
      notify(`fav-fail-${task.key}`, "Generation failed", s.error || "Generation failed")
    }
  }
}

async function drainQueue() {
  if (draining) return
  draining = true
  try {
    await loadAccounts() // refresh in-SW account model for selection/bookkeeping
    const now = Date.now()
    const queue = await getQueue()
    for (const task of queue) {
      if (task.status === "queued" && (task.nextAttemptAt || 0) <= now) {
        await submitTask(task)
      } else if (task.status === "running" && task.taskId) {
        await pollTask(task)
      }
    }
  } catch (e) {
    console.error("[Flow Auto Video] drainQueue error", e)
  } finally {
    draining = false
  }
  const after = await getQueue()
  if (after.some(isActive)) scheduleSoon(POLL_INTERVAL_MS)
}

// --- Lifecycle --------------------------------------------------------
chrome.runtime.onInstalled.addListener(async () => {
  console.log("[Flow Auto Video] installed — v0.2.0")
  applyBadge("unknown")
  ensureAlarms()
  await enableSidePanelOnClick()
  checkHealth()
  drainQueue()
})

chrome.runtime.onStartup?.addListener(async () => {
  ensureAlarms()
  await enableSidePanelOnClick()
  checkHealth()
  drainQueue()
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARMS.healthCheck) checkHealth()
  if (alarm.name === ALARMS.pollTasks) drainQueue()
})

// Messages from the side panel.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "CHECK_HEALTH") {
    checkHealth().then((r) => sendResponse(r))
    return true
  }
  if (msg?.type === "ENQUEUE_TASKS" && Array.isArray(msg.tasks)) {
    enqueueTasks(msg.tasks).then(() => {
      drainQueue()
      sendResponse({ ok: true })
    })
    return true
  }
  if (msg?.type === "RETRY_TASK" && msg.key) {
    patchTask(msg.key, {
      status: "queued",
      taskId: null,
      nextAttemptAt: 0,
      attempts: 0,
      error: null,
      errorCode: null,
      errorDetail: null,
    }).then(() => {
      drainQueue()
      sendResponse({ ok: true })
    })
    return true
  }
  if (msg?.type === "REMOVE_TASK" && msg.key) {
    removeTask(msg.key).then(() => sendResponse({ ok: true }))
    return true
  }
  if (msg?.type === "CLEAR_FINISHED") {
    clearFinished().then(() => sendResponse({ ok: true }))
    return true
  }
  if (msg?.type === "CLEAR_TASKS") {
    clearQueue().then(() => sendResponse({ ok: true }))
    return true
  }
  return false
})
