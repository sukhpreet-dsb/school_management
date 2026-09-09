-- CreateEnum
CREATE TYPE "enrollment_status" AS ENUM ('ACTIVE', 'TRANSFERRED', 'GRADUATED', 'DROPPED');

-- CreateTable
CREATE TABLE "enrollment" (
    "id" TEXT NOT NULL,
    "status" "enrollment_status" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolClassId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL DEFAULT '2026-2027',

    CONSTRAINT "enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enrollment_schoolClassId_academicYear_idx" ON "enrollment"("schoolClassId", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_studentId_schoolClassId_academicYear_key" ON "enrollment"("studentId", "schoolClassId", "academicYear");

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
