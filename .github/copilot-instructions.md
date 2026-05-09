# Copilot Instructions for Graduation-Project

Purpose: Help AI coding assistants be immediately productive in this repo.

- Focus on small, well-scoped changes; prefer editing the owning page or component.
- Key commands: `npm run dev`, `npm run build`, `npm run test`, `npm run test:watch`.
- Testing: Use Vitest + Testing Library. See [src/test/setup.ts](src/test/setup.ts#L1).
- Architecture: Pages under [src/pages](src/pages#L1). Shared layout in [src/components/DashboardLayout.tsx](src/components/DashboardLayout.tsx#L1) and [src/components/DashboardSidebar.tsx](src/components/DashboardSidebar.tsx#L1).
- UI conventions: RTL, Arabic-first. Preserve green/gold palette and Tajawal font in [src/index.css](src/index.css#L1).
- Reuse UI primitives in [src/components/ui](src/components/ui#L1) before adding new components.
- Auth & routing: Login flow in [src/pages/LoginPage.tsx](src/pages/LoginPage.tsx#L1). Routes: `/`, `/index`, `/semesters`, `/courses`, `/teachers`, `/students`, `/circles`, `/attendance`, `/exams`, `/surveys`, `/notes`.
- Imports: use the `@` alias for app code.
- When unsure about global styles, auth, or navigation, ask the repo owner before changing.

Link, don't duplicate: Prefer linking to existing docs (AGENTS.md, README) instead of copying them.

If you make behavior changes, add or update tests and keep PRs small.
