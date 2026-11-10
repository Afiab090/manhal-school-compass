import { describe, expect, it } from "vitest";
import { cleanText, normalizeDigits, normalizePhone, validateHeaders } from "@/lib/school/import";

describe("Import Normalization Utility", () => {
  describe("normalizeDigits", () => {
    it("converts all Eastern Arabic numerals (٠-٩) to Western Latin digits (0-9)", () => {
      const eastern = "٠١٢٣٤٥٦٧٨٩";
      expect(normalizeDigits(eastern)).toBe("0123456789");
    });

    it("handles mixed strings with arabic and latin characters", () => {
      const mixed = "STD-SEC-١٠٠١";
      expect(normalizeDigits(mixed)).toBe("STD-SEC-1001");
    });

    it("leaves standard digits unchanged", () => {
      expect(normalizeDigits("123456")).toBe("123456");
    });
  });

  describe("cleanText", () => {
    it("removes UTF-8 BOM, trims whitespace, and normalizes digits", () => {
      const raw = "\uFEFF   أحمد محمد علي ١٢٣   ";
      expect(cleanText(raw)).toBe("أحمد محمد علي 123");
    });

    it("handles null or undefined gracefully", () => {
      expect(cleanText(null)).toBe("");
      expect(cleanText(undefined)).toBe("");
    });
  });

  describe("normalizePhone (Sudanese phone format)", () => {
    it("prepends 0 to 9-digit numbers starting with 9 or 1 (restoring stripped leading zero from Excel)", () => {
      expect(normalizePhone("912345678")).toBe("0912345678");
      expect(normalizePhone("123456789")).toBe("0123456789");
    });

    it("converts international +249 or 249 prefix to local 0-prefix", () => {
      expect(normalizePhone("+249912345678")).toBe("0912345678");
      expect(normalizePhone("249123456789")).toBe("0123456789");
    });

    it("strips dashes, spaces, and handles Eastern Arabic digits", () => {
      expect(normalizePhone("٠٩١٢-٣٤٥-٦٧٨")).toBe("0912345678");
      expect(normalizePhone("0912 345 678")).toBe("0912345678");
    });

    it("preserves already correct 10-digit numbers starting with 0", () => {
      expect(normalizePhone("0912345678")).toBe("0912345678");
    });
  });

  describe("validateHeaders", () => {
    it("passes when all required headers are present regardless of spacing or letter case", () => {
      const actual = ["الاسم الكامل ", "الرقم الأكاديمي", "كود الفصل", "اسم ولي الأمر", "هاتف ولي الأمر"];
      const required = ["الاسم الكامل", "الرقم الأكاديمي", "كود الفصل", "اسم ولي الأمر", "هاتف ولي الأمر"];
      const result = validateHeaders(actual, required);
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it("identifies missing required headers", () => {
      const actual = ["الاسم الكامل", "كود الفصل"];
      const required = ["الاسم الكامل", "الرقم الأكاديمي", "كود الفصل"];
      const result = validateHeaders(actual, required);
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(["الرقم الأكاديمي"]);
    });
  });
});
