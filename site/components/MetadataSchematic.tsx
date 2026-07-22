interface MetadataCell {
  label: string
  values: string[]
}

interface MetadataSchematicProps {
  cells: MetadataCell[]
}

/**
 * Editorial metadata block: clean multi-column grid with hairline dividers,
 * lime overline-style labels, and readable body-font values.
 */
export default function MetadataSchematic({ cells }: MetadataSchematicProps) {
  const visible = cells.filter((c) => c.values.length > 0 && c.values.some(Boolean))
  if (visible.length === 0) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 border-t border-l border-white/10">
      {visible.map((cell) => (
        <div key={cell.label} className="border-r border-b border-white/10 p-6 md:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
            {cell.label}
          </p>
          <div className="space-y-1.5">
            {cell.values.filter(Boolean).map((v) => (
              <p key={v} className="text-[15px] md:text-base text-white/85 leading-relaxed break-words">
                {v}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
