import type {
  AttendanceRecord,
  AttendanceStatus,
  Installment,
  Payment,
  Student,
} from "./types";

export const MAX_WEEKLY_PERIODS = 25;

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


export interface StageOverview {
  classCount: number;
  activeStudents: number;
  activeTeachers: number;
  totalFees: number;
  collected: number;
  remaining: number;
  collectionPercent: number;
  remainingPercent: number;
}

export function stageOverview(
  state: Pick<import("./types").SchoolState, "classes" | "students" | "teachers" | "payments">,
  stageId: import("./types").StageId,
): StageOverview {
  const stageClasses = state.classes.filter((c) => c.stageId === stageId);
  const classIds = new Set(stageClasses.map((c) => c.id));
  const students = state.students.filter((st) => classIds.has(st.classId) && st.status === "active");
  const teachers = state.teachers.filter((t) => t.status === "active" && t.stageIds?.includes(stageId));
  const studentIds = new Set(students.map((st) => st.id));
  const totalFees = students.reduce((sum, st) => sum + st.totalFees, 0);
  const collected = state.payments.filter((p) => studentIds.has(p.studentId)).reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, totalFees - collected);
  return {
    classCount: stageClasses.length,
    activeStudents: students.length,
    activeTeachers: teachers.length,
    totalFees,
    collected,
    remaining,
    collectionPercent: totalFees > 0 ? Math.min(100, Math.round((collected / totalFees) * 100)) : 0,
    remainingPercent: totalFees > 0 ? Math.min(100, Math.round((remaining / totalFees) * 100)) : 0,
  };
}

export interface TimetableConflict {
  type: "teacher" | "room" | "unassigned";
  severity: "error" | "warning";
  message: string;
  slotIds: string[];
}

/** Detect overlapping teacher/room bookings in one candidate timetable or the full timetable. */
export function detectTimetableConflicts(
  slots: import("./types").Slot[],
  teachers: import("./types").Teacher[] = [],
): TimetableConflict[] {
  const conflicts: TimetableConflict[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < slots.length; i += 1) {
    const current = slots[i]!;
    const teacher = teachers.find((t) => t.id === current.teacherId);
    if (teacher && !(teacher.classes ?? []).includes(current.classId)) {
      const key = `unassigned:${current.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        conflicts.push({ type: "unassigned", severity: "warning", message: `المعلم ${teacher.name} غير مسند رسمياً لهذا الفصل`, slotIds: [current.id] });
      }
    }
    for (let j = i + 1; j < slots.length; j += 1) {
      const other = slots[j]!;
      if (current.day !== other.day || current.period !== other.period || current.classId === other.classId) continue;
      if (current.teacherId && current.teacherId === other.teacherId) {
        const key = `teacher:${[current.id, other.id].sort().join(":")}`;
        if (!seen.has(key)) {
          seen.add(key);
          conflicts.push({ type: "teacher", severity: "error", message: `المعلم نفسه مسجل في فصلين يوم ${DAYS[current.day]} الحصة ${current.period}`, slotIds: [current.id, other.id] });
        }
      }
      if (current.room.trim() && current.room.trim().toLowerCase() === other.room.trim().toLowerCase()) {
        const key = `room:${[current.id, other.id].sort().join(":")}`;
        if (!seen.has(key)) {
          seen.add(key);
          conflicts.push({ type: "room", severity: "error", message: `القاعة ${current.room} محجوزة لفصلين في الوقت نفسه`, slotIds: [current.id, other.id] });
        }
      }
    }
  }
  return conflicts;
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
