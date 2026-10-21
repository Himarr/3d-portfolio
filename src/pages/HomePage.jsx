import { lazy, Suspense, useRef, useState } from "react";
import Hero from "../components/sections/Hero";
import Projects from "../components/sections/Projects";
import AboutMe from "../components/sections/AboutMe";
import TechStack from "../components/sections/TechStack";
import Contact from "../components/sections/Contact";
import SectionArrows from "../components/SectionArrows";
import { CanvasStatusContext } from "../context/canvasStatus.js";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion.js";
import CanvasErrorBoundary from "../three/CanvasErrorBoundary.jsx";

const PageCanvas = lazy(() => import("../three/PageCanvas.jsx"));

export default function HomePage() {
  const [status, setStatus] = useState("idle");
  const pageRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <CanvasStatusContext.Provider value={status}>
      <div ref={pageRef} className="relative isolate">
        {!reducedMotion && (
          <CanvasErrorBoundary onError={() => setStatus("fallback")}>
            <Suspense fallback={null}>
              <PageCanvas pageRef={pageRef} onStatus={setStatus} />
            </Suspense>
          </CanvasErrorBoundary>
        )}
        <Hero />
        <Projects />
        <AboutMe />
        <TechStack />
        <Contact />
        <SectionArrows />
      </div>
    </CanvasStatusContext.Provider>
  );
}
