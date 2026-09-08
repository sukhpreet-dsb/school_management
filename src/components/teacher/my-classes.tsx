'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangleIcon, Users } from 'lucide-react';

import { DataTable } from '@/components/data-table/data-table';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMyClasses } from '@/lib/queries';
import { useSafePage } from '@/lib/use-safe-page';
import type { TeacherClassSummary } from '@/types/domain';

const columns: ColumnDef<TeacherClassSummary>[] = [
  {
    accessorKey: 'name',
    header: 'Class',
    cell: ({ row }) => (
      <Link
        href={`/teacher/classes/${row.original.id}`}
        className='hover:text-primary font-medium underline-offset-4 hover:underline'
      >
        {row.original.name}
      </Link>
    )
  },
  {
    accessorKey: 'studentCount',
    header: 'Students',
    cell: ({ row }) => (
      <span className='flex items-center gap-1.5'>
        <Users className='text-muted-foreground size-4' />
        {row.original.studentCount}
      </span>
    )
  }
];

export function MyClasses() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const classes = useMyClasses({ page, pageSize });
  const safePage = useSafePage(page, classes.data?.totalPages, setPage);

  if (classes.isError) {
    return (
      <Alert variant='destructive'>
        <AlertTriangleIcon className='h-4 w-4' />
        <AlertTitle>Could not load your classes</AlertTitle>
        <AlertDescription>Please try again.</AlertDescription>
      </Alert>
    );
  }

  if (classes.isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Spinner />
      </div>
    );
  }

  return (
    <DataTable
      mode='server'
      columns={columns}
      data={classes.data?.items ?? []}
      total={classes.data?.total ?? 0}
      page={safePage}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
      emptyMessage='You are not assigned to any classes yet.'
    />
  );
}