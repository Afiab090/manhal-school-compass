import { createFileRoute } from "@tanstack/react-router";
import { Copy, Download, Printer, Save, Trash2 } from "lucide-react";
import { Fragment, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ImportDialog } from "@/components/school/ImportDialog";
import { PageHeader, Panel } from "@/components/school/bits";
import { useMe } from "@/components/school/useMe";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DAYS, PERIODS, detectTimetableConflicts } from "@/lib/school/logic";
import { copyClassTimetable, deleteSlot, importSlots, saveSlot } from "@/lib/school/store";
import { normalizeCell, normalizeDigits } from "@/lib/school/import";
import type { Slot } from "@/lib/school/types";

export const Route = createFileRoute("/app/timetables")({ component: TimetablesPage });

const IMPORT_COLUMNS = ["الفصل", "اليوم", "رقم الحصة", "المادة", "الرقم الوظيفي للمعلم", "القاعة"];
type ImportSlot = Omit<Slot, "id">;

function TimetablesPage() {
  const { s, me } = useMe();
  const stageId = s.session?.stageId ?? "stg-pri";
  const stageClasses = s.classes.filter((item) => item.stageId === stageId);
  const stageTeachers = s.teachers.filter((item) => item.stageIds?.includes(stageId));
  const [view, setView] = useState<"class" | "teacher">("class");
  const [classId, setClassId] = useState(stageClasses[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState(stageTeachers[0]?.id ?? "");
  const [editing, setEditing] = useState<Slot | null>(null);
  const [selectedCell, setSelectedCell] = useState({ day: 0, period: 1 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", teacherId: "", room: "" });
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<"replace-class" | "merge">("merge");
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyTarget, setCopyTarget] = useState("");
  const importCandidates = useRef<ImportSlot[]>([]);
  const warnings = detectTimetableConflicts(s.slots.filter((slot) => stageClasses.some((item) => item.id === slot.classId)), s.teachers).filter((item) => item.severity === "warning");

  const visibleSlots = useMemo(() => view === "class" ? s.slots.filter((slot) => slot.classId === classId) : s.slots.filter((slot) => slot.teacherId === teacherId && stageClasses.some((item) => item.id === slot.classId)), [s.slots, view, classId, teacherId, stageClasses]);
  const cellAt = (day: number, period: number) => visibleSlots.find((slot) => slot.day === day && slot.period === period);

  function openCell(day: number, period: number) {
    if (view !== "class" || me.role !== "admin") return;
    const existing = s.slots.find((slot) => slot.classId === classId && slot.day === day && slot.period === period) ?? null;
    setSelectedCell({ day, period });
    setEditing(existing);
    setForm(existing ? { subject: existing.subject, teacherId: existing.teacherId, room: existing.room } : { subject: "", teacherId: "", room: "" });
    setDialogOpen(true);
  }

  function commitSlot(event: React.FormEvent) {
    event.preventDefault();
    if (!classId || !form.subject.trim() || !form.teacherId || !form.room.trim()) { toast.error("أكمل المادة والمعلم والقاعة"); return; }
    try {
      const slot: Omit<Slot, "id"> & { id?: string } = {
        ...(editing ? { id: editing.id } : {}),
        classId, day: selectedCell.day, period: selectedCell.period,
        subject: form.subject.trim(), teacherId: form.teacherId, room: form.room.trim(),
      };
      saveSlot(slot);
      const teacher = s.teachers.find((item) => item.id === form.teacherId);
      if (teacher && !(teacher.classes ?? []).includes(classId)) toast.warning("تم الحفظ، لكن المعلم غير مسند رسمياً لهذا الفصل");
      else toast.success("تم حفظ الحصة");
      setDialogOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر حفظ الحصة"); }
  }

  function deleteEditing() {
    if (!editing) return;
    deleteSlot(editing.id); setDialogOpen(false); toast.success("تم حذف الحصة");
  }

  function mapImportRow(row: Record<string, string>, index: number, allRows: Record<string, string>[]): ImportSlot {
    if (index === 0) importCandidates.current = [];
    const className = normalizeCell(row["الفصل"]);
    const schoolClass = stageClasses.find((item) => item.name === className || item.short === className || item.id === className);
    if (!schoolClass) throw new Error("الفصل غير موجود في المرحلة المختارة");
    const dayText = normalizeCell(row["اليوم"]);
    const day = DAYS.findIndex((item) => item === dayText);
    if (day < 0) throw new Error("اليوم يجب أن يكون من الأحد إلى الخميس");
    const period = Number(normalizeDigits(row["رقم الحصة"]));
    if (!Number.isInteger(period) || period < 1 || period > 7) throw new Error("رقم الحصة يجب أن يكون بين 1 و7");
    const teacher = s.teachers.find((item) => item.employeeId.toLowerCase() === normalizeCell(row["الرقم الوظيفي للمعلم"]).toLowerCase());
    if (!teacher) throw new Error("الرقم الوظيفي للمعلم غير موجود");
    const candidate: ImportSlot = { classId: schoolClass.id, day, period, subject: normalizeCell(row["المادة"]), teacherId: teacher.id, room: normalizeCell(row["القاعة"]) };
    if (!candidate.subject || !candidate.room) throw new Error("المادة والقاعة مطلوبتان");
    const replacedClassIds = new Set(importMode === "replace-class" ? allRows.map((item) => {
      const value = normalizeCell(item["الفصل"]);
      return stageClasses.find((schoolItem) => schoolItem.name === value || schoolItem.short === value || schoolItem.id === value)?.id ?? "";
    }).filter(Boolean) : []);
    const testSlots = s.slots.filter((slot) => !(importMode === "replace-class" && replacedClassIds.has(slot.classId)) && !(slot.classId === candidate.classId && slot.day === day && slot.period === period));
    const importedSoFar = importCandidates.current;
    const trial = [...testSlots, ...importedSoFar.map((slot, rowIndex) => ({ ...slot, id: `import-${rowIndex}` })), { ...candidate, id: `candidate-${importedSoFar.length}` }];
    const conflict = detectTimetableConflicts(trial, s.teachers).find((item) => item.severity === "error");
    if (conflict) throw new Error(conflict.message);
    importCandidates.current.push(candidate);
    return candidate;
  }

  function confirmImported(rows: ImportSlot[]) {
    const result = importSlots(rows, importMode);
    importCandidates.current = [];
    return result;
  }

  if (me.role !== "admin") return <Panel><p className="py-8 text-center text-sm">هذه الصفحة متاحة للإدارة فقط.</p></Panel>;

  return <div className="print-schedule-root animate-rise space-y-5 print:space-y-2">
    <PageHeader title="إدارة الجداول الدراسية" subtitle={`الجداول الأسبوعية — ${s.stages.find((item) => item.id === stageId)?.name}`} />
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button variant={view === "class" ? "default" : "outline"} onClick={() => setView("class")}>جدول الفصل</Button>
      <Button variant={view === "teacher" ? "default" : "outline"} onClick={() => setView("teacher")}>جدول المعلم</Button>
      {view === "class" ? <select value={classId} onChange={(event) => setClassId(event.target.value)} className="h-10 min-w-48 rounded-lg border bg-background px-3">{stageClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select> : <select value={teacherId} onChange={(event) => setTeacherId(event.target.value)} className="h-10 min-w-48 rounded-lg border bg-background px-3">{stageTeachers.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.subject}</option>)}</select>}
      <div className="ms-auto flex flex-wrap gap-2"><select aria-label="طريقة الاستيراد" value={importMode} onChange={(event) => setImportMode(event.target.value as "replace-class" | "merge")} className="h-10 rounded-lg border bg-background px-2 text-xs"><option value="merge">إضافة / تحديث الخانات فقط</option><option value="replace-class">استبدال جدول الفصل بالكامل</option></select><Button variant="outline" onClick={() => setImportOpen(true)}>استيراد جدول</Button>{view === "class" && <Button variant="outline" onClick={() => { setCopyTarget(""); setCopyOpen(true); }}><Copy className="me-2 h-4 w-4" />نسخ جدول فصل</Button>}<Button variant="outline" onClick={() => window.print()}><Printer className="me-2 h-4 w-4" />طباعة / حفظ PDF</Button></div>
    </div>
    <Panel className="print:border-0 print:shadow-none">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{view === "class" ? stageClasses.find((item) => item.id === classId)?.name : stageTeachers.find((item) => item.id === teacherId)?.name}</h2><span className="text-xs text-muted-foreground">الأحد إلى الخميس · 7 حصص يومياً</span></div>
      <div className="grid grid-cols-[76px_repeat(5,minmax(0,1fr))] gap-1.5 sm:gap-2">
        <div className="rounded-lg bg-muted p-2 text-center text-[10px] font-bold">الحصة</div>
        {DAYS.map((day) => <div key={day} className="rounded-lg bg-muted p-2 text-center text-xs font-bold">{day}</div>)}
        {PERIODS.map((period) => <Fragment key={`period-${period.n}`}><div key={`p-${period.n}`} className="flex flex-col justify-center rounded-lg border bg-muted/30 px-1 text-center"><b className="text-xs">{period.n}</b><span className="text-[9px] text-muted-foreground">{period.time}</span></div>{DAYS.map((_, day) => {
          const slot = cellAt(day, period.n);
          const teacher = slot && s.teachers.find((item) => item.id === slot.teacherId);
          const schoolClass = slot && s.classes.find((item) => item.id === slot.classId);
          return <button key={`${day}-${period.n}`} type="button" onClick={() => view === "class" ? openCell(day, period.n) : undefined} className={`min-h-16 rounded-lg border p-1.5 text-start text-[10px] transition-colors ${slot ? "bg-primary/5 hover:bg-primary/10" : "bg-card hover:bg-muted/40"} ${view === "teacher" ? "cursor-default" : "cursor-pointer print:cursor-default"}`}>
            {slot ? <><b className="block leading-4">{slot.subject}</b><span className="mt-1 block text-muted-foreground">{view === "class" ? teacher?.name : schoolClass?.short}</span><span className="block text-muted-foreground">{slot.room}</span></> : <span className="text-muted-foreground/50">—</span>}
          </button>;
        })}</Fragment>)}
      </div>
    </Panel>
    {warnings.length > 0 && <Panel className="border-amber-300 bg-amber-50/60 dark:bg-amber-950/20"><h3 className="mb-2 text-sm font-bold text-amber-800 dark:text-amber-200">تنبيهات إسناد المعلمين</h3><ul className="space-y-1 text-xs text-amber-800 dark:text-amber-200">{warnings.slice(0, 12).map((item, index) => <li key={`${item.slotIds.join("-")}-${index}`}>{item.message}</li>)}</ul></Panel>}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "تعديل الحصة" : "إضافة حصة"} · {DAYS[selectedCell.day]} / الحصة {selectedCell.period}</DialogTitle></DialogHeader><form onSubmit={commitSlot} className="space-y-3"><label className="block text-sm">المادة<Input required value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></label><label className="block text-sm">المعلم<select required value={form.teacherId} onChange={(event) => setForm({ ...form, teacherId: event.target.value })} className="mt-1 h-10 w-full rounded-lg border bg-background px-3"><option value="">اختر المعلم</option>{stageTeachers.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.subject}</option>)}</select></label><label className="block text-sm">القاعة<Input required value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })} /></label><DialogFooter className="flex-row justify-between"><div>{editing && <Button type="button" variant="destructive" onClick={deleteEditing}><Trash2 className="me-1 h-4 w-4" />حذف</Button>}</div><Button type="submit"><Save className="me-1 h-4 w-4" />حفظ</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={copyOpen} onOpenChange={setCopyOpen}><DialogContent><DialogHeader><DialogTitle>نسخ جدول فصل إلى فصل آخر</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">سيحل الجدول المنسوخ محل جدول الفصل الهدف، مع فحص تعارضات المعلمين والقاعات قبل الحفظ.</p><select value={copyTarget} onChange={(event) => setCopyTarget(event.target.value)} className="h-10 w-full rounded-lg border bg-background px-3"><option value="">اختر الفصل الهدف</option>{stageClasses.filter((item) => item.id !== classId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><DialogFooter><Button variant="outline" onClick={() => setCopyOpen(false)}>إلغاء</Button><Button onClick={() => { try { copyClassTimetable(classId, copyTarget); toast.success("تم نسخ الجدول بنجاح"); setCopyOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر نسخ الجدول"); } }} disabled={!copyTarget}>نسخ الجدول</Button></DialogFooter></DialogContent></Dialog>
    <div className="hidden print:block pt-3 text-center text-[10px] text-muted-foreground">مدرسة المنهل — الجدول الأسبوعي</div>
    <ImportDialog<ImportSlot> open={importOpen} onOpenChange={(open) => { if (!open) importCandidates.current = []; setImportOpen(open); }} title="استيراد جدول الحصص" requiredColumns={IMPORT_COLUMNS} templateFilename="نموذج-الجداول.csv" sampleRows={[["١ أساس بنين", "الأحد", "1", "اللغة العربية", "T-101", "قاعة ١"], ["٢ أساس بنين", "الثلاثاء", "2", "الرياضيات", "T-102", "قاعة ٢"]]} mapRow={mapImportRow} rowWarning={(slot) => { const teacher = s.teachers.find((item) => item.id === slot.teacherId); return teacher && !(teacher.classes ?? []).includes(slot.classId) ? `المعلم ${teacher.name} غير مسند رسمياً لهذا الفصل` : undefined; }} onConfirm={confirmImported} />
    <div className="flex items-center gap-2 text-xs text-muted-foreground print:hidden"><Download className="h-3.5 w-3.5" /> يمكن حفظ نسخة PDF من نافذة الطباعة في المتصفح.</div>
  </div>;
}
