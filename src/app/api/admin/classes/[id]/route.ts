import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';
import { toClassCatalogItem } from '@/server/teacher';
import type { ClassCatalogItem } from '@/types/domain';

const updateClassSchema = z.object({
  grade: z.coerce.number().int().min(1).max(12).optional(),
  section: z.string().trim().toUpperCase().min(1).max(4).optional(),
  room: z.string().trim().max(30).nullable().optional()
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleApiRoute<ClassCatalogItem>(async () => {
    await requireApiRole('admin');
    const { id } = await context.params;

    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) {
      throw apiError(404, 'Class not found.');
    }

    let body: z.infer<typeof updateClassSchema>;
    try {
      body = updateClassSchema.parse(await request.json());
    } catch {
      throw apiError(422, 'Invalid request body.');
    }

    const nextGrade = body.grade ?? existing.grade;
    const nextSection = body.section ?? existing.section;
    const nextYear = existing.academicYear;

    if (nextGrade !== existing.grade || nextSection !== existing.section) {
      const duplicate = await prisma.class.findUnique({
        where: {
          grade_section_academicYear: {
            grade: nextGrade,
            section: nextSection,
            academicYear: nextYear
          }
        }
      });
      if (duplicate && duplicate.id !== id) {
        throw apiError(409, `Class ${nextGrade} ${nextSection} already exists.`);
      }
    }

    const updated = await prisma.class.update({
      where: { id },
      data: {
        ...(body.grade !== undefined ? { grade: body.grade } : {}),
        ...(body.section !== undefined ? { section: body.section } : {}),
        ...(body.room !== undefined ? { room: body.room } : {})
      }
    });

    const studentCount = await prisma.enrollment.count({
      where: {
        schoolClassId: id,
        status: 'ACTIVE',
        academicYear: existing.academicYear
      }
    });

    return {
      data: toClassCatalogItem(updated, studentCount),
      status: 200
    };
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleApiRoute<{ id: string }>(async () => {
    await requireApiRole('admin');
    const { id } = await context.params;

    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) {
      throw apiError(404, 'Class not found.');
    }

    await prisma.class.delete({ where: { id } });
    return { data: { id }, status: 200 };
  });
}