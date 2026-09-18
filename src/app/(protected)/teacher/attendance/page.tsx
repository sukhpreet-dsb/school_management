import { PageHeader } from '@/components/layout/page-header';
import { TeacherAttendanceManager } from '@/components/teacher/teacher-attendance-manager';

export default function TeacherAttendancePage() {
  return (
    <>
      <PageHeader
        title='Teacher Attendance'
        description='Mark your daily check-in with campus geofencing and view attendance history.'
      />
      <TeacherAttendanceManager />
    </>
  );
}