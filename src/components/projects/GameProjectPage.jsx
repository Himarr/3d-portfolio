import { useState } from 'react'
import { Link } from 'react-router-dom'

const PLACEHOLDER_COUNT = 4
const SLIDE_BACKGROUNDS = [
  'bg-gradient-to-br from-line via-surface to-ink',
  'bg-gradient-to-tr from-surface via-line to-muted',
  'bg-gradient-to-bl from-ink to-line',
  'bg-gradient-to-tl from-surface via-ink to-line',
]

const arrowClass =
  'absolute top-1/2 z-10 size-11 -translate-y-1/2 rounded-full border border-line bg-surface/70 text-xl leading-none text-text hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent'

export default function GameProjectPage({ project, headingRef }) {
  const [current, setCurrent] = useState(0)
  const slides =
    project.images?.length >= 3
      ? project.images
      : Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => ({
          src: null,
          alt: `${project.title} - placeholder ${i + 1}`,
        }))
  const count = slides.length
  const show = (index) => setCurrent((index + count) % count)

  const meta = [
    ['Year', project.year ?? '2025'],
    ['Role', project.role ?? 'Placeholder role'],
    ['Tools', project.tools ?? 'Placeholder tools'],
  ]

  return (
    <div className="w-full min-w-0 max-w-full break-words">
      <section
        className="relative h-svh w-full overflow-hidden"
        aria-label="Project images"
        aria-roledescription="carousel"
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-label={`Image ${i + 1} of ${count}`}
            className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${
              i === current ? 'opacity-100' : 'opacity-0'
            } ${slide.src ? '' : SLIDE_BACKGROUNDS[i % SLIDE_BACKGROUNDS.length]}`}
          >
            {slide.src ? (
              <img
                src={slide.src}
                alt={slide.alt}
                width={slide.width}
                height={slide.height}
                className="size-full object-cover"
              />
            ) : (
              <img
                alt=""
                aria-hidden="true"
                src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
                className="size-full object-cover opacity-0"
              />
            )}
          </div>
        ))}
        <button
          type="button"
          aria-label="Previous image"
          onClick={() => show(current - 1)}
          className={`${arrowClass} left-4`}
        >
          &#8249;
        </button>
        <button
          type="button"
          aria-label="Next image"
          onClick={() => show(current + 1)}
          className={`${arrowClass} right-4`}
        >
          &#8250;
        </button>
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to image ${i + 1}`}
              aria-current={i === current ? 'true' : undefined}
              onClick={() => show(i)}
              className={`size-3 rounded-full border p-0 ${
                i === current ? 'border-accent bg-accent' : 'border-muted bg-transparent'
              }`}
            />
          ))}
        </div>
      </section>

      <article className="mx-auto min-w-0 max-w-2xl px-5 pb-16 pt-10">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mb-6 font-display text-5xl leading-none text-text outline-none sm:text-7xl"
        >
          {project.title}
        </h1>
        <dl className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4 border-y border-line py-4">
          {meta.map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="mt-1 min-w-0 break-words">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-lg leading-relaxed text-text">{project.description}</p>
        {project.sections?.map(({ heading, body }) => (
          <section key={heading} className="mt-10">
            <h2 className="mb-3 font-display text-3xl leading-tight text-text">{heading}</h2>
            <p className="leading-relaxed text-muted">{body}</p>
          </section>
        ))}
        <div className="flex items-center justify-between">
          <Link
            to="/#projects"
            className="mt-8 -mx-3 inline-flex min-h-11 items-center rounded-sm px-3 text-sm uppercase tracking-widest text-muted underline decoration-transparent underline-offset-8 transition-colors hover:text-text hover:decoration-accent focus-visible:bg-surface active:text-accent motion-reduce:transition-none"
          >
            Back to projects
          </Link>
          {project.link && (
            <a
              href={project.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 -mx-3 inline-flex min-h-11 items-center rounded-sm px-3 text-sm uppercase tracking-widest text-muted underline decoration-transparent underline-offset-8 transition-colors hover:text-text hover:decoration-accent focus-visible:bg-surface active:text-accent motion-reduce:transition-none"
            >
              {project.link.label}
            </a>
          )}
        </div>
      </article>
    </div>
  )
}
