import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  GraduationCap,
  Layers,
  Megaphone,
  Percent,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, Panel, ProgressBar, StatCard } from "@/components/school/bits";
import { AnnouncementCard } from "@/components/school/shared";
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
import {
  feeSummary,
  formatDate,
  formatMoney,
  stageFinancialSummary,
} from "@/lib/school/logic";
import { setSessionStage } from "@/lib/school/store";
import type { StageId } from "@/lib/school/types";
import { cn } from "@/lib/utils";

export function AdminHome({ initialTab }: { initialTab?: string }) {
  const { s, me } = useMe();
  const currentStage: StageId = me.stageId || "المرحلة الثانوية";
  const [changeStageOpen, setChangeStageOpen] = useState(false);
  const [selectedStageOption, setSelectedStageOption] = useState<StageId>(currentStage);

  // Filter classes, students, teachers for current stage
  const stageClasses = useMemo(() => s.classes.filter((c) => c.stageId === currentStage), [s.classes, currentStage]);
  const stageClassIds = useMemo(() => new Set(stageClasses.map((c) => c.id)), [stageClasses]);

  const activeStageStudents = useMemo(() => {
    return s.students.filter((st) => stageClassIds.has(st.classId) && st.status !== "archived");
  }, [s.students, stageClassIds]);

  const activeStageTeachers = useMemo(() => {
    return s.teachers.filter((t) => {
      if (t.status === "archived") return false;
      const tStages = t.stageIds ?? [];
      const hasClassInStage = t.classes?.some((cid) => stageClassIds.has(cid));
      return tStages.includes(currentStage) || hasClassInStage;
    });
  }, [s.teachers, stageClassIds, currentStage]);

  // Stage Financial Stats
  const financial = useMemo(() => {
    return stageFinancialSummary(activeStageStudents, s.payments);
  }, [activeStageStudents, s.payments]);

  // Top 5 students with overdue/remaining fees
  const topOverdueStudents = useMemo(() => {
    return activeStageStudents
      .map((st) => {
        const summ = feeSummary(st, s.payments, s.installments);
        return { st, summ };
      })
      .filter((x) => x.summ.remaining > 0)
      .sort((a, b) => b.summ.remaining - a.summ.remaining)
      .slice(0, 5);
  }, [activeStageStudents, s.payments, s.installments]);

  // Latest 3 announcements
  const latestAnnouncements = useMemo(() => {
    return s.announcements.slice(0, 3);
  }, [s.announcements]);

  const adminTitle = me.role === "admin" && me.admin ? me.admin.title : "إدارة المدرسة";

  const handleChangeStage = (e: React.FormEvent) => {
    e.preventDefault();
    setSessionStage(selectedStageOption);
    setChangeStageOpen(false);
    toast.success(`تم تغيير المرحلة النشطة إلى: ${selectedStageOption}`);
  };

  return (
    <div className="animate-rise space-y-6">
      {/* 1. TOP WELCOME BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border bg-card p-5 shadow-card">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-bold text-navy">
              {adminTitle}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs font-semibold text-muted-foreground">{formatDate(new Date().toISOString())}</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy">
            مرحبًا، {me.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            المرحلة النشطة حالياً: <span className="font-bold text-navy">{currentStage}</span>
          </p>
        </div>

        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedStageOption(currentStage);
              setChangeStageOpen(true);
            }}
            className="gap-2 border-gold text-navy hover:bg-gold-soft font-bold text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-gold" />
            تغيير المرحلة
          </Button>
        </div>
      </div>

      {/* 2. STAGE-SCOPED KPI STATS */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="فصول المرحلة"
            value={stageClasses.length}
            icon={Layers}
            hint={currentStage}
            to="/app/timetables"
          />
          <StatCard
            label="الطلبة النشطون"
            value={activeStageStudents.length}
            icon={Users}
            hint="طالب منتظم"
            to="/app/students"
          />
          <StatCard
            label="المعلمون النشطون"
            value={activeStageTeachers.length}
            icon={GraduationCap}
            hint="هيئة التدريس"
            to="/app/teachers"
          />
          <StatCard
            label="نسبة تحصيل الرسوم"
            value={`${financial.collectionRate}٪`}
            icon={CheckCircle2}
            tone="success"
            hint={formatMoney(financial.totalCollected)}
            to="/app/fees"
          />
        </div>

        {/* 5th Card: Full-width Financial Highlight Banner */}
        <Link
          to="/app/fees"
          className="group block rounded-2xl border border-border/80 bg-gradient-to-l from-gold/10 via-card to-card p-4 shadow-card transition-all hover:border-gold hover:shadow-elevated active:scale-[0.99]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold-darker shadow-sm">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">المتبقي من الرسوم الدراسية ({currentStage})</span>
                  <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-navy">
                    من أصل {formatMoney(financial.totalRequired)}
                  </span>
                </div>
                <div className="text-xl font-extrabold text-foreground font-mono">
                  {formatMoney(financial.totalRemaining)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 self-end sm:self-center text-xs font-bold text-navy group-hover:text-gold transition-colors">
              <span>عرض تفاصيل الرسوم وكشف السندات</span>
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </div>
          </div>
        </Link>
      </div>

      {/* 3. QUICK ACTIONS (7 links) */}
      <Panel className="space-y-3">
        <h2 className="font-display text-base font-bold text-navy">إدارة سريعة</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
          {[
            { to: "/app/schedule", label: "الجداول الدراسية", icon: CalendarDays },
            { to: "/app/calendar", label: "التقويم والامتحانات", icon: Award },
            { to: "/app/notices", label: "الإعلانات واللوائح", icon: Megaphone },
            { to: "/app/attendance", label: "متابعة الحضور", icon: UserCheck },
            { to: "/app/students", label: "إدارة الطلبة", icon: Users },
            { to: "/app/teachers", label: "إدارة المعلمين", icon: GraduationCap },
            { to: "/app/fees", label: "كشف الرسوم", icon: Wallet },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-3.5 text-center shadow-card hover:-translate-y-0.5 hover:border-gold transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-soft text-navy">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-foreground">{item.label}</span>
            </Link>
          ))}
        </div>
      </Panel>

      {/* 4. OVERDUE STUDENTS & ANNOUNCEMENTS (Side-by-side) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Overdue Students */}
        <Panel className="space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-bold text-navy flex items-center gap-2">
                <Wallet className="h-4 w-4 text-gold" />
                طلاب عليهم رسوم متأخرة ({currentStage})
              </h2>
              <Link to="/app/fees" className="text-xs font-bold text-navy hover:text-gold flex items-center">
                كافة الرسوم <ChevronLeft className="h-3 w-3" />
              </Link>
            </div>

            {topOverdueStudents.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="لا توجد متأخرات" text="تم تحصيل كافة الرسوم المقررة في هذه المرحلة" />
            ) : (
              <div className="divide-y text-xs">
                {topOverdueStudents.map(({ st, summ }) => {
                  const cls = s.classes.find((c) => c.id === st.classId);
                  return (
                    <div key={st.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-foreground">{st.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {st.academicId} · {cls?.name ?? ""}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="font-mono font-bold text-destructive">{formatMoney(summ.remaining)}</div>
                        <Link
                          to="/app/students"
                          className="text-[10px] font-bold text-navy hover:underline"
                        >
                          عرض الملف
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Panel>

        {/* Latest Announcements */}
        <Panel className="space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-bold text-navy flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-gold" />
                آخر الإعلانات المدرسية
              </h2>
              <Link to="/app/notices" className="text-xs font-bold text-navy hover:text-gold flex items-center">
                كل الإعلانات <ChevronLeft className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {latestAnnouncements.map((a) => (
                <div key={a.id} className="p-3 rounded-2xl border bg-muted/20">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-navy">{a.title}</span>
                    <span className="text-muted-foreground">{formatDate(a.date)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Change Stage Dialog */}
      <Dialog open={changeStageOpen} onOpenChange={setChangeStageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تغيير المرحلة النشطة للإدارة</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangeStage} className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">
                اختر المرحلة التي ترغب بإدارتها وعرض إحصاءاتها وفصولها وطلابها حالياً:
              </span>
              <div className="space-y-2 pt-2">
                {(["مرحلة الأساس", "المرحلة المتوسطة", "المرحلة الثانوية"] as StageId[]).map((stage) => (
                  <label
                    key={stage}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all",
                      selectedStageOption === stage
                        ? "border-primary bg-primary/5 text-navy font-bold"
                        : "border-border hover:bg-muted text-foreground",
                    )}
                  >
                    <span>{stage}</span>
                    <input
                      type="radio"
                      name="stageSelect"
                      value={stage}
                      checked={selectedStageOption === stage}
                      onChange={() => setSelectedStageOption(stage)}
                      className="accent-primary"
                    />
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setChangeStageOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" className="bg-primary hover:bg-navy font-bold">
                اعتماد وتغيير
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
