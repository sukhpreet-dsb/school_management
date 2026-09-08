import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';

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