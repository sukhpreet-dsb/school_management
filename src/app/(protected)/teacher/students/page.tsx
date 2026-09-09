import { PageHeader } from '@/components/layout/page-header';
import { TeacherStudentsManager } from '@/components/teacher/teacher-students-manager';

export default function TeacherStudentsPage() {
  return (
    <>
      <PageHeader title='Students' description='Student directory for your classes.' />
      <TeacherStudentsManager />
    </>
  );
}