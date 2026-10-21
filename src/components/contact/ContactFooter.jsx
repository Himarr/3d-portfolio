import { socialLinks } from "../../data/socialLinks.js";
import IconMask from "../IconMask.jsx";

const year = new Date().getFullYear();

// Footer inside the Contact section (FR-26). Plain <footer> inside a <section>
// is not exposed as a second contentinfo landmark, so no explicit role is set.
export default function ContactFooter() {
  return (
    <footer className="mt-auto shrink-0 border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-8">
        <p className="text-base text-muted">© {year} Himar</p>
        <ul aria-label="Social links" className="flex flex-wrap -mx-3">
          {socialLinks.map((link) => (
            <li key={link.id}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-sm px-3 text-base text-muted hover:text-text focus-visible:bg-surface focus-visible:text-text active:text-accent transition-colors duration-200 motion-reduce:transition-none"
              >
                <IconMask src={link.icon} className="size-5" />
                {link.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
