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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  // New Event Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(toISODate(new Date(Date.now() + 7 * 86400000)));
  const [time, setTime] = useState("08:00 ص");
  const [type, setType] = useState<"exam" | "event" | "holiday">("exam");
  const [classId, setClassId] = useState<string>("all");
  const [subject, setSubject] = useState("");

  const targetClassId = me.role === "student" ? me.student.classId : null;

  const events = useMemo(() => {
    return s.events
      .filter((e) => {
        if (filterType !== "all" && e.type !== filterType) return false;
        if (filterClass !== "all" && e.classId !== "all" && e.classId !== filterClass) return false;
        // Students see school-wide events and events assigned to their class.
        if (targetClassId && filterClass === "all" && e.classId !== "all" && e.classId !== targetClassId) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [s.events, filterType, filterClass, targetClassId]);

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

  const confirmDelete = () => {
    if (deleteEventId) {
      deleteEvent(deleteEventId);
      toast.success("تم حذف الموعد");
      setDeleteEventId(null);
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


      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "جميع المواعيد" },
            { id: "exam", label: "الامتحانات والاختبارات" },
            { id: "event", label: "الأنشطة والفعاليات" },
            { id: "holiday", label: "العطلات والإجازات" },
          ].map((cat) => (
            <Button
              key={cat.id}
              type="button"
              variant={filterType === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(cat.id)}
              className="rounded-xl text-xs font-bold"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {me.role === "admin" && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">تصفية حسب الفصل:</span>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-bold text-foreground focus:outline-none"
            >
              <option value="all">كافة الفصول والمراحل</option>
              {s.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="لا توجد مواعيد أو امتحانات"
          text="لم يتم إدراج مواعيد مطابقة للتصنيف الحالي"
        />
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const cls = s.classes.find((c) => c.id === ev.classId);
            const diff = daysUntil(ev.date, new Date());

            const isExam = ev.type === "exam";
            const isHoliday = ev.type === "holiday";

            return (
              <div
                key={ev.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border bg-card p-4 shadow-card hover:border-gold transition-all",
                  isHoliday && "bg-success-soft/20 border-success/30",
                  isExam && "border-primary/20",
                )}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold shadow-sm",
                      isExam
                        ? "bg-primary text-primary-foreground"
                        : isHoliday
                        ? "bg-success text-success-foreground"
                        : "bg-gold text-navy",
                    )}
                  >
                    {isExam ? (
                      <Award className="h-5 w-5" />
                    ) : isHoliday ? (
                      <Palmtree className="h-5 w-5" />
                    ) : (
                      <PartyPopper className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-base text-foreground">{ev.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {ev.classId === "all" ? "عام لكافة المدرسة" : cls?.name}
                      </Badge>
                      <Badge
                        className={cn(
                          "text-xs font-semibold",
                          isExam
                            ? "bg-primary text-primary-foreground"
                            : isHoliday
                            ? "bg-success text-success-foreground"
                            : "bg-gold text-navy",
                        )}
                      >
                        {isExam ? "امتحان" : isHoliday ? "عطلة رسمية" : "فعالية"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1 font-semibold">
                        <CalendarDays className="h-3.5 w-3.5 text-gold" />
                        {formatDate(ev.date)} ({DAYS[new Date(ev.date).getDay()]})
                      </span>
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
                      onClick={() => setDeleteEventId(ev.id)}
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

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteEventId} onOpenChange={(open) => !open && setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الموعد</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في إزالة هذا الحدث من التقويم المدرسي؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              نعم، حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
