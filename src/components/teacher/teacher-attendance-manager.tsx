'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  MapPin,
  Navigation,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import {
  useTeacherTodayAttendance,
  useTeacherAttendanceHistory,
  useTeacherCheckIn,
} from '@/lib/queries';
import { calculateDistanceMeters, getGoogleMapsUrl } from '@/lib/geo';
import type { AttendanceStatus } from '@/types/domain';

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

function formatDateString(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
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

export function TeacherAttendanceManager() {
  const { data: todayData, isLoading: isLoadingToday } = useTeacherTodayAttendance();
  const { data: history, isLoading: isLoadingHistory } = useTeacherAttendanceHistory();

  const checkInMutation = useTeacherCheckIn();

  const [note, setNote] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const school = todayData?.schoolConfig ?? {
    latitude: 30.674404,
    longitude: 76.740797,
    radiusMeters: 500,
    name: 'Central School Campus',
  };

  const requestGps = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsLoading(false);
      },
      (err) => {
        let msg = 'Unable to fetch your location.';
        if (err.code === 1) msg = 'Location permission was denied. Please allow location access in your browser settings.';
        else if (err.code === 2) msg = 'Location unavailable. Check GPS or network connection.';
        else if (err.code === 3) msg = 'Location request timed out. Please try again.';
        setGpsError(msg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return;
    }

    let isMounted = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isMounted) return;
        setGpsCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        if (!isMounted) return;
        let msg = 'Unable to fetch your location.';
        if (err.code === 1) msg = 'Location permission was denied. Please allow location access in your browser settings.';
        else if (err.code === 2) msg = 'Location unavailable. Check GPS or network connection.';
        else if (err.code === 3) msg = 'Location request timed out. Please try again.';
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  const liveDistance =
    gpsCoords && school
      ? calculateDistanceMeters(
          gpsCoords.latitude,
          gpsCoords.longitude,
          school.latitude,
          school.longitude
        )
      : null;

  const isLiveInsideCampus =
    liveDistance !== null && school ? liveDistance <= school.radiusMeters : false;

    console.log(isLiveInsideCampus, liveDistance, school,"test");

  const handleCheckIn = async () => {
    try {
      await checkInMutation.mutateAsync({
        latitude: gpsCoords?.latitude,
        longitude: gpsCoords?.longitude,
        note: note.trim() || undefined,
      });
      toast.success('Attendance marked successfully!');
      setNote('');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to mark attendance';
      toast.error(errorMsg);
    }
  };

  const todayRecord = todayData?.record;
  const hasCheckedIn = todayData?.hasCheckedIn;

  return (
    <div className="space-y-6">
      {/* Top Banner / Today's Action */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Clock className="h-5 w-5 text-primary" />
                  Daily Attendance Check-In
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </CardDescription>
              </div>
              {hasCheckedIn && todayRecord && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm font-medium">
                    Status:
                  </Badge>
                  {getStatusBadge(todayRecord.status)}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {isLoadingToday ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-6 w-6 text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Checking attendance status...</span>
              </div>
            ) : hasCheckedIn && todayRecord ? (
              <div className="rounded-lg border bg-emerald-50/50 p-4 dark:bg-emerald-950/20 dark:border-emerald-800/40">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-emerald-950 dark:text-emerald-200">
                        Attendance Marked for Today
                      </p>
                      <span className="text-xs text-muted-foreground">
                        Time: {formatTimeString(todayRecord.checkInTime)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>Location Status:</span>
                        {todayRecord.isInsideSchool ? (
                          <Badge className="bg-emerald-600 text-white">Within School Campus</Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">
                            Outside Campus ({todayRecord.distanceMeters ? formatDistance(todayRecord.distanceMeters) : 'Off-site'})
                          </Badge>
                        )}
                      </div>

                      {todayRecord.latitude && todayRecord.longitude && (
                        <a
                          href={getGoogleMapsUrl(todayRecord.latitude, todayRecord.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          View on Map
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    {todayRecord.note && (
                      <p className="text-xs text-muted-foreground italic border-t pt-2 mt-2">
                        Note: &ldquo;{todayRecord.note}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Geolocation Status Card */}
                <div className="rounded-lg border p-3.5 bg-muted/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Navigation className="h-4 w-4 text-primary" />
                      GPS Campus Geofence
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={requestGps}
                      disabled={gpsLoading}
                      className="h-7 text-xs"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 mr-1 ${gpsLoading ? 'animate-spin' : ''}`} />
                      Refresh GPS
                    </Button>
                  </div>

                  {gpsLoading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                      <Spinner className="h-4 w-4" />
                      Acquiring precise satellite location...
                    </div>
                  ) : gpsError ? (
                    <Alert variant="destructive" className="py-2 text-xs">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="text-xs font-semibold">GPS Warning</AlertTitle>
                      <AlertDescription className="text-xs">{gpsError}</AlertDescription>
                    </Alert>
                  ) : gpsCoords ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>Status:</span>
                        {isLiveInsideCampus ? (
                          <Badge className="bg-emerald-600 text-white">
                            Inside Campus (~{liveDistance !== null ? formatDistance(liveDistance) : '0m'})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">
                            Off Campus (~{liveDistance !== null ? formatDistance(liveDistance) : '0m'} from school)
                          </Badge>
                        )}
                        <span className="text-muted-foreground">
                          (Campus Radius: {school.radiusMeters}m)
                        </span>
                      </div>
                      <p className="text-muted-foreground font-mono text-[11px]">
                        Coords: {gpsCoords.latitude.toFixed(5)}, {gpsCoords.longitude.toFixed(5)} (±{Math.round(gpsCoords.accuracy)}m)
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Optional Note */}
                <FieldGroup>
                  <Field>
                    <FieldLabel className="text-xs">Optional Note / Reason</FieldLabel>
                    <Textarea
                      placeholder="e.g., Arrived at school campus, field trip duty, etc."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      className="resize-none text-sm"
                    />
                  </Field>
                </FieldGroup>

                {/* Mark Present Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5" />
                    <span>Check-ins after 09:30 AM are logged as Late.</span>
                  </div>

                  <Button
                    onClick={handleCheckIn}
                    disabled={checkInMutation.isPending}
                    className="min-w-35"
                  >
                    {checkInMutation.isPending ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Marking...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark Present
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* School Campus Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Campus Boundary Info
            </CardTitle>
            <CardDescription>Designated school location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <p className="text-muted-foreground">Campus Name</p>
              <p className="font-medium text-sm">{school.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Center Coordinates</p>
              <p className="font-mono">{school.latitude.toFixed(4)}, {school.longitude.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Allowed Geofence Radius</p>
              <p className="font-semibold">{school.radiusMeters} meters</p>
            </div>
            <div className="pt-2">
              <a
                href={getGoogleMapsUrl(school.latitude, school.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View School on Google Maps
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" />
            My Attendance History
          </CardTitle>
          <CardDescription>Your past 30 days attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6 text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading history...</span>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No attendance records found yet. Check in today to start your record.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs font-medium text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Check-In Time</th>
                    <th className="py-3 px-4">Campus Geofence</th>
                    <th className="py-3 px-4">Distance</th>
                    <th className="py-3 px-4">Note</th>
                    <th className="py-3 px-4 text-right">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.map((rec) => (
                    <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium whitespace-nowrap">
                        {formatDateString(rec.date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(rec.status)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-xs">
                        {formatTimeString(rec.checkInTime)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {rec.isInsideSchool ? (
                          <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Inside Campus
                          </span>
                        ) : rec.checkInTime ? (
                          <span className="inline-flex items-center text-xs font-medium text-amber-600 dark:text-amber-400">
                            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Off Campus
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                        {rec.distanceMeters !== null ? formatDistance(rec.distanceMeters) : '—'}
                      </td>
                      <td className="py-3 px-4 text-xs max-w-50 truncate text-muted-foreground">
                        {rec.note || '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {rec.latitude && rec.longitude ? (
                          <a
                            href={getGoogleMapsUrl(rec.latitude, rec.longitude)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Map
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
