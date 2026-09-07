import Link from "next/link"
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Percent,
  School,
  Users
} from "lucide-react"

import { getAdminStats } from "@/mock/data"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/layout/stat-card"
import { AdminOverviewCharts } from "@/components/dashboard/admin-overview-charts"

const QUICK_ACTIONS = [
  { label: "Add student", href: "/admin/students" },
  { label: "Record attendance", href: "/admin/attendance" },
  { label: "Enter grades", href: "/admin/grades" },
  { label: "Manage classes", href: "/admin/classes" }
]

export default function AdminPage() {
  const stats = getAdminStats()

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="School overview and key metrics for the 2026–2027 academic year."
        actions={
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {action.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Students"
          value={stats.totals.students}
          icon={GraduationCap}
          iconClass="bg-primary/10 text-primary"
          trend="+19% vs last year"
        />
        <StatCard
          title="Teachers"
          value={stats.totals.teachers}
          icon={Users}
          iconClass="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          hint="Across 6 classes"
        />
        <StatCard
          title="Classes"
          value={stats.totals.classes}
          icon={School}
          iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          hint="Class 5 – Class 7"
        />
        <StatCard
          title="Attendance rate"
          value={`${stats.attendanceRateOverall}%`}
          icon={CheckCircle2}
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          trend="Last 30 school days"
        />
      </div>

      <AdminOverviewCharts stats={stats} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
              <Percent className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Attendance by class</span>
              <span className="text-muted-foreground text-xs">Highest → lowest</span>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 text-amber-600 flex size-10 items-center justify-center rounded-xl dark:text-amber-400">
              <BookOpen className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{stats.totals.subjects} subjects</span>
              <span className="text-muted-foreground text-xs">Taught across all classes</span>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 text-emerald-600 flex size-10 items-center justify-center rounded-xl dark:text-emerald-400">
              <CalendarDays className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">30 school days tracked</span>
              <span className="text-muted-foreground text-xs">Aug – early Sep 2026</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}