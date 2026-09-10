import { PageHeader } from '@/components/layout/page-header';
import { SubjectsManager } from '@/components/admin/subjects-manager';

export default function AdminSubjectsPage() {
  return (
    <>
      <PageHeader
        title="Subjects"
        description="Manage school subjects catalog. Assign subjects to teachers across your school."
      />
      <SubjectsManager />
    </>
  );
}
