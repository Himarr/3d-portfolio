import { useRef } from "react";
import SplitHeading from "../SplitHeading.jsx";
import ProjectCarousel from "../projects/ProjectCarousel.jsx";
import { projects } from "../../data/projects.js";
import { validateProjects } from "../../lib/dataValidation.js";
import { safeBandStyle } from "../../lib/sectionLayout.js";
import { useSectionReveal } from "../../hooks/useSectionReveal.js";

let validated = false;
if (import.meta.env.DEV && !validated) {
  validated = true;
  const messages = validateProjects(projects);
  if (messages && messages.length > 0) {
    console.error("Invalid projects data:", messages);
  }
}

export default function Projects() {
  const ref = useRef(null);
  useSectionReveal(ref);

  return (
    <section
      ref={ref}
      id="projects"
      aria-labelledby="projects-heading"
      data-snap-section
      data-snap-label="Projects"
      tabIndex={-1}
      style={safeBandStyle}
      className="grid w-full gap-4 outline-none py-16 md:py-24 snap:min-h-svh snap:py-(--safe-band) snap:content-center"
    >
      <div data-reveal className="mx-auto w-full max-w-5xl px-4 sm:px-8">
        <p className="mb-3 text-xs uppercase tracking-widest text-accent">
          Selected work
        </p>
        <SplitHeading
          as="h2"
          id="projects-heading"
          text="Projects"
          className="wrap-break-word font-display text-4xl leading-tight tracking-tight text-text sm:text-5xl snap:text-4xl"
        />
      </div>
      <div data-reveal>
        <ProjectCarousel projects={projects} />
      </div>
    </section>
  );
}
