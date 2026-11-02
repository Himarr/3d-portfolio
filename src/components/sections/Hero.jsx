import { useLayoutEffect, useRef } from "react";
import SplitHeading from "../SplitHeading.jsx";
import { gsap, ScrollTrigger } from "../../lib/gsap.js";
import posterUrl from "../../assets/hero-planet-poster.png";
import alienPosterUrl from "../../assets/hero-alien-poster.png";
import {
  alienOffsetInRadii,
  ALIEN_HEIGHT_PER_MOON_RADIUS,
  ALIEN_POSTER_FILL,
  ALIEN_DROP_DURATION_S,
  ALIEN_DROP_EASE,
} from "../../three/alienPlacement.js";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion.js";
import { useCanvasStatus } from "../../context/canvasStatus.js";
import { useMediaQuery } from "../../hooks/useMediaQuery.js";
import { useHeroWrap } from "../../hooks/useHeroWrap.js";
import { useHeroColumn } from "../../hooks/useHeroColumn.js";
import {
  HERO_COLUMN_GAP_PX,
  HERO_COLUMN_BOTTOM_PX,
  HERO_WRAP_MIN_WIDTH_PX,
  HERO_H1_RADIUS_RATIO,
  MOON_INTRO_START_SCALE,
  MOON_INTRO_DURATION_S,
  MOON_INTRO_EASE,
} from "../../lib/moonConfig.js";
import { moonIntro } from "../../lib/moonIntro.js";
import { heroIntro } from "../../lib/heroIntro.js";

// Plays once per page load; returning from /viewer does not replay it.
let introPlayed = false;

