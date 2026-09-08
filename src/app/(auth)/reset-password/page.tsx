import { Suspense } from 'react';
import { ResetPasswordForm } from './reset-password-form';

export default async function ResetPasswordPage() {
  return (
    <div className='bg-background relative flex min-h-screen w-full flex-col overflow-x-hidden'>
      <div className='flex h-full grow flex-col items-center justify-center p-4'>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}