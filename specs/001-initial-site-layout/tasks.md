# Tasks: 001 Initial Site Layout

Markers: `- [ ]` pending, `- [~]` built, `- [x]` verified.
UI tasks: use the frontend-design skill for layout composition, spacing, hierarchy and responsive behavior with Tailwind utilities in className only. No custom fonts, images, animations, theming or logos. If the skill conflicts with a spec non-goal, the spec wins; note it in the task result.

- [x] T-01 Scaffold Vite React app and install dependencies
  - Files: `package.json`, `vite.config.js`, `index.html`, `eslint.config.js`, `.gitignore`, `src/main.jsx`, `src/App.jsx`
  - Do: In repo root, scaffold Vite + React (JavaScript) non-interactively (`npm create vite@latest . -- --template react`) or write files manually; keep existing `CLAUDE.md`, `specs/`, `.claude/`. Run `npm install`, then `npm install react-router-dom three`. Delete template leftovers (`src/App.css`, demo assets, counter code). Leave `App.jsx` as a minimal component rendering nothing harmful.
  - Covers: FR-1, AC-1, AC-2
  - Done when: `npm install` succeeds; `package.json` lists react, react-dom, react-router-dom, three; `npm run dev` serves a page with no console errors; `npm run lint` is clean.

- [x] T-02 Configure Tailwind CSS v4
  - Files: `package.json`, `vite.config.js`, `src/index.css`, `src/main.jsx`
  - Do: `npm install -D tailwindcss @tailwindcss/vite`; add the `tailwindcss()` plugin to `vite.config.js`; set `src/index.css` to `@import "tailwindcss";` and import it in `main.jsx`. If v4 fails, fall back to v3 + postcss and note it in the result. Temporarily verify a utility (e.g. `p-4 bg-gray-100`) takes effect, then keep or remove it.
  - Covers: FR-1, AC-2
  - Done when: `package.json` lists tailwindcss; a Tailwind utility class visibly applies in the browser; `npm run build` exits 0.

- [x] T-03 Build Hero section component
  - Files: `src/components/sections/Hero.jsx`
  - Do: Use the frontend-design skill. Create `<section id="hero" aria-labelledby="hero-heading">` with the page's only `h1` (id `hero-heading`) and generic placeholder text. Tailwind classes only; responsive, no horizontal overflow 320-1920px.
  - Covers: FR-6, FR-7, AC-6, AC-11, AC-13
  - Done when: file exports default component; renders a `section` with one `h1` and placeholder text; `npm run lint` clean.

- [x] T-04 Build Projects section component
  - Files: `src/components/sections/Projects.jsx`
  - Do: Use the frontend-design skill. Create `<section id="projects" aria-labelledby="projects-heading">` with `h2` and a list/grid container mapping an inline placeholder array of at least 3 items. Tailwind classes only; responsive.
  - Covers: FR-7, FR-8, AC-6, AC-7, AC-11, AC-16
  - Done when: rendered section has id `projects`, an `h2`, and at least 3 placeholder items; lint clean.

- [x] T-05 Build AboutMe section component
  - Files: `src/components/sections/AboutMe.jsx`
  - Do: Use the frontend-design skill. Create `<section id="about" aria-labelledby="about-heading">` with `h2` "About Me" and placeholder bio text. Tailwind classes only; responsive.
  - Covers: FR-7, AC-6, AC-11, AC-16
  - Done when: rendered section has id `about`, an `h2`, and placeholder text; lint clean.

- [x] T-06 Build TechStack section component
  - Files: `src/components/sections/TechStack.jsx`
  - Do: Use the frontend-design skill. Create `<section id="tech-stack" aria-labelledby="tech-stack-heading">` with `h2` and a list container mapping an inline placeholder array of at least 4 items. Tailwind classes only; responsive.
  - Covers: FR-7, FR-9, AC-6, AC-7, AC-11, AC-16
  - Done when: rendered section has id `tech-stack`, an `h2`, and at least 4 placeholder items; lint clean.

- [x] T-07 Build HomePage and ViewerPage
  - Files: `src/pages/HomePage.jsx`, `src/pages/ViewerPage.jsx`
  - Do: Use the frontend-design skill. `HomePage` composes Hero, Projects, AboutMe, TechStack in that order (no `main` element inside). `ViewerPage` renders an `h1` "3D Viewer" and the text "Coming soon"; no Three.js import. Tailwind classes only.
  - Covers: FR-5, FR-6, AC-5, AC-6, AC-13
  - Done when: HomePage DOM order is Hero, Projects, About, Tech Stack; each page has exactly one `h1`; lint clean.

