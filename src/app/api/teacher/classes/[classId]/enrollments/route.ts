import { NextRequest } from 'next/server';
import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';
import { getClassRoster, getTeacherForUser, getTeacherStats } from '@/mock/data';
import type { Student } from '@/types/domain';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ classId: string }> }
) {
  return handleApiRoute<Student[]>(async () => {
    const session = await requireApiRole('teacher');
    const { classId } = await context.params;

    const teacher = getTeacherForUser({ email: session.user.email });
    if (!teacher) {
      throw apiError(404, 'Teacher profile not found.');
    }

    const { myClasses } = getTeacherStats(teacher.id);
    if (!myClasses.some((c) => c.id === classId)) {
      throw apiError(403, 'You do not have access to this class.');
    }

    return { data: getClassRoster(classId), status: 200 };
  });
}