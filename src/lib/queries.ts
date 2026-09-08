'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';
import type { CreateUserBody } from '@/types/api';
import type {
  AuthUser,
  ClassCatalogItem,
  Paginated,
  Student,
  TeacherClassSummary,
  TeacherStats
} from '@/types/domain';

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