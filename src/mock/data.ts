import type {
  AdminStats,
  AttendanceRecord,
  AttendanceStatus,
  ClassSubject,
  Enrollment,
  Grade,
  Gender,
  LetterGrade,
  Paginated,
  SchoolClass,
  Student,
  StudentStats,
  Subject,
  Teacher,
  TeacherStats,
  Term
} from '@/types/domain';

const FIRST_NAMES = [
  'Aarav', 'Meera', 'Rohan', 'Ananya', 'Vikram', 'Sana', 'Kabir', 'Ishita',
  'Arjun', 'Priya', 'Aditya', 'Naina', 'Dev', 'Riya', 'Manav', 'Tara',
  'Siddharth', 'Aisha', 'Rahul', 'Kavya', 'Nikhil', 'Pooja', 'Samar', 'Divya',
  'Harsh', 'Neha', 'Yash', 'Simran', 'Amit', 'Zara', 'Kunal', 'Fatima',
  'Ravi', 'Pranavi', 'Gaurav', 'Lakshmi', 'Suresh', 'Maya', 'Deepak', 'Nandini',
  'Varun', 'Aparna', 'Jatin', 'Rukmini', 'Om', 'Tanvi', 'Prakash', 'Gauri',
  'Karan', 'Shalini'
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Reddy', 'Gupta', 'Mehta', 'Singh', 'Kapoor', 'Verma',
  'Nair', 'Iyer', 'Rao', 'Chopra', 'Malhotra', 'Kulkarni', 'Joshi', 'Saxena',
  'Bhatia', 'Agarwal', 'Desai', 'Mishra', 'Pillai', 'Kaur', 'Thakur', 'Rana'
];

