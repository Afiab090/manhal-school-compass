import { useSyncExternalStore } from "react";

import { approveReceipt, toISODate, uid } from "./logic";
import { DEMO, SEED_VERSION, createSeed } from "./seed";
import type {
  AcademicSection,
  AcademicStage,
  AcademicYearConfig,
  Announcement,
  AppNotification,
  AttendanceStatus,
  BehaviorRecord,
  CalendarEvent,
  GradeEntry,
  GradeLevel,
  Homework,
  Parent,
  Receipt,
  ReceiptAuditStatus,
  Role,
  SchoolClass,
  SchoolState,
  Slot,
  Student,
  Teacher,
} from "./types";

/**
 * Local-first store. Everything lives in localStorage under one key so that
 * actions from one role (admin, teacher, student, parent) are visible to the others
 * immediately — and across browser tabs via the `storage` event.
 */
const KEY = "almanhal-school-state-v3";

let state: SchoolState | null = null;
let serverSnapshot: SchoolState | null = null;
const listeners = new Set<() => void>();

function load(): SchoolState {
  if (state) return state;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SchoolState;
      if (parsed.version === SEED_VERSION) {
        state = parsed;
        return state;
      }
    }
  } catch {
    // corrupted storage — fall through to a fresh seed
  }
  state = createSeed();
  persist();
  return state;
}

function persist() {
  if (!state) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("تعذر حفظ البيانات محلياً", e);
    throw new Error("مساحة التخزين ممتلئة — جرّب صورة أصغر حجماً");
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = null;
      load();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return load();
}

function getServerSnapshot() {
  if (!serverSnapshot) serverSnapshot = createSeed();
  return serverSnapshot;
}

export function useSchool(): SchoolState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function update(fn: (s: SchoolState) => SchoolState) {
  const prev = load();
  state = fn(prev);
  try {
    persist();
  } catch (e) {
    state = prev;
    throw e;
  }
  emit();
}

function notify(s: SchoolState, n: Omit<AppNotification, "id" | "date" | "readBy">): SchoolState {
  return {
    ...s,
    notifications: [{ ...n, id: uid("nt"), date: new Date().toISOString(), readBy: [] }, ...s.notifications],
  };
}

/* ---------------- Session & Authentication ---------------- */

export function login(role: Role, identifier: string, password: string): { ok: true } | { ok: false; error: string } {
  const s = load();
  const id = identifier.trim();
  if (password !== DEMO.password) return { ok: false, error: "كلمة المرور غير صحيحة" };
  let userId: string | undefined;
  if (role === "student") userId = s.students.find((x) => x.academicId.toLowerCase() === id.toLowerCase())?.id;
  if (role === "parent") userId = s.parents.find((x) => x.nationalId.toLowerCase() === id.toLowerCase() || x.phone === id)?.id;
  if (role === "teacher") userId = s.teachers.find((x) => x.employeeId.toLowerCase() === id.toLowerCase())?.id;
  if (role === "admin") userId = s.admins.find((x) => x.username.toLowerCase() === id.toLowerCase())?.id;
  if (!userId) return { ok: false, error: "لم يتم العثور على حساب بهذا الرقم" };
  update((st) => ({ ...st, session: { role, userId: userId! } }));
  return { ok: true };
}

export function demoLogin(role: Role) {
  const userId =
    role === "student"
      ? DEMO.student.id
      : role === "parent"
        ? DEMO.parent.id
        : role === "teacher"
          ? DEMO.teacher.id
          : DEMO.admin.id;
  update((st) => ({ ...st, session: { role, userId } }));
}

export function logout() {
  update((st) => ({ ...st, session: null }));
}

export function resetDemoData() {
  const session = load().session;
  state = { ...createSeed(), session };
  persist();
  emit();
}

export function setActiveChild(childId: string) {
  update((st) => {
    if (!st.session || st.session.role !== "parent") return st;
    return {
      ...st,
      session: {
        ...st.session,
        activeChildId: childId,
      },
    };
  });
}

/* ---------------- Notifications ---------------- */

export function markNotificationsRead(userId: string, ids: string[]) {
  update((s) => ({
    ...s,
    notifications: s.notifications.map((n) =>
      ids.includes(n.id) && !n.readBy.includes(userId) ? { ...n, readBy: [...n.readBy, userId] } : n,
    ),
  }));
}

/* ---------------- Fees & Receipts (Bankak / Cash) ---------------- */

