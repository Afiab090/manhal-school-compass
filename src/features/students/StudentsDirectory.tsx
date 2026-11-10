import {
  AlertCircle,
  Archive,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  MessageCircle,
  MoreVertical,
  Phone,
  Plus,
  RotateCcw,
  Search,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, Panel, ProgressBar, StatCard } from "@/components/school/bits";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { downloadCsvTemplate } from "@/lib/school/import";
import {
  attendanceStats,
  feeSummary,
  formatDate,
  formatMoney,
  installmentStatuses,
} from "@/lib/school/logic";
import {
  addStudent,
  archiveStudent,
  importStudents,
  restoreStudent,
  updateStudent,
} from "@/lib/school/store";
import type { StageId, Student } from "@/lib/school/types";
import { cn } from "@/lib/utils";

const STUDENT_REQUIRED_COLUMNS = [
  "الاسم",
  "الرقم الأكاديمي",
  "الفصل",
  "النوع",
  "تاريخ الميلاد",
  "اسم ولي الأمر",
  "هاتف ولي الأمر",
  "الرسوم السنوية",
];

const STUDENT_TEMPLATE_SAMPLE = [
  ["أحمد محمد علي", "STD-SEC-2001", "الصف الأول الثانوي (أ)", "ذكر", "2010-04-12", "محمد علي", "0912111222", "750000"],
  ["سارة عثمان الطيب", "STD-SEC-2002", "الصف الأول الثانوي (أ)", "أنثى", "2010-06-15", "عثمان الطيب", "0912333444", "750000"],
];

