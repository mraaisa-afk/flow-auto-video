import { useEffect, useState } from "preact/hooks"
import { useStore } from "@nanostores/preact"
import { Users, Plus } from "lucide-preact"
import { $accounts, loadAccounts, refreshQuotaResets } from "../lib/accounts.js"
import { AccountCard } from "../components/accounts/AccountCard.jsx"
import { QuotaDashboard } from "../components/accounts/QuotaDashboard.jsx"
import { RotationConfig } from "../components/accounts/RotationConfig.jsx"
import { AddAccountPanel } from "../components/accounts/AddAccountPanel.jsx"
import { Segmented } from "../components/forms.jsx"

function EmptyState({ onAdd }) {
  return (
    <div class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-surface-border bg-surface-2/40 p-8 text-center">
      <span class="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-400/20 to-brand-700/20 text-brand-300">
        <Users size={22} />
      </span>
      <div>
        <h2 class="text-sm font-semibold text-white">No accounts yet</h2>
        <p class="mx-auto mt-1 max-w-[16rem] text-xs text-zinc-500">
          Add the accounts your desktop app manages to unlock health scoring, quota tracking and
          auto-rotation.
        </p>
      </div>
      <button onClick={onAdd} class="fav-btn-primary">
        <Plus size={15} /> Add your first account
      </button>
    </div>
  )
}

export function Accounts() {
  const accounts = useStore($accounts)
  const [section, setSection] = useState("accounts")

  useEffect(() => {
    loadAccounts().then(refreshQuotaResets)
  }, [])

  return (
    <div class="animate-fade-in space-y-4 p-4">
      <QuotaDashboard />
      <Segmented
        value={section}
        onChange={setSection}
        options={[
          { value: "accounts", label: `Accounts${accounts.length ? ` (${accounts.length})` : ""}` },
          { value: "rotation", label: "Rotation" },
          { value: "import", label: "Add" },
        ]}
      />
      {section === "accounts" &&
        (accounts.length === 0 ? (
          <EmptyState onAdd={() => setSection("import")} />
        ) : (
          <div class="grid gap-3 sm:grid-cols-2">
            {accounts.map((a) => (
              <AccountCard key={a.id} account={a} />
            ))}
          </div>
        ))}
      {section === "rotation" && <RotationConfig />}
      {section === "import" && <AddAccountPanel onDone={() => setSection("accounts")} />}
    </div>
  )
}
