import { requireRole } from '@/server/auth';
import { TeacherDashboard } from '@/components/teacher/teacher-dashboard';

export default async function TeacherPage() {
  const session = await requireRole('teacher');

  return (
    <TeacherDashboard
      user={{ name: session.user.name, email: session.user.email }}
    />
  );
}