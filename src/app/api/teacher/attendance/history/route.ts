import { handleApiRoute, requireApiRole } from '@/server/api-auth';
import { getTeacherAttendanceHistory } from '@/server/attendance';

export async function GET() {
  return handleApiRoute(async () => {
    const session = await requireApiRole('teacher');
    const data = await getTeacherAttendanceHistory(session.user.id);
    return { data };
  });
}
