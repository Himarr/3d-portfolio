// Plain mutable singleton: the moon's intro scale multiplier (1 = final size)
// and the alien's drop progress (1 = above the viewport, 0 = at rest).
// PageScene reads it every frame; GSAP drives it in the Hero intro (T-33).
export const moonIntro = { scale: 1, alienDrop: 0 };
