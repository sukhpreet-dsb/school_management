'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import type { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { AlertTriangleIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCreateTeacher, useTeachers } from '@/lib/queries';
import { useSafePage } from '@/lib/use-safe-page';
import { AssignClassesSheet } from '@/components/admin/assign-classes-sheet';
import type { AuthUser } from '@/types/domain';

const columns: ColumnDef<AuthUser>[] = [
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'profile',
    header: 'Emp code',
    cell: ({ row }) => row.original.profile?.empCode ?? '—'
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => row.original.profile?.phone ?? '—'
  },
  {
    accessorKey: 'classCount',
    header: 'Classes',
    cell: ({ row }) => row.original.classCount ?? row.original.profile?.classCount ?? 0
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <AssignAction user={row.original} />
  },
  {
    accessorKey: 'banned',
    header: 'Status',
    cell: ({ row }) =>
      row.original.banned ? (
        <Badge variant='destructive'>Banned</Badge>
      ) : (
        <Badge variant='success'>Active</Badge>
      )
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString('en-US', {
        dateStyle: 'medium'
      })
  }
];

function AssignAction({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant='outline'
        size='sm'
        onClick={() => setOpen(true)}
        className='whitespace-nowrap'
      >
        Assign classes
      </Button>
      <AssignClassesSheet
        open={open}
        onOpenChange={setOpen}
        teacherId={user.id}
        teacherName={user.name}
      />
    </>
  );
}

const createTeacherSchema = z.object({
  name: z
    .string()
    .min(2, 'Name is required.')
    .max(80, 'Name must be at most 80 characters.'),
  email: z.email('Please enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(100, 'Password must be at most 100 characters.'),
  empCode: z.string().trim().max(20, 'Emp code must be at most 20 characters.').optional(),
  phone: z.string().trim().max(30, 'Phone must be at most 30 characters.').optional(),
  hireDate: z.string().trim().optional()
});

type CreateTeacherValues = z.infer<typeof createTeacherSchema>;

export function TeachersManager() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const teachers = useTeachers({ page, pageSize, q: search || undefined });
  const createTeacher = useCreateTeacher();

  const safePage = useSafePage(page, teachers.data?.totalPages, setPage);

  const form = useForm<CreateTeacherValues>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      empCode: '',
      phone: '',
      hireDate: ''
    }
  });

  async function onSubmit(values: CreateTeacherValues) {
    setError(null);

    try {
      await createTeacher.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
        role: 'teacher',
        empCode: values.empCode || undefined,
        phone: values.phone || undefined,
        hireDate: values.hireDate || undefined
      });

      toast.success(`Teacher created. Temp password: ${values.password}`);
      form.reset();
      setOpen(false);
      setPage(1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create teacher. Try again.'
      );
    }
  }

  const listError = teachers.isError
    ? 'Could not load teacher accounts.'
    : null;

  return (
    <div className='flex flex-col gap-4'>
      {listError && (
        <Alert variant='destructive'>
          <AlertTriangleIcon className='h-4 w-4' />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      )}

      {teachers.isLoading ? (
        <div className='flex justify-center py-12'>
          <Spinner />
        </div>
      ) : (
        <DataTable
          mode='server'
          columns={columns}
          data={teachers.data?.items ?? []}
          total={teachers.data?.total ?? 0}
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
          searchKey='email'
          searchPlaceholder='Search by email or name…'
          emptyMessage='No teachers yet. Add one to get started.'
          toolbar={
            <Button size='sm' onClick={() => setOpen(true)}>
              <PlusIcon />
              Add teacher
            </Button>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <form id='add-teacher-form' onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add teacher</DialogTitle>
            <DialogDescription>
              Creates a teacher account. Share the temporary password with the
              teacher after saving.
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
                name='name'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='name'>Full name</FieldLabel>
                    <Input
                      {...field}
                      id='name'
                      type='text'
                      placeholder='e.g. Priya Sharma'
                      autoComplete='name'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='email'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='email'>Email</FieldLabel>
                    <Input
                      {...field}
                      id='email'
                      type='email'
                      placeholder='name@example.com'
                      autoComplete='email'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='password'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='password'>Temporary password</FieldLabel>
                    <PasswordInput
                      {...field}
                      id='password'
                      placeholder='At least 8 characters'
                      autoComplete='new-password'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='empCode'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='empCode'>Emp code</FieldLabel>
                    <Input
                      {...field}
                      id='empCode'
                      type='text'
                      placeholder='e.g. TCH-010 (blank = auto)'
                      autoComplete='off'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='phone'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='phone'>Phone</FieldLabel>
                    <Input
                      {...field}
                      id='phone'
                      type='tel'
                      placeholder='e.g. +91 98XXXXXXXX'
                      autoComplete='tel'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='hireDate'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='hireDate'>Hire date</FieldLabel>
                    <Input
                      {...field}
                      id='hireDate'
                      type='date'
                      autoComplete='off'
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
              onClick={() => setOpen(false)}
              disabled={createTeacher.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              form='add-teacher-form'
              disabled={createTeacher.isPending}
            >
              {createTeacher.isPending ? <Spinner /> : 'Create teacher'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}