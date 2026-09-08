import { isAuthenticated } from '@/server/user';
import { SignupForm } from './signup-form';
import { redirect } from 'next/navigation';

export default async function SignUpPage() {
  const session = await isAuthenticated();

  if (session) {
    redirect('/dashboard');
  }

  return <SignupForm />;
}
