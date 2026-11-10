import { beforeEach, describe, expect, it } from "vitest";
import { addStudent, addTeacher, forceResetDefaultData } from "@/lib/school/store";

describe("Store Entity Uniqueness Constraints", () => {
  beforeEach(() => {
    forceResetDefaultData();
  });

  describe("Student Academic ID Uniqueness", () => {
    it("rejects duplicate academic ID regardless of casing or whitespace", () => {
      // First student
      const res1 = addStudent({
        academicId: "TEST-STD-9901",
        name: "طالب تجريبي أول",
        classId: "c-sec-1a",
        parentName: "ولي أمر أول",
        parentPhone: "0912345678",
        status: "active",
        totalFees: 300000,
      });
      expect(res1.ok).toBe(true);

      // Attempt duplicate with spaces and lowercase
      const res2 = addStudent({
        academicId: "  test-std-9901  ",
        name: "طالب تجريبي ثان مكرر",
        classId: "c-sec-1a",
        parentName: "ولي أمر ثان",
        parentPhone: "0987654321",
        status: "active",
        totalFees: 300000,
      });
      expect(res2.ok).toBe(false);
      if (!res2.ok) {
        expect(res2.error).toContain("مسجل بالفعل لطالب آخر");
      }
    });
  });

  describe("Teacher Employee ID Uniqueness", () => {
    it("rejects duplicate teacher employee ID", () => {
      const res1 = addTeacher({
        employeeId: "EMP-TEST-99",
        name: "معلم تجريبي أول",
        subject: "الرياضيات",
        phone: "0912111222",
        status: "active",
        stageIds: ["المرحلة الثانوية"],
        classes: ["c-sec-1a"],
      });
      expect(res1.ok).toBe(true);

      const res2 = addTeacher({
        employeeId: "emp-test-99",
        name: "معلم تجريبي ثان مكرر",
        subject: "الفيزياء",
        phone: "0912333444",
        status: "active",
        stageIds: ["المرحلة الثانوية"],
        classes: ["c-sec-1b"],
      });
      expect(res2.ok).toBe(false);
      if (!res2.ok) {
        expect(res2.error).toContain("مسجل بالفعل لمعلم آخر");
      }
    });
  });
});
