'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { authClient } from '@/lib/auth-client';
import { roleHomePath } from '@/mock/nav';
import { normalizeRole } from '@/lib/roles';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangleIcon } from 'lucide-react';
import { Alert } from '@/components/ui/alert';

const signInSchema = z.object({
  email: z
    .email('Please enter a valid email address.')
    .min(1, 'Email is required.')
    .max(50, 'Email must be at most 50 characters.'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .max(100, 'Password must be at most 100 characters.'),
  rememberMe: z.boolean().optional()
});

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setLoading] = useState(false);

  type SignInValues = z.infer<typeof signInSchema>;

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  async function onSubmit({ email, password, rememberMe }: SignInValues) {
    setError(null);
    setLoading(true);

    try {
      const { error, data } = await authClient.signIn.email({
        email,
        password,
        rememberMe
      });

      if (!data) {
        setError(error?.message || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      form.reset();
      toast.success('Welcome back!');
      router.push(roleHomePath(normalizeRole(data.user.role)));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn('flex w-full max-w-100 flex-col gap-6', className)}
      {...props}
    >
      {/* Header */}
      <div className='flex flex-col items-center gap-2 text-center'>
        <h1 className='text-2xl font-semibold tracking-tight'>Welcome back</h1>
        <p className='text-muted-foreground text-sm'>
          Enter your email below to login to your account
        </p>

        {error && (
          <Alert variant='destructive' className='mt-4 w-full'>
            <AlertTriangleIcon className='mr-2 h-4 w-4' />
            {error}
          </Alert>
        )}
      </div>

      {/* Main Form Area */}
      <div className='grid gap-6'>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* Email Field */}
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

            {/* Password Field */}
            <Controller
              name='password'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className='flex items-center justify-between'>
                    <FieldLabel htmlFor='password'>Password</FieldLabel>
                    <Link
                      href='/forgot-password'
                      className='text-muted-foreground hover:text-primary text-sm underline-offset-4 hover:underline'
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <PasswordInput
                    {...field}
                    id='password'
                    placeholder='••••••••'
                    autoComplete='current-password'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name='rememberMe'
              control={form.control}
              render={({ field }) => (
                <Field orientation='horizontal'>
                  <Checkbox
                    id='rememberMe'
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor='rememberMe'>Remember me</FieldLabel>
                </Field>
              )}
            />

            {/* Sign In Button */}
            <Button
              type='submit'
              disabled={isSubmitting}
              className='w-full shadow-sm'
            >
              {isSubmitting ? <Spinner /> : 'Sign In'}
            </Button>
          </FieldGroup>
        </form>
      </div>

      {/* Footer Sign Up */}
      <p className='text-muted-foreground px-8 text-center text-sm'>
        Don&apos;t have an account?{' '}
        <Link
          href='/signup'
          className='text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline'
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