// Navbar height comes from --nav-h (kept in sync by Navbar's ResizeObserver;
// CSS default 3.8125rem). min-height only, so a wrapped navbar breaks nothing.
export default function Hero() {
  const sectionRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const status = useCanvasStatus();
  const wrap = useMediaQuery(`(min-width: ${HERO_WRAP_MIN_WIDTH_PX}px)`);
  const textRef = useRef(null);
  const posterBoxRef = useRef(null);
  const alienBoxRef = useRef(null);
  useHeroWrap(sectionRef, textRef, wrap);
  useHeroColumn(textRef, !wrap);

  useLayoutEffect(() => {
    if (reducedMotion || introPlayed) return undefined;
    const root = sectionRef.current;
    if (!root) return undefined;
    introPlayed = true;

    let tl;
    const posterBox = posterBoxRef.current;
    const alienBox = alienBoxRef.current;
    // Distance that puts the alien poster fully above the viewport (read once).
    const alienImg = alienBox && alienBox.querySelector("img");
    const alienUp = alienImg ? alienImg.getBoundingClientRect().bottom : 0;
    moonIntro.scale = MOON_INTRO_START_SCALE;
    moonIntro.alienDrop = 1;
    const ctx = gsap.context(() => {
      const [eyebrow, intro] = gsap.utils.toArray("[data-intro]");
      if (posterBox) gsap.set(posterBox, { scale: MOON_INTRO_START_SCALE });
      if (alienBox) gsap.set(alienBox, { y: -alienUp });
      // Only opacity, y/yPercent and scale. Never touches visibility or
      // pointer-events, so links stay clickable during the intro.
      tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroIntro.timeline = tl;
      // One tween is the clock for both the poster and the canvas moon.
      tl.fromTo(
        moonIntro,
        { scale: MOON_INTRO_START_SCALE },
        {
          scale: 1,
          duration: MOON_INTRO_DURATION_S,
          ease: MOON_INTRO_EASE,
          onUpdate: () => {
            if (posterBox) gsap.set(posterBox, { scale: moonIntro.scale });
          },
        },
        0,
      );
      // One tween is the clock for the live alien and its poster.
      tl.fromTo(
        moonIntro,
        { alienDrop: 1 },
        {
          alienDrop: 0,
          duration: ALIEN_DROP_DURATION_S,
          ease: ALIEN_DROP_EASE,
          onUpdate: () => {
            if (alienBox) gsap.set(alienBox, { y: -alienUp * moonIntro.alienDrop });
          },
        },
        ">",
      );
      tl.addLabel("text", ">");
      tl.from(eyebrow, { opacity: 0, y: 16, duration: 0.6 }, "text+=0")
        .from(
          "#hero-heading .word",
          { yPercent: 110, opacity: 0, stagger: 0.05, duration: 0.8 },
          "text+=0.2",
        )
        .from(intro, { opacity: 0, y: 16, duration: 0.6 }, "text+=0.8");
      // Arrow slot: "text+=1.4" (T-34). Total 5.0 s.
    }, root);

    return () => {
      // Under StrictMode the effect runs, cleans up and runs again; an
      // unfinished intro is allowed to play again. A finished one is not.
      const finished = tl && tl.progress() >= 1;
      ctx.revert();
      heroIntro.timeline = null;
      moonIntro.scale = 1;
      moonIntro.alienDrop = 0;
      if (alienBox) gsap.set(alienBox, { clearProps: "transform" });
      if (!finished) introPlayed = false;
    };
  }, [reducedMotion]);

  // Poster provenance: generated from this app's moon model scene on
  // 2026-10-20 (cel-shaded outlined moon); moon.glb provided by owner.
  // Re-capture via /?capture-poster in dev.
  // Column mode: the poster can be wider than the slot, and auto margins
  // then left-align an inset-0 box. Centre with left/top 50% and negative
  // margins instead of a transform, since GSAP sets transform (scale).
  const posterBoxClass = wrap
    ? "pointer-events-none absolute inset-0 m-auto"
    : "pointer-events-none absolute left-1/2 top-1/2";
  const posterBoxStyle = wrap
    ? {
        width: "var(--moon-poster-side)",
        height: "var(--moon-poster-side)",
      }
    : {
        width: "var(--moon-poster-side)",
        height: "var(--moon-poster-side)",
        marginLeft: "calc(var(--moon-poster-side) / -2)",
        marginTop: "calc(var(--moon-poster-side) / -2)",
      };
  // Alien poster provenance: generated from this app's alien scene (Alien.glb,
  // toon + outline) via /?capture-poster=alien in dev; the alien fills
  // ALIEN_POSTER_FILL of the 1200 px square. Same offset as live placement.
  const alienOff = alienOffsetInRadii(wrap, { dx: 0, dy: 0 });
  const alienSide = `calc(var(--moon-r) * ${ALIEN_HEIGHT_PER_MOON_RADIUS / ALIEN_POSTER_FILL})`;
  const moonPoster = (
    <div
      ref={posterBoxRef}
      className={posterBoxClass}
      style={posterBoxStyle}
    >
      <img
        src={posterUrl}
        alt=""
        aria-hidden="true"
        width="1200"
        height="1200"
        decoding="async"
        onLoad={() => ScrollTrigger.refresh()}
        className={`hero-poster pointer-events-none absolute inset-0 h-full w-full object-fill transition-opacity duration-700 motion-reduce:transition-none ${
          status === "live" ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
  // Separate box so the alien poster does not inherit the moon's intro scale.
  const alienPoster = (
    <div
      ref={alienBoxRef}
      className={posterBoxClass}
      style={posterBoxStyle}
    >
      <img
        src={alienPosterUrl}
        alt=""
        aria-hidden="true"
        width="1200"
        height="1200"
        decoding="async"
        className={`hero-poster pointer-events-none absolute object-fill transition-opacity duration-700 motion-reduce:transition-none ${
          status === "live" ? "opacity-0" : "opacity-100"
        }`}
        style={{
          width: alienSide,
          height: alienSide,
          left: `calc(50% + var(--moon-r) * ${alienOff.dx} - ${alienSide} / 2)`,
          top: `calc(50% - var(--moon-r) * ${alienOff.dy} - ${alienSide} / 2)`,
        }}
      />
    </div>
  );
  const poster = (
    <>
      {moonPoster}
      {alienPoster}
    </>
  );

  return (
    <section
      ref={sectionRef}
      id="hero"
      data-snap-section
      data-snap-label="Hero"
      tabIndex={-1}
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[calc(100svh-var(--nav-h))] w-full flex-col justify-center overflow-x-clip outline-none"
    >
      {/* Stage for the planet poster (desktop; column mode puts it in the slot). */}
      {wrap && (
        <div
          data-stage
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          {poster}
        </div>
      )}
      {wrap ? (
        <div className="relative z-10 min-h-[calc(100svh-var(--nav-h))] w-full">
          <div aria-hidden="true" className="hero-moon-float" />
          <div style={{ height: "var(--wrap-pt, 4rem)" }} />
          <div ref={textRef} className="pb-16 pl-12 pr-4">
            <p
              data-intro
              className="mb-6 text-sm font-medium uppercase tracking-widest text-accent"
            >
              Game Developer &amp; 3D Artist
            </p>
            <SplitHeading
              as="h1"
              id="hero-heading"
              trigger="none"
              text="Artist’s eye. Engineer’s mind"
              className="mb-6 wrap-break-word font-display leading-[1.02] tracking-tight text-text"
              style={{
                fontSize: `clamp(2.75rem, calc(var(--moon-r) * ${HERO_H1_RADIUS_RATIO}), 6rem)`,
              }}
            />
            <p data-intro className="max-w-xl text-base text-muted sm:text-lg">
              I’m Himar, a 3D artist who codes. From modeling and texturing to shaders and gameplay,
              I bridge the gap between art and engineering so ideas make it into the game intact.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex w-full flex-col">
          <div
            ref={textRef}
            data-hero-text
            className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-8 sm:px-8"
          >
            <p
              data-intro
              className="text-sm font-medium uppercase tracking-widest text-accent"
            >
              Game Developer &amp; 3D Artist
            </p>
            <SplitHeading
              as="h1"
              id="hero-heading"
              trigger="none"
              text="Artist’s eye. Engineer’s mind"
              className="max-w-3xl wrap-break-word font-display text-5xl leading-[1.02] tracking-tight text-text sm:text-6xl md:text-8xl"
            />
            <p data-intro className="max-w-xl text-base text-muted sm:text-lg">
              I’m Himar, a 3D artist who codes. From modeling and texturing to shaders and gameplay,
              I bridge the gap between art and engineering so ideas make it into the game intact.
            </p>
          </div>
          <div
            aria-hidden="true"
            className="hero-moon-slot pointer-events-none relative w-full"
            style={{
              height: "calc(2 * var(--moon-r))",
              marginTop: HERO_COLUMN_GAP_PX,
              marginBottom: HERO_COLUMN_BOTTOM_PX,
            }}
          >
            {poster}
          </div>
        </div>
      )}
    </section>
  );
}
