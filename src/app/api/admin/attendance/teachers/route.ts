import { NextRequest } from 'next/server';
import { handleApiRoute, requireApiRole, apiError } from '@/server/api-auth';
import {
  getAdminDailyTeacherAttendance,
  adminUpdateTeacherAttendance,
} from '@/server/attendance';
import type { AdminUpdateTeacherAttendanceBody } from '@/types/api';
import type { AttendanceStatus } from '@/types/domain';

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    await requireApiRole('admin');
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const data = await getAdminDailyTeacherAttendance({ date });
    return { data };
  });
}

const VALID_STATUSES: AttendanceStatus[] = [
  'PRESENT',
  'ABSENT',
  'LATE',
  'HALF_DAY',
  'EXCUSED',
];

export async function PUT(req: NextRequest) {
  return handleApiRoute(async () => {
    const session = await requireApiRole('admin');
    const body = (await req.json().catch(() => ({}))) as AdminUpdateTeacherAttendanceBody;

    if (!body.teacherId || typeof body.teacherId !== 'string') {
      throw apiError(422, 'Teacher ID is required.');
    }
    if (!body.date || typeof body.date !== 'string') {
      throw apiError(422, 'Date is required (YYYY-MM-DD).');
    }
    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      throw apiError(422, 'Valid attendance status is required.');
    }

    const data = await adminUpdateTeacherAttendance(session.user.id, {
      teacherId: body.teacherId,
      date: body.date,
      status: body.status,
      note: body.note,
    });

    return { data };
  });
}
