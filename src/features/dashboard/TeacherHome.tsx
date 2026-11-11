import { Link } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  Plus,
  UserCheck,
  Users,
} from "lucide-react";
import { useMemo } from "react";

import { EmptyState, Panel, StatCard } from "@/components/school/bits";
import { SlotCard } from "@/components/school/shared";
import { useMe } from "@/components/school/useMe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currentOrNextSchoolDay, formatDate } from "@/lib/school/logic";

export function TeacherHome({ initialTab }: { initialTab?: string }) {
  const { s, me } = useMe();
  if (me.role !== "teacher") return null;

  const t = me.teacher;
  const assignedClasses = useMemo(() => {
    return s.classes.filter((c) => t.classes?.includes(c.id));
  }, [s.classes, t.classes]);

  const teacherSlots = useMemo(() => {
    return s.slots.filter((sl) => sl.teacherId === t.id);
  }, [s.slots, t.id]);

  const { day, isToday } = useMemo(() => currentOrNextSchoolDay(new Date()), []);
  const todaySlots = useMemo(() => {
    return teacherSlots.filter((sl) => sl.day === day).sort((a, b) => a.period - b.period);
  }, [teacherSlots, day]);

  return (
    <div className="animate-rise space-y-6">
      {/* Teacher Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border bg-card p-6 shadow-card">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-bold text-navy">
              أستاذ مادة · {t.subject}
            </span>
            <span className="text-xs text-muted-foreground font-mono">{t.employeeId}</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy">
            أهلاً، أ. {t.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            الفصول المسندة: <span className="font-bold text-foreground">{assignedClasses.length} فصول</span> · النصاب الأسبوعي: <span className="font-bold text-navy">{teacherSlots.length} حصة</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="gold" size="sm" className="gap-2 text-xs font-bold">
            <Link to="/app/grades">
              <Award className="h-4 w-4" />
              رصد الدرجات
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2 text-xs font-bold">
            <Link to="/app/attendance">
              <UserCheck className="h-4 w-4" />
              رصد الحضور
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="النصاب الأسبوعي"
          value={`${teacherSlots.length} حصة`}
          icon={CalendarDays}
          tone={teacherSlots.length > 25 ? "warning" : undefined}
          hint="الحد الأقصى الموصى به: ٢٥ حصة"
          to="/app/schedule"
        />
        <StatCard
          label="الفصول المسندة"
          value={`${assignedClasses.length} فصول`}
          icon={Layers}
          hint={t.subject}
          to="/app/timetables"
        />
        <StatCard
          label={isToday ? "حصص اليوم" : "حصص الأحد القادم"}
          value={`${todaySlots.length} حصص`}
          icon={Clock}
          tone="gold"
          hint={isToday ? "اليوم الدراسي" : "أول الأسبوع"}
          to="/app/schedule"
        />
        <StatCard
          label="إجمالي الطلاب المسندين"
          value={s.students.filter((st) => t.classes?.includes(st.classId) && st.status !== "archived").length}
          icon={Users}
          hint="في فصولك"
          to="/app/students"
        />
      </div>

      {/* Today's Schedule */}
      <Panel className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-navy flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-gold" />
            {isToday ? "جدول حصصك لليوم" : "جدول حصصك لأول يوم دراسي (الأحد)"}
          </h2>
          <Link to="/app/schedule" className="text-xs font-bold text-navy hover:text-gold">
            عرض جدولك الأسبوعي كاملاً ←
          </Link>
        </div>

        {todaySlots.length === 0 ? (
          <EmptyState icon={CalendarDays} title="لا توجد حصص مسندة لك لهذا اليوم" />
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
            {todaySlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                s={s}
                showClass
              />
            ))}
          </div>
        )}
      </Panel>

      {/* Assigned Classes Quick Cards */}
      <Panel className="space-y-3">
        <h2 className="font-display text-base font-bold text-navy flex items-center gap-2">
          <Layers className="h-4 w-4 text-gold" />
          فصولك الدراسية المسندة
        </h2>

        <div className="grid gap-3 sm:grid-cols-3">
          {assignedClasses.map((cls) => {
            const classStudents = s.students.filter((st) => st.classId === cls.id && st.status !== "archived");
            return (
              <div key={cls.id} className="rounded-2xl border bg-card p-4 shadow-card hover:border-gold transition-all">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs font-bold text-navy">
                    {cls.short}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{cls.stageId}</span>
                </div>
                <h3 className="font-bold text-sm text-foreground">{cls.name}</h3>
                <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                  <span>عدد الطلاب:</span>
                  <span className="font-bold font-mono text-navy">{classStudents.length} / {cls.capacity}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
