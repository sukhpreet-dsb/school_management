import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  School,
  Settings,
  Star,
  type LucideIcon,
  Users
} from 'lucide-react';
import type { UserRole } from '@/types/domain';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const NAV: Record<UserRole, NavItem[]> = {
  admin: [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { title: 'Students', href: '/admin/students', icon: GraduationCap },
    { title: 'Teachers', href: '/admin/teachers', icon: Users },
    { title: 'Classes', href: '/admin/classes', icon: School },
    { title: 'Subjects', href: '/admin/subjects', icon: BookOpen },
    // { title: 'Grades', href: '/admin/grades', icon: BarChart3 },
    // { title: 'Attendance', href: '/admin/attendance', icon: CalendarDays },
    // { title: 'Users & Roles', href: '/admin/users', icon: ClipboardList },
    // { title: 'Settings', href: '/admin/settings', icon: Settings }
  ],
  teacher: [
    { title: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
    { title: 'My Classes', href: '/teacher/classes', icon: School },
    { title: 'Students', href: '/teacher/students', icon: GraduationCap },
    { title: 'Grades', href: '/teacher/grades', icon: BarChart3 },
    { title: 'Attendance', href: '/teacher/attendance', icon: CalendarDays },
    { title: 'Subjects', href: '/teacher/subjects', icon: Star }
  ],
  student: [
    { title: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { title: 'My Grades', href: '/student/grades', icon: BarChart3 },
    { title: 'My Attendance', href: '/student/attendance', icon: CalendarDays },
    { title: 'My Classes', href: '/student/classes', icon: School },
    { title: 'Profile', href: '/student/profile', icon: Users }
  ]
};

export function roleHomePath(role: UserRole): string {
  return NAV[role][0].href;
}