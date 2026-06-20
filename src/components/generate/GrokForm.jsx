import { useState } from "preact/hooks"
import { GROK } from "../../lib/models.js"
import { Field, Textarea, Select, ChipSingle } from "../forms.jsx"
import { RefDropzone } from "../RefDropzone.jsx"
import { Bot } from "lucide-preact"

export function GrokForm({ onSubmit, prompt, setPrompt }) {
  const [mode, setMode] = useState("t2i")
  const [aspect, setAspect] = useState("9:16")
  const [refs, setRefs] = useState([])
  const [resolution, setResolution] = useState("480p")
  const [length, setLength] = useState(6)

  const modeCfg = GROK.modes.find((m) => m.value === mode) || GROK.modes[0]
  const isVideo = modeCfg.video
  const needsRefs = modeCfg.needsRef
  const enoughRefs = !needsRefs || refs.length >= 1
  const valid = prompt.trim().length > 0 && enoughRefs

  const submit = () => {
    const body = { prompt: prompt.trim(), mode, aspect_ratio: aspect }
    if (refs.length) body.reference_images = refs.map((r) => r.data)
    if (isVideo) {
      body.resolution = resolution
      body.video_length = length
    }
    onSubmit("grok", body)
  }

  return (
    <div class="space-y-3">
      <Field label="Prompt">
        <Textarea
          rows={3}
          value={prompt}
          onInput={(e) => setPrompt(e.currentTarget.value)}
          placeholder="Grok prompt. (Grok does not support @tag binding.)"
        />
      </Field>
      <div class="grid grid-cols-2 gap-3">
        <Field label="Mode">
          <Select value={mode} onChange={setMode} options={GROK.modes} />
        </Field>
        <Field label="Aspect ratio">
          <Select value={aspect} onChange={setAspect} options={GROK.aspects} />
        </Field>
      </div>
      {needsRefs && (
        <Field label="Reference images" hint="required \u00b7 up to 5">
          <RefDropzone value={refs} onChange={setRefs} max={GROK.maxRefs} allowNames={false} />
        </Field>
      )}
      {isVideo && (
        <div class="grid grid-cols-2 gap-3">
          <Field label="Resolution">
            <ChipSingle value={resolution} onChange={setResolution} options={GROK.resolutions} />
          </Field>
          <Field label="Length (s)">
            <ChipSingle value={length} onChange={setLength} options={GROK.lengths} />
          </Field>
        </div>
      )}
      {!enoughRefs && (
        <p class="text-[11px] text-amber-400">{modeCfg.label} needs at least one reference image.</p>
      )}
      <button class="fav-btn-primary w-full" disabled={!valid} onClick={submit}>
        <Bot size={15} /> Generate with Grok
      </button>
    </div>
  )
}
