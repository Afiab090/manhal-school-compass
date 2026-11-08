import { toISODate } from "./logic";
import type {
  AcademicSection,
  AcademicStage,
  AcademicYearConfig,
  Announcement,
  AttendanceRecord,
  AttendanceStatus,
  BehaviorRecord,
  CalendarEvent,
  GradeEntry,
  GradeLevel,
  Homework,
  Installment,
  Parent,
  Payment,
  Receipt,
  SchoolClass,
  SchoolState,
  Slot,
  Student,
  Teacher,
} from "./types";

export const SEED_VERSION = 3;

export const DEMO = {
  student: { academicId: "MNH-2026-0314", id: "s1" },
  parent: { nationalId: "PRN-2026-0777", id: "p1", phone: "0912 777 314" },
  teacher: { employeeId: "T-101", id: "t1" },
  admin: { username: "admin", id: "a1" },
  password: "123456",
};

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function isSchoolDay(d: Date) {
  return d.getDay() <= 4;
}

/** Most recent school day on or before `d`. */
export function lastSchoolDay(d: Date): Date {
  let cur = new Date(d);
  while (!isSchoolDay(cur)) cur = addDays(cur, -1);
  return cur;
}

/* ---------------- Dynamic Academic Stages & Structure ---------------- */

export const academicStages: AcademicStage[] = [
  { id: "stg-pri", name: "المرحلة الابتدائية (الأساس)", code: "primary", order: 1 },
  { id: "stg-mid", name: "المرحلة المتوسطة", code: "middle", order: 2 },
  { id: "stg-sec", name: "المرحلة الثانوية", code: "secondary", order: 3 },
];

export const academicSections: AcademicSection[] = [
  { id: "sec-pri-b", stageId: "stg-pri", name: "بنين - الابتدائي", type: "boys" },
  { id: "sec-pri-g", stageId: "stg-pri", name: "بنات - الابتدائي", type: "girls" },
  { id: "sec-mid-b", stageId: "stg-mid", name: "بنين - المتوسط", type: "boys" },
  { id: "sec-mid-g", stageId: "stg-mid", name: "بنات - المتوسط", type: "girls" },
  { id: "sec-sec-b", stageId: "stg-sec", name: "بنين - الثانوي", type: "boys" },
  { id: "sec-sec-g", stageId: "stg-sec", name: "بنات - الثانوي", type: "girls" },
];

export const gradeLevels: GradeLevel[] = [
  // ابتدائي
  { id: "grd-p1", stageId: "stg-pri", name: "الصف الأول الابتدائي", levelNumber: 1 },
  { id: "grd-p2", stageId: "stg-pri", name: "الصف الثاني الابتدائي", levelNumber: 2 },
  { id: "grd-p3", stageId: "stg-pri", name: "الصف الثالث الابتدائي", levelNumber: 3 },
  { id: "grd-p4", stageId: "stg-pri", name: "الصف الرابع الابتدائي", levelNumber: 4 },
  { id: "grd-p5", stageId: "stg-pri", name: "الصف الخامس الابتدائي", levelNumber: 5 },
  { id: "grd-p6", stageId: "stg-pri", name: "الصف السادس الابتدائي", levelNumber: 6 },
  // متوسط
  { id: "grd-m1", stageId: "stg-mid", name: "الصف الأول المتوسط", levelNumber: 1 },
  { id: "grd-m2", stageId: "stg-mid", name: "الصف الثاني المتوسط", levelNumber: 2 },
  { id: "grd-m3", stageId: "stg-mid", name: "الصف الثالث المتوسط", levelNumber: 3 },
  // ثانوي
  { id: "grd-s1", stageId: "stg-sec", name: "الصف الأول الثانوي", levelNumber: 1 },
  { id: "grd-s2", stageId: "stg-sec", name: "الصف الثاني الثانوي", levelNumber: 2 },
  { id: "grd-s3", stageId: "stg-sec", name: "الصف الثالث الثانوي", levelNumber: 3 },
];

export const academicYears: AcademicYearConfig[] = [
  {
    id: "ay-2025-2026",
    year: "2025-2026",
    name: "العام الدراسي ٢٠٢٥ - ٢٠٢٦",
    currentTerm: "term_1",
    isCurrent: true,
    terms: [
      { term: "term_1", name: "الفصل الدراسي الأول", startDate: "2025-09-01", endDate: "2026-01-15" },
      { term: "term_2", name: "الفصل الدراسي الثاني", startDate: "2026-02-01", endDate: "2026-06-15" },
    ],
  },
];

