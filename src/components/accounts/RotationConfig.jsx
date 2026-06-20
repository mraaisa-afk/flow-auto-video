import { useStore } from "@nanostores/preact"
import { ArrowUp, ArrowDown } from "lucide-preact"
import { $accounts, $rotation, setRotation, setRouting, updateAccount } from "../../lib/accounts.js"
import { Segmented, Select, Field } from "../forms.jsx"

const ROUTE_OPTIONS = [
  { value: "any", label: "Any account" },
  { value: "Image", label: "Image group" },
  { value: "Video", label: "Video group" },
  { value: "Grok", label: "Grok group" },
  { value: "ULTRA", label: "ULTRA group" },
]

export function RotationConfig() {
  const accounts = useStore($accounts)
  const rot = useStore($rotation)
  const enabled = accounts.filter((a) => a.enabled).sort((a, b) => a.priority - b.priority)

  const move = async (id, dir) => {
    const ordered = enabled.slice()
    const i = ordered.findIndex((a) => a.id === id)
    const j = i + dir
    if (j < 0 || j >= ordered.length) return
    const tmp = ordered[i]
    ordered[i] = ordered[j]
    ordered[j] = tmp
    for (let k = 0; k < ordered.length; k++) {
      if (ordered[k].priority !== k * 10) await updateAccount(ordered[k].id, { priority: k * 10 })
    }
  }

  return (
    <div class="space-y-4">
      <section class="fav-card space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="fav-eyebrow">Auto-rotation</div>
            <h2 class="text-sm font-semibold text-white">Rotation engine</h2>
          </div>
          <button
            role="switch"
            aria-checked={rot.enabled}
            onClick={() => setRotation({ enabled: !rot.enabled })}
            aria-label="Toggle auto-rotation"
            class={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${rot.enabled ? "bg-brand" : "bg-surface-3"}`}
          >
            <span
              class={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${rot.enabled ? "left-[18px]" : "left-0.5"}`}
            />
          </button>
        </div>
        <p class="text-[11px] leading-relaxed text-zinc-500">
          On a quota error (429) the next eligible account is chosen automatically. Execution-on-error
          ships with auto-retry in Phase 4 — this configures how the pick is made.
        </p>

        <Field label="Strategy">
          <Segmented
            value={rot.strategy}
            onChange={(v) => setRotation({ strategy: v })}
            options={[
              { value: "priority", label: "Priority" },
              { value: "round_robin", label: "Round-robin" },
              { value: "least_used", label: "Least used" },
            ]}
          />
        </Field>

        <Field label="Tier filter" hint="restrict the pool">
          <Segmented
            value={rot.tierFilter}
            onChange={(v) => setRotation({ tierFilter: v })}
            options={[
              { value: "any", label: "Any" },
              { value: "standard", label: "Standard" },
              { value: "ultra", label: "ULTRA only" },
            ]}
          />
        </Field>
      </section>

      <section class="fav-card space-y-3">
        <div class="fav-eyebrow">Per-endpoint routing</div>
        <Field label="Image generation">
          <Select value={rot.routing.image} onChange={(v) => setRouting("image", v)} options={ROUTE_OPTIONS} />
        </Field>
        <Field label="Video generation">
          <Select value={rot.routing.video} onChange={(v) => setRouting("video", v)} options={ROUTE_OPTIONS} />
        </Field>
        <Field label="Grok generation">
          <Select value={rot.routing.grok} onChange={(v) => setRouting("grok", v)} options={ROUTE_OPTIONS} />
        </Field>
      </section>

      {rot.strategy === "priority" && (
        <section class="fav-card space-y-2">
          <div class="fav-eyebrow">Priority order</div>
          {enabled.length === 0 ? (
            <p class="text-[11px] text-zinc-500">Enable accounts to set their order.</p>
          ) : (
            <div class="space-y-1.5">
              {enabled.map((a, idx) => (
                <div key={a.id} class="flex items-center gap-2 rounded-lg bg-surface-1/70 px-2.5 py-1.5">
                  <span class="grid h-5 w-5 place-items-center rounded-md bg-surface-3 text-[10px] font-semibold text-zinc-400">
                    {idx + 1}
                  </span>
                  <span class="min-w-0 flex-1 truncate text-xs text-zinc-200">{a.label}</span>
                  {a.tier === "ultra" && <span class="text-[10px] font-semibold text-brand-300">ULTRA</span>}
                  <button
                    onClick={() => move(a.id, -1)}
                    disabled={idx === 0}
                    class="fav-btn-icon h-6 w-6 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={() => move(a.id, 1)}
                    disabled={idx === enabled.length - 1}
                    class="fav-btn-icon h-6 w-6 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
