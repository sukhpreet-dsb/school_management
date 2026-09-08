# School Management System — Full Specification

This document is the **contract for the backend** of a single-school management system. You (the learner) build the backend against this spec. The same shapes are used by the frontend, so anything you return must match them exactly.

---

## 1. Overview & Stack Assumptions

### Goal
Manage a single school's students, teachers, classes, subjects, enrollments, grades, and attendance, with role-based access for **admin**, **teacher**, and **student**.

### Assumptions
- **Backend:** generic REST over JSON. (The starter template uses Next.js Server Actions — either is fine as long as the request/response payloads below are honored.)
- **Database:** PostgreSQL via Prisma ORM (schema provided in Section 3).
- **Auth:** Better Auth sessions (cookie/session based). Every protected endpoint requires a valid session.
- **Authorization:** every endpoint checks the session user's `role` on the server. **The client is never trusted.**
- Seed data set defined in Section 7 must be reproducible.

### Non-goals (v1)
- No multi-school/tenancy.
- No fees/payments, timetable, exams, homework, notices.
- No file uploads.
- No email sending (welcome/verification) beyond password reset — verification emails come for free with Better Auth if configured.

### Conventions
- IDs: lowercase UUID strings (`@default(uuid())`).
- Dates/timestamps: ISO-8601 strings in JSON.
- List responses are paginated with the `Paginated<T>` envelope.
- All error responses use the `ApiError` envelope (Section 5).
- Status codes: `200`/`201`/`204`, `400` (bad payload), `401` (unauthenticated), `403` (wrong role/not own data), `404`, `409` (conflict/duplicate), `422` (validation failed), `500`.

---

## 2. Roles & Permissions Matrix

`R` = read, `W` = write (create/update/delete), `—` = no access.

| Resource | Admin | Teacher | Student |
|---|---|---|---|
| Users (list, roles) | R/W | — | — |
| Students | R/W | R (all) | R (own profile only) |
| Teachers | R/W | R (all) | R (all) |
| Subjects | R/W | R | R |
| Classes | R/W | R (all) | R (own class only) |
| Enrollments | R/W | R (their classes) | R (own only) |
| Grades | R/W | R/W (own classes only) | R (own only) |
| Attendance | R/W | R/W (own classes only) | R (own only) |
| Dashboard stats | R (school-wide) | R (their classes) | R (own) |

**Teacher ownership rule:** a teacher may write grades/attendance only for classes where they are the **class teacher** **or** teach a subject via `ClassSubject`. Otherwise `403`.

**Student rule:** a student may read only their **own** grades/attendance/enrollment. Reading others → `403`.

---

## 3. Data Model (Prisma-ready)

### Enums

```prisma
enum Gender {
  MALE
  FEMALE
  OTHER
}

enum EnrollmentStatus {
  ACTIVE
  TRANSFERRED
  GRADUATED
  DROPPED
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
}
```

### Models

> `User.role` stays a **String** with allowed values `"admin" | "teacher" | "student"` (matches Better Auth + the existing template; default `"student"`). Everything else uses enums.

