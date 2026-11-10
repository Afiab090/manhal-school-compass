import { toISODate } from "./logic";
import type {
  AcademicSection, AcademicStage, AcademicYearConfig, Admin, Announcement,
  AttendanceRecord, BehaviorRecord, CalendarEvent, GradeEntry, GradeLevel,
  Homework, Installment, Payment, SchoolClass, SchoolState, Slot, StageId,
  Student, Teacher,
} from "./types";

export const SEED_VERSION = 8;
export const DEMO_MODE = true;
export const DEMO = {
  student: { academicId: "MNH-2026-0001", id: "s-001" },
  teacher: { employeeId: "T-101", id: "t-pri-1" },
  admin: { username: "admin", id: "a-admin" },
  password: "123456",
};

export const academicStages: AcademicStage[] = [
  { id: "stg-pri", name: "مرحلة الأساس", code: "primary", order: 1 },
  { id: "stg-mid", name: "المرحلة المتوسطة", code: "middle", order: 2 },
  { id: "stg-sec", name: "المرحلة الثانوية", code: "secondary", order: 3 },
];

export const academicSections: AcademicSection[] = [
  { id: "sec-pri-b", stageId: "stg-pri", name: "بنين - الأساس", type: "boys" },
  { id: "sec-pri-g", stageId: "stg-pri", name: "بنات - الأساس", type: "girls" },
  { id: "sec-mid-b", stageId: "stg-mid", name: "بنين - المتوسط", type: "boys" },
  { id: "sec-mid-g", stageId: "stg-mid", name: "بنات - المتوسط", type: "girls" },
  { id: "sec-sec-b", stageId: "stg-sec", name: "بنين - الثانوي", type: "boys" },
  { id: "sec-sec-g", stageId: "stg-sec", name: "بنات - الثانوي", type: "girls" },
];

export const gradeLevels: GradeLevel[] = [
  ...Array.from({ length: 6 }, (_, i) => ({ id: `grd-p${i + 1}`, stageId: "stg-pri" as const, name: `الصف ${["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"][i]} أساس`, levelNumber: i + 1 })),
  ...Array.from({ length: 3 }, (_, i) => ({ id: `grd-m${i + 1}`, stageId: "stg-mid" as const, name: `الصف ${["الأول", "الثاني", "الثالث"][i]} متوسط`, levelNumber: i + 1 })),
  ...Array.from({ length: 3 }, (_, i) => ({ id: `grd-s${i + 1}`, stageId: "stg-sec" as const, name: `الصف ${["الأول", "الثاني", "الثالث"][i]} ثانوي`, levelNumber: i + 1 })),
];

export const academicYears: AcademicYearConfig[] = [{
  id: "ay-2026-2027", year: "2026-2027", name: "العام الدراسي ٢٠٢٦ - ٢٠٢٧", currentTerm: "term_1", isCurrent: true,
  terms: [
    { term: "term_1", name: "الفصل الدراسي الأول", startDate: "2026-09-01", endDate: "2027-01-15" },
    { term: "term_2", name: "الفصل الدراسي الثاني", startDate: "2027-02-01", endDate: "2027-06-15" },
  ],
}];