export function submitReceipt(input: {
  studentId: string;
  reference: string;
  transactionId?: string;
  bankName?: string;
  senderAccount?: string;
  amount: number;
  image?: string;
  note?: string;
}) {
  update((s) => {
    const receipt: Receipt = {
      ...input,
      id: uid("rc"),
      status: "pending",
      auditStatus: "under_review",
      submittedAt: new Date().toISOString(),
    };
    const student = s.students.find((x) => x.id === input.studentId);
    return notify(
      { ...s, receipts: [receipt, ...s.receipts] },
      {
        title: "إشعار سداد بنكك جديد",
        body: `${student?.name ?? "طالب"} أرفق إشعار سداد (مرجع: ${input.reference}${input.transactionId ? ` - رقم العملية: ${input.transactionId}` : ""}) بانتظار التدقيق`,
        to: "admin",
        link: "/app/fees",
      },
    );
  });
}

export function updateReceiptAudit(
  receiptId: string,
  auditStatus: ReceiptAuditStatus,
  auditNotes?: string,
  auditedBy?: string,
) {
  update((s) => ({
    ...s,
    receipts: s.receipts.map((r) =>
      r.id === receiptId
        ? {
            ...r,
            auditStatus,
            auditNotes: auditNotes ?? r.auditNotes,
            auditedBy: auditedBy ?? r.auditedBy,
          }
        : r,
    ),
  }));
}

export function reviewReceipt(
  receiptId: string,
  decision: "approved" | "rejected",
  auditStatus?: ReceiptAuditStatus,
  auditNotes?: string,
) {
  update((s) => {
    const r = s.receipts.find((x) => x.id === receiptId);
    if (!r || r.status !== "pending") return s;
    const nowISO = new Date().toISOString();
    if (decision === "rejected") {
      return notify(
        {
          ...s,
          receipts: s.receipts.map((x) =>
            x.id === receiptId
              ? {
                  ...x,
                  status: "rejected",
                  auditStatus: auditStatus ?? "discrepancy",
                  auditNotes: auditNotes ?? x.auditNotes,
                  reviewedAt: nowISO,
                }
              : x,
          ),
        },
        {
          title: "تم رفض إشعار الدفع",
          body: `المرجع ${r.reference}${r.transactionId ? ` (رقم العملية: ${r.transactionId})` : ""} — يرجى مراجعة الشؤون المالية`,
          to: "student",
          toUserId: r.studentId,
          link: "/app/fees",
        },
      );
    }
    const receiptNo = `RC-${new Date().getFullYear()}-${String(1500 + s.payments.length)}`;
    const { receipt, payment } = approveReceipt(r, nowISO, receiptNo);
    const updatedReceipt: Receipt = {
      ...receipt,
      auditStatus: auditStatus ?? "verified_match",
      auditNotes: auditNotes ?? "تمت المطابقة والاعتماد بنجاح",
    };
    return notify(
      {
        ...s,
        receipts: s.receipts.map((x) => (x.id === receiptId ? updatedReceipt : x)),
        payments: [{ ...payment, transactionId: r.transactionId }, ...s.payments],
      },
      {
        title: "تم اعتماد إشعار السداد بنجاح",
        body: `تمت إضافة المبلغ إلى حسابك — إيصال رقم ${receiptNo}${r.transactionId ? ` (رقم العملية: ${r.transactionId})` : ""}`,
        to: "student",
        toUserId: r.studentId,
        link: "/app/fees",
      },
    );
  });
}

export function recordPayment(studentId: string, amount: number, method: string, transactionId?: string) {
  update((s) => ({
    ...s,
    payments: [
      {
        id: uid("pay"),
        studentId,
        amount,
        method,
        transactionId,
        date: toISODate(new Date()),
        receiptNo: `RC-${new Date().getFullYear()}-${String(1500 + s.payments.length)}`,
      },
      ...s.payments,
    ],
  }));
}

/* ---------------- Grades & Academic Assessment ---------------- */

export function recordGrade(entry: Omit<GradeEntry, "id" | "recordedAt">) {
  update((s) => {
    const existingIndex = s.gradesList.findIndex(
      (g) =>
        g.studentId === entry.studentId &&
        g.subject === entry.subject &&
        g.term === entry.term &&
        g.academicYear === entry.academicYear,
    );
    const nowISO = new Date().toISOString();
    const id = uid("gr");
    const newEntry: GradeEntry = { ...entry, id, recordedAt: nowISO };
    const updatedGrades =
      existingIndex >= 0
        ? s.gradesList.map((g, idx) => (idx === existingIndex ? { ...newEntry, id: g.id } : g))
        : [newEntry, ...s.gradesList];

    return notify(
      { ...s, gradesList: updatedGrades },
      {
        title: "رصد نتيجة أكاديمية",
        body: `تم رصد درجة مادة ${entry.subject} (المجموع: ${entry.totalScore}٪)`,
        to: "parent",
        toUserId: entry.studentId,
        link: "/app",
      },
    );
  });
}

