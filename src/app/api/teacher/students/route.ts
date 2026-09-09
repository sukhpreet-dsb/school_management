import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';
import { getTeacherAssignment } from '@/server/teacher';
import { getTeacherStudents } from '@/server/students';
import type { Paginated, Student } from '@/types/domain';

const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  classId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
});

export async function GET(request: NextRequest) {
  return handleApiRoute<Paginated<Student>>(async () => {
    const session = await requireApiRole('teacher');

    let query: z.infer<typeof listQuerySchema>;
    try {
      query = listQuerySchema.parse({
        q: request.nextUrl.searchParams.get('q') ?? undefined,
        classId: request.nextUrl.searchParams.get('classId') ?? undefined,
        page: request.nextUrl.searchParams.get('page') ?? 1,
        pageSize: request.nextUrl.searchParams.get('pageSize') ?? 10
      });
    } catch {
      throw apiError(422, 'Invalid query parameters.');
    }

    const assignment = await getTeacherAssignment({ email: session.user.email });
    if (!assignment) {
      throw apiError(404, 'Teacher profile not found.');
    }

    const assignedClassIds = assignment.assignedClasses.map((c) => c.classId);

    const result = await getTeacherStudents({
      classIds: assignedClassIds,
      classIdFilter: query.classId,
      q: query.q,
      page: query.page,
      pageSize: query.pageSize
    });

    return {
      data: result,
      status: 200
    };
  });
}
