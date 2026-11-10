import { useMemo, useState } from "react";
import { Download, FileUp, GraduationCap, MoreVertical, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/school/bits";
import { ImportDialog } from "@/components/school/ImportDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { importTeachers, addTeacher, archiveTeacher, restoreTeacher, updateTeacher, type TeacherImportRow } from "@/lib/school/store";
import { MAX_WEEKLY_PERIODS } from "@/lib/school/logic";
import { normalizeCell, normalizeSudanesePhone } from "@/lib/school/import";
import type { StageId, Teacher } from "@/lib/school/types";
import { useMe } from "@/components/school/useMe";

const COLUMNS = ["الاسم", "الرقم الوظيفي", "المادة", "الهاتف", "الفصول", "المراحل"];
const EMPTY = { name: "", employeeId: "", subject: "", phone: "", classes: [] as string[], stageIds: [] as StageId[] };
function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("249") ? digits : digits.startsWith("0") ? `249${digits.slice(1)}` : `249${digits}`;
}

export function TeachersDirectory() {
  const { s, me } = useMe();
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState<string>(s.session?.stageId ?? "all");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [overloadedOnly, setOverloadedOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [importOpen, setImportOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Teacher | null>(null);
  const workloads = useMemo(() => new Map(s.teachers.map((teacher) => [teacher.id, s.slots.filter((slot) => slot.teacherId === teacher.id).length])), [s.teachers, s.slots]);
  const subjects = Array.from(new Set(s.teachers.map((teacher) => teacher.subject))).sort();
  const filtered = s.teachers.filter((teacher) => {
    if (statusFilter !== "all" && teacher.status !== statusFilter) return false;
    if (subjectFilter !== "all" && teacher.subject !== subjectFilter) return false;
    if (stageFilter !== "all" && !teacher.stageIds?.includes(stageFilter as StageId)) return false;
    if (unassignedOnly && (teacher.classes?.length ?? 0) > 0) return false;
    if (overloadedOnly && (workloads.get(teacher.id) ?? 0) <= MAX_WEEKLY_PERIODS) return false;
    return !query || `${teacher.name} ${teacher.employeeId} ${teacher.subject}`.toLowerCase().includes(query.toLowerCase());
  }).sort((a, b) => a.name.localeCompare(b.name, "ar"));

  function create() { setEditingId(null); setForm(EMPTY); setFormOpen(true); }
  function edit(teacher: Teacher) { setEditingId(teacher.id); setForm({ name: teacher.name, employeeId: teacher.employeeId, subject: teacher.subject, phone: teacher.phone, classes: [...(teacher.classes ?? [])], stageIds: [...(teacher.stageIds ?? [])] }); setFormOpen(true); }
  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.employeeId.trim() || !form.subject.trim() || !form.phone.trim() || !form.stageIds.length) { toast.error("أكمل الاسم والرقم الوظيفي والمادة والهاتف والمرحلة"); return; }
    try {
      const data = { name: form.name.trim(), employeeId: form.employeeId.trim(), subject: form.subject.trim(), phone: normalizeSudanesePhone(form.phone), classes: form.classes, stageIds: form.stageIds };
      if (editingId) updateTeacher(editingId, data); else addTeacher({ ...data, status: "active" });
      toast.success("تم حفظ بيانات المعلم"); setFormOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر حفظ بيانات المعلم"); }
  }
  function mapRow(row: Record<string, string>): TeacherImportRow {
    const name = normalizeCell(row["الاسم"]); const employeeId = normalizeCell(row["الرقم الوظيفي"]); const subject = normalizeCell(row["المادة"]); const phone = normalizeSudanesePhone(row["الهاتف"]);
    const classes = normalizeCell(row["الفصول"]).split(/[،,]/).map((value) => value.trim()).filter(Boolean).map((value) => s.classes.find((item) => item.id === value || item.name === value || item.short === value)?.id ?? "");
    const stageValues = normalizeCell(row["المراحل"]).split(/[،,]/).map((value) => value.trim()).filter(Boolean);
    const stageIds = stageValues.map((value) => s.stages.find((stage) => stage.id === value || stage.name === value)?.id).filter((id): id is StageId => Boolean(id));
    if (!name) throw new Error("الاسم مطلوب"); if (!employeeId) throw new Error("الرقم الوظيفي مطلوب"); if (!subject) throw new Error("المادة مطلوبة"); if (phone.length < 9) throw new Error("رقم الهاتف غير صحيح"); if (classes.some((id) => !id)) throw new Error("اسم أحد الفصول غير معروف"); if (!stageIds.length) throw new Error("المراحل غير معروفة");
    if (classes.some((id) => { const schoolClass = s.classes.find((item) => item.id === id); return !schoolClass || !stageIds.includes(schoolClass.stageId ?? "stg-pri"); })) throw new Error("الفصول المسندة يجب أن تتبع المراحل المحددة للمعلم");
    return { name, employeeId, subject, phone, classes, stageIds };
  }
  function exportCsv() {
    const lines = [COLUMNS, ...filtered.map((teacher) => [teacher.name, teacher.employeeId, teacher.subject, teacher.phone, (teacher.classes ?? []).map((id) => s.classes.find((item) => item.id === id)?.short ?? id).join("، "), (teacher.stageIds ?? []).map((id) => s.stages.find((stage) => stage.id === id)?.name ?? id).join("، ")])];
    const csv = `\uFEFF${lines.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "teachers.csv"; anchor.click(); URL.revokeObjectURL(url);
  }
  function confirmArchive() {
    if (!archiveTarget) return;
    try { archiveTeacher(archiveTarget.id); toast.success("تمت أرشفة المعلم مع الإبقاء على حصصه في الجدول"); } catch (error) { toast.error(error instanceof Error ? error.message : "تعذرت الأرشفة"); }
    setArchiveTarget(null);
  }
  const sample = [["أ. أحمد محمد علي", "T-900", "الرياضيات", "0912345678", "١ أساس بنين", "مرحلة الأساس"], ["أ. فاطمة عثمان", "T-901", "اللغة العربية", "0991234567", "٢ متوسط بنين", "المرحلة المتوسطة"]];

  if (me.role !== "admin") return <Panel><p className="py-8 text-center text-sm">هذه الصفحة متاحة للإدارة فقط.</p></Panel>;

  return <div className="space-y-5">
    <PageHeader title="إدارة المعلمين" subtitle="ملفات الهيئة التعليمية والإسناد والنصاب الأسبوعي" icon={GraduationCap} action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={exportCsv}><Download className="me-2 h-4 w-4" />تصدير CSV</Button><Button variant="outline" onClick={() => setImportOpen(true)}><FileUp className="me-2 h-4 w-4" />استيراد</Button><Button onClick={create}><Plus className="me-2 h-4 w-4" />إضافة معلم</Button></div>} />
    <Panel className="space-y-3"><div className="grid gap-2 md:grid-cols-3"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث بالاسم أو الرقم الوظيفي أو المادة" /><select className="h-10 rounded-lg border bg-background px-3 text-sm" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}><option value="all">كل المواد</option>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select><select className="h-10 rounded-lg border bg-background px-3 text-sm" value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}><option value="all">كل المراحل</option>{s.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></div><div className="flex flex-wrap gap-4 text-xs"><label className="flex items-center gap-2"><input type="checkbox" checked={unassignedOnly} onChange={(event) => setUnassignedOnly(event.target.checked)} />بدون فصول مسندة</label><label className="flex items-center gap-2"><input type="checkbox" checked={overloadedOnly} onChange={(event) => setOverloadedOnly(event.target.checked)} />حمل زائد (أكثر من {MAX_WEEKLY_PERIODS})</label><select className="h-9 rounded-lg border bg-background px-2" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="active">نشط</option><option value="archived">مؤرشف</option><option value="all">كل الحالات</option></select><span className="text-muted-foreground">{filtered.length} معلم</span></div></Panel>
    <div className="hidden overflow-hidden rounded-2xl border bg-card md:block"><table className="w-full text-sm"><thead className="bg-muted/60 text-xs"><tr><th className="p-3 text-start">المعلم</th><th className="p-3 text-start">المادة</th><th className="p-3 text-start">الفصول المسندة</th><th className="p-3 text-start">النصاب الأسبوعي</th><th className="p-3 text-start">التواصل</th><th className="p-3" /></tr></thead><tbody>{filtered.map((teacher) => { const workload = workloads.get(teacher.id) ?? 0; const cls = (teacher.classes ?? []).map((id) => s.classes.find((item) => item.id === id)?.short ?? id).join("، "); return <tr key={teacher.id} className="border-t"><td className="p-3"><b className="block">{teacher.name}</b><span className="font-mono text-xs text-muted-foreground" dir="ltr">{teacher.employeeId}</span></td><td className="p-3">{teacher.subject}</td><td className="max-w-48 truncate p-3">{cls || "بدون إسناد"}</td><td className="p-3"><Badge variant={workload > MAX_WEEKLY_PERIODS ? "danger" : "secondary"}>{workload} / أسبوع</Badge></td><td className="p-3"><div className="flex gap-2"><a href={`tel:${teacher.phone}`} className="text-xs text-primary underline">اتصال</a><a href={`https://wa.me/${whatsappNumber(teacher.phone)}`} target="_blank" rel="noreferrer" className="text-xs text-primary underline">واتساب</a></div></td><td className="p-3 text-end"><details className="relative inline-block"><summary className="cursor-pointer list-none"><MoreVertical className="h-4 w-4" /></summary><div className="absolute end-0 z-10 w-36 rounded-xl border bg-card p-1 shadow-lg"><button className="w-full p-2 text-start text-xs hover:bg-muted" onClick={() => edit(teacher)}>تعديل</button><button className="w-full p-2 text-start text-xs hover:bg-muted" onClick={() => edit(teacher)}>إسناد الفصول</button><button className="w-full p-2 text-start text-xs hover:bg-muted" onClick={() => teacher.status === "active" ? setArchiveTarget(teacher) : restoreTeacher(teacher.id)}>{teacher.status === "active" ? "أرشفة" : "استعادة"}</button></div></details></td></tr>; })}</tbody></table></div>
    <div className="grid gap-3 md:hidden">{filtered.map((teacher) => { const workload = workloads.get(teacher.id) ?? 0; return <Panel key={teacher.id} className="space-y-2"><div className="flex items-start justify-between gap-2"><div><b>{teacher.name}</b><p className="text-xs text-muted-foreground" dir="ltr">{teacher.employeeId} · {teacher.subject}</p></div><details className="relative"><summary className="list-none"><MoreVertical className="h-4 w-4" /></summary><div className="absolute end-0 z-10 w-32 rounded-xl border bg-card p-1 shadow-lg"><button className="w-full p-2 text-start text-xs" onClick={() => edit(teacher)}>تعديل</button><button className="w-full p-2 text-start text-xs" onClick={() => edit(teacher)}>إسناد الفصول</button><button className="w-full p-2 text-start text-xs" onClick={() => teacher.status === "active" ? setArchiveTarget(teacher) : restoreTeacher(teacher.id)}>{teacher.status === "active" ? "أرشفة" : "استعادة"}</button></div></details></div><div className="flex flex-wrap items-center gap-2 text-xs"><Badge variant="outline">{workload} حصة أسبوعياً</Badge><Badge variant={workload > MAX_WEEKLY_PERIODS ? "danger" : "success"}>{workload > MAX_WEEKLY_PERIODS ? "حمل زائد" : "ضمن النصاب"}</Badge><span>{(teacher.classes ?? []).map((id) => s.classes.find((item) => item.id === id)?.short ?? id).join("، ") || "بدون فصول مسندة"}</span></div><div className="flex gap-3 text-xs"><a href={`tel:${teacher.phone}`} className="text-primary underline">اتصال</a><a href={`https://wa.me/${whatsappNumber(teacher.phone)}`} target="_blank" rel="noreferrer" className="text-primary underline">واتساب</a></div></Panel>; })}</div>
    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent><DialogHeader><DialogTitle>{editingId ? "تعديل المعلم وإسناده" : "إضافة معلم"}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-3"><label className="block text-sm">الاسم<Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">الرقم الوظيفي<Input required dir="ltr" value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} /></label><label className="text-sm">المادة<Input required value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></label><label className="text-sm">الهاتف<Input required dir="ltr" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label></div><div className="space-y-2"><span className="text-sm font-semibold">المراحل</span><div className="flex flex-wrap gap-3">{s.stages.map((stage) => <label key={stage.id} className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={form.stageIds.includes(stage.id)} onChange={(event) => setForm({ ...form, stageIds: event.target.checked ? [...form.stageIds, stage.id] : form.stageIds.filter((id) => id !== stage.id) })} />{stage.name}</label>)}</div></div><div className="space-y-2"><span className="text-sm font-semibold">الفصول المسندة</span><div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto">{s.classes.filter((item) => form.stageIds.includes(item.stageId ?? "stg-pri")).map((schoolClass) => <label key={schoolClass.id} className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={form.classes.includes(schoolClass.id)} onChange={(event) => setForm({ ...form, classes: event.target.checked ? [...form.classes, schoolClass.id] : form.classes.filter((id) => id !== schoolClass.id) })} />{schoolClass.short}</label>)}</div></div><DialogFooter><Button type="submit">حفظ</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={Boolean(archiveTarget)} onOpenChange={(open) => !open && setArchiveTarget(null)}><DialogContent><DialogHeader><DialogTitle>تأكيد أرشفة المعلم</DialogTitle></DialogHeader><p className="text-sm">المعلم {archiveTarget?.name} لديه {workloads.get(archiveTarget?.id ?? "") ?? 0} حصة مجدولة. ستظل الحصص محفوظة في الجدول ولن يتم حذفها. هل تريد المتابعة؟</p><DialogFooter><Button variant="outline" onClick={() => setArchiveTarget(null)}>إلغاء</Button><Button variant="destructive" onClick={confirmArchive}>تأكيد الأرشفة</Button></DialogFooter></DialogContent></Dialog>
    <ImportDialog open={importOpen} onOpenChange={setImportOpen} title="استيراد المعلمين" requiredColumns={COLUMNS} templateFilename="teachers-template.csv" sampleRows={sample} mapRow={mapRow} onConfirm={importTeachers} />
  </div>;
}
