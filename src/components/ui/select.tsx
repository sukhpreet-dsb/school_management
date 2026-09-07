"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SelectProps extends React.ComponentProps<"select"> {
  invalid?: boolean
}

function Select({ className, invalid, ...props }: SelectProps) {
  return (
    <div
      data-slot="select-wrapper"
      className="relative flex min-w-0 items-center"
    >
      <select
        data-slot="select"
        aria-invalid={invalid}
        className={cn(
          "h-8 w-full min-w-0 appearance-none rounded-2xl border border-transparent bg-input/50 px-2.5 pr-7 text-sm transition-[color,box-shadow] duration-200 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_option]:text-foreground",
          className
        )}
        {...props}
      />
      <ChevronDownIcon className="text-muted-foreground pointer-events-none absolute right-2 z-10 size-4" />
    </div>
  )
}

export { Select }