// Flow Auto Video — shared presentational primitives.
import { Clapperboard } from "lucide-preact"

export function Logo({ size = "md" }) {
  const dim = size === "sm" ? "h-7 w-7" : "h-8 w-8"
  const icon = size === "sm" ? 15 : 17
  return (
    <span
      class={`grid ${dim} place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-[0_4px_14px_-4px_rgba(99,102,241,0.7)]`}
    >
      <Clapperboard size={icon} />
    </span>
  )
}

const HEALTH = {
  connected: { dot: "bg-emerald-400", ring: "bg-emerald-400/20", text: "text-emerald-400", label: "Connected" },
  partial: { dot: "bg-amber-400", ring: "bg-amber-400/20", text: "text-amber-400", label: "Degraded" },
  disconnected: { dot: "bg-rose-500", ring: "bg-rose-500/20", text: "text-rose-400", label: "Disconnected" },
  unknown: { dot: "bg-zinc-500", ring: "bg-zinc-500/20", text: "text-zinc-400", label: "Unknown" },
}

export function healthMeta(state) {
  return HEALTH[state] || HEALTH.unknown
}

export function HealthDot({ state, pulse = false }) {
  const m = healthMeta(state)
  return (
    <span class="relative grid h-4 w-4 place-items-center">
      <span class={`absolute inline-flex h-4 w-4 rounded-full ${m.ring} ${pulse ? "animate-pulse-dot" : ""}`} />
      <span class={`relative inline-flex h-2 w-2 rounded-full ${m.dot}`} />
    </span>
  )
}

export function StatusPill({ state }) {
  const m = healthMeta(state)
  return (
    <span
      class={`inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-3/60 px-2.5 py-1 text-xs font-medium ${m.text}`}
    >
      <span class={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

export function Avatar({ src, name, size = 28 }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase()
  if (src) {
    return (
      <img
        src={src}
        alt={name || ""}
        style={`height:${size}px;width:${size}px`}
        class="rounded-full object-cover ring-2 ring-surface-border"
      />
    )
  }
  return (
    <span
      style={`height:${size}px;width:${size}px`}
      class="grid place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white ring-2 ring-surface-border"
    >
      {initial}
    </span>
  )
}
