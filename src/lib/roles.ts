export const ROLES = ['admin', 'teacher', 'student'] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function normalizeRole(value: unknown): Role {
  if (isRole(value)) {
    return value;
  }

  return 'student';
}

export function hasRole(role: unknown, allowed: Role[]): boolean {
  return isRole(role) && allowed.includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student'
};