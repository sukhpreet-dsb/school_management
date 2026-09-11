import { handleApiRoute, requireApiRole } from "@/server/api-auth"
import { generateCloudinarySignature } from "@/server/cloudinary"

export async function POST() {
  return handleApiRoute(async () => {
    // Accessible by any authenticated user (admin, teacher, student)
    const session = await requireApiRole("admin", "teacher", "student")

    const signedParams = generateCloudinarySignature({
      userId: session.user.id,
      folder: "school_os/avatars"
    })
    return { data: signedParams }
  })
}
