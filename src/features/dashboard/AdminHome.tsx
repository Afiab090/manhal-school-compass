import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bell, CalendarDays, ClipboardCheck, GraduationCap, Users, Wallet } from "lucide-react";

import { PageHeader, Panel, QuickGrid, SectionTitle, StatCard } from "@/components/school/bits";
import { useMe } from "@/components/school/useMe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { feeSummary, formatDate, formatMoney, installmentStatuses, stageOverview } from "@/lib/school/logic";
import { setSessionStage } from "@/lib/school/store";
import type { StageId } from "@/lib/school/types";

export function AdminHome() {
  const { s, me } = useMe();
  const [stageDialog, setStageDialog] = useState(false);
  const [nextStage, setNextStage] = useState<StageId>(s.session?.stageId ?? "stg-pri");
  if (me.role !== "admin") return null;
  const activeStage = s.session?.stageId ?? "stg-pri";
  const stageName = s.stages.find((stage) => stage.id === activeStage)?.name ?? "مرحلة الأساس";
  const stats = stageOverview(s, activeStage);
  const classIds = new Set(s.classes.filter((item) => item.stageId === activeStage).map((item) => item.id));
  const stageStudents = s.students.filter((student) => classIds.has(student.classId) && student.status === "active");
  const overdue = stageStudents.map((student) => ({ student, summary: feeSummary(student, s.payments, s.installments), hasOverdue: installmentStatuses(student.id, s.payments, s.installments, new Date().toISOString().slice(0, 10)).some((item) => item.status === "overdue") })).filter((item) => item.summary.remaining > 0 && item.hasOverdue).sort((a, b) => b.summary.remaining - a.summary.remaining).slice(0, 5);
  const announcements = [...s.announcements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const quickItems = [
    { label: "الجداول الدراسية", to: "/app/schedule", icon: CalendarDays },
    { label: "التقويم والامتحانات", to: "/app/calendar", icon: CalendarDays },
    { label: "الإعلانات واللوائح", to: "/app/notices", icon: Bell },
    { label: "متابعة الحضور", to: "/app/attendance", icon: ClipboardCheck },
    { label: "إدارة الطلبة", to: "/app/students", icon: Users },
    { label: "إدارة المعلمين", to: "/app/teachers", icon: GraduationCap },
    { label: "كشف الرسوم", to: "/app/fees", icon: Wallet },
  ];
  function changeStage() {
    setSessionStage(nextStage);
    toast.success(`تم تغيير المرحلة النشطة إلى ${s.stages.find((stage) => stage.id === nextStage)?.name}`);
    setStageDialog(false);
  }
  return <div className="animate-rise space-y-6">
    <div className="rounded-3xl border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="text-xs font-semibold text-muted-foreground">{me.admin.title} · لوحة الإدارة</div><h1 className="mt-1 font-display text-2xl font-bold text-navy">مرحبًا، {me.name}</h1><p className="mt-2 text-sm text-muted-foreground">{stageName} <span className="mx-1">·</span> {formatDate(new Date().toISOString(), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div>
        <Button variant="outline" onClick={() => { setNextStage(activeStage); setStageDialog(true); }}>تغيير المرحلة</Button>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <StatCard label="الفصول" value={stats.classCount.toLocaleString("ar-EG")} icon={CalendarDays} hint={stageName} />
      <StatCard label="الطلبة النشطون" value={stats.activeStudents.toLocaleString("ar-EG")} icon={Users} />
      <StatCard label="المعلمون النشطون" value={stats.activeTeachers.toLocaleString("ar-EG")} icon={GraduationCap} />
      <StatCard label="تحصيل الرسوم" value={`${stats.collectionPercent}٪`} icon={Wallet} tone="success" hint={`المحصّل ${formatMoney(stats.collected)}`} />
      <StatCard label="المتبقي من الرسوم" value={`${stats.remainingPercent}٪`} icon={Wallet} tone="warning" hint={`${formatMoney(stats.remaining)} من ${formatMoney(stats.totalFees)}`} />
    </div>
    <SectionTitle>إدارة سريعة</SectionTitle>
    <QuickGrid items={quickItems as never} />
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel>
        <SectionTitle action={<Link to="/app/fees" className="text-xs font-bold text-primary">كشف الرسوم</Link>}>طلاب عليهم رسوم متأخرة</SectionTitle>
        {overdue.length ? <div className="space-y-3">{overdue.map(({ student, summary }) => <div key={student.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-0 last:pb-0"><div className="min-w-0"><Link to="/app/students" search={{ studentId: student.id } as never} className="block truncate text-sm font-bold text-foreground hover:text-primary">{student.name}</Link><span className="text-xs text-muted-foreground" dir="ltr">{student.academicId}</span></div><div className="text-end"><div className="text-sm font-bold text-destructive">{formatMoney(summary.remaining)}</div><Badge variant="danger">متبقي</Badge></div></div>)}</div> : <p className="text-sm text-muted-foreground">لا توجد رسوم متأخرة في هذه المرحلة.</p>}
      </Panel>
      <Panel>
        <SectionTitle action={<Link to="/app/notices" className="text-xs font-bold text-primary">كل الإعلانات</Link>}>آخر الإعلانات</SectionTitle>
        {announcements.length ? <div className="space-y-3">{announcements.map((item) => <div key={item.id} className="border-b pb-3 last:border-0 last:pb-0"><div className="flex items-center justify-between gap-2"><strong className="text-sm">{item.title}</strong><span className="shrink-0 text-[10px] text-muted-foreground">{formatDate(item.date)}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.body}</p></div>)}</div> : <p className="text-sm text-muted-foreground">لا توجد إعلانات منشورة.</p>}
      </Panel>
    </div>
    <Dialog open={stageDialog} onOpenChange={setStageDialog}><DialogContent><DialogHeader><DialogTitle>تغيير المرحلة النشطة</DialogTitle></DialogHeader><Select value={nextStage} onValueChange={(value) => setNextStage(value as StageId)}><SelectTrigger><SelectValue placeholder="اختر المرحلة" /></SelectTrigger><SelectContent>{s.stages.map((stage) => <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>)}</SelectContent></Select><DialogFooter><Button variant="outline" onClick={() => setStageDialog(false)}>إلغاء</Button><Button onClick={changeStage}>تطبيق المرحلة</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