```prisma
model User {
  id            String     @id @default(uuid())
  name          String
  email         String
  emailVerified Boolean    @default(false)
  image         String?
  role          String     @default("student") // "admin" | "teacher" | "student"
  banned        Boolean    @default(false)
  banReason     String?
  banExpiresAt  DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  sessions      Session[]
  accounts      Account[]
  teacher       Teacher?
  student       Student?

  @@unique([email])
  @@map("user")
}

model Teacher {
  id            String         @id @default(uuid())
  userId        String         @unique
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  phone         String?
  hireDate      DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  classTeacherOf   SchoolClass[]
  classSubjects    ClassSubject[]
  grades           Grade[]
  attendanceMarked Attendance[]

  @@map("teacher")
}

model Student {
  id            String   @id @default(uuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  admissionNo   String   @unique
  dob           DateTime?
  gender        Gender?
  address       String?
  guardianName  String?
  guardianPhone String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  enrollments Enrollment[]
  grades      Grade[]
  attendance  Attendance[]

  @@index([admissionNo])
  @@map("student")
}

model SchoolClass {
  id             String    @id @default(uuid())
  name           String    // e.g. "Class 5"
  section        String?   // e.g. "A"
  academicYear   String    // e.g. "2026-2027"
  room           String?
  classTeacherId String?
  classTeacher   Teacher?  @relation(fields: [classTeacherId], references: [id], onDelete: SetNull)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  classSubjects ClassSubject[]
  enrollments   Enrollment[]
  grades        Grade[]
  attendance    Attendance[]

  @@unique([name, section, academicYear])
  @@map("school_class")
}

model Subject {
  id        String   @id @default(uuid())
  name      String
  code      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  classSubjects ClassSubject[]
  grades        Grade[]

  @@map("subject")
}

model ClassSubject {
  id            String      @id @default(uuid())
  schoolClassId String
  subjectId     String
  teacherId     String?
  schoolClass   SchoolClass @relation(fields: [schoolClassId], references: [id], onDelete: Cascade)
  subject       Subject     @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  teacher       Teacher?    @relation(fields: [teacherId], references: [id], onDelete: SetNull)
  createdAt     DateTime    @default(now())

  @@unique([schoolClassId, subjectId])
  @@index([teacherId])
  @@map("class_subject")
}

model Enrollment {
  id            String           @id @default(uuid())
  studentId     String
  schoolClassId String
  academicYear  String
  status        EnrollmentStatus @default(ACTIVE)
  enrolledAt    DateTime         @default(now())
  leftAt        DateTime?
  student       Student          @relation(fields: [studentId], references: [id], onDelete: Cascade)
  schoolClass   SchoolClass      @relation(fields: [schoolClassId], references: [id], onDelete: Cascade)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@unique([studentId, schoolClassId, academicYear])
  @@index([schoolClassId])
  @@map("enrollment")
}

model Grade {
  id            String      @id @default(uuid())
  studentId     String
  subjectId     String
  schoolClassId String
  teacherId     String
  academicYear  String
  term          Int         // 1, 2, or 3
  score         Int         // 0..100
  letterGrade   String      // A+ | A | B | C | D | F (server-derived, never from client)
  student       Student     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  subject       Subject     @relation(fields: [subjectId], references: [id], onDelete: Restrict)
  schoolClass   SchoolClass @relation(fields: [schoolClassId], references: [id], onDelete: Cascade)
  teacher       Teacher     @relation(fields: [teacherId], references: [id], onDelete: Restrict)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([studentId, subjectId, academicYear, term])
  @@index([schoolClassId, subjectId])
  @@map("grade")
}

model Attendance {
  id            String           @id @default(uuid())
  studentId     String
  schoolClassId String
  date          DateTime         @db.Date
  status        AttendanceStatus @default(PRESENT)
  markedById    String
  note          String?
  student       Student          @relation(fields: [studentId], references: [id], onDelete: Cascade)
  schoolClass   SchoolClass      @relation(fields: [schoolClassId], references: [id], onDelete: Cascade)
  markedBy      Teacher          @relation(fields: [markedById], references: [id], onDelete: Restrict)
  createdAt     DateTime         @default(now())

  @@unique([studentId, schoolClassId, date])
  @@index([schoolClassId, date])
  @@map("attendance")
}
```

> `Session`, `Account`, `Verification` tables come from Better Auth (already in the template). Do not rename them.

---

## 4. Business Rules & Validation

### 4.1 Letter grade mapping (server-side only)
Input is `score` (integer 0–100). The `letterGrade` is always computed server-side:

| Score | Letter |
|---|---|
| 90–100 | A+ |
| 80–89 | A |
| 70–79 | B |
| 60–69 | C |
| 50–59 | D |
| 0–49 | F |

### 4.2 Upsert semantics
- **Grades:** keyed by `(studentId, subjectId, academicYear, term)`. `PUT /api/grades` creates or updates; never duplicates.
- **Attendance:** keyed by `(studentId, schoolClassId, date)`. `PUT /api/attendance` creates or updates; never duplicates.

