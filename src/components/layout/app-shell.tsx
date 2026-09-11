"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import type { UserRole } from "@/types/domain"
import { MobileSidebar, Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export function AppShell({
  role,
  user,
  children
}: {
  role: UserRole
  user: { name: string; email: string; role: UserRole; image?: string | null }
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleToggleSidebar = React.useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileOpen((prev) => !prev)
    } else {
      setCollapsed((prev) => !prev)
    }
  }, [])

  return (
    <div className="bg-muted/40 min-h-svh">
      <Sidebar role={role} collapsed={collapsed} />
      <MobileSidebar role={role} open={mobileOpen} onOpenChange={setMobileOpen} />

      <div
        className={cn(
          "flex min-h-svh flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-[4.6rem]" : "lg:pl-64"
        )}
      >
        <Header role={role} user={user} onMenuClick={handleToggleSidebar} />
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}