export const classes: SchoolClass[] = [
  // المرحلة الثانوية
  { id: "c1a", name: "الصف الأول الثانوي - فصل (أ)", short: "١ أ ثانوي", stage: "المرحلة الثانوية", stageId: "stg-sec", sectionId: "sec-sec-b", gradeLevelId: "grd-s1", academicYear: "2025-2026", capacity: 35 },
  { id: "c1b", name: "الصف الأول الثانوي - فصل (ب)", short: "١ ب ثانوي", stage: "المرحلة الثانوية", stageId: "stg-sec", sectionId: "sec-sec-b", gradeLevelId: "grd-s1", academicYear: "2025-2026", capacity: 35 },
  { id: "c2a", name: "الصف الثاني الثانوي - فصل (أ)", short: "٢ أ ثانوي", stage: "المرحلة الثانوية", stageId: "stg-sec", sectionId: "sec-sec-b", gradeLevelId: "grd-s2", academicYear: "2025-2026", capacity: 32 },
  { id: "c2b", name: "الصف الثاني الثانوي - فصل (ب)", short: "٢ ب ثانوي", stage: "المرحلة الثانوية", stageId: "stg-sec", sectionId: "sec-sec-b", gradeLevelId: "grd-s2", academicYear: "2025-2026", capacity: 32 },
  { id: "c3a", name: "الصف الثالث الثانوي - علمي", short: "٣ علمي", stage: "المرحلة الثانوية", stageId: "stg-sec", sectionId: "sec-sec-b", gradeLevelId: "grd-s3", academicYear: "2025-2026", capacity: 30 },
  { id: "c3b", name: "الصف الثالث الثانوي - أدبي", short: "٣ أدبي", stage: "المرحلة الثانوية", stageId: "stg-sec", sectionId: "sec-sec-b", gradeLevelId: "grd-s3", academicYear: "2025-2026", capacity: 30 },
  // المرحلة المتوسطة
  { id: "cm1", name: "الصف الأول المتوسط - بنين", short: "١ متوسط", stage: "المرحلة المتوسطة", stageId: "stg-mid", sectionId: "sec-mid-b", gradeLevelId: "grd-m1", academicYear: "2025-2026", capacity: 30 },
  { id: "cm2", name: "الصف الثاني المتوسط - بنين", short: "٢ متوسط", stage: "المرحلة المتوسطة", stageId: "stg-mid", sectionId: "sec-mid-b", gradeLevelId: "grd-m2", academicYear: "2025-2026", capacity: 30 },
  { id: "cm3", name: "الصف الثالث المتوسط - بنين", short: "٣ متوسط", stage: "المرحلة المتوسطة", stageId: "stg-mid", sectionId: "sec-mid-b", gradeLevelId: "grd-m3", academicYear: "2025-2026", capacity: 30 },
  // المرحلة الابتدائية
  { id: "cp3", name: "الصف الثالث الابتدائي (الأساس)", short: "٣ ابتدائي", stage: "المرحلة الابتدائية (الأساس)", stageId: "stg-pri", sectionId: "sec-pri-b", gradeLevelId: "grd-p3", academicYear: "2025-2026", capacity: 28 },
  { id: "cp6", name: "الصف السادس الابتدائي (الأساس)", short: "٦ ابتدائي", stage: "المرحلة الابتدائية (الأساس)", stageId: "stg-pri", sectionId: "sec-pri-b", gradeLevelId: "grd-p6", academicYear: "2025-2026", capacity: 28 },
];

export const teachers: Teacher[] = [
  { id: "t1", name: "أ. فاطمة الزين إبراهيم", employeeId: "T-101", subject: "الرياضيات", phone: "0912 345 101", classes: ["c3a", "c2a", "c1a", "cm3"], stageIds: ["stg-sec", "stg-mid"] },
  { id: "t2", name: "أ. محمد عثمان علي", employeeId: "T-102", subject: "الفيزياء", phone: "0912 345 102", classes: ["c3a", "c2a"], stageIds: ["stg-sec"] },
  { id: "t3", name: "أ. سارة إبراهيم خليل", employeeId: "T-103", subject: "الكيمياء", phone: "0912 345 103", classes: ["c3a", "c2a"], stageIds: ["stg-sec"] },
  { id: "t4", name: "أ. عبدالرحيم حسن بشير", employeeId: "T-104", subject: "اللغة العربية", phone: "0912 345 104", classes: ["c3a", "c3b", "c2a", "c2b", "c1a", "c1b", "cm2"], stageIds: ["stg-sec", "stg-mid"] },
  { id: "t5", name: "أ. هالة يوسف الصادق", employeeId: "T-105", subject: "اللغة الإنجليزية", phone: "0912 345 105", classes: ["c3a", "c3b", "c2a", "c2b", "c1a", "c1b", "cm3"], stageIds: ["stg-sec", "stg-mid"] },
  { id: "t6", name: "أ. الطيب أحمد الفكي", employeeId: "T-106", subject: "التربية الإسلامية", phone: "0912 345 106", classes: ["c3a", "c3b", "c2a", "c2b", "c1a", "c1b", "cp6"], stageIds: ["stg-sec", "stg-pri"] },
  { id: "t7", name: "أ. منى صالح كباشي", employeeId: "T-107", subject: "الأحياء والعلوم", phone: "0912 345 107", classes: ["c3a", "c2a", "cm2", "cp6"], stageIds: ["stg-sec", "stg-mid", "stg-pri"] },
  { id: "t8", name: "أ. خالد بشير النعيم", employeeId: "T-108", subject: "علوم الحاسوب وتكنولوجيا المعلومات", phone: "0912 345 108", classes: ["c1a", "c1b", "c2a", "c2b", "cm1", "cm2", "cm3"], stageIds: ["stg-sec", "stg-mid"] },
  { id: "t9", name: "أ. عادل عبدالسلام بابكر", employeeId: "T-109", subject: "التاريخ والدراسات الاجتماعية", phone: "0912 345 109", classes: ["c3b", "c2b", "c1a", "c1b", "cm1"], stageIds: ["stg-sec", "stg-mid"] },
  { id: "t10", name: "أ. ليلى ميرغني طه", employeeId: "T-110", subject: "الجغرافيا", phone: "0912 345 110", classes: ["c3b", "c2b", "c1a", "c1b"], stageIds: ["stg-sec"] },
  { id: "t11", name: "أ. عمر فاروق صديق", employeeId: "T-111", subject: "الرياضيات الأساسية والعلوم", phone: "0912 345 111", classes: ["cm1", "cm2", "cp6"], stageIds: ["stg-mid", "stg-pri"] },
];

/* ---------------- Parents & Multi-Student Association ---------------- */

export const parents: Parent[] = [
  {
    id: "p1",
    name: "أ. محمد عبدالله أحمد",
    nationalId: "PRN-2026-0777",
    phone: "0912 777 314",
    email: "m.abdullah@example.com",
    relationship: "father",
    studentIds: ["s1", "s-mid-1", "s-pri-1"], // 3 أبناء في مراحل مختلفة!
  },
  {
    id: "p2",
    name: "د. الطيب حسن عمر",
    nationalId: "PRN-2026-0710",
    phone: "0912 710 310",
    relationship: "father",
    studentIds: ["s-c3a-2"],
  },
  {
    id: "p3",
    name: "م. عثمان إبراهيم داؤود",
    nationalId: "PRN-2026-0711",
    phone: "0912 711 311",
    relationship: "father",
    studentIds: ["s-c3a-3", "s-mid-2"],
  },
  {
    id: "p4",
    name: "أ. طارق حسن ميرغني",
    nationalId: "PRN-2026-0520",
    phone: "0991 520 320",
    relationship: "father",
    studentIds: ["s-c2a-12"],
  },
];

interface RawStudentSeed {
  id?: string;
  classId: string;
  name: string;
  parentId?: string;
  parentName: string;
  phone: string;
  gender: "male" | "female";
  feeStatus: "full" | "partial" | "overdue" | "pending_receipt";
}

