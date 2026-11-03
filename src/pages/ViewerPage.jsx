import { lazy, Suspense, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { projects } from '../data/projects'
import ViewerCanvas from '../three/ViewerCanvas.jsx'
import CanvasErrorBoundary from '../three/CanvasErrorBoundary.jsx'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'

const PageCanvas = lazy(() => import('../three/PageCanvas.jsx'))
const noop = () => {}

const models = projects.find((p) => p.slug === '3d-library').models
const linkClass =
  'inline-flex min-h-11 items-center text-sm uppercase tracking-widest text-muted hover:text-text'

export default function ViewerPage() {
  const [params] = useSearchParams()
  const pageRef = useRef(null)
  const reducedMotion = usePrefersReducedMotion()
  const model = models.find((m) => m.id === params.get('model'))

  if (!model) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col items-start gap-4 px-4 py-16 sm:px-8">
        <p className="font-display text-5xl text-text">Model not found</p>
        <Link to="/projects/3d-library" className={linkClass}>
          Go to the library
        </Link>
      </section>
    )
  }

  return (
    <div ref={pageRef} className="relative isolate h-[calc(100svh-var(--nav-h))] w-full">
      {!reducedMotion && (
        <CanvasErrorBoundary onError={noop}>
          <Suspense fallback={null}>
            <PageCanvas starsOnly pageRef={pageRef} onStatus={noop} />
          </Suspense>
        </CanvasErrorBoundary>
      )}
      <ViewerCanvas key={model.id} url={model.url} toon={model.toon} />
      <Link
        to="/projects/3d-library"
        className={`absolute left-4 top-4 z-10 bg-ink/70 px-3 ${linkClass}`}
      >
        Back to library
      </Link>
    </div>
  )
}
