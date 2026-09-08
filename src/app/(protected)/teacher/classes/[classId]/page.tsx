import { notFound } from 'next/navigation';
import { requireRole } from '@/server/auth';
import { getTeacherForUser, getTeacherStats } from '@/mock/data';
import { PageHeader } from '@/components/layout/page-header';
import { ClassRoster } from '@/components/teacher/class-roster';

export default async function TeacherClassRosterPage({
  params
}: {
  params: Promise<{ classId: string }>;
}) {
  const session = await requireRole('teacher');
  const { classId } = await params;

  const teacher = getTeacherForUser({ email: session.user.email });
  const ownsClass =
    teacher && getTeacherStats(teacher.id).myClasses.some((c) => c.id === classId);

  if (!ownsClass) {
    notFound();
  }

  const className = getTeacherStats(teacher!.id).myClasses.find(
    (c) => c.id === classId
  )!.name;

  return (
    <>
      <PageHeader
        title={className}
        description='Students enrolled in this class this academic year.'
      />
      <ClassRoster classId={classId} className={className} />
    </>
  );
}