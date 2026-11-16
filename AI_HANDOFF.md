# NOCTIS — AI Handoff Document

Read this before working on the project. It explains what the app is, how it is
built, and how to work on it safely.

## What this is

A biolink platform (a "link in bio" product) with a dark, underground-luxury
aesthetic. Users register, get a public page at `/<username>`, curate links,
customize appearance, and collect badges. An admin manages users and badges.

## Pages and routes

| Route          | Page                | Access        |
|----------------|---------------------|---------------|
| `/`            | Homepage            | Public        |
| `/login`       | Login               | Public        |
| `/register`    | Registration        | Public        |
| `/:username`   | Public profile      | Public        |
| `/dashboard`   | User dashboard      | Signed in     |
| `/editor`      | Profile editor      | Signed in     |
| `/badges`      | Badge collection    | Signed in     |
| `/settings`    | Settings            | Signed in     |
| `/admin`       | Admin dashboard     | Admin only    |

## Accounts

- Owner/admin: `yensosu@gmail.com` (the only admin — do not change this).
- Review/demo account (for AI reviewers, no signup needed):
  - Email: `reviewer@noctis.app`
  - Password: `NoctisReview2026!`
  - The Login page also has an "Enter review mode" button that signs in with
    this account in one click.
- Do NOT delete either account. Do NOT make any other account an admin.

## Tech stack

- Vite + React 18 + TypeScript, Tailwind CSS (config in `tailwind.config.js`).
- Routing: `react-router-dom` (routes in `src/App.tsx`).
- Icons: `lucide-react` only. Do not add other UI or icon packages.
- Backend: Supabase (database + auth). Client in `src/lib/supabase.ts`,
  auth state in `src/lib/auth.tsx`, shared types in `src/lib/types.ts`.
- Database schema and security rules live in
  `supabase/migrations/20261116021853_create_biolink_schema.sql` (already
  applied — do not re-run it manually).

## Design rules (keep consistent)

- Colors: near-black backgrounds (`void-*`), charcoal panels, subtle silver
  borders (`silver-*`), small electric-blue accents (`volt-*`). No purple.
- Fonts: Space Grotesk for headings, Inter for body.
- Shared button/panel classes live in `src/index.css`
  (`panel`, `btn-primary`, `btn-ghost`, `btn-danger`, `field-label`).
- Animations: `animate-fade-up`, `animate-fade-in`, `animate-pulse-glow`.

## How to work on it

- Verify changes with `npm run build` and `npm run typecheck` before finishing.
- Any new database table MUST have row-level security enabled and explicit
  grants, following the patterns in the existing migration file.
- Never drop columns, delete accounts, or overwrite existing working pages.
- Security model: users may never write `role`, `is_banned`, or `views_count`
  on profiles — those are protected by column-level grants and admin-only
  database functions.
