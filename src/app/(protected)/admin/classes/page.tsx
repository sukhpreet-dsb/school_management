import { PageHeader } from '@/components/layout/page-header';
import { ClassesManager } from '@/components/admin/classes-manager';

export default function AdminClassesPage() {
  return (
    <>
      <PageHeader
        title="Classes"
        description="Manage classes by grade and section. Assigned classes appear in each teacher's dashboard."
      />
      <ClassesManager />
    </>
  );
}