export function deleteGrade(id: string) {
  update((s) => ({
    ...s,
    gradesList: s.gradesList.filter((g) => g.id !== id),
  }));
}

/* ---------------- Behavior & Conduct Records ---------------- */

export function addBehaviorRecord(record: Omit<BehaviorRecord, "id">) {
  update((s) => {
    const item: BehaviorRecord = { ...record, id: uid("bh") };
    return notify(
      { ...s, behaviorRecords: [item, ...s.behaviorRecords] },
      {
        title: record.type === "positive" ? "إشادة سلوكية وتربوية" : "ملاحظة تربوية وانضباطية",
        body: record.title,
        to: "parent",
        toUserId: record.studentId,
        link: "/app",
      },
    );
  });
}

export function deleteBehaviorRecord(id: string) {
  update((s) => ({
    ...s,
    behaviorRecords: s.behaviorRecords.filter((b) => b.id !== id),
  }));
}

/* ---------------- Announcements ---------------- */

export function saveAnnouncement(a: Omit<Announcement, "id" | "date"> & { id?: string }) {
  update((s) => {
    if (a.id) {
      return { ...s, announcements: s.announcements.map((x) => (x.id === a.id ? { ...x, ...a, id: x.id } : x)) };
    }
    const item: Announcement = { ...a, id: uid("an"), date: new Date().toISOString() };
    return notify(
      { ...s, announcements: [item, ...s.announcements] },
      { title: a.category === "rules" ? "تحديث في اللوائح المدرسية" : "إعلان جديد", body: a.title, to: "all", link: "/app/notices" },
    );
  });
}

export function deleteAnnouncement(id: string) {
  update((s) => ({ ...s, announcements: s.announcements.filter((x) => x.id !== id) }));
}

/* ---------------- Homework ---------------- */

export function postHomework(h: Omit<Homework, "id" | "createdAt">) {
  update((s) => {
    const item: Homework = { ...h, id: uid("hw"), createdAt: new Date().toISOString() };
    return notify(
      { ...s, homework: [item, ...s.homework] },
      { title: h.kind === "notes" ? `مذكرة جديدة: ${h.subject}` : `واجب جديد: ${h.subject}`, body: h.title, to: "student", link: "/app/homework" },
    );
  });
}

export function deleteHomework(id: string) {
  update((s) => ({ ...s, homework: s.homework.filter((x) => x.id !== id) }));
}

export function toggleHomeworkDone(studentId: string, homeworkId: string) {
  const key = `${studentId}:${homeworkId}`;
  update((s) => ({
    ...s,
    completedHomework: s.completedHomework.includes(key)
      ? s.completedHomework.filter((k) => k !== key)
      : [...s.completedHomework, key],
  }));
}

/* ---------------- Attendance ---------------- */

export function setAttendance(date: string, classId: string, entries: Record<string, AttendanceStatus>) {
  update((s) => {
    const rest = s.attendance.filter((r) => !(r.date === date && r.classId === classId));
    const added = Object.entries(entries).map(([studentId, status]) => ({ date, classId, studentId, status }));
    let next: SchoolState = { ...s, attendance: [...rest, ...added] };
    for (const [studentId, status] of Object.entries(entries)) {
      if (status === "absent") {
        next = notify(next, { title: "تنبيه غياب", body: `تم تسجيل غياب بتاريخ ${date}`, to: "student", toUserId: studentId, link: "/app/attendance" });
      }
    }
    return next;
  });
}

/* ---------------- Timetable ---------------- */

export function saveSlot(slot: Omit<Slot, "id"> & { id?: string }) {
  update((s) => {
    const existing = s.slots.find((x) => x.classId === slot.classId && x.day === slot.day && x.period === slot.period);
    if (existing) {
      return { ...s, slots: s.slots.map((x) => (x.id === existing.id ? { ...slot, id: existing.id } : x)) };
    }
    return { ...s, slots: [...s.slots, { ...slot, id: uid("sl") }] };
  });
}

export function deleteSlot(id: string) {
  update((s) => ({ ...s, slots: s.slots.filter((x) => x.id !== id) }));
}

