import prisma from '@/lib/prisma';

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export async function isEmpCodeAvailable(code: string): Promise<boolean> {
  return !(await prisma.teacher.findUnique({ where: { empCode: code } }));
}

export async function isAdmissionNoAvailable(code: string): Promise<boolean> {
  return !(await prisma.student.findUnique({ where: { admissionNo: code } }));
}

export async function nextEmpCode(): Promise<string> {
  const rows = await prisma.teacher.findMany({ select: { empCode: true } });
  const used = new Set<number>();
  for (const { empCode } of rows) {
    const match = /^TCH-(\d+)$/i.exec(empCode);
    if (match) used.add(Number(match[1]));
  }

  let n = 1;
  while (used.has(n)) n++;
  return `TCH-${pad(n, 3)}`;
}

export async function nextAdmissionNo(): Promise<string> {
  const rows = await prisma.student.findMany({ select: { admissionNo: true } });
  const used = new Set<number>();
  for (const { admissionNo } of rows) {
    const match = /^S(\d+)$/i.exec(admissionNo);
    if (match) used.add(Number(match[1]));
  }

  let n = 1001;
  while (used.has(n)) n++;
  return `S${n}`;
}

export async function ensureTeacherProfile(input: {
  userId: string;
  empCode?: string;
  phone?: string | null;
  hireDate?: Date | string | null;
  designation?: string | null;
}): Promise<void> {
  const empCode = input.empCode?.trim() || (await nextEmpCode());

  await prisma.teacher.upsert({
    where: { userId: input.userId },
    update: {
      ...(input.empCode?.trim() ? { empCode: input.empCode.trim() } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.hireDate !== undefined ? { hireDate: toDate(input.hireDate) } : {}),
      ...(input.designation !== undefined ? { designation: input.designation } : {})
    },
    create: {
      userId: input.userId,
      empCode,
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.hireDate !== undefined ? { hireDate: toDate(input.hireDate) } : {}),
      ...(input.designation !== undefined ? { designation: input.designation } : {})
    }
  });
}

export async function ensureStudentProfile(input: {
  userId: string;
  admissionNo?: string;
  dob?: Date | string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  address?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
}): Promise<void> {
  const admissionNo = input.admissionNo?.trim() || (await nextAdmissionNo());

  const fields = {
    ...(input.admissionNo?.trim() ? { admissionNo: input.admissionNo.trim() } : {}),
    ...(input.dob !== undefined ? { dob: toDate(input.dob) } : {}),
    ...(input.gender !== undefined ? { gender: input.gender } : {}),
    ...(input.address !== undefined ? { address: input.address } : {}),
    ...(input.guardianName !== undefined ? { guardianName: input.guardianName } : {}),
    ...(input.guardianPhone !== undefined ? { guardianPhone: input.guardianPhone } : {})
  };

  await prisma.student.upsert({
    where: { userId: input.userId },
    update: fields,
    create: {
      userId: input.userId,
      admissionNo,
      ...fields
    }
  });
}