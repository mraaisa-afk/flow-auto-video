import { useRef, useState, useEffect } from "preact/hooks"
import { fileToDataUrl } from "../lib/files.js"
import { ImagePlus, X } from "lucide-preact"

// value: [{ data, name }]
export function RefDropzone({ value = [], onChange, max = 10, allowNames = true }) {
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)

  const addFiles = async (fileList) => {
    const room = max - value.length
    if (room <= 0) return
    const picked = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, room)
    if (!picked.length) return
    setBusy(true)
    try {
      const items = await Promise.all(
        picked.map(async (f) => ({ data: await fileToDataUrl(f), name: f.name || "pasted.png" }))
      )
      onChange([...value, ...items])
    } finally {
      setBusy(false)
    }
  }

  // Clipboard paste: capture image data anywhere while this dropzone is mounted.
  useEffect(() => {
    const onPaste = (e) => {
      const files = []
      for (const item of e.clipboardData?.items || []) {
        if (item.type && item.type.startsWith("image/")) {
          const f = item.getAsFile()
          if (f) files.push(f)
        }
      }
      if (files.length) {
        e.preventDefault()
        addFiles(files)
      }
    }
    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [value])

  const onDrop = (e) => {
    e.preventDefault()
    setDrag(false)
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files)
  }

  const removeAt = (i) => onChange(value.filter((_, idx) => idx !== i))
  const renameAt = (i, name) => onChange(value.map((it, idx) => (idx === i ? { ...it, name } : it)))

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        class={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-3 py-4 text-center transition-colors ${
          drag ? "border-brand-400 bg-brand-500/10" : "border-surface-border bg-surface-1 hover:border-zinc-600"
        }`}
      >
        <ImagePlus size={18} class="text-zinc-500" />
        <span class="text-xs text-zinc-400">
          {busy ? "Reading\u2026" : value.length >= max ? `Max ${max} images` : "Drop, paste, or click to add references"}
        </span>
        <span class="text-[10px] text-zinc-600">
          {value.length}/{max}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        onChange={(e) => {
          addFiles(e.currentTarget.files)
          e.currentTarget.value = ""
        }}
      />
      {value.length > 0 && (
        <div class="mt-2 space-y-2">
          {value.map((it, i) => (
            <div key={i} class="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-1 p-2">
              <img src={it.data} alt="" class="h-10 w-10 rounded-md object-cover" />
              {allowNames ? (
                <div class="min-w-0 flex-1">
                  <input
                    value={it.name || ""}
                    onInput={(e) => renameAt(i, e.currentTarget.value)}
                    placeholder="name (for @tag)"
                    class="w-full rounded-md border border-surface-border bg-surface-2 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-brand-400"
                  />
                  <span class="mt-0.5 block text-[10px] text-zinc-600">
                    Use @{(it.name || "").replace(/\.[^.]+$/, "") || "name"} in the prompt
                  </span>
                </div>
              ) : (
                <span class="min-w-0 flex-1 truncate text-xs text-zinc-400">{it.name}</span>
              )}
              <button type="button" onClick={() => removeAt(i)} class="fav-btn-icon h-7 w-7 shrink-0" title="Remove">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
