import { isAuthenticated } from '@/server/user';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/dashboard/logout-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default async function DashboardPage() {
  const session = await isAuthenticated();

  if (!session) {
    redirect('/login');
  }

  const user = session.user;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className='mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 p-6 md:p-10'>
      <div className='flex flex-col items-center gap-4 text-center'>
        <Avatar size='lg'>
          <AvatarImage src={user.image ?? undefined} alt={user.name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>
            Welcome, {user.name}!
          </h1>
          <p className='text-muted-foreground mt-2'>
            You are signed in to your account.
          </p>
        </div>
      </div>

      <div className='flex flex-col gap-4 text-left'>
        <dl className='border-border bg-card rounded-lg border p-4 text-sm'>
          <div className='flex justify-between py-1.5'>
            <dt className='text-muted-foreground'>Email</dt>
            <dd className='font-medium'>{user.email}</dd>
          </div>
          <div className='flex justify-between py-1.5'>
            <dt className='text-muted-foreground'>Role</dt>
            <dd className='font-medium capitalize'>{user.role}</dd>
          </div>
          <div className='flex justify-between py-1.5'>
            <dt className='text-muted-foreground'>Email verified</dt>
            <dd className='font-medium'>
              {user.emailVerified ? 'Yes' : 'No'}
            </dd>
          </div>
          <div className='flex justify-between py-1.5'>
            <dt className='text-muted-foreground'>Member since</dt>
            <dd className='font-medium'>
              {new Date(user.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>

        <div className='flex justify-center'>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