### 4.3 Enrollments
- One active enrolment per `(studentId, schoolClassId, academicYear)` — `@@unique`.
- **Transfer:** end current ACTIVE enrollment (set `TRANSFERRED`, set `leftAt`) and create a new ACTIVE enrollment in the destination class (same year if possible).
- **Graduate / Drop:** set status accordingly, set `leftAt`.
- A student is considered "in" a class only via their **latest** ACTIVE enrollment for the current `academicYear`.

### 4.4 Uniqueness & conflicts
- `User.email`, `Student.admissionNo`, `Subject.code` are globally unique → `409` otherwise.
- `(name, section, academicYear)` unique per class → `409`.

### 4.5 Deletion rules
- Deleting a `User` cascades to their `Student`/`Teacher` profile and dependent rows.
- Deleting a `SchoolClass` cascades to its enrollments/grades/attendance/class-subject links.
- Deleting a `Subject` in use by classes/grades → `409` (Restrict).

### 4.6 Attendance rate (for dashboard)
- `Present = PRESENT + LATE`
- `Absent = ABSENT`
- `EXCUSED` is excluded from the denominator.
- `Rate % = Present / (Present + Absent) × 100` (0 if denominator is 0).

### 4.7 Authorization invariants
- Never return another role's sensitive data.
- A teacher's write access to grades/attendance requires **class-teacher** or **subject-teacher** ownership of that class.
- `banned` users are rejected everywhere (`403`).

---

## 5. Backend API Contract

### Shared types

```ts
type UserRole = "admin" | "teacher" | "student";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image: string | null;
  emailVerified: boolean;
  banned: boolean;
  createdAt: string; // ISO
}

interface StudentDTO {
  id: string;
  userId: string;
  admissionNo: string;
  name: string;
  email: string;
  dob: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  address: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  currentClass: {
    id: string;
    name: string;
    section: string | null;
    academicYear: string;
  } | null;
}

interface TeacherDTO {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  hireDate: string | null;
  headOfClasses: { id: string; name: string; section: string | null; academicYear: string }[];
  subjects: { id: string; code: string; name: string }[];
}

interface SubjectDTO {
  id: string;
  name: string;
  code: string;
}

interface ClassSubjectDTO {
  id: string;
  subject: SubjectDTO;
  teacher: { id: string; name: string } | null;
}

interface SchoolClassDTO {
  id: string;
  name: string;
  section: string | null;
  academicYear: string;
  room: string | null;
  classTeacher: { id: string; name: string } | null;
  subjects: ClassSubjectDTO[];
  studentCount: number; // active enrollments, current academic year
}

interface EnrollmentDTO {
  id: string;
  studentId: string;
  studentName: string;
  schoolClassId: string;
  className: string;
  academicYear: string;
  status: "ACTIVE" | "TRANSFERRED" | "GRADUATED" | "DROPPED";
  enrolledAt: string;
  leftAt: string | null;
}

interface GradeDTO {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectCode: string;
  schoolClassId: string;
  term: number;
  academicYear: string;
  score: number;
  letterGrade: "A+" | "A" | "B" | "C" | "D" | "F";
}

interface AttendanceDTO {
  id: string;
  studentId: string;
  studentName: string;
  schoolClassId: string;
  date: string; // yyyy-MM-dd
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  note: string | null;
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ApiError {
  error: {
    code: string; // "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "VALIDATION" | "INTERNAL"
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}
```

### 5.1 Auth (Better Auth) — free endpoints

| Method & Path | Public? | Notes |
|---|---|---|
| `POST /api/auth/sign-up/email` | yes | create account (role becomes `student`) |
| `POST /api/auth/sign-in/email` | yes | start session |
| `POST /api/auth/sign-out` | yes | end session |
| `GET /api/auth/get-session` | yes | returns session user or null |
| `POST /api/auth/admin/*` | session+admin | Better Auth admin plugin APIs (ban, impersonate, etc.) |

### 5.2 Users (admin only)

**`GET /api/users`** — list users.
- Query: `q` (name/email LIKE), `role` (admin|teacher|student), `page=1`, `pageSize=20` (max 100).
- Response: `Paginated<AuthUser>`.
- Errors: `401`, `403`.

