import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, handleApiRoute, requireApiRole } from '@/server/api-auth';
import { createSubject, getDbSubjects, SubjectWithTeacherCount } from '@/server/subjects';
import type { Paginated, Subject } from '@/types/domain';

const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(10)
});

export async function GET(request: NextRequest) {
  return handleApiRoute<Paginated<SubjectWithTeacherCount>>(async () => {
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

    const data = await getDbSubjects({
      q: query.q,
      page: query.page,
      pageSize: query.pageSize
    });

    return { data, status: 200 };
  });
}

const createSubjectSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.').max(50, 'Name must be at most 50 characters.'),
  code: z.string().trim().min(2, 'Code is required.').max(10, 'Code must be at most 10 characters.')
});

export async function POST(request: NextRequest) {
  return handleApiRoute<Subject>(async () => {
    await requireApiRole('admin');

    let body: z.infer<typeof createSubjectSchema>;
    try {
      body = createSubjectSchema.parse(await request.json());
    } catch {
      throw apiError(422, 'Invalid subject data.');
    }

    try {
      const subject = await createSubject({
        name: body.name,
        code: body.code
      });
      return { data: subject, status: 201 };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Subject creation failed.';
      if (message.includes('already exists')) {
        throw apiError(409, message);
      }
      throw apiError(500, message);
    }
  });
}
