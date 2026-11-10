import Papa from "papaparse";
import readXlsxFile from "read-excel-file/browser";

export const MAX_IMPORT_ROWS = 2000;
export const MAX_IMPORT_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/** Converts Eastern Arabic numerals (٠-٩) to standard Latin numerals (0-9) */
export function normalizeDigits(input: string): string {
  const eastern = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  let out = input;
  for (let i = 0; i < 10; i++) {
    out = out.replaceAll(eastern[i]!, String(i));
  }
  return out;
}

/** Cleans string: strips UTF-8 BOM, converts digits, and trims */
export function cleanText(val: unknown): string {
  if (val === null || val === undefined) return "";
  let str = String(val).replace(/^\uFEFF/, "").trim();
  str = normalizeDigits(str);
  return str;
}

/**
 * Normalizes Sudanese phone numbers.
 * If an Excel export dropped the leading zero (e.g. 912345678 or 123456789 - 9 digits starting with 9 or 1),
 * it prepends '0' to make it a standard 10-digit phone number.
 */
export function normalizePhone(raw: string): string {
  let cleaned = normalizeDigits(raw).replace(/[^\d+]/g, "");
  // If starts with +249, convert to local 0...
  if (cleaned.startsWith("+249")) {
    cleaned = "0" + cleaned.slice(4);
  } else if (cleaned.startsWith("249")) {
    cleaned = "0" + cleaned.slice(3);
  }

  // 9 digits starting with 9 or 1 -> prepend 0
  if (cleaned.length === 9 && (cleaned.startsWith("9") || cleaned.startsWith("1"))) {
    cleaned = "0" + cleaned;
  }

  return cleaned;
}

/** Validates that all required columns are present in the parsed headers */
export function validateHeaders(
  actualHeaders: string[],
  requiredHeaders: string[],
): { valid: boolean; missing: string[] } {
  const normalizedActual = actualHeaders.map((h) => cleanText(h).toLowerCase());
  const missing: string[] = [];

  for (const req of requiredHeaders) {
    const nReq = cleanText(req).toLowerCase();
    if (!normalizedActual.includes(nReq)) {
      missing.push(req);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Reads and decodes a CSV file buffer.
 * Automatically tries UTF-8 first. If replacement character (\uFFFD) is found,
 * it falls back to windows-1256 (Arabic Windows encoding).
 */
export async function readCsvFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let text = new TextDecoder("utf-8").decode(buffer);

  // If corrupted characters appear, fallback to windows-1256
  if (text.includes("\uFFFD")) {
    try {
      text = new TextDecoder("windows-1256").decode(buffer);
    } catch {
      // keep original utf-8 if windows-1256 decoder is unavailable
    }
  }

  return text.replace(/^\uFEFF/, "");
}

export interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
  isValid: boolean;
  errors: string[];
}

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
  fatalError?: string;
}

/**
 * Universal file parser for CSV and Excel (.xlsx) files
 */
export async function parseImportFile(
  file: File,
  requiredColumns: string[],
  rowValidator: (row: Record<string, string>, rowNumber: number) => { isValid: boolean; errors: string[] },
): Promise<ParseResult> {
  if (file.size > MAX_IMPORT_FILE_SIZE) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
      fatalError: `حجم الملف يتجاوز الحد الأقصى المسموح به (${MAX_IMPORT_FILE_SIZE / (1024 * 1024)} ميجابايت)`,
    };
  }

  const isXlsx = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
  let rawRows: Record<string, string>[] = [];
  let headers: string[] = [];

  try {
    if (isXlsx) {
      const rows = (await readXlsxFile(file)) as unknown as unknown[][];
      if (rows.length === 0) {
        return { headers: [], rows: [], totalRows: 0, validCount: 0, invalidCount: 0, fatalError: "الملف فارغ" };
      }
      headers = (rows[0] ?? []).map((h: unknown) => cleanText(h));
      for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i];
        if (!rowData) continue;
        const record: Record<string, string> = {};
        let hasContent = false;
        headers.forEach((h, colIdx) => {
          const val = cleanText(rowData[colIdx]);
          if (val) hasContent = true;
          record[h] = val;
        });
        if (hasContent) {
          rawRows.push(record);
        }
      }
    } else {
      const csvText = await readCsvFile(file);
      const parsed = Papa.parse<Record<string, unknown>>(csvText, {
        header: true,
        skipEmptyLines: true,
      });

      headers = (parsed.meta.fields ?? []).map((h) => cleanText(h));
      rawRows = parsed.data.map((row) => {
        const record: Record<string, string> = {};
        for (const [k, v] of Object.entries(row)) {
          record[cleanText(k)] = cleanText(v);
        }
        return record;
      });
    }
  } catch (err) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
      fatalError: `فشل قراءة الملف: ${(err as Error).message}`,
    };
  }

  if (rawRows.length > MAX_IMPORT_ROWS) {
    return {
      headers,
      rows: [],
      totalRows: rawRows.length,
      validCount: 0,
      invalidCount: 0,
      fatalError: `عدد الصفوف (${rawRows.length}) يتجاوز الحد الأقصى المسموح به (${MAX_IMPORT_ROWS} صف)`,
    };
  }

  // Validate headers
  const headerCheck = validateHeaders(headers, requiredColumns);
  if (!headerCheck.valid) {
    return {
      headers,
      rows: [],
      totalRows: rawRows.length,
      validCount: 0,
      invalidCount: 0,
      fatalError: `الملف يفتقر إلى الأعمدة المطلوبة التالية: ${headerCheck.missing.join("، ")}`,
    };
  }

  // Validate rows
  const parsedRows: ParsedRow[] = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let idx = 0; idx < rawRows.length; idx++) {
    const row = rawRows[idx]!;
    const { isValid, errors } = rowValidator(row, idx + 1);
    if (isValid) validCount++;
    else invalidCount++;

    parsedRows.push({
      rowNumber: idx + 1,
      data: row,
      isValid,
      errors,
    });
  }

  return {
    headers,
    rows: parsedRows,
    totalRows: parsedRows.length,
    validCount,
    invalidCount,
  };
}

/** Generates a downloadable CSV with UTF-8 BOM so Excel opens Arabic correctly */
export function downloadCsvTemplate(filename: string, headers: string[], sampleRows: string[][]) {
  const bom = "\uFEFF";
  const headerLine = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(",");
  const dataLines = sampleRows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const csvContent = bom + headerLine + "\r\n" + dataLines;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
