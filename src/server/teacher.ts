import prisma from '@/lib/prisma';
import { getClassRoster, getClassSubjects, getGrades, getAttendance } from '@/mock/data';
import type { ClassCatalogItem, Subject, TeacherStats } from '@/types/domain';

export interface AssignedClassInfo {
  classId: string;
  mockKey: string | null;
  name: string;
  room: string | null;
  studentCount: number;
}

export interface TeacherAssignment {
  teacherId: string; // Teacher profile id
  userId: string;
  name: string;
  assignedClasses: AssignedClassInfo[];
}

function mockKeyFor(grade: number, section: string): string {
  return `cls-${grade}-${section.toLowerCase()}`;
}

/**
 * Resolves a real auth user (by id or email) to their mock teacher profile +
 * DB Teacher row + currently assigned DB classes (enriched with mock data).
 */
export async function getTeacherAssignment(input: {
  id?: string;
  email?: string;
}): Promise<TeacherAssignment | null> {
  const user = await prisma.user.findUnique({
    where: input.id ? { id: input.id } : input.email ? { email: input.email } : { id: '' }
  });
  if (!user) {
    return null;
  }

  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
  if (!teacher) {
    return null;
  }

  const assignments = await prisma.teacherClass.findMany({
    where: { teacherId: teacher.id },
    include: { class: true }
  });

  const assignedClasses: AssignedClassInfo[] = assignments.map((a) => {
    const mockKey = mockKeyFor(a.class.grade, a.class.section);
    const known = Boolean(getClassSubjects(mockKey).length || getClassRoster(mockKey).length);
    return {
      classId: a.class.id,
      mockKey: known ? mockKey : null,
      name: `Class ${a.class.grade}${a.class.section ? ` ${a.class.section}` : ''}`,
      room: a.class.room,
      studentCount: known ? getClassRoster(mockKey).length : 0
    };
  });

  return {
    teacherId: teacher.id,
    userId: user.id,
    name: user.name,
    assignedClasses
  };
}

export function buildTeacherStats(
  assigned: AssignedClassInfo[]
): TeacherStats {
  const classes = assigned.map((c) => ({
    id: c.classId,
    name: c.name,
    studentCount: c.studentCount
  }));

  const gradeDistributionForMyClasses = assigned.map((c) => {
    const gs = c.mockKey ? getGrades({ classId: c.mockKey }) : [];
    const cnt = (lg: string) => gs.filter((g) => g.letterGrade === lg).length;
    return {
      className: c.name,
      'A+': cnt('A+'),
      A: cnt('A'),
      B: cnt('B'),
      C: cnt('C'),
      D: cnt('D'),
      F: cnt('F')
    };
  });

  const attendanceRateByClass = assigned.map((c) => {
    const all = c.mockKey ? getAttendance({ classId: c.mockKey }) : [];
    const presentish = all.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absent = all.filter((r) => r.status === 'ABSENT').length;
    const denom = presentish + absent;
    return { className: c.name, rate: denom === 0 ? 0 : Math.round((presentish / denom) * 1000) / 10 };
  });

  const subjectIds = new Set<string>();
  for (const c of assigned) {
    if (!c.mockKey) continue;
    for (const cs of getClassSubjects(c.mockKey)) subjectIds.add(cs.subject.id);
  }

  const subjectsTaught: Subject[] = [...subjectIds].map((id) => {
    const cs = getClassSubjects(assigned.find((c) => c.mockKey && subjectIds.has(id))?.mockKey ?? '').find((x) => x.subject.id === id);
    return cs ? cs.subject : { id, name: id.replace('sub-', '').replace(/^\w/, (x) => x.toUpperCase()), code: id.replace('sub-', '').toUpperCase() };
  });

  return {
    myClasses: classes,
    subjectsTaught,
    gradeDistributionForMyClasses,
    attendanceRateByClass,
    averageStudentCount: classes.length
      ? Math.round(classes.reduce((s, c) => s + c.studentCount, 0) / classes.length)
      : 0
  };
}

export async function setTeacherClassAssignments(opts: {
  teacherId: string;
  classIds: string[];
  academicYear?: string;
}): Promise<void> {
  const academicYear = opts.academicYear ?? '2026-2027';
  const classIds = [...new Set(opts.classIds)];

  await prisma.$transaction(async (tx) => {
    await tx.teacherClass.deleteMany({
      where: { teacherId: opts.teacherId, academicYear }
    });
    if (classIds.length > 0) {
      await tx.teacherClass.createMany({
        data: classIds.map((classId) => ({
          teacherId: opts.teacherId,
          classId,
          academicYear
        }))
      });
    }
  });
}

export function toClassCatalogItem(c: {
  id: string;
  grade: number;
  section: string;
  room: string | null;
  academicYear: string;
}): ClassCatalogItem {
  const mockKey = mockKeyFor(c.grade, c.section);
  const known = Boolean(getClassSubjects(mockKey).length || getClassRoster(mockKey).length);
  return {
    id: c.id,
    grade: c.grade,
    section: c.section,
    name: `Class ${c.grade}${c.section ? ` ${c.section}` : ''}`,
    room: c.room,
    academicYear: c.academicYear,
    studentCount: known ? getClassRoster(mockKey).length : 0
  };
}

export async function getClassCatalog(): Promise<ClassCatalogItem[]> {
  const dbClasses = await prisma.class.findMany({
    orderBy: [{ grade: 'asc' }, { section: 'asc' }]
  });
  return dbClasses.map(toClassCatalogItem);
}

export async function findDbClassIds(classIds: string[]): Promise<string[]> {
  if (classIds.length === 0) return [];
  const rows = await prisma.class.findMany({ where: { id: { in: classIds } }, select: { id: true } });
  const found = new Set(rows.map((r) => r.id));
  return classIds.filter((id) => found.has(id));
}