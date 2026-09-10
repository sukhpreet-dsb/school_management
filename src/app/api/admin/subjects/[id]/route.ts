import { NextRequest } from 'next/server';
import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';
import { deleteSubject } from '@/server/subjects';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleApiRoute<{ id: string }>(async () => {
    await requireApiRole('admin');
    const { id } = await context.params;

    const ok = await deleteSubject(id);
    if (!ok) {
      throw apiError(404, 'Subject not found.');
    }

    return { data: { id }, status: 200 };
  });
}
