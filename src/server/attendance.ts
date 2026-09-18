import prisma from '@/lib/prisma';
import { apiError } from '@/server/api-auth';
import { checkCampusGeofence, getSchoolCoordinates, DEFAULT_SCHOOL_CONFIG } from '@/lib/geo';
import type {
  AttendanceStatus,
  TeacherTodayAttendance,
  TeacherAttendanceRecord,
  AdminDailyTeacherAttendance,
  AdminTeacherAttendanceItem,
} from '@/types/domain';

export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a YYYY-MM-DD string into a UTC Date object for Prisma's @db.Date column
 */
export function parseDateInput(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

/**
 * Converts a Date object or ISO string back to a clean YYYY-MM-DD string
 */
export function formatDateOutput(date: Date | string): string {
  if (typeof date === 'string') {
    return date.slice(0, 10);
  }
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function getTeacherTodayAttendance(userId: string): Promise<TeacherTodayAttendance> {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: { user: true },
  });

  const schoolConfig = {
    ...getSchoolCoordinates(),
    name: DEFAULT_SCHOOL_CONFIG.name,
  };

  if (!teacher) {
    return {
      hasCheckedIn: false,
      record: null,
      schoolConfig,
    };
  }

  const todayStr = getTodayDateString();
  const todayDate = parseDateInput(todayStr);

  const record = await prisma.teacherAttendance.findUnique({
    where: {
      teacherId_date: {
        teacherId: teacher.id,
        date: todayDate,
      },
    },
  });

  if (!record) {
    return {
      hasCheckedIn: false,
      record: null,
      schoolConfig,
    };
  }

  return {
    hasCheckedIn: true,
    record: {
      id: record.id,
      teacherId: record.teacherId,
      teacherUserId: teacher.userId,
      teacherName: teacher.user.name,
      teacherEmail: teacher.user.email,
      empCode: teacher.empCode,
      date: formatDateOutput(record.date),
      status: record.status as AttendanceStatus,
      checkInTime: record.checkInTime ? record.checkInTime.toISOString() : null,
      checkOutTime: record.checkOutTime ? record.checkOutTime.toISOString() : null,
      latitude: record.latitude,
      longitude: record.longitude,
      distanceMeters: record.distanceMeters,
      isInsideSchool: record.isInsideSchool,
      note: record.note,
      markedById: record.markedById,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    },
    schoolConfig,
  };
}

export async function teacherCheckIn(
  userId: string,
  input: { latitude?: number; longitude?: number; note?: string }
): Promise<TeacherAttendanceRecord> {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!teacher) {
    throw apiError(404, 'Teacher profile not found.');
  }

  const todayStr = getTodayDateString();
  const todayDate = parseDateInput(todayStr);

  const existing = await prisma.teacherAttendance.findUnique({
    where: {
      teacherId_date: {
        teacherId: teacher.id,
        date: todayDate,
      },
    },
  });

  if (existing) {
    throw apiError(409, 'Attendance has already been marked for today.');
  }

  let isInsideSchool = false;
  let distanceMeters: number | null = null;
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (typeof input.latitude === 'number' && typeof input.longitude === 'number') {
    latitude = input.latitude;
    longitude = input.longitude;
    const geo = checkCampusGeofence(latitude, longitude);
    distanceMeters = geo.distanceMeters;
    isInsideSchool = geo.isInside;
  }

  const now = new Date();
  // Late check: after 09:30 AM
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const isLate = hours > 9 || (hours === 9 && minutes > 30);
  const status: AttendanceStatus = isLate ? 'LATE' : 'PRESENT';

  const record = await prisma.teacherAttendance.create({
    data: {
      teacherId: teacher.id,
      date: todayDate,
      status,
      checkInTime: now,
      latitude,
      longitude,
      distanceMeters,
      isInsideSchool,
      note: input.note?.trim() || null,
      markedById: userId,
    },
  });

  return {
    id: record.id,
    teacherId: record.teacherId,
    teacherUserId: teacher.userId,
    teacherName: teacher.user.name,
    teacherEmail: teacher.user.email,
    empCode: teacher.empCode,
    date: formatDateOutput(record.date),
    status: record.status as AttendanceStatus,
    checkInTime: record.checkInTime ? record.checkInTime.toISOString() : null,
    checkOutTime: record.checkOutTime ? record.checkOutTime.toISOString() : null,
    latitude: record.latitude,
    longitude: record.longitude,
    distanceMeters: record.distanceMeters,
    isInsideSchool: record.isInsideSchool,
    note: record.note,
    markedById: record.markedById,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getTeacherAttendanceHistory(
  userId: string,
  opts?: { limit?: number }
): Promise<TeacherAttendanceRecord[]> {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!teacher) {
    return [];
  }

  const records = await prisma.teacherAttendance.findMany({
    where: { teacherId: teacher.id },
    orderBy: { date: 'desc' },
    take: opts?.limit ?? 30,
  });

  return records.map((record) => ({
    id: record.id,
    teacherId: record.teacherId,
    teacherUserId: teacher.userId,
    teacherName: teacher.user.name,
    teacherEmail: teacher.user.email,
    empCode: teacher.empCode,
    date: formatDateOutput(record.date),
    status: record.status as AttendanceStatus,
    checkInTime: record.checkInTime ? record.checkInTime.toISOString() : null,
    checkOutTime: record.checkOutTime ? record.checkOutTime.toISOString() : null,
    latitude: record.latitude,
    longitude: record.longitude,
    distanceMeters: record.distanceMeters,
    isInsideSchool: record.isInsideSchool,
    note: record.note,
    markedById: record.markedById,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }));
}

