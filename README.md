# School OS — School Management System

A role-based school management platform built on Next.js 16, Better Auth, Prisma, and Tailwind CSS 4. Admins manage users, teachers, students, classes, and grades; teachers handle their classes and attendance; students view their own profile, grades, and attendance.

- **[Backend contract & API spec](SCHOOL_MANAGEMENT_SPEC.md)** — roles matrix, Prisma schema, REST API shapes, business rules, acceptance checklist.
- **[Learning roadmap](LEARNING_ROADMAP.md)** — two-phase, module-based build plan (UI-first, then backend).

## ✨ Features

- **Role-based access** for **Admin / Teacher / Student** — server-side guards (`requireRole`) on every route; wrong role gets a 403.
- **Authentication** with [Better Auth](https://better-auth.com/):
  - Email & password signup / signin with httpOnly cookie sessions
  - Forgot / reset password via transactional email (Resend)
  - First registered user bootstraps as **admin**; public signups become **students**; admins provision teachers
- **Role-aware UI** — each role lands on its own dashboard (`/admin`, `/teacher`, `/student`).
- **Admin overview** — stat cards + charts (enrollment, attendance, class size, grade distribution) using Recharts.
- **Mock-driven frontend** — a realistic seeded dataset (8 subjects, 6 classes, 8 teachers, 50 students, grades, attendance) powers the UI until the real backend lands.
- **Theme-aware UI** — light/dark mode, shadcn/ui components built on [Base UI](https://base-ui.com/).
- **Reusable data table** — search, sort, pagination via TanStack Table.

## 🚀 Technologies

- **[Next.js 16](https://nextjs.org/)** — App Router, Server Components, Server Actions, `authInterrupts`
- **[React 19](https://react.dev/)**
- **[Better Auth 1.6](https://better-auth.com/)** — sessions, admin plugin, password reset
- **[Prisma 7](https://www.prisma.io/)** — with the `@prisma/adapter-pg` driver adapter
- **[Tailwind CSS 4](https://tailwindcss.com/)**
- **[shadcn/ui](https://ui.shadcn.com/)** on **[Base UI](https://base-ui.com/)**
- **[TanStack Table](https://tanstack.com/table)** — data tables
- **[Recharts](https://recharts.org/)** — dashboards & charts
- **[Resend](https://resend.com/)** — transactional email (password reset)
- **[Bun](https://bun.sh/)** — JavaScript runtime & package manager (recommended)

## 🛠️ Getting Started

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

Create a `.env` file at the project root:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/school_management?schema=public"

# Better Auth
BETTER_AUTH_SECRET="your_super_secure_secret" # Generate with: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Email (Resend) — sender domain must be verified at resend.com/domains
RESEND_API_KEY="re_123456789"
EMAIL_SENDER_NAME="School Management System"
EMAIL_SENDER_ADDRESS="noreply@yourdomain.com"
```

### 3. Set up the database

```bash
bunx prisma migrate dev   # creates tables + generates the Prisma client
bun run db:seed           # optional: creates demo accounts
```

### 4. Start the development server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## 👤 Demo Accounts

After running `bun run db:seed`:

| Role    | Email                | Password       |
| ------- | -------------------- | -------------- |
| Admin   | `admin@school.edu`   | `Password123!` |
| Teacher | `teacher@school.edu` | `Password123!` |
| Student | `student@school.edu` | `Password123!` |

> **Role bootstrap:** the first user to sign up publicly becomes `admin`; every later public signup is a `student`. Admin users promote accounts to `teacher` (users management).

## 🔐 Auth Flow

1. Signup/login uses Better Auth **httpOnly cookie sessions**.
2. The user's `role` is stored on the DB row and **re-read fresh on every request** — authorization never trusts a stale client value.
3. Route groups are guarded per role: `/admin` → `requireRole('admin')`, `/teacher` → `requireRole('teacher')`, `/student` → `requireRole('student')`, `/dashboard` redirects to the role's home.
4. Forgot password → `requestPasswordReset` → Resend email → `/reset-password?token=…` → new password (other sessions revoked).

## 📂 Project Structure

```
├── prisma/
│   ├── schema.prisma       # Auth models (User, Session, Account, Verification)
│   └── seed.ts             # Demo accounts (admin/teacher/student)
├── src/
│   ├── app/
│   │   ├── (auth)/         # login, signup, forgot-password, reset-password
│   │   ├── (public)/       # Landing page (redirects by auth state)
│   │   ├── (protected)/    # Session + role-guarded routes
│   │   │   ├── admin/      # Admin dashboard (requireRole('admin'))
│   │   │   ├── teacher/    # Teacher dashboard (requireRole('teacher'))
│   │   │   ├── student/    # Student dashboard (requireRole('student'))
│   │   │   └── dashboard/  # Session-required; redirects to role home
│   │   └── api/            # Better Auth handler, health check
│   ├── components/
│   │   ├── layout/         # app-shell, auth-shell, sidebar, header, stat-card…
│   │   ├── data-table/     # TanStack Table wrapper (search/sort/pagination)
│   │   ├── dashboard/      # admin-overview charts
│   │   ├── shared/         # shared components
│   │   └── ui/             # shadcn/ui components on Base UI
│   ├── generated/prisma/   # Generated Prisma client
│   ├── lib/                # auth, auth-client, email, roles, prisma, utils
│   ├── mock/               # data.ts (dataset + selectors), nav.ts (role nav)
│   ├── server/             # auth.ts — getSession / requireSession / requireRole
│   ├── proxy.ts            # Middleware: redirects unauthenticated users to /login
│   └── types/              # domain.ts — DTO contracts mirroring the spec
```

## 📜 Available Scripts

- `bun dev` — start the development server
- `bun build` — generate the Prisma client and build for production
- `bun start` — apply pending migrations and start the production server
- `bun run lint` — run ESLint
- `bun run db:seed` — create the demo accounts
- `bunx prisma migrate dev` — create and apply a migration
- `bunx prisma generate` — regenerate the Prisma client
- `bunx prisma studio` — inspect/edit data via Prisma Studio
- `bunx tsc --noEmit` — type-check

## 🗄️ Database Models

The shipped schema currently holds the **auth** models:

- **User** — id, name, email, `role` (admin/teacher/student), `banned`
- **Session** — session tokens with IP/userAgent
- **Account** — credential passwords + OAuth provider links
- **Verification** — email-verification and password-reset tokens

The full **domain schema** (students, teachers, subjects, classes, enrollments, grades, attendance) is specified in [SCHOOL_MANAGEMENT_SPEC.md](SCHOOL_MANAGEMENT_SPEC.md) and lands during the backend phase.

## 📚 More Information

- [Next.js Documentation](https://nextjs.org/docs)
- [Better Auth Documentation](https://better-auth.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [Base UI Documentation](https://base-ui.com/react/overview/quick-start)