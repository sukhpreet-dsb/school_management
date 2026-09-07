import { isAuthenticated } from '@/server/user';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await isAuthenticated();

  redirect(session ? '/dashboard' : '/login');
}
