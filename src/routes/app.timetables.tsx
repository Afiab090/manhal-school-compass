import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  Clock,
  Copy,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Layers,
  MapPin,
  Plus,
  Printer,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, Panel } from "@/components/school/bits";
import { ImportDialog } from "@/components/school/ImportDialog";
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
import { downloadCsvTemplate } from "@/lib/school/import";
import {
  DAYS,
  PERIODS,
  detectTimetableConflicts,
} from "@/lib/school/logic";
import {
  copyClassTimetable,
  deleteSlot,
  importTimetable,
  saveSlot,
} from "@/lib/school/store";
import type { Slot, StageId } from "@/lib/school/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/timetables")({
  component: TimetablesManagementPage,
});

const TIMETABLE_REQUIRED_COLUMNS = [
  "الفصل",
  "اليوم",
  "رقم الحصة",
  "المادة",
  "الرقم الوظيفي للمعلم",
  "القاعة",
];

const TIMETABLE_TEMPLATE_SAMPLE = [
  ["الصف الأول الثانوي (أ)", "الأحد", "1", "الرياضيات", "T-101", "قاعة 301"],
  ["الصف الأول الثانوي (أ)", "الأحد", "2", "الفيزياء", "T-103", "قاعة 301"],
];

function TimetablesManagementPage() {
  const { s, me } = useMe();
  const currentStage: StageId = me.stageId || "المرحلة الثانوية";

  // Classes for current stage
  const stageClasses = useMemo(() => s.classes.filter((c) => c.stageId === currentStage), [s.classes, currentStage]);

  // Mode: "class" | "teacher"
  const [viewMode, setViewMode] = useState<"class" | "teacher">("class");
  const [selectedClassId, setSelectedClassId] = useState<string>(stageClasses[0]?.id || "");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(s.teachers[0]?.id || "");

  // Slot Dialog state
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Partial<Slot> | null>(null);

  // Copy Modal state
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [sourceClassId, setSourceClassId] = useState<string>(selectedClassId);
  const [targetClassId, setTargetClassId] = useState<string>("");

  // Import Dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importMode, setImportMode] = useState<"replace_class" | "add_update">("add_update");

  // Conflict warnings state
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Get active class or teacher
  const currentClass = s.classes.find((c) => c.id === selectedClassId);
  const currentTeacher = s.teachers.find((t) => t.id === selectedTeacherId);

  // Filter slots for active view
  const currentSlots = useMemo(() => {
    if (viewMode === "class") {
      return s.slots.filter((sl) => sl.classId === selectedClassId);
    }
    return s.slots.filter((sl) => sl.teacherId === selectedTeacherId);
  }, [s.slots, viewMode, selectedClassId, selectedTeacherId]);

  // Helper to find slot in cell
  const getSlot = (dayIdx: number, periodNumber: number) => {
    return currentSlots.find((sl) => sl.day === dayIdx && sl.period === periodNumber);
  };

  const handleCellClick = (dayIdx: number, periodNumber: number) => {
    const existing = getSlot(dayIdx, periodNumber);
    if (existing) {
      setEditingSlot(existing);
    } else {
      setEditingSlot({
        day: dayIdx,
        period: periodNumber,
        classId: selectedClassId,
        teacherId: selectedTeacherId || s.teachers[0]?.id || "",
        subject: viewMode === "teacher" && currentTeacher ? currentTeacher.subject : "الرياضيات",
        room: currentClass ? `قاعة ${currentClass.short}` : "قاعة دراسية",
      });
    }
    setValidationWarnings([]);
    setSlotDialogOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !editingSlot.subject || !editingSlot.classId || !editingSlot.teacherId) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    const payload = {
      ...(editingSlot.id ? { id: editingSlot.id } : {}),
      classId: editingSlot.classId,
      day: editingSlot.day ?? 0,
      period: Number(editingSlot.period) || 1,
      subject: editingSlot.subject,
      teacherId: editingSlot.teacherId,
      room: editingSlot.room || "قاعة دراسية",
    };

    // Conflict detection engine
    const check = detectTimetableConflicts(s.slots, payload, s.teachers, s.classes);
    if (!check.valid) {
      toast.error(check.errors[0] || "يوجد تعارض في الجدول");
      return;
    }

    saveSlot(payload);
    toast.success("تم حفظ الحصة بنجاح في الجدول");
    setSlotDialogOpen(false);
    setEditingSlot(null);
  };

  const handleDeleteSlot = (id: string) => {
    deleteSlot(id);
    toast.success("تم حذف الحصة");
    setSlotDialogOpen(false);
    setEditingSlot(null);
  };

  const handleCopyClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceClassId || !targetClassId) {
      toast.error("يرجى تحديد الفصلين");
      return;
    }
    if (sourceClassId === targetClassId) {
      toast.error("لا يمكن النسخ إلى نفس الفصل");
      return;
    }

    const res = copyClassTimetable(sourceClassId, targetClassId);
    toast.success(`تم نسخ جدول الفصل بنجاح (${res.copied} حصة)`);
    setCopyDialogOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-rise space-y-6">
      {/* Header */}
      <PageHeader
        title="إدارة الجداول والحصص الدراسية"
        subtitle={`بناء وتوزيع ومراجعة الجداول الدراسية الأسبوعية ومنع التعارضات — ${currentStage}`}
        icon={CalendarDays}
        action={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2 font-bold text-xs"
            >
              <Printer className="h-4 w-4" />
              طباعة / حفظ PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSourceClassId(selectedClassId);
                setCopyDialogOpen(true);
              }}
              className="gap-2 font-bold text-xs"
            >
              <Copy className="h-4 w-4" />
              نسخ جدول فصل
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportDialogOpen(true)}
              className="gap-2 font-bold text-xs border-gold text-navy hover:bg-gold-soft"
            >
              <FileSpreadsheet className="h-4 w-4 text-gold" />
              استيراد جدول
            </Button>
          </div>
        }
      />

      {/* View Switcher: Class vs Teacher (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-card print:hidden">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={viewMode === "class" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("class")}
            className="gap-2 text-xs font-bold"
          >
            <Layers className="h-4 w-4" />
            عرض شبكة الفصل الدراسي
          </Button>
          <Button
            type="button"
            variant={viewMode === "teacher" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("teacher")}
            className="gap-2 text-xs font-bold"
          >
            <GraduationCap className="h-4 w-4" />
            عرض شبكة جدول المعلم
          </Button>
        </div>

        {/* Sub-selector */}
        <div className="flex items-center gap-2">
          {viewMode === "class" ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">الفصل:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="h-9 w-56 rounded-lg border border-input bg-background px-3 text-xs font-bold text-foreground focus:outline-none"
              >
                {stageClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.short})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">المعلم:</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="h-9 w-60 rounded-lg border border-input bg-background px-3 text-xs font-bold text-foreground focus:outline-none"
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

      {/* Print Banner */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h2 className="text-xl font-bold">مدرسة المنهل الخاصة — {currentStage}</h2>
        <div className="text-sm font-semibold mt-1">
          {viewMode === "class" ? `الجدول الدراسي الأسبوعي: ${currentClass?.name}` : `جدول الحصص الأسبوعي للأستاذ: ${currentTeacher?.name} (${currentTeacher?.subject})`}
        </div>
      </div>

      {/* Interactive Timetable Grid (5 Days x 7 Periods) */}
      <div className="rounded-2xl border bg-card shadow-card overflow-x-auto">
        <table className="w-full border-collapse text-xs text-center min-w-[750px]">
          <thead>
            <tr className="bg-muted/70 text-navy font-bold border-b">
              <th className="p-3 w-28 text-start border-e font-black">اليوم / الحصة</th>
              {PERIODS.map((p) => (
                <th key={p.n} className="p-2.5 border-e last:border-e-0">
                  <div className="font-bold">{p.label}</div>
                  <div className="text-[10px] text-muted-foreground font-mono font-normal" dir="ltr">{p.time}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {DAYS.map((dayName, dayIdx) => (
              <tr key={dayName} className="hover:bg-muted/10 transition-colors">
                <td className="p-3 bg-muted/30 font-bold border-e text-start text-navy">
                  {dayName}
                </td>
                {PERIODS.map((period) => {
                  const slot = getSlot(dayIdx, period.n);
                  const teacher = slot ? s.teachers.find((t) => t.id === slot.teacherId) : null;
                  const cls = slot ? s.classes.find((c) => c.id === slot.classId) : null;

                  return (
                    <td
                      key={period.n}
                      onClick={() => handleCellClick(dayIdx, period.n)}
                      className={cn(
                        "p-2 border-e last:border-e-0 cursor-pointer transition-all h-24 align-top hover:bg-gold-soft/20",
                        slot ? "bg-primary/5 hover:border-gold" : "hover:bg-muted/30",
                      )}
                    >
                      {slot ? (
                        <div className="flex flex-col justify-between h-full text-start p-1 rounded-xl bg-card border shadow-xs">
                          <div>
                            <div className="font-bold text-navy text-[11px] truncate">{slot.subject}</div>
                            {viewMode === "class" ? (
                              <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                <GraduationCap className="h-3 w-3 text-gold shrink-0" />
                                <span>{teacher?.name ?? "غير محدد"}</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                <Users className="h-3 w-3 text-gold shrink-0" />
                                <span>{cls?.short ?? slot.classId}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-[9px] text-muted-foreground font-mono flex items-center gap-0.5 mt-1 border-t pt-1">
                            <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                            <span>{slot.room}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground/40 text-sm hover:text-gold print:hidden">
                          +
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT SLOT MODAL */}
      <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSlot?.id ? "تعديل حصة دراسية" : "إضافة حصة إلى الجدول"}
            </DialogTitle>
          </DialogHeader>
          {editingSlot && (
            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>اليوم</Label>
                  <select
                    value={editingSlot.day}
                    onChange={(e) => setEditingSlot({ ...editingSlot, day: Number(e.target.value) })}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs font-bold"
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
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs font-bold"
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
                <Label>الفصل الدراسي *</Label>
                <select
                  value={editingSlot.classId}
                  onChange={(e) => setEditingSlot({ ...editingSlot, classId: e.target.value })}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs font-bold"
                  required
                >
                  {stageClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>أستاذ المادة *</Label>
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
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs font-bold"
                  required
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
                  <Label>المادة الدراسية *</Label>
                  <Input
                    value={editingSlot.subject}
                    onChange={(e) => setEditingSlot({ ...editingSlot, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>القاعة / المعمل *</Label>
                  <Input
                    value={editingSlot.room}
                    onChange={(e) => setEditingSlot({ ...editingSlot, room: e.target.value })}
                    required
                  />
                </div>
              </div>

              {validationWarnings.length > 0 && (
                <div className="p-3 rounded-xl bg-warning-soft text-warning-foreground text-xs font-semibold">
                  {validationWarnings.map((w, idx) => (
                    <div key={idx}>{w}</div>
                  ))}
                </div>
              )}

              <DialogFooter className="mt-4 gap-2 flex items-center justify-between">
                {editingSlot.id && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleDeleteSlot(editingSlot.id!)}
                    className="text-destructive hover:bg-destructive/10 text-xs"
                  >
                    <Trash2 className="h-4 w-4 me-1" />
                    حذف الحصة
                  </Button>
                )}
                <div className="flex items-center gap-2 ms-auto">
                  <Button type="button" variant="outline" onClick={() => setSlotDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-navy font-bold">
                    حفظ الحصة
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* COPY TIMETABLE MODAL */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>نسخ جدول فصل دراسي بالكامل</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCopyClass} className="space-y-4">
            <p className="text-xs text-muted-foreground">
              يمكنك نسخ توزيع الحصص بالكامل من فصل مصدر إلى فصل آخر، مع تحديث اسم القاعة تلقائياً:
            </p>

            <div className="space-y-1.5">
              <Label>الفصل المصدر (الذي سيتم نسخ الحصص منه)</Label>
              <select
                value={sourceClassId}
                onChange={(e) => setSourceClassId(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs font-bold"
              >
                {stageClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>الفصل الهدف (الذي سيستقبل الحصص الجديدة)</Label>
              <select
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs font-bold"
                required
              >
                <option value="">-- اختر الفصل الهدف --</option>
                {stageClasses
                  .filter((c) => c.id !== sourceClassId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setCopyDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" className="bg-primary hover:bg-navy font-bold">
                نسخ الجدول الآن
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* IMPORT TIMETABLE DIALOG */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="استيراد وتحديث الجدول الدراسي"
        description="استيراد الحصص الأسبوعية من ملف Excel أو CSV مع فحص التعارضات"
        requiredColumns={TIMETABLE_REQUIRED_COLUMNS}
        templateFilename="نموذج_استيراد_الجدول.csv"
        templateHeaders={TIMETABLE_REQUIRED_COLUMNS}
        templateSampleRows={TIMETABLE_TEMPLATE_SAMPLE}
        extraOptions={
          <div className="space-y-2">
            <span className="text-xs font-bold text-foreground">خيارات الاستيراد:</span>
            <div className="flex flex-col gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="add_update"
                  checked={importMode === "add_update"}
                  onChange={() => setImportMode("add_update")}
                />
                <span>إضافة وتحديث الحصص المذكورة فقط مع الإبقاء على باقي الحصص</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="replace_class"
                  checked={importMode === "replace_class"}
                  onChange={() => setImportMode("replace_class")}
                />
                <span>استبدال جدول الفصل بالكامل (حذف الحصص القديمة للفصل)</span>
              </label>
            </div>
          </div>
        }
        rowValidator={(row) => {
          const errors: string[] = [];
          if (!row["الفصل"]?.trim()) errors.push("الفصل مفقود");
          if (!row["اليوم"]?.trim()) errors.push("اليوم مفقود");
          if (!row["رقم الحصة"] || Number(row["رقم الحصة"]) < 1 || Number(row["رقم الحصة"]) > 7) {
            errors.push("رقم الحصة يجب أن يكون بين 1 و 7");
          }
          if (!row["المادة"]?.trim()) errors.push("المادة مفقودة");
          if (!row["الرقم الوظيفي للمعلم"]?.trim()) errors.push("الرقم الوظيفي للمعلم مفقود");
          return { isValid: errors.length === 0, errors };
        }}
        onConfirmImport={async (validRows) => {
          const payload: Omit<Slot, "id">[] = [];

          for (const row of validRows) {
            // Find class
            const targetCls = s.classes.find(
              (c) => c.name.trim() === row["الفصل"]?.trim() || c.short.trim() === row["الفصل"]?.trim(),
            );
            const classId = targetCls?.id || selectedClassId;

            // Day index: "الأحد" = 0 ... "الخميس" = 4
            const dayName = row["اليوم"]?.trim();
            const dayIdx = DAYS.indexOf(dayName as any) >= 0 ? DAYS.indexOf(dayName as any) : 0;

            // Teacher
            const teacher = s.teachers.find(
              (t) => t.employeeId.trim().toLowerCase() === row["الرقم الوظيفي للمعلم"]?.trim().toLowerCase(),
            );
            const teacherId = teacher?.id || s.teachers[0]?.id || "";

            payload.push({
              classId,
              day: dayIdx,
              period: Number(row["رقم الحصة"]) || 1,
              subject: row["المادة"] || "الرياضيات",
              teacherId,
              room: row["القاعة"] || "قاعة دراسية",
            });
          }

          const res = importTimetable(payload, importMode, selectedClassId);
          return { added: res.saved, updated: 0, ignored: 0 };
        }}
      />
    </div>
  );
}