const rawStudents: RawStudentSeed[] = [
  // 1. الابن الأكبر لـ p1 (الصف الثالث الثانوي - علمي)
  { id: "s1", classId: "c3a", name: "أحمد محمد عبدالله", parentId: "p1", parentName: "محمد عبدالله أحمد", phone: "0912 777 314", gender: "male", feeStatus: "partial" },
  { id: "s-c3a-2", classId: "c3a", name: "مريم الطيب حسن", parentId: "p2", parentName: "الطيب حسن عمر", phone: "0912 710 310", gender: "female", feeStatus: "pending_receipt" },
  { id: "s-c3a-3", classId: "c3a", name: "يوسف عثمان إبراهيم", parentId: "p3", parentName: "عثمان إبراهيم داؤود", phone: "0912 711 311", gender: "male", feeStatus: "full" },
  { classId: "c3a", name: "آمنة خالد بابكر", parentName: "خالد بابكر عبدالمجيد", phone: "0912 712 312", gender: "female", feeStatus: "overdue" },
  { classId: "c3a", name: "عمر صلاح الدين النور", parentName: "صلاح الدين النور", phone: "0912 713 313", gender: "male", feeStatus: "partial" },

  // الصف الثالث الثانوي - أدبي (c3b)
  { classId: "c3b", name: "إبراهيم آدم موسى", parentName: "آدم موسى يعقوب", phone: "0922 414 314", gender: "male", feeStatus: "full" },
  { classId: "c3b", name: "هبة عوض الكريم حامد", parentName: "عوض الكريم حامد", phone: "0922 415 315", gender: "female", feeStatus: "pending_receipt" },
  { classId: "c3b", name: "مصعب ياسر مصطفى", parentName: "ياسر مصطفى محجوب", phone: "0922 416 316", gender: "male", feeStatus: "overdue" },
  { classId: "c3b", name: "نسيبة الفاتح عمر", parentName: "الفاتح عمر الصديق", phone: "0922 417 317", gender: "female", feeStatus: "partial" },
  { classId: "c3b", name: "معاذ بكري سعيد", parentName: "بكري سعيد جاد الله", phone: "0922 418 318", gender: "male", feeStatus: "full" },

  // الصف الثاني الثانوي - فصل أ (c2a)
  { classId: "c2a", name: "لينا عادل محجوب", parentName: "عادل محجوب كمال", phone: "0991 519 319", gender: "female", feeStatus: "full" },
  { id: "s-c2a-12", classId: "c2a", name: "حسام الدين طارق حسن", parentId: "p4", parentName: "طارق حسن ميرغني", phone: "0991 520 320", gender: "male", feeStatus: "partial" },
  { classId: "c2a", name: "رنا عبدالعزيز يحيى", parentName: "عبدالعزيز يحيى حمد", phone: "0991 521 321", gender: "female", feeStatus: "pending_receipt" },
  { classId: "c2a", name: "أنس مجدي الطاهر", parentName: "مجدي الطاهر يوسف", phone: "0991 522 322", gender: "male", feeStatus: "overdue" },
  { classId: "c2a", name: "دعاء سيف الدين عثمان", parentName: "سيف الدين عثمان علي", phone: "0991 523 323", gender: "female", feeStatus: "full" },

  // الصف الثاني الثانوي - فصل ب (c2b)
  { classId: "c2b", name: "مؤيد الرشيد الطيب", parentName: "الرشيد الطيب عمر", phone: "0966 624 324", gender: "male", feeStatus: "partial" },
  { classId: "c2b", name: "دانية كمال عبداللطيف", parentName: "كمال عبداللطيف حمد", phone: "0966 625 325", gender: "female", feeStatus: "full" },
  { classId: "c2b", name: "صهيب نبيل محمد", parentName: "نبيل محمد سليمان", phone: "0966 626 326", gender: "male", feeStatus: "overdue" },
  { classId: "c2b", name: "شهد أمين الفضل", parentName: "أمين الفضل إدريس", phone: "0966 627 327", gender: "female", feeStatus: "partial" },
  { classId: "c2b", name: "مازن الهادي عبدالكريم", parentName: "الهادي عبدالكريم فضل", phone: "0966 628 328", gender: "male", feeStatus: "full" },

  // الصف الأول الثانوي - فصل أ (c1a)
  { classId: "c1a", name: "زياد هشام عباس", parentName: "هشام عباس أحمد", phone: "0912 829 329", gender: "male", feeStatus: "full" },
  { classId: "c1a", name: "ملاذ عصام الدين فضل", parentName: "عصام الدين فضل", phone: "0912 830 330", gender: "female", feeStatus: "pending_receipt" },
  { classId: "c1a", name: "عبدالله وليد البدوي", parentName: "وليد البدوي إبراهيم", phone: "0912 831 331", gender: "male", feeStatus: "overdue" },
  { classId: "c1a", name: "تسنيم أسامة الجزولي", parentName: "أسامة الجزولي عثمان", phone: "0912 832 332", gender: "female", feeStatus: "partial" },
  { classId: "c1a", name: "بكري محمد الحسن السماني", parentName: "محمد الحسن السماني", phone: "0912 833 333", gender: "male", feeStatus: "full" },

  // المرحلة المتوسطة - الأول والثاني والثالث المتوسط
  // الابن الثاني لـ p1 (الصف الثاني المتوسط)
  { id: "s-mid-1", classId: "cm2", name: "عمر محمد عبدالله", parentId: "p1", parentName: "محمد عبدالله أحمد", phone: "0912 777 314", gender: "male", feeStatus: "full" },
  { id: "s-mid-2", classId: "cm3", name: "خالد عثمان إبراهيم", parentId: "p3", parentName: "عثمان إبراهيم داؤود", phone: "0912 711 311", gender: "male", feeStatus: "partial" },
  { classId: "cm1", name: "ياسين طارق عبدالمحمود", parentName: "طارق عبدالمحمود", phone: "0912 900 101", gender: "male", feeStatus: "full" },
  { classId: "cm3", name: "فاروق معاوية بشير", parentName: "معاوية بشير حسن", phone: "0912 900 102", gender: "male", feeStatus: "overdue" },

  // المرحلة الابتدائية (الأساس)
  // الابنة الصغرى لـ p1 (الصف الثالث الابتدائي)
  { id: "s-pri-1", classId: "cp3", name: "فاطمة محمد عبدالله", parentId: "p1", parentName: "محمد عبدالله أحمد", phone: "0912 777 314", gender: "female", feeStatus: "full" },
  { classId: "cp6", name: "طه محجوب السر", parentName: "محجوب السر علي", phone: "0912 900 201", gender: "male", feeStatus: "partial" },
  { classId: "cp6", name: "سجى وائل إبراهيم", parentName: "وائل إبراهيم حمد", phone: "0912 900 202", gender: "female", feeStatus: "full" },
];

const feesByClass: Record<string, number> = {
  cp3: 550000,
  cp6: 600000,
  cm1: 700000,
  cm2: 700000,
  cm3: 750000,
  c1a: 800000,
  c1b: 800000,
  c2a: 850000,
  c2b: 850000,
  c3a: 900000,
  c3b: 900000,
};

function roomFor(subject: string, classId: string) {
  if (subject.includes("الحاسوب")) return "معمل الحاسوب";
  if (["الفيزياء", "الكيمياء", "الأحياء والعلوم"].some((s) => subject.includes(s))) return "المختبر العلمي";
  const map: Record<string, string> = {
    c1a: "قاعة 101",
    c1b: "قاعة 102",
    c2a: "قاعة 201",
    c2b: "قاعة 202",
    c3a: "قاعة 301 (علمي)",
    c3b: "قاعة 302 (أدبي)",
    cm1: "قاعة المتوسط 1",
    cm2: "قاعة المتوسط 2",
    cm3: "قاعة المتوسط 3",
    cp3: "قاعة الأساس 3",
    cp6: "قاعة الأساس 6",
  };
  return map[classId] ?? "قاعة رئيسية";
}

