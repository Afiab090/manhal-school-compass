import { Link } from "@tanstack/react-router";
import { Award, CalendarDays, ClipboardCheck, Wallet } from "lucide-react";

import { AnnouncementCard, SlotCard } from "@/components/school/shared";
import { PageHeader, QuickGrid, SectionTitle, StatCard } from "@/components/school/bits";
import { useMe } from "@/components/school/useMe";
import { attendanceStats, currentOrNextSchoolDay, DAYS, feeSummary, formatMoney } from "@/lib/school/logic";

export function StudentHome() {
  const { s, me } = useMe();
  if (me.role !== "student") return null;
  const student = me.student;
  const schoolClass = s.classes.find((item) => item.id === student.classId);
  const fees = feeSummary(student, s.payments, s.installments);
  const attendance = attendanceStats(s.attendance, student.id);
  const { day, isToday } = currentOrNextSchoolDay(new Date());
  const todaySlots = s.slots.filter((slot) => slot.classId === student.classId && slot.day === day).sort((a, b) => a.period - b.period);
  const notices = s.announcements.filter((item) => item.audience === "all" || item.audience === student.classId).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  return <div className="animate-rise space-y-6">
    <PageHeader title={`مرحباً، ${student.name}`} subtitle={`${schoolClass?.stage ?? ""} · ${schoolClass?.name ?? ""} · الرقم الأكاديمي ${student.academicId}`} />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="نسبة الحضور" value={`${attendance.rate}٪`} icon={ClipboardCheck} hint="حسب السجل المتاح" />
      <StatCard label="الرسوم المسددة" value={`${fees.percent}٪`} icon={Wallet} tone="success" hint={formatMoney(fees.paid)} />
      <StatCard label="المتبقي من الرسوم" value={formatMoney(fees.remaining)} icon={Wallet} tone="warning" />
      <StatCard label="حصص اليوم" value={todaySlots.length.toLocaleString("ar-EG")} icon={CalendarDays} />
    </div>
    <SectionTitle>الخدمات السريعة</SectionTitle>
    <QuickGrid items={[
      { label: "كشف الدرجات", to: "/app/grades", icon: Award },
      { label: "الجدول الدراسي", to: "/app/schedule", icon: CalendarDays },
      { label: "كشف الرسوم", to: "/app/fees", icon: Wallet },
      { label: "الحضور والغياب", to: "/app/attendance", icon: ClipboardCheck },
    ] as never} />
    <SectionTitle>{isToday ? "حصص اليوم" : `حصص يوم ${DAYS[day]} القادم`}</SectionTitle>
    {todaySlots.length ? <div className="grid gap-2.5 sm:grid-cols-2">{todaySlots.slice(0, 7).map((slot) => <SlotCard key={slot.id} slot={slot} s={s} />)}</div> : <p className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">لا توجد حصص مسجلة لهذا اليوم.</p>}
    <SectionTitle action={<Link to="/app/notices" className="text-xs font-bold text-primary">كل الإعلانات</Link>}>آخر الإعلانات</SectionTitle>
    <div className="grid gap-3 md:grid-cols-2">{notices.map((item) => <AnnouncementCard key={item.id} a={item} s={s} compact />)}</div>
  </div>;
}
