import { useRef } from "react";
import SplitHeading from "../SplitHeading.jsx";
import ContactForm from "../contact/ContactForm.jsx";
import ContactFooter from "../contact/ContactFooter.jsx";
import { useSectionReveal } from "../../hooks/useSectionReveal.js";
import { safeBandStyle } from "../../lib/sectionLayout.js";

export default function Contact() {
  const ref = useRef(null);
  useSectionReveal(ref);

  return (
    <section
      ref={ref}
      id="contact"
      aria-labelledby="contact-heading"
      data-snap-section
      data-snap-label="Contact"
      tabIndex={-1}
      style={safeBandStyle}
      className="flex w-full flex-col outline-none snap:min-h-svh snap:pt-(--safe-band)"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-16 sm:px-8 snap:py-0">
        <div className="grid w-full items-center gap-8 md:grid-cols-[1fr_2fr] md:gap-12">
          <div data-reveal>
            <p className="mb-3 text-xs uppercase tracking-widest text-accent">
              Get in touch
            </p>
            <SplitHeading
              as="h2"
              id="contact-heading"
              text="Contact"
              className="wrap-break-word font-display text-4xl leading-tight tracking-tight text-text sm:text-5xl snap:text-4xl"
            />
            <p className="mt-3 text-base text-muted">
              Send a message about a project or a collaboration.
            </p>
          </div>
          <div data-reveal>
            <ContactForm />
          </div>
        </div>
      </div>
      <ContactFooter />
    </section>
  );
}
