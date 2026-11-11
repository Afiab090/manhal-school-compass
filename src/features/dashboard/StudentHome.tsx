import { Link } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Megaphone,
  UserCheck,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";

import { EmptyState, Panel, ProgressBar, StatCard } from "@/components/school/bits";
import { AnnouncementCard, SlotCard } from "@/components/school/shared";
import { useMe } from "@/components/school/useMe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  attendanceStats,
  currentOrNextSchoolDay,
  daysUntil,
  feeSummary,
  formatDate,
  formatMoney,
} from "@/lib/school/logic";

export function StudentHome({ initialTab }: { initialTab?: string }) {
  const { s, me } = useMe();
  if (me.role !== "student") return null;

  const st = me.student;
  const cls = s.classes.find((c) => c.id === st.classId);
  const att = useMemo(() => attendanceStats(s.attendance, st.id), [s.attendance, st.id]);
  const fees = useMemo(() => feeSummary(st, s.payments, s.installments), [st, s.payments, s.installments]);

  const { day, isToday } = useMemo(() => currentOrNextSchoolDay(new Date()), []);
  const todaySlots = useMemo(() => {
    return s.slots.filter((sl) => sl.classId === st.classId && sl.day === day).sort((a, b) => a.period - b.period);
  }, [s.slots, st.classId, day]);

  const nextExam = useMemo(() => {
    const now = new Date();
    return s.events
      .filter((e) => e.type === "exam" && (e.classId === "all" || e.classId === st.classId) && daysUntil(e.date, now) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
  }, [s.events, st.classId]);

  const announcements = useMemo(() => {
    return s.announcements
      .filter((a) => a.audience === "all" || a.audience === st.classId)
      .slice(0, 3);
  }, [s.announcements, st.classId]);

  return (
    <div className="animate-rise space-y-6">
      {/* Student Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border bg-card p-6 shadow-card">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-bold text-navy">
              طالب منتظم
            </span>
            <span className="text-xs text-muted-foreground font-mono">{st.academicId}</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy">
            أهلاً، {st.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            الفصل الدراسي: <span className="font-bold text-foreground">{cls?.name ?? "غير محدد"}</span> · {cls?.stageId ?? ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="gold" size="sm" className="gap-2 text-xs font-bold">
            <Link to="/app/grades">
              <Award className="h-4 w-4" />
              كشف درجاتي
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2 text-xs font-bold">
            <Link to="/app/schedule">
              <CalendarDays className="h-4 w-4" />
              جدول الحصص
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="نسبة الحضور والالتزام"
          value={`${att.rate}٪`}
          icon={UserCheck}
          tone="success"
          hint={`${att.present} حضور · ${att.absent} غياب`}
          to="/app/attendance"
        />
        <StatCard
          label="سداد الرسوم الدراسية"
          value={`${fees.percent}٪`}
          icon={Wallet}
          tone="gold"
          hint={`متبقي ${formatMoney(fees.remaining)}`}
          to="/app/fees"
        />
        <StatCard
          label={isToday ? "حصص اليوم" : "حصص الأحد القادم"}
          value={`${todaySlots.length} حصص`}
          icon={Clock}
          hint={cls?.short ?? "الفصل"}
          to="/app/schedule"
        />
        <StatCard
          label="الامتحان القادم"
          value={nextExam ? nextExam.title.slice(0, 16) + "..." : "لا امتحانات"}
          icon={CalendarClock}
          tone={nextExam ? "gold" : undefined}
          hint={nextExam ? formatDate(nextExam.date) : "الجدول منتظم"}
          to="/app/calendar"
        />
      </div>

      {/* Main Grid: Schedule & Fees */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Today's Schedule (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          <Panel className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-navy flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-gold" />
                {isToday ? "جدول الحصص لليوم" : "جدول أول يوم دراسي (الأحد)"}
              </h2>
              <Link to="/app/schedule" className="text-xs font-bold text-navy hover:text-gold">
                عرض الأسبوع كاملاً ←
              </Link>
            </div>

            {todaySlots.length === 0 ? (
              <EmptyState icon={CalendarDays} title="لا توجد حصص مجدولة لهذا اليوم" />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {todaySlots.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    s={s}
                  />
                ))}
              </div>
            )}
          </Panel>

          {/* Announcements */}
          <Panel className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-navy flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-gold" />
                إعلانات هامة للفصل
              </h2>
              <Link to="/app/notices" className="text-xs font-bold text-navy hover:text-gold">
                جميع الإعلانات ←
              </Link>
            </div>

            <div className="space-y-2">
              {announcements.map((a) => (
                <AnnouncementCard key={a.id} a={a} s={s} />
              ))}
            </div>
          </Panel>
        </div>

        {/* Side Panel: Fees & Quick Links */}
        <div className="space-y-6">
          <Panel className="space-y-4">
            <h2 className="font-display text-base font-bold text-navy flex items-center gap-2">
              <Wallet className="h-5 w-5 text-gold" />
              حالة الرسوم الدراسية
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">نسبة الإنجاز:</span>
                <span className="font-mono font-bold text-foreground">{fees.percent}٪</span>
              </div>
              <ProgressBar value={fees.percent} />
            </div>

            <div className="pt-2 border-t text-xs space-y-1.5 text-muted-foreground">
              <div className="flex justify-between">
                <span>المبلغ المسدد:</span>
                <span className="font-mono font-bold text-success">{formatMoney(fees.paid)}</span>
              </div>
              <div className="flex justify-between">
                <span>المتبقي:</span>
                <span className="font-mono font-bold text-destructive">{formatMoney(fees.remaining)}</span>
              </div>
            </div>

            <Button asChild variant="outline" size="sm" className="w-full text-xs font-bold">
              <Link to="/app/fees">تفاصيل الرسوم وسندات القبض</Link>
            </Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
