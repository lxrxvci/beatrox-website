import React from 'react'
import NodeBullet from '@/components/NodeBullet'
import { EditableText } from '@/components/admin'
import type { Service } from '@/lib/content'

interface ServiceBodySectionsProps {
  service: Service
  /** Rendered inside each article, after the body block — interleaved
   *  2-up tagged-image row, fallback gallery image, or nothing. */
  renderAfterSection?: (index: number) => React.ReactNode
}

/**
 * Shared body renderer for the /services/[slug] and /tech/[slug] landing
 * pages (the two were near-verbatim duplicates). Boxed card formatting:
 * trust → grid of bordered ✓ cards, process → numbered cards with an accent
 * chip, default blocks with items → bordered bullet cards (content stays
 * prose), faq → divided list in a bordered panel. Every EditableText wrapper
 * and `body.N.*` field path matches the previous inline JSX exactly.
 */
export default function ServiceBodySections({ service, renderAfterSection }: ServiceBodySectionsProps) {
  return (
    <div className="space-y-14">
      {service.body.map((block, i) => (
        <article key={i} className="space-y-8">
          <div>
            {block.type === 'trust' && (
              <div>
                {block.heading && (
                  <h2 className="heading-sm text-white/75 mb-6">{block.heading}</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {block.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 border border-white/10 bg-white/[0.03] rounded-sm p-4 md:p-5 text-base text-white/75"
                    >
                      <span className="text-[var(--accent)] mt-0.5 shrink-0" aria-hidden="true">✓</span>
                      <EditableText collection="services" documentId={service.id} fieldPath={`body.${i}.items.${idx}`} value={item}><span>{item}</span></EditableText>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {block.type === 'process' && (
              <div>
                {block.heading && (
                  <h2 className="heading-sm text-white/75 mb-6">{block.heading}</h2>
                )}
                <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {block.items?.map((item, idx) => (
                    <li
                      key={idx}
                      className="border border-white/10 bg-white/[0.03] rounded-sm p-4 md:p-5"
                    >
                      <span className="inline-flex items-center justify-center px-2 py-1 mb-3 border border-[var(--accent)]/40 text-[var(--accent)] font-mono text-sm rounded-sm">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="block text-base text-white/75 leading-relaxed"><EditableText collection="services" documentId={service.id} fieldPath={`body.${i}.items.${idx}`} value={item}>{item.replace(/^\d+[.)]\s*/, '')}</EditableText></span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {block.type === 'faq' && (
              <div>
                {block.heading && (
                  <h2 className="heading-sm text-white/75 mb-6">{block.heading}</h2>
                )}
                <div className="border border-white/10 bg-white/[0.03] rounded-sm p-6 md:p-8 divide-y divide-white/10">
                  {(block.items as { question: string; answer: string }[])?.map((item, idx) => (
                    <div key={idx} className="py-5 first:pt-0 last:pb-0">
                      <p className="text-base font-semibold text-white mb-2 flex items-start gap-3">
                        <span aria-hidden="true" className="text-[var(--accent)] shrink-0">+</span>
                        <EditableText collection="services" documentId={service.id} fieldPath={`body.${i}.items.${idx}.question`} value={item.question}>{item.question}</EditableText>
                      </p>
                      <p className="text-base text-white/75 leading-relaxed"><EditableText collection="services" documentId={service.id} fieldPath={`body.${i}.items.${idx}.answer`} value={item.answer}>{item.answer}</EditableText></p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {block.type !== 'trust' && block.type !== 'process' && block.type !== 'faq' && (() => {
              const bodyBlock = block as { heading?: string; content?: string; items?: string[] }
              return (
              <div>
                {bodyBlock.heading && (
                  <h2 className="heading-sm text-white/75 mb-4"><EditableText collection="services" documentId={service.id} fieldPath={`body.${i}.heading`} value={bodyBlock.heading}>{bodyBlock.heading}</EditableText></h2>
                )}
                {bodyBlock.content && (
                  <p className="text-base text-white/75 leading-relaxed whitespace-pre-line">
                    {bodyBlock.content}
                  </p>
                )}
                {bodyBlock.items && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {bodyBlock.items.map((item, itemIndex) => (
                      <div
                        key={item}
                        className="flex items-start gap-3 border border-white/10 bg-white/[0.03] rounded-sm p-4 md:p-5 text-base text-white/75"
                      >
                        <NodeBullet index={itemIndex} />
                        <EditableText collection="services" documentId={service.id} fieldPath={`body.${i}.items.${itemIndex}`} value={item}><span>{item}</span></EditableText>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )
            })()}
          </div>
          {renderAfterSection?.(i)}
        </article>
      ))}
    </div>
  )
}
