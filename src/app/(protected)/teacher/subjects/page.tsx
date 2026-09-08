import { Star } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function TeacherSubjectsPage() {
  return (
    <>
      <PageHeader title='Subjects' description='Subjects you teach.' />
      <ComingSoon
        icon={Star}
        title='Subjects'
        description='Overview of the subjects you teach across your classes. Coming in a future module.'
      />
    </>
  );
}