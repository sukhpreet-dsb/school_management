'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangleIcon, ArrowLeft } from 'lucide-react';

import { DataTable } from '@/components/data-table/data-table';
import { Spinner } from '@/components/ui/spinner';
import { buttonVariants } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useClassEnrollments } from '@/lib/queries';
import type { Student } from '@/types/domain';

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
    accessorKey: 'guardianName',
    header: 'Guardian',
    cell: ({ row }) => row.original.guardianName ?? '—'
  }
];

export function ClassRoster({
  classId,
  className
}: {
  classId: string;
  className: string;
}) {
  const roster = useClassEnrollments(classId);

  return (
    <div className='flex flex-col gap-4'>
      <div>
        <Link
          href='/teacher/classes'
          className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} -ml-2 text-muted-foreground hover:text-foreground`}
        >
          <ArrowLeft />
          Back to classes
        </Link>
      </div>

      {roster.isError && (
        <Alert variant='destructive'>
          <AlertTriangleIcon className='h-4 w-4' />
          <AlertTitle>Could not load the roster for {className}</AlertTitle>
          <AlertDescription>Please try again.</AlertDescription>
        </Alert>
      )}

      {roster.isLoading ? (
        <div className='flex justify-center py-12'>
          <Spinner />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={roster.data ?? []}
          searchKey='name'
          searchPlaceholder='Search students…'
          emptyMessage='No students are enrolled in this class.'
        />
      )}
    </div>
  );
}