"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { useProfile } from "@/lib/queries"
import { PageHeader } from "@/components/layout/page-header"
import { ProfileInfoForm } from "@/components/profile/profile-info-form"
import { ChangePasswordForm } from "@/components/profile/change-password-form"

export function ProfilePageView({
  title = "My Profile",
  description = "Manage your personal account settings, profile photo, and security."
}: {
  title?: string
  description?: string
}) {
  const { data: profile, isLoading, error } = useProfile()

  if (isLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-destructive font-medium">Failed to load profile.</p>
        <p className="text-muted-foreground text-sm mt-1">
          {error instanceof Error ? error.message : "Please refresh the page."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <PageHeader title={title} description={description} />
      <ProfileInfoForm profile={profile} />
      <ChangePasswordForm />
    </div>
  )
}
