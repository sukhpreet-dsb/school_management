import { getSession } from '@/server/auth';
import { redirect } from 'next/navigation';
import { roleHomePath } from '@/mock/nav';
import { normalizeRole } from '@/lib/roles';

export default async function Home() {
  const session = await getSession();

  redirect(session ? roleHomePath(normalizeRole(session.user.role)) : '/login');
}