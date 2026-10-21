// Shared icon mask (spec 006 FR-7, FR-20, FR-27, D-13). The `.icon-mask` class
// lands in `index.css` in T-26; the shape comes from the SVG alpha channel and
// the colour from `currentColor`. Stateless: renders one decorative span.
export default function IconMask({ src, className }) {
  return (
    <span
      aria-hidden="true"
      className={`icon-mask ${className ?? ""}`}
      style={{ "--icon-url": `url("${src}")` }}
    />
  );
}
