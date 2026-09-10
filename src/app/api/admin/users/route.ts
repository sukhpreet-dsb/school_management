import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ROLES, normalizeRole } from '@/lib/roles';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';
import { ensureStudentProfile, ensureTeacherProfile, isEmpCodeAvailable } from '@/lib/profiles';
import type { AuthUser, Paginated } from '@/types/domain';

function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  role?: string | string[];
  image?: string | null;
  emailVerified?: boolean;
  banned?: boolean | null;
  createdAt?: Date | string;
  teacherProfile?: {
    empCode: string;
    phone: string | null;
    hireDate: Date | null;
    designation: string | null;
    _count?: { classes: number };
    subjects?: Array<{ subject: { id: string; name: string; code: string } }>;
  } | null;
  studentProfile?: { admissionNo: string } | null;
}): AuthUser {
  const role = Array.isArray(user.role) ? user.role[0] : user.role;
  const normalized = normalizeRole(role);
  const teacherSubjects = user.teacherProfile?.subjects?.map((ts) => ts.subject);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalized,
    image: user.image ?? null,
    emailVerified: user.emailVerified ?? false,
    banned: user.banned ?? false,
    createdAt: new Date(user.createdAt ?? Date.now()).toISOString(),
    subjects: normalized === 'teacher' ? teacherSubjects : undefined,
    profile:
      normalized === 'teacher' && user.teacherProfile
        ? {
            empCode: user.teacherProfile.empCode,
            phone: user.teacherProfile.phone,
            hireDate: user.teacherProfile.hireDate?.toISOString() ?? null,
            designation: user.teacherProfile.designation,
            classCount: user.teacherProfile._count?.classes ?? 0,
            subjects: teacherSubjects
          }
        : normalized === 'student' && user.studentProfile
          ? { admissionNo: user.studentProfile.admissionNo }
          : undefined,
    classCount:
      normalized === 'teacher' ? user.teacherProfile?._count?.classes ?? 0 : undefined
  };
}

const listQuerySchema = z.object({
  role: z.enum(ROLES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export async function GET(request: NextRequest) {
  return handleApiRoute<Paginated<AuthUser>>(async () => {
    await requireApiRole('admin');

    let query: z.infer<typeof listQuerySchema>;
    try {
      query = listQuerySchema.parse({
        role: request.nextUrl.searchParams.get('role') ?? undefined,
        q: request.nextUrl.searchParams.get('q') ?? undefined,
        page: request.nextUrl.searchParams.get('page') ?? 1,
        pageSize: request.nextUrl.searchParams.get('pageSize') ?? 20
      });
    } catch {
      throw apiError(422, 'Invalid query parameters.');
    }

    const where = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.q
        ? { OR: [{ email: { contains: query.q, mode: 'insensitive' as const } }, { name: { contains: query.q, mode: 'insensitive' as const } }] }
        : {})
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          teacherProfile: {
            include: {
              _count: { select: { classes: true } },
              subjects: { include: { subject: { select: { id: true, name: true, code: true } } } }
            }
          },
          studentProfile: true
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      data: {
        items: users.map(toAuthUser),
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize)
      },
      status: 200
    };
  });
}

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(80),
  password: z.string().min(8).max(100),
  role: z.enum(ROLES).default('student'),
  empCode: z.string().trim().max(20).optional(),
  phone: z.string().trim().max(30).optional(),
  hireDate: z.string().trim().optional(),
  subjectIds: z.array(z.string()).optional()
});

export async function POST(request: NextRequest) {
  return handleApiRoute<AuthUser>(async () => {
    await requireApiRole('admin');

    let body: z.infer<typeof createUserSchema>;
    try {
      body = createUserSchema.parse(await request.json());
    } catch {
      throw apiError(422, 'Invalid request body.');
    }

    if (body.empCode && !(await isEmpCodeAvailable(body.empCode))) {
      throw apiError(409, 'Emp code already in use.');
    }

    const result = await auth.api.createUser({
      body: {
        name: body.name,
        email: body.email,
        password: body.password,
        role: body.role as 'admin' | 'user'
      },
      headers: await headers()
    });

    try {
      if (body.role === 'teacher') {
        await ensureTeacherProfile({
          userId: result.user.id,
          empCode: body.empCode,
          phone: body.phone ?? null,
          hireDate: body.hireDate ?? null,
          subjectIds: body.subjectIds
        });
      } else if (body.role === 'student') {
        await ensureStudentProfile({ userId: result.user.id });
      }
    } catch (err) {
      console.error(`[profile] failed to set up profile for ${body.email}:`, err);
      await prisma.user.delete({ where: { id: result.user.id } }).catch(() => {});
      throw apiError(500, 'Account created but profile setup failed. Please try again.');
    }

    const createdUser = await prisma.user.findUnique({
      where: { id: result.user.id },
      include: {
        teacherProfile: {
          include: {
            _count: { select: { classes: true } },
            subjects: { include: { subject: { select: { id: true, name: true, code: true } } } }
          }
        },
        studentProfile: true
      }
    });

    return { data: toAuthUser(createdUser ?? result.user), status: 201 };
  });
}