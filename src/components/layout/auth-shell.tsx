import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className='relative flex min-h-svh w-full flex-col overflow-hidden'>
      <div className='absolute inset-0 -z-10 bg-linear-to-b from-background via-background to-muted/40' />
      <div className='landing-grid-bg absolute inset-0 -z-10' />
      <div className='bg-primary/10 absolute -top-32 -left-32 -z-10 size-96 rounded-full blur-3xl' />
      <div className='bg-chart-2/10 absolute -right-32 -bottom-32 -z-10 size-96 rounded-full blur-3xl' />

      <div className='flex grow flex-col items-center justify-center px-4 py-8'>
        <Link
          href='/'
          className='flex items-center gap-2.5'
        >
          <div className='bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm'>
            <GraduationCap className='size-6' />
          </div>
          <span className='text-foreground text-lg font-semibold tracking-tight'>
            School OS
          </span>
        </Link>

        <Card className='mt-6 w-full max-w-100 bg-card/90 shadow-lg backdrop-blur-sm'>
          <CardContent>{children}</CardContent>
        </Card>

        <p className='text-muted-foreground mt-6 text-center text-xs'>
          © {new Date().getFullYear()} School OS · School Management System
        </p>
      </div>
    </div>
  );
}