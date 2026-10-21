export default function ViewerPage() {
  return (
    <section
      aria-labelledby="viewer-heading"
      className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col justify-center gap-4 px-4 py-16 sm:px-8 md:py-24"
    >
      <p className="text-xs uppercase tracking-widest text-accent">
        Interactive models
      </p>
      <h1
        id="viewer-heading"
        className="wrap-break-word font-display text-5xl leading-tight tracking-tight text-text sm:text-6xl"
      >
        3D Viewer
      </h1>
      <p className="max-w-xl border-t border-line pt-4 text-base text-muted sm:text-lg">
        Coming soon
      </p>
    </section>
  );
}
