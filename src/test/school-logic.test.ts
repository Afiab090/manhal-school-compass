import { describe, expect, it } from "vitest";
import { createSeed } from "@/lib/school/seed";
import { detectTimetableConflicts, stageOverview } from "@/lib/school/logic";

describe("stage-scoped school calculations", () => {
  it("calculates stage counts and fee percentages independently", () => {
    const state = createSeed(new Date("2026-11-10T12:00:00"));
    const overview = stageOverview(state, "stg-pri");
    expect(overview.classCount).toBe(6);
    expect(overview.activeStudents).toBe(60);
    expect(overview.activeTeachers).toBe(7);
    expect(overview.totalFees).toBeGreaterThan(0);
    expect(overview.collected + overview.remaining).toBe(overview.totalFees);
    expect(overview.collectionPercent + overview.remainingPercent).toBe(100);
    expect(stageOverview(state, "stg-mid").classCount).toBe(3);
  });

  it("seeds a complete weekly timetable without teacher or room collisions", () => {
    const state = createSeed(new Date("2026-11-10T12:00:00"));
    expect(state.slots).toHaveLength(15 * 5 * 7);
    expect(detectTimetableConflicts(state.slots, state.teachers).filter((item) => item.severity === "error")).toEqual([]);
  });
});

describe("timetable conflict detection", () => {
  it("rejects a teacher scheduled in two classes at the same time", () => {
    const conflicts = detectTimetableConflicts([
      { id: "a", classId: "c1", day: 0, period: 1, subject: "رياضيات", teacherId: "t1", room: "A" },
      { id: "b", classId: "c2", day: 0, period: 1, subject: "علوم", teacherId: "t1", room: "B" },
    ]);
    expect(conflicts.some((item) => item.type === "teacher" && item.severity === "error")).toBe(true);
  });

  it("rejects a room booked by two classes at the same time", () => {
    const conflicts = detectTimetableConflicts([
      { id: "a", classId: "c1", day: 2, period: 4, subject: "رياضيات", teacherId: "t1", room: "قاعة 1" },
      { id: "b", classId: "c2", day: 2, period: 4, subject: "علوم", teacherId: "t2", room: "قاعة 1" },
    ]);
    expect(conflicts.some((item) => item.type === "room" && item.severity === "error")).toBe(true);
  });

  it("warns without blocking when the teacher is not assigned to the class", () => {
    const conflicts = detectTimetableConflicts(
      [{ id: "a", classId: "c1", day: 0, period: 1, subject: "رياضيات", teacherId: "t1", room: "A" }],
      [{ id: "t1", name: "معلم", employeeId: "T-1", subject: "رياضيات", phone: "", classes: [], stageIds: ["stg-pri"], status: "active" }],
    );
    expect(conflicts).toEqual([expect.objectContaining({ type: "unassigned", severity: "warning" })]);
  });
});
