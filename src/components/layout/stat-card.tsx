import type { LucideIcon } from "lucide-react"
import { TrendingUp, type LucideProps } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

export function StatCard({
  title,
  value,
  icon: Icon,
  iconClass,
  hint,
  trend,
  ...iconProps
}: {
  title: string
  value: React.ReactNode
  icon: LucideIcon
  iconClass?: string
  hint?: string
  trend?: string
} & Omit<LucideProps, "title">) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {(hint || trend) && (
            <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
              {trend && <TrendingUp className="text-emerald-500 size-3.5" />}
              <span>{trend ?? hint}</span>
            </div>
          )}
        </div>
        <div
          className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", iconClass)}
        >
          <Icon className="size-5" {...iconProps} />
        </div>
      </div>
    </Card>
  )
}