import crypto from "crypto"

export interface CloudinarySignedParams {
  signature: string
  timestamp: number
  apiKey: string
  cloudName: string
  folder: string
  publicId: string
  overwrite: boolean
  invalidate: boolean
}

export function generateCloudinarySignature(options: {
  userId: string
  folder?: string
}): CloudinarySignedParams {
  const folder = options.folder || "school_os/avatars"
  const publicId = `avatar_${options.userId}`

  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary credentials missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment."
    )
  }

  const timestamp = Math.round(new Date().getTime() / 1000)

  // Cloudinary requires alphabetically sorted query parameters for signing
  // Both overwrite and invalidate ensure replacing previous assets in-place and purging CDN caches
  const paramsToSign: Record<string, string | number> = {
    folder,
    invalidate: "true",
    overwrite: "true",
    public_id: publicId,
    timestamp
  }

  const sortedKeys = Object.keys(paramsToSign).sort()
  const stringToSign =
    sortedKeys.map((key) => `${key}=${paramsToSign[key]}`).join("&") + apiSecret

  const signature = crypto.createHash("sha1").update(stringToSign).digest("hex")

  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
    publicId,
    overwrite: true,
    invalidate: true
  }
}

export async function deleteCloudinaryAvatar(userId: string, folder = "school_os/avatars"): Promise<void> {
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return
  }

  const fullPublicId = `${folder}/avatar_${userId}`
  const timestamp = Math.round(new Date().getTime() / 1000)

  const paramsToSign: Record<string, string | number> = {
    invalidate: "true",
    public_id: fullPublicId,
    timestamp
  }

  const sortedKeys = Object.keys(paramsToSign).sort()
  const stringToSign =
    sortedKeys.map((key) => `${key}=${paramsToSign[key]}`).join("&") + apiSecret

  const signature = crypto.createHash("sha1").update(stringToSign).digest("hex")

  try {
    const formData = new URLSearchParams()
    formData.append("public_id", fullPublicId)
    formData.append("api_key", apiKey)
    formData.append("timestamp", String(timestamp))
    formData.append("signature", signature)
    formData.append("invalidate", "true")

    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: formData
    })
  } catch (err) {
    console.error("Failed to destroy previous Cloudinary avatar asset:", err)
  }
}
