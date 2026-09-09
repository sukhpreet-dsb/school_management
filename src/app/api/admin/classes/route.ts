import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';
import { getClassCatalog, getClassStudentCounts, toClassCatalogItem } from '@/server/teacher';
import type { ClassCatalogItem, Paginated } from '@/types/domain';

const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(10)
});

export async function GET(request: NextRequest) {
  return handleApiRoute<Paginated<ClassCatalogItem>>(async () => {
    await requireApiRole('admin');

    let query: z.infer<typeof listQuerySchema>;
    try {
      query = listQuerySchema.parse({
        q: request.nextUrl.searchParams.get('q') ?? undefined,
        page: request.nextUrl.searchParams.get('page') ?? 1,
        pageSize: request.nextUrl.searchParams.get('pageSize') ?? 10
      });
    } catch {
      throw apiError(422, 'Invalid query parameters.');
    }

    const q = query.q?.trim();
    type ClassWhere = NonNullable<Parameters<typeof prisma.class.findMany>[0]>['where'];
    let where: ClassWhere = {};
    if (q) {
      const gradeNum = /^\d+$/.test(q) ? Number(q) : Number.NaN;
      where = {
        OR: [
          ...(Number.isInteger(gradeNum) && gradeNum >= 1 && gradeNum <= 12
            ? [{ grade: gradeNum }]
            : []),
          { section: { contains: q, mode: 'insensitive' as const } },
          { room: { contains: q, mode: 'insensitive' as const } }
        ]
      };
    }

    const [rows, total] = await Promise.all([
      prisma.class.findMany({
        where,
        orderBy: [{ grade: 'asc' }, { section: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      prisma.class.count({ where })
    ]);

    const counts = await getClassStudentCounts();

    return {
      data: {
        items: rows.map((row) => toClassCatalogItem(row, counts.get(row.id) ?? 0)),
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize)
      },
      status: 200
    };
  });
}

const createClassSchema = z.object({
  grade: z.coerce.number().int().min(1).max(12),
  section: z.string().trim().toUpperCase().min(1).max(4).default('A'),
  room: z.string().trim().max(30).optional()
});

export async function POST(request: NextRequest) {
  return handleApiRoute<ClassCatalogItem>(async () => {
    await requireApiRole('admin');

    let body: z.infer<typeof createClassSchema>;
    try {
      body = createClassSchema.parse(await request.json());
    } catch {
      throw apiError(422, 'Invalid request body.');
    }

    const existing = await prisma.class.findUnique({
      where: { grade_section_academicYear: { grade: body.grade, section: body.section, academicYear: '2026-2027' } }
    });
    if (existing) {
      throw apiError(409, `Class ${body.grade} ${body.section} already exists.`);
    }

    const created = await prisma.class.create({
      data: {
        grade: body.grade,
        section: body.section,
        room: body.room ?? null,
        academicYear: '2026-2027'
      }
    });

    const catalog = await getClassCatalog();
    return {
      data: catalog.find((c) => c.id === created.id)!,
      status: 201
    };
  });
}