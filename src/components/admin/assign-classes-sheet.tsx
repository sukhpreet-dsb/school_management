'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CheckIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import {
  useClassCatalog,
  useAssignTeacherClasses,
  useTeacherClassAssignments
} from '@/lib/queries';
import type { ClassCatalogItem } from '@/types/domain';

function AssignBody({
  userId,
  classes,
  initialClassIds,
  teacherName,
  onSaved
}: {
  userId: string;
  classes: ClassCatalogItem[];
  initialClassIds: string[];
  teacherName: string;
  onSaved: () => void;
}) {
  const assign = useAssignTeacherClasses();
  const [selected, setSelected] = useState<string[]>(initialClassIds);
  const [error, setError] = useState<string | null>(null);

  function toggle(classId: string) {
    setSelected((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  }

  async function onSave() {
    setError(null);
    try {
      await assign.mutateAsync({ userId, classIds: selected });
      toast.success(
        `${teacherName} is now assigned to ${selected.length} class${selected.length === 1 ? '' : 'es'}.`
      );
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assignments.');
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

        {classes.length === 0 ? (
          <p className='text-muted-foreground text-sm'>
            No classes available. Add classes first under Classes.
          </p>
        ) : (
          <div className='flex max-h-[60vh] flex-col gap-1 overflow-y-auto'>
            {classes.map((c) => {
              const checked = selected.includes(c.id);
              return (
                <label
                  key={c.id}
                  className='hover:bg-muted/60 flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition-colors'
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(c.id)}
                  />
                  <FieldLabel className='flex-1 cursor-pointer'>
                    {c.name}
                  </FieldLabel>
                  <span className='text-muted-foreground text-sm'>
                    {c.studentCount} students
                  </span>
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
          {assign.isPending ? <Spinner /> : 'Save assignments'}
        </Button>
      </SheetFooter>
    </>
  );
}

export function AssignClassesSheet({
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
  const classes = useClassCatalog();
  const assignments = useTeacherClassAssignments(teacherId);

  const loading = classes.isLoading || assignments.isLoading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader>
        <SheetTitle>Assign classes</SheetTitle>
        <SheetDescription>
          Choose which classes {teacherName} should teach this academic year.
        </SheetDescription>
      </SheetHeader>

      {loading ? (
        <div className='flex justify-center py-12'>
          <Spinner />
        </div>
      ) : open ? (
        <AssignBody
          key={teacherId}
          userId={teacherId}
          classes={classes.data?.items ?? []}
          initialClassIds={assignments.data?.classIds ?? []}
          teacherName={teacherName}
          onSaved={() => onOpenChange(false)}
        />
      ) : null}
    </Sheet>
  );
}