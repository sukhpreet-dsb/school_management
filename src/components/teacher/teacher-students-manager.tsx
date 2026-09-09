'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangleIcon, GraduationCap } from 'lucide-react';

import { DataTable } from '@/components/data-table/data-table';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMyClasses, useTeacherStudents } from '@/lib/queries';
import { useSafePage } from '@/lib/use-safe-page';
import type { Student } from '@/types/domain';

function ClassBadge({ student }: { student: Student }) {
  return student.currentClass ? (
    <Badge variant='info'>{student.currentClass.name}</Badge>
  ) : (
    <span className='text-muted-foreground'>Not enrolled</span>
  );
}

const columns: ColumnDef<Student>[] = [
  {
    accessorKey: 'admissionNo',
    header: 'Admission No'
  },
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'currentClass',
    header: 'Class',
    cell: ({ row }) => <ClassBadge student={row.original} />
  },
  {
    accessorKey: 'guardianName',
    header: 'Guardian',
    cell: ({ row }) => row.original.guardianName ?? '—'
  },
  {
    accessorKey: 'guardianPhone',
    header: 'Guardian Phone',
    cell: ({ row }) => row.original.guardianPhone ?? '—'
  }
];

export function TeacherStudentsManager() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const myClassesQuery = useMyClasses({ pageSize: 100 });
  const assignedClasses = useMemo(() => myClassesQuery.data?.items ?? [], [myClassesQuery.data]);

  const studentsQuery = useTeacherStudents({
    page,
    pageSize,
    q: search || undefined,
    classId: selectedClassId || undefined
  });

  const safePage = useSafePage(page, studentsQuery.data?.totalPages, setPage);

  if (myClassesQuery.isError || studentsQuery.isError) {
    return (
      <Alert variant='destructive'>
        <AlertTriangleIcon className='h-4 w-4' />
        <AlertTitle>Could not load students</AlertTitle>
        <AlertDescription>
          {studentsQuery.error instanceof Error
            ? studentsQuery.error.message
            : 'An error occurred while loading student records. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (myClassesQuery.isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Spinner />
      </div>
    );
  }

  if (assignedClasses.length === 0) {
    return (
      <div className='bg-card text-card-foreground flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center'>
        <div className='bg-muted/50 mb-4 rounded-full p-4'>
          <GraduationCap className='text-muted-foreground size-8' />
        </div>
        <h3 className='text-lg font-medium'>No assigned classes</h3>
        <p className='text-muted-foreground mt-1 max-w-sm text-sm'>
          You are not currently assigned to any classes. Once an administrator assigns classes to
          your account, your students will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      {studentsQuery.isLoading ? (
        <div className='flex justify-center py-12'>
          <Spinner />
        </div>
      ) : (
        <DataTable
          mode='server'
          columns={columns}
          data={studentsQuery.data?.items ?? []}
          total={studentsQuery.data?.total ?? 0}
          page={safePage}
          pageSize={pageSize}
          search={search}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onSearchChange={(q) => {
            setSearch(q);
            setPage(1);
          }}
          searchKey='name'
          searchPlaceholder='Search students by name, email, admission no or guardian…'
          emptyMessage={
            search || selectedClassId
              ? 'No students matched your search or class filter.'
              : 'No students are enrolled in your assigned classes yet.'
          }
          toolbar={
            <div className='flex items-center gap-2'>
              <Select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setPage(1);
                }}
                className='w-48'
                aria-label='Filter by class'
              >
                <option value=''>All Assigned Classes</option>
                {assignedClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.studentCount} {c.studentCount === 1 ? 'student' : 'students'})
                  </option>
                ))}
              </Select>
            </div>
          }
        />
      )}
    </div>
  );
}
