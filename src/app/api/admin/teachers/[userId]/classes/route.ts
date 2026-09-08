import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';
import { findDbClassIds, setTeacherClassAssignments } from '@/server/teacher';
import { z } from 'zod';

const assignSchema = z.object({
  classIds: z.array(z.string().trim().min(1)).max(200)
});

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  return handleApiRoute<{ classIds: string[] }>(async () => {
    await requireApiRole('admin');
    const { userId } = await context.params;

    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) {
      throw apiError(404, 'Teacher not found.');
    }

    const rows = await prisma.teacherClass.findMany({
      where: { teacherId: teacher.id },
      select: { classId: true }
    });

    return { data: { classIds: rows.map((r) => r.classId) }, status: 200 };
  });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  return handleApiRoute<{ userId: string; classIds: string[] }>(async () => {
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

    const validIds = await findDbClassIds(body.classIds);
    if (validIds.length !== body.classIds.length) {
      throw apiError(422, 'One or more classes do not exist.');
    }

    await setTeacherClassAssignments({ teacherId: teacher.id, classIds: validIds });

    return { data: { userId, classIds: validIds }, status: 200 };
  });
}