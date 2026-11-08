import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
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
  UserCheck,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, Panel, ProgressBar, QuickGrid, SectionTitle, StatCard } from "@/components/school/bits";
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

  if (me.role === "student") return <StudentHome />;
  if (me.role === "teacher") return <TeacherHome initialTab={currentTab} />;
  return <AdminHome initialTab={currentTab} />;
}

function visibleAnnouncements(s: SchoolState, classId?: string) {
  return s.announcements
    .filter((a) => a.audience === "all" || a.audience === classId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function StudentHome() {
  const { s, me } = useMe();
  const st = me.role === "student" ? me.student : null;
  const data = useMemo(() => {
    if (!st) return null;
    const now = new Date();
    const cls = s.classes.find((c) => c.id === st.classId)!;
    const att = attendanceStats(s.attendance, st.id);
    const fees = feeSummary(st, s.payments, s.installments);
    const { day, isToday } = currentOrNextSchoolDay(now);
    const slots = s.slots.filter((x) => x.classId === st.classId && x.day === day).sort((a, b) => a.period - b.period);
    const pendingHw = s.homework.filter(
      (h) => h.classId === st.classId && h.kind === "homework" && daysUntil(h.dueDate, now) >= 0 && !s.completedHomework.includes(`${st.id}:${h.id}`),
    ).length;
    const urgent = visibleAnnouncements(s, st.classId).filter((a) => a.category === "urgent").length;
    const nextExam = s.events
      .filter((e) => e.type === "exam" && (e.classId === "all" || e.classId === st.classId) && daysUntil(e.date, now) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    return { cls, att, fees, day, isToday, slots, pendingHw, urgent, nextExam, now };
  }, [s, st]);
  if (!st || !data) return null;

  return (
    <div className="animate-rise space-y-6">
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
          { label: "الجداول الدراسية", to: "/app/schedule", icon: CalendarClock },
          { label: "الرسوم والمدفوعات", to: "/app/fees", icon: Receipt },
          { label: "الإعلانات واللوائح", to: "/app/notices", icon: Megaphone, badge: data.urgent },
          { label: "الواجبات والدروس", to: "/app/homework", icon: BookOpen, badge: data.pendingHw },
          { label: "الحضور والغياب", to: "/app/attendance", icon: UserCheck },
          { label: "التقويم والامتحانات", to: "/app/calendar", icon: Award },
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
  );
}

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
          className="gap-2 rounded-xl text-xs font-bold"
        >
          لوحة المعلم
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

      {tab === "students" && <StudentsDirectorySection />}
      {tab === "teachers" && <TeachersDirectorySection />}

      {tab === "overview" && (
        <>
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

          <Button asChild className="w-full bg-primary hover:bg-navy font-bold py-6 text-base" size="lg">
            <Link to="/app/attendance">
              <ClipboardCheck className="h-5 w-5 me-2" />
              رصد غياب وحضور حصة اليوم
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">لوحة إدارة المدرسة</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            متابعة شاملة لشؤون الطلاب، أعضاء هيئة التدريس، والتحصيل المالي — {formatDate(new Date().toISOString(), { weekday: "long", day: "numeric", month: "long" })}
          </p>
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
          className="gap-2 rounded-xl text-xs font-bold"
        >
          نظرة عامة
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
          متابعة الفصول والطلاب ({s.students.length})
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
          دليل أساتذة المواد ({s.teachers.length})
        </Button>
      </div>

      {tab === "students" && <StudentsDirectorySection />}
      {tab === "teachers" && <TeachersDirectorySection />}

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="إجمالي الطلاب المسجلين"
              value={s.students.length.toLocaleString("ar-EG")}
              icon={Users}
              hint={`${s.classes.length.toLocaleString("ar-EG")} فصول ثانوية`}
            />
            <StatCard
              label="أساتذة المواد"
              value={s.teachers.length.toLocaleString("ar-EG")}
              icon={GraduationCap}
              tone="gold"
              hint="تغطية كامل المواد"
            />
            <StatCard
              label="نسبة تحصيل الرسوم"
              value={`${rate.toLocaleString("ar-EG")}٪`}
              icon={Percent}
              tone="success"
              hint={pending.length > 0 ? `${pending.length} إشعار للمراجعة` : "لا توجد معلقات"}
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
              { label: "الإعلانات واللوائح", to: "/app/notices", icon: Megaphone },
              { label: "إدارة الرسوم", to: "/app/fees", icon: Wallet, badge: pending.length },
              { label: "الجداول الدراسية", to: "/app/schedule", icon: CalendarClock },
              { label: "متابعة الحضور", to: "/app/attendance", icon: UserCheck },
              { label: "الواجبات والمذكرات", to: "/app/homework", icon: BookOpen },
              { label: "التقويم والامتحانات", to: "/app/calendar", icon: Award },
            ]}
          />

          <SectionTitle
            action={
              <Link to="/app/fees" className="flex items-center text-xs font-bold text-gold hover:underline">
                إدارة الرسوم بالكامل <ChevronLeft className="h-4 w-4" />
              </Link>
            }
          >
            إشعارات بنكية بانتظار الاعتماد ({pending.length})
          </SectionTitle>
          {pending.length === 0 ? (
            <EmptyState icon={FileCheck2} title="لا توجد إشعارات دفع معلقة" text="تمت مراجعة جميع سندات التحويل" />
          ) : (
            <div className="space-y-2">
              {pending.map((r) => {
                const st = s.students.find((x) => x.id === r.studentId);
                return (
                  <Panel key={r.id} className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-foreground text-sm">{st?.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatMoney(r.amount)} · مرجع <span dir="ltr" className="font-mono font-bold">{r.reference}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="success" onClick={() => reviewReceipt(r.id, "approved")} className="text-xs font-bold">
                        اعتماد
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
        </>
      )}
    </div>
  );
}

/** Directory & Class Follow-up: Students and Classes Section */
function StudentsDirectorySection() {
  const { s, me } = useMe();
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

  const filtered = useMemo(() => {
    return s.students.filter((st) => {
      const matchClass = selectedClass === "all" || st.classId === selectedClass;
      const matchSearch =
        !search.trim() ||
        st.name.toLowerCase().includes(search.toLowerCase()) ||
        st.academicId.toLowerCase().includes(search.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [s.students, selectedClass, search]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-navy">دليل ومتابعة الطلاب والفصول الدراسية</h2>
          <p className="text-xs text-muted-foreground">
            استعراض بيانات الطلاب، ومتابعة الرسوم، ونسب الحضور والانضباط لكل فصل
          </p>
        </div>

        {me.role === "admin" && (
          <Button onClick={() => setAddStudentOpen(true)} className="gap-2 bg-primary hover:bg-navy font-bold text-xs">
            <Plus className="h-4 w-4" />
            إضافة طالب جديد
          </Button>
        )}
      </div>

      {/* Class filter chips & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex overflow-x-auto gap-1.5 pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedClass("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
              selectedClass === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:bg-muted",
            )}
          >
            كافة الفصول ({s.students.length})
          </button>
          {s.classes.map((c) => {
            const count = s.students.filter((st) => st.classId === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedClass(c.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
                  selectedClass === c.id
                    ? "bg-primary text-primary-foreground"
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

      {/* Table */}
      <Panel className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-muted/40 border-b">
              <tr className="text-xs text-muted-foreground">
                <th className="py-3 px-4 text-start">الطالب والرقم الأكاديمي</th>
                <th className="py-3 px-4 text-start">الفصل الدراسي</th>
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
                      {cls?.name}
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
                      {c.name}
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

/** Directory & School Management: Teachers Directory Section */
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-navy">دليل أساتذة المواد والتخصصات</h2>
          <p className="text-xs text-muted-foreground">
            قائمة أساتذة المواد والمقررات، أرقام التواصل، والفصول المسندة إلى كل أستاذ
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
            <div className="grid grid-cols-2 gap-2">
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
