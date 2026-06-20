// Flow Auto Video — skeleton loaders (shimmer placeholders during async loads).

export function Skeleton({ class: cls = "", w, h, rounded = "rounded-lg" }) {
  const style = {}
  if (w != null) style.width = typeof w === "number" ? `${w}px` : w
  if (h != null) style.height = typeof h === "number" ? `${h}px` : h
  return <div class={`fav-skeleton ${rounded} ${cls}`} style={style} aria-hidden="true" />
}

export function SkeletonText({ lines = 3, class: cls = "" }) {
  return (
    <div class={`space-y-2 ${cls}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} h={10} class={i === lines - 1 ? "w-2/3" : "w-full"} />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div class="fav-card space-y-3" aria-hidden="true">
      <div class="flex items-center gap-2.5">
        <Skeleton w={36} h={36} rounded="rounded-xl" />
        <div class="flex-1 space-y-2">
          <Skeleton h={10} class="w-1/3" />
          <Skeleton h={10} class="w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}
