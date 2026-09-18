'use client';

import { useState, useMemo } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Users,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import {
  useAdminTeacherAttendance,
  useAdminUpdateTeacherAttendance,
} from '@/lib/queries';
import { getGoogleMapsUrl } from '@/lib/geo';
import type { AdminTeacherAttendanceItem, AttendanceStatus } from '@/types/domain';

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatTimeString(isoString: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function offsetDateString(current: string, deltaDays: number): string {
  const [y, m, d] = current.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStatusBadge(status: AttendanceStatus) {
  switch (status) {
    case 'PRESENT':
      return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">Present</Badge>;
    case 'LATE':
      return <Badge className="bg-amber-600 hover:bg-amber-700 text-white">Late</Badge>;
    case 'HALF_DAY':
      return <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white">Half Day</Badge>;
    case 'EXCUSED':
      return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Excused</Badge>;
    case 'ABSENT':
    default:
      return <Badge variant="destructive">Absent</Badge>;
  }
}

export function AdminTeacherAttendanceManager() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data, isLoading } = useAdminTeacherAttendance(selectedDate);
  const updateMutation = useAdminUpdateTeacherAttendance();

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<AdminTeacherAttendanceItem | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('PRESENT');
  const [editNote, setEditNote] = useState<string>('');

  const openEditModal = (item: AdminTeacherAttendanceItem) => {
    setEditingItem(item);
    setEditStatus(item.status);
    setEditNote(item.note || '');
  };

  const closeEditModal = () => {
    setEditingItem(null);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      await updateMutation.mutateAsync({
        teacherId: editingItem.teacherId,
        date: selectedDate,
        status: editStatus,
        note: editNote.trim() || null,
      });
      toast.success(`Updated attendance for ${editingItem.name}`);
      closeEditModal();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update attendance';
      toast.error(errorMsg);
    }
  };

  const records = data?.records;

  const filteredRecords = useMemo(() => {
    if (!records) return [];

    return records.filter((rec) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (rec.name?.toLowerCase().includes(q) ?? false) ||
        (rec.email?.toLowerCase().includes(q) ?? false) ||
        (rec.empCode?.toLowerCase().includes(q) ?? false);

      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'INSIDE_CAMPUS') return Boolean(rec.checkInTime && rec.isInsideSchool);
      if (statusFilter === 'OFF_CAMPUS') return Boolean(rec.checkInTime && !rec.isInsideSchool);
      return rec.status === statusFilter;
    });
  }, [records, searchQuery, statusFilter]);

  const summary = data?.summary ?? {
    totalTeachers: 0,
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    excused: 0,
    insideCampusCount: 0,
    outsideCampusCount: 0,
  };

  const isToday = selectedDate === getTodayString();

  return (
    <div className="space-y-6">
      {/* Date Navigator Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedDate((d) => offsetDateString(d, -1))}
            title="Previous Day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="h-8 w-40 text-sm font-medium"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedDate((d) => offsetDateString(d, 1))}
            title="Next Day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isToday && (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => setSelectedDate(getTodayString())}
            >
              Back to Today
            </Button>
          )}
        </div>

        <div className="text-sm font-medium text-muted-foreground">
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Teachers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTeachers}</div>
            <p className="text-xs text-muted-foreground mt-1">Staff roster</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Present
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary.present}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.insideCampusCount} inside campus
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Late Arrivals
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {summary.late}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Checked in after 09:30 AM</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-destructive">
              Absent
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.absent}</div>
            <p className="text-xs text-muted-foreground mt-1">Not checked in</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Excused / Half-Day
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {summary.excused + summary.halfDay}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.excused} excused, {summary.halfDay} half-day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Attendance List Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Staff Attendance Roster</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time check-in logs, geofence verification, and admin status override
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full md:w-56">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teacher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <div className="w-full md:w-44">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="EXCUSED">Excused</option>
                  <option value="INSIDE_CAMPUS">Inside Campus</option>
                  <option value="OFF_CAMPUS">Outside Campus</option>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-6 w-6 text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading attendance records...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No teacher attendance records found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs font-medium text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4">Teacher</th>
                    <th className="py-3 px-4">Emp Code</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Check-In Time</th>
                    <th className="py-3 px-4">Geofence Location</th>
                    <th className="py-3 px-4">Distance</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRecords.map((item) => (
                    <tr key={item.teacherId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.email}</div>
                      </td>

                      <td className="py-3 px-4 text-xs font-mono">
                        {item.empCode || <span className="text-muted-foreground">—</span>}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-xs">
                        {formatTimeString(item.checkInTime)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.checkInTime ? (
                          item.isInsideSchool ? (
                            <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Inside Campus
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-medium text-amber-600 dark:text-amber-400">
                              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Outside Campus
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                        {item.distanceMeters !== null ? (
                          <span className="flex items-center gap-1">
                            {formatDistance(item.distanceMeters)}
                            {item.latitude && item.longitude && (
                              <a
                                href={getGoogleMapsUrl(item.latitude, item.longitude)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline ml-1"
                                title="View check-in GPS on Map"
                              >
                                <ExternalLink className="h-3 w-3 inline" />
                              </a>
                            )}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs max-w-45 truncate text-muted-foreground">
                        {item.note || '—'}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(item)}
                          className="h-7 text-xs font-medium gap-1"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Override
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Attendance Override Modal */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && closeEditModal()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Override Attendance Status
            </DialogTitle>
            <DialogDescription>
              Update attendance record for <strong>{editingItem.name}</strong> on {selectedDate}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <FieldGroup>
              <Field>
                <FieldLabel className="text-xs">Attendance Status</FieldLabel>
                <Select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                  className="text-sm"
                >
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="EXCUSED">Excused</option>
                </Select>
              </Field>

              <Field>
                <FieldLabel className="text-xs">Admin Note / Reason</FieldLabel>
                <Textarea
                  placeholder="e.g., Medical leave approved by principal, official duty, etc."
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}
