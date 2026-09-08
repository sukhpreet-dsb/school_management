import { isAuthenticated } from '@/server/user';
import { LoginForm } from './login-form';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const session = await isAuthenticated();

  if (session) {
    redirect('/dashboard');
  }

  return <LoginForm />;
}
