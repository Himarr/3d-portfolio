# 001 Initial Site Layout

## Summary
Set up the initial portfolio website and its basic structural layout: a navbar and a main page made of Hero, Projects, About Me and Tech Stack sections. The navbar shows the name "Himar", a Home button, in-page links to Projects, About and Tech Stack, and a button for a future 3D viewer page. Layout only; visual design is decided later.

## Goals
- A runnable React + Tailwind CSS site (Three.js available as a dependency for later work).
- Persistent navbar with the name "Himar", navigation to the main page and the 3D viewer page, and links to the Projects, About and Tech Stack sections.
- Main page with four ordered sections: Hero, Projects, About Me, Tech Stack.
- Structure that is easy to restyle and fill with content later.

## Non-goals
- Visual design (colors, typography, logo/graphic branding, animations, theming).
- Logo or image in the navbar (text name only).
- Scroll-spy / highlighting of the section currently in view.
- The 3D viewer page content and any Three.js rendering.
- Real content (project data, bio text, tech lists, images); placeholders only.
- Backend, CMS, contact form, analytics, SEO tuning, i18n.
- Mobile menu design polish beyond basic usability (see NFR-2).

## Users/Use cases
- Visitor (recruiter, client, peer) lands on the site and sees what the owner does (Hero), browses work (Projects), learns about the owner (About Me) and sees skills (Tech Stack).
- Visitor clicks the 3D viewer button to reach the 3D viewer page (placeholder for now).
- Visitor clicks the home button to return to the main page from anywhere.
- Visitor clicks Projects, About or Tech Stack in the navbar to jump to that section, including from the 3D viewer page.
- Owner later fills in content and applies design on top of this structure.

## Functional requirements
- FR-1: The site runs locally as a React application styled with Tailwind CSS, with Three.js listed as a dependency.
- FR-2: A navbar is displayed at the top of every page.
- FR-3: The navbar contains a button/link labeled "Home" that navigates to the main page.
- FR-4: The navbar contains a button/link labeled "3D Viewer" that navigates to a separate 3D viewer route.
- FR-5: The 3D viewer route renders a minimal placeholder (e.g. heading "3D Viewer" and "Coming soon"); no Three.js scene.
- FR-6: The main page renders, in order, four sections: Hero, Projects, About Me, Tech Stack.
- FR-7: Each section is a distinct landmark element with a heading and placeholder content indicating its purpose.
- FR-8: Projects section contains a placeholder container for a list/grid of project items (at least 3 placeholder items).
- FR-9: Tech Stack section contains a placeholder container for a list of technologies (at least 4 placeholder items).
- FR-10: Navigating between Home and 3D Viewer does not trigger a full page reload (client-side routing).
- FR-11: The current page's navbar button is visually indicated as active in a structural way (e.g. `aria-current="page"`), without design decisions. Applies to "Home" (on `/`) and "3D Viewer" (on `/viewer`); in-page links never get `aria-current="page"`.
- FR-12: The navbar displays the text "Himar" as branding (no logo or image). It is a link to the main page.
- FR-13: The navbar contains in-page links labeled "Projects", "About" and "Tech Stack" that target the Projects, About Me and Tech Stack sections respectively (each section has a stable id).
- FR-14: On the main page, activating an in-page link scrolls to the target section without a full page reload.
- FR-15: On the 3D viewer page, activating an in-page link navigates to the main page and scrolls to the target section.
- FR-16: Navbar order: "Himar", "Home", "Projects", "About", "Tech Stack", "3D Viewer".

## Non-functional requirements
- NFR-1: Semantic HTML (`header`/`nav`, `main`, `section`, headings in logical order, one `h1` per page).
- NFR-2: Layout does not break horizontally from 320px to 1920px width; all navbar items remain reachable at all widths.
- NFR-3: Navbar buttons and links are keyboard accessible with visible focus (browser default acceptable).
- NFR-4: Components are separated per section/navbar so each can be edited independently.
- NFR-5: Production build completes without errors or lint/console warnings from project code.

## Acceptance criteria
- AC-1: Install and start dev server succeed; the home page loads in a browser with no console errors. (FR-1, NFR-5)
- AC-2: `package.json` lists react, tailwindcss and three; Tailwind utility classes take effect in the app. (FR-1)
- AC-3: Navbar is visible on both the main page and the 3D viewer page. (FR-2)
- AC-4: Clicking "Home" from the 3D viewer page shows the main page at its root route. (FR-3, FR-10)
- AC-5: Clicking "3D Viewer" shows the placeholder page at a dedicated route without a full reload. (FR-4, FR-5, FR-10)
- AC-6: Main page shows Hero, Projects, About Me, Tech Stack in that DOM order, each as a `section` with a heading. (FR-6, FR-7, NFR-1)
- AC-7: Projects shows at least 3 placeholder items; Tech Stack shows at least 4. (FR-8, FR-9)
- AC-8: On `/`, "Home" has `aria-current="page"` and "3D Viewer" does not; on `/viewer` the reverse. In-page links never have it. (FR-11)
- AC-9: No horizontal scrollbar at 320px, 768px and 1920px viewport widths; all navbar items visible/reachable and clickable. (NFR-2)
- AC-10: All navbar items are reachable and activatable via Tab and Enter. (NFR-3)
- AC-11: Each section and the navbar live in their own component file. (NFR-4)
- AC-12: Production build command exits with code 0. (NFR-5)
- AC-13: Each page has exactly one `h1`. (NFR-1)
- AC-14: Navbar shows the text "Himar" (no `img`/logo); clicking it shows the main page at `/`. (FR-12)
- AC-15: Navbar items appear in the order "Himar", "Home", "Projects", "About", "Tech Stack", "3D Viewer". (FR-16)
- AC-16: On `/`, clicking "Projects", "About" or "Tech Stack" scrolls the matching section into view, with no full reload; the matching section id exists. (FR-13, FR-14, FR-10)
- AC-17: On `/viewer`, clicking "Projects", "About" or "Tech Stack" navigates to `/` and the matching section is scrolled into view. (FR-15)

## Assumptions
- Build tool is Vite with JavaScript (not TypeScript) and npm as package manager (confirmed by owner).
- Client-side routing via React Router; routes `/` (main) and `/viewer` (3D viewer). `/viewer` is just the URL path of the 3D viewer page (confirmed).
- Nav labels are "Himar" (branding), "Home", "Projects", "About", "Tech Stack", "3D Viewer".
- Hero shows the `h1`; other sections use `h2`.
- Section ids: `projects`, `about`, `tech-stack`. Scrolling may be instant or smooth (a design decision).
- Navbar is static/top-of-page; sticky behavior is a design decision for later. If sticky is added later, scroll offset handling is out of scope here.
- Placeholder text is generic English.

## Open questions
- None.

## Resolved decisions
- In-page anchor links to Projects, About, Tech Stack: included in navbar (FR-13 to FR-15).
- Branding: text "Himar" only, no logo (FR-12).
- Tooling: Vite + npm.
- Viewer route: `/viewer`.
