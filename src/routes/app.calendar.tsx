import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Award,
  CalendarDays,
  Clock,
  GraduationCap,
  Palmtree,
  PartyPopper,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, Panel } from "@/components/school/bits";
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
  daysUntil,
  formatDate,
  toISODate,
} from "@/lib/school/logic";
import { addEvent, deleteEvent } from "@/lib/school/store";
import type { CalendarEvent } from "@/lib/school/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const { s, me } = useMe();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // New Event Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(toISODate(new Date(Date.now() + 7 * 86400000)));
  const [time, setTime] = useState("08:00 ص");
  const [type, setType] = useState<"exam" | "event" | "holiday">("exam");
  const [classId, setClassId] = useState<string>("all");
  const [subject, setSubject] = useState("");

  const events = useMemo(() => {
    return s.events
      .filter((e) => {
        if (filterType !== "all" && e.type !== filterType) return false;
        if (filterClass !== "all" && e.classId !== "all" && e.classId !== filterClass) return false;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [s.events, filterType, filterClass]);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      toast.error("يرجى إدخال عنوان وتاريخ الحدث");
      return;
    }

    const eventPayload: Omit<CalendarEvent, "id"> = {
      title: title.trim(),
      date,
      type,
      classId,
    };
    if (time.trim()) eventPayload.time = time.trim();
    if (type === "exam" && subject.trim()) eventPayload.subject = subject.trim();

    addEvent(eventPayload);

    toast.success("تمت إضافة الموعد إلى التقويم المدرسي بنجاح");
    setDialogOpen(false);
    setTitle("");
    setSubject("");
  };

  const handleDelete = (id: string) => {
    if (confirm("هل تريد حذف هذا الموعد من التقويم؟")) {
      deleteEvent(id);
      toast.success("تم حذف الموعد");
    }
  };

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="التقويم المدرسي ومواعيد الامتحانات"
        subtitle="مواعيد الاختبارات النصفية والنهائية، الفعاليات الأكاديمية والأنشطة، والعطلات الرسمية"
        icon={Award}
        action={
          me.role === "admin" && (
            <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-primary hover:bg-navy font-bold">
              <Plus className="h-4 w-4" />
              إضافة موعد أو امتحان
            </Button>
          )
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "جميع المواعيد" },
            { id: "exam", label: "الامتحانات والاختبارات" },
            { id: "event", label: "الأنشطة والفعاليات" },
            { id: "holiday", label: "العطلات الرسمية" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={cn(
                "rounded-xl px-3.5 py-2 text-xs font-bold transition-all",
                filterType === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">الفصل:</span>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-bold text-foreground focus:outline-none"
          >
            <option value="all">جميع الفصول</option>
            {s.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Timeline */}
      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="لا توجد مواعيد مسجلة تطابق التصفية"
          text="اختر تصنيفاً آخر أو قم بإضافة موعد جديد"
        />
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const diff = daysUntil(ev.date, new Date());
            const cls = ev.classId !== "all" ? s.classes.find((c) => c.id === ev.classId) : null;
            const d = new Date(ev.date);
            const dayName = DAYS[d.getDay()] ?? "";

            return (
              <div
                key={ev.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-card transition-all hover:border-gold",
                  ev.type === "exam" && "border-s-4 border-s-destructive",
                  ev.type === "event" && "border-s-4 border-s-gold",
                  ev.type === "holiday" && "border-s-4 border-s-success",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <span className="text-[10px] opacity-75">{dayName}</span>
                    <span className="text-base font-extrabold leading-none">{d.getDate()}</span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-base text-foreground">{ev.title}</span>
                      {ev.type === "exam" && <Badge variant="danger">امتحان</Badge>}
                      {ev.type === "event" && <Badge variant="gold">فعالية مدرسية</Badge>}
                      {ev.type === "holiday" && <Badge variant="success">عطلة رسمية</Badge>}
                      {cls && <Badge variant="outline">{cls.name}</Badge>}
                      {ev.classId === "all" && <Badge variant="secondary">لكافة الفصول</Badge>}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDate(ev.date, { day: "numeric", month: "long", year: "numeric" })}</span>
                      {ev.time && (
                        <span className="flex items-center gap-1 text-gold font-semibold">
                          <Clock className="h-3 w-3" /> {ev.time}
                        </span>
                      )}
                      {ev.subject && (
                        <span className="font-semibold text-foreground">المادة: {ev.subject}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto">
                  <div
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold",
                      diff < 0
                        ? "bg-muted text-muted-foreground"
                        : diff === 0
                        ? "bg-destructive text-destructive-foreground animate-pulse"
                        : diff <= 5
                        ? "bg-gold-soft text-navy"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {diff < 0 ? "انتهى" : diff === 0 ? "اليوم" : `بعد ${diff} يوم`}
                  </div>

                  {me.role === "admin" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(ev.id)}
                      className="h-8 text-xs text-destructive hover:bg-danger-soft hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Event Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة موعد أو امتحان إلى التقويم</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="space-y-1.5">
              <Label>نوع الحدث</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
              >
                <option value="exam">امتحان / اختبار</option>
                <option value="event">نشاط / فعالية مدرسية</option>
                <option value="holiday">عطلة رسمية</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>عنوان الحدث</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: امتحان منتصف الفصل - الرياضيات"
                required
              />
            </div>

            {type === "exam" && (
              <div className="space-y-1.5">
                <Label>المادة المقررة</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثال: الرياضيات"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>التاريخ</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>التوقيت</Label>
                <Input
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="مثال: 08:00 ص"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>الفصل المستهدف</Label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
              >
                <option value="all">كافة الفصول (المدرسة بالكامل)</option>
                {s.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">إضافة إلى التقويم</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
