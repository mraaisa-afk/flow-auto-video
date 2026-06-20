import { useStore } from "@nanostores/preact"
import { $activeTab } from "../lib/stores.js"
import {
  LayoutDashboard,
  Sparkles,
  Users,
  Activity,
  Terminal,
  Settings as SettingsIcon,
} from "lucide-preact"

const TABS = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "generate", label: "Generate", Icon: Sparkles },
  { id: "accounts", label: "Accounts", Icon: Users },
  { id: "activity", label: "Activity", Icon: Activity },
  { id: "developer", label: "Dev", Icon: Terminal },
  { id: "settings", label: "Settings", Icon: SettingsIcon },
]

export function TabNav() {
  const active = useStore($activeTab)
  return (
    <nav
      class="flex items-stretch gap-1 border-t border-surface-border bg-surface-1/90 px-2 py-1.5 backdrop-blur-md"
      role="tablist"
      aria-label="Primary"
    >
      {TABS.map(({ id, label, Icon }) => {
        const on = active === id
        return (
          <button
            key={id}
            role="tab"
            aria-selected={on ? "true" : "false"}
            aria-current={on ? "page" : undefined}
            onClick={() => $activeTab.set(id)}
            class={`group flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium transition-colors ${
              on ? "text-brand-300" : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            <span
              class={`grid h-7 w-7 place-items-center rounded-lg transition-colors ${
                on ? "bg-brand-500/15" : "group-hover:bg-surface-3/60"
              }`}
            >
              <Icon size={17} />
            </span>
            {label}
          </button>
        )
      })}
    </nav>
  )
}
