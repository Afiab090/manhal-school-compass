import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FileSpreadsheet,
  Plus,
  Receipt as ReceiptIcon,
  Search,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, Panel, ProgressBar, StatCard } from "@/components/school/bits";
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
  feeSummary,
  formatDate,
  formatMoney,
  installmentStatuses,
  stageFinancialSummary,
} from "@/lib/school/logic";
import { importFees, recordPayment } from "@/lib/school/store";
import type { StageId, Student } from "@/lib/school/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/fees")({
  component: FeesPage,
});

function FeesPage() {
  const { me } = useMe();
  if (me.role === "admin") return <AdminFeesView />;
  return <StudentFeesView />;
}

/* =========================================================================
   1. STUDENT FEES VIEW
   ========================================================================= */

function StudentFeesView() {
  const { s, me } = useMe();

  const st: Student | null = me.role === "student" ? me.student : s.students[0] ?? null;

  const summary = useMemo(() => {
    if (!st) return null;
    return feeSummary(st, s.payments, s.installments);
  }, [st, s.payments, s.installments]);

  const installments = useMemo(() => {
    if (!st) return [];
    return installmentStatuses(st.id, s.payments, s.installments, new Date().toISOString().slice(0, 10));
  }, [st, s.payments, s.installments]);

  const studentPayments = useMemo(() => {
    if (!st) return [];
    return s.payments
      .filter((p) => p.studentId === st.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [st, s.payments]);

  if (!st || !summary) {
    return <EmptyState icon={Wallet} title="لا توجد بيانات رسوم دراسية" />;
  }

  const cls = s.classes.find((c) => c.id === st.classId);

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="الرسوم الدراسية وسندات السداد"
        subtitle={`متابعة الأقساط المقررة والمدفوعات والإيصالات الرسمية — ${st.name} (${cls?.name ?? ""})`}
        icon={Wallet}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="إجمالي الرسوم المقررة"
          value={formatMoney(summary.total)}
          icon={Wallet}
          hint="العام الدراسي الحالي"
        />
        <StatCard
          label="المبلغ المسدد"
          value={formatMoney(summary.paid)}
          icon={CheckCircle2}
          tone="success"
          hint={`نسبة السداد: ${summary.percent}٪`}
        />
        <StatCard
          label="المتبقي للتحصيل"
          value={formatMoney(summary.remaining)}
          icon={AlertCircle}
          tone={summary.remaining === 0 ? "success" : "warning"}
          hint={summary.remaining === 0 ? "تم السداد بالكامل" : "أقساط مستحقة"}
        />
        <StatCard
          label="القسط القادم"
          value={summary.nextDue ? formatMoney(summary.nextDue.amount) : "لا يوجد"}
          icon={Clock}
          tone="gold"
          hint={summary.nextDue ? `استحقاق ${formatDate(summary.nextDue.dueDate)}` : "لا توجد متأخرات"}
        />
      </div>

      {/* Progress Bar */}
      <Panel className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-navy">نسبة إنجاز سداد الرسوم السنوية</span>
          <span className="font-mono font-bold text-foreground">{summary.percent}٪</span>
        </div>
        <ProgressBar value={summary.percent} />
      </Panel>

      {/* Installments Breakdown */}
      <Panel className="space-y-4">
        <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
          <Building2 className="h-5 w-5 text-gold" />
          جدول الأقساط الدراسية المستحقة
        </h2>

        <div className="grid gap-3 sm:grid-cols-3">
          {installments.map(({ installment: inst, status, covered }) => {
            const isPaid = status === "paid";
            const isOverdue = status === "overdue";
            const isPartial = status === "partial";

            return (
              <div
                key={inst.id}
                className={cn(
                  "flex flex-col justify-between rounded-2xl border bg-card p-4 shadow-card transition-all",
                  isPaid && "border-success/40 bg-success-soft/10",
                  isOverdue && "border-destructive/40 bg-danger-soft/20",
                  isPartial && "border-gold/40 bg-gold-soft/15",
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-sm text-foreground">{inst.title}</span>
                    <Badge
                      variant={isPaid ? "success" : isOverdue ? "destructive" : "gold"}
                      className="text-[11px] font-bold"
                    >
                      {isPaid ? "مسدد بالكامل" : isOverdue ? "متأخر" : isPartial ? "مسدد جزئياً" : "مستحق"}
                    </Badge>
                  </div>

                  <div className="text-xl font-extrabold text-navy font-mono">
                    {formatMoney(inst.amount)}
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-gold" />
                    <span>تاريخ الاستحقاق: {formatDate(inst.dueDate)}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t text-xs flex justify-between items-center text-muted-foreground">
                  <span>المغطى من القسط:</span>
                  <span className="font-mono font-bold text-foreground">{formatMoney(covered)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Official Receipts & Payment History */}
      <Panel className="space-y-4">
        <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
          <FileCheck2 className="h-5 w-5 text-gold" />
          سجل المدفوعات والإيصالات الرسمية
        </h2>

        {studentPayments.length === 0 ? (
          <EmptyState icon={ReceiptIcon} title="لا توجد مدفوعات مسجلة حتى الآن" />
        ) : (
          <div className="w-full overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[500px] text-start text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2.5 px-3 text-start">رقم الإيصال</th>
                  <th className="py-2.5 px-3 text-start">التاريخ</th>
                  <th className="py-2.5 px-3 text-start">المبلغ</th>
                  <th className="py-2.5 px-3 text-start">طريقة الدفع</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {studentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-navy">{p.receiptNo}</td>
                    <td className="py-3 px-3 text-muted-foreground">{formatDate(p.date)}</td>
                    <td className="py-3 px-3 font-extrabold text-foreground">{formatMoney(p.amount)}</td>
                    <td className="py-3 px-3">
                      <Badge variant="outline" className="text-xs">
                        {p.method}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

/* =========================================================================
   2. ADMIN FEES VIEW
   ========================================================================= */

const FEES_REQUIRED_COLUMNS = [
  "الرقم الأكاديمي",
  "اسم القسط",
  "المبلغ المقرر",
  "تاريخ الاستحقاق",
  "المبلغ المدفوع",
  "تاريخ الدفع",
  "رقم الإيصال",
];

const FEES_TEMPLATE_HEADERS = [
  "الرقم الأكاديمي",
  "اسم القسط",
  "المبلغ المقرر",
  "تاريخ الاستحقاق",
  "المبلغ المدفوع",
  "تاريخ الدفع",
  "رقم الإيصال",
];

const FEES_SAMPLE_ROWS = [
  ["STD-SEC-1001", "القسط الأول (التسجيل)", "300000", "2025-09-15", "300000", "2025-09-10", "RC-2025-101"],
  ["STD-SEC-1002", "القسط الثاني (منتصف العام)", "250000", "2025-11-20", "150000", "2025-11-18", "RC-2025-102"],
];

function AdminFeesView() {
  const { s, me } = useMe();
  const currentStage: StageId = me.stageId || "المرحلة الثانوية";

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Filter students for current stage
  const stageClasses = useMemo(() => s.classes.filter((c) => c.stageId === currentStage), [s.classes, currentStage]);
  const stageClassIds = useMemo(() => new Set(stageClasses.map((c) => c.id)), [stageClasses]);

  const stageStudents = useMemo(() => {
    return s.students.filter((st) => stageClassIds.has(st.classId));
  }, [s.students, stageClassIds]);

  // Stage-scoped financial summary
  const stats = useMemo(() => {
    return stageFinancialSummary(stageStudents, s.payments);
  }, [stageStudents, s.payments]);

  // Direct payment recording form state
  const [payStudentId, setPayStudentId] = useState<string>(stageStudents[0]?.id || "");
  const [payAmount, setPayAmount] = useState<string>("");
  const [payMethod, setPayMethod] = useState<string>("نقداً - خزينة المدرسة");
  const [payReceiptNo, setPayReceiptNo] = useState<string>("");

  const filteredStudents = useMemo(() => {
    return stageStudents.filter((st) => {
      const matchClass = selectedClassFilter === "all" || st.classId === selectedClassFilter;
      const matchQuery =
        !searchQuery.trim() ||
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.academicId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchQuery;
    });
  }, [stageStudents, selectedClassFilter, searchQuery]);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(payAmount);
    if (!parsed || parsed <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }
    recordPayment(payStudentId, parsed, payMethod, payReceiptNo.trim() || undefined);
    toast.success("تم تسجيل سند القبض وإصدار الإيصال المالي بنجاح");
    setRecordDialogOpen(false);
    setPayAmount("");
    setPayReceiptNo("");
  };

  const handleConfirmImport = async (validRows: Record<string, string>[]) => {
    const payload = validRows.map((row) => ({
      academicId: row["الرقم الأكاديمي"] || "",
      installmentTitle: row["اسم القسط"] || "قسط دراسي",
      installmentAmount: Number(row["المبلغ المقرر"]) || 0,
      dueDate: row["تاريخ الاستحقاق"] || "2025-10-01",
      paidAmount: row["المبلغ المدفوع"] ? Number(row["المبلغ المدفوع"]) : undefined,
      paymentDate: row["تاريخ الدفع"] || undefined,
      receiptNo: row["رقم الإيصال"] || undefined,
    }));

    const result = importFees(payload);
    if (result.errors.length > 0) {
      toast.warning(`تم الاستيراد مع وجود ${result.errors.length} تنبيهاً`);
    }
    return {
      added: result.addedInstallments + result.addedPayments,
      updated: 0,
      ignored: result.errors.length,
    };
  };

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="إدارة الرسوم والتحصيل المالي"
        subtitle={`حصر الرسوم الدراسية ومتابعة التحصيل وإصدار سندات القبض — ${currentStage}`}
        icon={Wallet}
        action={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => downloadCsvTemplate("نموذج_استيراد_الرسوم.csv", FEES_TEMPLATE_HEADERS, FEES_SAMPLE_ROWS)}
              className="gap-2 font-bold text-xs flex-1 sm:flex-initial"
            >
              <Download className="h-4 w-4" />
              تحميل نموذج CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              className="gap-2 font-bold text-xs border-gold text-navy hover:bg-gold-soft flex-1 sm:flex-initial"
            >
              <FileSpreadsheet className="h-4 w-4 text-gold" />
              استيراد من Excel أو CSV
            </Button>
            <Button
              onClick={() => setRecordDialogOpen(true)}
              className="gap-2 bg-primary hover:bg-navy font-bold text-xs w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              تسجيل سند قبض
            </Button>
          </div>
        }
      />

      {/* Financial Overview Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="نسبة التحصيل بالمرحلة"
          value={`${stats.collectionRate}٪`}
          icon={Wallet}
          tone="gold"
          hint={`إجمالي طلاب المرحلة: ${stageStudents.length}`}
        />
        <StatCard
          label="إجمالي المحصل"
          value={formatMoney(stats.totalCollected)}
          icon={CheckCircle2}
          tone="success"
          hint={`المقرر: ${formatMoney(stats.totalRequired)}`}
        />
        <StatCard
          label="المتبقي للتحصيل"
          value={formatMoney(stats.totalRemaining)}
          icon={AlertCircle}
          tone={stats.totalRemaining === 0 ? "success" : "warning"}
          hint={`نسبة المتبقي: ${stats.remainingRate}٪`}
        />
        <StatCard
          label="متوسط الرسوم للطالب"
          value={formatMoney(stageStudents.length > 0 ? Math.round(stats.totalRequired / stageStudents.length) : 0)}
          icon={Building2}
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">تصفية الفصل:</span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-bold text-foreground focus:outline-none"
          >
            <option value="all">كافة فصول {currentStage}</option>
            {stageClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute end-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="بحث باسم الطالب أو رقمه الأكاديمي..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pe-8 text-xs"
          />
        </div>
      </div>

      {/* Students Fee Ledger Table */}
      <Panel className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gold" />
            كشف سداد الطلاب ({filteredStudents.length} طالباً)
          </h2>
        </div>

        {filteredStudents.length === 0 ? (
          <EmptyState icon={Search} title="لا توجد نتائج مطابقة" />
        ) : (
          <div className="w-full overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[680px] text-start text-xs">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground font-bold">
                  <th className="py-3 px-3 text-start">الرقم الأكاديمي</th>
                  <th className="py-3 px-3 text-start">اسم الطالب</th>
                  <th className="py-3 px-3 text-start">الفصل</th>
                  <th className="py-3 px-3 text-start">المقرر السنوي</th>
                  <th className="py-3 px-3 text-start">المسدد</th>
                  <th className="py-3 px-3 text-start">المتبقي</th>
                  <th className="py-3 px-3 text-center">نسبة السداد</th>
                  <th className="py-3 px-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((st) => {
                  const summ = feeSummary(st, s.payments, s.installments);
                  const cls = s.classes.find((c) => c.id === st.classId);

                  return (
                    <tr key={st.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-navy">{st.academicId}</td>
                      <td className="py-3 px-3 font-bold text-foreground">{st.name}</td>
                      <td className="py-3 px-3 text-muted-foreground font-semibold">{cls?.name}</td>
                      <td className="py-3 px-3 font-mono font-semibold">{formatMoney(summ.total)}</td>
                      <td className="py-3 px-3 font-mono font-bold text-success">{formatMoney(summ.paid)}</td>
                      <td
                        className={cn(
                          "py-3 px-3 font-mono font-bold",
                          summ.remaining > 0 ? "text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {formatMoney(summ.remaining)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={summ.percent >= 100 ? "success" : summ.percent > 0 ? "gold" : "destructive"}
                          className="font-mono text-[11px]"
                        >
                          {summ.percent}٪
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPayStudentId(st.id);
                            setPayAmount(String(summ.remaining > 0 ? summ.remaining : 100000));
                            setRecordDialogOpen(true);
                          }}
                          className="h-7 text-xs font-bold gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          قبض
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Record Payment Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل سند قبض مالي جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="space-y-1.5">
              <Label>الطالب</Label>
              <select
                value={payStudentId}
                onChange={(e) => setPayStudentId(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
                required
              >
                {stageStudents.map((st) => {
                  const c = s.classes.find((x) => x.id === st.classId);
                  return (
                    <option key={st.id} value={st.id}>
                      {st.name} — ({c?.name ?? ""})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>المبلغ المقبوض (ج.س)</Label>
              <Input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="مثال: 150000"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>طريقة الدفع</Label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
              >
                <option value="نقداً - خزينة المدرسة">نقداً - خزينة المدرسة</option>
                <option value="تحويل بنكي (بنكك)">تحويل بنكي (بنكك)</option>
                <option value="تحويل بنكي (فوري - بنك فيصل)">تحويل بنكي (فوري - بنك فيصل)</option>
                <option value="شيك مصرفي">شيك مصرفي</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>رقم الإيصال اليدوي (اختياري)</Label>
              <Input
                value={payReceiptNo}
                onChange={(e) => setPayReceiptNo(e.target.value)}
                placeholder="اتركه فارغاً للتوليد التلقائي"
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setRecordDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" className="bg-primary hover:bg-navy font-bold">
                حفظ وإصدار السند
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Fees Modal */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="استيراد كشف الرسوم والأقساط"
        description="استيراد الأقساط والمدفوعات من ملف Excel أو CSV مع مطابقة الطلاب تلقائياً بالرقم الأكاديمي"
        requiredColumns={FEES_REQUIRED_COLUMNS}
        templateFilename="نموذج_استيراد_الرسوم.csv"
        templateHeaders={FEES_TEMPLATE_HEADERS}
        templateSampleRows={FEES_SAMPLE_ROWS}
        rowValidator={(row, idx) => {
          const errors: string[] = [];
          if (!row["الرقم الأكاديمي"]?.trim()) errors.push("الرقم الأكاديمي مفقود");
          if (!row["المبلغ المقرر"] || Number(row["المبلغ المقرر"]) <= 0) errors.push("المبلغ المقرر غير صحيح");
          return { isValid: errors.length === 0, errors };
        }}
        onConfirmImport={handleConfirmImport}
      />
    </div>
  );
}
