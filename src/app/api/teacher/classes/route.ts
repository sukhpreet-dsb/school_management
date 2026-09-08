import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';
import { getTeacherAssignment } from '@/server/teacher';
import type { Paginated, TeacherClassSummary } from '@/types/domain';

const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
});

export async function GET(request: NextRequest) {
  return handleApiRoute<Paginated<TeacherClassSummary>>(async () => {
    const session = await requireApiRole('teacher');

    let query: z.infer<typeof listQuerySchema>;
    try {
      query = listQuerySchema.parse({
        q: request.nextUrl.searchParams.get('q') ?? undefined,
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

    let myClasses = assignment.assignedClasses.map((c) => ({
      id: c.classId,
      name: c.name,
      studentCount: c.studentCount
    }));

    if (query.q) {
      const q = query.q.toLowerCase();
      myClasses = myClasses.filter((c) => c.name.toLowerCase().includes(q));
    }

    const total = myClasses.length;
    const start = (query.page - 1) * query.pageSize;
    const items = myClasses.slice(start, start + query.pageSize);

    return {
      data: {
        items,
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize)
      },
      status: 200
    };
  });
}