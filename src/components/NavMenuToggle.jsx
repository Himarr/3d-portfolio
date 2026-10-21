// Hamburger toggle for the mobile menu (spec 005 FR-35). Stateless: the
// Navbar owns `open`. Three CSS spans; the outer two rotate into an X.
const BAR =
  "absolute left-0 block h-0.5 w-6 bg-current transition-[translate,rotate,opacity] duration-200 ease-out motion-reduce:transition-none";

export default function NavMenuToggle({ open, controlsId, onToggle, buttonRef }) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label="Menu"
      aria-expanded={open}
      aria-controls={controlsId}
      onClick={onToggle}
      className="inline-flex size-11 min-h-11 min-w-11 items-center justify-center rounded-sm text-text transition-colors duration-200 ease-out hover:text-accent focus-visible:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:text-rim motion-reduce:transition-none"
    >
      <span aria-hidden="true" className="relative block size-6">
        <span className={`${BAR} top-1 ${open ? "translate-y-[7px] rotate-45" : ""}`} />
        <span className={`${BAR} top-[11px] ${open ? "opacity-0" : "opacity-100"}`} />
        <span className={`${BAR} top-[18px] ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
      </span>
    </button>
  );
}
