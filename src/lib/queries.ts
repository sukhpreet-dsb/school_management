'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';
import type { CreateStudentBody, CreateUserBody, UpdateStudentBody } from '@/types/api';
import type {
  AdminStats,
  AuthUser,
  ClassCatalogItem,
  Paginated,
  Student,
  Subject,
  TeacherClassSummary,
  TeacherStats
} from '@/types/domain';

export type SubjectWithTeacherCount = Subject & { teacherCount: number };

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => fetcher<AdminStats>('/api/admin/dashboard')
  });
}

export function useTeachers(opts: { page?: number; pageSize?: number; q?: string } = {}) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 10;
  const q = opts.q?.trim() ?? '';
  const params = new URLSearchParams({ role: 'teacher', page: String(page), pageSize: String(pageSize) });
  if (q) params.set('q', q);
  return useQuery({
    queryKey: ['admin', 'users', 'list', page, pageSize, q],
    queryFn: () => fetcher<Paginated<AuthUser>>(`/api/admin/users?${params.toString()}`),
    placeholderData: keepPreviousData
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateUserBody) =>
      fetcher<AuthUser>('/api/admin/users', { method: 'POST', body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });
}

export function useTeacherDashboard() {
  return useQuery({
    queryKey: ['teacher', 'dashboard'],
    queryFn: () => fetcher<TeacherStats>('/api/teacher/dashboard')
  });
}

export function useMyClasses(opts: { page?: number; pageSize?: number } = {}) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 10;
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return useQuery({
    queryKey: ['teacher', 'classes', 'list', page, pageSize],
    queryFn: () => fetcher<Paginated<TeacherClassSummary>>(`/api/teacher/classes?${params.toString()}`),
    placeholderData: keepPreviousData
  });
}

export function useTeacherMySubjects(opts: { page?: number; pageSize?: number; q?: string } = {}) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 10;
  const q = opts.q?.trim() ?? '';
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (q) params.set('q', q);
  return useQuery({
    queryKey: ['teacher', 'subjects', 'list', page, pageSize, q],
    queryFn: () => fetcher<Paginated<Subject>>(`/api/teacher/subjects?${params.toString()}`),
    placeholderData: keepPreviousData
  });
}

export function useClassEnrollments(
  classId: string,
  opts: { page?: number; pageSize?: number; q?: string } = {}
) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 10;
  const q = opts.q?.trim() ?? '';
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (q) params.set('q', q);
  return useQuery({
    queryKey: ['teacher', 'classes', classId, 'enrollments', 'list', page, pageSize, q],
    queryFn: () =>
      fetcher<Paginated<Student>>(
        `/api/teacher/classes/${classId}/enrollments?${params.toString()}`
      ),
    enabled: Boolean(classId),
    placeholderData: keepPreviousData
  });
}

export function useTeacherStudents(
  opts: { page?: number; pageSize?: number; q?: string; classId?: string } = {}
) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 10;
  const q = opts.q?.trim() ?? '';
  const classId = opts.classId?.trim() ?? '';
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (q) params.set('q', q);
  if (classId) params.set('classId', classId);
  return useQuery({
    queryKey: ['teacher', 'students', 'list', page, pageSize, q, classId],
    queryFn: () => fetcher<Paginated<Student>>(`/api/teacher/students?${params.toString()}`),
    placeholderData: keepPreviousData
  });
}

export function useClasses(opts: { page?: number; pageSize?: number; q?: string } = {}) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 10;
  const q = opts.q?.trim() ?? '';
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (q) params.set('q', q);
  return useQuery({
    queryKey: ['admin', 'classes', 'list', page, pageSize, q],
    queryFn: () => fetcher<Paginated<ClassCatalogItem>>(`/api/admin/classes?${params.toString()}`),
    placeholderData: keepPreviousData
  });
}

