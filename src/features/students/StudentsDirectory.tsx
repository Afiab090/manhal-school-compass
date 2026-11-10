import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Download, FileUp, MoreVertical, Pencil, Plus, Search, UserRound, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/school/bits";
import { ImportDialog } from "@/components/school/ImportDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { attendanceStats, feeSummary, formatMoney, installmentStatuses } from "@/lib/school/logic";
import { downloadCsvTemplate, normalizeCell, normalizeSudanesePhone } from "@/lib/school/import";
import { addStudent, archiveStudent, importStudents, restoreStudent, updateStudent, type StudentImportRow } from "@/lib/school/store";
import type { Student } from "@/lib/school/types";
import { useMe } from "@/components/school/useMe";

const IMPORT_COLUMNS = ["الاسم", "الرقم الأكاديمي", "الفصل", "النوع", "تاريخ الميلاد", "اسم ولي الأمر", "هاتف ولي الأمر", "الرسوم السنوية"];
const EMPTY_FORM = { name: "", academicId: "", classId: "", gender: "", dateOfBirth: "", parentName: "", parentPhone: "", totalFees: "" };

function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("249") ? digits : digits.startsWith("0") ? `249${digits.slice(1)}` : `249${digits}`;
}

function rowStatus(student: Student, state: ReturnType<typeof useMe>["s"]) {
  const summary = feeSummary(student, state.payments, state.installments);
  const statuses = installmentStatuses(student.id, state.payments, state.installments, new Date().toISOString().slice(0, 10));
  const late = statuses.some((item) => item.status === "overdue");
  const fees = summary.remaining <= 0 ? "مكتمل" : late ? "متأخر" : "جزئي";
  const attendance = attendanceStats(state.attendance, student.id).rate >= 85 ? "منتظم" : "تنبيه";
  return { summary, fees, attendance };
}