/* ---------------- Calendar ---------------- */

export function addEvent(e: Omit<CalendarEvent, "id">) {
  update((s) =>
    notify(
      { ...s, events: [...s.events, { ...e, id: uid("ev") }] },
      { title: e.type === "exam" ? "موعد امتحان جديد" : "حدث جديد في التقويم", body: e.title, to: "all", link: "/app/calendar" },
    ),
  );
}

export function deleteEvent(id: string) {
  update((s) => ({ ...s, events: s.events.filter((x) => x.id !== id) }));
}

/* ---------------- Directory, Parents & School Management ---------------- */

export function addStudent(student: Omit<Student, "id"> & { id?: string }) {
  update((s) => {
    const id = student.id ?? uid("s");
    const newStudent: Student = { ...student, id };
    const a1 = Math.round(newStudent.totalFees * 0.4);
    const a2 = Math.round(newStudent.totalFees * 0.3);
    const a3 = newStudent.totalFees - a1 - a2;
    const now = new Date();
    const nowISO = toISODate(now);
    const inst1 = { id: uid("in"), studentId: id, title: "القسط الأول (التسجيل)", amount: a1, dueDate: nowISO };
    const inst2 = { id: uid("in"), studentId: id, title: "القسط الثاني (منتصف العام)", amount: a2, dueDate: toISODate(new Date(now.getTime() + 45 * 86400000)) };
    const inst3 = { id: uid("in"), studentId: id, title: "القسط الثالث (الختامي)", amount: a3, dueDate: toISODate(new Date(now.getTime() + 90 * 86400000)) };
    return {
      ...s,
      students: [newStudent, ...s.students],
      installments: [...s.installments, inst1, inst2, inst3],
    };
  });
}

export function addParent(parent: Omit<Parent, "id"> & { id?: string }) {
  update((s) => {
    const id = parent.id ?? uid("p");
    return {
      ...s,
      parents: [{ ...parent, id }, ...s.parents],
    };
  });
}

export function linkChildToParent(parentId: string, studentId: string) {
  update((s) => ({
    ...s,
    parents: s.parents.map((p) =>
      p.id === parentId && !p.studentIds.includes(studentId)
        ? { ...p, studentIds: [...p.studentIds, studentId] }
        : p,
    ),
    students: s.students.map((st) => (st.id === studentId ? { ...st, parentId } : st)),
  }));
}

export function addTeacher(teacher: Omit<Teacher, "id"> & { id?: string }) {
  update((s) => {
    const id = teacher.id ?? uid("t");
    const newTeacher: Teacher = { ...teacher, id };
    return {
      ...s,
      teachers: [newTeacher, ...s.teachers],
    };
  });
}

export function assignTeacherClasses(teacherId: string, classIds: string[]) {
  update((s) => ({
    ...s,
    teachers: s.teachers.map((t) => (t.id === teacherId ? { ...t, classes: classIds } : t)),
  }));
}

export function addClass(schoolClass: SchoolClass) {
  update((s) => ({
    ...s,
    classes: [...s.classes, schoolClass],
  }));
}

export function forceResetDefaultData() {
  state = createSeed();
  state.session = { role: "admin", userId: DEMO.admin.id };
  persist();
  emit();
}

/* ---------------- Selectors ---------------- */

export function currentUser(s: SchoolState) {
  const sess = s.session;
  if (!sess) return null;
  if (sess.role === "student") {
    const u = s.students.find((x) => x.id === sess.userId);
    return u ? { role: "student" as const, id: u.id, name: u.name, student: u } : null;
  }
  if (sess.role === "parent") {
    const u = s.parents.find((x) => x.id === sess.userId);
    if (!u) return null;
    const children = s.students.filter((st) => u.studentIds.includes(st.id));
    const activeChild = children.find((c) => c.id === sess.activeChildId) ?? children[0] ?? null;
    return { role: "parent" as const, id: u.id, name: u.name, parent: u, children, activeChild };
  }
  if (sess.role === "teacher") {
    const u = s.teachers.find((x) => x.id === sess.userId);
    return u ? { role: "teacher" as const, id: u.id, name: u.name, teacher: u } : null;
  }
  const u = s.admins.find((x) => x.id === sess.userId);
  return u ? { role: "admin" as const, id: u.id, name: u.name, admin: u } : null;
}

export function notificationsFor(s: SchoolState, role: Role, userId: string) {
  return s.notifications.filter((n) => (n.to === "all" || n.to === role) && (!n.toUserId || n.toUserId === userId));
}
