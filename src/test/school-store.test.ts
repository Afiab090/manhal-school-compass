import { beforeAll, describe, expect, it } from "vitest";
import { addStudent, addTeacher } from "@/lib/school/store";
import type { Student, Teacher } from "@/lib/school/types";

beforeAll(() => window.localStorage.clear());

describe("store uniqueness rules", () => {
  it("rejects a duplicate academic ID", () => {
    const duplicate: Omit<Student, "id"> = {
      name: "طالب مكرر", academicId: "MNH-2026-0001", classId: "p1b", parentName: "ولي أمر", parentPhone: "0912345678", totalFees: 500000, status: "active",
    };
    expect(() => addStudent(duplicate)).toThrow("الرقم الأكاديمي مستخدم مسبقاً");
  });

  it("rejects a duplicate employee ID", () => {
    const duplicate: Omit<Teacher, "id"> = {
      name: "معلم مكرر", employeeId: "T-101", subject: "الرياضيات", phone: "0912345678", classes: [], stageIds: ["stg-pri"], status: "active",
    };
    expect(() => addTeacher(duplicate)).toThrow("الرقم الوظيفي مستخدم مسبقاً");
  });
});
