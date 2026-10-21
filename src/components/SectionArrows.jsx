import { useLayoutEffect, useRef } from "react";
import { useSnapState } from "../hooks/useSnapState.js";
import { useSectionScroll } from "../hooks/useSectionScroll.js";
import { snapController } from "../lib/snapController.js";
import { snapStore } from "../lib/snapStore.js";
import { gsap } from "../lib/gsap.js";
import { heroIntro } from "../lib/heroIntro.js";
import {
  SECTION_ARROW_OFFSET_PX,
  SECTION_ARROW_SIZE_PX,
} from "../lib/arrowConfig.js";
// Provenance: src/assets/icons/arrow-down.svg is a placeholder single-colour
// chevron (see README.md there). It is applied as a CSS mask (.arrow-icon), so
// any replacement SVG using currentColor works with no code change. The up
// arrow is the same file rotated 180 degrees; there is no second asset.
import arrowUrl from "../assets/icons/arrow-down.svg";

const ICON_STYLE = { "--arrow-icon-url": `url("${arrowUrl}")` };
const BOX_STYLE = {
  width: SECTION_ARROW_SIZE_PX,
  height: SECTION_ARROW_SIZE_PX,
};

// Only transform/opacity animate; visibility flips after the fade (delay) so a
// hidden arrow is also out of the accessibility tree and not focusable.
const BUTTON_BASE =
  "pointer-events-auto z-20 flex items-center justify-center rounded-full text-muted transition-[transform,opacity,visibility] duration-200 ease-out hover:bg-surface hover:text-text focus-visible:bg-surface focus-visible:text-text active:scale-90 active:text-accent motion-reduce:transition-none";
const BUTTON_SHOWN = "visible opacity-100 delay-0";
const BUTTON_HIDDEN = "invisible opacity-0 [transition-delay:0s,0s,200ms]";
const ICON_BASE =
  "arrow-icon block h-6 w-6 transition-transform duration-300 ease-out motion-reduce:transition-none";

// Fixed bottom-centre "next" and top-centre "previous" section arrows.
export default function SectionArrows() {
  const { active, index, labels } = useSnapState();
  const scrollToSection = useSectionScroll();
  // Which arrow ("down" | "up") holds focus, or null.
  const focusedArrow = useRef(null);
  const downWrapRef = useRef(null);

  // Focus handoff (FR-30, AC-23). This is the ONLY focus() call in the snap
  // code. When the focused arrow becomes hidden (inert) or the arrows are
  // removed (snapping turned off), move focus to the destination section so it
  // never falls back to <body>. preventScroll: no scrolling beyond the snap.
  // The cleanup runs on the commit that changes [active, index], so it reads
  // the new state from the store.
  useLayoutEffect(
    () => () => {
      const which = focusedArrow.current;
      if (!which) return;
      const snap = snapStore.getSnapshot();
      const last = snap.labels.length - 1;
      const hidden =
        !snap.active ||
        (which === "down" ? snap.index >= last : snap.index <= 0);
      if (!hidden) return;
      focusedArrow.current = null;
      const section = snapController.getSection(snap.index);
      if (section) section.focus({ preventScroll: true });
    },
    [active, index],
  );

  // Hero intro (FR-25, FR-27): the down arrow is the last item of the text
  // sequence. The wrapper is the GSAP target; the button keeps its CSS
  // transitions. Nothing animates once the intro is finished or absent.
  useLayoutEffect(() => {
    const el = downWrapRef.current;
    const tl = heroIntro.timeline;
    if (!el || !tl || tl.progress() >= 1) return undefined;
    const ctx = gsap.context(() => {
      tl.from(el, { opacity: 0, y: 16, duration: 0.6 }, "text+=1.4");
    });
    return () => ctx.revert();
  }, [active]);

  const onArrowFocus = (which) => () => {
    focusedArrow.current = which;
  };
  // A blur caused by DOM removal leaves the flag set so the handoff can run.
  const onArrowBlur = (e) => {
    if (e.currentTarget.isConnected) focusedArrow.current = null;
  };

  if (!active) return null;

  const last = labels.length - 1;
  const showDown = index < last;
  const showUp = index > 0;

  // Relative to the store index (destination of a running move), so repeated
  // clicks walk one section each and never overshoot.
  const step = (dir) => {
    const { index: current, labels: all } = snapStore.getSnapshot();
    const next = current + dir;
    if (next < 0 || next > all.length - 1) return;
    scrollToSection(snapController.getSection(next));
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ bottom: `max(${SECTION_ARROW_OFFSET_PX}px, env(safe-area-inset-bottom))` }}
      >
        <div ref={downWrapRef}>
        <button
          type="button"
          inert={!showDown}
          aria-label={showDown ? `Next section: ${labels[index + 1]}` : undefined}
          onClick={() => step(1)}
          onFocus={onArrowFocus("down")}
          onBlur={onArrowBlur}
          className={`${BUTTON_BASE} ${showDown ? BUTTON_SHOWN : BUTTON_HIDDEN}`}
          style={BOX_STYLE}
        >
          <span
            aria-hidden="true"
            className={`${ICON_BASE} ${showDown ? "rotate-0" : "rotate-180"}`}
            style={ICON_STYLE}
          />
        </button>
        </div>
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: `max(${SECTION_ARROW_OFFSET_PX}px, env(safe-area-inset-top))` }}
      >
        <button
          type="button"
          inert={!showUp}
          aria-label={showUp ? `Previous section: ${labels[index - 1]}` : undefined}
          onClick={() => step(-1)}
          onFocus={onArrowFocus("up")}
          onBlur={onArrowBlur}
          className={`${BUTTON_BASE} ${showUp ? BUTTON_SHOWN : BUTTON_HIDDEN}`}
          style={BOX_STYLE}
        >
          <span
            aria-hidden="true"
            className={`${ICON_BASE} ${showUp ? "rotate-180" : "rotate-0"}`}
            style={ICON_STYLE}
          />
        </button>
      </div>
    </div>
  );
}
