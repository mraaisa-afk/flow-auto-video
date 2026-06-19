// Flow Auto Video — shared UI state (Nano Stores)
import { atom, map } from "nanostores"

// Google auth: status = signed_out | signing_in | signed_in | error
export const $auth = map({
  status: "signed_out",
  user: null, // { email, name, picture }
  error: null,
})

// Backend health: state = connected | partial | disconnected | unknown
export const $health = map({
  state: "unknown",
  lastChecked: null,
  detail: null,
})

// Active tab in the shell
export const $activeTab = atom("dashboard")
