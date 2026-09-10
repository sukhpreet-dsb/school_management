"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { GraduationCap, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { NAV, type NavItem } from "@/mock/nav"
import type { UserRole } from "@/types/domain"
import { Sheet } from "@/components/ui/sheet"

function SidebarHeader({ collapsed }: { collapsed?: boolean }) {
  return (
    <div
      className={cn(
        "border-sidebar-border/50 flex h-16 shrink-0 items-center border-b px-3 transition-all",
        collapsed ? "justify-center px-0" : "px-4"
      )}
    >
      <Link
        href="#"
        className={cn(
          "flex items-center gap-2.5",
          collapsed && "justify-center"
        )}
      >
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-xl shadow-sm">
          <GraduationCap className="size-5" />
        </div>
        {!collapsed && (
          <span className="text-sidebar-foreground text-sm font-semibold tracking-tight">
            School OS
          </span>
        )}
      </Link>
    </div>
  )
}

function NavLink({
  item,
  collapsed,
  onClick
}: {
  item: NavItem
  collapsed?: boolean
  onClick?: () => void
}) {
  const pathname = usePathname()
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active && "bg-sidebar-accent text-sidebar-accent-foreground shadow-xs font-semibold",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? item.title : undefined}
    >
      <Icon className="size-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </Link>
  )
}

export function SidebarNav({
  role,
  collapsed,
  onNavigate
}: {
  role: UserRole
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const items = NAV[role]
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
      {items.map((item) => (
        <NavLink key={item.href} item={item} collapsed={collapsed} onClick={onNavigate} />
      ))}
    </nav>
  )
}

export function Sidebar({
  role,
  collapsed
}: {
  role: UserRole
  collapsed: boolean
}) {
  return (
    <aside
      data-slot="sidebar"
      className={cn(
        "bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-40 hidden flex-col border-r transition-[width] duration-200 lg:flex",
        collapsed ? "w-[4.6rem]" : "w-64"
      )}
    >
      <SidebarHeader collapsed={collapsed} />
      <SidebarNav role={role} collapsed={collapsed} />
    </aside>
  )
}

export function MobileSidebar({
  role,
  open,
  onOpenChange
}: {
  role: UserRole
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet
      side="left"
      open={open}
      onOpenChange={onOpenChange}
      showClose={false}
      className="bg-sidebar text-sidebar-foreground w-72 sm:w-80 p-0"
    >
      <div className="border-sidebar-border/50 flex h-16 items-center justify-between border-b px-4">
        <Link href="#" className="flex items-center gap-2.5">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-xl">
            <GraduationCap className="size-5" />
          </div>
          <span className="text-sidebar-foreground text-sm font-semibold tracking-tight">
            School OS
          </span>
        </Link>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors"
          aria-label="Close sidebar"
        >
          <X className="size-4" />
        </button>
      </div>
      <SidebarNav role={role} onNavigate={() => onOpenChange(false)} />
    </Sheet>
  )
}