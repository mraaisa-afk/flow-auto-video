// Flow Auto Video — shared constants

// Local G-Labs-compatible webhook backend (started by the desktop app).
export const WEBHOOK_HOST = "http://127.0.0.1:8765"

export const ENDPOINTS = {
  health: `${WEBHOOK_HOST}/api/health`,
  generateImage: `${WEBHOOK_HOST}/api/image/generate`,
  generateVideo: `${WEBHOOK_HOST}/api/video/generate`,
  generateGrok: `${WEBHOOK_HOST}/api/grok/generate`,
  status: (taskId) => `${WEBHOOK_HOST}/api/status/${taskId}`,
  file: (filename) => `${WEBHOOK_HOST}/api/files/${filename}`,
}

// chrome.storage keys (namespaced fav.*)
export const STORAGE_KEYS = {
  accounts: "fav.accounts",
  settings: "fav.settings",
  promptHistory: "fav.promptHistory",
  templates: "fav.templates",
  taskQueue: "fav.taskQueue",
}

// chrome.alarms names — used INSTEAD of setInterval (SW is ephemeral)
export const ALARMS = {
  healthCheck: "fav.healthCheck",
  pollTasks: "fav.pollTasks",
}
