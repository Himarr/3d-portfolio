import { Link, useSearchParams } from 'react-router-dom'
import { projects } from '../data/projects'

const models = projects.find((p) => p.slug === '3d-library').models
const linkClass =
  'inline-flex min-h-11 items-center text-sm uppercase tracking-widest text-muted hover:text-text'

export default function ViewerPage() {
  const [params] = useSearchParams()
  const model = models.find((m) => m.id === params.get('model'))

  return (
    <section
      aria-labelledby="viewer-heading"
      className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col justify-center gap-4 px-4 py-16 sm:px-8 md:py-24"
    >
      <h1
        id="viewer-heading"
        className="wrap-break-word font-display text-5xl leading-tight tracking-tight text-text sm:text-6xl"
      >
        {model ? model.title : 'Model not found'}
      </h1>
      {model && <div className="aspect-video w-full border border-line" />}
      <Link to="/projects/3d-library" className={linkClass}>
        {model ? 'Back to library' : 'Go to the library'}
      </Link>
    </section>
  )
}