export function StudentsDirectory() {
  const { s, me } = useMe();
  const { studentId } = useSearch({ from: "/app/students" });
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [feeFilter, setFeeFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<"new-only" | "update-existing">("new-only");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [drawerTab, setDrawerTab] = useState<"data" | "fees" | "attendance">("data");
  useEffect(() => { if (studentId) { const target = s.students.find((item) => item.id === studentId); if (target) setSelectedStudent(target); } }, [studentId, s.students]);
  useEffect(() => { setPage(1); }, [query, classFilter, feeFilter, attendanceFilter, statusFilter, sort, s.session?.stageId]);
  const stageId = s.session?.stageId ?? "stg-pri";
  const stageClasses = s.classes.filter((item) => item.stageId === stageId);
  const visibleRows = useMemo(() => {
    const result = s.students.filter((student) => {
      const classInfo = s.classes.find((item) => item.id === student.classId);
      if (!classInfo || classInfo.stageId !== stageId) return false;
      if (statusFilter !== "all" && student.status !== statusFilter) return false;
      if (classFilter !== "all" && student.classId !== classFilter) return false;
      const state = rowStatus(student, s);
      if (feeFilter !== "all" && state.fees !== feeFilter) return false;
      if (attendanceFilter !== "all" && state.attendance !== attendanceFilter) return false;
      if (query && !`${student.name} ${student.academicId} ${student.parentName}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    return result.sort((a, b) => sort === "remaining" ? rowStatus(b, s).summary.remaining - rowStatus(a, s).summary.remaining : a.name.localeCompare(b.name, "ar"));
  }, [s, stageId, statusFilter, classFilter, feeFilter, attendanceFilter, query, sort]);
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const pagedRows = visibleRows.slice((page - 1) * pageSize, page * pageSize);
  const classCounts = new Map(stageClasses.map((item) => [item.id, s.students.filter((student) => student.classId === item.id && student.status === "active").length]));

  function startCreate() { setEditingId(null); setForm(EMPTY_FORM); setFormOpen(true); }
  function startEdit(student: Student) {
    setEditingId(student.id);
    setForm({ name: student.name, academicId: student.academicId, classId: student.classId, gender: student.gender ?? "", dateOfBirth: student.dateOfBirth ?? "", parentName: student.parentName, parentPhone: student.parentPhone, totalFees: String(student.totalFees) });
    setFormOpen(true);
  }
  function saveForm(event: React.FormEvent) {
    event.preventDefault();
    const totalFees = Number(form.totalFees);
    if (!form.name.trim() || !form.academicId.trim() || !form.classId || !form.parentName.trim() || !form.parentPhone.trim() || !Number.isFinite(totalFees) || totalFees <= 0) { toast.error("أكمل البيانات المطلوبة بصورة صحيحة"); return; }
    const value = { name: form.name.trim(), academicId: form.academicId.trim(), classId: form.classId, parentName: form.parentName.trim(), parentPhone: normalizeSudanesePhone(form.parentPhone), totalFees, gender: form.gender === "male" || form.gender === "female" ? form.gender : undefined, dateOfBirth: form.dateOfBirth || undefined };
    try {
      if (editingId) {
        const current = s.students.find((item) => item.id === editingId);
        if (current && (current.classId !== value.classId || current.totalFees !== value.totalFees) && !window.confirm("تغيير الفصل أو الرسوم السنوية قد يؤثر على متابعة الطالب وكشف الرسوم. هل تؤكد التعديل؟")) return;
        updateStudent(editingId, value);
      } else addStudent({ ...value, status: "active" });
      toast.success("تم حفظ بيانات الطالب"); setFormOpen(false);
    }
    catch (error) { toast.error(error instanceof Error ? error.message : "تعذر حفظ البيانات"); }
  }
  function closeStudentDrawer(open: boolean) {
    if (open) return;
    setSelectedStudent(null);
    if (studentId) void navigate({ to: "/app/students", search: {} });
  }

  function exportCurrent() {
    const lines = [IMPORT_COLUMNS, ...visibleRows.map((student) => [student.name, student.academicId, s.classes.find((item) => item.id === student.classId)?.name ?? student.classId, student.gender === "female" ? "أنثى" : "ذكر", student.dateOfBirth ?? "", student.parentName, student.parentPhone, String(student.totalFees)])];
    const csv = `\uFEFF${lines.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "students-current-filter.csv"; anchor.click(); URL.revokeObjectURL(url);
  }
  function mapImportRow(row: Record<string, string>): StudentImportRow {
    const name = normalizeCell(row["الاسم"]); const academicId = normalizeCell(row["الرقم الأكاديمي"]); const classText = normalizeCell(row["الفصل"]);
    const schoolClass = stageClasses.find((item) => item.id === classText || item.name === classText || item.short === classText);
    const totalFees = Number(normalizeCell(row["الرسوم السنوية"]).replace(/[,،]/g, ""));
    if (!name) throw new Error("الاسم مطلوب"); if (!academicId) throw new Error("الرقم الأكاديمي مطلوب"); if (!schoolClass) throw new Error("الفصل غير موجود"); if (!row["اسم ولي الأمر"]?.trim()) throw new Error("اسم ولي الأمر مطلوب"); if (!normalizeSudanesePhone(row["هاتف ولي الأمر"])) throw new Error("هاتف ولي الأمر مطلوب"); if (!Number.isFinite(totalFees) || totalFees <= 0) throw new Error("الرسوم السنوية غير صحيحة");
    const genderText = normalizeCell(row["النوع"]).toLowerCase();
    const gender = genderText.includes("أنثى") || genderText === "female" ? "female" : genderText.includes("ذكر") || genderText === "male" ? "male" : undefined;
    if (genderText && !gender) throw new Error("النوع يجب أن يكون ذكر أو أنثى");
    return { name, academicId, classId: schoolClass.id, totalFees, parentName: normalizeCell(row["اسم ولي الأمر"]), parentPhone: normalizeSudanesePhone(row["هاتف ولي الأمر"]), gender, dateOfBirth: normalizeCell(row["تاريخ الميلاد"]) || undefined };
  }
  const templateRows = [["طالب تجريبي", "MNH-2026-9001", stageClasses[0]?.name ?? "", "ذكر", "2014-01-15", "محمد أحمد", "0912345678", "900000"], ["طالبة تجريبية", "MNH-2026-9002", stageClasses[0]?.name ?? "", "أنثى", "2013-06-10", "عثمان علي", "0991234567", "950000"]];

  if (me.role !== "admin") return <Panel><p className="py-8 text-center text-sm">هذه الصفحة متاحة للإدارة فقط.</p></Panel>;

  return <div className="space-y-5">
    <PageHeader title="إدارة الطلبة" subtitle={`إدارة سجلات ${s.stages.find((item) => item.id === stageId)?.name ?? "المرحلة"}`} icon={Users} action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={exportCurrent}><Download className="me-2 h-4 w-4" />تصدير القائمة الحالية إلى CSV</Button><Button variant="outline" onClick={() => setImportOpen(true)}><FileUp className="me-2 h-4 w-4" />استيراد</Button><Button onClick={startCreate}><Plus className="me-2 h-4 w-4" />إضافة طالب</Button></div>} />
    <Panel className="space-y-3"><div className="grid gap-2 md:grid-cols-3"><div className="relative"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="بحث بالاسم أو الرقم الأكاديمي" className="ps-9" /></div><select className="h-10 rounded-lg border bg-background px-3 text-sm" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option value="all">كل فصول المرحلة</option>{stageClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className="h-10 rounded-lg border bg-background px-3 text-sm" value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">ترتيب بالاسم</option><option value="remaining">الأعلى متبقياً من الرسوم</option></select></div><div className="grid grid-cols-2 gap-2 md:grid-cols-4"><select className="h-10 rounded-lg border bg-background px-3 text-sm" value={feeFilter} onChange={(event) => setFeeFilter(event.target.value)}><option value="all">كل حالات الرسوم</option><option>مكتمل</option><option>جزئي</option><option>متأخر</option></select><select className="h-10 rounded-lg border bg-background px-3 text-sm" value={attendanceFilter} onChange={(event) => setAttendanceFilter(event.target.value)}><option value="all">كل حالات الحضور</option><option>منتظم</option><option>تنبيه</option></select><select className="h-10 rounded-lg border bg-background px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="active">نشطون</option><option value="archived">مؤرشفون</option><option value="all">كل الحالات</option></select><select className="h-10 rounded-lg border bg-background px-3 text-sm" value={importMode} onChange={(event) => setImportMode(event.target.value as typeof importMode)}><option value="new-only">الاستيراد: إضافة الجدد فقط</option><option value="update-existing">الاستيراد: تحديث الموجودين</option></select></div><p className="text-xs text-muted-foreground">{visibleRows.length.toLocaleString("ar-EG")} طالباً مطابقاً للفلاتر · {page}/{pageCount}</p></Panel>
    <div className="hidden overflow-hidden rounded-2xl border bg-card md:block"><table className="w-full text-sm"><thead className="bg-muted/60 text-xs"><tr><th className="p-3 text-start">الطالب</th><th className="p-3 text-start">الفصل</th><th className="p-3 text-start">الرسوم</th><th className="p-3 text-start">الحضور</th><th className="p-3 text-start">الحالة</th><th className="p-3" /></tr></thead><tbody>{pagedRows.map((student) => { const state = rowStatus(student, s); const cls = s.classes.find((item) => item.id === student.classId); return <tr key={student.id} className="border-t"><td className="p-3"><div className="font-bold">{student.name}</div><span className="font-mono text-xs text-muted-foreground" dir="ltr">{student.academicId}</span></td><td className="p-3">{cls?.short}</td><td className="p-3"><Badge variant={state.fees === "مكتمل" ? "success" : state.fees === "متأخر" ? "danger" : "warning"}>{state.fees}</Badge></td><td className="p-3"><Badge variant={state.attendance === "منتظم" ? "success" : "warning"}>{state.attendance}</Badge></td><td className="p-3"><Badge variant={student.status === "active" ? "secondary" : "outline"}>{student.status === "active" ? "نشط" : "مؤرشف"}</Badge></td><td className="p-3 text-end"><details className="relative inline-block"><summary className="cursor-pointer list-none rounded-lg p-2 hover:bg-muted"><MoreVertical className="h-4 w-4" /></summary><div className="absolute end-0 z-20 mt-1 w-36 rounded-xl border bg-card p-1 shadow-lg"><button className="w-full rounded-lg p-2 text-start text-xs hover:bg-muted" onClick={() => { setSelectedStudent(student); setDrawerTab("data"); }}>عرض الملف</button><button className="w-full rounded-lg p-2 text-start text-xs hover:bg-muted" onClick={() => startEdit(student)}>تعديل</button><button className="w-full rounded-lg p-2 text-start text-xs hover:bg-muted" onClick={() => student.status === "active" ? archiveStudent(student.id) : restoreStudent(student.id)}>{student.status === "active" ? "أرشفة" : "استعادة"}</button></div></details></td></tr>; })}</tbody></table></div>
    <div className="grid gap-3 md:hidden">{pagedRows.map((student) => { const state = rowStatus(student, s); const cls = s.classes.find((item) => item.id === student.classId); return <Panel key={student.id} className="space-y-2"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate font-bold">{student.name}</div><div className="font-mono text-xs text-muted-foreground" dir="ltr">{student.academicId}</div></div><details className="relative"><summary className="cursor-pointer list-none rounded-lg p-1"><MoreVertical className="h-4 w-4" /></summary><div className="absolute end-0 z-20 mt-1 w-32 rounded-xl border bg-card p-1 shadow-lg"><button className="w-full p-2 text-start text-xs" onClick={() => setSelectedStudent(student)}>عرض الملف</button><button className="w-full p-2 text-start text-xs" onClick={() => startEdit(student)}>تعديل</button><button className="w-full p-2 text-start text-xs" onClick={() => student.status === "active" ? archiveStudent(student.id) : restoreStudent(student.id)}>{student.status === "active" ? "أرشفة" : "استعادة"}</button></div></details></div><div className="flex flex-wrap items-center gap-2 text-xs"><Badge variant="outline">{cls?.short}</Badge><Badge variant={state.fees === "مكتمل" ? "success" : state.fees === "متأخر" ? "danger" : "warning"}>{state.fees}</Badge><Badge variant={state.attendance === "منتظم" ? "success" : "warning"}>{state.attendance}</Badge></div></Panel>; })}</div>
    {stageClasses.map((schoolClass) => { const count = classCounts.get(schoolClass.id) ?? 0; const capacity = schoolClass.capacity ?? 0; return capacity > 0 && count >= capacity * 0.9 ? <div key={schoolClass.id} className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">تنبيه سعة: {schoolClass.name} يضم {count} من {capacity} طالباً.</div> : null; })}
    <div className="flex items-center justify-center gap-3"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>السابق</Button><span className="text-xs text-muted-foreground">صفحة {page} من {pageCount}</span><Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>التالي</Button></div>

    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent><DialogHeader><DialogTitle>{editingId ? "تعديل بيانات الطالب" : "إضافة طالب"}</DialogTitle></DialogHeader><form onSubmit={saveForm} className="grid gap-3 sm:grid-cols-2"><label className="text-sm">الاسم<Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="text-sm">الرقم الأكاديمي<Input required dir="ltr" value={form.academicId} onChange={(event) => setForm({ ...form, academicId: event.target.value })} /></label><label className="text-sm">الفصل<select required value={form.classId} onChange={(event) => setForm({ ...form, classId: event.target.value })} className="mt-1 h-10 w-full rounded-lg border bg-background px-3"><option value="">اختر الفصل</option>{stageClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-sm">النوع<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} className="mt-1 h-10 w-full rounded-lg border bg-background px-3"><option value="">غير محدد</option><option value="male">ذكر</option><option value="female">أنثى</option></select></label><label className="text-sm">تاريخ الميلاد<Input type="date" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} /></label><label className="text-sm">اسم ولي الأمر<Input required value={form.parentName} onChange={(event) => setForm({ ...form, parentName: event.target.value })} /></label><label className="text-sm">هاتف ولي الأمر<Input required dir="ltr" value={form.parentPhone} onChange={(event) => setForm({ ...form, parentPhone: event.target.value })} /></label><label className="text-sm">الرسوم السنوية<Input required type="number" min="1" value={form.totalFees} onChange={(event) => setForm({ ...form, totalFees: event.target.value })} /></label><DialogFooter className="sm:col-span-2"><Button type="submit">حفظ البيانات</Button></DialogFooter></form></DialogContent></Dialog>
    <Sheet open={Boolean(selectedStudent)} onOpenChange={closeStudentDrawer}><SheetContent side="right" className="w-[min(100vw,480px)] overflow-y-auto"><SheetHeader><SheetTitle>ملف الطالب</SheetTitle></SheetHeader>{selectedStudent && <div className="mt-5 space-y-4"><div><div className="text-lg font-bold">{selectedStudent.name}</div><div className="text-xs text-muted-foreground" dir="ltr">{selectedStudent.academicId}</div></div><div className="flex gap-2 border-b pb-2"><Button size="sm" variant={drawerTab === "data" ? "default" : "outline"} onClick={() => setDrawerTab("data")}>البيانات</Button><Button size="sm" variant={drawerTab === "fees" ? "default" : "outline"} onClick={() => setDrawerTab("fees")}>الرسوم</Button><Button size="sm" variant={drawerTab === "attendance" ? "default" : "outline"} onClick={() => setDrawerTab("attendance")}>الحضور</Button></div>{drawerTab === "data" && <div className="space-y-2 text-sm"><p>الفصل: {s.classes.find((item) => item.id === selectedStudent.classId)?.name}</p><p>ولي الأمر: {selectedStudent.parentName}</p><p dir="ltr">{selectedStudent.parentPhone}</p><div className="flex gap-2"><a className="rounded-lg border px-3 py-2 text-xs" href={`tel:${selectedStudent.parentPhone}`}>اتصال</a><a className="rounded-lg border px-3 py-2 text-xs" target="_blank" rel="noreferrer" href={`https://wa.me/${whatsappNumber(selectedStudent.parentPhone)}`}>واتساب</a></div></div>}{drawerTab === "fees" && <p className="text-sm">{formatMoney(feeSummary(selectedStudent, s.payments, s.installments).remaining)} متبقي من الرسوم</p>}{drawerTab === "attendance" && <p className="text-sm">نسبة الحضور: {attendanceStats(s.attendance, selectedStudent.id).rate}٪</p>}</div>}</SheetContent></Sheet>
    <ImportDialog open={importOpen} onOpenChange={setImportOpen} title="استيراد الطلبة" requiredColumns={IMPORT_COLUMNS} templateFilename="students-template.csv" sampleRows={templateRows} mapRow={mapImportRow} onConfirm={(rows) => { const result = importStudents(rows, importMode); return result; }} />
  </div>;
}
