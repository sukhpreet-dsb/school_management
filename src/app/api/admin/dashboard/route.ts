import { handleApiRoute, requireApiRole } from '@/server/api-auth';
import { getDbAdminStats } from '@/server/admin';
import type { AdminStats } from '@/types/domain';

export async function GET() {
  return handleApiRoute<AdminStats>(async () => {
    await requireApiRole('admin');
    const data = await getDbAdminStats();
    return { data, status: 200 };
  });
}