export function useClassCatalog() {
  return useQuery({
    queryKey: ['admin', 'classes'],
    queryFn: () => fetcher<Paginated<ClassCatalogItem>>('/api/admin/classes?page=1&pageSize=1000')
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { grade: number; section: string; room?: string }) =>
      fetcher<ClassCatalogItem>('/api/admin/classes', { method: 'POST', body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'classes'] });
    }
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher<{ id: string }>(`/api/admin/classes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'classes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['teacher'] });
    }
  });
}

export function useTeacherClassAssignments(userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', userId, 'classes'],
    queryFn: () => fetcher<{ classIds: string[] }>(`/api/admin/teachers/${userId}/classes`),
    enabled: Boolean(userId)
  });
}

export function useAssignTeacherClasses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, classIds }: { userId: string; classIds: string[] }) =>
      fetcher<{ userId: string; classIds: string[] }>(`/api/admin/teachers/${userId}/classes`, {
        method: 'PUT',
        body: { classIds }
      }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', vars.userId, 'classes'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'classes'] });
    }
  });
}

export function useSubjects(opts: { page?: number; pageSize?: number; q?: string } = {}) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 10;
  const q = opts.q?.trim() ?? '';
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (q) params.set('q', q);
  return useQuery({
    queryKey: ['admin', 'subjects', 'list', page, pageSize, q],
    queryFn: () => fetcher<Paginated<SubjectWithTeacherCount>>(`/api/admin/subjects?${params.toString()}`),
    placeholderData: keepPreviousData
  });
}

export function useSubjectCatalog() {
  return useQuery({
    queryKey: ['admin', 'subjects'],
    queryFn: () => fetcher<Paginated<SubjectWithTeacherCount>>('/api/admin/subjects?page=1&pageSize=1000')
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; code: string }) =>
      fetcher<Subject>('/api/admin/subjects', { method: 'POST', body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subjects'] });
    }
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher<{ id: string }>(`/api/admin/subjects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subjects'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['teacher'] });
    }
  });
}

export function useTeacherSubjectAssignments(userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', userId, 'subjects'],
    queryFn: () => fetcher<{ subjectIds: string[] }>(`/api/admin/teachers/${userId}/subjects`),
    enabled: Boolean(userId)
  });
}

export function useAssignTeacherSubjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, subjectIds }: { userId: string; subjectIds: string[] }) =>
      fetcher<{ userId: string; subjectIds: string[] }>(`/api/admin/teachers/${userId}/subjects`, {
        method: 'PUT',
        body: { subjectIds }
      }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', vars.userId, 'subjects'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'subjects'] });
      queryClient.invalidateQueries({ queryKey: ['teacher'] });
    }
  });
}

export function useStudents(opts: { page?: number; pageSize?: number; q?: string } = {}) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 10;
  const q = opts.q?.trim() ?? '';
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (q) params.set('q', q);
  return useQuery({
    queryKey: ['admin', 'students', 'list', page, pageSize, q],
    queryFn: () => fetcher<Paginated<Student>>(`/api/admin/students?${params.toString()}`),
    placeholderData: keepPreviousData
  });
}

function invalidateStudentData(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
  queryClient.invalidateQueries({ queryKey: ['admin', 'classes'] });
  queryClient.invalidateQueries({ queryKey: ['teacher', 'students'] });
  queryClient.invalidateQueries({ queryKey: ['teacher', 'classes'] });
  queryClient.invalidateQueries({ queryKey: ['teacher', 'dashboard'] });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateStudentBody) =>
      fetcher<Student>('/api/admin/students', { method: 'POST', body }),
    onSuccess: () => invalidateStudentData(queryClient)
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, ...body }: UpdateStudentBody & { studentId: string }) =>
      fetcher<Student>(`/api/admin/students/${studentId}`, { method: 'PATCH', body }),
    onSuccess: () => invalidateStudentData(queryClient)
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) =>
      fetcher<{ id: string }>(`/api/admin/students/${studentId}`, { method: 'DELETE' }),
    onSuccess: () => invalidateStudentData(queryClient)
  });
}