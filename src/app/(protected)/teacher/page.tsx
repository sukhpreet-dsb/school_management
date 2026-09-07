import { getSession } from '@/server/auth';
import { LogoutButton } from '@/components/dashboard/logout-button';

export default async function TeacherPage() {
  const session = await getSession();
  const user = session?.user;

  return (
    <div className='mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 p-6 text-center'>
      <h1 className='text-3xl font-bold tracking-tight'>Teacher area</h1>
      <p className='text-muted-foreground'>
        Signed in as {user?.name} ({user?.role})
      </p>
      <LogoutButton />
    </div>
  );
}