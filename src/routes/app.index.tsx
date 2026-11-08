import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Award,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  Layers,
  Megaphone,
  PenSquare,
  Percent,
  Phone,
  Plus,
  Receipt,
  Search,
  Sparkles,
  UserCheck,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, Panel, ProgressBar, QuickGrid, SectionTitle, StatCard } from "@/components/school/bits";
import { BehaviorFeed, StudentReportCard, TeacherGradebookSection } from "@/components/school/Gradebook";
import { AnnouncementCard, Avatar, SlotCard } from "@/components/school/shared";
import { useMe } from "@/components/school/useMe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DAYS,
  attendanceStats,
  collectionRate,
  currentOrNextSchoolDay,
  daysUntil,
  feeSummary,
  formatDate,
  formatMoney,
} from "@/lib/school/logic";
import {
  addStudent,
  addTeacher,
  assignTeacherClasses,
  reviewReceipt,
  setActiveChild,
} from "@/lib/school/store";
import type { Role, SchoolState, Student, Teacher } from "@/lib/school/types";
import { cn } from "@/lib/utils";

interface AppIndexSearch {
  tab?: string | undefined;
}

export const Route = createFileRoute("/app/")({
  validateSearch: (search: Record<string, unknown>): AppIndexSearch => {
    const rawTab = search["tab"];
    return {
      tab: typeof rawTab === "string" ? rawTab : undefined,
    };
  },
  component: Home,
});

function Home() {
  const { me } = useMe();
  const search = Route.useSearch();
  const currentTab = search.tab || "overview";

  if (me.role === "student") return <StudentHome initialTab={currentTab} />;
  if (me.role === "parent") return <ParentHome initialTab={currentTab} />;
  if (me.role === "teacher") return <TeacherHome initialTab={currentTab} />;
  return <AdminHome initialTab={currentTab} />;
}

function visibleAnnouncements(s: SchoolState, classId?: string) {
  return s.announcements
    .filter((a) => a.audience === "all" || a.audience === classId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/* =========================================================================
   1. PORTAL: PARENT (بوابة ولي الأمر متعدد الأبناء)
   ========================================================================= */

function ParentHome({ initialTab }: { initialTab: string }) {
  const { s, me } = useMe();
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>(initialTab);

  if (me.role !== "parent") return null;

  const children = me.children;
  const activeChild = me.activeChild || children[0] || null;

  const childData = useMemo(() => {
    if (!activeChild) return null;
    const now = new Date();
    const cls = s.classes.find((c) => c.id === activeChild.classId);
    const att = attendanceStats(s.attendance, activeChild.id);
    const fees = feeSummary(activeChild, s.payments, s.installments);
    const { day, isToday } = currentOrNextSchoolDay(now);
    const slots = s.slots.filter((x) => x.classId === activeChild.classId && x.day === day).sort((a, b) => a.period - b.period);
    const childGrades = s.gradesList.filter((g) => g.studentId === activeChild.id);
    const behavior = s.behaviorRecords.filter((b) => b.studentId === activeChild.id);
    const nextExam = s.events
      .filter((e) => e.type === "exam" && (e.classId === "all" || e.classId === activeChild.classId) && daysUntil(e.date, now) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date))[0];

    return { cls, att, fees, day, isToday, slots, childGrades, behavior, nextExam, now };
  }, [s, activeChild]);

  if (!activeChild || !childData) {
    return (
      <div className="p-8 text-center bg-card rounded-2xl border">
        لا يوجد أبناء مرتبطين بهذا الحساب حالياً. يرجى التواصل مع إدارة المدرسة.
      </div>
    );
  }

  return (
    <div className="animate-rise space-y-6">
      {/* Parent Greeting & Child Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-3xl border shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-soft text-navy font-bold text-xs">
              {children.length}
            </span>
            <h1 className="font-display text-xl font-bold text-navy">
              بوابة ولي الأمر — متابعة الأبناء
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            مرحباً بك {me.name} · حدد الابن لمتابعة نتائجه وحضوره ورسومه الدراسية
          </p>
        </div>

        {/* Child Selector Pills */}
        <div className="flex overflow-x-auto gap-1.5 pb-1 no-scrollbar">
          {children.map((child) => {
            const isSelected = child.id === activeChild.id;
            const childCls = s.classes.find((c) => c.id === child.classId);
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => {
                  setActiveChild(child.id);
                  toast.success(`تم التبديل لمتابعة: ${child.name}`);
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-foreground border-border hover:bg-muted",
                )}
              >
                <Avatar name={child.name} className="h-6 w-6 text-[10px]" />
                <div className="text-start leading-tight">
                  <div className="font-bold">{child.name.split(" ").slice(0, 2).join(" ")}</div>
                  <div className={cn("text-[10px]", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {childCls?.short || "طالب"}
                  </div>
                </div>
                {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-gold shrink-0 ms-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto gap-2 pb-2 no-scrollbar">
        <Button
          variant={tab === "overview" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("overview");
            navigate({ to: "/app" });
          }}
          className="rounded-xl text-xs font-bold"
        >
          نظرة عامة
        </Button>
        <Button
          variant={tab === "grades" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("grades");
            navigate({ to: "/app", search: { tab: "grades" } as any });
          }}
          className="gap-2 rounded-xl text-xs font-bold"
        >
          <Award className="h-3.5 w-3.5" />
          كشف الدرجات والشهادة ({childData.childGrades.length})
        </Button>
        <Button
          variant={tab === "behavior" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("behavior");
            navigate({ to: "/app", search: { tab: "behavior" } as any });
          }}
          className="gap-2 rounded-xl text-xs font-bold"
        >
          <Sparkles className="h-3.5 w-3.5" />
          السجل التربوي والسلوكي ({childData.behavior.length})
        </Button>
      </div>

      {/* TAB: GRADES */}
      {tab === "grades" && (
        <StudentReportCard
          student={activeChild}
          grades={s.gradesList}
          classes={s.classes}
        />
      )}

      {/* TAB: BEHAVIOR */}
      {tab === "behavior" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold text-navy">
              السجل التربوي والتوجيهي — {activeChild.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              متابعة الإشادات بالسلوك والتفوق والتوجيهات الانضباطية المسجلة من إدارة المدرسة وهيئة التدريس
            </p>
          </div>
          <BehaviorFeed records={childData.behavior} />
        </div>
      )}

      {/* TAB: OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Active Child Profile Card */}
          <div className="relative overflow-hidden rounded-3xl bg-hero p-5 text-hero-foreground shadow-elevated">
            <div className="pattern-geo absolute inset-0 opacity-40" />
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <Avatar name={activeChild.name} className="h-16 w-16 text-2xl" />
                  <div>
                    <div className="font-display text-xl sm:text-2xl font-bold">{activeChild.name}</div>
                    <div className="text-sm text-hero-foreground/80 mt-0.5">
                      {childData.cls?.stage} — {childData.cls?.name}
                    </div>
                    <div className="mt-1 text-xs text-hero-foreground/75 flex items-center gap-2">
                      <span>الرقم الأكاديمي:</span>
                      <span dir="ltr" className="font-mono font-bold text-gold">{activeChild.academicId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild size="sm" variant="gold" className="text-xs font-bold">
                    <Link to="/app/fees">
                      <Wallet className="h-3.5 w-3.5 me-1" />
                      سداد الرسوم عبر بنكك
                    </Link>
                  </Button>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-hero-foreground/10 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-hero-foreground/70">
                    <UserCheck className="h-3.5 w-3.5 text-gold" /> نسبة الحضور
                  </div>
                  <div className="mt-1 text-2xl font-extrabold">{childData.att.rate.toLocaleString("ar-EG")}٪</div>
                  <div className="text-[11px] text-hero-foreground/70 mt-0.5">
                    غياب: {childData.att.absent} · تأخير: {childData.att.late}
                  </div>
                </div>

                <div className="rounded-2xl bg-hero-foreground/10 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-hero-foreground/70">
                    <Wallet className="h-3.5 w-3.5 text-gold" /> الرسوم المسددة
                  </div>
                  <div className="mt-1 text-2xl font-extrabold">{childData.fees.percent.toLocaleString("ar-EG")}٪</div>
                  <ProgressBar value={childData.fees.percent} className="mt-2 h-1.5 bg-hero-foreground/15" />
                </div>

                <div className="rounded-2xl bg-hero-foreground/10 p-3 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-1.5 text-xs text-hero-foreground/70">
                    <Award className="h-3.5 w-3.5 text-gold" /> التحصيل الأكاديمي
                  </div>
                  <div className="mt-1 text-2xl font-extrabold">
                    {childData.childGrades.length > 0 ? "ممتاز" : "قيد الرصد"}
                  </div>
                  <div className="text-[11px] text-hero-foreground/70 mt-0.5">
                    {childData.childGrades.length} مواد مرصودة
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Services */}
          <SectionTitle>خدمات المتابعة السريعة للابن</SectionTitle>
          <QuickGrid
            items={[
              { label: "كشف الدرجات", to: "/app", icon: Award },
              { label: "الرسوم وسداد بنكك", to: "/app/fees", icon: Receipt },
              { label: "الجدول الدراسي", to: "/app/schedule", icon: CalendarClock },
              { label: "حضور الابن", to: "/app/attendance", icon: UserCheck },
              { label: "الواجبات والمذكرات", to: "/app/homework", icon: BookOpen },
              { label: "التقويم والامتحانات", to: "/app/calendar", icon: CalendarDays },
            ]}
          />

          {/* Today's Schedule Preview */}
          <SectionTitle
            action={
              <Link to="/app/schedule" className="flex items-center text-xs font-bold text-gold hover:underline">
                عرض الجدول الأسبوعي <ChevronLeft className="h-4 w-4" />
              </Link>
            }
          >
            {childData.isToday ? "حصص اليوم الدراسي" : `حصص يوم ${DAYS[childData.day]} القادم`}
          </SectionTitle>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {childData.slots.slice(0, 4).map((sl) => (
              <SlotCard key={sl.id} slot={sl} s={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   2. PORTAL: STUDENT (بوابة الطالب)
   ========================================================================= */

function StudentHome({ initialTab }: { initialTab: string }) {
  const { s, me } = useMe();
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>(initialTab);

  const st = me.role === "student" ? me.student : null;
  const data = useMemo(() => {
    if (!st) return null;
    const now = new Date();
    const cls = s.classes.find((c) => c.id === st.classId)!;
    const att = attendanceStats(s.attendance, st.id);
    const fees = feeSummary(st, s.payments, s.installments);
    const { day, isToday } = currentOrNextSchoolDay(now);
    const slots = s.slots.filter((x) => x.classId === st.classId && x.day === day).sort((a, b) => a.period - b.period);
    const studentGrades = s.gradesList.filter((g) => g.studentId === st.id);
    const behavior = s.behaviorRecords.filter((b) => b.studentId === st.id);
    const pendingHw = s.homework.filter(
      (h) => h.classId === st.classId && h.kind === "homework" && daysUntil(h.dueDate, now) >= 0 && !s.completedHomework.includes(`${st.id}:${h.id}`),
    ).length;
    const urgent = visibleAnnouncements(s, st.classId).filter((a) => a.category === "urgent").length;
    const nextExam = s.events
      .filter((e) => e.type === "exam" && (e.classId === "all" || e.classId === st.classId) && daysUntil(e.date, now) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date))[0];

    return { cls, att, fees, day, isToday, slots, pendingHw, urgent, nextExam, now, studentGrades, behavior };
  }, [s, st]);

  if (!st || !data) return null;

  return (
    <div className="animate-rise space-y-6">
      {/* Tabs */}
      <div className="flex border-b overflow-x-auto gap-2 pb-2 no-scrollbar">
        <Button
          variant={tab === "overview" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("overview");
            navigate({ to: "/app" });
          }}
          className="rounded-xl text-xs font-bold"
        >
          الرئيسية
        </Button>
        <Button
          variant={tab === "grades" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("grades");
            navigate({ to: "/app", search: { tab: "grades" } as any });
          }}
          className="gap-2 rounded-xl text-xs font-bold"
        >
          <Award className="h-3.5 w-3.5" />
          كشف الدرجات والشهادة ({data.studentGrades.length})
        </Button>
        <Button
          variant={tab === "behavior" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("behavior");
            navigate({ to: "/app", search: { tab: "behavior" } as any });
          }}
          className="gap-2 rounded-xl text-xs font-bold"
        >
          <Sparkles className="h-3.5 w-3.5" />
          السجل التربوي ({data.behavior.length})
        </Button>
      </div>

      {tab === "grades" && (
        <StudentReportCard
          student={st}
          grades={s.gradesList}
          classes={s.classes}
        />
      )}

      {tab === "behavior" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold text-navy">
              السجل التربوي والسلوكي — {st.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              سجل التميز والأنشطة والتوجيهات الصادرة من إدارة المدرسة
            </p>
          </div>
          <BehaviorFeed records={data.behavior} />
        </div>
      )}

      {tab === "overview" && (
        <div className="space-y-6">
          {/* Profile hero card */}
          <div className="relative overflow-hidden rounded-3xl bg-hero p-5 text-hero-foreground shadow-elevated">
            <div className="pattern-geo absolute inset-0 opacity-40" />
            <div className="relative">
              <div className="flex items-center gap-4">
                <Avatar name={st.name} className="h-16 w-16 text-2xl" />
                <div className="min-w-0">
                  <div className="font-display text-xl sm:text-2xl font-bold">{st.name}</div>
                  <div className="text-sm text-hero-foreground/80 mt-0.5">
                    {data.cls.stage} — {data.cls.name}
                  </div>
                  <div className="mt-1 text-xs text-hero-foreground/75 flex items-center gap-2">
                    <span>الرقم الأكاديمي:</span>
                    <span dir="ltr" className="font-mono font-bold text-gold">{st.academicId}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-hero-foreground/10 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-hero-foreground/70">
                    <UserCheck className="h-3.5 w-3.5 text-gold" /> نسبة الحضور
                  </div>
                  <div className="mt-1 text-2xl font-extrabold">{data.att.rate.toLocaleString("ar-EG")}٪</div>
                </div>
                <div className="rounded-2xl bg-hero-foreground/10 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-hero-foreground/70">
                    <Wallet className="h-3.5 w-3.5 text-gold" /> الرسوم المسددة
                  </div>
                  <div className="mt-1 text-2xl font-extrabold">{data.fees.percent.toLocaleString("ar-EG")}٪</div>
                  <ProgressBar value={data.fees.percent} className="mt-2 h-1.5 bg-hero-foreground/15" />
                </div>
              </div>
            </div>
          </div>

          <SectionTitle>الخدمات السريعة</SectionTitle>
          <QuickGrid
            items={[
              { label: "كشف درجاتي", to: "/app", icon: Award },
              { label: "الجدول الدراسي", to: "/app/schedule", icon: CalendarClock },
              { label: "الرسوم وسداد بنكك", to: "/app/fees", icon: Receipt },
              { label: "الواجبات والدروس", to: "/app/homework", icon: BookOpen, badge: data.pendingHw },
              { label: "الحضور والغياب", to: "/app/attendance", icon: UserCheck },
              { label: "التقويم والامتحانات", to: "/app/calendar", icon: CalendarDays },
            ]}
          />

          {data.nextExam && (
            <Link to="/app/calendar" className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold-soft/30 p-4 hover:border-gold transition-all">
              <Award className="h-6 w-6 shrink-0 text-gold" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">الامتحان القادم المقرر</div>
                <div className="truncate font-bold text-foreground text-sm">{data.nextExam.title}</div>
              </div>
              <div className="text-start text-xs font-bold text-navy bg-gold-soft px-2.5 py-1 rounded-lg">
                بعد {daysUntil(data.nextExam.date, data.now).toLocaleString("ar-EG")} يوم
              </div>
            </Link>
          )}

          <SectionTitle
            action={
              <Link to="/app/schedule" className="flex items-center text-xs font-bold text-gold hover:underline">
                عرض الجدول كاملاً <ChevronLeft className="h-4 w-4" />
              </Link>
            }
          >
            {data.isToday ? "حصص اليوم الدراسي" : `حصص يوم ${DAYS[data.day]} القادم`}
          </SectionTitle>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {data.slots.slice(0, 4).map((sl) => (
              <SlotCard key={sl.id} slot={sl} s={s} />
            ))}
          </div>

          <SectionTitle
            action={
              <Link to="/app/notices" className="flex items-center text-xs font-bold text-gold hover:underline">
                كافة الإعلانات <ChevronLeft className="h-4 w-4" />
              </Link>
            }
          >
            آخر الإعلانات والتوجيهات المدرسية
          </SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            {visibleAnnouncements(s, st.classId)
              .slice(0, 2)
              .map((a) => (
                <AnnouncementCard key={a.id} a={a} s={s} compact />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   3. PORTAL: TEACHER (بوابة المعلم)
   ========================================================================= */

function TeacherHome({ initialTab }: { initialTab: string }) {
  const { s, me } = useMe();
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>(initialTab);

  const t = me.role === "teacher" ? me.teacher : null;
  const data = useMemo(() => {
    if (!t) return null;
    const { day, isToday } = currentOrNextSchoolDay(new Date());
    const mySlots = s.slots.filter((x) => x.teacherId === t.id);
    const today = mySlots.filter((x) => x.day === day).sort((a, b) => a.period - b.period);
    const classIds = Array.from(new Set(mySlots.map((x) => x.classId)));
    const studentsCount = s.students.filter((x) => classIds.includes(x.classId)).length;
    const posted = s.homework.filter((h) => h.teacherId === t.id).length;
    return { day, isToday, today, classIds, studentsCount, posted, weekly: mySlots.length };
  }, [s, t]);

  if (!t || !data) return null;

  return (
    <div className="animate-rise space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b overflow-x-auto gap-2 pb-2 no-scrollbar">
        <Button
          variant={tab === "overview" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("overview");
            navigate({ to: "/app" });
          }}
          className="rounded-xl text-xs font-bold"
        >
          لوحة المعلم
        </Button>
        <Button
          variant={tab === "grades" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("grades");
            navigate({ to: "/app", search: { tab: "grades" } as any });
          }}
          className="gap-2 rounded-xl text-xs font-bold"
        >
          <Award className="h-3.5 w-3.5" />
          دفتر رصد الدرجات
        </Button>
        <Button
          variant={tab === "students" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("students");
            navigate({ to: "/app", search: { tab: "students" } as any });
          }}
          className="gap-2 rounded-xl text-xs font-bold"
        >
          <Users className="h-3.5 w-3.5" />
          متابعة الفصول والطلاب
        </Button>
        <Button
          variant={tab === "teachers" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("teachers");
            navigate({ to: "/app", search: { tab: "teachers" } as any });
          }}
          className="gap-2 rounded-xl text-xs font-bold"
        >
          <GraduationCap className="h-3.5 w-3.5" />
          دليل أساتذة المواد
        </Button>
      </div>

      {tab === "grades" && (
        <TeacherGradebookSection
          classes={s.classes}
          students={s.students}
          grades={s.gradesList}
          teachers={s.teachers}
          activeTeacher={t}
        />
      )}

      {tab === "students" && <StudentsDirectorySection />}
      {tab === "teachers" && <TeachersDirectorySection />}

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl bg-hero p-5 text-hero-foreground shadow-elevated">
            <div className="pattern-geo absolute inset-0 opacity-40" />
            <div className="relative flex items-center gap-4">
              <Avatar name={t.name} className="h-16 w-16 text-2xl" />
              <div>
                <div className="font-display text-xl font-bold">{t.name}</div>
                <div className="text-sm text-hero-foreground/80">أستاذ مادة {t.subject}</div>
                <div className="mt-1 text-xs text-hero-foreground/70 flex items-center gap-2">
                  <span>الرقم الوظيفي:</span>
                  <span dir="ltr" className="font-mono font-bold text-gold">{t.employeeId}</span>
                </div>
              </div>
            </div>
            <div className="relative mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { v: data.today.length, l: data.isToday ? "حصص اليوم" : "حصص الأحد" },
                { v: data.classIds.length, l: "فصول مسندة" },
                { v: data.studentsCount, l: "طالب تحت الإشراف" },
              ].map((x) => (
                <div key={x.l} className="rounded-2xl bg-hero-foreground/10 p-2.5">
                  <div className="text-xl font-extrabold">{x.v.toLocaleString("ar-EG")}</div>
                  <div className="text-[11px] text-hero-foreground/75">{x.l}</div>
                </div>
              ))}
            </div>
          </div>

          <SectionTitle>الخدمات السريعة</SectionTitle>
          <QuickGrid
            items={[
              { label: "جدولي الأسبوعي", to: "/app/schedule", icon: CalendarClock },
              { label: "رصد الحضور والغياب", to: "/app/attendance", icon: ClipboardCheck },
              { label: "نشر واجب أو تنبيه", to: "/app/homework", icon: PenSquare },
              { label: "الإعلانات واللوائح", to: "/app/notices", icon: Megaphone },
              { label: "التقويم والامتحانات", to: "/app/calendar", icon: Award },
              { label: "الملف الشخصي", to: "/app/profile", icon: UserCircle },
            ]}
          />

          <SectionTitle
            action={
              <Link to="/app/schedule" className="flex items-center text-xs font-bold text-gold hover:underline">
                عرض الجدول كاملاً <ChevronLeft className="h-4 w-4" />
              </Link>
            }
          >
            {data.isToday ? "حصصي المقررة اليوم" : "حصصي المقررة يوم الأحد"}
          </SectionTitle>
          {data.today.length === 0 ? (
            <EmptyState icon={CalendarDays} title="لا توجد حصص مجدولة لهذا اليوم" />
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {data.today.map((sl) => (
                <SlotCard key={sl.id} slot={sl} s={s} showClass />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button asChild className="bg-primary hover:bg-navy font-bold py-6 text-sm" size="lg">
              <Link to="/app/attendance">
                <ClipboardCheck className="h-5 w-5 me-2" />
                رصد غياب وحضور اليوم
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTab("grades");
                navigate({ to: "/app", search: { tab: "grades" } as any });
              }}
              className="font-bold py-6 text-sm border-gold text-navy hover:bg-gold-soft"
              size="lg"
            >
              <Award className="h-5 w-5 me-2 text-gold" />
              فتح دفتر رصد الدرجات
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   4. PORTAL: ADMIN (بوابة إدارة المدرسة)
   ========================================================================= */

function AdminHome({ initialTab }: { initialTab: string }) {
  const { s } = useMe();
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>(initialTab);

  const pending = s.receipts.filter((r) => r.status === "pending");
  const rate = collectionRate(s.students, s.payments);
  const totalAtt = attendanceStats(s.attendance);

  return (
    <div className="animate-rise space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">لوحة إدارة مؤسسة المنهل التعليمية</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          إشراف شامل على المراحل الابتدائية والمتوسطة والثانوية، والتحصيل المالي ورصد الامتحانات — {formatDate(new Date().toISOString(), { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto gap-2 pb-2 no-scrollbar">
        <Button
          variant={tab === "overview" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("overview");
            navigate({ to: "/app" });
          }}
          className="rounded-xl text-xs font-bold"
        >
          نظرة عامة
        </Button>
        <Button
          variant={tab === "grades" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("grades");
            navigate({ to: "/app", search: { tab: "grades" } as any });
          }}
          className="gap-2 rounded-xl text-xs font-bold"
        >
          <Award className="h-3.5 w-3.5" />
          دفتر الدرجات والامتحانات
        </Button>
        <Button
          variant={tab === "students" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("students");
            navigate({ to: "/app", search: { tab: "students" } as any });
          }}
          className="gap-2 rounded-xl text-xs font-bold"
        >
          <Users className="h-3.5 w-3.5" />
          الطلاب والمراحل ({s.students.length})
        </Button>
        <Button
          variant={tab === "teachers" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("teachers");
            navigate({ to: "/app", search: { tab: "teachers" } as any });
          }}
          className="gap-2 rounded-xl text-xs font-bold"
        >
          <GraduationCap className="h-3.5 w-3.5" />
          أساتذة المواد ({s.teachers.length})
        </Button>
      </div>

      {tab === "grades" && (
        <TeacherGradebookSection
          classes={s.classes}
          students={s.students}
          grades={s.gradesList}
          teachers={s.teachers}
        />
      )}

      {tab === "students" && <StudentsDirectorySection />}
      {tab === "teachers" && <TeachersDirectorySection />}

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="إجمالي الطلاب بالمراحل"
              value={s.students.length.toLocaleString("ar-EG")}
              icon={Users}
              hint="ابتدائي · متوسط · ثانوي"
            />
            <StatCard
              label="هيئة التدريس"
              value={s.teachers.length.toLocaleString("ar-EG")}
              icon={GraduationCap}
              tone="gold"
              hint="تغطية كافة المواد"
            />
            <StatCard
              label="نسبة تحصيل الرسوم"
              value={`${rate.toLocaleString("ar-EG")}٪`}
              icon={Percent}
              tone="success"
              hint={pending.length > 0 ? `${pending.length} إشعار بنكك للمراجعة` : "لا توجد معلقات"}
            />
            <StatCard
              label="نسبة الحضور العامة"
              value={`${totalAtt.rate.toLocaleString("ar-EG")}٪`}
              icon={UserCheck}
              tone="warning"
              hint="آخر 20 يوم دراسي"
            />
          </div>

          <SectionTitle>إدارة سريعة</SectionTitle>
          <QuickGrid
            items={[
              { label: "رصد الدرجات", to: "/app", icon: Award },
              { label: "إدارة الرسوم وسداد بنكك", to: "/app/fees", icon: Wallet, badge: pending.length },
              { label: "الإعلانات واللوائح", to: "/app/notices", icon: Megaphone },
              { label: "الجداول الدراسية", to: "/app/schedule", icon: CalendarClock },
              { label: "متابعة الحضور", to: "/app/attendance", icon: UserCheck },
              { label: "التقويم والامتحانات", to: "/app/calendar", icon: CalendarDays },
            ]}
          />

          {/* Pending Bankak Receipts with Transaction ID */}
          <SectionTitle
            action={
              <Link to="/app/fees" className="flex items-center text-xs font-bold text-gold hover:underline">
                إدارة الرسوم بالكامل <ChevronLeft className="h-4 w-4" />
              </Link>
            }
          >
            إشعارات بنكك بانتظار التدقيق والمطابقة ({pending.length})
          </SectionTitle>
          {pending.length === 0 ? (
            <EmptyState icon={FileCheck2} title="لا توجد إشعارات دفع معلقة" text="تمت مراجعة جميع سندات تحويل بنكك" />
          ) : (
            <div className="space-y-2.5">
              {pending.map((r) => {
                const st = s.students.find((x) => x.id === r.studentId);
                const cls = s.classes.find((c) => c.id === st?.classId);
                return (
                  <Panel key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-s-4 border-s-warning">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">{st?.name}</span>
                        <Badge variant="outline" className="text-[10px]">{cls?.short}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-3">
                        <span className="font-bold text-navy">{formatMoney(r.amount)}</span>
                        <span>مرجع: <span dir="ltr" className="font-mono font-bold">{r.reference}</span></span>
                        {r.transactionId && (
                          <span className="bg-gold-soft px-2 py-0.5 rounded text-[11px] font-bold text-navy">
                            رقم عملية بنكك: <span dir="ltr" className="font-mono">{r.transactionId}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="success" onClick={() => reviewReceipt(r.id, "approved")} className="text-xs font-bold">
                        اعتماد ومطابقة
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reviewReceipt(r.id, "rejected")} className="text-xs text-destructive hover:bg-danger-soft">
                        رفض
                      </Button>
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   5. SECTIONS: STUDENTS DIRECTORY & TEACHERS DIRECTORY
   ========================================================================= */

function StudentsDirectorySection() {
  const { s, me } = useMe();
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [addStudentOpen, setAddStudentOpen] = useState(false);

  // New Student State
  const [name, setName] = useState("");
  const [academicId, setAcademicId] = useState("");
  const [classId, setClassId] = useState<string>(s.classes[0]?.id || "c1a");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [totalFees, setTotalFees] = useState("850000");

  const filteredClasses = useMemo(() => {
    if (selectedStage === "all") return s.classes;
    return s.classes.filter((c) => c.stageId === selectedStage);
  }, [s.classes, selectedStage]);

  const filtered = useMemo(() => {
    return s.students.filter((st) => {
      const cls = s.classes.find((c) => c.id === st.classId);
      const matchStage = selectedStage === "all" || cls?.stageId === selectedStage;
      const matchClass = selectedClass === "all" || st.classId === selectedClass;
      const matchSearch =
        !search.trim() ||
        st.name.toLowerCase().includes(search.toLowerCase()) ||
        st.academicId.toLowerCase().includes(search.toLowerCase());
      return matchStage && matchClass && matchSearch;
    });
  }, [s.students, s.classes, selectedStage, selectedClass, search]);

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !academicId.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    addStudent({
      name: name.trim(),
      academicId: academicId.trim(),
      classId,
      parentName: parentName.trim() || "ولي أمر الطالب",
      parentPhone: parentPhone.trim() || "0912 000 000",
      totalFees: Number(totalFees) || 850000,
    });

    toast.success(`تمت إضافة الطالب ${name} بنجاح إلى الفصل`);
    setAddStudentOpen(false);
    setName("");
    setAcademicId("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border shadow-card">
        <div>
          <h2 className="font-display text-lg font-bold text-navy">دليل ومتابعة الطلاب بالمراحل</h2>
          <p className="text-xs text-muted-foreground">
            استعراض ملفات الطلاب ونسب الحضور وموقف الرسوم لجميع المراحل
          </p>
        </div>

        {me.role === "admin" && (
          <Button onClick={() => setAddStudentOpen(true)} className="gap-2 bg-primary hover:bg-navy font-bold text-xs">
            <Plus className="h-4 w-4" />
            إضافة طالب جديد
          </Button>
        )}
      </div>

      {/* Stage Selector, Class Filter & Search */}
      <div className="flex flex-col gap-3">
        {/* Stage Filter */}
        <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setSelectedStage("all");
              setSelectedClass("all");
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border",
              selectedStage === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:bg-muted",
            )}
          >
            كافة المراحل
          </button>
          {s.stages.map((stg) => (
            <button
              key={stg.id}
              type="button"
              onClick={() => {
                setSelectedStage(stg.id);
                setSelectedClass("all");
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border",
                selectedStage === stg.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {stg.name}
            </button>
          ))}
        </div>

        {/* Classes & Search row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex overflow-x-auto gap-1.5 pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedClass("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
                selectedClass === "all"
                  ? "bg-gold-soft text-navy font-extrabold"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted",
              )}
            >
              كل الفصول ({filtered.length})
            </button>
            {filteredClasses.map((c) => {
              const count = s.students.filter((st) => st.classId === c.id).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedClass(c.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
                    selectedClass === c.id
                      ? "bg-gold-soft text-navy font-extrabold"
                      : "bg-card border border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {c.short} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="absolute end-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="بحث بالاسم أو الرقم الأكاديمي..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full sm:w-64 pe-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <Panel className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-muted/40 border-b">
              <tr className="text-xs text-muted-foreground">
                <th className="py-3 px-4 text-start">الطالب والرقم الأكاديمي</th>
                <th className="py-3 px-4 text-start">المرحلة والفصل</th>
                <th className="py-3 px-4 text-start">ولي الأمر والهاتف</th>
                <th className="py-3 px-4 text-start">نسبة الحضور</th>
                <th className="py-3 px-4 text-start">حالة الرسوم</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((st) => {
                const cls = s.classes.find((c) => c.id === st.classId);
                const att = attendanceStats(s.attendance, st.id);
                const fees = feeSummary(st, s.payments, s.installments);

                return (
                  <tr key={st.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground text-sm">{st.name}</div>
                      <div className="text-xs font-mono text-gold mt-0.5" dir="ltr">
                        {st.academicId}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-foreground">
                      <div>{cls?.name}</div>
                      <div className="text-[11px] text-muted-foreground">{cls?.stage}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      <div className="font-semibold text-foreground">{st.parentName}</div>
                      <div dir="ltr" className="font-mono text-muted-foreground mt-0.5">
                        {st.parentPhone}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs">{att.rate.toLocaleString("ar-EG")}٪</span>
                        <Badge
                          variant={att.rate >= 85 ? "success" : att.rate >= 75 ? "warning" : "danger"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {att.rate >= 85 ? "منتظم" : "تنبيه"}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs">
                        <span className="font-bold text-foreground">{fees.percent}٪</span>
                        <span className="text-muted-foreground ms-1">({formatMoney(fees.paid)})</span>
                        <div className="mt-1">
                          {fees.remaining === 0 ? (
                            <Badge variant="success" className="text-[10px]">مكتمل</Badge>
                          ) : (
                            <Badge variant="warning" className="text-[10px]">متبقي {formatMoney(fees.remaining)}</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Add Student Dialog */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة طالب جديد للمدرسة</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div className="space-y-1.5">
              <Label>اسم الطالب رباعياً</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: حسام الدين طارق حسن النور"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الرقم الأكاديمي</Label>
                <Input
                  value={academicId}
                  onChange={(e) => setAcademicId(e.target.value)}
                  placeholder="MNH-2026-0350"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>الفصل الدراسي</Label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
                >
                  {s.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.stage})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>اسم ولي الأمر</Label>
                <Input
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="طارق حسن ميرغني"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>رقم هاتف ولي الأمر</Label>
                <Input
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="0912 345 678"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>إجمالي الرسوم السنوية المقررة (ج.س)</Label>
              <Input
                type="number"
                value={totalFees}
                onChange={(e) => setTotalFees(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setAddStudentOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">تسجيل الطالب</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeachersDirectorySection() {
  const { s, me } = useMe();
  const [addTeacherOpen, setAddTeacherOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [assignedClassesState, setAssignedClassesState] = useState<string[]>([]);

  // Add Teacher form state
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [subject, setSubject] = useState("");
  const [phone, setPhone] = useState("");

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    addTeacher({
      name: name.startsWith("أ.") ? name.trim() : `أ. ${name.trim()}`,
      employeeId: employeeId.trim() || `T-${110 + s.teachers.length}`,
      subject: subject.trim(),
      phone: phone.trim() || "0912 345 000",
      classes: ["c1a", "c1b"],
    });

    toast.success("تمت إضافة أستاذ المادة بنجاح");
    setAddTeacherOpen(false);
    setName("");
    setEmployeeId("");
    setSubject("");
  };

  const openAssignModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setAssignedClassesState(teacher.classes || []);
    setAssignDialogOpen(true);
  };

  const handleSaveAssignments = () => {
    if (selectedTeacher) {
      assignTeacherClasses(selectedTeacher.id, assignedClassesState);
      toast.success(`تم تحديث الفصول المسندة للأستاذ ${selectedTeacher.name}`);
      setAssignDialogOpen(false);
    }
  };

  const toggleClassAssignment = (cid: string) => {
    setAssignedClassesState((prev) =>
      prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid],
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border shadow-card">
        <div>
          <h2 className="font-display text-lg font-bold text-navy">دليل أساتذة المواد والتخصصات</h2>
          <p className="text-xs text-muted-foreground">
            قائمة أساتذة المواد والمقررات، أرقام التواصل، والفصول المسندة إلى كل أستاذ عبر كافة المراحل
          </p>
        </div>

        {me.role === "admin" && (
          <Button onClick={() => setAddTeacherOpen(true)} className="gap-2 bg-primary hover:bg-navy font-bold text-xs">
            <Plus className="h-4 w-4" />
            إضافة أستاذ جديد
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {s.teachers.map((teacher) => {
          const assigned = teacher.classes || [];

          return (
            <div
              key={teacher.id}
              className="flex flex-col justify-between rounded-2xl border bg-card p-4 shadow-card hover:border-gold transition-all"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-soft font-display text-lg font-bold text-navy">
                    {teacher.name.replace(/^أ\.\s*/, "").slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold text-foreground truncate text-base">
                      {teacher.name}
                    </h3>
                    <Badge variant="gold" className="text-xs mt-0.5 font-semibold">
                      مادة {teacher.subject}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3.5 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">الرقم الوظيفي:</span>
                    <span dir="ltr" className="font-mono">{teacher.employeeId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-gold" />
                    <span dir="ltr" className="font-mono">{teacher.phone}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t">
                  <span className="text-xs font-bold text-muted-foreground block mb-1.5">
                    الفصول الدراسية المسندة:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {assigned.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">لم تسند فصول بعد</span>
                    ) : (
                      assigned.map((cid) => {
                        const cls = s.classes.find((c) => c.id === cid);
                        return (
                          <Badge key={cid} variant="outline" className="text-[10px]">
                            {cls?.short || cid}
                          </Badge>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {me.role === "admin" && (
                <div className="mt-4 pt-3 border-t flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAssignModal(teacher)}
                    className="text-xs font-bold"
                  >
                    إسناد الفصول
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Teacher Dialog */}
      <Dialog open={addTeacherOpen} onOpenChange={setAddTeacherOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة أستاذ مادة جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTeacher} className="space-y-4">
            <div className="space-y-1.5">
              <Label>اسم الأستاذ / المعلم</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أ. فاروق عبدالكريم"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الرقم الوظيفي</Label>
                <Input
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="T-115"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>المادة والتخصص</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثال: التاريخ"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>رقم الهاتف للتواصل</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                required
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setAddTeacherOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">إضافة المعلم</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Classes Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إسناد الفصول الدراسية — {selectedTeacher?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              حدد الفصول التي يقوم المعلم بتدريس مادة {selectedTeacher?.subject} لها:
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {s.classes.map((c) => {
                const isSelected = assignedClassesState.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleClassAssignment(c.id)}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all text-start",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:bg-muted",
                    )}
                  >
                    <span>{c.name}</span>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-gold" />}
                  </button>
                );
              })}
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveAssignments}>حفظ التعيينات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
