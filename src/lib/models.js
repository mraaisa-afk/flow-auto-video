// Flow Auto Video — generation option catalog (mirrors G-Labs Webhook API).

export const IMAGE = {
  models: [
    { value: "nano_banana_2", label: "Nano Banana 2" },
    { value: "nano_banana_pro", label: "Nano Banana Pro" },
  ],
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
  aspects: ["16:9", "9:16"],
  modes: [
    { value: "text_to_video", label: "Text \u2192 Video", refs: 0 },
    { value: "start_image", label: "Start Image", refs: 1 },
    { value: "start_end_image", label: "Start + End", refs: 2 },
    { value: "components", label: "Components", refs: 3 },
  ],
  resolutions: ["720p", "1080p", "4K"], // 4K requires ULTRA (1080p does not)
  lengths: [4, 6, 8], // 4 & 6 require ULTRA on Veo
}

export const GROK = {
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
