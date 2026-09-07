'use client';

import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await authClient.signOut();
    if (error) {
      alert(error.message ?? 'An unexpected error occurred during logout.');
    } else {
      router.push('/login');
      router.refresh();
    }
  };

  return <Button onClick={handleLogout}>Log out</Button>;
}
