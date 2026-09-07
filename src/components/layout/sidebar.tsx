"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { GraduationCap, PanelLeftClose, PanelLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { NAV, type NavItem } from "@/mock/nav"
import type { UserRole } from "@/types/domain"
import { Sheet } from "@/components/ui/sheet"

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link
      href="#"
      className={cn(
        "flex h-12 items-center gap-2.5 px-3",
        collapsed && "justify-center px-0"
      )}
    >
      <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-xl">
        <GraduationCap className="size-5" />
      </div>
      {!collapsed && (
        <span className="text-sidebar-foreground text-sm font-semibold tracking-tight">
          School OS
        </span>
      )}
    </Link>
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
        "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
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
  collapsed,
  onToggle
}: {
  role: UserRole
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <aside
      data-slot="sidebar"
      className={cn(
        "bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-40 hidden flex-col border-r transition-[width] duration-200 lg:flex",
        collapsed ? "w-[4.6rem]" : "w-64"
      )}
    >
      <Brand collapsed={collapsed} />
      <SidebarNav role={role} collapsed={collapsed} />
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
          collapsed && "justify-center px-2"
        )}
      >
        {collapsed ? <PanelLeft className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
        {!collapsed && <span>Collapse</span>}
      </button>
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
      className="bg-sidebar text-sidebar-foreground w-72 sm:w-80"
    >
      <Brand />
      <SidebarNav role={role} onNavigate={() => onOpenChange(false)} />
    </Sheet>
  )
}