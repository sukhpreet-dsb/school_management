import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';
import { getTeacherForUser, getTeacherStats } from '@/mock/data';
import type { TeacherStats } from '@/types/domain';

export async function GET() {
  return handleApiRoute<TeacherStats>(async () => {
    const session = await requireApiRole('teacher');
    const teacher = getTeacherForUser({ email: session.user.email });

    if (!teacher) {
      throw apiError(404, 'Teacher profile not found.');
    }

    return { data: getTeacherStats(teacher.id), status: 200 };
  });
}