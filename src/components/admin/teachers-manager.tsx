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
import { useCreateTeacher, useSubjectCatalog, useTeachers, useUpdateTeacher } from '@/lib/queries';
import { useSafePage } from '@/lib/use-safe-page';
import { AssignClassesSheet } from '@/components/admin/assign-classes-sheet';
import { AssignSubjectsSheet } from '@/components/admin/assign-subjects-sheet';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/types/domain';

const editTeacherSchema = z.object({
  name: z.string().min(2, 'Name is required.').max(80, 'Name must be at most 80 characters.'),
  empCode: z.string().trim().max(20, 'Emp code must be at most 20 characters.').optional(),
  phone: z.string().trim().max(30, 'Phone must be at most 30 characters.').optional(),
  designation: z.string().trim().max(100, 'Designation must be at most 100 characters.').optional(),
  hireDate: z.string().trim().optional()
});

type EditTeacherValues = z.infer<typeof editTeacherSchema>;

function EditTeacherDialog({
  user,
  open,
  onOpenChange
}: {
  user: AuthUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateTeacher = useUpdateTeacher();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditTeacherValues>({
    resolver: zodResolver(editTeacherSchema),
    values: {
      name: user.name,
      empCode: user.profile?.empCode ?? '',
      phone: user.profile?.phone ?? '',
      designation: user.profile?.designation ?? '',
      hireDate: user.profile?.hireDate ? user.profile.hireDate.slice(0, 10) : ''
    }
  });

  async function onSubmit(values: EditTeacherValues) {
    setError(null);
    try {
      await updateTeacher.mutateAsync({
        userId: user.id,
        name: values.name,
        empCode: values.empCode || undefined,
        phone: values.phone || null,
        designation: values.designation || null,
        hireDate: values.hireDate || null
      });
      toast.success('Teacher details updated successfully.');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update teacher.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogHeader>
          <DialogTitle>Edit teacher</DialogTitle>
          <DialogDescription>
            Update faculty personal and institutional details.
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
                  <FieldLabel htmlFor={`edit-name-${user.id}`}>Full name</FieldLabel>
                  <Input
                    {...field}
                    id={`edit-name-${user.id}`}
                    type='text'
                    placeholder='e.g. Priya Sharma'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input value={user.email} disabled className='bg-muted/50 cursor-not-allowed' />
            </Field>

            <Controller
              name='empCode'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`edit-empCode-${user.id}`}>Emp code</FieldLabel>
                  <Input
                    {...field}
                    id={`edit-empCode-${user.id}`}
                    type='text'
                    placeholder='e.g. TCH-001'
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
                  <FieldLabel htmlFor={`edit-phone-${user.id}`}>Phone</FieldLabel>
                  <Input
                    {...field}
                    id={`edit-phone-${user.id}`}
                    type='tel'
                    placeholder='e.g. +91 98XXXXXXXX'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='designation'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`edit-designation-${user.id}`}>Designation</FieldLabel>
                  <Input
                    {...field}
                    id={`edit-designation-${user.id}`}
                    type='text'
                    placeholder='e.g. Senior Science Teacher'
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
                  <FieldLabel htmlFor={`edit-hireDate-${user.id}`}>Hire date</FieldLabel>
                  <Input
                    {...field}
                    id={`edit-hireDate-${user.id}`}
                    type='date'
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
            disabled={updateTeacher.isPending}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={updateTeacher.isPending}>
            {updateTeacher.isPending ? <Spinner /> : 'Save changes'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

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
    accessorKey: 'subjects',
    header: 'Subjects',
    cell: ({ row }) => {
      const subs = row.original.subjects ?? row.original.profile?.subjects ?? [];
      if (subs.length === 0) return <span className='text-muted-foreground text-xs'>None</span>;
      return (
        <div className='flex max-w-48 flex-wrap gap-1'>
          {subs.map((s) => (
            <Badge key={s.id} variant='outline' className='text-xs'>
              {s.code}
            </Badge>
          ))}
        </div>
      );
    }
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
  const [editOpen, setEditOpen] = useState(false);
  const [classesOpen, setClassesOpen] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  return (
    <div className='flex items-center gap-1.5'>
      <Button
        variant='outline'
        size='sm'
        onClick={() => setEditOpen(true)}
        className='whitespace-nowrap'
      >
        Edit
      </Button>
      <Button
        variant='outline'
        size='sm'
        onClick={() => setSubjectsOpen(true)}
        className='whitespace-nowrap'
      >
        Subjects
      </Button>
      <Button
        variant='outline'
        size='sm'
        onClick={() => setClassesOpen(true)}
        className='whitespace-nowrap'
      >
        Classes
      </Button>
      <EditTeacherDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={user}
      />
      <AssignSubjectsSheet
        open={subjectsOpen}
        onOpenChange={setSubjectsOpen}
        teacherId={user.id}
        teacherName={user.name}
      />
      <AssignClassesSheet
        open={classesOpen}
        onOpenChange={setClassesOpen}
        teacherId={user.id}
        teacherName={user.name}
      />
    </div>
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
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const teachers = useTeachers({ page, pageSize, q: search || undefined });
  const subjectsCatalog = useSubjectCatalog();
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

  function toggleSubject(subjectId: string) {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setSelectedSubjectIds([]);
      form.reset();
    }
  }

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
        hireDate: values.hireDate || undefined,
        subjectIds: selectedSubjectIds.length > 0 ? selectedSubjectIds : undefined
      });

      toast.success(`Teacher created. Temp password: ${values.password}`);
      form.reset();
      setSelectedSubjectIds([]);
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
            <Button size='sm' onClick={() => handleOpenChange(true)}>
              <PlusIcon />
              Add teacher
            </Button>
          }
        />
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <form id='add-teacher-form' onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add teacher</DialogTitle>
            <DialogDescription>
              Creates a teacher account and assigns subjects. Share the temporary password with the
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

              <Field>
                <FieldLabel>Subjects taught (optional)</FieldLabel>
                {subjectsCatalog.isLoading ? (
                  <div className='py-2'>
                    <Spinner />
                  </div>
                ) : (subjectsCatalog.data?.items ?? []).length === 0 ? (
                  <p className='text-muted-foreground text-xs'>
                    No subjects in catalog. You can add subjects from the Subjects page.
                  </p>
                ) : (
                  <div className='flex flex-wrap gap-1.5 pt-1'>
                    {(subjectsCatalog.data?.items ?? []).map((s) => {
                      const selected = selectedSubjectIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type='button'
                          onClick={() => toggleSubject(s.id)}
                          className={cn(
                            'flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                            selected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                          )}
                        >
                          <span>{s.name}</span>
                          <span className='text-[10px] opacity-75'>({s.code})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
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