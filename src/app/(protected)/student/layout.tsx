import { requireRole } from '@/server/auth';
import { AppShell } from '@/components/layout/app-shell';

export default async function StudentLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole('student');
  console.log(session,"session");

  return (
    <AppShell
      role="student"
      user={{ name: session.user.name, email: session.user.email, role: 'student' }}
    >
      {children}
    </AppShell>
  );
}