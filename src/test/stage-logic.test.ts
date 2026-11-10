import { describe, expect, it } from "vitest";
import { stageFinancialSummary } from "@/lib/school/logic";
import type { Payment, Student } from "@/lib/school/types";

describe("Stage Financial Summary Logic", () => {
  const mockStudents: Pick<Student, "id" | "totalFees" | "status">[] = [
    { id: "s1", totalFees: 100000, status: "active" },
    { id: "s2", totalFees: 150000, status: "active" },
    { id: "s3", totalFees: 200000, status: "archived" }, // Should be excluded
  ];

  const mockPayments: Payment[] = [
    { id: "p1", studentId: "s1", amount: 60000, date: "2026-01-15", method: "كاش", receiptNo: "RC-01" },
    { id: "p2", studentId: "s2", amount: 40000, date: "2026-02-10", method: "بنكك", receiptNo: "RC-02" },
    { id: "p3", studentId: "s3", amount: 50000, date: "2026-01-20", method: "بنكك", receiptNo: "RC-03" }, // From archived student
    { id: "p4", studentId: "s999", amount: 30000, date: "2026-01-25", method: "شيك", receiptNo: "RC-04" }, // From another stage
  ];

  it("calculates active student fees and filters stage payments accurately", () => {
    const summary = stageFinancialSummary(mockStudents, mockPayments);

    // Active students s1 (100k) + s2 (150k) = 250,000
    expect(summary.totalRequired).toBe(250000);

    // Only payments from active students s1 (60k) + s2 (40k) = 100,000
    expect(summary.totalCollected).toBe(100000);

    // Remaining = 250,000 - 100,000 = 150,000
    expect(summary.totalRemaining).toBe(150000);

    // Collection rate = (100k / 250k) * 100 = 40%
    expect(summary.collectionRate).toBe(40);

    // Remaining rate = (150k / 250k) * 100 = 60%
    expect(summary.remainingRate).toBe(60);
  });

  it("handles zero total required fees without division by zero error", () => {
    const emptyStudents: Pick<Student, "id" | "totalFees" | "status">[] = [];
    const summary = stageFinancialSummary(emptyStudents, mockPayments);

    expect(summary.totalRequired).toBe(0);
    expect(summary.totalCollected).toBe(0);
    expect(summary.totalRemaining).toBe(0);
    expect(summary.collectionRate).toBe(0);
    expect(summary.remainingRate).toBe(0);
  });
});
