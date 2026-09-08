# School Management System — Learning Roadmap

A step-by-step guide to learn full-stack development by building a **single-school management system** on top of the existing starter template (Next.js 16 + Better Auth + Prisma).

> **How to use this file:** we go **one module per session**. For each module, read the concept primer, then we build it together step by step, then you verify before we move on. Tick off the checklist items as you complete them.

## 1. Overview

- **What we're building:** students, teachers, classes, subjects, enrollments, grades, attendance + role-based dashboards (admin / teacher / student).
- **Stack you'll master:** Next.js App Router, React 19 Server Components, Server Actions, Prisma + PostgreSQL, Better Auth (roles), Tailwind CSS v4, shadcn/ui, react-hook-form + zod, TanStack Table, Recharts.
- **Existing template already provides:** auth (login/signup), Prisma setup, UI components, theme system, proxy route protection, health check, Railway deploy config.

## 2. Learning approach

Each module is:

1. **Concept primer** — what you'll learn, explained in plain English.
2. **Build together** — we implement it step-by-step.
3. **Verify** — a concrete check that proves you understood before moving on.

> Rule: finish and verify a module before starting the next. Ask questions any time.

## 3. Module tracker

| # | Module | Core concept | Status |
|---|--------|--------------|--------|
| 1 | Database schema & migrations | Prisma relations (1:1, 1:n, m:n) | ⬜ |
| 2 | Seed data | Idempotent seeding, scripts | ⬜ |
| 3 | Roles & authorization | RBAC, defense-in-depth | ⬜ |
| 4 | App shell & navigation | Layouts, route groups, dynamic nav | ⬜ |
| 5 | Admin user management | Better Auth admin plugin | ⬜ |
| 6 | Students CRUD | Server Actions + zod validation | ⬜ |
| 7 | Teachers & subjects | Linked profiles, filtering | ⬜ |
| 8 | Classes & enrollments | Many-to-many with payload | ⬜ |
| 9 | Grades | Complex interactive forms | ⬜ |
| 10 | Attendance | Batch upsert, transactional writes | ⬜ |
| 11 | Dashboards & charts | Prisma analytics + recharts | ⬜ |
| 12 | Polish & production | Lint, build, deploy | ⬜ |

---

## Module 1 — Database schema & migrations

- **Prereq:** none.
- **Concept primer:**
  - Prisma **models** map 1:1 to database tables; fields map to columns.
  - **Relations:** 1:1 (`@relation` with a unique FK), 1:n (parent → many children), m:n (join table).
  - `@id`, `@default`, `@@unique` (composite unique keys), `@@index` (performance), enums.
  - **Driver adapter:** Prisma 7 uses `@prisma/adapter-pg` instead of a built-in connection URL.
  - **Migrations:** `prisma migrate dev` diffs your schema and writes SQL you can review.
- **Build tasks:**
  - [ ] Add `Teacher`, `Student`, `SchoolClass`, `Subject`, `ClassSubject` models to `prisma/schema.prisma`.
  - [ ] Add `role` enum usage and profile links to `User` (optional 1:1 `Teacher`/`Student`).
  - [ ] Run `bunx prisma migrate dev --name school-core` and review the generated SQL.
- **Key files:** `prisma/schema.prisma`, `prisma/migrations/*`, `src/generated/prisma`.
- **Verify:** Migration applies, `bunx prisma studio` shows new tables, `bun build` passes.

---

## Module 2 — Seed data

- **Prereq:** Module 1.
- **Concept primer:**
  - **Seeding** populates dev data so you can build UI against a realistic database.
  - **Idempotency:** use `upsert` so running the seed multiple times doesn't error or duplicate.
  - Running scripts with Bun and wiring the `db:seed` npm script.
- **Build tasks:**
  - [ ] Create `prisma/seed.ts`.
  - [ ] Create an `admin`, a couple of `teacher`s, ~10 `student`s (each with `User` + profile).
  - [ ] Create classes, subjects, enrollments, sample grades + a month of attendance.
  - [ ] Add `"db:seed": "bun prisma/seed.ts"` to `package.json`.
- **Key files:** `prisma/seed.ts`, `package.json`.
- **Verify:** Running the seed 3x produces no duplicate errors; studio shows populated data.

