import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  RotateCcw,
  UploadCloud,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  downloadCsvTemplate,
  parseImportFile,
  type ParseResult,
  type ParsedRow,
} from "@/lib/school/import";
import { cn } from "@/lib/utils";

export interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  requiredColumns: string[];
  templateFilename: string;
  templateHeaders: string[];
  templateSampleRows: string[][];
  rowValidator: (row: Record<string, string>, rowNumber: number) => { isValid: boolean; errors: string[] };
  onConfirmImport: (validRows: Record<string, string>[]) => Promise<{ added: number; updated?: number; ignored?: number }>;
  extraOptions?: React.ReactNode;
}

export function ImportDialog({
  open,
  onOpenChange,
  title,
  description,
  requiredColumns,
  templateFilename,
  templateHeaders,
  templateSampleRows,
  rowValidator,
  onConfirmImport,
  extraOptions,
}: ImportDialogProps) {
  const [step, setStep] = useState<"upload" | "preview" | "summary">("upload");
  const [loading, setLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [summary, setSummary] = useState<{ added: number; updated?: number; ignored?: number } | null>(null);

  const reset = () => {
    setStep("upload");
    setParseResult(null);
    setSummary(null);
    setLoading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const res = await parseImportFile(file, requiredColumns, rowValidator);
      if (res.fatalError) {
        toast.error(res.fatalError);
        setLoading(false);
        return;
      }
      setParseResult(res);
      setStep("preview");
    } catch (err) {
      toast.error(`حدث خطأ أثناء فحص الملف: ${(err as Error).message}`);
    } finally {
      setLoading(false);
      // reset file input
      e.target.value = "";
    }
  };

  const handleConfirm = async () => {
    if (!parseResult) return;
    const validRows = parseResult.rows.filter((r) => r.isValid).map((r) => r.data);
    if (validRows.length === 0) {
      toast.error("لا توجد صفوف صالحة للاستيراد");
      return;
    }

    setLoading(true);
    try {
      const res = await onConfirmImport(validRows);
      setSummary(res);
      setStep("summary");
      toast.success("تم تنفيذ الاستيراد بنجاح");
    } catch (err) {
      toast.error(`فشل حفظ البيانات: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) reset();
        onOpenChange(val);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-soft text-navy">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-navy">{title}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* STEP 1: UPLOAD */}
        {step === "upload" && (
          <div className="space-y-6 py-4 flex-1 overflow-y-auto">
            {extraOptions && <div className="p-4 rounded-2xl border bg-muted/40">{extraOptions}</div>}

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl p-8 text-center bg-card hover:border-gold transition-all">
              <UploadCloud className="h-12 w-12 text-gold mb-3 animate-pulse" />
              <h3 className="text-base font-bold text-foreground">اختر ملف Excel (.xlsx) أو CSV</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                الحد الأقصى لحجم الملف ٢ ميجابايت (حتى ٢٠٠٠ صف). يدعم النظام الأرقام المشرقية وإصلاح هواتف السودان تلقائياً.
              </p>

              <label className="mt-5 cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="hidden"
                />
                <Button type="button" asChild variant="gold" className="gap-2 cursor-pointer pointer-events-none">
                  <span>
                    <FileUp className="h-4 w-4" />
                    {loading ? "جاري فحص الملف..." : "تصفح الملفات من جهازك"}
                  </span>
                </Button>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border bg-muted/20">
              <div>
                <div className="text-xs font-bold text-foreground">هل تحتاج إلى نموذج جاهز للبيانات؟</div>
                <div className="text-[11px] text-muted-foreground">
                  قم بتحميل ملف CSV منسق مسبقاً يحتوي على الأعمدة المطلوبة وأمثلة واقعية
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadCsvTemplate(templateFilename, templateHeaders, templateSampleRows)}
                className="gap-2 text-xs font-bold shrink-0"
              >
                <Download className="h-4 w-4" />
                تحميل النموذج (CSV)
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW */}
        {step === "preview" && parseResult && (
          <div className="space-y-4 py-2 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between bg-card p-3 rounded-2xl border">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-bold">
                  إجمالي الصفوف: {parseResult.totalRows}
                </Badge>
                <Badge className="bg-success text-success-foreground text-xs font-bold">
                  صالحة: {parseResult.validCount}
                </Badge>
                {parseResult.invalidCount > 0 && (
                  <Badge variant="destructive" className="text-xs font-bold">
                    بها أخطاء: {parseResult.invalidCount}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("upload")}
                className="text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                اختيار ملف آخر
              </Button>
            </div>

            {parseResult.invalidCount > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  تنبيه: الصفوف المظللة بالأحمر بها أخطاء وسيتم تجاهلها تلقائياً عند التأكيد، وسيتم حفظ الصفوف السليمة فقط.
                </span>
              </div>
            )}

            {/* Preview Table */}
            <div className="flex-1 w-full overflow-auto rounded-2xl border bg-card">
              <table className="w-full min-w-[500px] text-xs text-start">
                <thead className="bg-muted/60 text-muted-foreground sticky top-0 border-b">
                  <tr>
                    <th className="p-2.5 text-center font-bold">#</th>
                    <th className="p-2.5 text-start font-bold">الحالة</th>
                    {parseResult.headers.map((h) => (
                      <th key={h} className="p-2.5 text-start font-bold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parseResult.rows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={cn(
                        "transition-colors",
                        row.isValid ? "hover:bg-muted/20" : "bg-destructive/10 hover:bg-destructive/15",
                      )}
                    >
                      <td className="p-2.5 text-center font-mono text-muted-foreground">{row.rowNumber}</td>
                      <td className="p-2.5 whitespace-nowrap">
                        {row.isValid ? (
                          <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30 font-bold">
                            صالح
                          </Badge>
                        ) : (
                          <div className="space-y-0.5">
                            <Badge variant="destructive" className="text-[10px] font-bold">
                              خطأ
                            </Badge>
                            <div className="text-[10px] text-destructive leading-tight font-medium">
                              {row.errors.join(" · ")}
                            </div>
                          </div>
                        )}
                      </td>
                      {parseResult.headers.map((h) => (
                        <td key={h} className="p-2.5 whitespace-nowrap text-foreground font-medium">
                          {row.data[h] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 3: SUMMARY */}
        {step === "summary" && summary && (
          <div className="py-8 space-y-4 text-center flex-1 flex flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-success-soft text-success mb-2">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-navy">اكتمل الاستيراد بنجاح!</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              تم تحديث قاعدة البيانات في معاملة واحدة متكاملة، والبيانات جاهزة للاستخدام الآن.
            </p>

            <div className="grid grid-cols-3 gap-3 w-full max-w-md pt-4">
              <div className="rounded-2xl border bg-card p-3">
                <div className="text-2xl font-black text-navy">{summary.added}</div>
                <div className="text-[11px] text-muted-foreground font-bold">سجلات أُضيفت</div>
              </div>
              <div className="rounded-2xl border bg-card p-3">
                <div className="text-2xl font-black text-gold">{summary.updated ?? 0}</div>
                <div className="text-[11px] text-muted-foreground font-bold">سجلات حُدّثت</div>
              </div>
              <div className="rounded-2xl border bg-card p-3">
                <div className="text-2xl font-black text-muted-foreground">{summary.ignored ?? 0}</div>
                <div className="text-[11px] text-muted-foreground font-bold">سجلات تُجوهلت</div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 pt-3 border-t flex items-center justify-between gap-2">
          {step === "upload" && (
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
          )}

          {step === "preview" && (
            <>
              <Button type="button" variant="outline" onClick={() => setStep("upload")} disabled={loading}>
                السابق
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={loading || !parseResult || parseResult.validCount === 0}
                className="gap-2 bg-primary hover:bg-navy font-bold"
              >
                {loading ? "جاري الحفظ..." : `تأكيد استيراد (${parseResult?.validCount ?? 0}) صفاً`}
              </Button>
            </>
          )}

          {step === "summary" && (
            <Button
              type="button"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              className="w-full bg-primary hover:bg-navy font-bold"
            >
              تم وإغلاق
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
