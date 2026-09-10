"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, LogOut, Menu, UserRound } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { NAV, roleHomePath } from "@/mock/nav"
import { ROLE_LABELS } from "@/lib/roles"
import type { UserRole } from "@/types/domain"
import { authClient } from "@/lib/auth-client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/layout/theme-toggle"

const NOTIFICATIONS = [
  { id: 1, title: "New enrollment request", time: "2m ago", unread: true },
  { id: 2, title: "Attendance marked for Class 5 A", time: "1h ago", unread: true },
  { id: 3, title: "Grades published for Term 1", time: "1d ago", unread: false }
]

function pageTitle(role: UserRole, pathname: string): string {
  const item = NAV[role].find(
    (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`)
  )
  if (item) return item.title
  const segment = pathname.split("/").filter(Boolean).pop()
  if (!segment) return "Dashboard"
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
}

function Notifications() {
  return (
    <DropdownMenu
      align="end"
      trigger={
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
          <span className="bg-destructive absolute top-1.5 right-1.5 size-2 rounded-full" />
        </Button>
      }
    >
      <DropdownMenuLabel className="text-sm font-semibold">Notifications</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <div className="flex flex-col gap-0.5 py-0.5">
        {NOTIFICATIONS.map((notification) => (
          <div
            key={notification.id}
            className="flex w-72 items-start justify-between gap-2 rounded-xl px-2 py-1.5"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm">{notification.title}</span>
              <span className="text-muted-foreground text-xs">{notification.time}</span>
            </div>
            {notification.unread && <span className="bg-primary mt-1.5 size-1.5 rounded-full" />}
          </div>
        ))}
      </div>
    </DropdownMenu>
  )
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

function UserMenu({ user }: { user: { name: string; email: string; role: UserRole } }) {
  const router = useRouter()

  async function handleLogout() {
    const { error } = await authClient.signOut()
    if (error) {
      toast.error(error.message ?? "Failed to sign out.")
      return
    }
    toast.success("Signed out.")
    router.push("/login")
    router.refresh()
  }

  return (
    <DropdownMenu
      align="end"
      trigger={
        <button
          type="button"
          aria-label="Account menu"
          className="hover:bg-muted flex items-center gap-2.5 rounded-2xl p-1 transition-colors"
        >
          <Avatar size="sm">
            <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
          </Avatar>
        </button>
      }
    >
      <DropdownMenuLabel>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{user.name}</span>
          <span className="text-muted-foreground text-xs">{user.email}</span>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem icon={<UserRound />}>
        <Link href={roleHomePath(user.role)} className="flex-1">
          Profile
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem icon={<LogOut />} data-destructive="true" onClick={handleLogout} className="data-[destructive]:text-destructive">
        Sign out
      </DropdownMenuItem>
    </DropdownMenu>
  )
}

export function Header({
  role,
  user,
  onMenuClick
}: {
  role: UserRole
  user: { name: string; email: string; role: UserRole }
  onMenuClick: () => void
}) {
  const pathname = usePathname()
  const title = pageTitle(role, pathname)

  return (
    <header
      data-slot="app-header"
      className="border-border bg-background/80 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur md:px-6"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-label="Toggle sidebar"
        className="cursor-pointer"
      >
        <Menu className="size-4.5" />
      </Button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <span className={cn("hidden md:inline-flex")}>
          <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
        </span>
        <Notifications />
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  )
}