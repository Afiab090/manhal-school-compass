import { useSyncExternalStore } from "react";

import { detectTimetableConflicts, toISODate, uid } from "./logic";
import { DEMO, DEMO_MODE, SEED_VERSION, createSeed } from "./seed";
import type {
  AcademicSection, AcademicStage, AcademicYearConfig, Announcement, AppNotification,
  AttendanceStatus, BehaviorRecord, CalendarEvent, GradeEntry, GradeLevel, Homework,
  Installment, Payment, Role, SchoolClass, SchoolState, Slot, StageId, Student, Teacher,
} from "./types";

const KEY = "almanhal-school-state-v8";
let state: SchoolState | null = null;
let serverSnapshot: SchoolState | null = null;
const listeners = new Set<() => void>();

function load(): SchoolState {
  if (state) return state;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SchoolState;
        if (parsed.version === SEED_VERSION) { state = parsed; return state; }
      }
    } catch { /* invalid or old cache: create a clean state */ }
  }
  state = createSeed();
  persist();
  return state;
}
function persist() {
  if (!state || typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (error) { console.warn("تعذر حفظ البيانات محلياً", error); throw new Error("مساحة التخزين ممتلئة — تعذر حفظ التغييرات"); }
}
function emit() { listeners.forEach((listener) => listener()); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => { if (event.key === KEY) { state = null; load(); listener(); } };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); if (typeof window !== "undefined") window.removeEventListener("storage", onStorage); };
}
function getSnapshot() { return load(); }
function getServerSnapshot() { if (!serverSnapshot) serverSnapshot = createSeed(); return serverSnapshot; }
export function useSchool(): SchoolState { return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot); }
function update(fn: (current: SchoolState) => SchoolState) {
  const previous = load();
  state = fn(previous);
  try { persist(); } catch (error) { state = previous; throw error; }
  emit();
}
function notify(current: SchoolState, item: Omit<AppNotification, "id" | "date" | "readBy">): SchoolState {
  return { ...current, notifications: [{ ...item, id: uid("nt"), date: new Date().toISOString(), readBy: [] }, ...current.notifications] };
}

/* Session and authentication */
export type LoginResult = { ok: true } | { ok: false; error: string };
export function login(role: Role, identifier: string, password: string, stageId: StageId = "stg-pri"): LoginResult {
  const current = load();
  const id = identifier.trim().toLowerCase();
  if (password !== DEMO.password) return { ok: false, error: "كلمة المرور غير صحيحة" };
  if (role === "student") {
    const student = current.students.find((item) => item.academicId.toLowerCase() === id);
    if (!student || student.status !== "active") return { ok: false, error: "لم يتم العثور على حساب طالب نشط بهذا الرقم" };
    const studentStage = current.classes.find((item) => item.id === student.classId)?.stageId;
    if (studentStage !== stageId) return { ok: false, error: "هذا الحساب لا يتبع المرحلة المختارة" };
    update((s) => ({ ...s, session: { role, userId: student.id, stageId } }));
    return { ok: true };
  }
  if (role === "teacher") {
    const teacher = current.teachers.find((item) => item.employeeId.toLowerCase() === id);
    if (!teacher || teacher.status !== "active") return { ok: false, error: "لم يتم العثور على حساب معلم نشط بهذا الرقم" };
    if (!teacher.stageIds?.includes(stageId)) return { ok: false, error: "هذا الحساب لا يتبع المرحلة المختارة" };
    update((s) => ({ ...s, session: { role, userId: teacher.id, stageId } }));
    return { ok: true };
  }
  const admin = current.admins.find((item) => item.username.toLowerCase() === id);
  if (!admin) return { ok: false, error: "لم يتم العثور على حساب إداري بهذا الاسم" };
  update((s) => ({ ...s, session: { role, userId: admin.id, stageId } }));
  return { ok: true };
}
export function demoLogin(role: Role, stageId: StageId = "stg-pri", adminUsername?: string): LoginResult {
  if (!DEMO_MODE) return { ok: false, error: "الدخول التجريبي غير متاح" };
  const identifier = role === "student" ? DEMO.student.academicId : role === "teacher" ? DEMO.teacher.employeeId : (adminUsername ?? DEMO.admin.username);
  return login(role, identifier, DEMO.password, stageId);
}
export function setSessionStage(stageId: StageId) {
  update((s) => s.session?.role === "admin" ? ({ ...s, session: { ...s.session, stageId } }) : s);
}
export function logout() { update((s) => ({ ...s, session: null })); }
export function forceResetDefaultData() { if (!DEMO_MODE) return; state = createSeed(); state.session = { role: "admin", userId: DEMO.admin.id, stageId: "stg-pri" }; persist(); emit(); }

/* Notifications */
export function markNotificationsRead(userId: string, ids: string[]) {
  update((s) => ({ ...s, notifications: s.notifications.map((n) => ids.includes(n.id) && !n.readBy.includes(userId) ? { ...n, readBy: [...n.readBy, userId] } : n) }));
}
export function notificationsFor(s: SchoolState, role: Role, userId: string) {
  return s.notifications.filter((n) => (n.to === "all" || n.to === role) && (!n.toUserId || n.toUserId === userId));
}

/* Fees */
export function recordPayment(studentId: string, amount: number, method: string, transactionId?: string, receiptNo?: string) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("المبلغ غير صحيح");
  update((s) => {
    const newReceiptNo = receiptNo?.trim() || `RC-${new Date().getFullYear()}-${String(s.payments.length + 1).padStart(5, "0")}`;
    if (s.payments.some((p) => p.receiptNo === newReceiptNo)) throw new Error("رقم الإيصال مستخدم مسبقاً");
    return { ...s, payments: [{ id: uid("pay"), studentId, amount, method, transactionId, date: toISODate(new Date()), receiptNo: newReceiptNo }, ...s.payments] };
  });
}
export interface FeeImportRow {
  academicId: string; installmentTitle: string; amount: number; dueDate: string;
  paidAmount?: number | undefined; paymentDate?: string | undefined; receiptNo?: string | undefined;
}
export function importFees(rows: FeeImportRow[]) {
  let added = 0; let updated = 0; let ignored = 0;
  update((s) => {
    const installments = [...s.installments];
    const payments = [...s.payments];
    for (const row of rows) {
      const student = s.students.find((item) => item.academicId === row.academicId.trim());
      if (!student || !row.installmentTitle.trim() || !Number.isFinite(row.amount) || row.amount <= 0 || !row.dueDate) { ignored += 1; continue; }
      const receipt = row.receiptNo?.trim();
      if ((row.paidAmount ?? 0) > 0 && receipt && payments.some((item) => item.receiptNo === receipt)) {
        ignored += 1;
        continue;
      }
      const key = (x: Installment) => `${x.studentId}|${x.title.trim()}|${x.dueDate}`;
      const draft: Installment = { id: "", studentId: student.id, title: row.installmentTitle.trim(), amount: row.amount, dueDate: row.dueDate };
      const existingIndex = installments.findIndex((item) => key(item) === key(draft));
      if (existingIndex >= 0) { installments[existingIndex] = { ...installments[existingIndex]!, amount: draft.amount }; updated += 1; }
      else { installments.push({ ...draft, id: uid("in") }); added += 1; }
      if ((row.paidAmount ?? 0) > 0) {
        payments.push({ id: uid("pay"), studentId: student.id, amount: row.paidAmount!, date: row.paymentDate || toISODate(new Date()), method: "استيراد", receiptNo: receipt || `IMP-${Date.now()}-${payments.length}` });
      }
    }
    return { ...s, installments, payments };
  });
  return { added, updated, ignored };
}

