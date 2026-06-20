import { Users } from "lucide-preact"

export function Accounts() {
  return (
    <div class="animate-fade-in flex flex-col items-center justify-center gap-3 p-8 text-center">
      <span class="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400/20 to-brand-700/20 text-brand-300">
        <Users size={24} />
      </span>
      <div>
        <h2 class="text-sm font-semibold text-white">Account Intelligence</h2>
        <p class="mx-auto mt-1 max-w-[15rem] text-xs text-zinc-500">
          Account cards, health scoring &amp; auto-rotation arrive in Phase 3.
        </p>
      </div>
      <span class="rounded-full border border-surface-border bg-surface-3/60 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
        Coming in Phase 3
      </span>
    </div>
  )
}
