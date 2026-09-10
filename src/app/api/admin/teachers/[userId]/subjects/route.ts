import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';
import { findDbSubjectIds, setTeacherSubjects } from '@/server/subjects';
import { z } from 'zod';

const assignSchema = z.object({
  subjectIds: z.array(z.string().trim().min(1)).max(200)
});

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  return handleApiRoute<{ subjectIds: string[] }>(async () => {
    await requireApiRole('admin');
    const { userId } = await context.params;

    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) {
      throw apiError(404, 'Teacher not found.');
    }

    const rows = await prisma.teacherSubject.findMany({
      where: { teacherId: teacher.id },
      select: { subjectId: true }
    });

    return { data: { subjectIds: rows.map((r) => r.subjectId) }, status: 200 };
  });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  return handleApiRoute<{ userId: string; subjectIds: string[] }>(async () => {
    await requireApiRole('admin');
    const { userId } = await context.params;

    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) {
      throw apiError(404, 'Teacher not found.');
    }

    let body: z.infer<typeof assignSchema>;
    try {
      body = assignSchema.parse(await request.json());
    } catch {
      throw apiError(422, 'Invalid request body.');
    }

    const validIds = await findDbSubjectIds(body.subjectIds);
    if (validIds.length !== body.subjectIds.length) {
      throw apiError(422, 'One or more subjects do not exist.');
    }

    await setTeacherSubjects({ teacherId: teacher.id, subjectIds: validIds });

    return { data: { userId, subjectIds: validIds }, status: 200 };
  });
}
