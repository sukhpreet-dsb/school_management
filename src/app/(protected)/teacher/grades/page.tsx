import { BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function TeacherGradesPage() {
  return (
    <>
      <PageHeader title='Grades' description='Enter and review student grades.' />
      <ComingSoon
        icon={BarChart3}
        title='Grade management'
        description='Record scores and view grade distributions for your classes. Coming in a future module.'
      />
    </>
  );
}