export async function getAdminDailyTeacherAttendance(input: {
  date?: string;
}): Promise<AdminDailyTeacherAttendance> {
  const targetDateStr = input.date?.trim() || getTodayDateString();
  const targetDate = parseDateInput(targetDateStr);

  const teachers = await prisma.teacher.findMany({
    include: {
      user: true,
      attendances: {
        where: { date: targetDate },
      },
    },
    orderBy: {
      user: { name: 'asc' },
    },
  });

  const records: AdminTeacherAttendanceItem[] = teachers.map((teacher) => {
    const att = teacher.attendances[0];
    if (att) {
      return {
        teacherId: teacher.id,
        userId: teacher.userId,
        name: teacher.user.name,
        email: teacher.user.email,
        empCode: teacher.empCode,
        phone: teacher.phone,
        status: att.status as AttendanceStatus,
        checkInTime: att.checkInTime ? att.checkInTime.toISOString() : null,
        checkOutTime: att.checkOutTime ? att.checkOutTime.toISOString() : null,
        latitude: att.latitude,
        longitude: att.longitude,
        distanceMeters: att.distanceMeters,
        isInsideSchool: att.isInsideSchool,
        note: att.note,
        attendanceId: att.id,
      };
    }

    return {
      teacherId: teacher.id,
      userId: teacher.userId,
      name: teacher.user.name,
      email: teacher.user.email,
      empCode: teacher.empCode,
      phone: teacher.phone,
      status: 'ABSENT' as AttendanceStatus,
      checkInTime: null,
      checkOutTime: null,
      latitude: null,
      longitude: null,
      distanceMeters: null,
      isInsideSchool: false,
      note: null,
      attendanceId: null,
    };
  });

  const summary = {
    totalTeachers: records.length,
    present: records.filter((r) => r.status === 'PRESENT').length,
    absent: records.filter((r) => r.status === 'ABSENT').length,
    late: records.filter((r) => r.status === 'LATE').length,
    halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
    excused: records.filter((r) => r.status === 'EXCUSED').length,
    insideCampusCount: records.filter((r) => r.checkInTime && r.isInsideSchool).length,
    outsideCampusCount: records.filter((r) => r.checkInTime && !r.isInsideSchool).length,
  };

  return {
    date: targetDateStr,
    summary,
    records,
  };
}

export async function adminUpdateTeacherAttendance(
  adminUserId: string,
  input: {
    teacherId: string;
    date: string;
    status: AttendanceStatus;
    note?: string | null;
  }
): Promise<AdminTeacherAttendanceItem> {
  const teacher = await prisma.teacher.findUnique({
    where: { id: input.teacherId },
    include: { user: true },
  });

  if (!teacher) {
    throw apiError(404, 'Teacher not found.');
  }

  const targetDate = parseDateInput(input.date);

  const att = await prisma.teacherAttendance.upsert({
    where: {
      teacherId_date: {
        teacherId: input.teacherId,
        date: targetDate,
      },
    },
    create: {
      teacherId: input.teacherId,
      date: targetDate,
      status: input.status,
      note: input.note?.trim() || null,
      markedById: adminUserId,
      isInsideSchool: true, // Manual admin override
    },
    update: {
      status: input.status,
      note: input.note !== undefined ? (input.note?.trim() || null) : undefined,
      markedById: adminUserId,
    },
  });

  return {
    teacherId: teacher.id,
    userId: teacher.userId,
    name: teacher.user.name,
    email: teacher.user.email,
    empCode: teacher.empCode,
    phone: teacher.phone,
    status: att.status as AttendanceStatus,
    checkInTime: att.checkInTime ? att.checkInTime.toISOString() : null,
    checkOutTime: att.checkOutTime ? att.checkOutTime.toISOString() : null,
    latitude: att.latitude,
    longitude: att.longitude,
    distanceMeters: att.distanceMeters,
    isInsideSchool: att.isInsideSchool,
    note: att.note,
    attendanceId: att.id,
  };
}
