import { Link, useSearchParams } from 'react-router-dom'
import { projects } from '../data/projects'
import ViewerCanvas from '../three/ViewerCanvas.jsx'

const models = projects.find((p) => p.slug === '3d-library').models
const linkClass =
  'inline-flex min-h-11 items-center text-sm uppercase tracking-widest text-muted hover:text-text'

export default function ViewerPage() {
  const [params] = useSearchParams()
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
    <div className="relative h-[calc(100svh-3.8125rem)] w-full">
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
