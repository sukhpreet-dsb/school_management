-- CreateTable
CREATE TABLE "subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_subject" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_subject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subject_name_key" ON "subject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subject_code_key" ON "subject"("code");

-- CreateIndex
CREATE INDEX "teacher_subject_teacherId_idx" ON "teacher_subject"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_subject_subjectId_idx" ON "teacher_subject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_subject_teacherId_subjectId_key" ON "teacher_subject"("teacherId", "subjectId");

-- AddForeignKey
ALTER TABLE "teacher_subject" ADD CONSTRAINT "teacher_subject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subject" ADD CONSTRAINT "teacher_subject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default subjects idempotently
INSERT INTO "subject" ("id", "name", "code", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Mathematics', 'MATH', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "subject" WHERE "code" = 'MATH');

INSERT INTO "subject" ("id", "name", "code", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Science', 'SCI', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "subject" WHERE "code" = 'SCI');

INSERT INTO "subject" ("id", "name", "code", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'English', 'ENG', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "subject" WHERE "code" = 'ENG');

INSERT INTO "subject" ("id", "name", "code", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Computer Science', 'CS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "subject" WHERE "code" = 'CS');

INSERT INTO "subject" ("id", "name", "code", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'History', 'HIST', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "subject" WHERE "code" = 'HIST');

INSERT INTO "subject" ("id", "name", "code", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Geography', 'GEOG', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "subject" WHERE "code" = 'GEOG');

INSERT INTO "subject" ("id", "name", "code", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Art', 'ART', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "subject" WHERE "code" = 'ART');

INSERT INTO "subject" ("id", "name", "code", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Physical Education', 'PE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "subject" WHERE "code" = 'PE');
