import { useState } from "react"
import { Link } from "react-router-dom"
import { CAROUSEL_IMAGE_ASPECT } from "../../lib/carouselConfig"

export default function ProjectCard({ project, active, linkRef, onLinkClick }) {
  const { slug, title, description, image } = project
  const [failed, setFailed] = useState(false)
  const showImage = image && !failed

  return (
    <div
      className={`group relative flex flex-col border border-line bg-surface has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus${
        active ? " hover:border-accent" : ""
      }`}
    >
      <div
        className="overflow-hidden border-b border-line"
        style={{ aspectRatio: CAROUSEL_IMAGE_ASPECT }}
      >
        {showImage ? (
          <img
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="size-full object-cover motion-safe:transition-transform motion-safe:group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden="true"
            className="size-full bg-linear-to-br from-surface to-line motion-safe:transition-transform motion-safe:group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-xl leading-7 text-text line-clamp-2">
          <Link
            to={`/projects/${slug}`}
            ref={linkRef}
            onClick={onLinkClick}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {title}
          </Link>
        </h3>
        {description ? (
          <p className="mt-1 text-base leading-6 text-muted line-clamp-2">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}
