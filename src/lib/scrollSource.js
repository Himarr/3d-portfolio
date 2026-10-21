// Scroll value that Lenis applied in the current gsap.ticker tick.
// Written by SmoothScrollProvider right after instance.raf(); read by the
// fixed canvas in the same frame (FR-39). Plain object, no React.
export const scrollSource = { y: 0 }
