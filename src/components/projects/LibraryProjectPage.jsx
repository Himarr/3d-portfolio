import { useRef, useState } from 'react'
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
  const [selected, setSelected] = useState(null)
  const dialogRef = useRef(null)
  const openerRef = useRef(null)

  const open = (model, el) => {
    openerRef.current = el
    setSelected(model)
    dialogRef.current?.showModal()
  }
  const close = () => dialogRef.current?.close()
  const restoreFocus = () => openerRef.current?.focus()

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
            <button
              type="button"
              onClick={(e) => open(model, e.currentTarget)}
              className="block w-full text-left"
            >
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
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={restoreFocus}
        aria-label={selected?.title ?? 'Model viewer'}
        className="m-auto w-[min(90vw,48rem)] rounded-sm border border-line bg-surface p-6 text-text backdrop:bg-ink/80"
      >
        <h2 className="pr-14 font-display text-2xl">{selected?.title}</h2>
        <div className="mt-4 flex aspect-video w-full items-center justify-center border border-line text-muted">
          3D viewer
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          className="absolute right-3 top-3 size-11 rounded-full border border-line text-xl leading-none hover:border-accent hover:text-accent focus-visible:border-accent"
        >
          &times;
        </button>
      </dialog>

      <Link
        to="/#projects"
        className="mt-10 -mx-3 inline-flex min-h-11 items-center rounded-sm px-3 text-sm uppercase tracking-widest text-muted underline decoration-transparent underline-offset-8 transition-colors hover:text-text hover:decoration-accent focus-visible:bg-surface active:text-accent motion-reduce:transition-none"
      >
        Back to projects
      </Link>
    </div>
  )
}
