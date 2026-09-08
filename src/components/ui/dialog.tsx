"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface DialogProps extends React.ComponentProps<"div"> {
  /** Clickable element that opens the dialog (uncontrolled mode). */
  trigger?: React.ReactNode
  /** Controlled visibility. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showClose?: boolean
}

function Dialog({
  trigger,
  open: openProp,
  onOpenChange,
  showClose = true,
  className,
  children,
  ...props
}: DialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = openProp ?? internalOpen

  function setOpen(value: boolean) {
    if (openProp === undefined) {
      setInternalOpen(value)
    }
    onOpenChange?.(value)
  }

  React.useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setInternalOpen(false)
        onOpenChange?.(false)
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, openProp, onOpenChange])

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
        <div data-slot="dialog" className="fixed inset-0 z-50">
          <div
            data-slot="dialog-overlay"
            className="bg-black/50 fixed inset-0 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <div role="presentation" className="flex min-h-full items-center justify-center p-4">
            <div
              data-slot="dialog-content"
              className={cn(
                "bg-card text-card-foreground relative flex w-full max-w-md max-h-[90vh] flex-col gap-4 overflow-y-auto rounded-2xl border p-5 shadow-xl",
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
        </div>
      )}
    </>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-title"
      className={cn("font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex items-center justify-end gap-2", className)}
      {...props}
    />
  )
}

export { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter }