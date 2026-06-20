import { useState } from "preact/hooks"
import { VIDEO } from "../../lib/models.js"
import { Field, Textarea, Select, ChipMulti, ChipSingle } from "../forms.jsx"
import { RefDropzone } from "../RefDropzone.jsx"
import { Clapperboard } from "lucide-preact"

export function VideoForm({ onSubmit }) {
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState(VIDEO.models[0].value)
  const [aspect, setAspect] = useState("16:9")
  const [mode, setMode] = useState("text_to_video")
  const [refs, setRefs] = useState([])
  const [resolution, setResolution] = useState(["720p"])
  const [length, setLength] = useState(8)
  const [voice, setVoice] = useState("")

  const modeCfg = VIDEO.modes.find((m) => m.value === mode) || VIDEO.modes[0]
  const needsRefs = modeCfg.refs > 0
  const enoughRefs = !needsRefs || refs.length >= 1
  const valid = prompt.trim().length > 0 && enoughRefs && resolution.length > 0

  const submit = () => {
    const body = {
      prompt: prompt.trim(),
      model,
      aspect_ratio: aspect,
      mode,
      resolution,
      video_length: length,
    }
    if (refs.length) body.reference_images = refs.map((r) => ({ data: r.data, name: r.name }))
    if (mode === "components" && voice.trim()) body.voice = voice.trim().toLowerCase()
    onSubmit("video", body)
  }

  return (
    <div class="space-y-3">
      <Field label="Prompt">
        <Textarea
          rows={3}
          value={prompt}
          onInput={(e) => setPrompt(e.currentTarget.value)}
          placeholder="Describe the motion / scene. Use @name to bind a reference."
        />
      </Field>
      <div class="grid grid-cols-2 gap-3">
        <Field label="Model">
          <Select value={model} onChange={setModel} options={VIDEO.models} />
        </Field>
        <Field label="Aspect ratio">
          <Select value={aspect} onChange={setAspect} options={VIDEO.aspects} />
        </Field>
      </div>
      <Field label="Mode">
        <Select value={mode} onChange={setMode} options={VIDEO.modes} />
      </Field>
      {modeCfg.refs > 0 && (
        <Field label="Reference images" hint={modeCfg.refs === 2 ? "start + end frame" : `up to ${modeCfg.refs}`}>
          <RefDropzone value={refs} onChange={setRefs} max={modeCfg.refs} />
        </Field>
      )}
      {mode === "components" && (
        <Field label="Voice" hint="optional \u00b7 components only">
          <input
            value={voice}
            onInput={(e) => setVoice(e.currentTarget.value)}
            placeholder="e.g. aoede"
            class="fav-input w-full"
          />
        </Field>
      )}
      <div class="grid grid-cols-2 gap-3">
        <Field label="Resolution" hint="4K needs ULTRA">
          <ChipMulti value={resolution} onChange={setResolution} options={VIDEO.resolutions} />
        </Field>
        <Field label="Length (s)" hint="4 & 6 need ULTRA">
          <ChipSingle value={length} onChange={setLength} options={VIDEO.lengths} />
        </Field>
      </div>
      {!enoughRefs && (
        <p class="text-[11px] text-amber-400">This mode needs at least one reference image.</p>
      )}
      <button class="fav-btn-primary w-full" disabled={!valid} onClick={submit}>
        <Clapperboard size={15} /> Generate video
      </button>
    </div>
  )
}