const classSpecs: { id: string; name: string; short: string; stageId: StageId; sectionId: string; grade: string; capacity: number }[] = [
  { id: "p1b", name: "الصف الأول أساس - بنين", short: "١ أساس بنين", stageId: "stg-pri", sectionId: "sec-pri-b", grade: "grd-p1", capacity: 30 },
  { id: "p2b", name: "الصف الثاني أساس - بنين", short: "٢ أساس بنين", stageId: "stg-pri", sectionId: "sec-pri-b", grade: "grd-p2", capacity: 30 },
  { id: "p3b", name: "الصف الثالث أساس - بنين", short: "٣ أساس بنين", stageId: "stg-pri", sectionId: "sec-pri-b", grade: "grd-p3", capacity: 30 },
  { id: "p4g", name: "الصف الرابع أساس - بنات", short: "٤ أساس بنات", stageId: "stg-pri", sectionId: "sec-pri-g", grade: "grd-p4", capacity: 30 },
  { id: "p5g", name: "الصف الخامس أساس - بنات", short: "٥ أساس بنات", stageId: "stg-pri", sectionId: "sec-pri-g", grade: "grd-p5", capacity: 30 },
  { id: "p6g", name: "الصف السادس أساس - بنات", short: "٦ أساس بنات", stageId: "stg-pri", sectionId: "sec-pri-g", grade: "grd-p6", capacity: 30 },
  { id: "m1b", name: "الصف الأول المتوسط - بنين", short: "١ متوسط بنين", stageId: "stg-mid", sectionId: "sec-mid-b", grade: "grd-m1", capacity: 32 },
  { id: "m2b", name: "الصف الثاني المتوسط - بنين", short: "٢ متوسط بنين", stageId: "stg-mid", sectionId: "sec-mid-b", grade: "grd-m2", capacity: 32 },
  { id: "m3g", name: "الصف الثالث المتوسط - بنات", short: "٣ متوسط بنات", stageId: "stg-mid", sectionId: "sec-mid-g", grade: "grd-m3", capacity: 32 },
  { id: "s1b", name: "الصف الأول الثانوي - بنين", short: "١ ثانوي بنين", stageId: "stg-sec", sectionId: "sec-sec-b", grade: "grd-s1", capacity: 35 },
  { id: "s2b", name: "الصف الثاني الثانوي - بنين", short: "٢ ثانوي بنين", stageId: "stg-sec", sectionId: "sec-sec-b", grade: "grd-s2", capacity: 35 },
  { id: "s3b", name: "الصف الثالث الثانوي - بنين", short: "٣ ثانوي بنين", stageId: "stg-sec", sectionId: "sec-sec-b", grade: "grd-s3", capacity: 35 },
  { id: "s1g", name: "الصف الأول الثانوي - بنات", short: "١ ثانوي بنات", stageId: "stg-sec", sectionId: "sec-sec-g", grade: "grd-s1", capacity: 35 },
  { id: "s2g", name: "الصف الثاني الثانوي - بنات", short: "٢ ثانوي بنات", stageId: "stg-sec", sectionId: "sec-sec-g", grade: "grd-s2", capacity: 35 },
  { id: "s3g", name: "الصف الثالث الثانوي - بنات", short: "٣ ثانوي بنات", stageId: "stg-sec", sectionId: "sec-sec-g", grade: "grd-s3", capacity: 35 },
];

export const classes: SchoolClass[] = classSpecs.map((c) => ({
  id: c.id, name: c.name, short: c.short, stage: academicStages.find((s) => s.id === c.stageId)!.name,
  stageId: c.stageId, sectionId: c.sectionId, gradeLevelId: c.grade, academicYear: "2026-2027", capacity: c.capacity,
}));

const teacherNames: Record<StageId, string[]> = {
  "stg-pri": ["أ. فاطمة الزين إبراهيم", "أ. عائشة محمد الأمين", "أ. الطيب أحمد الفكي", "أ. هالة يوسف الصادق", "أ. عثمان النور علي", "أ. منى صالح كباشي", "أ. خالد بشير النعيم"],
  "stg-mid": ["أ. محمد عثمان علي", "أ. سارة إبراهيم خليل", "أ. عبدالرحيم حسن بشير", "أ. ليلى ميرغني طه", "أ. عمر فاروق صديق", "أ. سمية عبدالقادر", "أ. عادل عبدالسلام"],
  "stg-sec": ["أ. أحمد محجوب السر", "أ. هدى إبراهيم خليل", "أ. مصطفى حسن بشير", "أ. آمنة الطيب يوسف", "أ. ياسر محمد الأمين", "أ. سلوى عبدالوهاب", "أ. خالد النور أحمد"],
};
const subjects = ["اللغة العربية", "الرياضيات", "اللغة الإنجليزية", "العلوم", "التربية الإسلامية", "الدراسات الاجتماعية", "الحاسوب"];
export const teachers: Teacher[] = (Object.entries(teacherNames) as [StageId, string[]][]).flatMap(([stageId, names], stageIndex) =>
  names.map((name, i) => ({
    id: `t-${stageId.slice(-3)}-${i + 1}`, name, employeeId: `T-${101 + stageIndex * 10 + i}`,
    subject: subjects[i]!, phone: `09${12 + (i % 3)} 345 ${String(101 + stageIndex * 10 + i)}`,
    classes: [], stageIds: [stageId], status: "active" as const,
  })),
);

