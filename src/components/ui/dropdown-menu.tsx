"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type Align = "start" | "end"

interface DropdownMenuProps extends React.ComponentProps<"div"> {
  trigger: React.ReactNode
  align?: Align
  /** Close the menu when an item is clicked. */
  closeOnSelect?: boolean
}

function DropdownMenu({
  trigger,
  align = "end",
  closeOnSelect = true,
  className,
  children,
  ...props
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onClickOutside)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  function handleSelect() {
    if (closeOnSelect) {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative inline-flex" {...props}>
      <div
        role="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((value) => !value)
        }}
      >
        {trigger}
      </div>
      {open && (
        <div
          role="menu"
          className={cn(
            "bg-popover text-popover-foreground border-border data-[align=start]:origin-top-left data-[align=end]:origin-top-right focus:outline-none absolute top-full z-50 mt-1 min-w-44 max-w-xs origin-top rounded-2xl border p-1 shadow-md",
            align === "end" ? "right-0" : "left-0",
            className
          )}
          data-align={align}
        >
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<{ onSelect?: () => void }>, {
                  onSelect: handleSelect
                })
              : child
          )}
        </div>
      )}
    </div>
  )
}

interface DropdownMenuItemProps extends React.ComponentProps<"button"> {
  icon?: React.ReactNode
  onSelect?: () => void
}

function DropdownMenuItem({
  className,
  icon,
  onSelect,
  children,
  ...props
}: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      data-slot="dropdown-menu-item"
      onClick={(event) => {
        event.stopPropagation()
        props.onClick?.(event)
        onSelect?.()
      }}
      className={cn(
        "text-sm flex w-full cursor-default select-none items-center gap-2 rounded-xl px-2 py-1.5 text-left outline-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        "data-[destructive]:text-destructive",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

function DropdownMenuLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-label"
      className={cn("px-2 py-1.5 text-sm font-medium", className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-separator"
      role="separator"
      className={cn("bg-muted-foreground/10 -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

export { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator }