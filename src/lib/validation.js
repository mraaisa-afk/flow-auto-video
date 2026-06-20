// Flow Auto Video — pre-flight validation. Catches problems BEFORE submitting,
// based on the authoritative G-Labs webhook contract (WEBHOOK_INTEGRATION §5).
//
// Returns { errors: [], warnings: [] }. `errors` block submit; `warnings` inform
// the user but allow proceeding (the desktop app/backend is the final arbiter).
import { $accounts } from "./accounts.js"

const IMAGE_ASPECTS = ["1:1", "3:4", "4:3", "9:16", "16:9"]
const VIDEO_ASPECTS = ["16:9", "9:16"]
const GROK_ASPECTS = ["9:16", "16:9", "1:1", "2:3", "3:2"]
const VIDEO_MODE_REFS = { text_to_video: 0, start_image: 1, start_end_image: 2, components: 3 }
const ULTRA_VIDEO_MODELS = ["veo_31_lite_relaxed"]
const GROK_MODES = ["t2i", "i2i", "t2v", "i2v"]

function refCount(body) {
  return Array.isArray(body?.reference_images) ? body.reference_images.length : 0
}
function hasEnabledAccount() {
  return $accounts.get().some((a) => a.enabled)
}
function hasUltraAccount() {
  return $accounts.get().some((a) => a.enabled && a.tier === "ultra")
}

export function validate(kind, body) {
  const errors = []
  const warnings = []
  const refs = refCount(body)

  if (!body || !body.prompt || !body.prompt.trim()) {
    errors.push("Prompt is required.")
  }

  if (!hasEnabledAccount()) {
    warnings.push(
      "No enabled accounts here. Generation runs on the desktop app's logged-in accounts — add them in the Accounts tab for quota tracking & rotation."
    )
  }

  if (kind === "image") {
    if (body.aspect_ratio && !IMAGE_ASPECTS.includes(body.aspect_ratio))
      warnings.push(`Aspect ${body.aspect_ratio} isn't supported for images — backend falls back to 1:1.`)
    if (refs > 10) errors.push("Image accepts up to 10 reference images.")
    const up = Array.isArray(body.upscale) ? body.upscale : []
    if (up.includes("4K") && !hasUltraAccount())
      warnings.push("4K upscale requires an ULTRA account, or the task will fail.")
  } else if (kind === "video") {
    if (body.aspect_ratio && !VIDEO_ASPECTS.includes(body.aspect_ratio))
      warnings.push(`Aspect ${body.aspect_ratio} isn't supported for video — only 16:9 and 9:16.`)
    const mode = body.mode || "text_to_video"
    if (mode !== "text_to_video" && refs < 1)
      errors.push(`Mode \"${mode}\" needs at least one reference image.`)
    if (mode === "start_end_image" && refs < 2)
      warnings.push("Start + end mode uses 2 references: [0] start, [1] end.")
    if (refs > 3) warnings.push("Video uses up to 3 reference images; extras are ignored.")
    const res = Array.isArray(body.resolution) ? body.resolution : []
    if (res.includes("4K") && !hasUltraAccount())
      warnings.push("4K video requires an ULTRA account (1080p works without ULTRA).")
    if (ULTRA_VIDEO_MODELS.includes(body.model) && !hasUltraAccount())
      warnings.push("Veo 3.1 Lite Relaxed requires an ULTRA account.")
    if ([4, 6].includes(Number(body.video_length)) && !hasUltraAccount())
      warnings.push(`${body.video_length}s clips require an ULTRA account (8s works without).`)
    if (body.voice && mode !== "components")
      warnings.push("Voice is only used in Ingredients (components) mode.")
  } else if (kind === "grok") {
    const mode = body.mode || "t2v"
    if (!GROK_MODES.includes(mode)) errors.push(`Invalid Grok mode \"${mode}\".`)
    if ((mode === "i2i" || mode === "i2v") && refs < 1)
      errors.push(`Grok ${mode} needs at least one reference image.`)
    if (body.aspect_ratio && !GROK_ASPECTS.includes(body.aspect_ratio))
      warnings.push(`Aspect ${body.aspect_ratio} isn't supported for Grok — falls back to 9:16.`)
    if (refs > 5) warnings.push("Grok uses up to 5 reference images; extras are ignored.")
  }

  return { errors, warnings }
}