---

## Module 3 — Roles & authorization

- **Prereq:** Module 2.
- **Concept primer:**
  - **RBAC:** checking the user's `role` before serving a page or executing a mutation.
  - **Server-side checks** are the source of truth — never trust the client.
  - **Defense-in-depth:** check in the `proxy.ts` middleware **and** again inside the page/server action.
  - Next 16 `authInterrupts`: `forbidden()` / `unauthorized()` for clearer role errors.
- **Build tasks:**
  - [ ] Create `src/lib/roles.ts` with role constants and helpers.
  - [ ] Create `src/server/authorization.ts` with `requireRole(...roles)`.
  - [ ] Update `src/proxy.ts` matcher to protect the new routes (`/students`, `/teachers`, `/classes`, `/subjects`, `/grades`, `/attendance`, `/admin`).
- **Key files:** `src/lib/roles.ts`, `src/server/authorization.ts`, `src/proxy.ts`.
- **Verify:** A user with the wrong role gets the `forbidden()` screen, not just a redirect.

---

## Module 4 — App shell & role-aware navigation

- **Prereq:** Module 3.
- **Concept primer:**
  - **Nested layouts** and how **route groups** `(group)` compose them without changing URLs.
  - Rendering nav config **server-side** and filtering it by role.
- **Build tasks:**
  - [ ] Create `src/components/layout/` (sidebar + nav config with lucide icons).
  - [ ] Rebuild `src/app/(protected)/dashboard/layout.tsx` as the shared app shell.
  - [ ] Make the dashboard home show different content per role.
- **Key files:** `src/components/layout/*`, `src/app/(protected)/dashboard/*`.
- **Verify:** Login as admin / teacher / student → different menus and home content, same URLs.

---

## Module 5 — Admin user management

- **Prereq:** Module 4.
- **Concept primer:**
  - Better Auth **admin plugin**: server APIs + `adminClient()` for managing users.
  - Promoting users to roles via an authorized server action.
- **Build tasks:**
  - [ ] Build `/admin/users` page (list users with Prisma).
  - [ ] Server action to change a user's role and to create student/teacher accounts.
- **Key files:** `src/app/(protected)/admin/users/*`, `src/server/users.ts`.
- **Verify:** Admin promotes a fresh sign-up to `teacher`; that user instantly sees the teacher menu.

---

## Module 6 — Students CRUD

- **Prereq:** Module 5.
- **Concept primer:**
  - **Server Actions** for full-stack mutations, `revalidatePath` for cache refresh, zod validation, error handling.
  - The **1:1 profile pattern** (a `User` row + a `Student` row pointing at it).
- **Build tasks:**
  - [ ] `/students` list page with a TanStack Table (search).
  - [ ] `students/[id]` detail page.
  - [ ] Create/edit forms (vaul sheet) + archive action.
- **Key files:** `src/app/(protected)/students/*`, `src/server/students.ts`.
- **Verify:** Create a student → appears without a hard refresh; bad input shows field errors; other roles can't submit.

---

## Module 7 — Teachers & subjects

- **Prereq:** Module 6.
- **Concept primer:**
  - Reusing CRUD patterns; filtering related records; optional relationships and ID handling.
- **Build tasks:**
  - [ ] `/teachers` + `/subjects` list/CRUD reusing Module 6 patterns.
  - [ ] Link class-teacher and subject-teacher relationships.
- **Key files:** `src/app/(protected)/teachers/*`, `src/app/(protected)/subjects/*`, `src/server/teachers.ts`, `src/server/subjects.ts`.
- **Verify:** A teacher profile shows the classes/subjects they're assigned to.

---

## Module 8 — Classes & enrollments

- **Prereq:** Module 7.
- **Concept primer:**
  - **Many-to-many with payload** (a join table carrying extra data like `academicYear`).
  - Composite `@@unique` constraints and an enrollment lifecycle (ACTIVE / TRANSFERRED / GRADUATED).
- **Build tasks:**
  - [ ] `/classes` list + `classes/[id]` (roster, subjects, class teacher).
  - [ ] `ClassSubject` join handling and `Enrollment` create/transfer UI.
