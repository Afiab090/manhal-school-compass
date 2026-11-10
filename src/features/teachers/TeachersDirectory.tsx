import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Download,
  Edit2,
  FileSpreadsheet,
  GraduationCap,
  Layers,
  MessageCircle,
  MoreVertical,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, Panel, StatCard } from "@/components/school/bits";
import { ImportDialog } from "@/components/school/ImportDialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadCsvTemplate } from "@/lib/school/import";
import {
  addTeacher,
  archiveTeacher,
  assignTeacherClasses,
  importTeachers,
  restoreTeacher,
  updateTeacher,
} from "@/lib/school/store";
import type { StageId, Teacher } from "@/lib/school/types";
import { cn } from "@/lib/utils";

const TEACHER_REQUIRED_COLUMNS = [
  "الاسم",
  "الرقم الوظيفي",
  "المادة",
  "الهاتف",
  "الفصول",
  "المراحل",
];

const TEACHER_TEMPLATE_SAMPLE = [
  ["أ. ياسين عبد الله", "T-401", "الرياضيات", "0912111333", "الصف الأول الثانوي (أ)", "المرحلة الثانوية"],
  ["أ. مروة السر علي", "T-402", "اللغة العربية", "0912222444", "الصف الأول المتوسط", "المرحلة المتوسطة"],
];

const MAX_WEEKLY_PERIODS = 25;

