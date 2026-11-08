import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  Clock,
  GraduationCap,
  Layers,
  MapPin,
  Plus,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, Panel } from "@/components/school/bits";
import { useMe } from "@/components/school/useMe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  PERIODS,
  currentOrNextSchoolDay,
} from "@/lib/school/logic";
import { deleteSlot, saveSlot, setActiveChild } from "@/lib/school/store";
import type { Slot } from "@/lib/school/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/schedule")({
  component: SchedulePage,
});

function SchedulePage() {
  const { s, me } = useMe();
  const currentDayInfo = useMemo(() => currentOrNextSchoolDay(new Date()), []);
  const [selectedDay, setSelectedDay] = useState<number>(currentDayInfo.day);

  // View mode: "class" | "teacher"
  const defaultMode = me.role === "teacher" ? "teacher" : "class";
  const [viewMode, setViewMode] = useState<"class" | "teacher">(defaultMode);

  // Class selection (default to student's class, parent's active child's class, or first class)
  const defaultClass =
    me.role === "student"
      ? me.student.classId
      : me.role === "parent"
        ? (me.activeChild?.classId ?? s.classes[0]?.id ?? "c3a")
        : (s.classes[0]?.id ?? "c3a");
  const [selectedClassId, setSelectedClassId] = useState<string>(defaultClass);

  // Update selected class if parent changes child
  useEffect(() => {
    if (me.role === "parent" && me.activeChild) {
      setSelectedClassId(me.activeChild.classId);
    }
  }, [me.role, me.role === "parent" ? me.activeChild?.id : null]);

  // Teacher selection (default to current teacher or first teacher)
  const defaultTeacher = me.role === "teacher" ? me.teacher.id : s.teachers[0]?.id || "t1";
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(defaultTeacher);

  // Slot Dialog state (for Admin or Teacher)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<Partial<Slot>>({
    day: selectedDay,
    period: 1,
    subject: "الرياضيات",
    room: "قاعة 101",
    classId: selectedClassId,
    teacherId: selectedTeacherId,
  });

  // Filter slots
  const filteredSlots = useMemo(() => {
    let slots = s.slots.filter((sl) => sl.day === selectedDay);
    if (viewMode === "class") {
      slots = slots.filter((sl) => sl.classId === selectedClassId);
    } else {
      slots = slots.filter((sl) => sl.teacherId === selectedTeacherId);
    }
    return slots.sort((a, b) => a.period - b.period);
  }, [s.slots, selectedDay, viewMode, selectedClassId, selectedTeacherId]);

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot.subject || !editingSlot.classId || !editingSlot.teacherId) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    const slotPayload: Omit<Slot, "id"> & { id?: string } = {
      day: editingSlot.day ?? selectedDay,
      period: Number(editingSlot.period) || 1,
      subject: editingSlot.subject,
      classId: editingSlot.classId,
      teacherId: editingSlot.teacherId,
      room: editingSlot.room || "قاعة رئيسية",
    };
    if (editingSlot.id) {
      slotPayload.id = editingSlot.id;
    }
    saveSlot(slotPayload);
    toast.success("تم حفظ الحصة في الجدول بنجاح");
    setDialogOpen(false);
  };

  const confirmDelete = () => {
    if (deleteSlotId) {
      deleteSlot(deleteSlotId);
      toast.success("تم حذف الحصة من الجدول");
      setDeleteSlotId(null);
    }
  };

  const activeClass = s.classes.find((c) => c.id === selectedClassId);
  const activeTeacher = s.teachers.find((t) => t.id === selectedTeacherId);

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="الجدول الدراسي الأسبوعي"
        subtitle="متابعة الحصص الدراسية وتوزيع المواد والمعلمين والقاعات"
        icon={CalendarDays}
        action={
          (me.role === "admin" || me.role === "teacher") && (
            <Button
              onClick={() => {
                setEditingSlot({
                  day: selectedDay,
                  period: 1,
                  subject: me.role === "teacher" ? me.teacher.subject : "الرياضيات",
                  room: "قاعة 101",
                  classId: selectedClassId,
                  teacherId: me.role === "teacher" ? me.teacher.id : selectedTeacherId,
                });
                setDialogOpen(true);
              }}
              className="gap-2 bg-primary hover:bg-navy"
            >
              <Plus className="h-4 w-4" />
              إضافة حصة
            </Button>
          )
        }
      />

      {/* Parent Child Switcher */}
      {me.role === "parent" && me.children && me.children.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card/90 p-3 shadow-card">
          <span className="text-xs font-bold text-muted-foreground ml-2">جدول دراسي لابني/ابنتي:</span>
          {me.children.map((child) => {
            const isSelected = me.activeChild?.id === child.id;
            const childCls = s.classes.find((c) => c.id === child.classId);
            return (
              <Button
                key={child.id}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveChild(child.id);
                  setSelectedClassId(child.classId);
                  setViewMode("class");
                }}
                className={cn(
                  "rounded-full text-xs font-bold transition-all",
                  isSelected && "bg-navy text-gold shadow-sm",
                )}
              >
                {child.name} ({childCls?.name ?? child.classId})
              </Button>
            );
          })}
        </div>
      )}

      {/* View Switcher: By Class vs By Teacher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-card">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={viewMode === "class" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("class")}
            className="gap-2"
          >
            <Layers className="h-4 w-4" />
            عرض حسب الفصل الدراسي
          </Button>
          <Button
            type="button"
            variant={viewMode === "teacher" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("teacher")}
            className="gap-2"
          >
            <GraduationCap className="h-4 w-4" />
            عرض حسب أساتذة المواد
          </Button>
        </div>

        {/* Sub-selector depending on viewMode */}
        <div className="flex items-center gap-2">
          {viewMode === "class" ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">الفصل:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="h-9 w-full sm:w-56 rounded-lg border border-input bg-background px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {s.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">المعلم:</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="h-9 w-full sm:w-56 rounded-lg border border-input bg-background px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {s.teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subject})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Day Selector Chips */}
      <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
        {DAYS.map((dayName, idx) => (
          <button
            key={dayName}
            type="button"
            onClick={() => setSelectedDay(idx)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shrink-0",
              selectedDay === idx
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span>{dayName}</span>
            {currentDayInfo.isToday && currentDayInfo.day === idx && (
              <span className="inline-block h-2 w-2 rounded-full bg-gold animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Header Banner for Current Selection */}
      <Panel className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-card to-muted/40 border-gold/30">
        <div>
          <div className="text-xs text-muted-foreground">عرض جدول:</div>
          <div className="text-lg font-bold text-navy flex items-center gap-2">
            {viewMode === "class" ? (
              <>
                <Users className="h-5 w-5 text-gold" />
                {activeClass?.name}
              </>
            ) : (
              <>
                <GraduationCap className="h-5 w-5 text-gold" />
                {activeTeacher?.name} — مادة {activeTeacher?.subject}
              </>
            )}
          </div>
        </div>
        <Badge variant="outline" className="px-3 py-1 font-semibold text-xs border-gold text-navy bg-gold-soft">
          يوم {DAYS[selectedDay]} (٧ حصص يومياً)
        </Badge>
      </Panel>

      {/* Slots List / Grid */}
      {filteredSlots.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="لا توجد حصص مجدولة لهذا اليوم"
          text={
            viewMode === "class"
              ? "لم يتم تعيين حصص لهذا الفصل في هذا اليوم"
              : "لا توجد حصص مسندة للأستاذ في هذا اليوم"
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSlots.map((slot) => {
            const periodInfo = PERIODS[slot.period - 1];
            const teacher = s.teachers.find((t) => t.id === slot.teacherId);
            const cls = s.classes.find((c) => c.id === slot.classId);

            return (
              <div
                key={slot.id}
                className="relative flex flex-col justify-between rounded-2xl border bg-card p-4 shadow-card hover:border-gold transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-primary text-primary-foreground font-bold text-xs px-2.5 py-0.5">
                      الحصة {slot.period}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground" dir="ltr">
                      <Clock className="h-3 w-3 text-gold" />
                      <span>{periodInfo?.time}</span>
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-bold text-foreground mt-1">
                    {slot.subject}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5 text-gold" />
                      <span className="font-semibold text-foreground">
                        {teacher?.name ?? "غير محدد"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{cls?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{slot.room}</span>
                    </div>
                  </div>
                </div>

                {(me.role === "admin" || (me.role === "teacher" && slot.teacherId === me.teacher.id)) && (
                  <div className="mt-4 pt-3 border-t flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteSlotId(slot.id)}
                      className="h-8 px-2 text-xs text-destructive hover:bg-danger-soft hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 me-1" />
                      حذف
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Slot Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة حصة إلى الجدول الدراسي</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSlot} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>اليوم</Label>
                <select
                  value={editingSlot.day}
                  onChange={(e) => setEditingSlot({ ...editingSlot, day: Number(e.target.value) })}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
                >
                  {DAYS.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>رقم الحصة</Label>
                <select
                  value={editingSlot.period}
                  onChange={(e) => setEditingSlot({ ...editingSlot, period: Number(e.target.value) })}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
                >
                  {PERIODS.map((p) => (
                    <option key={p.n} value={p.n}>
                      {p.label} ({p.time})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>الفصل الدراسي</Label>
              <select
                value={editingSlot.classId}
                onChange={(e) => setEditingSlot({ ...editingSlot, classId: e.target.value })}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
              >
                {s.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>أستاذ المادة</Label>
              <select
                value={editingSlot.teacherId}
                onChange={(e) => {
                  const t = s.teachers.find((x) => x.id === e.target.value);
                  setEditingSlot((prev) => ({
                    ...prev,
                    teacherId: e.target.value,
                    ...(t ? { subject: t.subject } : {}),
                  }));
                }}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
              >
                {s.teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.subject}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>المادة الدراسية</Label>
                <Input
                  value={editingSlot.subject}
                  onChange={(e) => setEditingSlot({ ...editingSlot, subject: e.target.value })}
                  placeholder="مثال: الرياضيات"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>القاعة / المعمل</Label>
                <Input
                  value={editingSlot.room}
                  onChange={(e) => setEditingSlot({ ...editingSlot, room: e.target.value })}
                  placeholder="مثال: قاعة 101 أو المختبر"
                  required
                />
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">حفظ الحصة</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteSlotId} onOpenChange={(open) => !open && setDeleteSlotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الحصة من الجدول</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في إزالة هذه الحصة من الجدول الدراسي؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              نعم، حذف الحصة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
