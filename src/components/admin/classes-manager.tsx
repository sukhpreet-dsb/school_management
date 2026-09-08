'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import type { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { AlertTriangleIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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
import { useClasses, useCreateClass, useDeleteClass } from '@/lib/queries';
import { useSafePage } from '@/lib/use-safe-page';
import type { ClassCatalogItem } from '@/types/domain';

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

const columns: ColumnDef<ClassCatalogItem>[] = [
  {
    accessorKey: 'name',
    header: 'Class'
  },
  {
    accessorKey: 'section',
    header: 'Section'
  },
  {
    accessorKey: 'room',
    header: 'Room',
    cell: ({ row }) => row.original.room ?? '—'
  },
  {
    accessorKey: 'studentCount',
    header: 'Students'
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <DeleteClassButton item={row.original} />
  }
];

function DeleteClassButton({ item }: { item: ClassCatalogItem }) {
  const remove = useDeleteClass();
  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={() => {
        remove.mutate(item.id, {
          onSuccess: () => toast.success(`${item.name} deleted.`),
          onError: (err) => toast.error(err instanceof Error ? err.message : 'Delete failed.')
        });
      }}
      disabled={remove.isPending}
      className='text-destructive hover:text-destructive'
    >
      <Trash2Icon />
    </Button>
  );
}

const createClassSchema = z.object({
  grade: z.string().min(1, 'Select a grade.'),
  section: z.string().trim().toUpperCase().min(1, 'Section is required.').max(4),
  room: z.string().trim().max(30).optional()
});

type CreateClassValues = z.infer<typeof createClassSchema>;

export function ClassesManager() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const classes = useClasses({ page, pageSize, q: search || undefined });
  const createClass = useCreateClass();

  const safePage = useSafePage(page, classes.data?.totalPages, setPage);

  const form = useForm<CreateClassValues>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { grade: '1', section: 'A', room: '' }
  });

  async function onSubmit(values: CreateClassValues) {
    setError(null);
    try {
      await createClass.mutateAsync({
        grade: Number(values.grade),
        section: values.section || 'A',
        room: values.room || undefined
      });
      toast.success(`Class ${values.grade} ${values.section} created.`);
      form.reset({ grade: '1', section: 'A', room: '' });
      setOpen(false);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create class.');
    }
  }

  const listError = classes.isError ? 'Could not load classes.' : null;

  return (
    <div className='flex flex-col gap-4'>
      {listError && (
        <Alert variant='destructive'>
          <AlertTriangleIcon className='h-4 w-4' />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      )}

      {classes.isLoading ? (
        <div className='flex justify-center py-12'>
          <Spinner />
        </div>
      ) : (
        <DataTable
          mode='server'
          columns={columns}
          data={classes.data?.items ?? []}
          total={classes.data?.total ?? 0}
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
          searchPlaceholder='Search classes…'
          emptyMessage='No classes yet. Add one to get started.'
          toolbar={
            <Button size='sm' onClick={() => setOpen(true)}>
              <PlusIcon />
              Add class
            </Button>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <form id='add-class-form' onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add class</DialogTitle>
            <DialogDescription>
              Create a class for a grade and section. It can then be assigned to
              teachers.
            </DialogDescription>
          </DialogHeader>

          <div className='flex flex-col gap-5 py-2'>
            {error && (
              <Alert variant='destructive'>
                <AlertTriangleIcon className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FieldGroup>
              <Controller
                name='grade'
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor='grade'>Grade</FieldLabel>
                    <Select {...field} id='grade'>
                      {GRADES.map((g) => (
                        <option key={g} value={g}>
                          Class {g}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
              />

              <Controller
                name='section'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='section'>Section</FieldLabel>
                    <Input
                      {...field}
                      id='section'
                      placeholder='e.g. A, B'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='room'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='room'>Room (optional)</FieldLabel>
                    <Input
                      {...field}
                      id='room'
                      placeholder='e.g. Room 101'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setOpen(false)} disabled={createClass.isPending}>
              Cancel
            </Button>
            <Button type='submit' form='add-class-form' disabled={createClass.isPending}>
              {createClass.isPending ? <Spinner /> : 'Create class'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}