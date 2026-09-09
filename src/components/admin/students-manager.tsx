'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import type { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { AlertTriangleIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Select } from '@/components/ui/select';
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
import {
  useClassCatalog,
  useCreateStudent,
  useDeleteStudent,
  useStudents,
  useUpdateStudent
} from '@/lib/queries';
import { useSafePage } from '@/lib/use-safe-page';
import type { ClassCatalogItem, Student } from '@/types/domain';

function useCatalog() {
  const { data } = useClassCatalog();
  const classes = useMemo(() => data?.items ?? [], [data]);
  const grades = useMemo(
    () => [...new Set(classes.map((c) => c.grade))].sort((a, b) => a - b),
    [classes]
  );
  return { classes, grades };
}

function sectionsFor(classes: ClassCatalogItem[], grade: number | null): ClassCatalogItem[] {
  if (grade === null) return [];
  return classes.filter((c) => c.grade === grade);
}

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
    accessorKey: 'guardianName',
    header: 'Guardian',
    cell: ({ row }) => row.original.guardianName ?? '—'
  },
  {
    accessorKey: 'currentClass',
    header: 'Class',
    cell: ({ row }) => <ClassBadge student={row.original} />
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <StudentActions student={row.original} />
  }
];

function StudentActions({ student }: { student: Student }) {
  const remove = useDeleteStudent();
  return (
    <div className='flex items-center justify-end gap-1'>
      <EditStudentDialog student={student} />
      <Button
        variant='ghost'
        size='sm'
        onClick={() => {
          if (!window.confirm(`Delete ${student.name}? This also removes their account and enrollments.`)) {
            return;
          }
          remove.mutate(student.id, {
            onSuccess: () => toast.success(`${student.name} deleted.`),
            onError: (err) => toast.error(err instanceof Error ? err.message : 'Delete failed.')
          });
        }}
        disabled={remove.isPending}
        className='text-destructive hover:text-destructive'
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}

const createStudentSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.').max(80, 'Name must be at most 80 characters.'),
  email: z.email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(100),
  admissionNo: z.string().trim().max(20, 'Admission no must be at most 20 characters.').optional(),
  guardianName: z.string().trim().max(80).optional(),
  guardianPhone: z.string().trim().max(30).optional(),
  grade: z.string().min(1, 'Select a grade.'),
  section: z.string().min(1, 'Select a section.')
});

type CreateStudentValues = z.infer<typeof createStudentSchema>;

function AddStudentDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { classes, grades } = useCatalog();
  const createStudent = useCreateStudent();

  const form = useForm<CreateStudentValues>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      admissionNo: '',
      guardianName: '',
      guardianPhone: '',
      grade: '',
      section: ''
    }
  });

  const gradeValue = form.watch('grade');
  const sections = sectionsFor(classes, gradeValue ? Number(gradeValue) : null);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      form.reset();
    }
  }

  async function onSubmit(values: CreateStudentValues) {
    setError(null);
    const target = classes.find(
      (c) => c.grade === Number(values.grade) && c.section === values.section
    );
    if (!target) {
      setError('Select a valid class.');
      return;
    }

    try {
      await createStudent.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
        schoolClassId: target.id,
        admissionNo: values.admissionNo || undefined,
        guardianName: values.guardianName || undefined,
        guardianPhone: values.guardianPhone || undefined
      });
      toast.success(`Student created. Temp password: ${values.password}`);
      form.reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create student.');
    }
  }

  return (
    <>
      <Button size='sm' onClick={() => setOpen(true)}>
        <PlusIcon />
        Add student
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <form id='add-student-form' onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add student</DialogTitle>
            <DialogDescription>
              Creates a student account and enrolls them in a class. Share the
              temporary password after saving.
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
                    <FieldLabel htmlFor='stu-name'>Full name</FieldLabel>
                    <Input
                      {...field}
                      id='stu-name'
                      type='text'
                      placeholder='e.g. Aarav Sharma'
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
                    <FieldLabel htmlFor='stu-email'>Email</FieldLabel>
                    <Input
                      {...field}
                      id='stu-email'
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
                    <FieldLabel htmlFor='stu-password'>Temporary password</FieldLabel>
                    <PasswordInput
                      {...field}
                      id='stu-password'
                      placeholder='At least 8 characters'
                      autoComplete='new-password'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <div className='grid grid-cols-2 gap-3'>
                <Controller
                  name='grade'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='stu-grade'>Grade</FieldLabel>
                      <Select
                        {...field}
                        id='stu-grade'
                        invalid={fieldState.invalid}
                        onChange={(e) => {
                          field.onChange(e);
                          form.setValue('section', '');
                        }}
                      >
                        <option value=''>Select…</option>
                        {grades.map((g) => (
                          <option key={g} value={g}>
                            Class {g}
                          </option>
                        ))}
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name='section'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='stu-section'>Section</FieldLabel>
                      <Select
                        {...field}
                        id='stu-section'
                        invalid={fieldState.invalid}
                        disabled={sections.length === 0}
                      >
                        <option value=''>Select…</option>
                        {sections.map((c) => (
                          <option key={c.id} value={c.section}>
                            Section {c.section}
                          </option>
                        ))}
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name='admissionNo'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='stu-admission'>Admission no</FieldLabel>
                    <Input
                      {...field}
                      id='stu-admission'
                      type='text'
                      placeholder='e.g. S1001 (blank = auto)'
                      autoComplete='off'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='guardianName'
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor='stu-guardian'>Guardian name</FieldLabel>
                    <Input
                      {...field}
                      id='stu-guardian'
                      type='text'
                      placeholder='e.g. Mr. Raj Sharma'
                      autoComplete='off'
                    />
                  </Field>
                )}
              />

              <Controller
                name='guardianPhone'
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor='stu-guardian-phone'>Guardian phone</FieldLabel>
                    <Input
                      {...field}
                      id='stu-guardian-phone'
                      type='tel'
                      placeholder='e.g. +91 98XXXXXXXX'
                      autoComplete='tel'
                    />
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
              disabled={createStudent.isPending}
            >
              Cancel
            </Button>
            <Button type='submit' form='add-student-form' disabled={createStudent.isPending}>
              {createStudent.isPending ? <Spinner /> : 'Create student'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}

const editStudentSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.').max(80),
  guardianName: z.string().trim().max(80).optional(),
  guardianPhone: z.string().trim().max(30).optional(),
  grade: z.string().min(1, 'Select a grade.'),
  section: z.string().min(1, 'Select a section.')
});

type EditStudentValues = z.infer<typeof editStudentSchema>;

function EditStudentDialog({ student }: { student: Student }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { classes, grades } = useCatalog();
  const updateStudent = useUpdateStudent();

  const defaults = useMemo(() => {
    const current = classes.find((c) => c.id === student.currentClass?.id);
    return {
      name: student.name,
      guardianName: student.guardianName ?? '',
      guardianPhone: student.guardianPhone ?? '',
      grade: current ? String(current.grade) : '',
      section: current ? current.section : ''
    };
  }, [classes, student]);

  const form = useForm<EditStudentValues>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: defaults
  });

  const gradeValue = form.watch('grade');
  const sections = sectionsFor(classes, gradeValue ? Number(gradeValue) : null);

  async function onSubmit(values: EditStudentValues) {
    setError(null);
    const target = classes.find(
      (c) => c.grade === Number(values.grade) && c.section === values.section
    );
    if (!target) {
      setError('Select a valid class.');
      return;
    }

    try {
      await updateStudent.mutateAsync({
        studentId: student.id,
        name: values.name,
        guardianName: values.guardianName || undefined,
        guardianPhone: values.guardianPhone || undefined,
        schoolClassId: target.id
      });
      toast.success(`${values.name} updated.`);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student.');
    }
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      form.reset(defaults);
    } else {
      setError(null);
    }
  }

  return (
    <>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => setOpen(true)}
        aria-label={`Edit ${student.name}`}
      >
        <PencilIcon />
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <form id='edit-student-form' onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit student</DialogTitle>
            <DialogDescription>
              Update {student.name}&apos;s details or move them to another class.
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
                    <FieldLabel htmlFor={`edit-name-${student.id}`}>Full name</FieldLabel>
                    <Input
                      {...field}
                      id={`edit-name-${student.id}`}
                      type='text'
                      autoComplete='name'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <div className='grid grid-cols-2 gap-3'>
                <Controller
                  name='grade'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`edit-grade-${student.id}`}>Grade</FieldLabel>
                      <Select
                        {...field}
                        id={`edit-grade-${student.id}`}
                        invalid={fieldState.invalid}
                        onChange={(e) => {
                          field.onChange(e);
                          form.setValue('section', '');
                        }}
                      >
                        <option value=''>Select…</option>
                        {grades.map((g) => (
                          <option key={g} value={g}>
                            Class {g}
                          </option>
                        ))}
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name='section'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`edit-section-${student.id}`}>Section</FieldLabel>
                      <Select
                        {...field}
                        id={`edit-section-${student.id}`}
                        invalid={fieldState.invalid}
                        disabled={sections.length === 0}
                      >
                        <option value=''>Select…</option>
                        {sections.map((c) => (
                          <option key={c.id} value={c.section}>
                            Section {c.section}
                          </option>
                        ))}
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name='guardianName'
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={`edit-guardian-${student.id}`}>Guardian name</FieldLabel>
                    <Input {...field} id={`edit-guardian-${student.id}`} type='text' />
                  </Field>
                )}
              />

              <Controller
                name='guardianPhone'
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={`edit-guardian-phone-${student.id}`}>Guardian phone</FieldLabel>
                    <Input {...field} id={`edit-guardian-phone-${student.id}`} type='tel' />
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
              disabled={updateStudent.isPending}
            >
              Cancel
            </Button>
            <Button type='submit' form='edit-student-form' disabled={updateStudent.isPending}>
              {updateStudent.isPending ? <Spinner /> : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}

export function StudentsManager() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const catalog = useClassCatalog();

  const students = useStudents({ page, pageSize, q: search || undefined });
  const safePage = useSafePage(page, students.data?.totalPages, setPage);

  const listError = students.isError ? 'Could not load students.' : null;

  return (
    <div className='flex flex-col gap-4'>
      {listError && (
        <Alert variant='destructive'>
          <AlertTriangleIcon className='h-4 w-4' />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      )}

      {catalog.isError && (
        <Alert variant='destructive'>
          <AlertTriangleIcon className='h-4 w-4' />
          <AlertTitle>Could not load classes</AlertTitle>
          <AlertDescription>Adding or editing students is unavailable until classes load.</AlertDescription>
        </Alert>
      )}

      {students.isLoading ? (
        <div className='flex justify-center py-12'>
          <Spinner />
        </div>
      ) : (
        <DataTable
          mode='server'
          columns={columns}
          data={students.data?.items ?? []}
          total={students.data?.total ?? 0}
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
          searchPlaceholder='Search by name, email, admission no or guardian…'
          emptyMessage='No students yet. Add one to get started.'
          toolbar={<AddStudentDialog />}
        />
      )}
    </div>
  );
}