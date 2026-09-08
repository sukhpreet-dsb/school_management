import { isAuthenticated } from '@/server/user';
import { ForgotPasswordForm } from './forgot-password-form';
import { redirect } from 'next/navigation';

export default async function ForgotPasswordPage() {
  const session = await isAuthenticated();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className='bg-background relative flex min-h-screen w-full flex-col overflow-x-hidden'>
      <div className='flex h-full grow flex-col items-center justify-center p-4'>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
