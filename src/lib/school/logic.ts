import type {
  AttendanceRecord,
  AttendanceStatus,
  Installment,
  Payment,
  SchoolClass,
  Slot,
  Student,
  Teacher,
} from "./types";

export const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"] as const;

export const PERIODS = [
  { n: 1, label: "الحصة الأولى", time: "07:45 - 08:30" },
  { n: 2, label: "الحصة الثانية", time: "08:30 - 09:15" },
  { n: 3, label: "الحصة الثالثة", time: "09:15 - 10:00" },
  { n: 4, label: "الحصة الرابعة", time: "10:30 - 11:15" },
  { n: 5, label: "الحصة الخامسة", time: "11:15 - 12:00" },
  { n: 6, label: "الحصة السادسة", time: "12:00 - 12:45" },
  { n: 7, label: "الحصة السابعة", time: "12:45 - 13:30" },
] as const;

/** Local YYYY-MM-DD. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Maps a JS date to school-day index (0 = Sunday ... 4 = Thursday), or null on Fri/Sat. */
export function schoolDayIndex(d: Date): number | null {
  const js = d.getDay(); // 0 Sun .. 6 Sat
  return js <= 4 ? js : null;
}

/** Most recent school day on or before `d`. */
export function lastSchoolDay(d: Date): Date {
  const cur = new Date(d);
  while (schoolDayIndex(cur) === null) {
    cur.setDate(cur.getDate() - 1);
  }
  return cur;
}

/** Today's school day, or the next one (Sunday) during the weekend. */
export function currentOrNextSchoolDay(d: Date): { day: number; isToday: boolean } {
  const idx = schoolDayIndex(d);
  if (idx !== null) return { day: idx, isToday: true };
  return { day: 0, isToday: false };
}

export interface FeeSummary {
  total: number;
  paid: number;
  remaining: number;
  percent: number;
  nextDue: Installment | null;
}

export function feeSummary(
  student: Pick<Student, "id" | "totalFees">,
  payments: Payment[],
  installments: Installment[],
): FeeSummary {
  const paid = payments
    .filter((p) => p.studentId === student.id)
    .reduce((sum, p) => sum + p.amount, 0);
  const total = student.totalFees;
  const remaining = Math.max(0, total - paid);
  const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const statuses = installmentStatuses(student.id, payments, installments, "9999-12-31");
  const nextDue =
    statuses.find((s) => s.status !== "paid")?.installment ?? null;
  return { total, paid, remaining, percent, nextDue };
}

export type InstallmentStatus = "paid" | "partial" | "due" | "overdue";

/** Installments are covered in due-date order by the student's cumulative payments. */
export function installmentStatuses(
  studentId: string,
  payments: Payment[],
  installments: Installment[],
  todayISO: string,
): { installment: Installment; status: InstallmentStatus; covered: number }[] {
  let pool = payments.filter((p) => p.studentId === studentId).reduce((s, p) => s + p.amount, 0);
  return installments
    .filter((i) => i.studentId === studentId)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((installment) => {
      const covered = Math.min(pool, installment.amount);
      pool -= covered;
      let status: InstallmentStatus;
      if (covered >= installment.amount) status = "paid";
      else if (installment.dueDate < todayISO) status = "overdue";
      else if (covered > 0) status = "partial";
      else status = "due";
      return { installment, status, covered };
    });
}

export function collectionRate(
  students: Pick<Student, "id" | "totalFees">[],
  payments: Payment[],
): number {
  const total = students.reduce((s, st) => s + st.totalFees, 0);
  const ids = new Set(students.map((s) => s.id));
  const paid = payments.filter((p) => ids.has(p.studentId)).reduce((s, p) => s + p.amount, 0);
  return total > 0 ? Math.round((paid / total) * 100) : 0;
}

export interface StageFinancialSummary {
  totalRequired: number;
  totalCollected: number;
  collectionRate: number;
  totalRemaining: number;
  remainingRate: number;
}

