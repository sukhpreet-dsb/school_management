-- CreateTable
CREATE TABLE "class" (
    "id" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'A',
    "room" TEXT,
    "academicYear" TEXT NOT NULL DEFAULT '2026-2027',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_class" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL DEFAULT '2026-2027',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_class_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "class_grade_section_academicYear_key" ON "class"("grade", "section", "academicYear");

-- CreateIndex
CREATE INDEX "teacher_class_teacherId_academicYear_idx" ON "teacher_class"("teacherId", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_class_teacherId_classId_academicYear_key" ON "teacher_class"("teacherId", "classId", "academicYear");

-- AddForeignKey
ALTER TABLE "teacher_class" ADD CONSTRAINT "teacher_class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_class" ADD CONSTRAINT "teacher_class_classId_fkey" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Seed mirror classes (Class 5 A/B .. 7 A/B) matching the mock catalog
INSERT INTO "class" ("id", "grade", "section", "room", "academicYear", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 5, 'A', 'Room 101', '2026-2027', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "class" WHERE "grade" = 5 AND "section" = 'A' AND "academicYear" = '2026-2027');
INSERT INTO "class" ("id", "grade", "section", "room", "academicYear", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 5, 'B', 'Room 102', '2026-2027', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "class" WHERE "grade" = 5 AND "section" = 'B' AND "academicYear" = '2026-2027');
INSERT INTO "class" ("id", "grade", "section", "room", "academicYear", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 6, 'A', 'Room 103', '2026-2027', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "class" WHERE "grade" = 6 AND "section" = 'A' AND "academicYear" = '2026-2027');
INSERT INTO "class" ("id", "grade", "section", "room", "academicYear", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 6, 'B', 'Room 104', '2026-2027', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "class" WHERE "grade" = 6 AND "section" = 'B' AND "academicYear" = '2026-2027');
INSERT INTO "class" ("id", "grade", "section", "room", "academicYear", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 7, 'A', 'Room 105', '2026-2027', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "class" WHERE "grade" = 7 AND "section" = 'A' AND "academicYear" = '2026-2027');
INSERT INTO "class" ("id", "grade", "section", "room", "academicYear", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 7, 'B', 'Room 106', '2026-2027', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "class" WHERE "grade" = 7 AND "section" = 'B' AND "academicYear" = '2026-2027');
