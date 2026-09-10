'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import type { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { AlertTriangleIcon, PlusIcon, Trash2Icon, Users } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  useCreateSubject,
  useDeleteSubject,
  useSubjects,
  type SubjectWithTeacherCount
} from '@/lib/queries';
import { useSafePage } from '@/lib/use-safe-page';

const columns: ColumnDef<SubjectWithTeacherCount>[] = [
  {
    accessorKey: 'name',
    header: 'Subject Name'
  },
  {
    accessorKey: 'code',
    header: 'Code',
    cell: ({ row }) => <Badge variant='outline'>{row.original.code}</Badge>
  },
  {
    accessorKey: 'teacherCount',
    header: 'Assigned Teachers',
    cell: ({ row }) => (
      <span className='flex items-center gap-1.5'>
        <Users className='text-muted-foreground size-4' />
        {row.original.teacherCount} {row.original.teacherCount === 1 ? 'teacher' : 'teachers'}
      </span>
    )
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <SubjectActions subject={row.original} />
  }
];

function SubjectActions({ subject }: { subject: SubjectWithTeacherCount }) {
  const remove = useDeleteSubject();
  return (
    <div className='flex items-center justify-end'>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => {
          if (
            !window.confirm(
              `Delete ${subject.name} (${subject.code})? This will remove the subject from any assigned teachers.`
            )
          ) {
            return;
          }
          remove.mutate(subject.id, {
            onSuccess: () => toast.success(`${subject.name} deleted.`),
            onError: (err) => toast.error(err instanceof Error ? err.message : 'Delete failed.')
          });
        }}
        disabled={remove.isPending}
        className='text-destructive hover:text-destructive'
        aria-label={`Delete ${subject.name}`}
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}

const createSubjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name is required.')
    .max(50, 'Name must be at most 50 characters.'),
  code: z
    .string()
    .trim()
    .min(2, 'Code is required.')
    .max(10, 'Code must be at most 10 characters.')
});

type CreateSubjectValues = z.infer<typeof createSubjectSchema>;

function AddSubjectDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createSubject = useCreateSubject();

  const form = useForm<CreateSubjectValues>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: { name: '', code: '' }
  });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      form.reset();
    }
  }

  async function onSubmit(values: CreateSubjectValues) {
    setError(null);
    try {
      await createSubject.mutateAsync({
        name: values.name,
        code: values.code.toUpperCase()
      });
      toast.success(`Subject ${values.name} added.`);
      form.reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subject.');
    }
  }

  return (
    <>
      <Button size='sm' onClick={() => setOpen(true)}>
        <PlusIcon />
        Add subject
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <form id='add-subject-form' onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add subject</DialogTitle>
            <DialogDescription>
              Create a new subject to assign to teachers and classes in your catalog.
            </DialogDescription>
          </DialogHeader>

          <div className='flex flex-col gap-4 py-2'>
            {error && (
              <Alert variant='destructive'>
                <AlertTriangleIcon className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FieldGroup>
              <Controller
                name='name'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='sub-name'>Subject name</FieldLabel>
                    <Input
                      {...field}
                      id='sub-name'
                      type='text'
                      placeholder='e.g. Chemistry, Economics'
                      autoComplete='off'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='code'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='sub-code'>Subject code</FieldLabel>
                    <Input
                      {...field}
                      id='sub-code'
                      type='text'
                      placeholder='e.g. CHEM, ECON'
                      autoComplete='off'
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={createSubject.isPending}
            >
              Cancel
            </Button>
            <Button type='submit' form='add-subject-form' disabled={createSubject.isPending}>
              {createSubject.isPending ? <Spinner /> : 'Create subject'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}

export function SubjectsManager() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const subjects = useSubjects({ page, pageSize, q: search || undefined });
  const safePage = useSafePage(page, subjects.data?.totalPages, setPage);

  if (subjects.isError) {
    return (
      <Alert variant='destructive'>
        <AlertTriangleIcon className='h-4 w-4' />
        <AlertTitle>Could not load subjects</AlertTitle>
        <AlertDescription>Please try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      {subjects.isLoading ? (
        <div className='flex justify-center py-12'>
          <Spinner />
        </div>
      ) : (
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
          searchPlaceholder='Search subjects by name or code…'
          emptyMessage='No subjects found. Click Add subject to create one.'
          toolbar={<AddSubjectDialog />}
        />
      )}
    </div>
  );
}
