import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { ensureStudentProfile } from '@/lib/profiles';
import { ACADEMIC_YEAR } from '@/mock/data';
import type { Paginated, Student } from '@/types/domain';

export type StudentRow = {
  id: string;
  admissionNo: string;
  dob: Date | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  address: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  user: { id: string; name: string; email: string };
  enrollments: Array<{
    schoolClassId: string;
    academicYear: string;
    status: 'ACTIVE' | 'TRANSFERRED' | 'GRADUATED' | 'DROPPED';
    schoolClass: { id: string; grade: number; section: string; academicYear: string };
  }>;
}

export function toStudentDto(row: StudentRow): Student {
  const active = row.enrollments.find(
    (e) => e.status === 'ACTIVE' && e.academicYear === ACADEMIC_YEAR
  );

  return {
    id: row.id,
    userId: row.user.id,
    admissionNo: row.admissionNo,
    name: row.user.name,
    email: row.user.email,
    dob: row.dob ? row.dob.toISOString() : null,
    gender: row.gender,
    address: row.address,
    guardianName: row.guardianName,
    guardianPhone: row.guardianPhone,
    currentClass: active
      ? {
          id: active.schoolClass.id,
          name: `Class ${active.schoolClass.grade}${
            active.schoolClass.section ? ` ${active.schoolClass.section}` : ''
          }`,
          section: active.schoolClass.section,
          academicYear: active.schoolClass.academicYear
        }
      : null
  };
}

const studentInclude = {
  user: { select: { id: true, name: true, email: true } },
  enrollments: {
    where: { status: 'ACTIVE' as const, academicYear: ACADEMIC_YEAR },
    select: {
      schoolClassId: true,
      academicYear: true,
      status: true,
      schoolClass: { select: { id: true, grade: true, section: true, academicYear: true } }
    }
  }
} satisfies NonNullable<Parameters<typeof prisma.student.findMany>[0]>['include'];

export async function createStudentAccount(input: {
  name: string;
  email: string;
  password: string;
  admissionNo?: string;
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  schoolClassId: string;
}): Promise<Student> {
  const result = await auth.api.createUser({
    body: {
      name: input.name,
      email: input.email,
      password: input.password,
      role: 'student' as 'admin' | 'user'
    },
    headers: await headers()
  });

  try {
    await ensureStudentProfile({
      userId: result.user.id,
      admissionNo: input.admissionNo,
      dob: input.dob ?? null,
      gender: input.gender ?? null,
      address: input.address ?? null,
      guardianName: input.guardianName ?? null,
      guardianPhone: input.guardianPhone ?? null
    });

    await enrollStudent({
      studentId: (await prisma.student.findUnique({ where: { userId: result.user.id } }))!.id,
      classId: input.schoolClassId
    });
  } catch (err) {
    console.error(`[student] profile setup failed for ${input.email}:`, err);
    await prisma.user.delete({ where: { id: result.user.id } }).catch(() => {});
    throw new Error('Account created but student setup failed. Please try again.');
  }

  const row = await prisma.student.findUnique({
    where: { userId: result.user.id },
    include: studentInclude
  });
  return toStudentDto(row as unknown as StudentRow);
}

export async function enrollStudent(opts: {
  studentId: string;
  classId: string;
  academicYear?: string;
}): Promise<void> {
  const academicYear = opts.academicYear ?? ACADEMIC_YEAR;

  const schoolClass = await prisma.class.findUnique({ where: { id: opts.classId } });
  if (!schoolClass) {
    throw new Error('Class not found.');
  }

  const existing = await prisma.enrollment.findUnique({
    where: {
      studentId_schoolClassId_academicYear: {
        studentId: opts.studentId,
        schoolClassId: opts.classId,
        academicYear
      }
    }
  });
  if (existing) {
    throw new Error('Student is already enrolled in this class.');
  }

  await prisma.enrollment.create({
    data: {
      studentId: opts.studentId,
      schoolClassId: opts.classId,
      academicYear,
      status: 'ACTIVE'
    }
  });
}

