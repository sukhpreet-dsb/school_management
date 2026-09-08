export type UserRole = 'admin' | 'teacher' | 'student';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type EnrollmentStatus = 'ACTIVE' | 'TRANSFERRED' | 'GRADUATED' | 'DROPPED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type LetterGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
export type Term = 1 | 2 | 3;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image: string | null;
  emailVerified: boolean;
  banned: boolean;
  createdAt: string;
  classCount?: number;
  profile?: {
    empCode?: string;
    phone?: string | null;
    hireDate?: string | null;
    designation?: string | null;
    admissionNo?: string;
    classCount?: number;
  };
}

export interface StudentSummary {
  id: string;
  name: string;
  admissionNo: string;
  email: string;
}

export interface Student {
  id: string;
  userId: string;
  admissionNo: string;
  name: string;
  email: string;
  dob: string | null;
  gender: Gender | null;
  address: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  currentClass: {
    id: string;
    name: string;
    section: string | null;
    academicYear: string;
  } | null;
}

export interface Teacher {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  hireDate: string | null;
  headOfClasses: Array<
    Partial<SchoolClass> & { id: string; name: string; section: string | null; academicYear: string }
  >;
  subjects: Subject[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface ClassSubject {
  id: string;
  classId: string;
  subject: Subject;
  teacher: { id: string; name: string } | null;
}

export interface SchoolClass {
  id: string;
  name: string;
  section: string | null;
  academicYear: string;
  room: string | null;
  classTeacher: { id: string; name: string } | null;
  subjects: ClassSubject[];
  studentCount: number;
}

export interface ClassCatalogItem {
  id: string;
  grade: number;
  section: string;
  name: string;
  room: string | null;
  academicYear: string;
  studentCount: number;
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  academicYear: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  leftAt: string | null;
}

export interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectCode: string;
  classId: string;
  className: string;
  term: Term;
  academicYear: string;
  score: number;
  letterGrade: LetterGrade;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  date: string;
  status: AttendanceStatus;
  note: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GradeDistribution {
  className: string;
  'A+': number;
  A: number;
  B: number;
  C: number;
  D: number;
  F: number;
}

export interface AdminStats {
  totals: { students: number; teachers: number; classes: number; subjects: number };
  enrollmentByYear: Array<{ academicYear: string; count: number }>;
  classSizes: Array<{ classId: string; className: string; count: number }>;
  gradeDistribution: GradeDistribution[];
  attendanceRateOverall: number;
  presentRateByClass: Array<{ className: string; rate: number }>;
  attendanceBreakdown: { present: number; late: number; absent: number; excused: number };
}

export interface TeacherClassSummary {
  id: string;
  name: string;
  studentCount: number;
}

export interface TeacherStats {
  myClasses: TeacherClassSummary[];
  subjectsTaught: Subject[];
  gradeDistributionForMyClasses: GradeDistribution[];
  attendanceRateByClass: Array<{ className: string; rate: number }>;
  averageStudentCount: number;
}

export interface StudentStats {
  currentClass: { id: string; name: string; section: string | null; academicYear: string } | null;
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    letterGrade: LetterGrade | null;
    average: number | null;
  }>;
  attendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
  };
  attendanceByMonth: Array<{ month: string; rate: number }>;
  profile: {
    name: string;
    admissionNo: string;
    guardian: string;
    sessionsAttended: number;
  };
}