export function StudentsDirectory() {
  const { s, me } = useMe();
  const currentStage: StageId = me.stageId || "المرحلة الثانوية";

  // State
  const [search, setSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [feeStatusFilter, setFeeStatusFilter] = useState<string>("all");
  const [attendanceFilter, setAttendanceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("active");
  const [sortBy, setSortBy] = useState<"name" | "remaining_desc">("name");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  // Modals & Drawers
  const [selectedStudentForDrawer, setSelectedStudentForDrawer] = useState<Student | null>(null);
  const [editStudentData, setEditStudentData] = useState<Student | null>(null);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importMode, setImportMode] = useState<"add_only" | "update_existing">("add_only");

  // Form state for Add/Edit
  const [formName, setFormName] = useState("");
  const [formAcademicId, setFormAcademicId] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formParentName, setFormParentName] = useState("");
  const [formParentPhone, setFormParentPhone] = useState("");
  const [formFees, setFormFees] = useState("");
  const [formGender, setFormGender] = useState<"male" | "female">("male");
  const [formDob, setFormDob] = useState("");

  // Stage-scoped classes
  const stageClasses = useMemo(() => s.classes.filter((c) => c.stageId === currentStage), [s.classes, currentStage]);
  const stageClassIds = useMemo(() => new Set(stageClasses.map((c) => c.id)), [stageClasses]);

  // Stage-scoped students
  const stageStudents = useMemo(() => {
    return s.students.filter((st) => stageClassIds.has(st.classId));
  }, [s.students, stageClassIds]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return stageStudents.filter((st) => {
      // Status filter
      if (statusFilter !== "all" && st.status !== statusFilter) return false;

      // Class filter
      if (selectedClassId !== "all" && st.classId !== selectedClassId) return false;

      // Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const match = st.name.toLowerCase().includes(q) || st.academicId.toLowerCase().includes(q) || st.parentPhone.includes(q);
        if (!match) return false;
      }

      // Fee status filter
      if (feeStatusFilter !== "all") {
        const summ = feeSummary(st, s.payments, s.installments);
        if (feeStatusFilter === "completed" && summ.remaining > 0) return false;
        if (feeStatusFilter === "partial" && (summ.paid === 0 || summ.remaining === 0)) return false;
        if (feeStatusFilter === "overdue" && summ.paid > 0) return false;
      }

      // Attendance filter
      if (attendanceFilter !== "all") {
        const att = attendanceStats(s.attendance, st.id);
        if (attendanceFilter === "regular" && att.rate < 80) return false;
        if (attendanceFilter === "warning" && att.rate >= 80) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      const remA = feeSummary(a, s.payments, s.installments).remaining;
      const remB = feeSummary(b, s.payments, s.installments).remaining;
      return remB - remA;
    });
  }, [stageStudents, statusFilter, selectedClassId, search, feeStatusFilter, attendanceFilter, sortBy, s.payments, s.installments, s.attendance]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, currentPage]);

  const handleOpenAdd = () => {
    setFormName("");
    setFormAcademicId("");
    setFormClassId(stageClasses[0]?.id || "");
    setFormParentName("");
    setFormParentPhone("");
    setFormFees(String(currentStage === "مرحلة الأساس" ? 450000 : currentStage === "المرحلة المتوسطة" ? 600000 : 750000));
    setFormGender("male");
    setFormDob("");
    setAddStudentOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditStudentData(student);
    setFormName(student.name);
    setFormAcademicId(student.academicId);
    setFormClassId(student.classId);
    setFormParentName(student.parentName);
    setFormParentPhone(student.parentPhone);
    setFormFees(String(student.totalFees));
    setFormGender(student.gender || "male");
    setFormDob(student.dateOfBirth || "");
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAcademicId.trim() || !formClassId) {
      toast.error("يرجى ملء الحقول الإلزامية");
      return;
    }

    const fees = Number(formFees);
    if (!fees || fees <= 0) {
      toast.error("يرجى إدخال رسوم سنوية صحيحة");
      return;
    }

    if (editStudentData) {
      const res = updateStudent(editStudentData.id, {
        name: formName.trim(),
        academicId: formAcademicId.trim(),
        classId: formClassId,
        parentName: formParentName.trim(),
        parentPhone: formParentPhone.trim(),
        totalFees: fees,
        gender: formGender,
        dateOfBirth: formDob || undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("تم تحديث بيانات الطالب بنجاح");
      setEditStudentData(null);
    } else {
      const res = addStudent({
        name: formName.trim(),
        academicId: formAcademicId.trim(),
        classId: formClassId,
        parentName: formParentName.trim(),
        parentPhone: formParentPhone.trim(),
        totalFees: fees,
        status: "active",
        gender: formGender,
        dateOfBirth: formDob || undefined,
        enrollmentDate: new Date().toISOString().slice(0, 10),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("تم تسجيل الطالب الجديد بنجاح");
      setAddStudentOpen(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const rows = filteredStudents.map((st) => {
      const cls = s.classes.find((c) => c.id === st.classId);
      const summ = feeSummary(st, s.payments, s.installments);
      return [
        st.name,
        st.academicId,
        cls?.name || "",
        st.gender === "female" ? "أنثى" : "ذكر",
        st.dateOfBirth || "",
        st.parentName,
        st.parentPhone,
        String(st.totalFees),
        String(summ.paid),
        String(summ.remaining),
        st.status === "active" ? "نشط" : "مؤرشف",
      ];
    });

    const headers = [
      "اسم الطالب",
      "الرقم الأكاديمي",
      "الفصل",
      "النوع",
      "تاريخ الميلاد",
      "ولي الأمر",
      "هاتف ولي الأمر",
      "الرسوم المقررة",
      "المسدد",
      "المتبقي",
      "حالة القيد",
    ];

    downloadCsvTemplate(`كشف_الطلاب_${currentStage}.csv`, headers, rows);
    toast.success("تم تصدير القائمة الحالية بنجاح");
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
            <Users className="h-6 w-6 text-gold" />
            إدارة شؤون الطلاب — {currentStage}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            متابعة السجلات الأكاديمية، الرسوم، الحضور، والاستيراد الجماعي للطلاب
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
            استيراد طلاب
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="gap-2 bg-primary hover:bg-navy font-bold text-xs"
          >
            <Plus className="h-4 w-4" />
            إضافة طالب جديد
          </Button>
        </div>
      </div>

      {/* Class Capacity Warnings (if approaching or exceeding capacity) */}
      <div className="grid gap-2 sm:grid-cols-3">
        {stageClasses.map((cls) => {
          const count = stageStudents.filter((st) => st.classId === cls.id && st.status === "active").length;
          const isOver = count >= cls.capacity;
          const isNear = count >= cls.capacity - 2 && !isOver;

          if (!isOver && !isNear) return null;

          return (
            <div
              key={cls.id}
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-bold",
                isOver ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-warning-soft/40 text-warning-foreground border-warning/40",
              )}
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                {cls.name}: {count} / {cls.capacity} طالب ({isOver ? "اكتملت السعة الاستيعابية" : "اقتربت السعة من الامتلاء"})
              </span>
            </div>
          );
        })}
      </div>

      {/* Toolbar & Filters Scoped to Stage */}
      <Panel className="space-y-3 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute end-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الرقم الأكاديمي..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 pe-8 text-xs font-medium"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-bold text-foreground focus:outline-none"
          >
            <option value="all">كافة الفصول ({stageClasses.length})</option>
            {stageClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Fee Status */}
          <select
            value={feeStatusFilter}
            onChange={(e) => {
              setFeeStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-bold text-foreground focus:outline-none"
          >
            <option value="all">حالة الرسوم (الكل)</option>
            <option value="completed">مسدد بالكامل</option>
            <option value="partial">سداد جزئي</option>
            <option value="overdue">متأخر / لم يسدد</option>
          </select>

          {/* Attendance */}
          <select
            value={attendanceFilter}
            onChange={(e) => {
              setAttendanceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-bold text-foreground focus:outline-none"
          >
            <option value="all">حالة الحضور (الكل)</option>
            <option value="regular">منتظم (≥ ٨٠٪)</option>
            <option value="warning">تنبيه غياب (&lt; ٨٠٪)</option>
          </select>

          {/* Status active/archived */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-bold text-foreground focus:outline-none"
          >
            <option value="active">الطلبة النشطون فقط</option>
            <option value="archived">الطلبة المؤرشفون</option>
            <option value="all">كافة الحالات</option>
          </select>
        </div>

        {/* Sort and Count Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs text-muted-foreground">
          <div className="font-semibold">
            عرض {paginatedStudents.length} من أصل {filteredStudents.length} طالباً
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold">ترتيب حسب:</span>
            <button
              type="button"
              onClick={() => setSortBy(sortBy === "name" ? "remaining_desc" : "name")}
              className="inline-flex items-center gap-1 font-bold text-navy hover:text-gold"
            >
              <ArrowUpDown className="h-3 w-3" />
              {sortBy === "name" ? "الاسم أبجدياً" : "المتبقي من الرسوم (تنازلي)"}
            </button>
          </div>
        </div>
      </Panel>

      {/* Responsive View: Table on Desktop, Cards on Mobile */}
      {paginatedStudents.length === 0 ? (
        <EmptyState icon={Users} title="لا توجد نتائج مطابقة لمعايير البحث" />
      ) : (
        <>
          {/* Desktop Table (hidden on sm) */}
          <div className="hidden md:block rounded-2xl border bg-card overflow-hidden shadow-card">
            <table className="w-full text-start text-xs">
              <thead className="bg-muted/50 border-b text-muted-foreground font-bold">
                <tr>
                  <th className="py-3 px-3 text-start">الرقم الأكاديمي</th>
                  <th className="py-3 px-3 text-start">اسم الطالب</th>
                  <th className="py-3 px-3 text-start">الفصل</th>
                  <th className="py-3 px-3 text-start">ولي الأمر والهاتف</th>
                  <th className="py-3 px-3 text-center">حالة الرسوم</th>
                  <th className="py-3 px-3 text-center">الحضور</th>
                  <th className="py-3 px-3 text-center">حالة القيد</th>
                  <th className="py-3 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedStudents.map((st) => {
                  const cls = s.classes.find((c) => c.id === st.classId);
                  const summ = feeSummary(st, s.payments, s.installments);
                  const att = attendanceStats(s.attendance, st.id);

                  return (
                    <tr key={st.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-navy">{st.academicId}</td>
                      <td className="py-3 px-3 font-bold text-foreground">{st.name}</td>
                      <td className="py-3 px-3 text-muted-foreground font-semibold">{cls?.name}</td>
                      <td className="py-3 px-3 text-muted-foreground">
                        <div className="font-semibold text-foreground">{st.parentName}</div>
                        <div className="font-mono text-[11px] text-muted-foreground" dir="ltr">{st.parentPhone}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={summ.percent >= 100 ? "success" : summ.percent > 0 ? "gold" : "destructive"}
                          className="text-[10px] font-bold"
                        >
                          {summ.percent >= 100 ? "مكتمل" : summ.percent > 0 ? `جزئي (${summ.percent}٪)` : "متأخر"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={att.rate >= 80 ? "outline" : "destructive"}
                          className="text-[10px] font-bold"
                        >
                          {att.rate}٪
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={st.status === "active" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {st.status === "active" ? "نشط" : "مؤرشف"}
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
                            <DropdownMenuItem onClick={() => setSelectedStudentForDrawer(st)}>
                              <Eye className="h-3.5 w-3.5 me-2" />
                              عرض ملف الطالب
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(st)}>
                              <Edit2 className="h-3.5 w-3.5 me-2" />
                              تعديل البيانات
                            </DropdownMenuItem>
                            {st.status === "active" ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  archiveStudent(st.id);
                                  toast.success(`تم أرشفة الطالب: ${st.name}`);
                                }}
                                className="text-destructive"
                              >
                                <Archive className="h-3.5 w-3.5 me-2" />
                                أرشفة السجل
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  restoreStudent(st.id);
                                  toast.success(`تم استعادة الطالب: ${st.name}`);
                                }}
                              >
                                <RotateCcw className="h-3.5 w-3.5 me-2" />
                                استعادة القيد
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

          {/* Mobile Cards (shown on mobile, no horizontal scroll) */}
          <div className="grid gap-3 md:hidden">
            {paginatedStudents.map((st) => {
              const cls = s.classes.find((c) => c.id === st.classId);
              const summ = feeSummary(st, s.payments, s.installments);
              const att = attendanceStats(s.attendance, st.id);

              return (
                <div key={st.id} className="rounded-2xl border bg-card p-4 shadow-card space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-base text-foreground">{st.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{st.academicId} · {cls?.name}</div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs font-semibold">
                        <DropdownMenuItem onClick={() => setSelectedStudentForDrawer(st)}>
                          <Eye className="h-3.5 w-3.5 me-2" />
                          عرض الملف
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(st)}>
                          <Edit2 className="h-3.5 w-3.5 me-2" />
                          تعديل
                        </DropdownMenuItem>
                        {st.status === "active" ? (
                          <DropdownMenuItem onClick={() => archiveStudent(st.id)} className="text-destructive">
                            <Archive className="h-3.5 w-3.5 me-2" />
                            أرشفة
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => restoreStudent(st.id)}>
                            <RotateCcw className="h-3.5 w-3.5 me-2" />
                            استعادة
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">الرسوم:</span>
                      <span className="font-mono font-bold text-navy">{formatMoney(summ.remaining)} متبقي</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">الحضور:</span>
                      <span className="font-mono font-bold text-foreground">{att.rate}٪ ({att.present} يوم)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t text-xs">
                    <span className="text-muted-foreground">{st.parentName}</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${st.parentPhone}`}
                        className="h-7 px-2.5 rounded-lg border bg-muted/40 hover:bg-muted text-navy flex items-center gap-1 font-bold text-[11px]"
                      >
                        <Phone className="h-3 w-3" /> اتصال
                      </a>
                      <a
                        href={`https://wa.me/249${st.parentPhone.replace(/^0/, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-7 px-2.5 rounded-lg border bg-success-soft hover:bg-success-soft/80 text-success flex items-center gap-1 font-bold text-[11px]"
                      >
                        <MessageCircle className="h-3 w-3" /> واتساب
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-xs font-bold"
              >
                السابق
              </Button>
              <span className="text-xs font-semibold px-2">
                صفحة {currentPage} من {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="text-xs font-bold"
              >
                التالي
              </Button>
            </div>
          )}
        </>
      )}

      {/* STUDENT PROFILE DRAWER */}
      <Sheet open={!!selectedStudentForDrawer} onOpenChange={(open) => !open && setSelectedStudentForDrawer(null)}>
        <SheetContent side="left" className="sm:max-w-md w-full overflow-y-auto">
          {selectedStudentForDrawer && (
            <StudentDetailDrawer student={selectedStudentForDrawer} />
          )}
        </SheetContent>
      </Sheet>

      {/* ADD / EDIT STUDENT MODAL */}
      <Dialog
        open={addStudentOpen || !!editStudentData}
        onOpenChange={(open) => {
          if (!open) {
            setAddStudentOpen(false);
            setEditStudentData(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editStudentData ? "تعديل بيانات الطالب" : "تسجيل طالب جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveStudent} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label>الاسم الرباعي للطالب *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="أحمد محمد علي عبد الله"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الرقم الأكاديمي *</Label>
                <Input
                  value={formAcademicId}
                  onChange={(e) => setFormAcademicId(e.target.value)}
                  placeholder="STD-SEC-1001"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>الفصل الدراسي *</Label>
                <select
                  value={formClassId}
                  onChange={(e) => setFormClassId(e.target.value)}
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>اسم ولي الأمر</Label>
                <Input
                  value={formParentName}
                  onChange={(e) => setFormParentName(e.target.value)}
                  placeholder="محمد علي عبد الله"
                />
              </div>

              <div className="space-y-1.5">
                <Label>هاتف ولي الأمر</Label>
                <Input
                  value={formParentPhone}
                  onChange={(e) => setFormParentPhone(e.target.value)}
                  placeholder="0912111222"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الرسوم السنوية المقررة (ج.س) *</Label>
                <Input
                  type="number"
                  value={formFees}
                  onChange={(e) => setFormFees(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>النوع</Label>
                <select
                  value={formGender}
                  onChange={(e) => setFormGender(e.target.value as any)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs font-bold"
                >
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddStudentOpen(false);
                  setEditStudentData(null);
                }}
              >
                إلغاء
              </Button>
              <Button type="submit" className="bg-primary hover:bg-navy font-bold">
                {editStudentData ? "حفظ التعديلات" : "تسجيل الطالب"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* IMPORT STUDENTS DIALOG */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="استيراد وتحديث كشف الطلاب"
        description="استيراد دفعة من الطلاب من ملف Excel أو CSV مع إنشاء الأقساط تلقائياً"
        requiredColumns={STUDENT_REQUIRED_COLUMNS}
        templateFilename={`نموذج_استيراد_الطلاب_${currentStage}.csv`}
        templateHeaders={STUDENT_REQUIRED_COLUMNS}
        templateSampleRows={STUDENT_TEMPLATE_SAMPLE}
        extraOptions={
          <div className="space-y-2">
            <span className="text-xs font-bold text-foreground">وضع الاستيراد:</span>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="add_only"
                  checked={importMode === "add_only"}
                  onChange={() => setImportMode("add_only")}
                />
                <span>إضافة الطلاب الجدد فقط (تجاهل الموجودين مسبقاً)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="update_existing"
                  checked={importMode === "update_existing"}
                  onChange={() => setImportMode("update_existing")}
                />
                <span>تحديث بيانات الموجودين بالرقم الأكاديمي</span>
              </label>
            </div>
          </div>
        }
        rowValidator={(row) => {
          const errors: string[] = [];
          if (!row["الاسم"]?.trim()) errors.push("الاسم مفقود");
          if (!row["الرقم الأكاديمي"]?.trim()) errors.push("الرقم الأكاديمي مفقود");
          if (!row["الفصل"]?.trim()) errors.push("الفصل مفقود");
          return { isValid: errors.length === 0, errors };
        }}
        onConfirmImport={async (validRows) => {
          const payload = validRows.map((row) => {
            // Find class ID matching name or use default
            const targetCls = s.classes.find((c) => c.name.trim() === row["الفصل"]?.trim() || c.short.trim() === row["الفصل"]?.trim());
            const classId = targetCls ? targetCls.id : stageClasses[0]?.id || "c-sec-1a";

            return {
              name: row["الاسم"] || "طالب جديد",
              academicId: row["الرقم الأكاديمي"] || "",
              classId,
              gender: row["النوع"] === "أنثى" ? ("female" as const) : ("male" as const),
              dateOfBirth: row["تاريخ الميلاد"] || undefined,
              parentName: row["اسم ولي الأمر"] || "",
              parentPhone: row["هاتف ولي الأمر"] || "",
              totalFees: Number(row["الرسوم السنوية"]) || 750000,
              status: "active" as const,
              enrollmentDate: new Date().toISOString().slice(0, 10),
            };
          });

          const res = importStudents(payload, importMode);
          return {
            added: res.added,
            updated: res.updated,
            ignored: res.ignored,
          };
        }}
      />
    </div>
  );
}

function StudentDetailDrawer({ student }: { student: Student }) {
  const { s } = useMe();
  const [tab, setTab] = useState<"info" | "fees" | "attendance">("info");

  const cls = s.classes.find((c) => c.id === student.classId);
  const summ = feeSummary(student, s.payments, s.installments);
  const att = attendanceStats(s.attendance, student.id);
  const installments = installmentStatuses(student.id, s.payments, s.installments, new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-6 pt-6">
      <SheetHeader className="text-start">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-bold">{cls?.name}</Badge>
          <Badge variant={student.status === "active" ? "default" : "secondary"} className="text-[10px]">
            {student.status === "active" ? "نشط" : "مؤرشف"}
          </Badge>
        </div>
        <SheetTitle className="text-xl font-bold text-navy mt-1">{student.name}</SheetTitle>
        <div className="text-xs font-mono text-muted-foreground">{student.academicId}</div>
      </SheetHeader>

      {/* Tabs */}
      <div className="flex border-b gap-2 pb-2">
        <Button
          variant={tab === "info" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("info")}
          className="rounded-xl text-xs font-bold"
        >
          البيانات
        </Button>
        <Button
          variant={tab === "fees" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("fees")}
          className="rounded-xl text-xs font-bold"
        >
          الرسوم ({summ.percent}٪)
        </Button>
        <Button
          variant={tab === "attendance" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("attendance")}
          className="rounded-xl text-xs font-bold"
        >
          الحضور ({att.rate}٪)
        </Button>
      </div>

      {tab === "info" && (
        <div className="space-y-4 text-xs">
          <div className="rounded-2xl border bg-muted/20 p-4 space-y-2.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ولي الأمر:</span>
              <span className="font-bold text-foreground">{student.parentName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">رقم الهاتف:</span>
              <span className="font-mono font-bold text-navy" dir="ltr">{student.parentPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">النوع:</span>
              <span>{student.gender === "female" ? "أنثى" : "ذكر"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">تاريخ الميلاد:</span>
              <span>{student.dateOfBirth || "غير محدد"}</span>
            </div>
          </div>

          {/* Quick Communication Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <a
              href={`tel:${student.parentPhone}`}
              className="h-10 rounded-xl border bg-card hover:bg-muted text-navy flex items-center justify-center gap-2 font-bold shadow-sm"
            >
              <Phone className="h-4 w-4" /> اتصال بولي الأمر
            </a>
            <a
              href={`https://wa.me/249${student.parentPhone.replace(/^0/, "")}`}
              target="_blank"
              rel="noreferrer"
              className="h-10 rounded-xl border bg-success-soft hover:bg-success-soft/80 text-success flex items-center justify-center gap-2 font-bold shadow-sm"
            >
              <MessageCircle className="h-4 w-4" /> محادثة واتساب
            </a>
          </div>
        </div>
      )}

      {tab === "fees" && (
        <div className="space-y-4 text-xs">
          <div className="rounded-2xl border bg-card p-4 space-y-2">
            <div className="flex justify-between font-bold">
              <span>المقرر السنوي:</span>
              <span className="font-mono">{formatMoney(summ.total)}</span>
            </div>
            <div className="flex justify-between text-success font-bold">
              <span>المسدد:</span>
              <span className="font-mono">{formatMoney(summ.paid)}</span>
            </div>
            <div className="flex justify-between text-destructive font-bold">
              <span>المتبقي:</span>
              <span className="font-mono">{formatMoney(summ.remaining)}</span>
            </div>
            <ProgressBar value={summ.percent} className="mt-2" />
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-navy text-xs">أقساط الطالب:</h4>
            {installments.map(({ installment: inst, status, covered }) => (
              <div key={inst.id} className="p-3 rounded-xl border bg-card flex justify-between items-center">
                <div>
                  <div className="font-bold">{inst.title}</div>
                  <div className="text-[10px] text-muted-foreground">استحقاق: {formatDate(inst.dueDate)}</div>
                </div>
                <div className="text-end">
                  <div className="font-mono font-bold">{formatMoney(inst.amount)}</div>
                  <Badge variant={status === "paid" ? "success" : "destructive"} className="text-[9px]">
                    {status === "paid" ? "مسدد" : "متبقي"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "attendance" && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl border bg-card">
              <div className="text-lg font-bold text-success">{att.present}</div>
              <div className="text-[10px] text-muted-foreground">أيام الحضور</div>
            </div>
            <div className="p-3 rounded-xl border bg-card">
              <div className="text-lg font-bold text-destructive">{att.absent}</div>
              <div className="text-[10px] text-muted-foreground">أيام الغياب</div>
            </div>
            <div className="p-3 rounded-xl border bg-card">
              <div className="text-lg font-bold text-navy">{att.rate}٪</div>
              <div className="text-[10px] text-muted-foreground">نسبة الالتزام</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