export async function getDbStudents(opts: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<Student>> {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 10;
  const q = opts.q?.trim();

  const where = q
    ? {
        OR: [
          { user: { name: { contains: q, mode: 'insensitive' as const } } },
          { user: { email: { contains: q, mode: 'insensitive' as const } } },
          { admissionNo: { contains: q, mode: 'insensitive' as const } },
          { guardianName: { contains: q, mode: 'insensitive' as const } }
        ]
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: studentInclude,
      orderBy: { admissionNo: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.student.count({ where })
  ]);

  return {
    items: rows.map((r) => toStudentDto(r as unknown as StudentRow)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export async function getRosterStudents(opts: {
  classId: string;
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<Student>> {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 10;
  const q = opts.q?.trim();

  const where = {
    enrollments: {
      some: { schoolClassId: opts.classId, status: 'ACTIVE' as const, academicYear: ACADEMIC_YEAR }
    },
    ...(q
      ? {
          OR: [
            { user: { name: { contains: q, mode: 'insensitive' as const } } },
            { user: { email: { contains: q, mode: 'insensitive' as const } } },
            { admissionNo: { contains: q, mode: 'insensitive' as const } },
            { guardianName: { contains: q, mode: 'insensitive' as const } }
          ]
        }
      : {})
  };

  const [rows, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: studentInclude,
      orderBy: { admissionNo: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.student.count({ where })
  ]);

  return {
    items: rows.map((r) => toStudentDto(r as unknown as StudentRow)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export async function getTeacherStudents(opts: {
  classIds: string[];
  classIdFilter?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<Student>> {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 10;
  const q = opts.q?.trim();

  const targetClassIds = opts.classIdFilter
    ? opts.classIds.filter((id) => id === opts.classIdFilter)
    : opts.classIds;

  if (targetClassIds.length === 0) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0
    };
  }

  const where = {
    enrollments: {
      some: {
        schoolClassId: { in: targetClassIds },
        status: 'ACTIVE' as const,
        academicYear: ACADEMIC_YEAR
      }
    },
    ...(q
      ? {
          OR: [
            { user: { name: { contains: q, mode: 'insensitive' as const } } },
            { user: { email: { contains: q, mode: 'insensitive' as const } } },
            { admissionNo: { contains: q, mode: 'insensitive' as const } },
            { guardianName: { contains: q, mode: 'insensitive' as const } }
          ]
        }
      : {})
  };

  const [rows, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: studentInclude,
      orderBy: { admissionNo: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.student.count({ where })
  ]);

  return {
    items: rows.map((r) => toStudentDto(r as unknown as StudentRow)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export async function updateStudent(input: {
  studentId: string;
  name?: string;
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  schoolClassId?: string;
}): Promise<Student | null> {
  const student = await prisma.student.findUnique({
    where: { id: input.studentId },
    include: { user: { select: { id: true } } }
  });
  if (!student) return null;

  if (input.name) {
    await prisma.user.update({
      where: { id: student.userId },
      data: { name: input.name }
    });
  }

  await ensureStudentProfile({
    userId: student.userId,
    dob: input.dob,
    gender: input.gender,
    address: input.address,
    guardianName: input.guardianName,
    guardianPhone: input.guardianPhone
  });

  if (input.schoolClassId) {
    const schoolClass = await prisma.class.findUnique({ where: { id: input.schoolClassId } });
    if (!schoolClass) {
      throw new Error('Class not found.');
    }

    const active = await prisma.enrollment.findFirst({
      where: { studentId: student.id, academicYear: ACADEMIC_YEAR, status: 'ACTIVE' }
    });

    if (active?.schoolClassId === input.schoolClassId) {
      // already in the target class — no move needed
    } else {
      const inTarget = await prisma.enrollment.findUnique({
        where: {
          studentId_schoolClassId_academicYear: {
            studentId: student.id,
            schoolClassId: input.schoolClassId,
            academicYear: ACADEMIC_YEAR
          }
        }
      });

      if (inTarget && inTarget.status === 'ACTIVE' && inTarget.id !== active?.id) {
        throw new Error('Student is already enrolled in this class.');
      }

      if (inTarget && inTarget.id !== active?.id) {
        await prisma.enrollment.delete({ where: { id: inTarget.id } });
      }

      if (active) {
        await prisma.enrollment.update({
          where: { id: active.id },
          data: { schoolClassId: input.schoolClassId, status: 'ACTIVE' }
        });
      } else {
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            schoolClassId: input.schoolClassId,
            academicYear: ACADEMIC_YEAR,
            status: 'ACTIVE'
          }
        });
      }
    }
  }

  const row = await prisma.student.findUnique({
    where: { id: input.studentId },
    include: studentInclude
  });
  return toStudentDto(row as unknown as StudentRow);
}

export async function deleteStudent(studentId: string): Promise<boolean> {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return false;

  await prisma.user.delete({ where: { id: student.userId } });
  return true;
}