import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Save,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, Panel, StatCard } from "@/components/school/bits";
import { attendanceMeta } from "@/components/school/shared";
import { useMe } from "@/components/school/useMe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DAYS,
  attendanceStats,
  formatDate,
  lastSchoolDay,
  toISODate,
} from "@/lib/school/logic";
import { setAttendance } from "@/lib/school/store";
import type { AttendanceStatus } from "@/lib/school/types";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/app/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const { me } = useMe();
  if (me.role === "student") return <StudentAttendance studentId={me.student.id} />;
  return <StaffAttendance />;
}

function StudentAttendance({ studentId, customStudentName }: { studentId: string; customStudentName?: string }) {
  const { s, me } = useMe();
  const st = me.role === "student" ? me.student : null;
  const displayName = customStudentName || st?.name || "الطالب";
  const stats = useMemo(() => attendanceStats(s.attendance, studentId), [s.attendance, studentId]);

  // Student's records sorted by date descending
  const records = useMemo(() => {
    return s.attendance
      .filter((r) => r.studentId === studentId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [s.attendance, studentId]);

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="سجل الحضور والغياب"
        subtitle={`متابعة نسب الالتزام بالحضور الصباحي والحصص الأكاديمية — ${displayName}`}
        icon={UserCheck}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="نسبة الحضور العامة"
          value={`${stats.rate.toLocaleString("ar-EG")}٪`}
          icon={UserCheck}
          tone={stats.rate >= 90 ? "success" : stats.rate >= 75 ? "warning" : "danger"}
          hint={stats.rate >= 85 ? "مستوفي لشروط الاختبارات" : "تنبيه: انخفاض نسبة الحضور"}
        />
        <StatCard
          label="أيام الحضور"
          value={stats.present.toLocaleString("ar-EG")}
          icon={CheckCircle2}
          tone="navy"
          hint="حضور كامل الحصص"
        />
        <StatCard
          label="أيام الغياب"
          value={stats.absent.toLocaleString("ar-EG")}
          icon={UserX}
          tone={stats.absent > 3 ? "danger" : "warning"}
          hint={`${stats.absent} أيام مسجلة`}
        />
        <StatCard
          label="مرات التأخير"
          value={stats.late.toLocaleString("ar-EG")}
          icon={Clock}
          tone="gold"
          hint="تأخير عن الطابور"
        />
      </div>

      {/* Detailed Attendance History */}
      <Panel className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="font-display text-lg font-bold text-navy">تفاصيل الحضور اليومي</h2>
          <Badge variant="outline" className="text-xs">
            إجمالي السجلات: {records.length.toLocaleString("ar-EG")} يوم
          </Badge>
        </div>

        {records.length === 0 ? (
          <EmptyState icon={CalendarDays} title="لا توجد سجلات حضور مسجلة حالياً" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2.5 px-3 text-start">التاريخ</th>
                  <th className="py-2.5 px-3 text-start">اليوم</th>
                  <th className="py-2.5 px-3 text-start">حالة الحضور</th>
                  <th className="py-2.5 px-3 text-start">ملاحظات الانضباط</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {records.map((r) => {
                  const meta = attendanceMeta[r.status];
                  const d = new Date(r.date);
                  const dayName = DAYS[d.getDay()] ?? "";

                  return (
                    <tr key={r.date} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-3 font-semibold text-foreground">
                        {formatDate(r.date, { day: "numeric", month: "long", year: "numeric" })}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{dayName}</td>
                      <td className="py-3 px-3">
                        <Badge variant={meta.badge} className="px-2.5 py-0.5 text-xs">
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground">
                        {r.status === "present" && "حضور في الموعد المحدد"}
                        {r.status === "late" && "تأخر عن الطابور الصباحي"}
                        {r.status === "absent" && "غياب بدون عذر مسبق"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function StaffAttendance() {
  const { s } = useMe();
  const todayISO = useMemo(() => toISODate(lastSchoolDay(new Date())), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const stageId = s.session?.stageId ?? "stg-pri";
  const stageClasses = s.classes.filter((schoolClass) => schoolClass.stageId === stageId);
  const [selectedClassId, setSelectedClassId] = useState<string>(stageClasses[0]?.id ?? "");

  // Local state for entries: studentId -> AttendanceStatus
  const [entries, setEntries] = useState<Record<string, AttendanceStatus>>({});

  const classStudents = useMemo(() => {
    return s.students.filter((st) => st.classId === selectedClassId);
  }, [s.students, selectedClassId]);

  // Load existing records for this class & date when date/class changes
  useEffect(() => {
    const map: Record<string, AttendanceStatus> = {};
    classStudents.forEach((st) => {
      const rec = s.attendance.find((r) => r.studentId === st.id && r.date === selectedDate);
      map[st.id] = rec ? rec.status : "present";
    });
    setEntries(map);
  }, [selectedClassId, selectedDate, classStudents, s.attendance]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setEntries((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    classStudents.forEach((st) => {
      next[st.id] = status;
    });
    setEntries(next);
  };

  const handleSave = () => {
    setAttendance(selectedDate, selectedClassId, entries);
    toast.success("تم حفظ واعتماد سجل الحضور والغياب بنجاح");
  };

  const activeClass = s.classes.find((c) => c.id === selectedClassId);

  // Present count in current editing entries
  const presentCount = Object.values(entries).filter((st) => st === "present").length;
  const absentCount = Object.values(entries).filter((st) => st === "absent").length;
  const lateCount = Object.values(entries).filter((st) => st === "late").length;
  const totalCount = classStudents.length;
  const rate = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 100;

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="رصد ومتابعة الحضور والغياب"
        subtitle="تسجيل الحضور اليومي للطلاب، وحصر الغياب والتأخير وإرسال الإشعارات لأولياء الأمور"
        icon={UserCheck}
        action={
          <Button onClick={handleSave} className="gap-2 bg-primary hover:bg-navy font-bold">
            <Save className="h-4 w-4" />
            حفظ سجل الحضور
          </Button>
        }
      />

      {/* Control Filters */}
      <div className="grid gap-3 sm:grid-cols-2 rounded-2xl border bg-card p-4 shadow-card">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground">الفصل الدراسي:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {stageClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground">تاريخ الحصة / اليوم الدراسي:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Live Class Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="نسبة الحضور لهذا اليوم"
          value={`${rate.toLocaleString("ar-EG")}٪`}
          icon={UserCheck}
          tone="navy"
          hint={`${presentCount} حاضر من ${totalCount}`}
        />
        <StatCard
          label="عدد الحضور"
          value={presentCount.toLocaleString("ar-EG")}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="عدد الغياب"
          value={absentCount.toLocaleString("ar-EG")}
          icon={UserX}
          tone="danger"
        />
        <StatCard
          label="عدد المتأخرين"
          value={lateCount.toLocaleString("ar-EG")}
          icon={Clock}
          tone="gold"
        />
      </div>

      {/* Roster & Quick Actions */}
      <Panel className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="font-display text-lg font-bold text-navy">
              قائمة طلاب {activeClass?.name} ({totalCount} طالب)
            </h3>
            <p className="text-xs text-muted-foreground">
              حدد حالة حضور كل طالب ثم اضغط على حفظ السجل في الأعلى
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => markAll("present")}
              className="text-xs text-success border-success/30 hover:bg-success-soft"
            >
              تسجيل الكل حاضرين
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => markAll("absent")}
              className="text-xs text-destructive border-destructive/30 hover:bg-danger-soft"
            >
              تسجيل الكل غائبين
            </Button>
          </div>
        </div>

        {classStudents.length === 0 ? (
          <EmptyState icon={Users} title="لا يوجد طلاب مسجلون في هذا الفصل" />
        ) : (
          <div className="divide-y">
            {classStudents.map((st, idx) => {
              const currentStatus = entries[st.id] || "present";

              return (
                <div
                  key={st.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-2 rounded-xl transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-foreground text-sm">{st.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>الرقم: <span dir="ltr">{st.academicId}</span></span>
                        <span>·</span>
                        <span>ولي الأمر: {st.parentName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(st.id, "present")}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                        currentStatus === "present"
                          ? "bg-success text-white shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-success-soft hover:text-success",
                      )}
                    >
                      حاضر
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(st.id, "late")}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                        currentStatus === "late"
                          ? "bg-warning text-foreground font-extrabold shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-warning-soft hover:text-warning",
                      )}
                    >
                      متأخر
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(st.id, "absent")}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                        currentStatus === "absent"
                          ? "bg-destructive text-white shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-danger-soft hover:text-destructive",
                      )}
                    >
                      غائب
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
