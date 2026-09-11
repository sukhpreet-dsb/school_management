import prisma from "@/lib/prisma"
import { apiError } from "@/server/api-auth"
import { deleteCloudinaryAvatar } from "@/server/cloudinary"
import type { UserProfile } from "@/types/domain"

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  return value instanceof Date ? value : new Date(value)
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teacherProfile: {
        include: {
          classes: {
            include: {
              class: true
            }
          },
          subjects: {
            include: {
              subject: true
            }
          }
        }
      },
      studentProfile: {
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              schoolClass: true
            },
            take: 1
          }
        }
      }
    }
  })

  if (!user) {
    throw apiError(404, "User profile not found.")
  }

  const activeEnrollment = user.studentProfile?.enrollments[0]

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role as UserProfile["role"],
    createdAt: user.createdAt.toISOString(),
    teacher: user.teacherProfile
      ? {
          empCode: user.teacherProfile.empCode,
          phone: user.teacherProfile.phone,
          hireDate: user.teacherProfile.hireDate
            ? user.teacherProfile.hireDate.toISOString()
            : null,
          designation: user.teacherProfile.designation,
          classes: user.teacherProfile.classes.map((tc) => ({
            id: tc.class.id,
            name: `Class ${tc.class.grade} ${tc.class.section}`,
            grade: tc.class.grade,
            section: tc.class.section
          })),
          subjects: user.teacherProfile.subjects.map((ts) => ({
            id: ts.subject.id,
            name: ts.subject.name,
            code: ts.subject.code
          }))
        }
      : null,
    student: user.studentProfile
      ? {
          admissionNo: user.studentProfile.admissionNo,
          dob: user.studentProfile.dob ? user.studentProfile.dob.toISOString() : null,
          gender: user.studentProfile.gender,
          address: user.studentProfile.address,
          guardianName: user.studentProfile.guardianName,
          guardianPhone: user.studentProfile.guardianPhone,
          currentClass: activeEnrollment?.schoolClass
            ? {
                id: activeEnrollment.schoolClass.id,
                name: `Class ${activeEnrollment.schoolClass.grade} ${activeEnrollment.schoolClass.section}`,
                section: activeEnrollment.schoolClass.section,
                academicYear: activeEnrollment.schoolClass.academicYear
              }
            : null,
          enrollmentStatus: activeEnrollment?.status ?? null
        }
      : null
  }
}

export interface UpdateProfileInput {
  name?: string
  image?: string | null
  phone?: string | null
  dob?: string | Date | null
  gender?: "MALE" | "FEMALE" | "OTHER" | null
  address?: string | null
  guardianName?: string | null
  guardianPhone?: string | null
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UserProfile> {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teacherProfile: true,
      studentProfile: true
    }
  })

  if (!existingUser) {
    throw apiError(404, "User not found.")
  }

  // Update base user properties
  const userUpdates: Record<string, unknown> = {}
  if (input.name !== undefined) userUpdates.name = input.name.trim()
  if (input.image !== undefined) {
    userUpdates.image = input.image
    if (input.image === null && existingUser.image) {
      // Clean up Cloudinary asset
      deleteCloudinaryAvatar(userId).catch(() => {})
    }
  }

  if (Object.keys(userUpdates).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: userUpdates
    })
  }

  // Update teacher-specific profile
  if (existingUser.role === "teacher" && existingUser.teacherProfile) {
    const teacherUpdates: Record<string, unknown> = {}
    if (input.phone !== undefined) teacherUpdates.phone = input.phone?.trim() || null

    if (Object.keys(teacherUpdates).length > 0) {
      await prisma.teacher.update({
        where: { userId },
        data: teacherUpdates
      })
    }
  }

  // Update student-specific profile
  if (existingUser.role === "student" && existingUser.studentProfile) {
    const studentUpdates: Record<string, unknown> = {}
    if (input.dob !== undefined) studentUpdates.dob = toDate(input.dob)
    if (input.gender !== undefined) studentUpdates.gender = input.gender
    if (input.address !== undefined) studentUpdates.address = input.address?.trim() || null
    if (input.guardianName !== undefined)
      studentUpdates.guardianName = input.guardianName?.trim() || null
    if (input.guardianPhone !== undefined)
      studentUpdates.guardianPhone = input.guardianPhone?.trim() || null

    if (Object.keys(studentUpdates).length > 0) {
      await prisma.student.update({
        where: { userId },
        data: studentUpdates
      })
    }
  }

  return getUserProfile(userId)
}
