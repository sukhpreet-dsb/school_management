import { isAuthenticated } from '@/server/user';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await isAuthenticated();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className='bg-muted/40 flex min-h-svh flex-col'>
      <header className='border-border bg-background flex h-16 items-center justify-between border-b px-6'>
        <span className='text-lg font-semibold tracking-tight'>Dashboard</span>
      </header>
      <main className='flex flex-1 flex-col'>{children}</main>
    </div>
  );
}
