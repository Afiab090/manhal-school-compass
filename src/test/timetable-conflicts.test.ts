import { describe, expect, it } from "vitest";
import { detectTimetableConflicts } from "@/lib/school/logic";
import type { SchoolClass, Slot, Teacher } from "@/lib/school/types";

describe("Timetable Conflict Detection Logic", () => {
  const mockClasses: SchoolClass[] = [
    { id: "c1", name: "أول ثانوي (أ)", short: "1ث-أ", stageId: "المرحلة الثانوية", capacity: 35 },
    { id: "c2", name: "أول ثانوي (ب)", short: "1ث-ب", stageId: "المرحلة الثانوية", capacity: 35 },
  ];

  const mockTeachers: Teacher[] = [
    {
      id: "t1",
      name: "أ. طارق الجزولي",
      employeeId: "T-101",
      subject: "الرياضيات",
      phone: "0912345678",
      status: "active",
      stageIds: ["المرحلة الثانوية"],
      classes: ["c1"], // Only assigned to c1
    },
    {
      id: "t2",
      name: "أ. فاطمة النور",
      employeeId: "T-102",
      subject: "اللغة العربية",
      phone: "0912456789",
      status: "active",
      stageIds: ["المرحلة الثانوية"],
      classes: ["c1", "c2"],
    },
  ];

  const existingSlots: Slot[] = [
    {
      id: "sl1",
      classId: "c1",
      day: 0, // Sunday
      period: 1, // Period 1
      subject: "الرياضيات",
      teacherId: "t1",
      room: "قاعة 101",
    },
  ];

  it("detects teacher double-booking collision when same teacher is scheduled elsewhere at the same time", () => {
    // Attempting to schedule teacher t1 for class c2 on Sunday, Period 1
    const conflictSlot = {
      classId: "c2",
      day: 0,
      period: 1,
      teacherId: "t1",
      room: "قاعة 102",
    };

    const result = detectTimetableConflicts(existingSlots, conflictSlot, mockTeachers, mockClasses);
    expect(result.hasConflict).toBe(true);
    expect(result.errors.some((e) => e.includes("تعارض في جدول المعلم"))).toBe(true);
  });

  it("detects room double-booking collision when room is already occupied at the same time", () => {
    // Attempting to use Room 101 for class c2 on Sunday, Period 1 with teacher t2
    const conflictSlot = {
      classId: "c2",
      day: 0,
      period: 1,
      teacherId: "t2",
      room: "قاعة 101",
    };

    const result = detectTimetableConflicts(existingSlots, conflictSlot, mockTeachers, mockClasses);
    expect(result.hasConflict).toBe(true);
    expect(result.errors.some((e) => e.includes("تعارض في القاعة"))).toBe(true);
  });

  it("warns when teacher is not assigned to the class", () => {
    // Teacher t1 is only assigned to c1, not c2. Scheduled on Sunday, Period 2 (no collision)
    const validSlotWithWarning = {
      classId: "c2",
      day: 0,
      period: 2,
      teacherId: "t1",
      room: "قاعة 102",
    };

    const result = detectTimetableConflicts(existingSlots, validSlotWithWarning, mockTeachers, mockClasses);
    expect(result.hasConflict).toBe(false);
    expect(result.warnings.some((w) => w.includes("غير مسند رسمياً لهذا الفصل"))).toBe(true);
  });

  it("approves collision-free timetable slot without errors or warnings", () => {
    // Teacher t2 assigned to c2, on Sunday, Period 2, in Room 102
    const clearSlot = {
      classId: "c2",
      day: 0,
      period: 2,
      teacherId: "t2",
      room: "قاعة 102",
    };

    const result = detectTimetableConflicts(existingSlots, clearSlot, mockTeachers, mockClasses);
    expect(result.hasConflict).toBe(false);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});