export const admins: Admin[] = [
  { id: "a-admin", name: "أحمد عبدالسلام", username: "admin", title: "مدير" },
  { id: "a-accountant", name: "منى عثمان", username: "accountant", title: "حسابات" },
  { id: "a-registrar", name: "خالد الطيب", username: "registrar", title: "تسجيل" },
];

const firstNames = ["أحمد", "محمد", "مريم", "آمنة", "يوسف", "فاطمة", "عبدالله", "سارة", "مصعب", "تسنيم", "عمر", "رُبى", "مصطفى", "إسراء", "معاذ", "سجى", "طه", "ملاذ", "ياسين", "هبة"];
const familyNames = ["محمد", "عثمان", "إبراهيم", "عبدالله", "الطيب", "أحمد", "حسن", "النعيم", "بشير", "بابكر", "ميرغني", "الصادق", "السر", "الجزولي", "الفكي"];
const parentNames = ["محمد عبدالله أحمد", "عثمان إبراهيم داؤود", "الطيب حسن عمر", "خالد بابكر عبدالمجيد", "أمين الفضل إدريس", "وائل إبراهيم حمد", "طارق عبدالمحمود", "هشام عباس أحمد"];
const rawStudents: Student[] = classSpecs.flatMap((spec, classIndex) => Array.from({ length: 10 }, (_, i) => {
  const n = classIndex * 10 + i;
  const fullName = `${firstNames[(n * 3) % firstNames.length]} ${familyNames[(n * 5 + 1) % familyNames.length]} ${familyNames[(n * 7 + 4) % familyNames.length]}`;
  const gender = spec.sectionId.endsWith("g") ? "female" : "male";
  return {
    id: `s-${String(n + 1).padStart(3, "0")}`, name: fullName,
    academicId: `MNH-2026-${String(n + 1).padStart(4, "0")}`, classId: spec.id,
    parentName: parentNames[n % parentNames.length]!, parentPhone: `09${12 + (n % 5)} ${String(200 + n).padStart(3, "0")} ${String(300 + n).padStart(3, "0")}`,
    totalFees: 900000 + (classIndex % 3) * 50000, status: "active" as const, gender,
    dateOfBirth: `201${2 + (i % 5)}-${String((i % 12) + 1).padStart(2, "0")}-15`, enrollmentDate: "2026-09-01",
  };
}));
// Keep the demo credential stable while ensuring every academic ID is unique.

function dateOffset(days: number, base: Date): string {
  const d = new Date(base); d.setDate(d.getDate() + days); return toISODate(d);
}

function buildSlots(): Slot[] {
  const rows: Slot[] = [];
  const teachersByStage = new Map<StageId, Teacher[]>();
  for (const stage of academicStages) teachersByStage.set(stage.id, teachers.filter((t) => t.stageIds?.includes(stage.id)));
  classSpecs.forEach((spec, classIndex) => {
    const stageTeachers = teachersByStage.get(spec.stageId)!;
    for (let day = 0; day < 5; day++) {
      for (let period = 1; period <= 7; period++) {
        // Distinct teacher rotation inside each stage guarantees no same-period collisions.
        const teacher = stageTeachers[(classIndex + day * 2 + period - 1) % stageTeachers.length]!;
        rows.push({
          id: `sl-${spec.id}-${day}-${period}`, classId: spec.id, day, period,
          subject: teacher.subject, teacherId: teacher.id, room: `قاعة ${spec.short} - ${period}`,
        });
        if (!teacher.classes?.includes(spec.id)) teacher.classes = [...(teacher.classes ?? []), spec.id];
      }
    }
  });
  return rows;
}

