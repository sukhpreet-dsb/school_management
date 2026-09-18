import { PageHeader } from '@/components/layout/page-header';
import { AdminTeacherAttendanceManager } from '@/components/admin/admin-teacher-attendance-manager';

export default function AdminAttendancePage() {
  return (
    <>
      <PageHeader
        title='Teacher Attendance'
        description='Daily staff attendance overview, campus geofencing compliance, and status overrides.'
      />
      <AdminTeacherAttendanceManager />
    </>
  );
}