export function createSeed(now: Date = new Date()): SchoolState {
  const rel = (n: number) => toISODate(addDays(now, n));
  const relTime = (n: number, h = 9) => {
    const d = addDays(now, n);
    d.setHours(h, 0, 0, 0);
    return d.toISOString();
  };

  // Build Students
  const students: Student[] = rawStudents.map((raw, idx) => {
    const isDemo = raw.id === "s1" || idx === 0;
    const id = raw.id ?? `s-${raw.classId}-${idx + 1}`;
    const academicId = isDemo ? DEMO.student.academicId : `MNH-2026-0${314 + idx}`;
    return {
      id,
      name: raw.name,
      academicId,
      classId: raw.classId,
      parentId: raw.parentId,
      parentName: raw.parentName,
      parentPhone: raw.phone,
      gender: raw.gender,
      enrollmentDate: "2025-08-15",
      totalFees: feesByClass[raw.classId] ?? 850000,
    };
  });

  // Installments and Payments
  const installments: Installment[] = [];
  const payments: Payment[] = [];
  const receipts: Receipt[] = [];

  students.forEach((s, idx) => {
    const raw = rawStudents[idx];
    if (!raw) return;
    const a1 = Math.round(s.totalFees * 0.4);
    const a2 = Math.round(s.totalFees * 0.3);
    const a3 = s.totalFees - a1 - a2;

    installments.push(
      { id: `in-${s.id}-1`, studentId: s.id, title: "القسط الأول (التسجيل)", amount: a1, dueDate: rel(-60) },
      { id: `in-${s.id}-2`, studentId: s.id, title: "القسط الثاني (منتصف العام)", amount: a2, dueDate: rel(14) },
      { id: `in-${s.id}-3`, studentId: s.id, title: "القسط الثالث (الختامي)", amount: a3, dueDate: rel(80) },
    );

    if (raw.feeStatus === "full") {
      payments.push(
        { id: `pay-${s.id}-1`, studentId: s.id, amount: a1, date: rel(-58), method: "نقداً - خزينة المدرسة", receiptNo: `RC-2026-${1100 + idx * 3}` },
        { id: `pay-${s.id}-2`, studentId: s.id, amount: a2, date: rel(-20), method: "تحويل بنكي - تطبيق بنكك", receiptNo: `RC-2026-${1101 + idx * 3}`, transactionId: `TRX-BOK-${880000 + idx}` },
        { id: `pay-${s.id}-3`, studentId: s.id, amount: a3, date: rel(-5), method: "تحويل بنكي - تطبيق فوري", receiptNo: `RC-2026-${1102 + idx * 3}`, transactionId: `TRX-FAW-${990000 + idx}` },
      );
    } else if (raw.feeStatus === "partial") {
      payments.push(
        { id: `pay-${s.id}-1`, studentId: s.id, amount: a1, date: rel(-55), method: "نقداً - خزينة المدرسة", receiptNo: `RC-2026-${1200 + idx * 3}` },
      );
    } else if (raw.feeStatus === "overdue") {
      payments.push(
        { id: `pay-${s.id}-1`, studentId: s.id, amount: Math.round(a1 * 0.5), date: rel(-65), method: "نقداً - خزينة المدرسة", receiptNo: `RC-2026-${1300 + idx * 3}` },
      );
    } else if (raw.feeStatus === "pending_receipt") {
      payments.push(
        { id: `pay-${s.id}-1`, studentId: s.id, amount: a1, date: rel(-55), method: "نقداً - خزينة المدرسة", receiptNo: `RC-2026-${1400 + idx * 3}` },
      );
      receipts.push({
        id: `rc-seed-${idx}`,
        studentId: s.id,
        reference: `BOK-${88000000 + idx * 1357}`,
        transactionId: `TRX-BOK-${7700000 + idx * 2468}`,
        bankName: "بنكك (بنك الخرطوم)",
        senderAccount: s.parentPhone,
        amount: a2,
        note: `سداد القسط الثاني عن طريق بنكك لحساب الطالب ${s.name}`,
        status: "pending",
        auditStatus: "under_review",
        auditNotes: "بانتظار مطابقة كشف الحساب المصرفي لبنك الخرطوم",
        submittedAt: relTime(-1, 18),
      });
    }
  });

  // Approved receipt example for demo student
  receipts.push({
    id: "rc-demo-approved",
    studentId: "s1",
    reference: "BOK-77120455",
    transactionId: "TRX-BOK-99882211",
    bankName: "بنكك (بنك الخرطوم)",
    senderAccount: "0912 777 314",
    amount: 150000,
    note: "سداد دفعة جزئية من القسط الثاني عبر تطبيق بنكك",
    status: "approved",
    auditStatus: "verified_match",
    auditNotes: "تمت المطابقة بنجاح مع إشعار البنك المالي",
    auditedBy: "الشؤون المالية - أ. عثمان الطيب",
    submittedAt: relTime(-18, 14),
    reviewedAt: relTime(-17, 10),
  });

  // Timetable Slots: Distributed for high schools and primary/middle
  const slots: Slot[] = [];
  classes.forEach((c, ci) => {
    const isScientific = c.id === "c3a" || c.id === "c2a";
    const isLiterary = c.id === "c3b" || c.id === "c2b";

    let availableTeachers = teachers;
    if (isScientific) {
      availableTeachers = teachers.filter((t) => !["التاريخ والدراسات الاجتماعية", "الجغرافيا"].includes(t.subject));
    } else if (isLiterary) {
      availableTeachers = teachers.filter((t) => !["الفيزياء", "الكيمياء", "الأحياء والعلوم"].includes(t.subject));
    }

    for (let day = 0; day < 5; day++) {
      for (let period = 1; period <= 7; period++) {
        const tIndex = (day * 3 + period + ci * 2) % availableTeachers.length;
        const t = availableTeachers[tIndex]!;
        slots.push({
          id: `sl-${c.id}-${day}-${period}`,
          classId: c.id,
          day,
          period,
          subject: t.subject,
          teacherId: t.id,
          room: roomFor(t.subject, c.id),
        });
      }
    }
  });

  const announcements: Announcement[] = [
    {
      id: "an-1",
      title: "جدول امتحانات منتصف الفصل الدراسي الأول لجميع الفصول والمراحل",
      body: "تبدأ امتحانات منتصف الفصل الدراسي الأول يوم الأحد القادم لكافة المراحل (الابتدائي، المتوسط، والثانوي). يرجى من جميع الطلاب وأولياء الأمور متابعة التقويم المدرسي والالتزام بمواعيد الحضور.",
      category: "urgent",
      date: relTime(-1, 8),
      author: "إدارة الشؤون الأكاديمية",
      audience: "all",
    },
    {
      id: "an-2",
      title: "تذكير هام بموعد استحقاق القسط الثاني وسداد بنكك",
      body: "تهيب الإدارة المالية بأولياء الأمور الكرام سرعة سداد القسط الثاني. يرجى التأكد من إرفاق رقم العملية المرجعي (Transaction ID) الواضح عند إرسال الإشعار لضمان سرعة التدقيق والمطابقة.",
      category: "urgent",
      date: relTime(-2, 10),
      author: "الشؤون المالية",
      audience: "all",
    },
    {
      id: "an-3",
      title: "لائحة الزي المدرسي والمظهر العام لكافة المراحل",
      body: "يلتزم الطلاب بارتداء الزي المدرسي الرسمي: القميص الأبيض والبنطال الكحلي للبنين، والزي الكحلي مع الطرحة البيضاء للبنات في كافة المراحل التعليمية.",
      category: "rules",
      date: relTime(-30, 9),
      author: "إدارة شؤون الطلاب",
      audience: "all",
    },
    {
      id: "an-4",
      title: "ضوابط الحضور الصباحي والغياب",
      body: "يبدأ الطابور الصباحي في تمام 7:30 صباحاً. يعتبر الطالب متأخراً بعد 7:45، وتكرار التأخير 3 مرات يعرض الطالب للإنذار واستدعاء ولي الأمر.",
      category: "rules",
      date: relTime(-29, 10),
      author: "إدارة المدرسة",
      audience: "all",
    },
    {
      id: "an-5",
      title: "انطلاق فعاليات المعرض العلمي والثقافي السنوي",
      body: "تدعو إدارة الأنشطة جميع الطلاب للمشاركة في المعرض العلمي لهذا العام بمشاريع الابتكار والتجارب المعملية بإشراف هيئة التدريس.",
      category: "activities",
      date: relTime(-3, 11),
      author: "قسم النشاط الطلابي",
      audience: "all",
    },
    {
      id: "an-6",
      title: "مسابقة المنهل الكبرى لحفظ القرآن الكريم وتجويده",
      body: "تعلن المدرسة عن بدء التسجيل في مسابقة القرآن الكريم السنوية للمراحل الابتدائية والمتوسطة والثانوية بإشراف أ. الطيب أحمد.",
      category: "activities",
      date: relTime(-4, 9),
      author: "أسرة التربية الإسلامية",
      audience: "all",
    },
  ];

  const homework: Homework[] = [
    { id: "hw-1", classId: "c3a", subject: "الرياضيات", title: "تمارين التفاضل وحساب النهايات - الوحدة الثالثة", description: "حل التمارين من رقم 1 إلى 15 صفحة 84 من الكتاب المقرر مع كتابة الخطوات التفصيلية لكل مسألة.", dueDate: rel(2), teacherId: "t1", kind: "homework", createdAt: relTime(-2) },
    { id: "hw-2", classId: "c3a", subject: "الفيزياء", title: "تقرير تجربة تحقيق قانون أوم والمقاومة النوعية", description: "إعداد تقرير معملي يشمل جدول القراءات، الرسم البياني لعلاقة الجهد بالتيار، وحساب قيمة المقاومة المجهولة ونسبة الخطأ.", dueDate: rel(4), teacherId: "t2", kind: "homework", createdAt: relTime(-3) },
    { id: "hw-3", classId: "c3a", subject: "الكيمياء", title: "مسائل الاتزان الكيميائي وقاعدة لوشاتيليه", description: "إجابة أسئلة الفصل الرابع صفحة 112 الخاصة بحساب ثابت الاتزان وتأثير الضغط ودرجة الحرارة على موضع الاتزان.", dueDate: rel(3), teacherId: "t3", kind: "homework", createdAt: relTime(-1) },
    { id: "hw-4", classId: "c3b", subject: "اللغة العربية", title: "تحليل وتذوق نصوص من الأدب الحديث", description: "استخراج الصور البلاغية والمحسنات البديعية وتحديد العاطفة المسيطرة على الشاعر في الأبيات المقررة.", dueDate: rel(3), teacherId: "t4", kind: "homework", createdAt: relTime(-2) },
    { id: "hw-5", classId: "cm2", subject: "العلوم", title: "دورة الصخور وطبقات الأرض", description: "رسم مخطط يوضح أنواع الصخور الرسوبية والنارية والمتحولة مع تقديم 3 أمثلة لكل نوع.", dueDate: rel(3), teacherId: "t7", kind: "homework", createdAt: relTime(-1) },
    { id: "hw-6", classId: "cp3", subject: "اللغة العربية", title: "قراءة النص وإملاء الكلمات المنونة", description: "قراءة الدرس الثالث صفحة 22 وكتابة الكلمات المنونة بالفتح والضم والكسر في دفتر الواجب.", dueDate: rel(2), teacherId: "t4", kind: "homework", createdAt: relTime(-1) },
  ];

  // Attendance Records: 20 school days
  const attendance: AttendanceRecord[] = [];
  const anchor = lastSchoolDay(now);
  const days: string[] = [];
  let cursor = addDays(anchor, -1);
  while (days.length < 20) {
    if (isSchoolDay(cursor)) days.push(toISODate(cursor));
    cursor = addDays(cursor, -1);
  }

  students.forEach((s, k) => {
    days.forEach((date, j) => {
      let status: AttendanceStatus = "present";
      if (s.id === "s1") {
        if (j === 8) status = "absent";
        else if (j === 15) status = "late";
      } else if ((j + k * 7) % 19 === 0) {
        status = "absent";
      } else if ((j * 2 + k) % 11 === 0) {
        status = "late";
      }
      attendance.push({ date, classId: s.classId, studentId: s.id, status });
    });
  });

  const events: CalendarEvent[] = [
    { id: "ev-1", title: "اجتماع مجلس الآباء والمعلمين الدوري العام", date: rel(5), time: "10:00 ص", type: "event", classId: "all" },
    { id: "ev-2", title: "امتحان منتصف الفصل - الرياضيات", date: rel(9), time: "08:00 ص", type: "exam", classId: "c3a", subject: "الرياضيات" },
    { id: "ev-3", title: "امتحان منتصف الفصل - الفيزياء", date: rel(11), time: "08:00 ص", type: "exam", classId: "c3a", subject: "الفيزياء" },
    { id: "ev-4", title: "امتحان منتصف الفصل - الكيمياء", date: rel(13), time: "08:00 ص", type: "exam", classId: "c3a", subject: "الكيمياء" },
    { id: "ev-5", title: "المعرض العلمي والثقافي السنوي", date: rel(18), time: "09:00 ص", type: "event", classId: "all" },
    { id: "ev-6", title: "عطلة عيد الاستقلال المجيد", date: rel(45), type: "holiday", classId: "all" },
  ];

  // Academic Gradebook (كشوف الدرجات والامتحانات)
  const gradesList: GradeEntry[] = [
    // درجات الطالب أحمد محمد عبدالله (s1) - الصف الثالث الثانوي علمي
    { id: "gr-1", studentId: "s1", classId: "c3a", subject: "الرياضيات", academicYear: "2025-2026", term: "term_1", courseworkScore: 19, midtermScore: 18, finalScore: 54, totalScore: 91, letter: "أ+", notes: "أداء ممتاز وتفوق ملحوظ في حساب النهايات", recordedAt: relTime(-5), recordedBy: "t1" },
    { id: "gr-2", studentId: "s1", classId: "c3a", subject: "الفيزياء", academicYear: "2025-2026", term: "term_1", courseworkScore: 18, midtermScore: 17, finalScore: 51, totalScore: 86, letter: "أ", notes: "مشاركة معملية مميزة وتطبيق دقيق للقوانين", recordedAt: relTime(-5), recordedBy: "t2" },
    { id: "gr-3", studentId: "s1", classId: "c3a", subject: "الكيمياء", academicYear: "2025-2026", term: "term_1", courseworkScore: 17, midtermScore: 16, finalScore: 52, totalScore: 85, letter: "أ", notes: "إتقان لمفاهيم الاتزان الكيميائي", recordedAt: relTime(-5), recordedBy: "t3" },
    { id: "gr-4", studentId: "s1", classId: "c3a", subject: "اللغة العربية", academicYear: "2025-2026", term: "term_1", courseworkScore: 18, midtermScore: 18, finalScore: 53, totalScore: 89, letter: "أ", notes: "تميز في البلاغة والتعبير الأدبي", recordedAt: relTime(-5), recordedBy: "t4" },
    { id: "gr-5", studentId: "s1", classId: "c3a", subject: "اللغة الإنجليزية", academicYear: "2025-2026", term: "term_1", courseworkScore: 19, midtermScore: 19, finalScore: 56, totalScore: 94, letter: "أ+", notes: "طلاقة لغوية وتفوق في كتابة المقال", recordedAt: relTime(-5), recordedBy: "t5" },
    { id: "gr-6", studentId: "s1", classId: "c3a", subject: "التربية الإسلامية", academicYear: "2025-2026", term: "term_1", courseworkScore: 20, midtermScore: 19, finalScore: 58, totalScore: 97, letter: "أ+", notes: "حفظ متقن وسلوك قدوة", recordedAt: relTime(-5), recordedBy: "t6" },

    // درجات الابن الثاني عمر محمد عبدالله (s-mid-1) - الصف الثاني المتوسط
    { id: "gr-7", studentId: "s-mid-1", classId: "cm2", subject: "الرياضيات", academicYear: "2025-2026", term: "term_1", courseworkScore: 18, midtermScore: 17, finalScore: 52, totalScore: 87, letter: "أ", notes: "مستوى جيد جداً ومتابعة مستمرة", recordedAt: relTime(-5), recordedBy: "t11" },
    { id: "gr-8", studentId: "s-mid-1", classId: "cm2", subject: "العلوم", academicYear: "2025-2026", term: "term_1", courseworkScore: 19, midtermScore: 18, finalScore: 55, totalScore: 92, letter: "أ+", notes: "اهتمام بالتجارب والمشاريع العلمية", recordedAt: relTime(-5), recordedBy: "t7" },
    { id: "gr-9", studentId: "s-mid-1", classId: "cm2", subject: "اللغة العربية", academicYear: "2025-2026", term: "term_1", courseworkScore: 17, midtermScore: 17, finalScore: 50, totalScore: 84, letter: "ب+", notes: "تحسن واضح في الإملاء والنحو", recordedAt: relTime(-5), recordedBy: "t4" },

    // درجات الابنة الثالثة فاطمة محمد عبدالله (s-pri-1) - الصف الثالث الابتدائي
    { id: "gr-10", studentId: "s-pri-1", classId: "cp3", subject: "الرياضيات", academicYear: "2025-2026", term: "term_1", courseworkScore: 20, midtermScore: 20, finalScore: 58, totalScore: 98, letter: "ممتاز", notes: "ذكاء وحل سريع للعمليات الحسابية", recordedAt: relTime(-5), recordedBy: "t11" },
    { id: "gr-11", studentId: "s-pri-1", classId: "cp3", subject: "اللغة العربية", academicYear: "2025-2026", term: "term_1", courseworkScore: 19, midtermScore: 20, finalScore: 57, totalScore: 96, letter: "ممتاز", notes: "قراءة جهرية معبرة وخط جميل", recordedAt: relTime(-5), recordedBy: "t4" },
  ];

  // السجل التربوي والسلوكي
  const behaviorRecords: BehaviorRecord[] = [
    {
      id: "bh-1",
      studentId: "s1",
      date: relTime(-10),
      type: "positive",
      title: "إشادة بالتفوق والقيادة المدرسية",
      details: "إشادة من إدارة المدرسة بمبادرة الطالب أحمد في تنظيم جماعة النشاط العلمي ومساعدة زملائه.",
      recordedBy: "أ. عثمان الطيب - المدير",
      term: "term_1",
    },
    {
      id: "bh-2",
      studentId: "s1",
      date: relTime(-3),
      type: "guidance",
      title: "توجيه تربوي بشأن الانضباط الصباحي",
      details: "تأخر عن الطابور الصباحي مرتين خلال الشهر، وتم توجيهه بضرورة الالتزام بالحضور في تمام 7:30.",
      recordedBy: "أ. الطيب أحمد - مشرف الدور",
      term: "term_1",
    },
    {
      id: "bh-3",
      studentId: "s-mid-1",
      date: relTime(-7),
      type: "positive",
      title: "تكريم في الإذاعة المدرسية",
      details: "فوز الطالب عمر بالمركز الأول في مسابقة الإلقاء الشعري للمرحلة المتوسطة.",
      recordedBy: "أ. عبدالرحيم حسن",
      term: "term_1",
    },
  ];

  return {
    version: SEED_VERSION,
    academicYears,
    currentAcademicYear: "2025-2026",
    currentTerm: "term_1",
    stages: academicStages,
    sections: academicSections,
    grades: gradeLevels,
    classes,
    students,
    teachers,
    parents,
    admins: [{ id: "a1", name: "أ. عثمان الطيب", username: "admin", title: "مدير المدرسة" }],
    gradesList,
    behaviorRecords,
    installments,
    payments,
    receipts,
    announcements,
    slots,
    homework,
    completedHomework: [],
    attendance,
    events,
    notifications: [
      { id: "nt-1", title: "واجب جديد في الرياضيات", body: "تمارين التفاضل وحساب النهايات - الوحدة الثالثة", date: relTime(-2), to: "student", link: "/app/homework", readBy: [] },
      { id: "nt-2", title: "تذكير بالقسط الثاني وسداد بنكك", body: "موعد سداد القسط الثاني خلال الأسبوعين القادمين عبر تطبيق بنكك", date: relTime(-2, 10), to: "parent", link: "/app/fees", readBy: [] },
      { id: "nt-3", title: "إشعارات بنكك بانتظار التدقيق والمطابقة", body: "تم تقديم سندات تحويل بنكي جديدة تحتاج إلى مراجعة وتدقيق رقم العملية", date: relTime(-1, 20), to: "admin", link: "/app/fees", readBy: [] },
      { id: "nt-4", title: "رصد درجات منتصف الفصل", body: "تم رصد درجات اختبارات منتصف الفصل، يمكنك الاطلاع على كشف الدرجات", date: relTime(-1, 12), to: "parent", link: "/app", readBy: [] },
      { id: "nt-5", title: "تذكير برصد الغياب اليومي", body: "يرجى من أساتذة الحصص رصد الحضور إلكترونياً قبل نهاية الدوام", date: relTime(0, 7), to: "teacher", link: "/app/attendance", readBy: [] },
    ],
    session: null,
  };
}
