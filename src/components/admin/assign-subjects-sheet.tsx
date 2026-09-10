'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CheckIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import {
  useSubjectCatalog,
  useAssignTeacherSubjects,
  useTeacherSubjectAssignments
} from '@/lib/queries';
import type { Subject } from '@/types/domain';

function AssignSubjectsBody({
  userId,
  subjects,
  initialSubjectIds,
  teacherName,
  onSaved
}: {
  userId: string;
  subjects: Subject[];
  initialSubjectIds: string[];
  teacherName: string;
  onSaved: () => void;
}) {
  const assign = useAssignTeacherSubjects();
  const [selected, setSelected] = useState<string[]>(initialSubjectIds);
  const [error, setError] = useState<string | null>(null);

  function toggle(subjectId: string) {
    setSelected((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  }

  async function onSave() {
    setError(null);
    try {
      await assign.mutateAsync({ userId, subjectIds: selected });
      toast.success(
        `${teacherName} is now assigned to ${selected.length} subject${selected.length === 1 ? '' : 's'}.`
      );
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save subject assignments.');
    }
  }

  return (
    <>
      <div className='flex flex-col gap-5 py-2'>
        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {subjects.length === 0 ? (
          <p className='text-muted-foreground text-sm'>
            No subjects available. Add subjects first under Subjects.
          </p>
        ) : (
          <div className='flex max-h-[60vh] flex-col gap-1 overflow-y-auto'>
            {subjects.map((s) => {
              const checked = selected.includes(s.id);
              return (
                <label
                  key={s.id}
                  className='hover:bg-muted/60 flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition-colors'
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(s.id)}
                  />
                  <FieldLabel className='flex-1 cursor-pointer font-medium'>
                    {s.name}
                  </FieldLabel>
                  <Badge variant='outline'>{s.code}</Badge>
                  {checked && <CheckIcon className='text-primary size-4' />}
                </label>
              );
            })}
          </div>
        )}
      </div>

      <SheetFooter>
        <Button type='button' variant='outline' onClick={onSaved} disabled={assign.isPending}>
          Cancel
        </Button>
        <Button type='button' onClick={onSave} disabled={assign.isPending}>
          {assign.isPending ? <Spinner /> : 'Save subjects'}
        </Button>
      </SheetFooter>
    </>
  );
}

export function AssignSubjectsSheet({
  open,
  onOpenChange,
  teacherId,
  teacherName
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  teacherName: string;
}) {
  const subjects = useSubjectCatalog();
  const assignments = useTeacherSubjectAssignments(teacherId);

  const loading = subjects.isLoading || assignments.isLoading;

  if (subjects.isError || assignments.isError) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetHeader>
          <SheetTitle>Assign subjects</SheetTitle>
          <SheetDescription>
            Choose which subjects {teacherName} is qualified to teach.
          </SheetDescription>
        </SheetHeader>
        <div className='py-6'>
          <Alert variant='destructive'>
            <AlertDescription>
              {subjects.error instanceof Error
                ? subjects.error.message
                : assignments.error instanceof Error
                  ? assignments.error.message
                  : 'Could not load subjects catalog.'}
            </AlertDescription>
          </Alert>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader>
        <SheetTitle>Assign subjects</SheetTitle>
        <SheetDescription>
          Choose which subjects {teacherName} is qualified to teach.
        </SheetDescription>
      </SheetHeader>

      {loading ? (
        <div className='flex justify-center py-12'>
          <Spinner />
        </div>
      ) : open ? (
        <AssignSubjectsBody
          key={teacherId}
          userId={teacherId}
          subjects={subjects.data?.items ?? []}
          initialSubjectIds={assignments.data?.subjectIds ?? []}
          teacherName={teacherName}
          onSaved={() => onOpenChange(false)}
        />
      ) : null}
    </Sheet>
  );
}
