import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';
import { buildTeacherStats, getTeacherAssignment } from '@/server/teacher';
import type { TeacherStats } from '@/types/domain';

export async function GET() {
  return handleApiRoute<TeacherStats>(async () => {
    const session = await requireApiRole('teacher');

    const assignment = await getTeacherAssignment({ email: session.user.email });
    if (!assignment) {
      throw apiError(404, 'Teacher profile not found.');
    }

    return { data: buildTeacherStats(assignment.assignedClasses), status: 200 };
  });
}