import Papa from "papaparse";
import readXlsxFile from "read-excel-file/universal";

export const MAX_IMPORT_ROWS = 2000;
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

export function normalizeDigits(value: unknown): string {
  return String(value ?? "").replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export function normalizeCell(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return normalizeDigits(value).replace(/^\uFEFF/, "").replace(/\uFEFF/g, "").replace(/\s+/g, " ").trim();
}

export function normalizeSudanesePhone(value: unknown): string {
  const digits = normalizeDigits(value).replace(/\D/g, "");
  return digits.length === 9 && /^[91]/.test(digits) ? `0${digits}` : digits;
}

export function validateRequiredColumns(headers: string[], required: string[]): string[] {
  const normalized = new Set(headers.map(normalizeCell));
  return required.filter((column) => !normalized.has(normalizeCell(column)));
}

export function assertRequiredColumns(headers: string[], required: string[]): void {
  const missing = validateRequiredColumns(headers, required);
  if (missing.length) throw new Error(`الأعمدة التالية غير موجودة في الملف: ${missing.join("، ")}`);
}


export interface ParsedImportFile {
  headers: string[];
  rows: Record<string, string>[];
}

export async function parseCsvFile(file: File): Promise<ParsedImportFile> {
  if (file.size > MAX_IMPORT_BYTES) throw new Error("حجم الملف يتجاوز الحد الأقصى البالغ 2 ميجابايت");
  const buffer = await file.arrayBuffer();
  let decoded = new TextDecoder("utf-8").decode(buffer);
  if (decoded.includes("\uFFFD")) decoded = new TextDecoder("windows-1256").decode(buffer);
  const result = Papa.parse<string[]>(decoded.replace(/^\uFEFF/, ""), {
    skipEmptyLines: "greedy",
    dynamicTyping: false,
    transform: (value) => normalizeCell(value),
  });
  if (result.errors.length) throw new Error(`تعذر تحليل CSV: ${result.errors[0]?.message ?? "صيغة غير صحيحة"}`);
  const matrix = result.data;
  if (!matrix.length) throw new Error("الملف فارغ أو لا يحتوي على صف عناوين");
  const headers = (matrix[0] ?? []).map(normalizeCell);
  const body = matrix.slice(1);
  if (body.length > MAX_IMPORT_ROWS) throw new Error(`الملف يحتوي على أكثر من ${MAX_IMPORT_ROWS} صف`);
  const rows = body.map((cells) => Object.fromEntries(headers.map((header, index) => [header, normalizeCell(cells[index] ?? "")])));
  return { headers, rows };
}

/** CSV template generation always includes a UTF-8 BOM for correct Arabic display in spreadsheet apps. */
export function generateCsvTemplate(headers: string[], sampleRows: string[][] = []): string {
  const rows = [headers, ...(sampleRows.length ? sampleRows : [headers.map((_, index) => index === 0 ? "مثال ١" : ""), headers.map((_, index) => index === 0 ? "مثال ٢" : "")])];
  const quote = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
  return `\uFEFF${rows.map((row) => row.map(quote).join(",")).join("\r\n")}`;
}

export function downloadCsvTemplate(filename: string, headers: string[], sampleRows?: string[][]): void {
  const blob = new Blob([generateCsvTemplate(headers, sampleRows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Accepts CSV and XLSX files with identical row and byte limits. */
export async function parseImportFile(file: File): Promise<ParsedImportFile> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "csv" || file.type === "text/csv") return parseCsvFile(file);
  if (extension === "xlsx") {
    if (file.size > MAX_IMPORT_BYTES) throw new Error("حجم الملف يتجاوز الحد الأقصى البالغ 2 ميجابايت");
    try {
      const matrix = await readXlsxFile(file) as unknown[][];
      if (matrix.length === 0) throw new Error("ملف Excel فارغ");
      const headers = (matrix[0] ?? []).map(normalizeCell);
      const body = matrix.slice(1);
      if (body.length > MAX_IMPORT_ROWS) throw new Error(`الملف يحتوي على أكثر من ${MAX_IMPORT_ROWS} صف`);
      return { headers, rows: body.map((cells) => Object.fromEntries(headers.map((header, index) => [header, normalizeCell(cells[index] ?? "")])) ) };
    } catch (error) {
      if (error instanceof Error && error.message.includes("أكثر من")) throw error;
      throw new Error("تعذر قراءة ملف Excel. تحقق من سلامة الملف وأنه بصيغة XLSX.");
    }
  }
  throw new Error("صيغة الملف غير مدعومة. اختر ملف CSV أو XLSX.");
}
