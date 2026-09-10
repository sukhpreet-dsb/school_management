'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangleIcon, BookOpen, Star } from 'lucide-react';

import { DataTable } from '@/components/data-table/data-table';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTeacherMySubjects } from '@/lib/queries';
import { useSafePage } from '@/lib/use-safe-page';
import type { Subject } from '@/types/domain';

const columns: ColumnDef<Subject>[] = [
  {
    accessorKey: 'name',
    header: 'Subject Name',
    cell: ({ row }) => (
      <div className='flex items-center gap-2 font-medium'>
        <BookOpen className='text-muted-foreground size-4' />
        {row.original.name}
      </div>
    )
  },
  {
    accessorKey: 'code',
    header: 'Subject Code',
    cell: ({ row }) => <Badge variant='outline'>{row.original.code}</Badge>
  }
];

export function MySubjects() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const subjects = useTeacherMySubjects({ page, pageSize, q: search || undefined });
  const safePage = useSafePage(page, subjects.data?.totalPages, setPage);

  if (subjects.isError) {
    return (
      <Alert variant='destructive'>
        <AlertTriangleIcon className='h-4 w-4' />
        <AlertTitle>Could not load your subjects</AlertTitle>
        <AlertDescription>Please try again.</AlertDescription>
      </Alert>
    );
  }

  if (subjects.isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Spinner />
      </div>
    );
  }

  if (!search && (subjects.data?.total ?? 0) === 0) {
    return (
      <div className='bg-card text-card-foreground flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center'>
        <div className='bg-muted/50 mb-4 rounded-full p-4'>
          <Star className='text-muted-foreground size-8' />
        </div>
        <h3 className='text-lg font-medium'>No assigned subjects</h3>
        <p className='text-muted-foreground mt-1 max-w-sm text-sm'>
          You are not currently assigned to any subjects. Your school administrator can assign
          subjects to your profile.
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      <DataTable
        mode='server'
        columns={columns}
        data={subjects.data?.items ?? []}
        total={subjects.data?.total ?? 0}
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
        searchPlaceholder='Search your subjects by name or code…'
        emptyMessage='No subjects matched your search.'
      />
    </div>
  );
}
