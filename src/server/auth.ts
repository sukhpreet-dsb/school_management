'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { forbidden } from 'next/navigation';
import { type Role, normalizeRole } from '@/lib/roles';

export async function getSession() {
  return await auth.api.getSession({
    headers: await headers()
  });
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

export async function requireRole(...allowed: Role[]) {
  const session = await requireSession();

  if (!allowed.includes(normalizeRole(session.user.role))) {
    forbidden();
  }

  return session;
}