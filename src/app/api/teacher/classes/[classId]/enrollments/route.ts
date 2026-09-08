import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';
import { getTeacherAssignment } from '@/server/teacher';
import { getClassRoster } from '@/mock/data';
import type { Paginated, Student } from '@/types/domain';

const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ classId: string }> }
) {
  return handleApiRoute<Paginated<Student>>(async () => {
    const session = await requireApiRole('teacher');
    const { classId } = await context.params;

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

    const target = assignment.assignedClasses.find((c) => c.classId === classId);
    if (!target) {
      throw apiError(403, 'You do not have access to this class.');
    }

    let roster = target.mockKey ? getClassRoster(target.mockKey) : [];
    if (query.q) {
      const q = query.q.toLowerCase();
      roster = roster.filter((s) =>
        [s.name, s.email, s.admissionNo, s.guardianName]
          .map((v) => (v ?? '').toLowerCase())
          .some((v) => v.includes(q))
      );
    }

    const total = roster.length;
    const start = (query.page - 1) * query.pageSize;
    const items = roster.slice(start, start + query.pageSize);

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