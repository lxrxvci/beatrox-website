interface MetadataCell {
  label: string
  values: string[]
}

interface MetadataSchematicProps {
  cells: MetadataCell[]
}

/**
 * Editorial "blueprint" metadata block: rigid multi-column grid with
 * razor-thin borders, mono font throughout, sharp technical corners.
 */
export default function MetadataSchematic({ cells }: MetadataSchematicProps) {
  const visible = cells.filter((c) => c.values.length > 0 && c.values.some(Boolean))
  if (visible.length === 0) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 border-t border-l border-[var(--border)]">
      {visible.map((cell) => (
        <div key={cell.label} className="border-r border-b border-[var(--border)] p-5">
          <p className="mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-secondary)] mb-3">
            {cell.label}
          </p>
          <div className="space-y-1">
            {cell.values.filter(Boolean).map((v) => (
              <p key={v} className="mono text-[13px] text-[var(--text-primary)] leading-relaxed break-words">
                {v}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
