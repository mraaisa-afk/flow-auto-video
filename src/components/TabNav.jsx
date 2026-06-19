import { useStore } from "@nanostores/preact"
import { $activeTab } from "../lib/stores.js"
import { LayoutDashboard, Sparkles, Users, Settings as SettingsIcon } from "lucide-preact"

const TABS = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "generate", label: "Generate", Icon: Sparkles },
  { id: "accounts", label: "Accounts", Icon: Users },
  { id: "settings", label: "Settings", Icon: SettingsIcon },
]

export function TabNav() {
  const active = useStore($activeTab)
  return (
    <nav class="flex border-t border-zinc-800 bg-zinc-900/80 backdrop-blur">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => $activeTab.set(id)}
          class={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors ${
            active === id ? "text-brand-soft" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Icon size={18} />
          {label}
        </button>
      ))}
    </nav>
  )
}
