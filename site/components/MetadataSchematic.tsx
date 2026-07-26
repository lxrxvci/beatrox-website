interface MetadataCell {
  label: string
  values: string[]
}

interface MetadataSchematicProps {
  cells: MetadataCell[]
}

/**
 * Film-credits roll: bracketed [ CREDITS ] header over a three-column roll of
 * label/value reels separated by hairline rules (gap-px over a hairline
 * background). Rendered below gallery/videos on project pages.
 */
export default function MetadataSchematic({ cells }: MetadataSchematicProps) {
  const visible = cells.filter((c) => c.values.length > 0 && c.values.some(Boolean))
  if (visible.length === 0) return null

  return (
    <div>
      <p className="hud-label mb-8 md:mb-10">Credits</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
        {visible.map((cell) => (
          <div key={cell.label} className="bg-[var(--bg-primary)] p-6 md:p-7">
            <p className="mono text-[11px] uppercase tracking-[0.22em] text-[var(--accent)] mb-3">
              {cell.label}
            </p>
            <div className="space-y-1.5">
              {cell.values.filter(Boolean).map((v) => (
                <p key={v} className="text-[15px] md:text-base text-white leading-relaxed break-words">
                  {v}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
