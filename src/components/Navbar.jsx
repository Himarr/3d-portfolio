import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { NAV_MENU_BREAKPOINT_PX } from "../lib/navConfig.js";
import NavMenuToggle from "./NavMenuToggle.jsx";

// Hover: text brightens and an underline appears. Focus-visible: ring from the
// global :focus-visible rule plus a tinted background. Pressed: accent colour.
const itemBase =
  "inline-flex min-h-11 items-center rounded-sm px-3 text-sm uppercase tracking-widest underline decoration-transparent decoration-1 underline-offset-8 transition-[color,text-decoration-color,background-color] duration-200 ease-out hover:text-text hover:decoration-accent focus-visible:bg-surface focus-visible:text-text active:text-accent motion-reduce:transition-none";

const brandClass =
  "inline-flex min-h-11 items-center rounded-sm font-display text-2xl tracking-tight text-text transition-colors duration-200 ease-out hover:text-accent focus-visible:bg-surface active:text-rim motion-reduce:transition-none";

const linkClass = `${itemBase} text-muted`;

// Active page: brighter text, semibold weight and a warm 2px underline, so the
// state does not rely on colour alone.
const pageLinkClass = ({ isActive }) =>
  `${itemBase} ${
    isActive
      ? "font-semibold text-text decoration-rim decoration-2 hover:decoration-rim"
      : "text-muted"
  }`;

const MENU_ID = "nav-menu";
const panelItem = "w-full";

export default function Navbar() {
  const headerRef = useRef(null);
  const buttonRef = useRef(null);
  const location = useLocation();
  const desktop = useMediaQuery(`(min-width: ${NAV_MENU_BREAKPOINT_PX}px)`);
  // Menu is open only for the location it was opened at, so any route or hash
  // change closes it without an effect.
  const [openAt, setOpenAt] = useState(null);
  const isOpen = !desktop && openAt === location.key;

  // Closing via a link: the panel gets hidden, so move focus to the toggle
  // (never leave it on body). preventScroll keeps snap scrolling intact.
  const close = () => {
    setOpenAt(null);
    buttonRef.current?.focus({ preventScroll: true });
  };

  // Widening to desktop clears the stored open state.
  useEffect(() => {
    if (desktop && openAt !== null) {
      // Resetting state in response to an external media query change.
      // oxlint-disable-next-line react/set-state-in-effect
      setOpenAt(null);
    }
  }, [desktop, openAt]);

  // Escape closes the open menu and returns focus to the toggle.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      setOpenAt(null);
      buttonRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // Publish the header's border-box height as --nav-h on <html> so the Hero can
  // fill the rest of the screen. Observer callback only; removed on cleanup.
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;
    const root = document.documentElement;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const box = entry.borderBoxSize && entry.borderBoxSize[0];
      const h = box ? box.blockSize : el.getBoundingClientRect().height;
      root.style.setProperty("--nav-h", `${h}px`);
    });
    ro.observe(el, { box: "border-box" });
    return () => {
      ro.disconnect();
      root.style.removeProperty("--nav-h");
    };
  }, []);

  const pageClass = (extra) => (state) =>
    `${pageLinkClass(state)} ${extra}`;

  return (
    <header
      ref={headerRef}
      className={`border-b border-line bg-ink ${desktop ? "" : "relative"}`}
    >
      <nav
        aria-label="Main"
        className={`mx-auto flex w-full max-w-5xl items-center justify-between gap-x-4 px-4 py-2 sm:px-8 ${
          desktop ? "" : "flex-nowrap"
        }`}
      >
        <Link to="/" className={brandClass} onClick={close}>
          Himar
        </Link>
        {desktop ? (
          <div className="flex items-center -mx-3">
            <NavLink to="/" end className={pageLinkClass}>
              Home
            </NavLink>
            <Link to="/#projects" className={linkClass}>
              Projects
            </Link>
            <Link to="/#about" className={linkClass}>
              About
            </Link>
            <Link to="/#contact" className={linkClass}>
              Contact
            </Link>
            <NavLink to="/viewer" className={pageLinkClass}>
              3D Viewer
            </NavLink>
          </div>
        ) : (
          <NavMenuToggle
            open={isOpen}
            controlsId={MENU_ID}
            buttonRef={buttonRef}
            onToggle={() => setOpenAt(isOpen ? null : location.key)}
          />
        )}
      </nav>
      {!desktop && (
        <div
          id={MENU_ID}
          hidden={!isOpen}
          className="absolute inset-x-0 top-full z-30 border-b border-line bg-ink px-4 pb-2 sm:px-8"
        >
          <NavLink to="/" end className={pageClass(panelItem)} onClick={close}>
            Home
          </NavLink>
          <Link to="/#projects" className={`${linkClass} ${panelItem}`} onClick={close}>
            Projects
          </Link>
          <Link to="/#about" className={`${linkClass} ${panelItem}`} onClick={close}>
            About
          </Link>
          <Link to="/#contact" className={`${linkClass} ${panelItem}`} onClick={close}>
            Contact
          </Link>
          <NavLink to="/viewer" className={pageClass(panelItem)} onClick={close}>
            3D Viewer
          </NavLink>
        </div>
      )}
    </header>
  );
}
