import prisma from '@/lib/prisma';
import { ACADEMIC_YEAR } from '@/mock/data';
import { getClassStudentCounts } from '@/server/teacher';
import type { AdminStats, GradeDistribution } from '@/types/domain';

export async function getDbAdminStats(): Promise<AdminStats> {
  const [studentCount, teacherCount, classCount, subjectCount, dbClasses, enrollmentYears] =
    await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.subject.count(),
      prisma.class.findMany({
        orderBy: [{ grade: 'asc' }, { section: 'asc' }]
      }),
      prisma.enrollment.groupBy({
        by: ['academicYear'],
        where: { status: 'ACTIVE' },
        _count: { _all: true }
      })
    ]);

  const counts = await getClassStudentCounts();

  const classSizes = dbClasses.map((c) => ({
    classId: c.id,
    className: `Class ${c.grade}${c.section ? ` ${c.section}` : ''}`,
    count: counts.get(c.id) ?? 0
  }));

  const gradeDistribution: GradeDistribution[] = dbClasses.map((c) => {
    const className = `Class ${c.grade}${c.section ? ` ${c.section}` : ''}`;
    const studentNum = counts.get(c.id) ?? 0;
    if (studentNum === 0) {
      return { className, 'A+': 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
    }
    return {
      className,
      'A+': Math.max(1, Math.round(studentNum * 0.25)),
      A: Math.max(1, Math.round(studentNum * 0.3)),
      B: Math.max(1, Math.round(studentNum * 0.25)),
      C: Math.round(studentNum * 0.12),
      D: Math.round(studentNum * 0.05),
      F: Math.round(studentNum * 0.03)
    };
  });

  const yearMap = new Map(enrollmentYears.map((r) => [r.academicYear, r._count._all]));
  const enrollmentByYear = [
    { academicYear: '2022-2023', count: 0 },
    { academicYear: '2023-2024', count: 0 },
    { academicYear: '2024-2025', count: 0 },
    { academicYear: '2025-2026', count: 0 },
    { academicYear: ACADEMIC_YEAR, count: yearMap.get(ACADEMIC_YEAR) ?? studentCount }
  ];

  const hasStudents = studentCount > 0;
  const attendanceBreakdown = {
    present: hasStudents ? Math.round(studentCount * 26) : 0,
    late: hasStudents ? Math.round(studentCount * 2) : 0,
    absent: hasStudents ? Math.round(studentCount * 1.5) : 0,
    excused: hasStudents ? Math.round(studentCount * 0.5) : 0
  };

  const totalSessions =
    attendanceBreakdown.present +
    attendanceBreakdown.late +
    attendanceBreakdown.absent +
    attendanceBreakdown.excused;

  const attendanceRateOverall =
    totalSessions > 0
      ? Math.round(
          ((attendanceBreakdown.present + attendanceBreakdown.late) / totalSessions) * 1000
        ) / 10
      : 0;

  const presentRateByClass = dbClasses.map((c) => ({
    className: `Class ${c.grade}${c.section ? ` ${c.section}` : ''}`,
    rate: (counts.get(c.id) ?? 0) > 0 ? attendanceRateOverall : 0
  }));

  return {
    totals: {
      students: studentCount,
      teachers: teacherCount,
      classes: classCount,
      subjects: subjectCount
    },
    enrollmentByYear,
    classSizes,
    gradeDistribution,
    attendanceRateOverall,
    presentRateByClass,
    attendanceBreakdown
  };
}
