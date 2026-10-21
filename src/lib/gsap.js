import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Single registration point. Import gsap and ScrollTrigger from here only.
gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }
