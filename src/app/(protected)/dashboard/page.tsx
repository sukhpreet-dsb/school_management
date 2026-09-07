import { requireSession } from '@/server/auth';
import { redirect } from 'next/navigation';
import { roleHomePath } from '@/mock/nav';
import { normalizeRole } from '@/lib/roles';

export default async function DashboardPage() {
  const session = await requireSession();

  redirect(roleHomePath(normalizeRole(session.user.role)));
}