import { useEffect, useRef } from "react";

// Hero box for the viewport-fixed canvas: horizontal centre in viewport
// coordinates (no horizontal scroll), vertical centre in document coordinates
// (so the per-frame placement subtracts the current scroll), and its height.
// Layout reads happen only inside the observer callback, never per frame.
// ResizeObserver fires once on observe, so the initial measurement needs no
// separate call. Writes a ref only: no React re-render.
export function useHeroMetrics(pageRef) {
  const metrics = useRef({ cxVp: 0, cyDoc: 0, height: 0, inView: false });

  useEffect(() => {
    const page = pageRef.current;
    const hero = page?.querySelector("#hero");
    if (!hero) {
      metrics.current.inView = false;
      return undefined;
    }

    const m = metrics.current;

    // Moon anchor: the slot under the text below 1024 (column mode), else the Hero.
    const findAnchor = () => hero.querySelector(".hero-moon-slot") ?? hero;
    let anchor = findAnchor();

    const measure = () => {
      const rect = hero.getBoundingClientRect();
      const a = anchor === hero ? rect : anchor.getBoundingClientRect();
      m.cxVp = a.left + a.width / 2;
      m.cyDoc = a.top + window.scrollY + a.height / 2;
      m.height = rect.height;
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(hero);
    if (anchor !== hero) resizeObserver.observe(anchor);
    // Text block moves the slot without resizing it.
    let text = hero.querySelector("[data-hero-text]");
    if (text) resizeObserver.observe(text);

    // Re-attach when the layout mode flips (slot mounts or unmounts).
    const mutationObserver = new MutationObserver(() => {
      const next = findAnchor();
      if (next === anchor) return;
      if (anchor !== hero) resizeObserver.unobserve(anchor);
      if (text) resizeObserver.unobserve(text);
      anchor = next;
      text = hero.querySelector("[data-hero-text]");
      if (anchor !== hero) resizeObserver.observe(anchor);
      if (text) resizeObserver.observe(text);
      measure();
    });
    mutationObserver.observe(hero, { childList: true, subtree: true });
    resizeObserver.observe(page);
    // Navbar height changes move the Hero's document position.
    const header = document.querySelector("header");
    if (header) resizeObserver.observe(header);

    const intersectionObserver = new IntersectionObserver((entries) => {
      m.inView = entries[entries.length - 1].isIntersecting;
    });
    intersectionObserver.observe(hero);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [pageRef]);

  return metrics;
}
