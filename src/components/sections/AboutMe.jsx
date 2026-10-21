import { useRef } from "react";
import SplitHeading from "../SplitHeading.jsx";
import { useSectionReveal } from "../../hooks/useSectionReveal.js";
import { aboutImage } from "../../data/about.js";
import {
  ABOUT_IMAGE_ASPECT,
  ABOUT_IMAGE_MAX_REM,
  SECTION_SAFE_BAND_PX,
  safeBandStyle,
} from "../../lib/sectionLayout.js";

const facts = [
  { id: "focus", label: "Focus", value: "3D modeling and game development" },
  { id: "based", label: "Based in", value: "Placeholder location" },
  { id: "open", label: "Open to", value: "Placeholder availability" },
];

// Section style: the safe band plus the snapped frame height. The height is
// capped by min() so the frame never exceeds the space between the bands.
const sectionStyle = {
  ...safeBandStyle,
  "--about-img-h": `min(calc(100svh - ${2 * SECTION_SAFE_BAND_PX}px - 0.5rem), ${ABOUT_IMAGE_MAX_REM}rem)`,
};

export default function AboutMe() {
  const ref = useRef(null);
  useSectionReveal(ref);

  return (
    <section
      ref={ref}
      id="about"
      aria-labelledby="about-heading"
      data-snap-section
      data-snap-label="About"
      tabIndex={-1}
      style={sectionStyle}
      className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-16 outline-none sm:px-8 md:grid-cols-[1fr_auto] md:items-center md:gap-12 md:py-24 snap:min-h-svh snap:py-(--safe-band) snap:content-center"
    >
      <div data-reveal className="md:order-last">
        <div
          style={{ aspectRatio: ABOUT_IMAGE_ASPECT }}
          className="mx-auto w-full max-w-xs overflow-hidden border border-line md:mx-0 snap:h-(--about-img-h) snap:w-auto snap:max-w-none"
        >
          {aboutImage ? (
            <img
              src={aboutImage.src}
              alt={aboutImage.alt}
              width={aboutImage.width}
              height={aboutImage.height}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-full w-full bg-linear-to-br from-surface to-ink"
            />
          )}
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-8">
        <div data-reveal>
          <p className="mb-3 text-xs uppercase tracking-widest text-accent">
            Background
          </p>
          <SplitHeading
            as="h2"
            id="about-heading"
            text="About Me"
            className="wrap-break-word font-display text-4xl leading-tight tracking-tight text-text sm:text-5xl"
          />
        </div>
        <div
          data-reveal
          className="flex max-w-prose flex-col gap-4 text-base text-muted sm:text-lg snap:text-base"
        >
          <p>
            A short paragraph about who I am and how I got into 3D modeling and
            game development. Placeholder text to be replaced later.
          </p>
          <p>
            A second paragraph about how I work and what I care about when
            building a model or a game. Placeholder text.
          </p>
        </div>
        <dl
          data-reveal
          className="grid gap-4 border-t border-line pt-6 sm:grid-cols-3"
        >
          {facts.map((fact) => (
            <div key={fact.id} className="min-w-0">
              <dt className="text-xs uppercase tracking-widest text-rim">
                {fact.label}
              </dt>
              <dd className="mt-1 wrap-break-word text-base font-medium text-text">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
