import { useStore } from "@nanostores/preact"
import { $toasts, dismissToast } from "../lib/toast.js"
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-preact"

const META = {
  success: { Icon: CheckCircle2, cls: "text-emerald-400" },
  error: { Icon: AlertTriangle, cls: "text-rose-400" },
  info: { Icon: Info, cls: "text-brand-300" },
}

export function ToastHost() {
  const toasts = useStore($toasts)
  if (toasts.length === 0) return null
  return (
    <div
      class="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const m = META[t.type] || META.info
        const Icon = m.Icon
        return (
          <div
            key={t.id}
            class="fav-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border border-surface-border bg-surface-2/95 px-3.5 py-2.5 shadow-card backdrop-blur-md"
          >
            <Icon size={16} class={`mt-0.5 shrink-0 ${m.cls}`} />
            <p class="flex-1 text-xs leading-snug text-zinc-200">{t.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              class="text-zinc-600 hover:text-zinc-300"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