/* Academic assessment and behaviour */
export function recordGrade(entry: Omit<GradeEntry, "id" | "recordedAt">) {
  update((s) => {
    const existing = s.gradesList.find((g) => g.studentId === entry.studentId && g.subject === entry.subject && g.term === entry.term && g.academicYear === entry.academicYear);
    const grade: GradeEntry = { ...entry, id: existing?.id ?? uid("gr"), recordedAt: new Date().toISOString() };
    return notify({ ...s, gradesList: existing ? s.gradesList.map((g) => g.id === existing.id ? grade : g) : [grade, ...s.gradesList] }, {
      title: "رصد نتيجة أكاديمية", body: `تم رصد درجة مادة ${entry.subject} (المجموع: ${entry.totalScore}٪)`, to: "student", toUserId: entry.studentId, link: "/app",
    });
  });
}
export function deleteGrade(id: string) { update((s) => ({ ...s, gradesList: s.gradesList.filter((g) => g.id !== id) })); }
export function addBehaviorRecord(record: Omit<BehaviorRecord, "id">) {
  update((s) => notify({ ...s, behaviorRecords: [{ ...record, id: uid("bh") }, ...s.behaviorRecords] }, { title: "ملاحظة تربوية", body: record.title, to: "student", toUserId: record.studentId, link: "/app" }));
}
export function deleteBehaviorRecord(id: string) { update((s) => ({ ...s, behaviorRecords: s.behaviorRecords.filter((b) => b.id !== id) })); }

/* Announcements, homework, attendance, calendar */
export function saveAnnouncement(item: Omit<Announcement, "id" | "date"> & { id?: string }) {
  update((s) => {
    if (item.id) return { ...s, announcements: s.announcements.map((a) => a.id === item.id ? { ...a, ...item, id: a.id } : a) };
    const announcement: Announcement = { ...item, id: uid("an"), date: new Date().toISOString() };
    return notify({ ...s, announcements: [announcement, ...s.announcements] }, { title: "إعلان جديد", body: item.title, to: "all", link: "/app/notices" });
  });
}
export function deleteAnnouncement(id: string) { update((s) => ({ ...s, announcements: s.announcements.filter((a) => a.id !== id) })); }
export function postHomework(item: Omit<Homework, "id" | "createdAt">) {
  update((s) => notify({ ...s, homework: [{ ...item, id: uid("hw"), createdAt: new Date().toISOString() }, ...s.homework] }, { title: "واجب أو مذكرة جديدة", body: item.title, to: "student", link: "/app/homework" }));
}
export function deleteHomework(id: string) { update((s) => ({ ...s, homework: s.homework.filter((h) => h.id !== id) })); }
export function toggleHomeworkDone(studentId: string, homeworkId: string) {
  const key = `${studentId}:${homeworkId}`;
  update((s) => ({ ...s, completedHomework: s.completedHomework.includes(key) ? s.completedHomework.filter((x) => x !== key) : [...s.completedHomework, key] }));
}
export function setAttendance(date: string, classId: string, entries: Record<string, AttendanceStatus>) {
  update((s) => ({ ...s, attendance: [...s.attendance.filter((r) => !(r.date === date && r.classId === classId)), ...Object.entries(entries).map(([studentId, status]) => ({ date, classId, studentId, status }))] }));
}
export function saveSlot(slot: Omit<Slot, "id"> & { id?: string }) {
  update((s) => {
    const existing = s.slots.find((x) => x.classId === slot.classId && x.day === slot.day && x.period === slot.period);
    const proposed: Slot = { ...slot, id: slot.id ?? existing?.id ?? uid("sl") };
    const remainder = s.slots.filter((x) => x.id !== proposed.id && !(x.classId === proposed.classId && x.day === proposed.day && x.period === proposed.period));
    const conflicts = detectTimetableConflicts([...remainder, proposed], s.teachers).filter((x) => x.severity === "error");
    if (conflicts.length) throw new Error(conflicts[0]!.message);
    return { ...s, slots: [...remainder, proposed] };
  });
}
export function deleteSlot(id: string) { update((s) => ({ ...s, slots: s.slots.filter((x) => x.id !== id) })); }

