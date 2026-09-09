import { PageHeader } from '@/components/layout/page-header';
import { StudentsManager } from '@/components/admin/students-manager';

export default function AdminStudentsPage() {
  return (
    <>
      <PageHeader
        title="Students"
        description="Create students and enroll them in classes. Teachers see only the students in their assigned classes."
      />
      <StudentsManager />
    </>
  );
}