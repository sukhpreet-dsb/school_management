import { handleApiRoute, requireApiRole } from '@/server/api-auth';
import { getTeacherTodayAttendance } from '@/server/attendance';

export async function GET() {
  return handleApiRoute(async () => {
    const session = await requireApiRole('teacher');
    const data = await getTeacherTodayAttendance(session.user.id);
    return { data };
  });
}