export function importSlots(rows: Array<Omit<Slot, "id">>, mode: "replace-class" | "merge" = "merge") {
  let added = 0;
  let updated = 0;
  update((s) => {
    const touchedClasses = new Set(rows.map((row) => row.classId));
    let slots = mode === "replace-class" ? s.slots.filter((slot) => !touchedClasses.has(slot.classId)) : [...s.slots];
    for (const row of rows) {
      const index = slots.findIndex((slot) => slot.classId === row.classId && slot.day === row.day && slot.period === row.period);
      if (index >= 0) {
        slots[index] = { ...row, id: slots[index]!.id };
        updated += 1;
      } else {
        slots.push({ ...row, id: uid("sl") });
        added += 1;
      }
    }
    const conflicts = detectTimetableConflicts(slots, s.teachers).filter((item) => item.severity === "error");
    if (conflicts.length) throw new Error(conflicts[0]!.message);
    return { ...s, slots };
  });
  return { added, updated, ignored: 0 };
}

export function copyClassTimetable(sourceClassId: string, targetClassId: string) {
  update((s) => {
    if (sourceClassId === targetClassId) throw new Error("اختر فصلين مختلفين");
    const source = s.slots.filter((slot) => slot.classId === sourceClassId);
    if (!source.length) throw new Error("الفصل المصدر لا يحتوي على جدول");
    const slots = [...s.slots.filter((slot) => slot.classId !== targetClassId), ...source.map((slot) => ({ ...slot, id: uid("sl"), classId: targetClassId }))];
    const conflicts = detectTimetableConflicts(slots, s.teachers).filter((item) => item.severity === "error");
    if (conflicts.length) throw new Error(conflicts[0]!.message);
    return { ...s, slots };
  });
}
export function addEvent(event: Omit<CalendarEvent, "id">) { update((s) => notify({ ...s, events: [...s.events, { ...event, id: uid("ev") }] }, { title: "حدث جديد في التقويم", body: event.title, to: "all", link: "/app/calendar" })); }
export function deleteEvent(id: string) { update((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) })); }

