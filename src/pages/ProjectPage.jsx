import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProjectBySlug } from '../data/projects.js'
import ProjectNotFound from '../components/ProjectNotFound.jsx'

export default function ProjectPage() {
  const { slug } = useParams()
  const project = getProjectBySlug(slug)
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [slug])

  if (!project) return <ProjectNotFound />

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-8">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-4xl text-text outline-none sm:text-5xl"
      >
        {project.title}
      </h1>
      <p className="mt-4 text-base text-muted">Details coming soon.</p>
      <Link
        to="/#projects"
        className="mt-8 -mx-3 inline-flex min-h-11 items-center rounded-sm px-3 text-sm uppercase tracking-widest text-muted underline decoration-transparent underline-offset-8 transition-colors hover:text-text hover:decoration-accent focus-visible:bg-surface active:text-accent motion-reduce:transition-none"
      >
        Back to projects
      </Link>
    </div>
  )
}
