import { PageHeader } from '@/components/layout/page-header';
import { TeachersManager } from '@/components/admin/teachers-manager';

export default function AdminTeachersPage() {
  return (
    <>
      <PageHeader
        title="Teachers"
        description="Manage teacher accounts. Added teachers can sign in and access the teacher area."
      />
      <TeachersManager />
    </>
  );
}