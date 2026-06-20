import { useStore } from "@nanostores/preact"
import { Gauge, Clock, Users } from "lucide-preact"
import { $accounts, scoreAccount } from "../../lib/accounts.js"

function fmtReset(ts) {
  const ms = ts - Date.now()
  if (ms <= 0) return "now"
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function QuotaDashboard() {
  const accounts = useStore($accounts)
  const enabled = accounts.filter((a) => a.enabled)
  const tracked = accounts.filter((a) => a.quota.dailyLimit > 0)
  const totalLimit = tracked.reduce((s, a) => s + a.quota.dailyLimit, 0)
  const totalUsed = tracked.reduce((s, a) => s + Math.min(a.quota.usedToday, a.quota.dailyLimit), 0)
  const remaining = Math.max(0, totalLimit - totalUsed)
  const pctUsed = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0
  const soonest = accounts.length
    ? accounts.reduce((min, a) => Math.min(min, a.quota.resetAt), Infinity)
    : null
  const healthy = enabled.filter((a) => scoreAccount(a).band === "green").length

  return (
    <section class="fav-card space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-surface-3/70 text-brand-300">
            <Gauge size={17} />
          </span>
          <div>
            <div class="fav-eyebrow">Capacity</div>
            <div class="text-sm font-semibold text-white">Quota dashboard</div>
          </div>
        </div>
        <span class="inline-flex items-center gap-1 text-[11px] text-zinc-500">
          <Users size={12} /> {enabled.length}/{accounts.length} on
        </span>
      </div>

      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="rounded-lg bg-surface-1/70 py-2">
          <div class="text-base font-semibold text-white">{totalLimit > 0 ? remaining : "\u221e"}</div>
          <div class="text-[10px] text-zinc-500">remaining</div>
        </div>
        <div class="rounded-lg bg-surface-1/70 py-2">
          <div class="text-base font-semibold text-white">{totalUsed}</div>
          <div class="text-[10px] text-zinc-500">used today</div>
        </div>
        <div class="rounded-lg bg-surface-1/70 py-2">
          <div class="text-base font-semibold text-emerald-400">{healthy}</div>
          <div class="text-[10px] text-zinc-500">healthy</div>
        </div>
      </div>

      {totalLimit > 0 && (
        <div>
          <div class="mb-1 text-[11px] text-zinc-500">{pctUsed}% of daily capacity used</div>
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-1">
            <span
              class={`block h-full rounded-full ${pctUsed >= 85 ? "bg-rose-500" : pctUsed >= 60 ? "bg-amber-400" : "bg-emerald-400"}`}
              style={`width:${pctUsed}%`}
            />
          </div>
        </div>
      )}

      {soonest && soonest !== Infinity && (
        <div class="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <Clock size={11} /> Next quota reset in {fmtReset(soonest)}
        </div>
      )}
    </section>
  )
}
