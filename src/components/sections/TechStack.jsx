import { useRef } from "react";
import SplitHeading from "../SplitHeading.jsx";
import TechCategory from "../tech/TechCategory.jsx";
import { techStack } from "../../data/techStack.js";
import { safeBandStyle } from "../../lib/sectionLayout.js";
import { useSectionReveal } from "../../hooks/useSectionReveal.js";

export default function TechStack() {
  const ref = useRef(null);
  useSectionReveal(ref);

  return (
    <section
      ref={ref}
      id="tech-stack"
      aria-labelledby="tech-stack-heading"
      data-snap-section
      data-snap-label="Tech Stack"
      tabIndex={-1}
      style={safeBandStyle}
      className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-16 outline-none sm:px-8 md:gap-12 md:py-24 snap:min-h-svh snap:py-(--safe-band) snap:content-center snap:gap-4"
    >
      <div data-reveal>
        <p className="mb-3 text-xs uppercase tracking-widest text-accent">
          Toolkit
        </p>
        <SplitHeading
          as="h2"
          id="tech-stack-heading"
          text="Tech Stack"
          className="wrap-break-word font-display text-4xl leading-tight tracking-tight text-text sm:text-5xl"
        />
      </div>
      <div className="grid gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-4">
        {techStack.map((category) => (
          <div key={category.id} data-reveal>
            <TechCategory category={category} />
          </div>
        ))}
      </div>
    </section>
  );
}
