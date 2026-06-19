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
import { PanelRightOpen } from "lucide-preact"

function hydrateHealth() {
  chrome.storage.local.get(STORAGE_KEYS.healthState).then((r) => {
    const h = r[STORAGE_KEYS.healthState]
    if (h) $health.set({ state: h.state, lastChecked: h.lastChecked, detail: h.detail })
  })
}

export function App() {
  const tab = useStore($activeTab)

  useEffect(() => {
    restoreSession()
    hydrateHealth()
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

  const openSidePanel = async () => {
    try {
      const win = await chrome.windows.getCurrent()
      await chrome.sidePanel.open({ windowId: win.id })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div class="flex h-full min-h-[480px] flex-col">
      <Header />
      <div class="flex items-center justify-end px-4 py-1">
        <button
          onClick={openSidePanel}
          class="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300"
        >
          <PanelRightOpen size={13} /> Open workspace
        </button>
      </div>
      <main class="flex-1 overflow-y-auto">
        {tab === "dashboard" && <Dashboard />}
        {tab === "generate" && <Generate />}
        {tab === "accounts" && <Accounts />}
        {tab === "settings" && <Settings />}
      </main>
      <TabNav />
    </div>
  )
}
