import { useState } from "preact/hooks"
import { IMAGE } from "../../lib/models.js"
import { Field, Textarea, Select, ChipMulti } from "../forms.jsx"
import { RefDropzone } from "../RefDropzone.jsx"
import { Sparkles } from "lucide-preact"

export function ImageForm({ onSubmit, prompt, setPrompt }) {
  const [model, setModel] = useState(IMAGE.models[0].value)
  const [aspect, setAspect] = useState("1:1")
  const [refs, setRefs] = useState([])
  const [upscale, setUpscale] = useState([])

  const valid = prompt.trim().length > 0
  const submit = () => {
    const body = { prompt: prompt.trim(), model, aspect_ratio: aspect }
    if (refs.length) body.reference_images = refs.map((r) => ({ data: r.data, name: r.name }))
    if (upscale.length) body.upscale = upscale
    onSubmit("image", body)
  }

  return (
    <div class="space-y-3">
      <Field label="Prompt">
        <Textarea
          rows={3}
          value={prompt}
          onInput={(e) => setPrompt(e.currentTarget.value)}
          placeholder="Describe the image. Use @name to bind a reference."
        />
      </Field>
      <div class="grid grid-cols-2 gap-3">
        <Field label="Model">
          <Select value={model} onChange={setModel} options={IMAGE.models} />
        </Field>
        <Field label="Aspect ratio">
          <Select value={aspect} onChange={setAspect} options={IMAGE.aspects} />
        </Field>
      </div>
      <Field label="Reference images" hint="up to 10">
        <RefDropzone value={refs} onChange={setRefs} max={IMAGE.maxRefs} />
      </Field>
      <Field label="Upscale" hint="4K needs ULTRA">
        <ChipMulti value={upscale} onChange={setUpscale} options={IMAGE.upscale} />
      </Field>
      <button class="fav-btn-primary w-full" disabled={!valid} onClick={submit}>
        <Sparkles size={15} /> Generate image
      </button>
    </div>
  )
}
