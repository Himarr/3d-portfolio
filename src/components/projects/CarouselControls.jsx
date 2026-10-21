import IconMask from "../IconMask"
import { CAROUSEL_MAX_DOTS } from "../../lib/carouselConfig"
import prevIcon from "../../assets/icons/carousel-prev.svg"
import nextIcon from "../../assets/icons/carousel-next.svg"

const arrowClass =
  "inline-flex size-11 items-center justify-center text-text hover:bg-surface hover:text-accent focus-visible:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:text-rim transition-colors duration-200 motion-reduce:transition-none"

export default function CarouselControls({
  projects,
  activeProject,
  trackId,
  onPrev,
  onNext,
  onDot,
}) {
  const total = projects.length
  if (total < 2) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
      <button
        type="button"
        aria-label="Previous project"
        aria-controls={trackId}
        onClick={onPrev}
        className={arrowClass}
      >
        <IconMask src={prevIcon} className="size-6" />
      </button>
      {total <= CAROUSEL_MAX_DOTS ? (
        <div
          role="group"
          aria-label="Choose project"
          className="flex flex-wrap items-center justify-center"
        >
          {projects.map((project, i) => {
            const active = i === activeProject
            return (
              <button
                key={project.slug ?? i}
                type="button"
                aria-label={`Show project ${i + 1} of ${total}: ${project.title}`}
                aria-current={active ? "true" : undefined}
                aria-controls={trackId}
                onClick={() => onDot(i)}
                className="group inline-flex size-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <span
                  aria-hidden="true"
                  className={`block h-2.5 rounded-full transition-all duration-200 motion-reduce:transition-none group-hover:bg-accent ${
                    active ? "w-6 bg-accent" : "w-2.5 bg-muted"
                  }`}
                />
              </button>
            )
          })}
        </div>
      ) : (
        <span aria-hidden="true" className="min-w-16 px-2 text-center text-muted">
          {activeProject + 1} / {total}
        </span>
      )}
      <button
        type="button"
        aria-label="Next project"
        aria-controls={trackId}
        onClick={onNext}
        className={arrowClass}
      >
        <IconMask src={nextIcon} className="size-6" />
      </button>
    </div>
  )
}
