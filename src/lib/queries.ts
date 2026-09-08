'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';
import type { CreateUserBody } from '@/types/api';
import type {
  AuthUser,
  Paginated,
  Student,
  TeacherClassSummary,
  TeacherStats
} from '@/types/domain';

export function useTeachersList() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () =>
      fetcher<Paginated<AuthUser>>('/api/admin/users?role=teacher&pageSize=100')
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

export function useMyClasses() {
  return useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: () => fetcher<Paginated<TeacherClassSummary>>('/api/teacher/classes')
  });
}

export function useClassEnrollments(classId: string) {
  return useQuery({
    queryKey: ['teacher', 'classes', classId, 'enrollments'],
    queryFn: () => fetcher<Student[]>(`/api/teacher/classes/${classId}/enrollments`),
    enabled: Boolean(classId)
  });
}