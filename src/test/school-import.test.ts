import { describe, expect, it } from "vitest";
import { assertRequiredColumns, normalizeDigits, normalizeSudanesePhone, validateRequiredColumns } from "@/lib/school/import";

describe("school import normalization", () => {
  it("converts Eastern Arabic digits into ASCII", () => {
    expect(normalizeDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
  });

  it("restores an Excel-dropped leading zero for Sudanese mobile numbers", () => {
    expect(normalizeSudanesePhone("912345678")).toBe("0912345678");
    expect(normalizeSudanesePhone("112345678")).toBe("0112345678");
    expect(normalizeSudanesePhone("0912345678")).toBe("0912345678");
  });

  it("identifies missing columns by their exact header", () => {
    expect(validateRequiredColumns(["الاسم", "الرقم الأكاديمي"], ["الاسم", "الفصل"])).toEqual(["الفصل"]);
    expect(() => assertRequiredColumns(["الاسم"], ["الاسم", "هاتف ولي الأمر"])).toThrow("هاتف ولي الأمر");
  });
});