export function createSeed(now: Date = new Date()): SchoolState {
  const students = rawStudents.map((student) => ({ ...student }));
  const installments: Installment[] = [];
  const payments: Payment[] = [];
  students.forEach((student, i) => {
    const amounts = [Math.round(student.totalFees * 0.4), Math.round(student.totalFees * 0.3)];
    amounts.push(student.totalFees - amounts[0]! - amounts[1]!);
    const dueDates = [dateOffset(-70, now), dateOffset(-5, now), dateOffset(55, now)];
    amounts.forEach((amount, idx) => installments.push({ id: `in-${student.id}-${idx + 1}`, studentId: student.id, title: `القسط ${idx + 1}`, amount, dueDate: dueDates[idx]! }));
    const profile = i % 3;
    const paymentAmount = profile === 0 ? student.totalFees : profile === 1 ? Math.round(amounts[0]! * 0.65) : 0;
    if (paymentAmount > 0) payments.push({ id: `pay-${student.id}`, studentId: student.id, amount: paymentAmount, date: dateOffset(-10, now), method: profile === 0 ? "نقداً" : "تحويل مصرفي", receiptNo: `RC-2026-${String(i + 1).padStart(5, "0")}` });
  });

  const slots = buildSlots();
  const attendance: AttendanceRecord[] = students.slice(0, 40).map((student, i) => ({ date: dateOffset(-1, now), classId: student.classId, studentId: student.id, status: i % 11 === 0 ? "absent" : i % 7 === 0 ? "late" : "present" }));
  const announcements: Announcement[] = [
    { id: "an-1", title: "انطلاق الفصل الدراسي الأول", body: "ترحب إدارة المدرسة بالطلاب والطالبات مع بداية عام دراسي جديد، ونتمنى للجميع عاماً حافلاً بالإنجاز.", category: "general", date: now.toISOString(), author: "إدارة المدرسة", audience: "all" },
    { id: "an-2", title: "جدول الاختبارات القصيرة", body: "يرجى مراجعة التقويم المدرسي للاطلاع على مواعيد الاختبارات القصيرة لكل مرحلة.", category: "activities", date: dateOffset(-2, now), author: "الشؤون الأكاديمية", audience: "all" },
    { id: "an-3", title: "تذكير بسداد الأقساط", body: "يمكن مراجعة كشف الرسوم لدى الإدارة المالية لمعرفة المبالغ المستحقة ومواعيد السداد.", category: "rules", date: dateOffset(-4, now), author: "الحسابات", audience: "all" },
  ];
  const events: CalendarEvent[] = [
    { id: "ev-1", title: "اختبار الرياضيات القصير", date: dateOffset(5, now), type: "exam", classId: "all", subject: "الرياضيات" },
    { id: "ev-2", title: "اجتماع أولياء الأمور", date: dateOffset(12, now), type: "event", classId: "all" },
  ];
  const homework: Homework[] = students.slice(0, 12).map((st, i) => ({ id: `hw-${i + 1}`, classId: st.classId, subject: "اللغة العربية", title: "تدريبات القراءة والفهم", description: "حل التدريبات المحددة في الدفتر.", dueDate: dateOffset(3, now), teacherId: teachers[i % teachers.length]!.id, kind: "homework", createdAt: now.toISOString() }));
  const gradesList: GradeEntry[] = [];
  const behaviorRecords: BehaviorRecord[] = [];
  return {
    version: SEED_VERSION, academicYears, currentAcademicYear: "2026-2027", currentTerm: "term_1",
    stages: academicStages, sections: academicSections, grades: gradeLevels, classes, students, teachers, admins,
    gradesList, behaviorRecords, installments, payments, announcements, slots, homework,
    completedHomework: [], attendance, events,
    notifications: [
      { id: "nt-1", title: "إعلان مدرسي جديد", body: "تم نشر إعلان جديد من إدارة المدرسة.", date: now.toISOString(), to: "all", link: "/app/notices", readBy: [] },
    ],
    session: null,
  };
}
