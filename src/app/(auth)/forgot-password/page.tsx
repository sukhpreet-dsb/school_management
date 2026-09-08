import { isAuthenticated } from '@/server/user';
import { ForgotPasswordForm } from './forgot-password-form';
import { redirect } from 'next/navigation';

export default async function ForgotPasswordPage() {
  const session = await isAuthenticated();

  if (session) {
    redirect('/dashboard');
  }

  return <ForgotPasswordForm />;
}
