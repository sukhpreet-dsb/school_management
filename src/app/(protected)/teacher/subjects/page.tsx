import { PageHeader } from '@/components/layout/page-header';
import { MySubjects } from '@/components/teacher/my-subjects';

export default function TeacherSubjectsPage() {
  return (
    <>
      <PageHeader title='Subjects' description='Subjects you teach.' />
      <MySubjects />
    </>
  );
}