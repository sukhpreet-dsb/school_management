import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';
import { createStudentAccount, getDbStudents } from '@/server/students';
import { isAdmissionNoAvailable } from '@/lib/profiles';
import type { Paginated, Student } from '@/types/domain';

const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
});

export async function GET(request: NextRequest) {
  return handleApiRoute<Paginated<Student>>(async () => {
    await requireApiRole('admin');

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

    return {
      data: await getDbStudents({
        q: query.q,
        page: query.page,
        pageSize: query.pageSize
      }),
      status: 200
    };
  });
}

const createStudentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(80),
  password: z.string().min(8).max(100),
  schoolClassId: z.string().trim().min(1),
  admissionNo: z.string().trim().max(20).optional(),
  dob: z.string().trim().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().trim().max(200).optional(),
  guardianName: z.string().trim().max(80).optional(),
  guardianPhone: z.string().trim().max(30).optional()
});

export async function POST(request: NextRequest) {
  return handleApiRoute<Student>(async () => {
    await requireApiRole('admin');

    let body: z.infer<typeof createStudentSchema>;
    try {
      body = createStudentSchema.parse(await request.json());
    } catch {
      throw apiError(422, 'Invalid request body.');
    }

    if (body.admissionNo && !(await isAdmissionNoAvailable(body.admissionNo))) {
      throw apiError(409, 'Admission no already in use.');
    }

    const emailTaken = await prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true }
    });
    if (emailTaken) {
      throw apiError(409, 'Email already in use.');
    }

    const classExists = await prisma.class.findUnique({
      where: { id: body.schoolClassId },
      select: { id: true }
    });
    if (!classExists) {
      throw apiError(404, 'Class not found.');
    }

    try {
      const student = await createStudentAccount({
        name: body.name,
        email: body.email,
        password: body.password,
        schoolClassId: body.schoolClassId,
        admissionNo: body.admissionNo,
        dob: body.dob,
        gender: body.gender,
        address: body.address,
        guardianName: body.guardianName,
        guardianPhone: body.guardianPhone
      });
      return { data: student, status: 201 };
    } catch (err) {
      if (err instanceof Error && err.message === 'Student is already enrolled in this class.') {
        throw apiError(409, 'Student is already enrolled in this class.');
      }
      throw apiError(500, err instanceof Error ? err.message : 'Failed to create student.');
    }
  });
}