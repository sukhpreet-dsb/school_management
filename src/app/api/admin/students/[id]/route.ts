import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';
import { deleteStudent, updateStudent } from '@/server/students';
import type { Student } from '@/types/domain';

const updateStudentSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  dob: z.string().trim().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().trim().max(200).optional(),
  guardianName: z.string().trim().max(80).optional(),
  guardianPhone: z.string().trim().max(30).optional(),
  schoolClassId: z.string().trim().min(1).optional()
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleApiRoute<Student>(async () => {
    await requireApiRole('admin');
    const { id } = await context.params;

    let body: z.infer<typeof updateStudentSchema>;
    try {
      body = updateStudentSchema.parse(await request.json());
    } catch {
      throw apiError(422, 'Invalid request body.');
    }

    try {
      const student = await updateStudent({ studentId: id, ...body });
      if (!student) {
        throw apiError(404, 'Student not found.');
      }
      return { data: student, status: 200 };
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'Class not found.') {
          throw apiError(404, 'Class not found.');
        }
        if (err.message === 'Student is already enrolled in this class.') {
          throw apiError(409, 'Student is already enrolled in this class.');
        }
      }
      throw apiError(500, 'Failed to update student.');
    }
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleApiRoute<{ id: string }>(async () => {
    await requireApiRole('admin');
    const { id } = await context.params;

    const deleted = await deleteStudent(id);
    if (!deleted) {
      throw apiError(404, 'Student not found.');
    }

    return { data: { id }, status: 200 };
  });
}