- [x] T-08 Build Navbar component
  - Files: `src/components/Navbar.jsx`
  - Do: Use the frontend-design skill. Render `<header><nav>` with items in this order: "Himar" (`Link` to `/`, text only, no img), "Home" (`NavLink` to `/` with `end`), "Projects" (`Link` to `/#projects`), "About" (`Link` to `/#about`), "Tech Stack" (`Link` to `/#tech-stack`), "3D Viewer" (`NavLink` to `/viewer`). Use plain `Link` for in-page links so they never get `aria-current`. Use `flex flex-wrap` with gaps so all items remain visible at 320px; no hamburger. Keep default focus outline visible.
  - Covers: FR-2, FR-3, FR-4, FR-10, FR-11, FR-12, FR-13, FR-16, AC-3, AC-8, AC-9, AC-10, AC-14, AC-15
  - Done when: navbar DOM order matches FR-16; Home has `aria-current="page"` only on `/`, 3D Viewer only on `/viewer`; no `img` in navbar; lint clean.

- [x] T-09 Create ScrollToHash component
  - Files: `src/components/ScrollToHash.jsx`
  - Do: Component returning null that uses `useLocation` and `useEffect` keyed on `location.key` (and hash): if `location.hash` is set, call `document.getElementById(hash.slice(1))?.scrollIntoView()`. Runs after route render so the target exists.
  - Covers: FR-14, FR-15, AC-16, AC-17
  - Done when: file exports default component; lint clean (behavior verified in T-11).

- [x] T-10 Wire App layout, routes and router
  - Files: `src/App.jsx`, `src/main.jsx`
  - Do: Use the frontend-design skill for the shell layout (page container, spacing). `main.jsx` renders `<BrowserRouter><App/></BrowserRouter>`. `App` renders `<Navbar />`, `<ScrollToHash />`, then a single `<main>` containing `<Routes>`: `/` -> HomePage, `/viewer` -> ViewerPage. Remove any remaining template code.
  - Covers: FR-2, FR-4, FR-10, FR-14, FR-15, AC-1, AC-3, AC-4, AC-5, AC-14, AC-16, AC-17
  - Done when: `npm run dev` loads `/` and `/viewer` with navbar on both, a single `main` per page, no console errors; Home, Himar and 3D Viewer navigate without full reload.

- [x] T-11 Verify behavior in browser (navigation, hash scroll, responsive, keyboard)
  - Files: none (fix defects in the relevant files above only if found)
  - Do: Run dev server and check: navbar on both routes; Himar/Home return to `/`; 3D Viewer goes to `/viewer` without reload; `aria-current` on `/` and `/viewer`, never on in-page links; on `/` and `/viewer`, Projects/About/Tech Stack scroll the right section into view (on `/viewer` navigating to `/`); repeat clicks still scroll; no horizontal scrollbar at 320, 768, 1920 px with all items clickable; Tab/Enter activates every navbar item; one `h1` per page; DOM order of sections and navbar. Report results per AC.
  - Covers: AC-3, AC-4, AC-5, AC-6, AC-8, AC-9, AC-10, AC-13, AC-14, AC-15, AC-16, AC-17
  - Done when: every listed check passes and is reported; any defect is fixed and rechecked.

- [x] T-12 Final build and lint check
  - Files: none (fix warnings in project code only if found)
  - Do: Run `npm run lint` and `npm run build`; confirm each section component and Navbar are in separate files per plan; confirm `three` is not imported anywhere in `src/`.
  - Covers: FR-1, AC-1, AC-2, AC-11, AC-12
  - Done when: `npm run lint` has no warnings/errors; `npm run build` exits 0 without warnings from project code; file layout matches plan.

## AC coverage
AC-1: T-01, T-10, T-12 | AC-2: T-01, T-02, T-12 | AC-3: T-08, T-10, T-11 | AC-4: T-10, T-11 | AC-5: T-07, T-10, T-11 | AC-6: T-03 to T-07, T-11 | AC-7: T-04, T-06 | AC-8: T-08, T-11 | AC-9: T-08, T-11 | AC-10: T-08, T-11 | AC-11: T-03 to T-06, T-12 | AC-12: T-12 | AC-13: T-03, T-07, T-11 | AC-14: T-08, T-10, T-11 | AC-15: T-08, T-11 | AC-16: T-04 to T-06, T-09, T-10, T-11 | AC-17: T-09, T-10, T-11
