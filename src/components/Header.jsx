import { useStore } from "@nanostores/preact"
import { $health, $auth } from "../lib/stores.js"

const DOT = {
  connected: "bg-green-500",
  partial: "bg-yellow-500",
  disconnected: "bg-red-500",
  unknown: "bg-zinc-500",
}

export function Header() {
  const health = useStore($health)
  const auth = useStore($auth)
  return (
    <header class="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
      <span class="text-base font-semibold">\ud83c\udfac Flow Auto Video</span>
      <div class="flex items-center gap-2">
        <span
          class={`inline-block h-2 w-2 rounded-full ${DOT[health.state] || DOT.unknown}`}
          title={`Backend: ${health.state}`}
        />
        {auth.status === "signed_in" && auth.user?.picture ? (
          <img src={auth.user.picture} alt="" class="h-6 w-6 rounded-full" />
        ) : null}
      </div>
    </header>
  )
}
