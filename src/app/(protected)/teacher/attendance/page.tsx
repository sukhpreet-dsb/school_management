import { CalendarDays } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function TeacherAttendancePage() {
  return (
    <>
      <PageHeader title='Attendance' description='Mark and review class attendance.' />
      <ComingSoon
        icon={CalendarDays}
        title='Attendance tracking'
        description='Mark daily attendance for your classes. Coming in a future module.'
      />
    </>
  );
}