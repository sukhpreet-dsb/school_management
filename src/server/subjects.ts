import prisma from '@/lib/prisma';
import type { Paginated, Subject } from '@/types/domain';

export type SubjectWithTeacherCount = Subject & {
  teacherCount: number;
};

export async function getAllSubjects(): Promise<Subject[]> {
  const rows = await prisma.subject.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true }
  });
  return rows;
}

export async function getDbSubjects(opts: {
  q?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<Paginated<SubjectWithTeacherCount>> {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 10;
  const q = opts.q?.trim();

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { code: { contains: q, mode: 'insensitive' as const } }
        ]
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.subject.findMany({
      where,
      include: {
        _count: { select: { teachers: true } }
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.subject.count({ where })
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      teacherCount: r._count.teachers
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export async function createSubject(input: {
  name: string;
  code: string;
}): Promise<Subject> {
  const name = input.name.trim();
  const code = input.code.trim().toUpperCase();

  const existing = await prisma.subject.findFirst({
    where: {
      OR: [
        { name: { equals: name, mode: 'insensitive' } },
        { code: { equals: code, mode: 'insensitive' } }
      ]
    }
  });

  if (existing) {
    if (existing.name.toLowerCase() === name.toLowerCase()) {
      throw new Error('A subject with this name already exists.');
    }
    throw new Error('A subject with this code already exists.');
  }

  const row = await prisma.subject.create({
    data: { name, code },
    select: { id: true, name: true, code: true }
  });

  return row;
}

export async function deleteSubject(id: string): Promise<boolean> {
  const row = await prisma.subject.findUnique({ where: { id } });
  if (!row) return false;

  await prisma.subject.delete({ where: { id } });
  return true;
}

export async function getTeacherSubjectsByUserId(userId: string): Promise<{
  teacherId: string;
  subjects: Subject[];
} | null> {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: {
      subjects: {
        include: { subject: { select: { id: true, name: true, code: true } } }
      }
    }
  });

  if (!teacher) return null;

  return {
    teacherId: teacher.id,
    subjects: teacher.subjects.map((ts) => ts.subject)
  };
}

export async function setTeacherSubjects(opts: {
  teacherId: string;
  subjectIds: string[];
}): Promise<void> {
  const subjectIds = [...new Set(opts.subjectIds)];

  await prisma.$transaction(async (tx) => {
    await tx.teacherSubject.deleteMany({
      where: { teacherId: opts.teacherId }
    });

    if (subjectIds.length > 0) {
      await tx.teacherSubject.createMany({
        data: subjectIds.map((subjectId) => ({
          teacherId: opts.teacherId,
          subjectId
        }))
      });
    }
  });
}

export async function findDbSubjectIds(subjectIds: string[]): Promise<string[]> {
  if (subjectIds.length === 0) return [];
  const rows = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
    select: { id: true }
  });
  const found = new Set(rows.map((r) => r.id));
  return subjectIds.filter((id) => found.has(id));
}
