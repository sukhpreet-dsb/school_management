"use client"

import * as React from "react"
import { Camera, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { CloudinarySignedParams } from "@/server/cloudinary"

interface AvatarUploadProps {
  currentImageUrl: string | null
  name: string
  onImageChange: (url: string | null) => Promise<void>
  disabled?: boolean
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function AvatarUpload({
  currentImageUrl,
  name,
  onImageChange,
  disabled
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input value so re-selecting same file triggers onChange
    e.target.value = ""

    // Validate type and size
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPG, PNG, WebP, or GIF).")
      return
    }

    const maxSizeInBytes = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSizeInBytes) {
      toast.error("Image size must be less than 5MB.")
      return
    }

    try {
      setIsUploading(true)

      // Step 1: Request Cloudinary pre-signed upload parameters from our API
      const signRes = await fetch("/api/upload/sign", {
        method: "POST"
      })

      if (!signRes.ok) {
        const errorData = await signRes.json().catch(() => ({}))
        throw new Error(errorData.error?.message || "Failed to generate upload signature.")
      }

      const signData = await signRes.json()
      const { signature, timestamp, apiKey, cloudName, folder, publicId } =
        signData as CloudinarySignedParams

      // Step 2: Directly upload to Cloudinary via multipart form data with deterministic user public_id & overwrite
      const formData = new FormData()
      formData.append("file", file)
      formData.append("api_key", apiKey)
      formData.append("timestamp", String(timestamp))
      formData.append("signature", signature)
      formData.append("folder", folder)
      if (publicId) {
        formData.append("public_id", publicId)
        formData.append("overwrite", "true")
        formData.append("invalidate", "true")
      }

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData
        }
      )

      if (!uploadRes.ok) {
        const cloudinaryErr = await uploadRes.json().catch(() => ({}))
        throw new Error(
          cloudinaryErr.error?.message || "Failed to upload image to Cloudinary."
        )
      }

      const uploadData = await uploadRes.json()
      const secureUrl = uploadData.secure_url as string

      // Step 3: Update user's profile with new image URL
      await onImageChange(secureUrl)
      toast.success("Profile photo updated successfully.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo.")
    } finally {
      setIsUploading(false)
    }
  }

  async function handleRemoveImage() {
    try {
      setIsUploading(true)
      await onImageChange(null)
      toast.success("Profile photo removed.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove photo.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative group">
        <Avatar className="size-24 border-2 border-border shadow-sm text-lg">
          {currentImageUrl && (
            <AvatarImage src={currentImageUrl} alt={name} />
          )}
          <AvatarFallback className="text-base font-semibold">
            {initialsOf(name || "User")}
          </AvatarFallback>
        </Avatar>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70 backdrop-blur-xs">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading || disabled}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || disabled}
            className="cursor-pointer gap-1.5"
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {currentImageUrl ? "Change photo" : "Upload photo"}
          </Button>

          {currentImageUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
              disabled={isUploading || disabled}
              className="text-destructive hover:text-destructive cursor-pointer gap-1.5"
            >
              <Trash2 className="size-4" />
              Remove
            </Button>
          )}
        </div>

        <p className="text-muted-foreground text-xs">
          JPG, PNG, WebP or GIF. Max 5MB. Direct pre-signed upload to Cloudinary.
        </p>
      </div>
    </div>
  )
}
