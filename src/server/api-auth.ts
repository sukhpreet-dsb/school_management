import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { normalizeRole, type Role } from '@/lib/roles';
import type { ApiErrorCode } from '@/types/api';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function apiError(status: number, message: string) {
  return new ApiError(status, message);
}

export async function requireApiRole(...allowed: Role[]) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    throw apiError(401, 'You must be signed in.');
  }

  if (!allowed.includes(normalizeRole(session.user.role))) {
    throw apiError(403, 'Permission denied.');
  }

  return session;
}

const CODES: Record<number, ApiErrorCode> = {
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION'
};

export async function handleApiRoute<T>(
  handler: () => Promise<{ data: T; status?: number }>
) {
  try {
    const { data, status = 200 } = await handler();
    return NextResponse.json(data, { status });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    if (status >= 500) console.error(err);
    return NextResponse.json(
      {
        error: {
          code: CODES[status] ?? 'INTERNAL',
          message: err instanceof Error ? err.message : 'Internal server error.'
        }
      },
      { status }
    );
  }
}