import { requireRole } from '@/server/auth';
import { AppShell } from '@/components/layout/app-shell';

export default async function TeacherLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole('teacher');

  return (
    <AppShell
      role="teacher"
      user={{
        name: session.user.name,
        email: session.user.email,
        role: "teacher",
        image: session.user.image
      }}
    >
      {children}
    </AppShell>
  );
}