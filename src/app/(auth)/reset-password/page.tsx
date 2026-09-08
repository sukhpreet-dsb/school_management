import { Suspense } from 'react';
import { ResetPasswordForm } from './reset-password-form';

export default async function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}