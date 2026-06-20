import { useEffect, useState } from "preact/hooks"
import { getHistory, removeHistory, clearHistory, searchHistory } from "../../lib/history.js"
import { getTemplates, saveTemplate, removeTemplate, fillTemplate } from "../../lib/templates.js"
import { STORAGE_KEYS } from "../../lib/constants.js"
import { History, BookMarked, Search, Trash2, Plus, CornerDownLeft, ChevronDown } from "lucide-preact"

const KIND_LABEL = { image: "Image", video: "Video", grok: "Grok" }
const TPL_HINT =
  "No templates yet. Save a prompt with {variable} placeholders, e.g. A {character} in {setting}, {style} style."

function TabBtn({ on, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      class={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
        on ? "bg-brand text-white" : "text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function TemplateRow({ t, onInsert, onRemove }) {
  const [vals, setVals] = useState({})
  return (
    <div class="space-y-2 rounded-lg border border-surface-border bg-surface-1 p-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold text-zinc-200">{t.name}</span>
        <button type="button" onClick={() => onRemove(t.id)} class="text-zinc-600 hover:text-rose-400" title="Remove">
          <Trash2 size={13} />
        </button>
      </div>
      <p class="line-clamp-2 text-[11px] leading-snug text-zinc-500">{t.body}</p>
      {t.variables && t.variables.length > 0 && (
        <div class="grid grid-cols-2 gap-1.5">
          {t.variables.map((v) => (
            <input
              key={v}
              value={vals[v] || ""}
              onInput={(e) => setVals((s) => ({ ...s, [v]: e.currentTarget.value }))}
              placeholder={v}
              class="fav-input w-full text-[11px]"
            />
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => onInsert(fillTemplate(t.body, vals))}
        class="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-surface-border bg-surface-1 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:text-white"
      >
        <CornerDownLeft size={12} /> Insert into prompt
      </button>
    </div>
  )
}

export function PromptTools({ kind, prompt, setPrompt }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState("history")
  const [history, setHistory] = useState([])
  const [templates, setTemplates] = useState([])
  const [q, setQ] = useState("")
  const [tplName, setTplName] = useState("")

  useEffect(() => {
    getHistory().then(setHistory)
    getTemplates().then(setTemplates)
    const onChanged = (changes, area) => {
      if (area !== "local") return
      if (changes[STORAGE_KEYS.promptHistory]) getHistory().then(setHistory)
      if (changes[STORAGE_KEYS.templates]) getTemplates().then(setTemplates)
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  const filtered = searchHistory(history, q)

  return (
    <div class="fav-card overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        class="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <span class="flex items-center gap-2 text-xs font-medium text-zinc-300">
          <History size={14} class="text-brand-300" /> Prompt history & templates
        </span>
        <span class="flex items-center gap-2 text-[10px] text-zinc-500">
          {history.length} saved
          <ChevronDown size={14} class={`transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div class="space-y-3 border-t border-surface-border p-3">
          <div class="flex gap-1 rounded-lg border border-surface-border bg-surface-1 p-1">
            <TabBtn on={tab === "history"} onClick={() => setTab("history")} icon={<History size={13} />} label="History" />
            <TabBtn on={tab === "templates"} onClick={() => setTab("templates")} icon={<BookMarked size={13} />} label="Templates" />
          </div>

          {tab === "history" && (
            <div class="space-y-2">
              <div class="relative">
                <Search size={13} class="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  value={q}
                  onInput={(e) => setQ(e.currentTarget.value)}
                  placeholder="Search prompts"
                  class="fav-input w-full pl-8"
                />
              </div>
              {filtered.length === 0 && (
                <p class="px-1 py-3 text-center text-[11px] text-zinc-600">
                  No prompts yet. Generations you run show up here.
                </p>
              )}
              <div class="max-h-56 space-y-1.5 overflow-y-auto">
                {filtered.map((h) => (
                  <div key={h.id} class="group flex items-start gap-2 rounded-lg border border-surface-border bg-surface-1 p-2">
                    <span class="mt-0.5 rounded bg-surface-3/70 px-1 py-0.5 text-[9px] font-semibold uppercase text-brand-300">
                      {KIND_LABEL[h.kind] || h.kind}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPrompt(h.prompt)}
                      class="line-clamp-2 flex-1 text-left text-[11px] leading-snug text-zinc-300 hover:text-white"
                      title="Use this prompt"
                    >
                      {h.prompt}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHistory(h.id).then(setHistory)}
                      class="text-zinc-600 opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearHistory().then(setHistory)}
                  class="text-[11px] text-zinc-500 hover:text-rose-400"
                >
                  Clear history
                </button>
              )}
            </div>
          )}

          {tab === "templates" && (
            <div class="space-y-2">
              <div class="flex gap-2">
                <input
                  value={tplName}
                  onInput={(e) => setTplName(e.currentTarget.value)}
                  placeholder="Save current prompt as\u2026"
                  class="fav-input w-full"
                />
                <button
                  type="button"
                  disabled={!tplName.trim() || !prompt.trim()}
                  onClick={() => {
                    saveTemplate({ name: tplName.trim(), kind, body: prompt }).then(setTemplates)
                    setTplName("")
                  }}
                  class="fav-btn-icon shrink-0"
                  title="Save template"
                >
                  <Plus size={15} />
                </button>
              </div>
              {templates.length === 0 && (
                <p class="px-1 py-3 text-center text-[11px] leading-relaxed text-zinc-600">{TPL_HINT}</p>
              )}
              <div class="max-h-64 space-y-2 overflow-y-auto">
                {templates.map((t) => (
                  <TemplateRow
                    key={t.id}
                    t={t}
                    onInsert={setPrompt}
                    onRemove={(id) => removeTemplate(id).then(setTemplates)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