export function TeachersDirectory() {
  const { s, me } = useMe();
  const currentStage: StageId = me.stageId || "المرحلة الثانوية";

  // State
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>(currentStage);
  const [workloadFilter, setWorkloadFilter] = useState<"all" | "no_classes" | "overloaded">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("active");

  // Modals
  const [addTeacherOpen, setAddTeacherOpen] = useState(false);
  const [editTeacherData, setEditTeacherData] = useState<Teacher | null>(null);
  const [assignClassesData, setAssignClassesData] = useState<Teacher | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<{ teacher: Teacher; slotCount: number } | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmpId, setFormEmpId] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formStageIds, setFormStageIds] = useState<StageId[]>([currentStage]);
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);

  // Unique subjects
  const subjects = useMemo(() => {
    return Array.from(new Set(s.teachers.map((t) => t.subject)));
  }, [s.teachers]);

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return s.teachers.filter((t) => {
      // Status
      if (statusFilter !== "all" && t.status !== statusFilter) return false;

      // Stage
      if (selectedStageFilter !== "all") {
        const tStages = t.stageIds ?? [];
        const tClasses = s.classes.filter((c) => t.classes?.includes(c.id));
        const matchesStage = tStages.includes(selectedStageFilter as StageId) || tClasses.some((c) => c.stageId === selectedStageFilter);
        if (!matchesStage) return false;
      }

      // Subject
      if (selectedSubject !== "all" && t.subject !== selectedSubject) return false;

      // Workload
      const periodsCount = s.slots.filter((sl) => sl.teacherId === t.id).length;
      if (workloadFilter === "no_classes" && (t.classes?.length ?? 0) > 0) return false;
      if (workloadFilter === "overloaded" && periodsCount <= MAX_WEEKLY_PERIODS) return false;

      // Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const match = t.name.toLowerCase().includes(q) || t.employeeId.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.phone.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [s.teachers, statusFilter, selectedStageFilter, selectedSubject, workloadFilter, search, s.slots, s.classes]);

  const handleOpenAdd = () => {
    setFormName("");
    setFormEmpId("");
    setFormSubject("");
    setFormPhone("");
    setFormStageIds([currentStage]);
    setAddTeacherOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditTeacherData(teacher);
    setFormName(teacher.name);
    setFormEmpId(teacher.employeeId);
    setFormSubject(teacher.subject);
    setFormPhone(teacher.phone);
    setFormStageIds(teacher.stageIds && teacher.stageIds.length > 0 ? teacher.stageIds : [currentStage]);
  };

  const handleOpenAssign = (teacher: Teacher) => {
    setAssignClassesData(teacher);
    setAssignedClassIds(teacher.classes ?? []);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmpId.trim() || !formSubject.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (editTeacherData) {
      const res = updateTeacher(editTeacherData.id, {
        name: formName.trim(),
        employeeId: formEmpId.trim(),
        subject: formSubject.trim(),
        phone: formPhone.trim(),
        stageIds: formStageIds,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("تم تحديث بيانات المعلم بنجاح");
      setEditTeacherData(null);
    } else {
      const res = addTeacher({
        name: formName.trim(),
        employeeId: formEmpId.trim(),
        subject: formSubject.trim(),
        phone: formPhone.trim(),
        status: "active",
        stageIds: formStageIds,
        classes: [],
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("تمت إضافة المعلم بنجاح");
      setAddTeacherOpen(false);
    }
  };

  const handleSaveAssignedClasses = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignClassesData) return;
    assignTeacherClasses(assignClassesData.id, assignedClassIds);
    toast.success(`تم تحديث الفصول المسندة للأستاذ: ${assignClassesData.name}`);
    setAssignClassesData(null);
  };

  const handleRequestArchive = (teacher: Teacher) => {
    const slotCount = s.slots.filter((sl) => sl.teacherId === teacher.id).length;
    setArchiveTarget({ teacher, slotCount });
  };

  const handleConfirmArchive = () => {
    if (!archiveTarget) return;
    archiveTeacher(archiveTarget.teacher.id);
    toast.success(`تمت أرشفة المعلم: ${archiveTarget.teacher.name}`);
    setArchiveTarget(null);
  };

  // Export CSV
  const handleExportCsv = () => {
    const rows = filteredTeachers.map((t) => {
      const periodsCount = s.slots.filter((sl) => sl.teacherId === t.id).length;
      const classNames = s.classes.filter((c) => t.classes?.includes(c.id)).map((c) => c.name).join(" - ");
      const stageNames = (t.stageIds ?? []).join(" - ");

      return [
        t.name,
        t.employeeId,
        t.subject,
        t.phone,
        classNames || "بدون فصول",
        stageNames || "غير محدد",
        String(periodsCount),
        t.status === "active" ? "نشط" : "مؤرشف",
      ];
    });

    const headers = [
      "اسم المعلم",
      "الرقم الوظيفي",
      "المادة",
      "رقم الهاتف",
      "الفصول المسندة",
      "المراحل",
      "النصاب الأسبوعي (حصص)",
      "الحالة",
    ];

    downloadCsvTemplate(`كشف_المعلمين_${selectedStageFilter}.csv`, headers, rows);
    toast.success("تم تصدير كشف المعلمين بنجاح");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-gold" />
            إدارة هيئة التدريس والمعلمين
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            توزيع المواد، إسناد الفصول، متابعة النصاب التدريسي، واستيراد ملفات المعلمين
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-2 text-xs font-bold"
          >
            <Download className="h-4 w-4" />
            تصدير CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
            className="gap-2 text-xs font-bold border-gold text-navy hover:bg-gold-soft"
          >
            <FileSpreadsheet className="h-4 w-4 text-gold" />
            استيراد معلمين
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="gap-2 bg-primary hover:bg-navy font-bold text-xs"
          >
            <Plus className="h-4 w-4" />
            إضافة معلم جديد
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <Panel className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute end-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم، المادة، أو الرقم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pe-8 text-xs font-medium"
            />
          </div>

          {/* Stage Filter */}
          <select
            value={selectedStageFilter}
            onChange={(e) => setSelectedStageFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-bold text-foreground focus:outline-none"
          >
            <option value="all">كافة المراحل</option>
            <option value="مرحلة الأساس">مرحلة الأساس</option>
            <option value="المرحلة المتوسطة">المرحلة المتوسطة</option>
            <option value="المرحلة الثانوية">المرحلة الثانوية</option>
          </select>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-bold text-foreground focus:outline-none"
          >
            <option value="all">كافة المواد الدراسية</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Workload Filter */}
          <select
            value={workloadFilter}
            onChange={(e) => setWorkloadFilter(e.target.value as any)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-bold text-foreground focus:outline-none"
          >
            <option value="all">حمل التدريس (الكل)</option>
            <option value="no_classes">بدون فصول مسندة</option>
            <option value="overloaded">حمل زائد (&gt; ٢٥ حصة)</option>
          </select>

          {/* Status active/archived */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-bold text-foreground focus:outline-none"
          >
            <option value="active">المعلمون النشطون فقط</option>
            <option value="archived">المعلمون المؤرشفون</option>
            <option value="all">كافة الحالات</option>
          </select>
        </div>
      </Panel>

      {/* Teachers List: Desktop Table & Mobile Cards */}
      {filteredTeachers.length === 0 ? (
        <EmptyState icon={GraduationCap} title="لا توجد نتائج مطابقة للمعلمين" />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl border bg-card overflow-hidden shadow-card">
            <table className="w-full text-start text-xs">
              <thead className="bg-muted/50 border-b text-muted-foreground font-bold">
                <tr>
                  <th className="py-3 px-3 text-start">الرقم الوظيفي</th>
                  <th className="py-3 px-3 text-start">اسم المعلم</th>
                  <th className="py-3 px-3 text-start">المادة التخصصية</th>
                  <th className="py-3 px-3 text-start">الفصل / المراحل</th>
                  <th className="py-3 px-3 text-center">النصاب الأسبوعي</th>
                  <th className="py-3 px-3 text-center">التواصل</th>
                  <th className="py-3 px-3 text-center">الحالة</th>
                  <th className="py-3 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTeachers.map((t) => {
                  const periodsCount = s.slots.filter((sl) => sl.teacherId === t.id).length;
                  const isOverloaded = periodsCount > MAX_WEEKLY_PERIODS;
                  const assignedClasses = s.classes.filter((c) => t.classes?.includes(c.id));

                  return (
                    <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-navy">{t.employeeId}</td>
                      <td className="py-3 px-3 font-bold text-foreground">{t.name}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-xs font-bold">
                          {t.subject}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        <div className="font-semibold text-foreground">
                          {assignedClasses.length > 0 ? assignedClasses.map((c) => c.short).join("، ") : "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {(t.stageIds ?? []).join(" · ")}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={isOverloaded ? "destructive" : "default"}
                          className="font-mono text-xs font-bold"
                        >
                          {periodsCount} حصة / أسبوع
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={`tel:${t.phone}`}
                            className="h-7 w-7 rounded-lg border bg-muted/30 hover:bg-muted flex items-center justify-center text-navy"
                            title="اتصال هاتفي"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/249${t.phone.replace(/^0/, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="h-7 w-7 rounded-lg border bg-success-soft hover:bg-success-soft/80 flex items-center justify-center text-success"
                            title="محادثة واتساب"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={t.status === "active" ? "default" : "secondary"} className="text-[10px]">
                          {t.status === "active" ? "نشط" : "مؤرشف"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs font-semibold">
                            <DropdownMenuItem onClick={() => handleOpenEdit(t)}>
                              <Edit2 className="h-3.5 w-3.5 me-2" />
                              تعديل البيانات
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenAssign(t)}>
                              <Layers className="h-3.5 w-3.5 me-2" />
                              إسناد وتعديل الفصول
                            </DropdownMenuItem>
                            {t.status === "active" ? (
                              <DropdownMenuItem onClick={() => handleRequestArchive(t)} className="text-destructive">
                                <Archive className="h-3.5 w-3.5 me-2" />
                                أرشفة المعلم
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  restoreTeacher(t.id);
                                  toast.success(`تم استعادة قيد المعلم: ${t.name}`);
                                }}
                              >
                                <RotateCcw className="h-3.5 w-3.5 me-2" />
                                استعادة
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-3 md:hidden">
            {filteredTeachers.map((t) => {
              const periodsCount = s.slots.filter((sl) => sl.teacherId === t.id).length;
              const isOverloaded = periodsCount > MAX_WEEKLY_PERIODS;
              const assignedClasses = s.classes.filter((c) => t.classes?.includes(c.id));

              return (
                <div key={t.id} className="rounded-2xl border bg-card p-4 shadow-card space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-base text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {t.employeeId} · مادة {t.subject}
                      </div>
                    </div>
                    <Badge variant={isOverloaded ? "destructive" : "default"} className="font-mono text-xs">
                      {periodsCount} حصة
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <span className="font-bold text-foreground">الفصول المسندة: </span>
                    {assignedClasses.length > 0 ? assignedClasses.map((c) => c.short).join("، ") : "لا توجد فصول مسندة"}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t text-xs">
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${t.phone}`}
                        className="h-7 px-2.5 rounded-lg border bg-muted/40 hover:bg-muted text-navy flex items-center gap-1 font-bold text-[11px]"
                      >
                        <Phone className="h-3 w-3" /> اتصال
                      </a>
                      <a
                        href={`https://wa.me/249${t.phone.replace(/^0/, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-7 px-2.5 rounded-lg border bg-success-soft hover:bg-success-soft/80 text-success flex items-center gap-1 font-bold text-[11px]"
                      >
                        <MessageCircle className="h-3 w-3" /> واتساب
                      </a>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleOpenAssign(t)} className="h-7 text-xs font-bold">
                        إسناد فصول
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(t)} className="h-7 text-xs font-bold">
                        تعديل
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ADD / EDIT TEACHER MODAL */}
      <Dialog
        open={addTeacherOpen || !!editTeacherData}
        onOpenChange={(open) => {
          if (!open) {
            setAddTeacherOpen(false);
            setEditTeacherData(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTeacherData ? "تعديل بيانات المعلم" : "إضافة معلم جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTeacher} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label>اسم المعلم ثلاثي / رباعي *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="أ. عبد الله محمد أحمد"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الرقم الوظيفي *</Label>
                <Input
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(e.target.value)}
                  placeholder="T-109"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>المادة التخصصية *</Label>
                <Input
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="مثال: الرياضيات"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <Input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="0912345678"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <Label>المراحل التعليمية المسندة</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {(["مرحلة الأساس", "المرحلة المتوسطة", "المرحلة الثانوية"] as StageId[]).map((stage) => {
                  const isChecked = formStageIds.includes(stage);
                  return (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setFormStageIds(formStageIds.filter((s) => s !== stage));
                        } else {
                          setFormStageIds([...formStageIds, stage]);
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all",
                        isChecked ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border",
                      )}
                    >
                      {stage}
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddTeacherOpen(false);
                  setEditTeacherData(null);
                }}
              >
                إلغاء
              </Button>
              <Button type="submit" className="bg-primary hover:bg-navy font-bold">
                {editTeacherData ? "حفظ التعديلات" : "إضافة المعلم"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ASSIGN CLASSES MODAL */}
      <Dialog open={!!assignClassesData} onOpenChange={(open) => !open && setAssignClassesData(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إسناد الفصول للأستاذ: {assignClassesData?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAssignedClasses} className="space-y-4">
            <p className="text-xs text-muted-foreground">
              حدد الفصول التي يتولى الأستاذ تدريس مادة ({assignClassesData?.subject}) فيها:
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2 p-1 border rounded-2xl">
              {s.classes.map((cls) => {
                const isChecked = assignedClassIds.includes(cls.id);
                return (
                  <label
                    key={cls.id}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all",
                      isChecked ? "bg-primary/10 border-primary text-navy" : "border-border hover:bg-muted/30",
                    )}
                  >
                    <span>{cls.name} ({cls.stageId})</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setAssignedClassIds(assignedClassIds.filter((id) => id !== cls.id));
                        } else {
                          setAssignedClassIds([...assignedClassIds, cls.id]);
                        }
                      }}
                      className="accent-primary"
                    />
                  </label>
                );
              })}
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setAssignClassesData(null)}>
                إلغاء
              </Button>
              <Button type="submit" className="bg-primary hover:bg-navy font-bold">
                حفظ الفصول المسندة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ARCHIVE CONFIRMATION ALERT DIALOG (shows scheduled slots warning without deleting) */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد أرشفة المعلم</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>
                هل أنت متأكد من رغبتك في أرشفة الأستاذ ({archiveTarget?.teacher.name})؟
              </span>
              {archiveTarget && archiveTarget.slotCount > 0 && (
                <div className="p-3 rounded-xl bg-warning-soft text-warning-foreground text-xs font-bold mt-2">
                  تنبيه: يوجد لدى المعلم ({archiveTarget.slotCount}) حصة مجدولة في الجداول الدراسية. سيتم أرشفة حسابه مع الإبقاء على حصصه في الجدول دون حذفها حتى تقوم بتعيين معلم بديل.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmArchive} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              نعم، أرشفة المعلم
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* IMPORT TEACHERS DIALOG */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="استيراد وتحديث كشف المعلمين"
        description="استيراد كشف المعلمين من ملف Excel أو CSV مع تعيين المواد والمراحل"
        requiredColumns={TEACHER_REQUIRED_COLUMNS}
        templateFilename="نموذج_استيراد_المعلمين.csv"
        templateHeaders={TEACHER_REQUIRED_COLUMNS}
        templateSampleRows={TEACHER_TEMPLATE_SAMPLE}
        rowValidator={(row) => {
          const errors: string[] = [];
          if (!row["الاسم"]?.trim()) errors.push("اسم المعلم مفقود");
          if (!row["الرقم الوظيفي"]?.trim()) errors.push("الرقم الوظيفي مفقود");
          if (!row["المادة"]?.trim()) errors.push("المادة مفقودة");
          return { isValid: errors.length === 0, errors };
        }}
        onConfirmImport={async (validRows) => {
          const payload = validRows.map((row) => {
            const stagesRaw = (row["المراحل"] || "").split(/[-،,]/).map((s) => s.trim() as StageId).filter(Boolean);
            const classesRaw = (row["الفصول"] || "").split(/[-،,]/).map((c) => c.trim()).filter(Boolean);
            const matchedClassIds = s.classes.filter((c) => classesRaw.some((cr) => c.name.includes(cr) || c.short.includes(cr))).map((c) => c.id);

            return {
              name: row["الاسم"] || "معلم جديد",
              employeeId: row["الرقم الوظيفي"] || "",
              subject: row["المادة"] || "عام",
              phone: row["الهاتف"] || "",
              status: "active" as const,
              stageIds: stagesRaw.length > 0 ? stagesRaw : [currentStage],
              classes: matchedClassIds,
            };
          });

          const res = importTeachers(payload);
          return {
            added: res.added,
            updated: res.updated,
            ignored: res.errors.length,
          };
        }}
      />
    </div>
  );
}
