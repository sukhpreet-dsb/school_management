import { PageHeader } from '@/components/layout/page-header';
import { MyClasses } from '@/components/teacher/my-classes';

export default function TeacherClassesPage() {
  return (
    <>
      <PageHeader
        title='My Classes'
        description='Classes you teach this academic year. Open a class to view its roster.'
      />
      <MyClasses />
    </>
  );
}