import { useId, useRef } from "react"
import { useCarousel } from "../../hooks/useCarousel"
import { wrapSigned } from "../../lib/carouselLogic"
import ProjectCard from "./ProjectCard"
import CarouselControls from "./CarouselControls"

function CarouselView({ projects }) {
  const regionRef = useRef(null)
  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const trackId = useId()
  const total = projects.length

  const {
    activeSlot,
    activeProject,
    pool,
    slotRefs,
    linkRefs,
    next,
    prev,
    goProject,
    goRelative,
    onKeyDown,
    onLinkClick,
  } = useCarousel({ projects, regionRef, viewportRef, trackRef })

  return (
    <div
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Projects"
      onKeyDown={onKeyDown}
      className="w-full"
    >
      <div ref={viewportRef} className="overflow-x-clip touch-pan-y">
        <div ref={trackRef} id={trackId} aria-live="polite" className="grid">
          {Array.from({ length: pool }, (_, slot) => {
            const active = slot === activeSlot
            const rel = wrapSigned(slot - activeSlot, pool)
            const projectIndex = slot % total
            return (
              <div
                key={slot}
                ref={(el) => {
                  slotRefs.current[slot] = el
                }}
                className="relative"
                style={{
                  width: "var(--carousel-card-w)",
                  gridArea: "1 / 1",
                  justifySelf: "center",
                  alignSelf: "start",
                }}
              >
                <div
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${projectIndex + 1} of ${total}`}
                  inert={active ? undefined : true}
                  aria-hidden={active ? undefined : "true"}
                >
                  <ProjectCard
                    project={projects[projectIndex]}
                    active={active}
                    linkRef={(el) => {
                      linkRefs.current[slot] = el
                    }}
                    onLinkClick={onLinkClick}
                  />
                </div>
                {!active && Math.abs(rel) === 1 ? (
                  <div
                    aria-hidden="true"
                    onClick={() => goRelative(rel)}
                    className="absolute inset-0 cursor-pointer"
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
      <CarouselControls
        projects={projects}
        activeProject={activeProject}
        trackId={trackId}
        onPrev={() => prev("button")}
        onNext={() => next("button")}
        onDot={(i) => goProject(i, "dot")}
      />
    </div>
  )
}

export default function ProjectCarousel({ projects }) {
  if (!projects || projects.length === 0) {
    return <p className="text-muted">No projects yet.</p>
  }
  return <CarouselView projects={projects} />
}
