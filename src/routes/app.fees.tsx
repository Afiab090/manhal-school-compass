import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, FileSpreadsheet, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ImportDialog } from "@/components/school/ImportDialog";
import { PageHeader, Panel, ProgressBar } from "@/components/school/bits";
import { useMe } from "@/components/school/useMe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney, feeSummary, installmentStatuses, stageOverview } from "@/lib/school/logic";
import { importFees, recordPayment } from "@/lib/school/store";
import { downloadCsvTemplate, normalizeCell, normalizeDigits } from "@/lib/school/import";

export const Route = createFileRoute("/app/fees")({ component: FeesPage });

const FEE_COLUMNS = ["الرقم الأكاديمي", "اسم القسط", "المبلغ المقرر", "تاريخ الاستحقاق", "المبلغ المدفوع", "تاريخ الدفع", "رقم الإيصال"];
type FeeRow = { academicId: string; installmentTitle: string; amount: number; dueDate: string; paidAmount?: number | undefined; paymentDate?: string | undefined; receiptNo?: string | undefined };

function FeesPage() {
  const { s, me } = useMe();
  const [importOpen, setImportOpen] = useState(false);
  const session = s.session!;
  const stageId = session.stageId;
  const stageClasses = s.classes.filter((c) => c.stageId === stageId);
  const classIds = new Set(stageClasses.map((c) => c.id));
  const students = s.students.filter((st) => classIds.has(st.classId) && st.status === "active");
  const visibleStudents = me.role === "student" ? students.filter((st) => st.id === me.id) : students;
  const overview = stageOverview(s, stageId);
  const rows = useMemo(() => visibleStudents.map((student) => ({ student, summary: feeSummary(student, s.payments, s.installments), installments: installmentStatuses(student.id, s.payments, s.installments, new Date().toISOString().slice(0, 10)) })), [visibleStudents, s.payments, s.installments]);
  const canImport = me.role === "admin";

  if (me.role === "teacher") return <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">كشف الرسوم متاح للطالب والإدارة فقط.</div>;

  function mapFeeRow(row: Record<string, string>): FeeRow {
    const amount = Number(normalizeDigits(row["المبلغ المقرر"]).replace(/,/g, ""));
    const paidAmount = Number(normalizeDigits(row["المبلغ المدفوع"] || "0").replace(/,/g, ""));
    const academicId = normalizeCell(row["الرقم الأكاديمي"]);
    const installmentTitle = normalizeCell(row["اسم القسط"]);
    const dueDate = normalizeCell(row["تاريخ الاستحقاق"]);
    if (!academicId) throw new Error("الرقم الأكاديمي مطلوب");
    if (!installmentTitle) throw new Error("اسم القسط مطلوب");
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("المبلغ المقرر غير صالح");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw new Error("تاريخ الاستحقاق يجب أن يكون YYYY-MM-DD");
    if (!students.some((student) => student.academicId === academicId)) throw new Error("الرقم الأكاديمي غير موجود في المرحلة النشطة");
    if (paidAmount < 0 || !Number.isFinite(paidAmount)) throw new Error("المبلغ المدفوع غير صالح");
    const paymentDate = normalizeCell(row["تاريخ الدفع"]);
    if (paymentDate && !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) throw new Error("تاريخ الدفع يجب أن يكون YYYY-MM-DD");
    return { academicId, installmentTitle, amount, dueDate, paidAmount: paidAmount || undefined, paymentDate: paymentDate || undefined, receiptNo: normalizeCell(row["رقم الإيصال"]) || undefined };
  }

  return <div className="animate-rise space-y-5">
    <PageHeader title="كشف الرسوم الدراسية" subtitle={`رسوم ودفعات ${s.stages.find((stage) => stage.id === stageId)?.name ?? "المرحلة"}`} icon={Wallet} action={canImport ? <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => downloadCsvTemplate("نموذج-الرسوم.csv", FEE_COLUMNS)}><Download className="me-2 h-4 w-4" />تحميل نموذج CSV</Button><Button onClick={() => setImportOpen(true)}><FileSpreadsheet className="me-2 h-4 w-4" />استيراد من Excel أو CSV</Button></div> : undefined} />
    {me.role === "admin" && <div className="grid gap-3 sm:grid-cols-3"><Panel><p className="text-xs text-muted-foreground">إجمالي الرسوم المقررة</p><p className="mt-1 text-xl font-extrabold">{formatMoney(overview.totalFees)}</p></Panel><Panel><p className="text-xs text-muted-foreground">المبلغ المحصّل · {overview.collectionPercent}٪</p><p className="mt-1 text-xl font-extrabold text-emerald-700">{formatMoney(overview.collected)}</p><ProgressBar value={overview.collectionPercent} className="mt-3" /></Panel><Panel><p className="text-xs text-muted-foreground">المبلغ المتبقي · {overview.remainingPercent}٪</p><p className="mt-1 text-xl font-extrabold text-amber-700">{formatMoney(overview.remaining)}</p><ProgressBar value={overview.remainingPercent} className="mt-3" /></Panel></div>}
    {rows.length === 0 ? <Panel><p className="py-10 text-center text-sm text-muted-foreground">لا توجد سجلات رسوم لهذه المرحلة.</p></Panel> : rows.map(({ student, summary, installments }) => <Panel key={student.id} className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><Link to="/app/students" search={{ studentId: student.id } as never} className="font-bold text-primary hover:underline">{student.name}</Link><p className="text-xs text-muted-foreground">{student.academicId} · {s.classes.find((c) => c.id === student.classId)?.name}</p></div><Badge variant={summary.remaining === 0 ? "success" : summary.remaining > 0 && installments.some((item) => item.status === "overdue") ? "danger" : "warning"}>{summary.remaining === 0 ? "مكتمل" : installments.some((item) => item.status === "overdue") ? "متأخر" : "جزئي"}</Badge></div>
      <div className="grid grid-cols-3 gap-2 text-sm"><div><span className="block text-xs text-muted-foreground">المقرر</span><b>{formatMoney(summary.total)}</b></div><div><span className="block text-xs text-muted-foreground">المدفوع</span><b className="text-emerald-700">{formatMoney(summary.paid)}</b></div><div><span className="block text-xs text-muted-foreground">المتبقي</span><b className="text-amber-700">{formatMoney(summary.remaining)}</b></div></div>
      <ProgressBar value={summary.percent} /><div className="overflow-x-auto"><table className="w-full text-start text-xs"><thead className="text-muted-foreground"><tr><th className="py-2">القسط</th><th>الاستحقاق</th><th>المبلغ</th><th>الحالة</th></tr></thead><tbody>{installments.map((item) => <tr key={item.installment.id} className="border-t"><td className="py-2 font-semibold">{item.installment.title}</td><td>{formatDate(item.installment.dueDate)}</td><td>{formatMoney(item.installment.amount)}</td><td>{item.status === "paid" ? "مكتمل" : item.status === "partial" ? "جزئي" : item.status === "overdue" ? "متأخر" : "مستحق"}</td></tr>)}</tbody></table></div>
      <div className="border-t pt-3"><h3 className="mb-2 text-xs font-bold">سجل المدفوعات</h3>{s.payments.filter((payment) => payment.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).length ? <div className="space-y-1.5">{s.payments.filter((payment) => payment.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((payment) => <div key={payment.id} className="flex flex-wrap justify-between gap-2 text-xs"><span>{formatDate(payment.date)} · {payment.method} · {payment.receiptNo}</span><b>{formatMoney(payment.amount)}</b></div>)}</div> : <p className="text-xs text-muted-foreground">لا توجد دفعات مسجلة.</p>}</div>
      {me.role === "admin" && <PaymentForm studentId={student.id} />}
    </Panel>)}
    {canImport && <ImportDialog<FeeRow> open={importOpen} onOpenChange={setImportOpen} title="استيراد كشف الرسوم" requiredColumns={FEE_COLUMNS} templateFilename="نموذج-الرسوم.csv" sampleRows={[["MNH-2026-9001", "القسط الأول", "360000", "2026-09-01", "360000", "2026-09-01", "IMP-EX-001"], ["MNH-2026-9002", "القسط الأول", "380000", "2026-09-01", "150000", "2026-09-12", "IMP-EX-002"]]} mapRow={mapFeeRow} onConfirm={(validRows) => importFees(validRows)} />}
  </div>;
}

function PaymentForm({ studentId }: { studentId: string }) {
  const [amount, setAmount] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  return <form className="flex flex-wrap items-end gap-2 border-t pt-3" onSubmit={(event) => { event.preventDefault(); try { const value = Number(amount); if (!Number.isFinite(value) || value <= 0) throw new Error("أدخل مبلغاً صحيحاً"); recordPayment(studentId, value, "نقداً", undefined, receiptNo || undefined); toast.success("تم تسجيل الدفعة"); setAmount(""); setReceiptNo(""); } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر تسجيل الدفعة"); } }}><label className="min-w-28 flex-1 text-xs">مبلغ الدفعة<input required type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 h-9 w-full rounded-lg border bg-background px-3" /></label><label className="min-w-28 flex-1 text-xs">رقم الإيصال<input value={receiptNo} onChange={(event) => setReceiptNo(event.target.value)} className="mt-1 h-9 w-full rounded-lg border bg-background px-3" /></label><Button size="sm" type="submit">تسجيل دفعة</Button></form>;
}