- **Key files:** `src/app/(protected)/classes/*`, `src/server/classes.ts`, `src/server/enrollments.ts`.
- **Verify:** A class lists its enrolled students; transferring a student updates status; no duplicate enrollments per academic year.

---

## Module 9 — Grades

- **Prereq:** Module 8.
- **Concept primer:**
  - Complex data-entry forms (react-hook-form + zod arrays).
  - Deriving values server-side (score → letter grade).
  - **Write vs read access** per role.
- **Build tasks:**
  - [ ] `/grades` — teacher selects class + term → student×subject grid to record scores.
  - [ ] Students see a read-only view of their own records.
- **Key files:** `src/app/(protected)/grades/*`, `src/server/grades.ts`.
- **Verify:** Enter scores for a whole class in one submit; letter grade computes server-side; students never see the form.

---

## Module 10 — Attendance

- **Prereq:** Module 9.
- **Concept primer:**
  - **Batch writes** (`createMany` / transactions) and **upsert** semantics.
  - Unique `(student, class, date)` to prevent duplicates.
- **Build tasks:**
  - [ ] `/attendance` — pick class + date → one table marks all present/absent.
  - [ ] Summary view; students see read-only.
- **Key files:** `src/app/(protected)/attendance/*`, `src/server/attendance.ts`.
- **Verify:** Re-marking the same date updates instead of duplicating rows; summary counts are correct.

---

## Module 11 — Dashboards & charts

- **Prereq:** Module 10.
- **Concept primer:**
  - Building analytics data server-side with Prisma `groupBy` / `aggregate`.
  - Rendering charts with Recharts.
- **Build tasks:**
  - [ ] Admin dashboard: enrollment trend, class sizes.
  - [ ] Teacher dashboard: their classes' grades + attendance.
  - [ ] Student dashboard: own grade bar chart + attendance donut.
- **Key files:** `src/app/(protected)/dashboard/*`, charts in `src/components/dashboard/*`.
- **Verify:** Charts render from real DB aggregates with the seeded data.

---

## Module 12 — Polish & production

- **Prereq:** Module 11.
- **Concept primer:**
  - ESLint and production builds (`next build`), static vs dynamic rendering.
  - Deploying to Railway (already configured) with health checks.
- **Build tasks:**
  - [ ] Empty / loading / error states across pages.
  - [ ] Table and form polish.
  - [ ] `bun lint` + `bun build` clean.
  - [ ] Optional: deploy to Railway and confirm `/api/health`.
- **Key files:** `src/app/error.tsx`, `src/app/not-found.tsx`, `railway.toml`.
- **Verify:** Zero lint errors, clean production build, green health check after deploy.

---

## Advanced follow-ups (after Module 12)

- Multi-school **tenancy** (Better Auth organizations plugin).
- **File uploads** (student/teacher avatars, S3/R2, signed URLs).
- **Timetable** scheduling with drag-and-drop (dnd-kit — already installed).
- **Transactional emails** (react-email + resend — already installed) for welcome / reports. Password reset flow is already wired: `/forgot-password` → Resend email → `/reset-password?token=`.
- **Caching & performance** (Next.js ISR, `revalidateTag`, memoization).
- **Testing** (Vitest + Supertest) for server actions and APIs.

---

## Glossary / cheat sheet

- **Route group** `(name)` — folders in parentheses that group routes without adding a URL segment.
- **Server Component** — React component rendered on the server; can `await` DB/auth directly.
- **Client Component** — needs `'use client'`; runs in the browser for interactivity (forms, toasts).
- **Server Action** — an async function with `'use server'` called from the client to mutate data.
- **RBAC** — Role-Based Access Control: permissions derived from a user's role.
- **1:1 / 1:n / m:n** — database relation cardinalities (one-to-one, one-to-many, many-to-many).
- **Join table** — a table storing the links between two tables, often with extra "payload" columns.
- **Driver adapter** — how Prisma connects to a DB in v7 (here: `@prisma/adapter-pg`).
- **Migration** — a versioned SQL script tracking database schema changes.
- **Upsert** — update a row if it exists, otherwise create it.
- **Revalidation** — telling Next.js to re-render a page after data changes (`revalidatePath`).
- **authInterrupts** — Next 16 helpers like `forbidden()` / `unauthorized()` for guard responses.