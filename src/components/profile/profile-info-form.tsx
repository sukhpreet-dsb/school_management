"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  BookOpen,
  Building,
  Calendar,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  School,
  ShieldCheck,
  User
} from "lucide-react"
import { toast } from "sonner"

import { ROLE_LABELS } from "@/lib/roles"
import { useUpdateProfile } from "@/lib/queries"
import type { UserProfile } from "@/types/domain"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  phone: z.string().max(20).optional(),
  dob: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  address: z.string().max(300).optional(),
  guardianName: z.string().max(100).optional(),
  guardianPhone: z.string().max(20).optional()
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileInfoForm({ profile }: { profile: UserProfile }) {
  const updateProfile = useUpdateProfile()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile.name || "",
      phone: profile.teacher?.phone || "",
      dob: profile.student?.dob ? profile.student.dob.slice(0, 10) : "",
      gender: profile.student?.gender || undefined,
      address: profile.student?.address || "",
      guardianName: profile.student?.guardianName || "",
      guardianPhone: profile.student?.guardianPhone || ""
    }
  })

  // Synchronize form values if profile changes externally
  React.useEffect(() => {
    setValue("name", profile.name || "")
    if (profile.teacher) {
      setValue("phone", profile.teacher.phone || "")
    }
    if (profile.student) {
      setValue("dob", profile.student.dob ? profile.student.dob.slice(0, 10) : "")
      setValue("gender", profile.student.gender || undefined)
      setValue("address", profile.student.address || "")
      setValue("guardianName", profile.student.guardianName || "")
      setValue("guardianPhone", profile.student.guardianPhone || "")
    }
  }, [profile, setValue])

  async function handleAvatarChange(url: string | null) {
    await updateProfile.mutateAsync({ image: url })
  }

  async function onSubmit(values: ProfileFormValues) {
    try {
      await updateProfile.mutateAsync({
        name: values.name,
        ...(profile.role === "teacher" ? { phone: values.phone || null } : {}),
        ...(profile.role === "student"
          ? {
              dob: values.dob || null,
              gender: values.gender || null,
              address: values.address || null,
              guardianName: values.guardianName || null,
              guardianPhone: values.guardianPhone || null
            }
          : {})
      })
      toast.success("Profile details updated successfully.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Profile Photo & Core Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="size-5 text-primary" />
              <CardTitle className="text-base font-semibold">Profile Photo</CardTitle>
            </div>
            <Badge variant="secondary" className="font-medium">
              {ROLE_LABELS[profile.role]}
            </Badge>
          </div>
          <CardDescription>
            Your avatar is displayed in the navigation bar and across school directories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            currentImageUrl={profile.image}
            name={profile.name}
            onImageChange={handleAvatarChange}
            disabled={updateProfile.isPending}
          />
        </CardContent>
      </Card>

      {/* 2. Personal Information Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <CardTitle className="text-base font-semibold">Personal Information</CardTitle>
          </div>
          <CardDescription>
            Update your personal details below. Contact school administration if you need to update read-only institution records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Full Name (Editable) */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  {...register("name")}
                  disabled={updateProfile.isPending}
                />
                {errors.name && (
                  <p className="text-destructive text-xs font-medium">{errors.name.message}</p>
                )}
              </div>

              {/* Email Address (Read-Only) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email">Email Address</Label>
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Lock className="size-3" /> Read-only
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="email"
                    value={profile.email}
                    readOnly
                    disabled
                    className="bg-muted/50 cursor-not-allowed pr-8"
                  />
                  <Mail className="text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 size-4" />
                </div>
              </div>

              {/* Teacher-specific field: Phone */}
              {profile.role === "teacher" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1 555-0199"
                    {...register("phone")}
                    disabled={updateProfile.isPending}
                  />
                  {errors.phone && (
                    <p className="text-destructive text-xs font-medium">{errors.phone.message}</p>
                  )}
                </div>
              )}

              {/* Student-specific fields: DOB, Gender */}
              {profile.role === "student" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      {...register("dob")}
                      disabled={updateProfile.isPending}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      id="gender"
                      {...register("gender")}
                      disabled={updateProfile.isPending}
                      defaultValue={profile.student?.gender || ""}
                    >
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {/* Student-specific fields: Address, Guardian info */}
            {profile.role === "student" && (
              <div className="flex flex-col gap-4 border-t pt-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="address">Residential Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter residential address"
                    rows={2}
                    {...register("address")}
                    disabled={updateProfile.isPending}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="guardianName">Guardian / Parent Name</Label>
                    <Input
                      id="guardianName"
                      placeholder="e.g. John Doe"
                      {...register("guardianName")}
                      disabled={updateProfile.isPending}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="guardianPhone">Guardian Phone</Label>
                    <Input
                      id="guardianPhone"
                      placeholder="+1 555-0123"
                      {...register("guardianPhone")}
                      disabled={updateProfile.isPending}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={!isDirty || updateProfile.isPending}
                className="cursor-pointer"
              >
                {updateProfile.isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. Role-specific Read-Only Academic / Institutional Information */}
      {profile.role === "teacher" && profile.teacher && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="size-5 text-primary" />
              <CardTitle className="text-base font-semibold">Teacher Institution Details</CardTitle>
            </div>
            <CardDescription>
              Official faculty information managed by school administrators.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border p-3 bg-muted/20">
                <span className="text-muted-foreground text-xs">Employee Code</span>
                <p className="font-semibold text-sm mt-0.5">{profile.teacher.empCode || "—"}</p>
              </div>

              <div className="rounded-xl border p-3 bg-muted/20">
                <span className="text-muted-foreground text-xs">Designation</span>
                <p className="font-semibold text-sm mt-0.5">{profile.teacher.designation || "Faculty"}</p>
              </div>

              <div className="rounded-xl border p-3 bg-muted/20">
                <span className="text-muted-foreground text-xs">Hire Date</span>
                <p className="font-semibold text-sm mt-0.5">
                  {profile.teacher.hireDate
                    ? new Date(profile.teacher.hireDate).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>

            {/* Assigned Classes */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <School className="size-3.5" /> Assigned Classes
              </span>
              {profile.teacher.classes && profile.teacher.classes.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.teacher.classes.map((cls) => (
                    <Badge key={cls.id} variant="outline" className="px-2.5 py-1">
                      {cls.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs italic">No classes assigned yet.</p>
              )}
            </div>

            {/* Assigned Subjects */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="size-3.5" /> Qualified Subjects
              </span>
              {profile.teacher.subjects && profile.teacher.subjects.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.teacher.subjects.map((sub) => (
                    <Badge key={sub.id} variant="secondary" className="px-2.5 py-1">
                      {sub.name} ({sub.code})
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs italic">No subjects assigned yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {profile.role === "student" && profile.student && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              <CardTitle className="text-base font-semibold">Academic & Enrollment Status</CardTitle>
            </div>
            <CardDescription>
              Enrolled class and school registration details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border p-3 bg-muted/20">
                <span className="text-muted-foreground text-xs">Admission Number</span>
                <p className="font-semibold text-sm mt-0.5">{profile.student.admissionNo}</p>
              </div>

              <div className="rounded-xl border p-3 bg-muted/20">
                <span className="text-muted-foreground text-xs">Current Class</span>
                <p className="font-semibold text-sm mt-0.5">
                  {profile.student.currentClass
                    ? `${profile.student.currentClass.name} (${profile.student.currentClass.academicYear})`
                    : "Not assigned"}
                </p>
              </div>

              <div className="rounded-xl border p-3 bg-muted/20">
                <span className="text-muted-foreground text-xs">Status</span>
                <p className="font-semibold text-sm mt-0.5">
                  <Badge variant="secondary" className="capitalize">
                    {profile.student.enrollmentStatus?.toLowerCase() || "Active"}
                  </Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {profile.role === "admin" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              <CardTitle className="text-base font-semibold">Account Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border p-3 bg-muted/20">
                <span className="text-muted-foreground text-xs">Account Role</span>
                <p className="font-semibold text-sm mt-0.5">System Administrator</p>
              </div>
              <div className="rounded-xl border p-3 bg-muted/20">
                <span className="text-muted-foreground text-xs">Member Since</span>
                <p className="font-semibold text-sm mt-0.5">
                  {new Date(profile.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