**`GET /api/users/:id`**
- Response: `AuthUser`.
- Errors: `401`, `403`, `404`.

**`POST /api/users`** — create an account with a role.
- Body: `{ name: string; email: string; password: string (min 8); role: UserRole }`.
- Response: `201 AuthUser`.
- Errors: `401`, `403`, `409` (duplicate email), `422`.

**`PATCH /api/users/:id`**
- Body: `{ name?: string; role?: UserRole; banned?: boolean; banReason?: string | null; banExpiresAt?: string | null }`.
- Response: `AuthUser`.
- Errors: `401`, `403`, `404`, `409`.

**`DELETE /api/users/:id`**
- Response: `204`. Cascades to profile/enrollments/grades/attendance.
- Errors: `401`, `403`, `404`.

### 5.3 Students

**`GET /api/students`** — list (admin, teacher).
- Query: `q` (name/admissionNo/guardian LIKE), `classId`, `page`, `pageSize`.
- Response: `Paginated<StudentDTO>` (`currentClass` = latest ACTIVE enrollment for current year).
- Errors: `401`, `403`.

**`GET /api/students/:id`** — (admin, teacher, or the student themself).
- Response: `StudentDTO`.
- Errors: `401`, `403`, `404`.

**`POST /api/students`** — (admin). Creates `User` (role student) + `Student`.
- Body: `{ name, email, password, admissionNo?, dob? (yyyy-mm-dd), gender?, address?, guardianName?, guardianPhone? }`.
- Response: `201 StudentDTO`.
- Errors: `401`, `403`, `409` (email or admissionNo), `422`.

**`PATCH /api/students/:id`** — (admin).
- Body: `{ name?, dob?, gender?, address?, guardianName?, guardianPhone? }` (`admissionNo` immutable after creation).
- Response: `StudentDTO`.
- Errors: `401`, `403`, `404`, `422`.

**`DELETE /api/students/:id`** — (admin).
- Response: `204`. Cascades.
- Errors: `401`, `403`, `404`.

**`GET /api/students/:id/grades`** — (admin, teacher, or the student themself).
- Query: `academicYear?`, `term?`.
- Response: `GradeDTO[]`.
- Errors: `401`, `403`, `404`.

**`GET /api/students/:id/attendance`** — (admin, teacher, or the student themself).
- Query: `academicYear?`, `month?` (1–12).
- Response: `AttendanceDTO[]`.
- Errors: `401`, `403`, `404`.

### 5.4 Teachers

**`GET /api/teachers`** — (admin, teacher).
- Query: `q`, `page`, `pageSize`.
- Response: `Paginated<TeacherDTO>`.
- Errors: `401`, `403`.

**`GET /api/teachers/:id`** — (admin, teacher, or the teacher themself).
- Response: `TeacherDTO`.
- Errors: `401`, `403`, `404`.

**`POST /api/teachers`** — (admin). Creates `User` (role teacher) + `Teacher`.
- Body: `{ name, email, password, phone?, hireDate? }`.
- Response: `201 TeacherDTO`.
- Errors: `401`, `403`, `409`, `422`.

**`PATCH /api/teachers/:id`** — (admin).
- Body: `{ name?, phone?, hireDate? }`.
- Response: `TeacherDTO`.
- Errors: `401`, `403`, `404`.

**`DELETE /api/teachers/:id`** — (admin).
- Response: `204`.
- Errors: `401`, `403`, `404`.

### 5.5 Subjects

**`GET /api/subjects`** — (all authenticated).
- Response: `SubjectDTO[]`.
- Errors: `401`.

**`POST /api/subjects`** — (admin).
- Body: `{ name, code }`.
- Response: `201 SubjectDTO`.
- Errors: `401`, `403`, `409`, `422`.

**`PATCH /api/subjects/:id`** — (admin).
- Body: `{ name?, code? }`.
- Response: `SubjectDTO`.
- Errors: `401`, `403`, `404`, `409`.

