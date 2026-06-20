// Flow Auto Video — generation option catalog.
//
// Source of truth: the G-Labs Automation Webhook API contract
// (WEBHOOK_INTEGRATION.en.md §5). Display names follow Google Flow's real UI
// taxonomy (Veo 3.1: Text to Video / Frames to Video / Ingredients to Video).
// The `value` strings are the exact tokens the backend accepts — do not rename
// those; only the human `label` is cosmetic.

export const IMAGE = {
  models: [
    { value: "nano_banana_2", label: "Nano Banana 2" },
    { value: "nano_banana_pro", label: "Nano Banana Pro" },
  ],
  // Webhook image ratios: 1:1, 3:4, 4:3, 9:16, 16:9
  aspects: ["1:1", "3:4", "4:3", "9:16", "16:9"],
  upscale: ["2K", "4K"], // 4K requires an ULTRA account
  maxRefs: 10,
}

export const VIDEO = {
  models: [
    { value: "veo_31_fast", label: "Veo 3.1 Fast" },
    { value: "veo_31_lite", label: "Veo 3.1 Lite" },
    { value: "veo_31_quality", label: "Veo 3.1 Quality" },
    { value: "veo_31_lite_relaxed", label: "Veo 3.1 Lite Relaxed \u00b7 ULTRA" },
  ],
  // Veo on the webhook only supports landscape / portrait.
  aspects: ["16:9", "9:16"],
  // Flow's real mode taxonomy. `value` = exact webhook token.
  modes: [
    { value: "text_to_video", label: "Text to Video", refs: 0 },
    { value: "start_image", label: "Frames to Video \u00b7 start frame", refs: 1 },
    { value: "start_end_image", label: "Frames to Video \u00b7 start + end", refs: 2 },
    { value: "components", label: "Ingredients to Video", refs: 3 },
  ],
  resolutions: ["720p", "1080p", "4K"], // 4K requires ULTRA (1080p does not)
  lengths: [4, 6, 8], // 4 & 6 require ULTRA on Veo; 8 is the no-ULTRA default
}

export const GROK = {
  // Grok's own naming is the arrow form (matches the webhook display table).
  modes: [
    { value: "t2i", label: "Text \u2192 Image", video: false, needsRef: false },
    { value: "i2i", label: "Image \u2192 Image", video: false, needsRef: true },
    { value: "t2v", label: "Text \u2192 Video", video: true, needsRef: false },
    { value: "i2v", label: "Image \u2192 Video", video: true, needsRef: true },
  ],
  aspects: ["9:16", "16:9", "1:1", "2:3", "3:2"],
  resolutions: ["480p", "720p"],
  lengths: [6, 10],
  maxRefs: 5,
}
