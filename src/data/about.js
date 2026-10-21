// About section image slot (FR-19, AC-19).
//
// Shape when set:
// {
//   src: <imported image>,   // ratio 4:5 (ABOUT_IMAGE_ASPECT), cropped by cover
//   alt: "Descriptive text",  // required
//   width: 1200,
//   height: 1500,
// }
//
// Provenance rule: add a comment above the entry (source, author, licence or
// "own work"), FR-33. Example (commented out, not used):
//
// import aboutPhoto from "../assets/img/about.webp";
// // Provenance: <source, author, licence or own work>
// export const aboutImage = {
//   src: aboutPhoto,
//   alt: "Short description of the photo",
//   width: 1200,
//   height: 1500,
// };

// Placeholder until the owner supplies an image. The About section renders a
// fixed-ratio placeholder when this is null.
export const aboutImage = null;
