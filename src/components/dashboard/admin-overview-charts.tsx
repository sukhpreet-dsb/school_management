"use client"

import * as React from "react"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

import type { AdminStats } from "@/types/domain"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const GRADE_COLORS = {
  "A+": "#10b981",
  A: "#22c55e",
  B: "#6366f1",
  C: "#f59e0b",
  D: "#f97316",
  F: "#ef4444"
} as const

const ATTENDANCE_COLORS: Record<string, string> = {
  Present: "#22c55e",
  Late: "#f59e0b",
  Absent: "#ef4444",
  Excused: "#94a3b8"
}

function ChartCard({
  title,
  description,
  children
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function ChartContainer({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setSize({ width, height })
        }
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (size.width === 0 || size.height === 0) {
    return <div ref={ref} className="h-full w-full" />
  }

  const child = React.Children.only(children) as React.ReactElement<{
    width?: number
    height?: number
  }>

  return (
    <div ref={ref} className="h-full w-full">
      {React.cloneElement(child, { width: size.width, height: size.height })}
    </div>
  )
}

export function AdminOverviewCharts({ stats }: { stats: AdminStats }) {
  const attendance = [
    { name: "Present", value: stats.attendanceBreakdown.present },
    { name: "Late", value: stats.attendanceBreakdown.late },
    { name: "Absent", value: stats.attendanceBreakdown.absent },
    { name: "Excused", value: stats.attendanceBreakdown.excused }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div className="md:col-span-2">
        <ChartCard title="Enrollment trend" description="Active students over the last five academic years">
          <div className="h-64">
            <ChartContainer>
              <AreaChart data={stats.enrollmentByYear} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="enroll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="academicYear" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 13
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Students"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#enroll)"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Attendance" description="Across the last 30 school days">
        <div className="h-64">
          <ChartContainer>
            <PieChart>
              <Pie
                data={attendance}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={2}
                strokeWidth={0}
              >
                {attendance.map((entry) => (
                  <Cell key={entry.name} fill={ATTENDANCE_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 13
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs">{value}</span>}
              />
            </PieChart>
          </ChartContainer>
        </div>
        <p className="text-muted-foreground mt-2 text-center text-sm">
          Overall attendance rate:{" "}
          <span className="text-foreground font-semibold">{stats.attendanceRateOverall}%</span>
        </p>
      </ChartCard>

      <ChartCard title="Class sizes" description="Enrolled students per class">
        <div className="h-64">
          <ChartContainer>
            <BarChart data={stats.classSizes} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="className" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "var(--color-muted)" }}
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 13
                }}
              />
              <Bar dataKey="count" name="Students" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ChartContainer>
        </div>
      </ChartCard>

      <div className="md:col-span-2">
        <ChartCard title="Grade distribution" description="Letter grades issued per class (all subjects, term 1–2)">
          <div className="h-64">
            <ChartContainer>
              <BarChart data={stats.gradeDistribution} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="className" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 13
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs capitalize">{value}</span>}
                />
                {Object.entries(GRADE_COLORS).map(([key, color]) => (
                  <Bar key={key} dataKey={key} stackId="grades" fill={color} maxBarSize={42} />
                ))}
              </BarChart>
            </ChartContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}