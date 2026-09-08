import { GraduationCap } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function TeacherStudentsPage() {
  return (
    <>
      <PageHeader title='Students' description='Student directory for your classes.' />
      <ComingSoon
        icon={GraduationCap}
        title='Student directory'
        description='View and search all students across your classes. Coming in a future module.'
      />
    </>
  );
}