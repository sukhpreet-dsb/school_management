import { NextRequest } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { apiError, handleApiRoute, requireApiRole } from "@/server/api-auth"
import type { AuthUser } from "@/types/domain"
import { normalizeRole } from "@/lib/roles"

const updateTeacherSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  designation: z.string().trim().max(100).nullable().optional(),
  empCode: z.string().trim().max(20).optional(),
  hireDate: z.string().trim().nullable().optional()
})

function toAuthUser(user: {
  id: string
  name: string
  email: string
  role?: string | string[]
  image?: string | null
  emailVerified?: boolean
  banned?: boolean | null
  createdAt?: Date | string
  teacherProfile?: {
    empCode: string
    phone: string | null
    hireDate: Date | null
    designation: string | null
    _count?: { classes: number }
    subjects?: Array<{ subject: { id: string; name: string; code: string } }>
  } | null
}): AuthUser {
  const role = Array.isArray(user.role) ? user.role[0] : user.role
  const normalized = normalizeRole(role)
  const teacherSubjects = user.teacherProfile?.subjects?.map((ts) => ts.subject)

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalized,
    image: user.image ?? null,
    emailVerified: user.emailVerified ?? false,
    banned: user.banned ?? false,
    createdAt: new Date(user.createdAt ?? Date.now()).toISOString(),
    subjects: teacherSubjects,
    profile: user.teacherProfile
      ? {
          empCode: user.teacherProfile.empCode,
          phone: user.teacherProfile.phone,
          hireDate: user.teacherProfile.hireDate?.toISOString() ?? null,
          designation: user.teacherProfile.designation,
          classCount: user.teacherProfile._count?.classes ?? 0,
          subjects: teacherSubjects
        }
      : undefined,
    classCount: user.teacherProfile?._count?.classes ?? 0
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  return handleApiRoute<AuthUser>(async () => {
    await requireApiRole("admin")
    const { userId } = await params

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teacherProfile: true
      }
    })

    if (!existingUser || existingUser.role !== "teacher") {
      throw apiError(404, "Teacher not found.")
    }

    let body: z.infer<typeof updateTeacherSchema>
    try {
      body = updateTeacherSchema.parse(await request.json())
    } catch {
      throw apiError(422, "Invalid request body.")
    }

    // Check empCode uniqueness if changed
    if (
      body.empCode &&
      body.empCode !== existingUser.teacherProfile?.empCode
    ) {
      const duplicateEmpCode = await prisma.teacher.findUnique({
        where: { empCode: body.empCode }
      })
      if (duplicateEmpCode) {
        throw apiError(409, "Employee code is already in use by another teacher.")
      }
    }

    // 1. Update user table if name provided
    if (body.name !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: body.name }
      })
    }

    // 2. Update teacher profile
    const teacherData: Record<string, unknown> = {}
    if (body.empCode !== undefined && body.empCode.trim()) {
      teacherData.empCode = body.empCode.trim()
    }
    if (body.phone !== undefined) {
      teacherData.phone = body.phone?.trim() || null
    }
    if (body.designation !== undefined) {
      teacherData.designation = body.designation?.trim() || null
    }
    if (body.hireDate !== undefined) {
      teacherData.hireDate = body.hireDate ? new Date(body.hireDate) : null
    }

    if (Object.keys(teacherData).length > 0) {
      await prisma.teacher.upsert({
        where: { userId },
        update: teacherData,
        create: {
          userId,
          empCode: body.empCode?.trim() || `TCH-${userId.slice(0, 4)}`,
          phone: body.phone?.trim() || null,
          designation: body.designation?.trim() || null,
          hireDate: body.hireDate ? new Date(body.hireDate) : null
        }
      })
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teacherProfile: {
          include: {
            _count: { select: { classes: true } },
            subjects: {
              include: {
                subject: {
                  select: { id: true, name: true, code: true }
                }
              }
            }
          }
        }
      }
    })

    if (!updatedUser) {
      throw apiError(404, "Teacher not found.")
    }

    return { data: toAuthUser(updatedUser), status: 200 }
  })
}
