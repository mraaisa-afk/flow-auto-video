import { useEffect } from "preact/hooks"
import { useStore } from "@nanostores/preact"
import { $activeTab, $health } from "../lib/stores.js"
import { Header } from "../components/Header.jsx"
import { TabNav } from "../components/TabNav.jsx"
import { Dashboard } from "../views/Dashboard.jsx"
import { Generate } from "../views/Generate.jsx"
import { Accounts } from "../views/Accounts.jsx"
import { Settings } from "../views/Settings.jsx"
import { restoreSession } from "../lib/auth.js"
import { STORAGE_KEYS } from "../lib/constants.js"

export function App() {
  const tab = useStore($activeTab)

  useEffect(() => {
    restoreSession()
    chrome.storage.local.get(STORAGE_KEYS.healthState).then((r) => {
      const h = r[STORAGE_KEYS.healthState]
      if (h) $health.set({ state: h.state, lastChecked: h.lastChecked, detail: h.detail })
    })
    chrome.runtime.sendMessage({ type: "CHECK_HEALTH" })

    const onChanged = (changes, area) => {
      if (area === "local" && changes[STORAGE_KEYS.healthState]) {
        const h = changes[STORAGE_KEYS.healthState].newValue
        if (h) $health.set({ state: h.state, lastChecked: h.lastChecked, detail: h.detail })
      }
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  // Full-height, full-width workspace. Content grows with the panel (drag the
  // panel edge to widen it) up to a comfortable reading width, and the dense
  // views switch to multi-column once there's room.
  return (
    <div class="flex h-screen w-full flex-col text-zinc-100">
      <Header />
      <main class="flex-1 overflow-y-auto">
        <div class="mx-auto w-full max-w-3xl">
          {tab === "dashboard" && <Dashboard />}
          {tab === "generate" && <Generate />}
          {tab === "accounts" && <Accounts />}
          {tab === "settings" && <Settings />}
        </div>
      </main>
      <TabNav />
    </div>
  )
}