const STREETS = [
  'MG Road', 'Park Avenue', 'Lake View', 'Rose Garden', 'Millennium', 'Green Hills',
  'Sunrise', 'Maple Street', 'Cedar Lane', 'Orchid Colony'
];

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260907);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function letterFor(score: number): LetterGrade {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

export const ACADEMIC_YEAR = '2026-2027';

// ---------------------------------------------------------------------------
// Raw generated records
// ---------------------------------------------------------------------------

const subjects: Subject[] = [
  { id: 'sub-math', name: 'Mathematics', code: 'MATH' },
  { id: 'sub-sci', name: 'Science', code: 'SCI' },
  { id: 'sub-eng', name: 'English', code: 'ENG' },
  { id: 'sub-cs', name: 'Computer Science', code: 'CS' },
  { id: 'sub-hist', name: 'History', code: 'HIST' },
  { id: 'sub-geo', name: 'Geography', code: 'GEOG' },
  { id: 'sub-art', name: 'Art', code: 'ART' },
  { id: 'sub-pe', name: 'Physical Education', code: 'PE' }
];

const rawClasses: Array<{ id: string; name: string; section: string; room: string }> = range(6).map(
  (i) => {
    const grade = 5 + Math.floor(i / 2);
    const section = i % 2 === 0 ? 'A' : 'B';
    return { id: `cls-${grade}-${section.toLowerCase()}`, name: `Class ${grade}`, section, room: `Room ${101 + i}` };
  }
);

const teachers: Teacher[] = range(8).map((i) => {
  const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  return {
    id: `tch-${pad(i + 1, 2)}`,
    userId: `user-tch-${pad(i + 1, 2)}`,
    name,
    email: `teacher${i + 1}@school.edu`,
    phone: `+91 98${range(8).map(() => Math.floor(rng() * 10)).join('')}`,
    hireDate: `20${18 + (i % 8)}-07-01`,
    headOfClasses: [],
    subjects: []
  };
});

const studentRows: Array<{
  userId: string;
  name: string;
  email: string;
  admissionNo: string;
  dob: string;
  gender: Gender;
  address: string;
  guardianName: string;
  guardianPhone: string;
}> = range(50).map((i) => {
  const gender: Gender = rng() > 0.5 ? 'FEMALE' : 'MALE';
  return {
    userId: `user-stu-${pad(i + 1, 3)}`,
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    email: `student${i + 1}@school.edu`,
    admissionNo: `S${1001 + i}`,
    dob: `20${14 + Math.floor(rng() * 3)}-${pad(1 + Math.floor(rng() * 12), 2)}-${pad(1 + Math.floor(rng() * 28), 2)}`,
    gender,
    address: `#${1 + Math.floor(rng() * 99)}, ${pick(STREETS)}, New Delhi`,
    guardianName: `Mr. ${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    guardianPhone: `+91 98${range(8).map(() => Math.floor(rng() * 10)).join('')}`
  };
});

const classIndexByStudent = range(50).map((i) => i % rawClasses.length);

const rawEnrollments: Enrollment[] = [
  ...range(50).map((i) => {
    const c = rawClasses[classIndexByStudent[i]];
    return {
      id: `enr-${pad(i + 1, 3)}`,
      studentId: `stu-${pad(i + 1, 3)}`,
      studentName: studentRows[i].name,
      classId: c.id,
      className: `${c.name} ${c.section}`,
      academicYear: ACADEMIC_YEAR,
      status: 'ACTIVE' as const,
      enrolledAt: '2026-04-01',
      leftAt: null
    };
  }),
  {
    id: 'enr-hist-1',
    studentId: 'stu-001',
    studentName: studentRows[0].name,
    classId: rawClasses[0].id,
    className: `${rawClasses[0].name} ${rawClasses[0].section}`,
    academicYear: '2025-2026',
    status: 'GRADUATED',
    enrolledAt: '2025-04-01',
    leftAt: '2026-03-31'
  },
  {
    id: 'enr-hist-2',
    studentId: 'stu-002',
    studentName: studentRows[1].name,
    classId: rawClasses[2].id,
    className: `${rawClasses[2].name} ${rawClasses[2].section}`,
    academicYear: '2025-2026',
    status: 'TRANSFERRED',
    enrolledAt: '2025-04-01',
    leftAt: '2025-11-30'
  }
];

const CORE_SUBJECT_IDS = ['sub-math', 'sub-sci', 'sub-eng', 'sub-cs', 'sub-hist', 'sub-geo'];

const rawClassSubjects: ClassSubject[] = rawClasses.flatMap((c, ci) =>
  CORE_SUBJECT_IDS.map((subjectId, si) => {
    const subject = subjects.find((s) => s.id === subjectId)!;
    const teacherId = `tch-${pad(((ci * 3 + si) % teachers.length) + 1, 2)}`;
    return {
      id: `cs-${c.id}-${subject.id}`,
      classId: c.id,
      subject,
      teacher: { id: teacherId, name: teachers.find((t) => t.id === teacherId)!.name }
    }
  })
);

const rawGrades: Grade[] = [];
{
  const terms: Term[] = [1, 2];
  for (const e of rawEnrollments.filter(
    (x) => x.status === 'ACTIVE' && x.academicYear === ACADEMIC_YEAR
  )) {
    const classSubjects = rawClassSubjects.filter((cs) => cs.classId === e.classId);
    for (const term of terms) {
      for (const cs of classSubjects) {
        const score = 40 + Math.floor(rng() * 61);
        rawGrades.push({
          id: `grd-${e.studentId}-${term}-${cs.subject.id}`,
          studentId: e.studentId,
          studentName: e.studentName,
          subjectId: cs.subject.id,
          subjectCode: cs.subject.code,
          classId: e.classId,
          className: e.className,
          term,
          academicYear: ACADEMIC_YEAR,
          score,
          letterGrade: letterFor(score)
        });
      }
    }
  }
}

const rawAttendance: AttendanceRecord[] = [];
{
  const dates: string[] = [];
  const d = new Date('2026-09-07');
  while (dates.length < 30) {
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) {
      dates.push(isoDate(d));
    }
    d.setUTCDate(d.getUTCDate() - 1);
  }
  let seq = 0;
  for (const date of dates) {
    for (const e of rawEnrollments.filter(
      (x) => x.status === 'ACTIVE' && x.academicYear === ACADEMIC_YEAR
    )) {
      const roll = rng();
      const status: AttendanceStatus =
        roll < 0.82 ? 'PRESENT' : roll < 0.9 ? 'ABSENT' : roll < 0.96 ? 'LATE' : 'EXCUSED';
      seq += 1;
      rawAttendance.push({
        id: `att-${pad(seq, 4)}`,
        studentId: e.studentId,
        studentName: e.studentName,
        classId: e.classId,
        className: e.className,
        date,
        status,
        note: status === 'EXCUSED' ? 'Medical leave' : null
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Selectors (mirror of future Prisma queries)
// ---------------------------------------------------------------------------

function currentClassFor(studentId: string): Student['currentClass'] {
  const e = rawEnrollments.find(
    (x) => x.studentId === studentId && x.status === 'ACTIVE' && x.academicYear === ACADEMIC_YEAR
  );
  if (!e) return null;
  const c = rawClasses.find((x) => x.id === e.classId)!;
  return { id: c.id, name: c.name, section: c.section, academicYear: e.academicYear };
}

export function getStudents(): Student[] {
  return studentRows.map((s, i) => ({
    id: `stu-${pad(i + 1, 3)}`,
    userId: s.userId,
    admissionNo: s.admissionNo,
    name: s.name,
    email: s.email,
    dob: s.dob,
    gender: s.gender,
    address: s.address,
    guardianName: s.guardianName,
    guardianPhone: s.guardianPhone,
    currentClass: currentClassFor(`stu-${pad(i + 1, 3)}`)
  }));
}

export function getStudent(id: string): Student | undefined {
  return getStudents().find((s) => s.id === id);
}

export function getTeachers(): Teacher[] {
  return teachers.map((t) => ({
    ...t,
    headOfClasses: rawClasses
      .filter((c) => t.id === teachers[rawClasses.indexOf(c)].id)
      .map((c) => ({
        id: c.id,
        name: c.name,
        section: c.section,
        academicYear: ACADEMIC_YEAR
      })),
    subjects: rawClassSubjects
      .filter((cs) => cs.teacher!.id === t.id)
      .map((cs) => cs.subject)
      .filter((s, idx, arr) => arr.findIndex((y) => y.id === s.id) === idx)
  }));
}

export function getTeacher(id: string): Teacher | undefined {
  return getTeachers().find((t) => t.id === id);
}

export function getSubjects(): Subject[] {
  return subjects;
}

export function getClassSubjects(classId: string): ClassSubject[] {
  return rawClassSubjects.filter((cs) => cs.classId === classId);
}

export function getClasses(): SchoolClass[] {
  const active = rawEnrollments.filter(
    (e) => e.status === 'ACTIVE' && e.academicYear === ACADEMIC_YEAR
  );
  return rawClasses.map((c, ci) => {
    const classTeacher = teachers[ci];
    return {
      id: c.id,
      name: c.name,
      section: c.section,
      academicYear: ACADEMIC_YEAR,
      room: c.room,
      classTeacher: { id: classTeacher.id, name: classTeacher.name },
      subjects: getClassSubjects(c.id),
      studentCount: active.filter((e) => e.classId === c.id).length
    };
  });
}

export function getClass(id: string): SchoolClass | undefined {
  return getClasses().find((c) => c.id === id);
}

export function getClassRoster(classId: string): Student[] {
  const ids = rawEnrollments
    .filter((e) => e.classId === classId && e.status === 'ACTIVE' && e.academicYear === ACADEMIC_YEAR)
    .map((e) => e.studentId);
  return getStudents().filter((s) => ids.includes(s.id));
}

export function getClassEnrollments(classId: string, status?: string): Enrollment[] {
  return rawEnrollments
    .filter((e) => e.classId === classId && (!status || e.status === status))
    .sort((a, b) => a.studentName.localeCompare(b.studentName));
}

export function getStudentEnrollments(studentId: string): Enrollment[] {
  return rawEnrollments
    .filter((e) => e.studentId === studentId)
    .sort((a, b) => b.academicYear.localeCompare(a.academicYear));
}

export function getGrades(opts: { classId?: string; subjectId?: string; term?: Term } = {}): Grade[] {
  return rawGrades.filter(
    (g) =>
      (!opts.classId || g.classId === opts.classId) &&
      (!opts.subjectId || g.subjectId === opts.subjectId) &&
      (!opts.term || g.term === opts.term)
  );
}

export function getStudentGrades(studentId: string): Grade[] {
  return rawGrades
    .filter((g) => g.studentId === studentId)
    .sort((a, b) => a.subjectId.localeCompare(b.subjectId) || a.term - b.term);
}

export function getAttendance(opts: { classId?: string; date?: string } = {}): AttendanceRecord[] {
  return rawAttendance.filter(
    (a) => (!opts.classId || a.classId === opts.classId) && (!opts.date || a.date === opts.date)
  );
}

export function getStudentAttendance(studentId: string): AttendanceRecord[] {
  return rawAttendance.filter((a) => a.studentId === studentId);
}

export function getAttendanceDates(): string[] {
  return [...new Set(rawAttendance.map((a) => a.date))].sort().reverse();
}

export function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page, pageSize, totalPages };
}

function attendanceRateFor(records: AttendanceRecord[]): number {
  const presentish = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const absent = records.filter((r) => r.status === 'ABSENT').length;
  const denom = presentish + absent;
  return denom === 0 ? 0 : Math.round((presentish / denom) * 1000) / 10;
}

export function getAdminStats(): AdminStats {
  const students = getStudents();
  const classes = getClasses();
  const cnt = (s: AttendanceStatus) => rawAttendance.filter((a) => a.status === s).length;

  return {
    totals: {
      students: students.length,
      teachers: teachers.length,
      classes: classes.length,
      subjects: subjects.length
    },
    enrollmentByYear: [
      { academicYear: '2022-2023', count: 18 },
      { academicYear: '2023-2024', count: 24 },
      { academicYear: '2024-2025', count: 31 },
      { academicYear: '2025-2026', count: 42 },
      { academicYear: ACADEMIC_YEAR, count: students.length }
    ],
    classSizes: classes.map((c) => ({
      classId: c.id,
      className: `${c.name} ${c.section}`,
      count: c.studentCount
    })),
    gradeDistribution: classes.map((c) => {
      const gs = rawGrades.filter((g) => g.classId === c.id && g.academicYear === ACADEMIC_YEAR);
      const cnt = (lg: LetterGrade) => gs.filter((g) => g.letterGrade === lg).length;
      return {
        className: `${c.name} ${c.section}`,
        'A+': cnt('A+'),
        A: cnt('A'),
        B: cnt('B'),
        C: cnt('C'),
        D: cnt('D'),
        F: cnt('F')
      };
    }),
    attendanceRateOverall: attendanceRateFor(rawAttendance),
    presentRateByClass: classes.map((c) => ({
      className: `${c.name} ${c.section}`,
      rate: attendanceRateFor(rawAttendance.filter((a) => a.classId === c.id))
    })),
    attendanceBreakdown: {
      present: cnt('PRESENT'),
      late: cnt('LATE'),
      absent: cnt('ABSENT'),
      excused: cnt('EXCUSED')
    }
  };
}

export function getTeacherStats(teacherId: string): TeacherStats {
  const myClassIds = rawClasses
    .filter((c) => teachers[rawClasses.indexOf(c)].id === teacherId)
    .map((c) => c.id);
  const classes = getClasses().filter((c) => myClassIds.includes(c.id));
  const subjectIds = rawClassSubjects
    .filter((cs) => cs.teacher!.id === teacherId)
    .map((cs) => cs.subject.id);

  return {
    myClasses: classes.map((c) => ({
      id: c.id,
      name: `${c.name} ${c.section}`,
      studentCount: c.studentCount
    })),
    subjectsTaught: subjects.filter((s) => subjectIds.includes(s.id)),
    gradeDistributionForMyClasses: classes.map((c) => {
      const gs = rawGrades.filter((g) => g.classId === c.id && g.academicYear === ACADEMIC_YEAR);
      const cnt = (lg: LetterGrade) => gs.filter((g) => g.letterGrade === lg).length;
      return {
        className: `${c.name} ${c.section}`,
        'A+': cnt('A+'),
        A: cnt('A'),
        B: cnt('B'),
        C: cnt('C'),
        D: cnt('D'),
        F: cnt('F')
      };
    }),
    attendanceRateByClass: classes.map((c) => ({
      className: `${c.name} ${c.section}`,
      rate: attendanceRateFor(rawAttendance.filter((a) => a.classId === c.id))
    })),
    averageStudentCount: classes.length
      ? Math.round(classes.reduce((sum, c) => sum + c.studentCount, 0) / classes.length)
      : 0
  };
}

export function getStudentStats(studentId: string): StudentStats {
  const student = getStudent(studentId)!;
  const grades = getStudentGrades(studentId);
  const attendance = getStudentAttendance(studentId);

  const subjectSummary = subjects.map((s) => {
    const sg = grades.filter((g) => g.subjectId === s.id);
    if (sg.length === 0) {
      return { subjectId: s.id, subjectName: s.name, letterGrade: null as LetterGrade | null, average: null as number | null };
    }
    const avg = Math.round((sg.reduce((sum, g) => sum + g.score, 0) / sg.length) * 10) / 10;
    return { subjectId: s.id, subjectName: s.name, letterGrade: letterFor(Math.round(avg)) as LetterGrade, average: avg };
  });

  const byMonth = new Map<string, AttendanceRecord[]>();
  for (const record of attendance) {
    const key = record.date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(record);
  }
  const monthName = (k: string) => {
    const [, m] = k.split('-').map(Number);
    return new Date(2000, m - 1).toLocaleString('en-US', { month: 'short' });
  };

  const counter = (s: AttendanceStatus) => attendance.filter((a) => a.status === s).length;

  return {
    currentClass: student.currentClass,
    subjects: subjectSummary,
    attendance: {
      present: counter('PRESENT'),
      absent: counter('ABSENT'),
      late: counter('LATE'),
      excused: counter('EXCUSED'),
      rate: attendanceRateFor(attendance)
    },
    attendanceByMonth: [...byMonth.keys()].map((k) => ({
      month: monthName(k),
      rate: attendanceRateFor(byMonth.get(k)!)
    })),
    profile: {
      name: student.name,
      admissionNo: student.admissionNo,
      guardian: student.guardianName ?? '—',
      sessionsAttended: counter('PRESENT') + counter('LATE')
    }
  };
}