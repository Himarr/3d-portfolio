import { lazy, Suspense, useEffect, useRef, useState } from "react";
import CanvasErrorBoundary from "../../three/CanvasErrorBoundary.jsx";
import { probeWebGL2 } from "../../three/webgl.js";
import SplitHeading from "../SplitHeading.jsx";
import { useSectionReveal } from "../../hooks/useSectionReveal.js";
import {
  ABOUT_IMAGE_ASPECT,
  ABOUT_IMAGE_MAX_REM,
  SECTION_SAFE_BAND_PX,
  safeBandStyle,
} from "../../lib/sectionLayout.js";

const SelfPortrait = lazy(() => import("../../three/SelfPortrait.jsx"));

const facts = [
  { id: "focus", label: "Focus", value: "Game development 3D Modeling" },
  { id: "based", label: "Based in", value: "Gran Canaria" },
];

// Section style: the safe band plus the snapped frame height. The height is
// capped by min() so the frame never exceeds the space between the bands.
const sectionStyle = {
  ...safeBandStyle,
  "--about-img-h": `min(calc(100svh - ${2 * SECTION_SAFE_BAND_PX}px - 0.5rem), ${ABOUT_IMAGE_MAX_REM}rem)`,
};

export default function AboutMe() {
  const ref = useRef(null);
  const frameRef = useRef(null);
  const [showCanvas, setShowCanvas] = useState(false);
  useSectionReveal(ref);

  // Mount the canvas once the frame is near the viewport and WebGL2 exists.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !probeWebGL2()) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShowCanvas(true);
        io.disconnect();
      },
      { rootMargin: "400px" },
    );
    io.observe(frame);
    return () => io.disconnect();
  }, []);

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
          ref={frameRef}
          role="img"
          aria-label="Self-portrait: 3D alien character"
          style={{ aspectRatio: ABOUT_IMAGE_ASPECT }}
          className="relative mx-auto w-full max-w-xs overflow-hidden border border-line md:mx-0 snap:h-(--about-img-h) snap:w-auto snap:max-w-none"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-br from-surface to-ink"
          />
          {showCanvas && (
            <div aria-hidden="true" className="absolute inset-0">
              <CanvasErrorBoundary>
                <Suspense fallback={null}>
                  <SelfPortrait />
                </Suspense>
              </CanvasErrorBoundary>
            </div>
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
            I like hard problems. If something looks out of reach, that’s usually what I want to 
            build next, whether it’s a character, a custom shader, or a tool that doesn’t exist yet.
          </p>
          <p>
            I care about the details (clean topology, readable code, a look that holds up close),
            but I also know a finished thing beats a perfect idea. So I work in a practical, solution-oriented way and keep going until it ships.
          </p>
          <p>
            Getting better at what I do isn’t a goal for me, it’s the fun part.
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
