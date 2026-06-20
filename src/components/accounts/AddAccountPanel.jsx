import { useState } from "preact/hooks"
import { Plus, Upload, Check, FileText } from "lucide-preact"
import { addAccount, addAccounts, parseAccountsImport } from "../../lib/accounts.js"
import { Field, Segmented, ChipMulti } from "../forms.jsx"

const GROUPS = ["Image", "Video", "Grok", "ULTRA"]
const TIER_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "ultra", label: "ULTRA" },
]

export function AddAccountPanel({ onDone }) {
  const [mode, setMode] = useState("single")

  const [label, setLabel] = useState("")
  const [email, setEmail] = useState("")
  const [tier, setTier] = useState("standard")
  const [groups, setGroups] = useState([])
  const [limit, setLimit] = useState("")
  const [saved, setSaved] = useState(false)

  const [text, setText] = useState("")
  const [bulkTier, setBulkTier] = useState("standard")
  const [bulkGroups, setBulkGroups] = useState([])
  const [imported, setImported] = useState(0)

  const preview = mode === "bulk" ? parseAccountsImport(text) : { rows: [], errors: [] }

  const addSingle = async () => {
    if (!label.trim() && !email.trim()) return
    await addAccount({
      label: label.trim() || email.trim(),
      email: email.trim(),
      tier,
      groups,
      quota: { dailyLimit: parseInt(limit, 10) || 0 },
    })
    setLabel("")
    setEmail("")
    setGroups([])
    setLimit("")
    setSaved(true)
    setTimeout(() => setSaved(false), 1400)
    onDone?.()
  }

  const addBulk = async () => {
    const rows = preview.rows.map((r) => ({
      ...r,
      tier: r.tier === "ultra" ? "ultra" : bulkTier,
      groups: r.groups.length ? r.groups : bulkGroups,
    }))
    if (rows.length === 0) return
    await addAccounts(rows)
    setImported(rows.length)
    setText("")
    setTimeout(() => {
      setImported(0)
      onDone?.()
    }, 1200)
  }

  return (
    <div class="space-y-4">
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: "single", label: "Single" },
          { value: "bulk", label: "Bulk import" },
        ]}
      />

      {mode === "single" ? (
        <section class="fav-card space-y-3">
          <Field label="Label">
            <input
              value={label}
              onInput={(e) => setLabel(e.currentTarget.value)}
              class="fav-input"
              placeholder="e.g. Studio account 1"
            />
          </Field>
          <Field label="Email" hint="optional">
            <input
              value={email}
              onInput={(e) => setEmail(e.currentTarget.value)}
              class="fav-input"
              placeholder="name@gmail.com"
            />
          </Field>
          <Field label="Tier">
            <Segmented value={tier} onChange={setTier} options={TIER_OPTIONS} />
          </Field>
          <Field label="Groups / tags" hint="routing targets">
            <ChipMulti value={groups} onChange={setGroups} options={GROUPS} />
          </Field>
          <Field label="Daily limit" hint="0 = unknown / unlimited">
            <input
              type="number"
              min="0"
              value={limit}
              onInput={(e) => setLimit(e.currentTarget.value)}
              class="fav-input"
              placeholder="0"
            />
          </Field>
          <button onClick={addSingle} class="fav-btn-primary w-full">
            {saved ? (
              <>
                <Check size={15} /> Added
              </>
            ) : (
              <>
                <Plus size={15} /> Add account
              </>
            )}
          </button>
        </section>
      ) : (
        <section class="fav-card space-y-3">
          <div class="flex items-start gap-2 rounded-lg bg-surface-1/70 p-2.5">
            <FileText size={13} class="mt-0.5 shrink-0 text-zinc-500" />
            <p class="text-[11px] leading-relaxed text-zinc-500">
              Paste CSV or one account per line. Columns:{" "}
              <span class="text-zinc-300">label, email, tier, groups (| separated), dailyLimit</span>. A
              single email per line works too.
            </p>
          </div>
          <textarea
            value={text}
            onInput={(e) => setText(e.currentTarget.value)}
            rows={6}
            class="fav-input font-mono text-xs"
            placeholder={"Studio 1,a@gmail.com,ultra,Image|Video,200\nStudio 2,b@gmail.com,standard,Grok,100"}
          />
          <Field label="Default tier" hint="applied when a row omits it">
            <Segmented value={bulkTier} onChange={setBulkTier} options={TIER_OPTIONS} />
          </Field>
          <Field label="Default groups" hint="applied when a row omits them">
            <ChipMulti value={bulkGroups} onChange={setBulkGroups} options={GROUPS} />
          </Field>
          <div class="text-[11px] text-zinc-500">
            {preview.rows.length} ready{preview.errors.length ? ` \u00b7 ${preview.errors.length} skipped` : ""}
          </div>
          <button
            onClick={addBulk}
            disabled={preview.rows.length === 0}
            class="fav-btn-primary w-full disabled:opacity-40"
          >
            {imported > 0 ? (
              <>
                <Check size={15} /> Imported {imported}
              </>
            ) : (
              <>
                <Upload size={15} /> Import {preview.rows.length || ""} accounts
              </>
            )}
          </button>
        </section>
      )}
    </div>
  )
}