**`DELETE /api/subjects/:id`** — (admin).
- Response: `204`; or `409` if used by classes/grades.
- Errors: `401`, `403`, `404`, `409`.

### 5.6 Classes

**`GET /api/classes`** — (all authenticated).
- Query: `academicYear?`, `page`, `pageSize`.
- Response: `Paginated<SchoolClassDTO>` (student sees only classes they're actively enrolled in).
- Errors: `401`.

**`GET /api/classes/:id`** — (all authenticated; students only their own class).
- Response: `SchoolClassDTO` (with full roster? No — roster only via `GET /api/classes/:id/enrollments`).
- Errors: `401`, `403`, `404`.

**`POST /api/classes`** — (admin).
- Body: `{ name, section?, academicYear, room?, classTeacherId? }`.
- Response: `201 SchoolClassDTO`.
- Errors: `401`, `403`, `409`, `422`.

**`PATCH /api/classes/:id`** — (admin).
- Body: `{ name?, section?, academicYear?, room?, classTeacherId? | null }`.
- Response: `SchoolClassDTO`.
- Errors: `401`, `403`, `404`, `409`, `422`.

**`DELETE /api/classes/:id`** — (admin).
- Response: `204`; `409` if it has enrollments.
- Errors: `401`, `403`, `404`, `409`.

**`GET /api/classes/:id/enrollments`** — (admin, teacher of class).
- Query: `academicYear?`, `status?`.
- Response: `EnrollmentDTO[]`.
- Errors: `401`, `403`, `404`.

**`PUT /api/classes/:id/subjects/:subjectId`** — (admin) assign/update subject–teacher link.
- Body: `{ teacherId?: string | null }`.
- Response: `ClassSubjectDTO`.
- Errors: `401`, `403`, `404`, `409`.

**`DELETE /api/classes/:id/subjects/:subjectId`** — (admin) remove subject from class.
- Response: `204`.
- Errors: `401`, `403`, `404`.

### 5.7 Enrollments

**`POST /api/enrollments`** — (admin).
- Body: `{ studentId, schoolClassId, academicYear?, status? = "ACTIVE" }` (year defaults to current school year).
- Response: `201 EnrollmentDTO`.
- Errors: `401`, `403`, `409` (duplicate/active already), `404`, `422`.

**`PATCH /api/enrollments/:id`** — (admin) transfer/graduate/drop.
- Body: `{ status?: "TRANSFERRED" | "GRADUATED" | "DROPPED"; schoolClassId?: string }`.
- If `status` becomes non-ACTIVE → set `leftAt = now()`.
- If `schoolClassId` changes and status stays `ACTIVE` → set old `TRANSFERRED` + `leftAt`, create new ACTIVE enrollment (transfer semantics).
- Response: `EnrollmentDTO` (or the new one for transfers).
- Errors: `401`, `403`, `404`, `409`, `422`.

**`DELETE /api/enrollments/:id`** — (admin).
- Response: `204`.
- Errors: `401`, `403`, `404`.

### 5.8 Grades

**`GET /api/grades`** — list for a class/subject/term.
- Query: `schoolClassId` (required), `subjectId` (required), `academicYear?`, `term?`.
- Access: admin; teacher with write access to that class; students only if the class has an active enrollment for them (read-only).
- Response: `GradeDTO[]` (one per student; students without a grade are simply absent from the list).
- Errors: `401`, `403`, `422`.

**`PUT /api/grades`** — batch upsert.
- Body:
  ```ts
  {
    schoolClassId: string;
    subjectId: string;
    academicYear: string;
    term: number; // 1 | 2 | 3
    grades: Array<{ studentId: string; score: number }>; // score 0..100
  }
  ```
- Access: admin, or teacher with class-teacher/subject-teacher ownership.
- Behavior: upsert per `(studentId, subjectId, academicYear, term)`; compute `letterGrade` server-side; ignore/`422` unknown studentIds for the class.
- Response: `GradeDTO[]`.
- Errors: `401`, `403`, `404`, `422`.

**`DELETE /api/grades/:id`** — (teacher with ownership, admin).
- Response: `204`.
- Errors: `401`, `403`, `404`.

### 5.9 Attendance

**`GET /api/attendance`** — roster marks for a class on a date.
- Query: `schoolClassId`, `date` (yyyy-MM-dd).
- Access: admin; teacher of the class; students read-only for dates in their class.
- Response: `AttendanceDTO[]` (one row per student; unmarked students absent unless marked).
- Errors: `401`, `403`, `422`.

**`PUT /api/attendance`** — batch upsert marks for a class/date.
- Body:
  ```ts
  {
    schoolClassId: string;
    date: string; // yyyy-MM-dd
    records: Array<{ studentId: string; status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"; note?: string | null }>;
  }
  ```
- Access: admin, or teacher of the class.
- Behavior: upsert per `(studentId, schoolClassId, date)`; `markedById` = current teacher.
- Response: `AttendanceDTO[]`.
- Errors: `401`, `403`, `404`, `422`.

### 5.10 Dashboard stats

**`GET /api/dashboard/admin-stats`** — (admin).
- Response:
  ```ts
  {
    totals: { students: number; teachers: number; classes: number; subjects: number };
    enrollmentByYear: Array<{ academicYear: string; count: number }>;
    classSizes: Array<{ schoolClassId: string; className: string; count: number }>; // active only
    gradeDistribution: Array<{ className: string; "A+": number; A: number; B: number; C: number; D: number; F: number }>;
    attendanceRateOverall: number; // 0..100
  }
  ```

**`GET /api/dashboard/teacher-stats`** — (teacher).
- Response:
  ```ts
  {
    myClasses: Array<{ id: string; name: string; studentCount: number }>;
    subjectsTaught: Array<{ id: string; name: string }>;
    gradeDistributionForMyClasses: Array<{ className: string; "A+": number; A: number; B: number; C: number; D: number; F: number }>;
    attendanceRateByClass: Array<{ className: string; rate: number }>;
  }
  ```

**`GET /api/dashboard/student-stats`** — (student, own data).
- Response:
  ```ts
  {
    currentClass: { id: string; name: string; section: string | null; academicYear: string } | null;
    subjects: Array<{
      subjectId: string;
      subjectName: string;
      scores: Array<{ term: number; score: number; letterGrade: string }>;
      average: number | null;
      letterGrade: string | null;
    }>;
    attendance: { present: number; absent: number; late: number; excused: number; rate: number };
    attendanceByMonth: Array<{ month: string; rate: number }>;
  }
  ```

---

## 6. Dashboard Aggregate Queries

Reference map (implement as Prisma `groupBy`/`aggregate`/`count` or equivalent SQL):

| Stat | Query shape |
|---|---|
| `totals` | `count` on Student/Teacher/SchoolClass/Subject |
| `enrollmentByYear` | `groupBy(academicYear)` on Enrollment |
| `classSizes` | `groupBy(schoolClassId)` on Enrollment where status=ACTIVE & year=current |
| `gradeDistribution` | `groupBy([schoolClassId, letterGrade])` on Grade (current year) |
| `attendanceRateOverall` | sum/group attendance statuses → Section 4.6 formula |
| `subjects.scores` (student) | `groupBy([subjectId, term])` on Grade where studentId=me |
| `attendanceByMonth` | `groupBy([date])` on Attendance where studentId=me, then bucket by month |

---

## 7. Seed Data Spec

Reproducible seed (any backend must be able to create this):

| Entity | Count | Notes |
|---|---|---|
| Admin user | 1 | role `admin`, email `admin@school.edu` |
| Teachers | 2 | roles `teacher` |
| Students | 10 | roles `student`, unique `admissionNo` (S1001…S1010) |
| Classes | 4 | e.g. "Class 5 A", "Class 5 B", "Class 6 A", "Class 6 B", year `2026-2027` |
| Subjects | 4 | e.g. Mathematics (MATH), Science (SCI), English (ENG), Computer Science (CS) |
| Class subjects | 8 | each class × 2 subjects, teachers assigned |
| Enrollments | 10 | 5 students per class, year `2026-2027`, status ACTIVE |
| Grades | ~80 | term 1 + 2 for every (student, subject) — realistic spread of scores |
| Attendance | ~300 | 15 school days of marks across the 4 classes |

Include 1–2 students with no grades/attendance to exercise empty states.

---

## 8. UI Screens Reference (what the backend must serve)

| Screen | Data endpoint(s) | Roles |
|---|---|---|
| Dashboard (admin) | `GET /api/dashboard/admin-stats` | admin |
| Dashboard (teacher) | `GET /api/dashboard/teacher-stats` | teacher |
| Dashboard (student) | `GET /api/dashboard/student-stats` | student |
| Students list / detail | `GET /api/students`·`/api/students/:id` | admin, teacher |
| Student view (self) | `GET /api/students/:id/grades`, `…/attendance` | student (own) |
| Teachers list / detail | `GET /api/teachers`·`/api/teachers/:id` | admin, teacher |
| Subjects | `GET/POST/PATCH/DELETE /api/subjects` | admin |
| Classes list / detail | `GET /api/classes`·`/api/classes/:id`·`/enrollments` | all |
| Class subject assignment | `PUT/DELETE /api/classes/:id/subjects/:subjectId` | admin |
| Grades entry | `GET/PUT /api/grades` | teacher, admin |
| Grades view (student) | `GET /api/students/:id/grades` | student (own) |
| Attendance marking | `GET/PUT /api/attendance` | teacher, admin |
| Attendance view (student) | `GET /api/students/:id/attendance` | student (own) |
| Admin users & roles | `GET/POST/PATCH/DELETE /api/users` | admin |

---

## 9. Acceptance Checklist

Work through these against your backend.

**Auth & roles**
- [ ] Unauthenticated call to any protected endpoint → `401`.
- [ ] Student calling an admin endpoint → `403`.
- [ ] Email signup creates a `student`-role user.

**Users**
- [ ] Creating a user with a duplicate email → `409`.
- [ ] Role change takes effect immediately (next request carries new permissions).

**Students / Teachers**
- [ ] `GET /api/students?classId=…` returns only that class.
- [ ] `POST /api/students` creates `User` + `Student` with unique `admissionNo`.
- [ ] Duplicate `admissionNo` → `409`.
- [ ] `DELETE` cascades cleanly (no orphan rows).

**Classes / Subjects**
- [ ] Duplicate `(name, section, academicYear)` → `409`.
- [ ] Assigning a subject–teacher link appears in `GET /api/classes/:id`.
- [ ] Deleting a class that has enrollments → `409`.

**Enrollments**
- [ ] Two ACTIVE enrollments for same (student, class, year) → `409`.
- [ ] Transfer creates a new ACTIVE enrollment and flips the old one to `TRANSFERRED` with `leftAt`.

**Grades**
- [ ] `PUT /api/grades` twice with same data → no duplicates (upsert).
- [ ] `letterGrade` is correct for boundary scores (89→A, 90→A+, 49→F, 50→D).
- [ ] Score 101 or -1 → `422`.
- [ ] Submitting for a class the teacher doesn't own → `403`.

**Attendance**
- [ ] `PUT /api/attendance` twice for the same date → updates, not duplicates.
- [ ] Remarking a student's status overwrites the old row.
- [ ] Attendance rate matches the Section 4.6 formula.

**Dashboards**
- [ ] Every chart data shape matches Section 5.10 exactly.
- [ ] Student endpoint returns only their own data.

**Seed**
- [ ] Seed runs twice without duplicate errors (idempotent).

---

## 10. Glossary

- **DTO** — data transfer object; the exact JSON shape exchanged over the API.
- **Upsert** — insert a row, or update it if one with the same unique key already exists.
- **RBAC** — role-based access control.
- **Class teacher** — the teacher assigned as head of a `SchoolClass`.
- **Subject teacher** — a teacher linked to a class via `ClassSubject`.
- **Academic year** — a string period of enrolment, e.g. `"2026-2027"`.
- **Current school year** — the value you treat as "now" for class/enrollment queries (derive from date or a constant default).