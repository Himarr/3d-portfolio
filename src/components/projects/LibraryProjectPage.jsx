import { Link } from 'react-router-dom'

const GRADIENTS = [
  'bg-gradient-to-br from-line via-surface to-ink',
  'bg-gradient-to-tr from-surface via-line to-muted',
  'bg-gradient-to-bl from-ink to-line',
  'bg-gradient-to-tl from-surface via-ink to-line',
]
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='

export default function LibraryProjectPage({ project, headingRef }) {
  const models = project.models ?? []

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl break-words px-4 py-16 sm:px-8">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-4xl text-text outline-none sm:text-5xl"
      >
        {project.title}
      </h1>
      <p className="mt-4 text-base text-muted">{project.description}</p>

      <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model, i) => (
          <li key={model.id}>
            <Link to={`/viewer?model=${model.id}`} className="block w-full text-left">
              <span
                className={`block aspect-[4/3] w-full overflow-hidden rounded-sm border border-line ${
                  model.poster ? '' : GRADIENTS[i % GRADIENTS.length]
                }`}
              >
                <img
                  src={model.poster ?? BLANK}
                  alt={model.poster ? model.title : ''}
                  className={`size-full object-cover ${model.poster ? '' : 'opacity-0'}`}
                />
              </span>
              <span className="mt-3 block text-base text-text">{model.title}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        to="/#projects"
        className="mt-10 -mx-3 inline-flex min-h-11 items-center rounded-sm px-3 text-sm uppercase tracking-widest text-muted underline decoration-transparent underline-offset-8 transition-colors hover:text-text hover:decoration-accent focus-visible:bg-surface active:text-accent motion-reduce:transition-none"
      >
        Back to projects
      </Link>
    </div>
  )
}
