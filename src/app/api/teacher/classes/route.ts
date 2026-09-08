import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';
import { getTeacherForUser, getTeacherStats } from '@/mock/data';
import type { Paginated, TeacherClassSummary } from '@/types/domain';

export async function GET() {
  return handleApiRoute<Paginated<TeacherClassSummary>>(async () => {
    const session = await requireApiRole('teacher');
    const teacher = getTeacherForUser({ email: session.user.email });

    if (!teacher) {
      throw apiError(404, 'Teacher profile not found.');
    }

    const { myClasses } = getTeacherStats(teacher.id);

    return {
      data: {
        items: myClasses,
        total: myClasses.length,
        page: 1,
        pageSize: myClasses.length,
        totalPages: myClasses.length ? 1 : 0
      },
      status: 200
    };
  });
}