import { NextRequest } from 'next/server';
import { handleApiRoute, requireApiRole, apiError } from '@/server/api-auth';
import { teacherCheckIn } from '@/server/attendance';
import type { TeacherCheckInBody } from '@/types/api';

export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    const session = await requireApiRole('teacher');
    const body = (await req.json().catch(() => ({}))) as TeacherCheckInBody;

    if (body.latitude !== undefined && typeof body.latitude !== 'number') {
      throw apiError(422, 'Invalid latitude.');
    }
    if (body.longitude !== undefined && typeof body.longitude !== 'number') {
      throw apiError(422, 'Invalid longitude.');
    }

    const data = await teacherCheckIn(session.user.id, body);
    return { data, status: 201 };
  });
}
