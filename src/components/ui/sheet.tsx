"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SheetProps extends React.ComponentProps<"div"> {
  /** Clickable element that opens the sheet (uncontrolled mode). */
  trigger?: React.ReactNode
  /** Controlled visibility. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  side?: "left" | "right"
  showClose?: boolean
}

function Sheet({
  trigger,
  open: openProp,
  onOpenChange,
  side = "right",
  showClose = true,
  className,
  children,
  ...props
}: SheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = openProp ?? internalOpen

  function setOpen(value: boolean) {
    if (openProp === undefined) {
      setInternalOpen(value)
    }
    onOpenChange?.(value)
  }

  return (
    <>
      {trigger && (
        <div
          role="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={(event) => {
            event.stopPropagation()
            setOpen(true)
          }}
        >
          {trigger}
        </div>
      )}
      {open && (
        <div data-slot="sheet" className="fixed inset-0 z-50">
          <div
            data-slot="sheet-overlay"
            className="bg-black/50 fixed inset-0 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <div
            data-slot="sheet-content"
            className={cn(
              "bg-card text-card-foreground fixed flex h-full w-full max-w-md flex-col gap-4 border-l p-4 shadow-xl transition-transform sm:max-w-sm",
              side === "left"
                ? "left-0 origin-left rounded-r-2xl border-r"
                : "right-0 origin-right rounded-l-2xl border-l",
            className
            )}
            role="dialog"
            aria-modal="true"
            {...props}
          >
            {showClose && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:bg-muted flex size-7 items-center justify-center rounded-xl transition-colors"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
            )}
            {children}
          </div>
        </div>
      )}
    </>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-title"
      className={cn("font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex items-center justify-end gap-2", className)}
      {...props}
    />
  )
}

export { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetFooter }