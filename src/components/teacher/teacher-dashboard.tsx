'use client';

import Link from 'next/link';
import {
  AlertTriangleIcon,
  BarChart3,
  BookOpen,
  GraduationCap,
  School,
  Users
} from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/layout/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { useTeacherDashboard } from '@/lib/queries';

export function TeacherDashboard({
  user
}: {
  user: { name: string; email: string };
}) {
  const dashboard = useTeacherDashboard();

  const firstName = user.name?.split(' ')[0] ?? 'Teacher';

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={`Your classes and performance for the 2026–2027 academic year.`}
      />

      {dashboard.isError && (
        <Alert variant='destructive'>
          <AlertTriangleIcon className='h-4 w-4' />
          <AlertTitle>Could not load your dashboard</AlertTitle>
          <AlertDescription>Please try again.</AlertDescription>
        </Alert>
      )}

      {dashboard.isLoading ? (
        <div className='flex justify-center py-12'>
          <Spinner />
        </div>
      ) : dashboard.data ? (
        <>
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            <StatCard
              title='My Classes'
              value={dashboard.data.myClasses.length}
              icon={School}
              iconClass='bg-primary/10 text-primary'
              hint='Classes I teach'
            />
            <StatCard
              title='Students'
              value={dashboard.data.myClasses.reduce(
                (sum, c) => sum + c.studentCount,
                0
              )}
              icon={Users}
              iconClass='bg-sky-500/10 text-sky-600 dark:text-sky-400'
              hint='Across my classes'
            />
            <StatCard
              title='Subjects'
              value={dashboard.data.subjectsTaught.length}
              icon={BookOpen}
              iconClass='bg-amber-500/10 text-amber-600 dark:text-amber-400'
              hint='Taught this year'
            />
            <StatCard
              title='Avg class size'
              value={dashboard.data.averageStudentCount}
              icon={BarChart3}
              iconClass='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              hint='Students per class'
            />
          </div>

          <Card>
            <CardContent className='flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <GraduationCap className='text-primary size-5' />
                  <span className='font-semibold'>My classes</span>
                </div>
                <Link
                  href='/teacher/classes'
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  View all
                </Link>
              </div>

              {dashboard.data.myClasses.length === 0 ? (
                <p className='text-muted-foreground text-sm'>
                  You are not assigned to any classes yet.
                </p>
              ) : (
                <ul className='divide-y'>
                  {dashboard.data.myClasses.map((schoolClass) => (
                    <li key={schoolClass.id}>
                      <Link
                        href={`/teacher/classes/${schoolClass.id}`}
                        className='hover:bg-muted/50 flex items-center justify-between rounded-xl px-2 py-3 transition-colors'
                      >
                        <span className='font-medium'>{schoolClass.name}</span>
                        <span className='text-muted-foreground text-sm'>
                          {schoolClass.studentCount} students
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </>
  );
}