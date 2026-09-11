import { z } from "zod"
import { handleApiRoute, requireApiRole } from "@/server/api-auth"
import { getUserProfile, updateUserProfile } from "@/server/profile"

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty.").max(100).optional(),
  image: z.string().url("Invalid image URL.").nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  dob: z.string().nullable().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  guardianName: z.string().max(100).nullable().optional(),
  guardianPhone: z.string().max(20).nullable().optional()
})

export async function GET() {
  return handleApiRoute(async () => {
    const session = await requireApiRole("admin", "teacher", "student")
    const profile = await getUserProfile(session.user.id)
    return { data: profile }
  })
}

export async function PATCH(req: Request) {
  return handleApiRoute(async () => {
    const session = await requireApiRole("admin", "teacher", "student")
    const body = await req.json()
    const parsed = updateProfileSchema.parse(body)
    const updated = await updateUserProfile(session.user.id, parsed)
    return { data: updated }
  })
}
