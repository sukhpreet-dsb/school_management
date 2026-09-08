import { notFound } from 'next/navigation';
import { requireRole } from '@/server/auth';
import { getTeacherAssignment } from '@/server/teacher';
import { PageHeader } from '@/components/layout/page-header';
import { ClassRoster } from '@/components/teacher/class-roster';

export default async function TeacherClassRosterPage({
  params
}: {
  params: Promise<{ classId: string }>;
}) {
  const session = await requireRole('teacher');
  const { classId } = await params;

  const assignment = await getTeacherAssignment({ email: session.user.email });
  const target = assignment?.assignedClasses.find((c) => c.classId === classId);

  if (!target) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={target.name}
        description='Students enrolled in this class this academic year.'
      />
      <ClassRoster classId={classId} className={target.name} />
    </>
  );
}