import { Link } from "@tanstack/react-router";
import { BookOpen, CalendarDays, ClipboardCheck, Users } from "lucide-react";

import { PageHeader, QuickGrid, SectionTitle, StatCard } from "@/components/school/bits";
import { SlotCard } from "@/components/school/shared";
import { useMe } from "@/components/school/useMe";
import { currentOrNextSchoolDay, DAYS } from "@/lib/school/logic";

export function TeacherHome() {
  const { s, me } = useMe();
  if (me.role !== "teacher") return null;
  const teacher = me.teacher;
  const classIds = new Set(teacher.classes ?? []);
  const assignedClasses = s.classes.filter((item) => classIds.has(item.id));
  const weeklySlots = s.slots.filter((slot) => slot.teacherId === teacher.id);
  const studentCount = s.students.filter((student) => classIds.has(student.classId) && student.status === "active").length;
  const homeworkCount = s.homework.filter((item) => item.teacherId === teacher.id).length;
  const { day, isToday } = currentOrNextSchoolDay(new Date());
  const todaySlots = weeklySlots.filter((slot) => slot.day === day).sort((a, b) => a.period - b.period);
  return <div className="animate-rise space-y-6">
    <PageHeader title={`مرحباً، ${teacher.name}`} subtitle={`${teacher.subject} · الرقم الوظيفي ${teacher.employeeId}`} />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="الفصول المسندة" value={assignedClasses.length.toLocaleString("ar-EG")} icon={Users} />
      <StatCard label="الطلبة" value={studentCount.toLocaleString("ar-EG")} icon={Users} />
      <StatCard label="النصاب الأسبوعي" value={weeklySlots.length.toLocaleString("ar-EG")} icon={CalendarDays} hint="حصة" />
      <StatCard label="الواجبات المنشورة" value={homeworkCount.toLocaleString("ar-EG")} icon={BookOpen} />
    </div>
    <SectionTitle>الخدمات السريعة</SectionTitle>
    <QuickGrid items={[
      { label: "الجدول الدراسي", to: "/app/schedule", icon: CalendarDays },
      { label: "رصد الحضور", to: "/app/attendance", icon: ClipboardCheck },
      { label: "دفتر الدرجات", to: "/app/grades", icon: BookOpen },
      { label: "الواجبات والدروس", to: "/app/homework", icon: BookOpen },
    ] as never} />
    <SectionTitle action={<Link to="/app/schedule" className="text-xs font-bold text-primary">الجدول الأسبوعي</Link>}>{isToday ? "حصصي اليوم" : `حصصي يوم ${DAYS[day]} القادم`}</SectionTitle>
    {todaySlots.length ? <div className="grid gap-2.5 sm:grid-cols-2">{todaySlots.map((slot) => <SlotCard key={slot.id} slot={slot} s={s} showClass />)}</div> : <p className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">لا توجد حصص مسجلة لهذا اليوم.</p>}
  </div>;
}
