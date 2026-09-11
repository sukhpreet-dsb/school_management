import { requireRole } from '@/server/auth';
import { AppShell } from '@/components/layout/app-shell';

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole('admin');

  return (
    <AppShell
      role="admin"
      user={{
        name: session.user.name,
        email: session.user.email,
        role: "admin",
        image: session.user.image
      }}
    >
      {children}
    </AppShell>
  );
}