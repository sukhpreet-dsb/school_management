import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function ComingSoon({
  icon: Icon,
  title,
  description
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card className='flex flex-col items-center justify-center gap-2 p-10 text-center'>
      <div className='bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl'>
        <Icon className='size-6' />
      </div>
      <h2 className='text-lg font-semibold tracking-tight'>{title}</h2>
      <p className='text-muted-foreground max-w-sm text-sm'>{description}</p>
    </Card>
  );
}