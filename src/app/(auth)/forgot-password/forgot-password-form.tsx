'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Spinner } from '@/components/ui/spinner';
import { MailCheckIcon } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z
    .email('Please enter a valid email address.')
    .min(1, 'Email is required.')
    .max(50, 'Email must be at most 50 characters.')
});

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  type FormValues = z.infer<typeof forgotPasswordSchema>;

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  async function onSubmit({ email }: FormValues) {
    try {
      setIsSubmitting(true);

      await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`
      });

      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div
        className={cn('flex w-full max-w-100 flex-col gap-6', className)}
        {...props}
      >
        <div className='flex flex-col items-center gap-2 text-center'>
          <div className='bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full'>
            <MailCheckIcon className='h-6 w-6' />
          </div>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Check your email
          </h1>
          <p className='text-muted-foreground text-sm'>
            If an account exists for that email, we&apos;ve sent you a link to
            reset your password. Please check your inbox.
          </p>
        </div>

        <Button
          type='button'
          variant='outline'
          className='w-full'
          onClick={() => router.push('/login')}
        >
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn('flex w-full max-w-100 flex-col gap-6', className)}
      {...props}
    >
      {/* Header */}
      <div className='flex flex-col items-center gap-2 text-center'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Forgot password
        </h1>
        <p className='text-muted-foreground text-sm'>
          Enter your email and we&apos;ll send you a link to reset your
          password.
        </p>
      </div>

      {/* Main Form Area */}
      <div className='grid gap-6'>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
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
                    autoCapitalize='none'
                    autoCorrect='off'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Button
              type='submit'
              disabled={isSubmitting}
              className='w-full shadow-sm'
            >
              {isSubmitting ? <Spinner /> : 'Send reset link'}
            </Button>
          </FieldGroup>
        </form>
      </div>

      {/* Footer Link */}
      <p className='text-muted-foreground px-8 text-center text-sm'>
        Remembered your password?{' '}
        <Link
          href='/login'
          className='text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline'
        >
          Back to login
        </Link>
      </p>
    </div>
  );
}