/* Student and teacher directory */
export function addStudent(student: Omit<Student, "id"> & { id?: string }) {
  update((s) => {
    if (s.students.some((x) => x.academicId.trim().toLowerCase() === student.academicId.trim().toLowerCase())) throw new Error("الرقم الأكاديمي مستخدم مسبقاً");
    const id = student.id ?? uid("s");
    const item: Student = { ...student, id, status: student.status ?? "active" };
    const amounts = [Math.round(item.totalFees * 0.4), Math.round(item.totalFees * 0.3)]; amounts.push(item.totalFees - amounts[0]! - amounts[1]!);
    const today = new Date();
    const installments = amounts.map((amount, index) => ({ id: uid("in"), studentId: id, title: `القسط ${index + 1}`, amount, dueDate: toISODate(new Date(today.getTime() + index * 45 * 86400000)) }));
    return { ...s, students: [item, ...s.students], installments: [...s.installments, ...installments] };
  });
}
export function updateStudent(id: string, patch: Partial<Omit<Student, "id">>) {
  update((s) => {
    const current = s.students.find((x) => x.id === id); if (!current) throw new Error("الطالب غير موجود");
    if (patch.academicId && s.students.some((x) => x.id !== id && x.academicId.toLowerCase() === patch.academicId!.trim().toLowerCase())) throw new Error("الرقم الأكاديمي مستخدم مسبقاً");
    return { ...s, students: s.students.map((x) => x.id === id ? { ...x, ...patch } : x) };
  });
}
export function archiveStudent(id: string) { updateStudent(id, { status: "archived" }); }
export function restoreStudent(id: string) { updateStudent(id, { status: "active" }); }
export type StudentImportRow = Omit<Student, "id" | "status">;
export function importStudents(rows: StudentImportRow[], mode: "new-only" | "update-existing" = "new-only") {
  let added = 0; let updated = 0; let ignored = 0;
  update((s) => {
    const students = s.students.map((student) => ({ ...student }));
    const installments = [...s.installments];
    for (const row of rows) {
      const existing = students.find((x) => x.academicId.toLowerCase() === row.academicId.toLowerCase());
      if (existing) {
        if (mode === "update-existing") { Object.assign(existing, row); updated += 1; } else ignored += 1;
      } else {
        const newStudent: Student = { ...row, id: uid("s"), status: "active" };
        students.push(newStudent);
        const parts = [Math.round(newStudent.totalFees * 0.4), Math.round(newStudent.totalFees * 0.3)];
        parts.push(newStudent.totalFees - parts[0]! - parts[1]!);
        const base = new Date();
        parts.forEach((amount, index) => installments.push({ id: uid("in"), studentId: newStudent.id, title: `القسط ${index + 1}`, amount, dueDate: toISODate(new Date(base.getTime() + index * 45 * 86400000)) }));
        added += 1;
      }
    }
    return { ...s, students, installments };
  });
  return { added, updated, ignored };
}
export function addTeacher(teacher: Omit<Teacher, "id"> & { id?: string }) {
  update((s) => {
    if (s.teachers.some((x) => x.employeeId.trim().toLowerCase() === teacher.employeeId.trim().toLowerCase())) throw new Error("الرقم الوظيفي مستخدم مسبقاً");
    const item: Teacher = { ...teacher, id: teacher.id ?? uid("t"), status: teacher.status ?? "active" };
    return { ...s, teachers: [item, ...s.teachers] };
  });
}
export function updateTeacher(id: string, patch: Partial<Omit<Teacher, "id">>) {
  update((s) => {
    if (!s.teachers.some((x) => x.id === id)) throw new Error("المعلم غير موجود");
    if (patch.employeeId && s.teachers.some((x) => x.id !== id && x.employeeId.toLowerCase() === patch.employeeId!.trim().toLowerCase())) throw new Error("الرقم الوظيفي مستخدم مسبقاً");
    return { ...s, teachers: s.teachers.map((x) => x.id === id ? { ...x, ...patch } : x) };
  });
}
export function archiveTeacher(id: string) { updateTeacher(id, { status: "archived" }); }
export function restoreTeacher(id: string) { updateTeacher(id, { status: "active" }); }
export type TeacherImportRow = Omit<Teacher, "id" | "status" | "classes" | "stageIds"> & { classes: string[]; stageIds: StageId[] };
export function importTeachers(rows: TeacherImportRow[]) {
  let added = 0; let updated = 0; let ignored = 0;
  update((s) => {
    const teachers = s.teachers.map((teacher) => ({ ...teacher, classes: [...(teacher.classes ?? [])], stageIds: [...(teacher.stageIds ?? [])] }));
    for (const row of rows) {
      const existing = teachers.find((x) => x.employeeId.toLowerCase() === row.employeeId.toLowerCase());
      if (existing) { Object.assign(existing, row); updated += 1; }
      else { teachers.push({ ...row, id: uid("t"), status: "active", classes: [...row.classes], stageIds: [...row.stageIds] }); added += 1; }
    }
    return { ...s, teachers };
  });
  return { added, updated, ignored };
}
export function assignTeacherClasses(teacherId: string, classIds: string[]) {
  update((s) => ({ ...s, teachers: s.teachers.map((t) => t.id === teacherId ? { ...t, classes: classIds } : t) }));
}
export function addClass(schoolClass: SchoolClass) { update((s) => ({ ...s, classes: [...s.classes, schoolClass] })); }

/* Selectors */
export function currentUser(s: SchoolState) {
  const session = s.session; if (!session) return null;
  if (session.role === "student") {
    const user = s.students.find((x) => x.id === session.userId);
    return user ? { role: "student" as const, id: user.id, name: user.name, student: user } : null;
  }
  if (session.role === "teacher") {
    const user = s.teachers.find((x) => x.id === session.userId);
    return user ? { role: "teacher" as const, id: user.id, name: user.name, teacher: user } : null;
  }
  const user = s.admins.find((x) => x.id === session.userId);
  return user ? { role: "admin" as const, id: user.id, name: user.name, admin: user } : null;
}
