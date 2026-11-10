import { useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { assertRequiredColumns, downloadCsvTemplate, parseImportFile, type ParsedImportFile } from "@/lib/school/import";

type ImportStep = 1 | 2 | 3 | 4;
export interface ImportSummary { added: number; updated: number; ignored: number; }
interface PreviewRow<T> { source: Record<string, string>; data?: T; error?: string; warning?: string | undefined; }
interface ImportDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  requiredColumns: string[];
  templateFilename: string;
  sampleRows?: string[][];
  mapRow: (row: Record<string, string>, index: number, allRows: Record<string, string>[]) => T;
  rowWarning?: (data: T, index: number) => string | undefined;
  onConfirm: (rows: T[]) => ImportSummary | Promise<ImportSummary>;
}

export function ImportDialog<T>({ open, onOpenChange, title, requiredColumns, templateFilename, sampleRows, mapRow, rowWarning, onConfirm }: ImportDialogProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep>(1);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedImportFile | null>(null);
  const [preview, setPreview] = useState<PreviewRow<T>[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const validRows = useMemo(() => preview.flatMap((row) => row.data === undefined ? [] : [row.data]), [preview]);
  const invalidCount = preview.length - validRows.length;

  function reset() {
    setStep(1); setFileName(""); setParsed(null); setPreview([]); setSummary(null); setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }
  function close(next: boolean) { if (!next) reset(); onOpenChange(next); }
  async function readFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const content = await parseImportFile(file);
      assertRequiredColumns(content.headers, requiredColumns);
      const results: PreviewRow<T>[] = content.rows.map((row, index) => {
        try {
          const data = mapRow(row, index, content.rows);
          const warning = rowWarning?.(data, index);
          return { source: row, data, warning };
        } catch (error) { return { source: row, error: error instanceof Error ? error.message : "بيانات الصف غير صحيحة" }; }
      });
      setParsed(content); setPreview(results); setFileName(file.name); setStep(2);
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر قراءة الملف"); }
    finally { setBusy(false); }
  }
  async function confirmImport() {
    setBusy(true);
    try {
      const result = await onConfirm(validRows);
      setSummary({ ...result, ignored: result.ignored + invalidCount });
      setStep(4);
      toast.success("اكتمل الاستيراد");
    } catch (error) { toast.error(error instanceof Error ? error.message : "فشل حفظ بيانات الاستيراد"); }
    finally { setBusy(false); }
  }

  return <Dialog open={open} onOpenChange={close}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
    <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
    <div className="mb-4 grid grid-cols-4 gap-1 text-center text-[11px] font-semibold">{["رفع الملف", "المعاينة", "التأكيد", "النتيجة"].map((label, index) => <div key={label} className={`rounded-lg px-1 py-2 ${step >= index + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{index + 1}. {label}</div>)}</div>
    {step === 1 && <div className="space-y-4 rounded-2xl border border-dashed p-6 text-center"><FileSpreadsheet className="mx-auto h-10 w-10 text-primary" /><h3 className="font-bold">اختر ملف CSV أو Excel</h3><p className="text-xs text-muted-foreground">الحد الأقصى 2 ميجابايت و2000 صف. تأكد من مطابقة عناوين الأعمدة للنموذج.</p><input ref={inputRef} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => void readFile(event.target.files?.[0])} className="mx-auto block max-w-full text-sm" /><div className="flex flex-wrap justify-center gap-2"><Button variant="outline" onClick={() => downloadCsvTemplate(templateFilename, requiredColumns, sampleRows)}><Download className="me-2 h-4 w-4" />تحميل نموذج CSV</Button><Button onClick={() => inputRef.current?.click()} disabled={busy}><Upload className="me-2 h-4 w-4" />{busy ? "جارٍ قراءة الملف..." : "اختيار ملف"}</Button></div></div>}
    {step === 2 && parsed && <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-bold">{fileName}</span><span className="text-muted-foreground">{preview.length} صف · {validRows.length} صالح · {invalidCount} غير صالح</span></div><div className="max-h-[48vh] overflow-auto rounded-xl border"><table className="w-full min-w-[620px] text-start text-xs"><thead className="sticky top-0 bg-muted"><tr><th className="p-2">#</th>{requiredColumns.map((column) => <th key={column} className="p-2">{column}</th>)}<th className="p-2">التحقق</th></tr></thead><tbody>{preview.map((row, index) => <tr key={index} className={row.error ? "bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-200" : row.warning ? "bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100" : "border-t"}><td className="p-2">{index + 1}</td>{requiredColumns.map((column) => <td key={column} className="max-w-40 truncate p-2">{row.source[column] ?? "—"}</td>)}<td className="p-2">{row.error ? <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />{row.error}</span> : row.warning ? <span className="flex items-center gap-1 text-amber-700"><CheckCircle2 className="h-3.5 w-3.5" />{row.warning}</span> : <span className="flex items-center gap-1 text-green-700"><CheckCircle2 className="h-3.5 w-3.5" />سليم</span>}</td></tr>)}</tbody></table></div><p className="text-xs text-muted-foreground">سيتم حفظ الصفوف السليمة فقط، وسيُتجاهل كل صف يحتوي على خطأ.</p></div>}
    {step === 3 && <div className="rounded-2xl border bg-muted/20 p-6 text-center"><h3 className="font-bold">تأكيد عملية الاستيراد</h3><p className="mt-2 text-sm text-muted-foreground">سيتم إرسال {validRows.length} صف صالح للحفظ ضمن تحديث واحد للمخزن، مع تجاهل {invalidCount} صف غير صالح.</p><div className="mt-4 flex justify-center gap-3"><span className="rounded-xl bg-green-100 px-4 py-2 text-sm font-bold text-green-800">{validRows.length} صالح</span><span className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-800">{invalidCount} مستبعد</span></div></div>}
    {step === 4 && summary && <div className="grid gap-3 sm:grid-cols-3">{[{ label: "أضيف", value: summary.added, tone: "text-green-700" }, { label: "حُدّث", value: summary.updated, tone: "text-blue-700" }, { label: "تُجوهل", value: summary.ignored, tone: "text-muted-foreground" }].map((item) => <div key={item.label} className="rounded-2xl border bg-card p-5 text-center"><div className={`text-3xl font-extrabold ${item.tone}`}>{item.value.toLocaleString("ar-EG")}</div><div className="mt-1 text-sm font-bold">{item.label}</div></div>)}</div>}
    <DialogFooter className="gap-2 sm:justify-between">{step < 4 ? <Button variant="outline" onClick={() => step === 1 ? close(false) : step === 2 ? setStep(1) : setStep(2)}>{step === 1 ? "إلغاء" : "رجوع"}</Button> : <Button variant="outline" onClick={() => close(false)}>إغلاق</Button>}{step === 2 && <Button onClick={() => setStep(3)} disabled={validRows.length === 0}>متابعة إلى التأكيد</Button>}{step === 3 && <Button onClick={() => void confirmImport()} disabled={busy || validRows.length === 0}>{busy ? "جارٍ الحفظ..." : "تأكيد الاستيراد"}</Button>}</DialogFooter>
  </DialogContent></Dialog>;
}
