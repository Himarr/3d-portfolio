# Plan: 001 Initial Site Layout

## Approach
Greenfield (repo has no source yet). Scaffold a Vite + React (JavaScript) app in the repo root, add Tailwind CSS and three, add React Router with two routes (`/`, `/viewer`), and build one component per navbar/section. Structure only, with neutral Tailwind utilities for layout (flex/grid/responsive). Visual design is a non-goal in this spec, but see "UI work and the frontend-design skill".

## UI work and the frontend-design skill
Per owner instruction, every UI-related task (Navbar, Hero, Projects, AboutMe, TechStack, ViewerPage, App shell/layout) MUST be built following the `frontend-design` skill's guidance on distinctive, intentional visual design (typography, color, spacing, composition), not generic default styling.
Constraint: the spec's non-goals exclude visual design decisions (colors, typography, animations, theming, logo). Resolution for builders:
- Apply the frontend-design skill to layout composition, spacing, hierarchy and responsive behavior, expressed with Tailwind utilities.
- Keep styling in className strings only, centralized and easy to restyle; do not add custom fonts, images, animations, theming systems or logos.
- Never let styling break any FR/AC (semantics, `aria-current`, ids, order, no horizontal overflow 320-1920px).
- If the skill's guidance conflicts with a non-goal, the spec wins; note it in the task result.
Each UI task's "Do" in tasks.md should state: "use the frontend-design skill".

## Architecture / design decisions
- Vite + React JS + npm: confirmed in spec; fastest dev server, minimal config.
- Tailwind via `tailwindcss` + `@tailwindcss/vite` plugin (v4): no PostCSS config, one `@import "tailwindcss"` in CSS. (If v4 install fails, fall back to v3 + postcss; mention in task result.)
- React Router (`react-router-dom`) with `BrowserRouter`: client-side routing (FR-10). Use `NavLink` for Home and 3D Viewer: it sets `aria-current="page"` automatically (FR-11). Home link uses `end` so it is active only on `/`.
- In-page links (Projects/About/Tech Stack) are plain `Link` to `/#projects` etc., NOT `NavLink`, so they never get `aria-current` (FR-11). Brand "Himar" is a `Link` to `/`.
- Hash scrolling: React Router does not scroll to hashes itself. A small `ScrollToHash` component (uses `useLocation`, `useEffect`, `document.getElementById(hash).scrollIntoView()`) mounted inside the router handles both same-page (FR-14) and cross-page from `/viewer` (FR-15). Runs after route render, so the target exists. Re-triggers on `location.key` change so repeated clicks on the same link still scroll.
- Responsive navbar (NFR-2): `flex flex-wrap` with gap so all 6 items stay visible and reachable at 320px; no hamburger (polish out of scope).
- Layout: `App` renders `<Navbar />`, `<ScrollToHash />`, then `<main>` via `<Routes>`. Navbar in `<header><nav>`; pages render content inside the shared `<main>` (Layout component) so there is a single `main`.
- Headings: Hero has the only `h1` on `/`; other sections `h2`. ViewerPage has its own `h1`.
- Placeholder data: small inline arrays in Projects and TechStack components (map to items), easy to replace.
- Three.js: dependency only, not imported anywhere.

## Files to create/modify
Create (repo root `C:\Users\himar\Projects\3d-portfolio`):
- `package.json`, `vite.config.js`, `index.html`, `eslint.config.js` (from Vite react template), `.gitignore`
- `src/main.jsx`: render `<BrowserRouter><App/></BrowserRouter>`
- `src/index.css`: `@import "tailwindcss";`
- `src/App.jsx`: layout + routes
- `src/components/Navbar.jsx`
- `src/components/ScrollToHash.jsx`
- `src/components/sections/Hero.jsx` (id `hero`)
- `src/components/sections/Projects.jsx` (id `projects`)
- `src/components/sections/AboutMe.jsx` (id `about`)
- `src/components/sections/TechStack.jsx` (id `tech-stack`)
- `src/pages/HomePage.jsx`: composes the four sections in order
- `src/pages/ViewerPage.jsx`: h1 "3D Viewer" + "Coming soon"
Modify: none existing. Remove template leftovers (`App.css`, demo assets, counter code).

## Data / interfaces
- Routes: `/` -> HomePage, `/viewer` -> ViewerPage. Unknown routes: out of scope.
- Navbar items in order: Himar (Link `/`), Home (NavLink `/`, end), Projects (Link `/#projects`), About (Link `/#about`), Tech Stack (Link `/#tech-stack`), 3D Viewer (NavLink `/viewer`).
- Section ids: `projects`, `about`, `tech-stack` (plus `hero`). Each section: `<section id aria-labelledby>` with heading.
- No props required; no global state.

## Dependencies
Runtime: `react`, `react-dom`, `react-router-dom`, `three`.
Dev: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `eslint` + react plugins (template defaults).
Testing: no unit test framework required; verification is by build/lint and manual/browser checks. Optional: Vitest + Testing Library only if owner wants automation (not planned).
Skill: `frontend-design` for all UI tasks.

## Risks
- Hash scroll fails when target not yet rendered: mitigated by running in `useEffect` after route render.
- Tailwind v4 / Vite version mismatch: pin versions installed by npm; fallback noted above.
- Frontend-design skill pushes visual choices beyond spec non-goals: mitigated by the constraint above.
- Lint/console warnings from template boilerplate (NFR-5): delete unused template files.
- Windows PowerShell scaffolding prompts are interactive: use non-interactive flags (`npm create vite@latest . -- --template react`) or write files manually.

## Test strategy (maps to AC)
- AC-1, AC-12: `npm install`, `npm run dev` loads with clean console; `npm run build` exits 0; `npm run lint` clean.
- AC-2: inspect `package.json`; add a Tailwind class (e.g. flex/padding) and confirm effect in browser.
- AC-3, AC-4, AC-5, AC-14: browser check of navbar on both routes, Home/3D Viewer/Himar navigation, URL `/viewer`, no reload (network tab / state persists).
- AC-6, AC-7, AC-11, AC-13: inspect DOM order, `section` + heading, item counts, one component file per section/navbar, one `h1` per page.
- AC-8: devtools check of `aria-current` on `/` and `/viewer`; in-page links never have it.
- AC-9: responsive mode at 320/768/1920 px; no horizontal scrollbar; all items clickable.
- AC-10: Tab through navbar, activate with Enter.
- AC-15: verify navbar DOM order.
- AC-16, AC-17: click each in-page link on `/` and on `/viewer`; target section scrolled into view; section ids exist.

## Order of work
1. Scaffold Vite React app; install deps (react-router-dom, three, tailwindcss, @tailwindcss/vite); clean template; confirm dev server, lint, build.
2. Configure Tailwind (vite plugin, `index.css`), verify utilities apply.
3. Section components (Hero, Projects, AboutMe, TechStack) with ids, headings, placeholders (frontend-design skill).
4. HomePage and ViewerPage (frontend-design skill).
5. Navbar with links, NavLink active state, responsive wrap (frontend-design skill).
6. ScrollToHash; App routes + layout with single `main`; `main.jsx` router wiring.
7. Verification pass against all ACs (build, lint, responsive, keyboard, hash scroll).
