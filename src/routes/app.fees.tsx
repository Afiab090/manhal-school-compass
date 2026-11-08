import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  FileCheck2,
  Plus,
  Receipt as ReceiptIcon,
  Search,
  Upload,
  UserCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, Panel, ProgressBar, StatCard } from "@/components/school/bits";
import { compressImage } from "@/components/school/shared";
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
  collectionRate,
  feeSummary,
  formatDate,
  formatMoney,
  installmentStatuses,
} from "@/lib/school/logic";
import {
  recordPayment,
  reviewReceipt,
  submitReceipt,
} from "@/lib/school/store";
import type { Student } from "@/lib/school/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/fees")({
  component: FeesPage,
});

function FeesPage() {
  const { me } = useMe();
  if (me.role === "admin") return <AdminFeesView />;
  return <StudentFeesView />;
}

function StudentFeesView() {
  const { s, me } = useMe();
  const fallbackStudent: Student = {
    id: "s1",
    name: "أحمد محمد عبدالله",
    academicId: "MNH-2026-0314",
    classId: "c3a",
    parentName: "محمد عبدالله أحمد",
    parentPhone: "0912 777 314",
    totalFees: 900000,
  };
  const st: Student = me.role === "student" ? me.student : (s.students[0] ?? fallbackStudent);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summary = useMemo(() => {
    return feeSummary(st, s.payments, s.installments);
  }, [st, s.payments, s.installments]);

  const installments = useMemo(() => {
    return installmentStatuses(st.id, s.payments, s.installments, new Date().toISOString().slice(0, 10));
  }, [st.id, s.payments, s.installments]);

  const studentPayments = useMemo(() => {
    return s.payments
      .filter((p) => p.studentId === st.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [s.payments, st.id]);

  const studentReceipts = useMemo(() => {
    return s.receipts
      .filter((r) => r.studentId === st.id)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [s.receipts, st.id]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setImage(compressed);
        toast.success("تم تجهيز صورة الإشعار");
      } catch (err) {
        toast.error("تعذر قراءة الصورة، يرجى اختيار ملف صالح");
      }
    }
  };

  const handleSubmitReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }
    if (!reference.trim()) {
      toast.error("يرجى كتابة رقم المرجع أو المعاملة البنكية");
      return;
    }

    setIsSubmitting(true);
    try {
      const receiptPayload: {
        studentId: string;
        reference: string;
        amount: number;
        image?: string;
        note?: string;
      } = {
        studentId: st.id,
        amount: parsedAmount,
        reference: reference.trim(),
      };
      if (note.trim()) receiptPayload.note = note.trim();
      if (image) receiptPayload.image = image;

      submitReceipt(receiptPayload);
      toast.success("تم إرسال إشعار الدفع بنجاح وهو قيد المراجعة والاعتماد");
      setUploadDialogOpen(false);
      setAmount("");
      setReference("");
      setNote("");
      setImage(undefined);
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ أثناء إرسال الإشعار");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="الرسوم الدراسية والمدفوعات"
        subtitle={`متابعة الأقساط المدرسية وسجل السداد وإرفاق إشعارات التحويل — ${st.name}`}
        icon={Wallet}
        action={
          <Button
            onClick={() => setUploadDialogOpen(true)}
            className="gap-2 bg-primary hover:bg-navy font-bold"
          >
            <Upload className="h-4 w-4" />
            إرفاق إشعار تحويل بنكي
          </Button>
        }
      />

      {/* Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-hero p-5 text-hero-foreground shadow-elevated">
        <div className="pattern-geo absolute inset-0 opacity-40" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs text-hero-foreground/75">إجمالي الرسوم السنوية المقررة</span>
              <div className="font-display text-2xl sm:text-3xl font-extrabold mt-1">
                {formatMoney(summary.total)}
              </div>
            </div>
            <Badge className="bg-gold text-navy font-bold text-sm px-3 py-1">
              مسدد {summary.percent.toLocaleString("ar-EG")}٪
            </Badge>
          </div>

          <ProgressBar value={summary.percent} className="my-4 h-2.5 bg-hero-foreground/20" />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-hero-foreground/10 p-3">
              <span className="text-xs text-hero-foreground/70">المبلغ المسدد</span>
              <div className="font-bold text-lg mt-0.5 text-emerald-300">
                {formatMoney(summary.paid)}
              </div>
            </div>
            <div className="rounded-2xl bg-hero-foreground/10 p-3">
              <span className="text-xs text-hero-foreground/70">المبلغ المتبقي</span>
              <div className="font-bold text-lg mt-0.5 text-amber-300">
                {formatMoney(summary.remaining)}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-2xl bg-hero-foreground/10 p-3">
              <span className="text-xs text-hero-foreground/70">القسط المستحق القادم</span>
              <div className="font-bold text-sm mt-0.5">
                {summary.nextDue ? (
                  <span>{summary.nextDue.title} ({formatMoney(summary.nextDue.amount)})</span>
                ) : (
                  <span className="text-emerald-300">تم سداد كامل الأقساط ✓</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Installments Breakdown */}
      <Panel className="space-y-4">
        <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
          <ReceiptIcon className="h-5 w-5 text-gold" />
          جدول الأقساط الدراسية
        </h2>

        <div className="space-y-3">
          {installments.map(({ installment, status, covered }) => {
            const isPaid = status === "paid";
            const isOverdue = status === "overdue";
            const isPartial = status === "partial";

            return (
              <div
                key={installment.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 transition-all",
                  isPaid && "bg-muted/30 border-muted",
                  isOverdue && "border-destructive/40 bg-danger-soft/20",
                  isPartial && "border-amber-400/40 bg-warning-soft/20",
                  status === "due" && "border-border bg-card",
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{installment.title}</span>
                    {isPaid && <Badge variant="success">مسدد بالكامل</Badge>}
                    {isOverdue && <Badge variant="danger">متأخر عن السداد</Badge>}
                    {isPartial && <Badge variant="warning">مدفوع جزئياً</Badge>}
                    {status === "due" && <Badge variant="outline">مستحق</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <span>تاريخ الاستحقاق: {formatDate(installment.dueDate)}</span>
                    {covered > 0 && covered < installment.amount && (
                      <span>· تم دفع: {formatMoney(covered)}</span>
                    )}
                  </div>
                </div>

                <div className="text-end">
                  <div className="font-extrabold text-foreground text-lg">
                    {formatMoney(installment.amount)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Submitted Receipts (Pending review) */}
      {studentReceipts.length > 0 && (
        <Panel className="space-y-3">
          <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
            <Clock className="h-5 w-5 text-gold" />
            إشعارات التحويل المرفقة
          </h2>
          <div className="space-y-2">
            {studentReceipts.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{formatMoney(r.amount)}</span>
                    {r.status === "pending" && (
                      <Badge variant="warning" className="gap-1">
                        <Clock className="h-3 w-3" /> قيد المراجعة
                      </Badge>
                    )}
                    {r.status === "approved" && (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> تم الاعتماد
                      </Badge>
                    )}
                    {r.status === "rejected" && (
                      <Badge variant="danger" className="gap-1">
                        <XCircle className="h-3 w-3" /> مرفوض
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    مرجع التحويل: <span dir="ltr" className="font-mono font-bold">{r.reference}</span> · بتاريخ {formatDate(r.submittedAt)}
                  </div>
                  {r.note && <div className="text-xs text-foreground/80 mt-1">{r.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Official Receipts & Payment History */}
      <Panel className="space-y-4">
        <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
          <FileCheck2 className="h-5 w-5 text-gold" />
          سجل المدفوعات والإيصالات الرسمية
        </h2>

        {studentPayments.length === 0 ? (
          <EmptyState icon={ReceiptIcon} title="لا توجد مدفوعات مسجلة حتى الآن" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
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

      {/* Upload Receipt Modal */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إرفاق إشعار تحويل بنكي</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitReceipt} className="space-y-4">
            <div className="space-y-1.5">
              <Label>المبلغ المحوّل (ج.س)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="مثال: 250000"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>رقم الإشعار / المرجع البنكي (بنكك / فوري)</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="مثال: BOK-89234120"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>ملاحظات إضافية</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="مثال: سداد القسط الثاني عن طريق بنكك"
              />
            </div>

            <div className="space-y-1.5">
              <Label>صورة الإشعار (اختياري)</Label>
              <Input type="file" accept="image/*" onChange={handleImageChange} />
              {image && (
                <div className="mt-2 text-xs text-success flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> تم تجهيز الصورة بنجاح
                </div>
              )}
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جاري الإرسال..." : "إرسال الإشعار للمراجعة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminFeesView() {
  const { s } = useMe();
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);

  // Direct payment recording form state
  const [payStudentId, setPayStudentId] = useState<string>(s.students[0]?.id || "");
  const [payAmount, setPayAmount] = useState<string>("");
  const [payMethod, setPayMethod] = useState<string>("نقداً - خزينة المدرسة");

  const pendingReceipts = useMemo(() => {
    return s.receipts.filter((r) => r.status === "pending");
  }, [s.receipts]);

  const rate = useMemo(() => collectionRate(s.students, s.payments), [s.students, s.payments]);

  const totalExpected = useMemo(() => {
    return s.students.reduce((sum, st) => sum + st.totalFees, 0);
  }, [s.students]);

  const totalCollected = useMemo(() => {
    const studentIds = new Set(s.students.map((st) => st.id));
    return s.payments.filter((p) => studentIds.has(p.studentId)).reduce((sum, p) => sum + p.amount, 0);
  }, [s.students, s.payments]);

  const filteredStudents = useMemo(() => {
    return s.students.filter((st) => {
      const matchClass = selectedClassFilter === "all" || st.classId === selectedClassFilter;
      const matchQuery =
        !searchQuery.trim() ||
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.academicId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchQuery;
    });
  }, [s.students, selectedClassFilter, searchQuery]);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(payAmount);
    if (!parsed || parsed <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }
    recordPayment(payStudentId, parsed, payMethod);
    toast.success("تم تسجيل سند القبض وإصدار الإيصال المالي بنجاح");
    setRecordDialogOpen(false);
    setPayAmount("");
  };

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="إدارة الرسوم والتحصيل المالي"
        subtitle="حصر الرسوم الدراسية، مراجعة إشعارات البنوك، وتسجيل سندات القبض لجميع الفصول"
        icon={Wallet}
        action={
          <Button
            onClick={() => setRecordDialogOpen(true)}
            className="gap-2 bg-primary hover:bg-navy font-bold"
          >
            <Plus className="h-4 w-4" />
            تسجيل سند قبض مالي
          </Button>
        }
      />

      {/* Financial Overview Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="نسبة التحصيل العامة"
          value={`${rate.toLocaleString("ar-EG")}٪`}
          icon={Wallet}
          tone="gold"
          hint={`إجمالي الطلاب ${s.students.length}`}
        />
        <StatCard
          label="إجمالي المحصل"
          value={formatMoney(totalCollected)}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="المتبقي للتحصيل"
          value={formatMoney(Math.max(0, totalExpected - totalCollected))}
          icon={AlertCircle}
          tone="warning"
        />
        <StatCard
          label="إشعارات معلقة"
          value={pendingReceipts.length.toLocaleString("ar-EG")}
          icon={Clock}
          tone={pendingReceipts.length > 0 ? "danger" : "navy"}
          hint="بحاجة لاعتماد الإدارة"
        />
      </div>

      {/* Pending Receipts Section */}
      <Panel className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
            <Clock className="h-5 w-5 text-gold" />
            إشعارات الدفع بانتظار المراجعة والاعتماد ({pendingReceipts.length})
          </h2>
        </div>

        {pendingReceipts.length === 0 ? (
          <EmptyState
            icon={FileCheck2}
            title="لا توجد إشعارات دفع معلقة"
            text="تمت مراجعة واعتماد جميع إشعارات التحويل الواردة"
          />
        ) : (
          <div className="space-y-3">
            {pendingReceipts.map((r) => {
              const st = s.students.find((x) => x.id === r.studentId);
              const cls = s.classes.find((c) => c.id === st?.classId);

              return (
                <div
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-foreground">{st?.name}</span>
                      <Badge variant="outline">{cls?.name}</Badge>
                      <Badge variant="gold" className="font-mono text-xs">
                        {formatMoney(r.amount)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-3">
                      <span>المرجع: <span dir="ltr" className="font-mono font-bold text-foreground">{r.reference}</span></span>
                      <span>·</span>
                      <span>بتاريخ: {formatDate(r.submittedAt)}</span>
                      {r.note && <span>· ملاحظة: {r.note}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => {
                        reviewReceipt(r.id, "approved");
                        toast.success(`تم اعتماد إشعار الطالب ${st?.name}`);
                      }}
                      className="gap-1 text-xs font-bold"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      اعتماد
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        reviewReceipt(r.id, "rejected");
                        toast.error(`تم رفض إشعار الطالب ${st?.name}`);
                      }}
                      className="gap-1 text-xs text-destructive hover:bg-danger-soft"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      رفض
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Students Tuition Status Roster */}
      <Panel className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">حالة سداد رسوم الطلاب</h2>
            <p className="text-xs text-muted-foreground">
              متابعة موقف الرسوم لكل طالب في كافة الفصول الدراسية
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-bold text-foreground focus:outline-none"
            >
              <option value="all">جميع الفصول الدراسية</option>
              {s.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="absolute end-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="بحث بالاسم أو الرقم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-44 pe-8 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="py-2.5 px-3 text-start">الطالب</th>
                <th className="py-2.5 px-3 text-start">الفصل</th>
                <th className="py-2.5 px-3 text-start">إجمالي الرسوم</th>
                <th className="py-2.5 px-3 text-start">المسدد</th>
                <th className="py-2.5 px-3 text-start">المتبقي</th>
                <th className="py-2.5 px-3 text-start">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStudents.map((st) => {
                const sum = feeSummary(st, s.payments, s.installments);
                const cls = s.classes.find((c) => c.id === st.classId);
                const isFull = sum.remaining === 0;
                const isOverdue = sum.nextDue && sum.nextDue.dueDate < new Date().toISOString().slice(0, 10);

                return (
                  <tr key={st.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-foreground">{st.name}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">
                        {st.academicId}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground">{cls?.name}</td>
                    <td className="py-3 px-3 font-semibold text-foreground">{formatMoney(sum.total)}</td>
                    <td className="py-3 px-3 font-bold text-emerald-600">{formatMoney(sum.paid)}</td>
                    <td className="py-3 px-3 font-bold text-amber-600">{formatMoney(sum.remaining)}</td>
                    <td className="py-3 px-3">
                      {isFull && <Badge variant="success">مكتمل</Badge>}
                      {!isFull && isOverdue && <Badge variant="danger">متأخر</Badge>}
                      {!isFull && !isOverdue && <Badge variant="warning">قسط متبقي</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Record Direct Payment Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل سند قبض مالي جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="space-y-1.5">
              <Label>اختر الطالب</Label>
              <select
                value={payStudentId}
                onChange={(e) => setPayStudentId(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
              >
                {s.students.map((st) => {
                  const cls = s.classes.find((c) => c.id === st.classId);
                  return (
                    <option key={st.id} value={st.id}>
                      {st.name} — ({cls?.name})
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
                placeholder="مثال: 300000"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>طريقة القبض</Label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
              >
                <option value="نقداً - خزينة المدرسة">نقداً - خزينة المدرسة</option>
                <option value="تحويل بنكي - تطبيق بنكك">تحويل بنكي - تطبيق بنكك</option>
                <option value="تحويل بنكي - تطبيق فوري">تحويل بنكي - تطبيق فوري</option>
                <option value="شيك مصرفي">شيك مصرفي</option>
              </select>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setRecordDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">إصدار السند وتحديث الرسوم</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
