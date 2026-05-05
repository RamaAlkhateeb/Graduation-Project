# AI Agent Guidance

- **Purpose**: Short, actionable rules for AI coding assistants working on this repository.
- **Primary tasks**: Make minimal, focused changes; prefer editing the owning page/component; add tests for behavior changes.
- **Dev commands**: use `npm run dev`, `npm run build`, `npm run test`, `npm run test:watch`.
- **Testing**: Use Vitest and Testing Library. Test setup: [src/test/setup.ts](src/test/setup.ts).
- **UI & Styling**: App is RTL, Arabic-first. Reuse primitives in [src/components/ui](src/components/ui). Preserve the green/gold palette and Tajawal font in [src/index.css](src/index.css).
- **Architecture**: Pages live in [src/pages](src/pages). Shared layout: [src/components/DashboardLayout.tsx](src/components/DashboardLayout.tsx) and [src/components/DashboardSidebar.tsx](src/components/DashboardSidebar.tsx).
- **Auth & Navigation**: Login flow is in [src/pages/LoginPage.tsx](src/pages/LoginPage.tsx). Routes: `/`, `/index`, `/semesters`, `/courses`, `/teachers`, `/students`, `/circles`, `/attendance`, `/exams`, `/surveys`, `/notes`.
- **Coding rules**: Use the `@` import alias for app code; keep changes consistent with existing formatting and naming; avoid introducing new design systems or global style changes unless explicitly approved.
- **When unsure**: Ask for clarification before changing auth, navigation, or global styles; prefer small incremental PRs with tests.

# Project Notes

## Stack
- Vite + React + TypeScript SPA.
- React Router handles page routing in [src/App.tsx](src/App.tsx).
- React Query, shadcn-style UI primitives, Recharts, Sonner, and Lucide icons are already in use.

## App Structure
- Page-level views live in [src/pages](src/pages).
- Shared dashboard chrome lives in [src/components/DashboardLayout.tsx](src/components/DashboardLayout.tsx) and [src/components/DashboardSidebar.tsx](src/components/DashboardSidebar.tsx).
- Reusable UI primitives live in [src/components/ui](src/components/ui); prefer reusing them before adding new wrappers.
- Use the `@` import alias for app code.

## UI Conventions
- The app is RTL and Arabic-first. Keep text, spacing, and alignment consistent with that direction.
- Global styling and the color system are defined in [src/index.css](src/index.css); preserve the green/gold palette and Tajawal font unless a change is intentional.
- Prefer the existing utility classes and CSS tokens over introducing a separate design system.

## Data And Auth
- The login flow currently posts to the existing remote auth endpoint in [src/pages/LoginPage.tsx](src/pages/LoginPage.tsx), stores `token` and `expiresAt` in `localStorage`, and redirects to `/index`.
- If you touch auth or navigation, keep the current route structure in mind: `/`, `/index`, `/semesters`, `/courses`, `/teachers`, `/students`, `/circles`, `/attendance`, `/exams`, `/surveys`, and `/notes`.

## Testing
- Use Vitest for unit tests and Testing Library for React tests.
- Test setup lives in [src/test/setup.ts](src/test/setup.ts).
- Available scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm run test`, and `npm run test:watch`.

## Working Rules
- Make the smallest change that fits the existing component boundaries.
- Prefer editing the page or shared component that owns the behavior instead of adding new abstraction layers.
- Keep new code consistent with the current formatting and naming style.