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
import { PasswordInput } from '@/components/ui/password-input';
import { useEffect, useMemo, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangleIcon } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(100, 'Password must be at most 100 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword']
  });

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  const [isSubmitting, setIsSubmitting] = useState(false);

  type FormValues = z.infer<typeof resetPasswordSchema>;

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    if (error) {
      toast.error('This reset link is invalid or has expired.');
    }
  }, [error]);

  const invalid = useMemo(
    () => error === 'INVALID_TOKEN' || !token,
    [error, token]
  );

  async function onSubmit({ password }: FormValues) {
    if (!token) return;

    try {
      setIsSubmitting(true);

      const { error } = await authClient.resetPassword({
        newPassword: password,
        token
      });

      if (error) {
        toast.error(
          error.message || 'Failed to reset password. Please try again.'
        );
        return;
      }

      toast.success('Password reset successfully. Please sign in.');
      router.push('/login');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (invalid) {
    return (
      <div
        className={cn('flex w-full max-w-100 flex-col gap-6', className)}
        {...props}
      >
        <Alert variant='destructive'>
          <AlertTriangleIcon className='h-4 w-4' />
          <AlertTitle>Invalid or expired link</AlertTitle>
          <AlertDescription>
            This password reset link is invalid or has expired. Please request a
            new one.
          </AlertDescription>
        </Alert>
        <Button
          type='button'
          className='w-full'
          onClick={() => router.push('/forgot-password')}
        >
          Request a new link
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
          Reset your password
        </h1>
        <p className='text-muted-foreground text-sm'>
          Enter a new password for your account.
        </p>
      </div>

      {/* Main Form Area */}
      <div className='grid gap-6'>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name='password'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='password'>New password</FieldLabel>
                  <PasswordInput
                    {...field}
                    id='password'
                    placeholder='••••••••'
                    autoComplete='new-password'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name='confirmPassword'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='confirmPassword'>
                    Confirm password
                  </FieldLabel>
                  <PasswordInput
                    {...field}
                    id='confirmPassword'
                    placeholder='••••••••'
                    autoComplete='new-password'
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
              {isSubmitting ? <Spinner /> : 'Reset password'}
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
