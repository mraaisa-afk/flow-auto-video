// Flow Auto Video — form primitives.

export function Field({ label, hint, children }) {
  return (
    <div>
      <div class="mb-1.5 flex items-baseline justify-between">
        <label class="text-xs font-medium text-zinc-400">{label}</label>
        {hint ? <span class="text-[10px] text-zinc-600">{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}

export function Textarea(props) {
  return (
    <textarea
      {...props}
      class={`w-full resize-y rounded-lg border border-surface-border bg-surface-1 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-500/25 ${props.class || ""}`}
    />
  )
}

export function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      class="w-full rounded-lg border border-surface-border bg-surface-1 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-500/25"
    >
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value
        const label = typeof o === "string" ? o : o.label
        return <option value={val}>{label}</option>
      })}
    </select>
  )
}

export function Segmented({ value, onChange, options }) {
  return (
    <div class="flex gap-1 rounded-lg border border-surface-border bg-surface-1 p-1">
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value
        const label = typeof o === "string" ? o : o.label
        const on = value === val
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            class={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              on ? "bg-brand text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function chipCls(on) {
  return `rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
    on
      ? "border-brand-500 bg-brand-500/15 text-brand-200"
      : "border-surface-border bg-surface-1 text-zinc-400 hover:text-zinc-200"
  }`
}

export function ChipSingle({ value, onChange, options }) {
  return (
    <div class="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const val = typeof o === "object" ? o.value : o
        const label = typeof o === "object" ? o.label : String(o)
        return (
          <button key={String(val)} type="button" onClick={() => onChange(val)} class={chipCls(value === val)}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function ChipMulti({ value = [], onChange, options }) {
  const toggle = (val) =>
    value.includes(val) ? onChange(value.filter((v) => v !== val)) : onChange([...value, val])
  return (
    <div class="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const val = typeof o === "object" ? o.value : o
        const label = typeof o === "object" ? o.label : String(o)
        return (
          <button key={String(val)} type="button" onClick={() => toggle(val)} class={chipCls(value.includes(val))}>
            {label}
          </button>
        )
      })}
    </div>
  )
}