export function stageFinancialSummary(
  students: Pick<Student, "id" | "totalFees" | "status">[],
  payments: Payment[],
): StageFinancialSummary {
  const activeStudents = students.filter((s) => s.status !== "archived");
  const totalRequired = activeStudents.reduce((sum, s) => sum + s.totalFees, 0);
  const activeIds = new Set(activeStudents.map((s) => s.id));
  const totalCollected = payments
    .filter((p) => activeIds.has(p.studentId))
    .reduce((sum, p) => sum + p.amount, 0);
  const totalRemaining = Math.max(0, totalRequired - totalCollected);
  const collectionRate = totalRequired > 0 ? Math.round((totalCollected / totalRequired) * 100) : 0;
  const remainingRate = totalRequired > 0 ? Math.round((totalRemaining / totalRequired) * 100) : 0;

  return {
    totalRequired,
    totalCollected,
    collectionRate,
    totalRemaining,
    remainingRate,
  };
}

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number; // present + late counted as attended
}

export function attendanceStats(records: AttendanceRecord[], studentId?: string): AttendanceStats {
  const list = studentId ? records.filter((r) => r.studentId === studentId) : records;
  const count = (s: AttendanceStatus) => list.filter((r) => r.status === s).length;
  const present = count("present");
  const absent = count("absent");
  const late = count("late");
  const total = list.length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;
  return { present, absent, late, total, rate };
}

export interface TimetableConflictCheck {
  valid: boolean;
  hasConflict: boolean;
  errors: string[];
  warnings: string[];
}

export function detectTimetableConflicts(
  existingSlots: Slot[],
  slotToValidate: {
    id?: string | undefined;
    classId: string;
    day: number;
    period: number;
    teacherId: string;
    room: string;
  },
  allTeachers: Teacher[],
  allClasses: SchoolClass[],
): TimetableConflictCheck {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Exclude the slot itself if editing
  const otherSlots = existingSlots.filter((s) => s.id !== slotToValidate.id);

  // 1. Teacher conflict: Is the teacher teaching another class in the same day and period?
  const teacherConflict = otherSlots.find(
    (s) =>
      s.day === slotToValidate.day &&
      s.period === slotToValidate.period &&
      s.teacherId === slotToValidate.teacherId &&
      s.classId !== slotToValidate.classId,
  );
  if (teacherConflict) {
    const teacher = allTeachers.find((t) => t.id === slotToValidate.teacherId);
    const conflictClass = allClasses.find((c) => c.id === teacherConflict.classId);
    errors.push(
      `تعارض في جدول المعلم (${teacher?.name ?? "المعلم"}): مرتبط بحصة أخرى مع (${conflictClass?.name ?? teacherConflict.classId}) في نفس اليوم والحصة.`,
    );
  }

  // 2. Room conflict: Is the room booked for another class in the same day and period?
  const roomConflict = otherSlots.find(
    (s) =>
      s.day === slotToValidate.day &&
      s.period === slotToValidate.period &&
      s.room.trim().toLowerCase() === slotToValidate.room.trim().toLowerCase() &&
      s.classId !== slotToValidate.classId,
  );
  if (roomConflict) {
    const conflictClass = allClasses.find((c) => c.id === roomConflict.classId);
    errors.push(
      `تعارض في القاعة (${slotToValidate.room}): القاعة محجوزة بالفعل لـ (${conflictClass?.name ?? roomConflict.classId}) في نفس اليوم والحصة.`,
    );
  }

  // 3. Teacher assignment warning: Is the teacher officially assigned to this class?
  const teacher = allTeachers.find((t) => t.id === slotToValidate.teacherId);
  if (teacher && teacher.classes && !teacher.classes.includes(slotToValidate.classId)) {
    warnings.push(
      `تنبيه: المعلم (${teacher.name}) غير مسند رسمياً لهذا الفصل في قائمة فصوله.`,
    );
  }

  return {
    valid: errors.length === 0,
    hasConflict: errors.length > 0,
    errors,
    warnings,
  };
}

export function formatMoney(n: number): string {
  return `${n.toLocaleString("ar-EG")} ج.س`;
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = iso.length <= 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return d.toLocaleDateString("ar-EG", opts ?? { day: "numeric", month: "long", year: "numeric" });
}

export function daysUntil(iso: string, from: Date): number {
  const a = new Date(`${toISODate(from)}T00:00:00`).getTime();
  const b = new Date(`${iso.slice(0, 10)}T00:00:00`).getTime();
  return Math.round((b - a) / 86400000);
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}
