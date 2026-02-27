import Image from 'next/image'
import Link from 'next/link'
import { Project } from '@/lib/content'

interface Props {
  project: Project
  slug: string
}

export default function ProjectCard({ project, slug }: Props) {
  const firstImage = project.images?.find(img => img.url && img.url !== '')
  const hasImage = firstImage?.url || project.seo?.og?.image !== '/og-default.jpg'
  const imgSrc = firstImage?.url || project.seo?.og?.image || '/og-default.jpg'
  const localSrc = firstImage?.url
    ? firstImage.url.startsWith('http')
      ? firstImage.url
      : firstImage.url
    : project.seo?.og?.image || '/og-default.jpg'

  return (
    <Link href={`/work/${slug}`} className="project-card block relative aspect-square overflow-hidden bg-neutral-950 group">
      {localSrc && (
        <Image
          src={localSrc}
          alt={firstImage?.alt || project.title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}
      <div className="project-card-overlay">
        <div>
          <p className="heading-sm text-white mb-1">{project.title}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {project.hero?.tags?.slice(0, 3).map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
