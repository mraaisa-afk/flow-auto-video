import { useStore } from "@nanostores/preact"
import { $health, $auth } from "../lib/stores.js"
import { Logo, HealthDot, Avatar } from "./ui.jsx"

export function Header() {
  const health = useStore($health)
  const auth = useStore($auth)
  return (
    <header class="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-surface-border bg-surface-1/80 px-4 py-3 backdrop-blur-md">
      <div class="flex items-center gap-2.5">
        <Logo />
        <div class="leading-tight">
          <div class="text-sm font-semibold text-white">Flow Auto Video</div>
          <div class="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            AI image &amp; video studio
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2.5">
        <HealthDot state={health.state} pulse={health.state === "unknown"} />
        {auth.status === "signed_in" ? (
          <Avatar src={auth.user?.picture} name={auth.user?.name} size={26} />
        ) : null}
      </div>
    </header>
  )
}
