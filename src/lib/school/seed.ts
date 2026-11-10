import { toISODate } from "./logic";
import type {
  AcademicSection,
  AcademicStage,
  AcademicYearConfig,
  Admin,
  Announcement,
  AttendanceRecord,
  AttendanceStatus,
  BehaviorRecord,
  CalendarEvent,
  GradeEntry,
  GradeLevel,
  Homework,
  Installment,
  Payment,
  SchoolClass,
  SchoolState,
  Slot,
  StageId,
  Student,
  Teacher,
} from "./types";

export const SEED_VERSION = 5;

/** Flag to control visibility of demo fast-login buttons and reset data in production/demo */
export const DEMO_MODE = true;

export const DEMO = {
  student: { academicId: "STD-SEC-1001", id: "s-sec-1" },
  teacher: { employeeId: "T-101", id: "t1" },
  admin: { username: "admin", id: "a1" },
  accountant: { username: "accountant", id: "a2" },
  registrar: { username: "registrar", id: "a3" },
  password: "123456",
};

export const academicStages: AcademicStage[] = [
  { id: "مرحلة الأساس", name: "مرحلة الأساس", code: "primary", order: 1 },
  { id: "المرحلة المتوسطة", name: "المرحلة المتوسطة", code: "middle", order: 2 },
  { id: "المرحلة الثانوية", name: "المرحلة الثانوية", code: "secondary", order: 3 },
];

export const academicSections: AcademicSection[] = [
  { id: "sec-pri-b", stageId: "مرحلة الأساس", name: "بنين - الأساس", type: "boys" },
  { id: "sec-pri-g", stageId: "مرحلة الأساس", name: "بنات - الأساس", type: "girls" },
  { id: "sec-mid-b", stageId: "المرحلة المتوسطة", name: "بنين - المتوسط", type: "boys" },
  { id: "sec-mid-g", stageId: "المرحلة المتوسطة", name: "بنات - المتوسط", type: "girls" },
  { id: "sec-sec-b", stageId: "المرحلة الثانوية", name: "بنين - الثانوي", type: "boys" },
  { id: "sec-sec-g", stageId: "المرحلة الثانوية", name: "بنات - الثانوي", type: "girls" },
];

export const gradeLevels: GradeLevel[] = [
  { id: "grd-p1", stageId: "مرحلة الأساس", name: "الصف الأول الأساس", levelNumber: 1 },
  { id: "grd-p2", stageId: "مرحلة الأساس", name: "الصف الثاني الأساس", levelNumber: 2 },
  { id: "grd-p3", stageId: "مرحلة الأساس", name: "الصف الثالث الأساس", levelNumber: 3 },
  { id: "grd-p4", stageId: "مرحلة الأساس", name: "الصف الرابع الأساس", levelNumber: 4 },
  { id: "grd-p5", stageId: "مرحلة الأساس", name: "الصف الخامس الأساس", levelNumber: 5 },
  { id: "grd-p6", stageId: "مرحلة الأساس", name: "الصف السادس الأساس", levelNumber: 6 },
  { id: "grd-m1", stageId: "المرحلة المتوسطة", name: "الصف الأول المتوسط", levelNumber: 1 },
  { id: "grd-m2", stageId: "المرحلة المتوسطة", name: "الصف الثاني المتوسط", levelNumber: 2 },
  { id: "grd-m3", stageId: "المرحلة المتوسطة", name: "الصف الثالث المتوسط", levelNumber: 3 },
  { id: "grd-s1", stageId: "المرحلة الثانوية", name: "الصف الأول الثانوي", levelNumber: 1 },
  { id: "grd-s2", stageId: "المرحلة الثانوية", name: "الصف الثاني الثانوي", levelNumber: 2 },
  { id: "grd-s3", stageId: "المرحلة الثانوية", name: "الصف الثالث الثانوي", levelNumber: 3 },
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
  // مرحلة الأساس (6 فصول)
  { id: "c-pri-1", name: "الصف الأول الأساس", short: "١ أساس", stageId: "مرحلة الأساس", sectionId: "sec-pri-b", gradeLevelId: "grd-p1", capacity: 30 },
  { id: "c-pri-2", name: "الصف الثاني الأساس", short: "٢ أساس", stageId: "مرحلة الأساس", sectionId: "sec-pri-b", gradeLevelId: "grd-p2", capacity: 30 },
  { id: "c-pri-3", name: "الصف الثالث الأساس", short: "٣ أساس", stageId: "مرحلة الأساس", sectionId: "sec-pri-g", gradeLevelId: "grd-p3", capacity: 30 },
  { id: "c-pri-4", name: "الصف الرابع الأساس", short: "٤ أساس", stageId: "مرحلة الأساس", sectionId: "sec-pri-g", gradeLevelId: "grd-p4", capacity: 32 },
  { id: "c-pri-5", name: "الصف الخامس الأساس", short: "٥ أساس", stageId: "مرحلة الأساس", sectionId: "sec-pri-b", gradeLevelId: "grd-p5", capacity: 32 },
  { id: "c-pri-6", name: "الصف السادس الأساس", short: "٦ أساس", stageId: "مرحلة الأساس", sectionId: "sec-pri-b", gradeLevelId: "grd-p6", capacity: 35 },

  // المرحلة المتوسطة (3 فصول)
  { id: "c-mid-1", name: "الصف الأول المتوسط", short: "١ متوسط", stageId: "المرحلة المتوسطة", sectionId: "sec-mid-b", gradeLevelId: "grd-m1", capacity: 32 },
  { id: "c-mid-2", name: "الصف الثاني المتوسط", short: "٢ متوسط", stageId: "المرحلة المتوسطة", sectionId: "sec-mid-g", gradeLevelId: "grd-m2", capacity: 32 },
  { id: "c-mid-3", name: "الصف الثالث المتوسط", short: "٣ متوسط", stageId: "المرحلة المتوسطة", sectionId: "sec-mid-b", gradeLevelId: "grd-m3", capacity: 35 },

  // المرحلة الثانوية (6 فصول)
  { id: "c-sec-1a", name: "الصف الأول الثانوي (أ)", short: "١ ثان أ", stageId: "المرحلة الثانوية", sectionId: "sec-sec-b", gradeLevelId: "grd-s1", capacity: 30 },
  { id: "c-sec-1b", name: "الصف الأول الثانوي (ب)", short: "١ ثان ب", stageId: "المرحلة الثانوية", sectionId: "sec-sec-g", gradeLevelId: "grd-s1", capacity: 30 },
  { id: "c-sec-2sci", name: "الصف الثاني الثانوي - علمي", short: "٢ علمي", stageId: "المرحلة الثانوية", sectionId: "sec-sec-b", gradeLevelId: "grd-s2", capacity: 32 },
  { id: "c-sec-2art", name: "الصف الثاني الثانوي - أدبي", short: "٢ أدبي", stageId: "المرحلة الثانوية", sectionId: "sec-sec-g", gradeLevelId: "grd-s2", capacity: 28 },
  { id: "c-sec-3sci", name: "الصف الثالث الثانوي - علمي", short: "٣ علمي", stageId: "المرحلة الثانوية", sectionId: "sec-sec-b", gradeLevelId: "grd-s3", capacity: 35 },
  { id: "c-sec-3art", name: "الصف الثالث الثانوي - أدبي", short: "٣ أدبي", stageId: "المرحلة الثانوية", sectionId: "sec-sec-g", gradeLevelId: "grd-s3", capacity: 30 },
];

export const admins: Admin[] = [
  { id: "a1", username: "admin", name: "أ. عبد المحمود عثمان", title: "مدير" },
  { id: "a2", username: "accountant", name: "أ. يس إبراهيم التوم", title: "حسابات" },
  { id: "a3", username: "registrar", name: "أ. سارة عبد المنعم", title: "تسجيل" },
];

export const teachers: Teacher[] = [
  // ثانوي
  { id: "t1", name: "د. طارق الجزولي", employeeId: "T-101", subject: "الرياضيات", phone: "0912 345 678", status: "active", stageIds: ["المرحلة الثانوية"], classes: ["c-sec-1a", "c-sec-2sci", "c-sec-3sci"] },
  { id: "t2", name: "أ. فاطمة النور إدريس", employeeId: "T-102", subject: "اللغة العربية", phone: "0912 456 789", status: "active", stageIds: ["المرحلة الثانوية", "المرحلة المتوسطة"], classes: ["c-sec-1a", "c-sec-2art", "c-sec-3art", "c-mid-3"] },
  { id: "t3", name: "أ. عثمان عبد الرحيم", employeeId: "T-103", subject: "الفيزياء", phone: "0912 567 890", status: "active", stageIds: ["المرحلة الثانوية"], classes: ["c-sec-1a", "c-sec-2sci", "c-sec-3sci"] },
  { id: "t4", name: "د. سارة التاج الفكي", employeeId: "T-104", subject: "الكيمياء", phone: "0912 678 901", status: "active", stageIds: ["المرحلة الثانوية"], classes: ["c-sec-1b", "c-sec-2sci", "c-sec-3sci"] },
  { id: "t5", name: "أ. مأمون الطيب الصديق", employeeId: "T-105", subject: "اللغة الإنجليزية", phone: "0912 789 012", status: "active", stageIds: ["المرحلة الثانوية", "المرحلة المتوسطة"], classes: ["c-sec-1a", "c-sec-2sci", "c-sec-3sci", "c-mid-2"] },
  { id: "t6", name: "أ. زينب البدوي عثمان", employeeId: "T-106", subject: "الأحياء", phone: "0912 890 123", status: "active", stageIds: ["المرحلة الثانوية"], classes: ["c-sec-2sci", "c-sec-3sci", "c-sec-1b"] },
  { id: "t7", name: "أ. خالد النعيم أحمد", employeeId: "T-107", subject: "علوم الحاسوب", phone: "0912 901 234", status: "active", stageIds: ["المرحلة الثانوية", "المرحلة المتوسطة"], classes: ["c-sec-1a", "c-sec-2sci", "c-sec-3sci", "c-mid-1"] },
  { id: "t8", name: "أ. إبراهيم فضل المولى", employeeId: "T-108", subject: "التاريخ والجغرافيا", phone: "0912 012 345", status: "active", stageIds: ["المرحلة الثانوية"], classes: ["c-sec-1b", "c-sec-2art", "c-sec-3art"] },

  // متوسط
  { id: "t9", name: "أ. كمال بشير مصطفى", employeeId: "T-201", subject: "الرياضيات", phone: "0923 111 222", status: "active", stageIds: ["المرحلة المتوسطة"], classes: ["c-mid-1", "c-mid-2", "c-mid-3"] },
  { id: "t10", name: "أ. ندى الصادق بابكر", employeeId: "T-202", subject: "العلوم العامة", phone: "0923 222 333", status: "active", stageIds: ["المرحلة المتوسطة"], classes: ["c-mid-1", "c-mid-2", "c-mid-3"] },
  { id: "t11", name: "أ. الأمين عبد القادر", employeeId: "T-203", subject: "التربية الإسلامية", phone: "0923 333 444", status: "active", stageIds: ["المرحلة المتوسطة", "مرحلة الأساس"], classes: ["c-mid-1", "c-mid-2", "c-mid-3", "c-pri-5", "c-pri-6"] },
  { id: "t12", name: "أ. عائشة محجوب حامد", employeeId: "T-204", subject: "اللغة العربية", phone: "0923 444 555", status: "active", stageIds: ["المرحلة المتوسطة"], classes: ["c-mid-1", "c-mid-2"] },

  // أساس
  { id: "t13", name: "أ. مريم يوسف الطاهر", employeeId: "T-301", subject: "معلم صف وتأسيس", phone: "0934 555 666", status: "active", stageIds: ["مرحلة الأساس"], classes: ["c-pri-1", "c-pri-2"] },
  { id: "t14", name: "أ. سفيان الهادي النور", employeeId: "T-302", subject: "الرياضيات والعلوم", phone: "0934 666 777", status: "active", stageIds: ["مرحلة الأساس"], classes: ["c-pri-3", "c-pri-4"] },
  { id: "t15", name: "أ. ستنا عبد الله أحمد", employeeId: "T-303", subject: "اللغة العربية والقرآن", phone: "0934 777 888", status: "active", stageIds: ["مرحلة الأساس"], classes: ["c-pri-3", "c-pri-4", "c-pri-5"] },
  { id: "t16", name: "أ. وليد الجيلي عمر", employeeId: "T-304", subject: "اللغة الإنجليزية", phone: "0934 888 999", status: "active", stageIds: ["مرحلة الأساس"], classes: ["c-pri-4", "c-pri-5", "c-pri-6"] },
  { id: "t17", name: "أ. نزار السر عبد الحي", employeeId: "T-305", subject: "العلوم والرياضيات", phone: "0934 999 000", status: "active", stageIds: ["مرحلة الأساس"], classes: ["c-pri-5", "c-pri-6"] },
];

// Helper to generate students
function generateStudents(): Student[] {
  const list: Student[] = [];
  const sudaneseNames = [
    { name: "أحمد محمد علي عبد الله", gender: "male" as const, parent: "محمد علي عبد الله", phone: "0912 111 234" },
    { name: "عمر طارق عثمان الطيب", gender: "male" as const, parent: "طارق عثمان الطيب", phone: "0912 222 345" },
    { name: "فاطمة الزهراء إدريس محمد", gender: "female" as const, parent: "إدريس محمد الفكي", phone: "0912 333 456" },
    { name: "آمنة الصادق البشير حسن", gender: "female" as const, parent: "الصادق البشير حسن", phone: "0912 444 567" },
    { name: "مصطفى عثمان تاج السر", gender: "male" as const, parent: "عثمان تاج السر", phone: "0912 555 678" },
    { name: "حسام الدين الفاتح إبراهيم", gender: "male" as const, parent: "الفاتح إبراهيم عمر", phone: "0912 666 789" },
    { name: "تسنيم الصديق بابكر أحمد", gender: "female" as const, parent: "الصديق بابكر أحمد", phone: "0912 777 890" },
    { name: "رزان مدثر سليمان علي", gender: "female" as const, parent: "مدثر سليمان علي", phone: "0912 888 901" },
    { name: "مازن خالد عبد الرحمن التوم", gender: "male" as const, parent: "خالد عبد الرحمن التوم", phone: "0912 999 012" },
    { name: "هبة الله النور إبراهيم يوسف", gender: "female" as const, parent: "النور إبراهيم يوسف", phone: "0913 111 222" },
  ];

  // We assign 8-10 students per class across all 15 classes
  let studentCounter = 1;

  for (const cls of classes) {
    const stagePrefix = cls.stageId === "مرحلة الأساس" ? "PRI" : cls.stageId === "المرحلة المتوسطة" ? "MID" : "SEC";
    const fees = cls.stageId === "مرحلة الأساس" ? 450000 : cls.stageId === "المرحلة المتوسطة" ? 600000 : 750000;

    for (let i = 0; i < 9; i++) {
      const template = sudaneseNames[(i + studentCounter) % sudaneseNames.length]!;
      const id = `s-${cls.id}-${i + 1}`;
      const academicId = `STD-${stagePrefix}-${String(1000 + studentCounter).padStart(4, "0")}`;

      list.push({
        id,
        name: template.name,
        academicId,
        classId: cls.id,
        parentName: template.parent,
        parentPhone: template.phone,
        totalFees: fees,
        status: "active",
        gender: template.gender,
        dateOfBirth: "2010-05-14",
        enrollmentDate: "2024-08-15",
      });
      studentCounter++;
    }
  }

  // Ensure default demo student exists with academicId STD-SEC-1001
  const demoStudent = list.find((s) => s.id === "s-c-sec-3sci-1");
  if (demoStudent) {
    demoStudent.id = "s-sec-1";
    demoStudent.academicId = "STD-SEC-1001";
    demoStudent.name = "أحمد محمد عبد الله (طالب تجريبي)";
  }

  return list;
}

export const students: Student[] = generateStudents();

// Generate Installments & Payments with varied completion (paid, partial, overdue)
function generateFinancials(stdList: Student[]) {
  const installments: Installment[] = [];
  const payments: Payment[] = [];
  let receiptCounter = 1500;

  for (let i = 0; i < stdList.length; i++) {
    const st = stdList[i]!;
    const a1 = Math.round(st.totalFees * 0.4);
    const a2 = Math.round(st.totalFees * 0.35);
    const a3 = st.totalFees - a1 - a2;

    installments.push(
      { id: `inst-${st.id}-1`, studentId: st.id, title: "القسط الأول (التسجيل والزي)", amount: a1, dueDate: "2025-09-15" },
      { id: `inst-${st.id}-2`, studentId: st.id, title: "القسط الثاني (منتصف العام)", amount: a2, dueDate: "2025-11-20" },
      { id: `inst-${st.id}-3`, studentId: st.id, title: "القسط الثالث (الختامي)", amount: a3, dueDate: "2026-03-01" },
    );

    // Distribution:
    // 40% full paid (a1 + a2 + a3)
    // 35% partial paid (a1 only, or a1 + half a2)
    // 25% overdue (0 or less than a1)
    if (i % 3 === 0) {
      // Completed paid
      payments.push({
        id: `pay-${st.id}-1`,
        studentId: st.id,
        amount: a1,
        date: "2025-09-10",
        method: "تحويل بنكي (بنكك)",
        receiptNo: `RC-2025-${receiptCounter++}`,
        transactionId: `TXN-882910${receiptCounter}`,
      });
      payments.push({
        id: `pay-${st.id}-2`,
        studentId: st.id,
        amount: a2 + a3,
        date: "2025-11-15",
        method: "نقداً بالمكتب المالي",
        receiptNo: `RC-2025-${receiptCounter++}`,
      });
    } else if (i % 3 === 1) {
      // Partial paid
      payments.push({
        id: `pay-${st.id}-1`,
        studentId: st.id,
        amount: a1,
        date: "2025-09-12",
        method: "تحويل بنكي (بنكك)",
        receiptNo: `RC-2025-${receiptCounter++}`,
        transactionId: `TXN-773412${receiptCounter}`,
      });
    } else {
      // Small or no payment (overdue)
      if (i % 6 === 2) {
        payments.push({
          id: `pay-${st.id}-1`,
          studentId: st.id,
          amount: Math.round(a1 * 0.5),
          date: "2025-09-20",
          method: "نقداً بالمكتب المالي",
          receiptNo: `RC-2025-${receiptCounter++}`,
        });
      }
    }
  }

  return { installments, payments };
}

const financials = generateFinancials(students);
export const installments: Installment[] = financials.installments;
export const payments: Payment[] = financials.payments;

// Generate Conflict-Free Timetable Slots
function generateSlots(): Slot[] {
  const slots: Slot[] = [];
  let slotCounter = 1;

  // Each class has its own room to guarantee NO room conflict:
  const roomMap: Record<string, string> = {
    "c-pri-1": "قاعة ١٠١ (أساس)",
    "c-pri-2": "قاعة ١٠٢ (أساس)",
    "c-pri-3": "قاعة ١٠٣ (أساس)",
    "c-pri-4": "قاعة ١٠٤ (أساس)",
    "c-pri-5": "قاعة ١٠٥ (أساس)",
    "c-pri-6": "قاعة ١٠٦ (أساس)",
    "c-mid-1": "قاعة ٢٠١ (متوسط)",
    "c-mid-2": "قاعة ٢٠٢ (متوسط)",
    "c-mid-3": "قاعة ٢٠٣ (متوسط)",
    "c-sec-1a": "قاعة ٣٠١ (ثانوي)",
    "c-sec-1b": "قاعة ٣٠٢ (ثانوي)",
    "c-sec-2sci": "قاعة ٣٠٣ (مختبر العلوم)",
    "c-sec-2art": "قاعة ٣٠٤ (ثانوي)",
    "c-sec-3sci": "قاعة ٣٠٥ (الشهادة السودانية)",
    "c-sec-3art": "قاعة ٣٠٦ (ثانوي)",
  };

  // We assign teachers so that at any given day & period, each teacher is teaching AT MOST ONE class.
  // Stage Primary teachers: t13, t14, t15, t16, t17 (5 teachers for 6 classes)
  // Stage Middle teachers: t9, t10, t11, t12, plus t2, t5, t7
  // Stage Secondary teachers: t1, t2, t3, t4, t5, t6, t7, t8
  // To strictly prevent conflict, we use an offset per class!
  const secClasses = ["c-sec-1a", "c-sec-1b", "c-sec-2sci", "c-sec-2art", "c-sec-3sci", "c-sec-3art"];
  const secTeachers = [
    { t: "t1", s: "الرياضيات" },
    { t: "t2", s: "اللغة العربية" },
    { t: "t3", s: "الفيزياء" },
    { t: "t4", s: "الكيمياء" },
    { t: "t5", s: "اللغة الإنجليزية" },
    { t: "t6", s: "الأحياء" },
    { t: "t7", s: "علوم الحاسوب" },
  ];

  const midClasses = ["c-mid-1", "c-mid-2", "c-mid-3"];
  const midTeachers = [
    { t: "t9", s: "الرياضيات" },
    { t: "t10", s: "العلوم العامة" },
    { t: "t11", s: "التربية الإسلامية" },
    { t: "t12", s: "اللغة العربية" },
    { t: "t5", s: "اللغة الإنجليزية" }, // shared
    { t: "t7", s: "علوم الحاسوب" }, // shared
    { t: "t2", s: "اللغة العربية" }, // shared
  ];

  const priClasses = ["c-pri-1", "c-pri-2", "c-pri-3", "c-pri-4", "c-pri-5", "c-pri-6"];
  const priTeachers = [
    { t: "t13", s: "معلم صف وتأسيس" },
    { t: "t14", s: "الرياضيات والعلوم" },
    { t: "t15", s: "اللغة العربية والقرآن" },
    { t: "t16", s: "اللغة الإنجليزية" },
    { t: "t17", s: "العلوم والرياضيات" },
    { t: "t11", s: "التربية الإسلامية" },
    { t: "t13", s: "أنشطة وقيم" },
  ];

  // Populate Secondary:
  for (let cIdx = 0; cIdx < secClasses.length; cIdx++) {
    const classId = secClasses[cIdx]!;
    const room = roomMap[classId]!;
    for (let day = 0; day < 5; day++) {
      for (let period = 1; period <= 7; period++) {
        // Teacher index offset by (period + day * 2 + cIdx) % secTeachers.length
        // Because cIdx is distinct and periods are distinct, teacher at (day, period) is distinct for each class!
        const teacherIndex = (period + day * 3 + cIdx) % secTeachers.length;
        const item = secTeachers[teacherIndex]!;
        slots.push({
          id: `sl-${slotCounter++}`,
          classId,
          day,
          period,
          subject: item.s,
          teacherId: item.t,
          room,
        });
      }
    }
  }

  // Populate Middle:
  for (let cIdx = 0; cIdx < midClasses.length; cIdx++) {
    const classId = midClasses[cIdx]!;
    const room = roomMap[classId]!;
    for (let day = 0; day < 5; day++) {
      for (let period = 1; period <= 7; period++) {
        const item = midTeachers[(period + day * 2 + cIdx) % midTeachers.length]!;
        // Make sure no collision with secondary for shared teachers (t5, t7, t2)
        // If collision, pick t9 or t10
        const isCollision = slots.some((s) => s.day === day && s.period === period && s.teacherId === item.t);
        const finalTeacher = isCollision ? (cIdx % 2 === 0 ? "t9" : "t10") : item.t;
        const finalSubject = finalTeacher === "t9" ? "الرياضيات" : finalTeacher === "t10" ? "العلوم العامة" : item.s;

        slots.push({
          id: `sl-${slotCounter++}`,
          classId,
          day,
          period,
          subject: finalSubject,
          teacherId: finalTeacher,
          room,
        });
      }
    }
  }

  // Populate Primary:
  for (let cIdx = 0; cIdx < priClasses.length; cIdx++) {
    const classId = priClasses[cIdx]!;
    const room = roomMap[classId]!;
    for (let day = 0; day < 5; day++) {
      for (let period = 1; period <= 7; period++) {
        const item = priTeachers[(period + day + cIdx) % priTeachers.length]!;
        const isCollision = slots.some((s) => s.day === day && s.period === period && s.teacherId === item.t);
        const finalTeacher = isCollision ? (cIdx % 2 === 0 ? "t13" : "t14") : item.t;
        const finalSubject = finalTeacher === "t13" ? "معلم صف وتأسيس" : finalTeacher === "t14" ? "الرياضيات والعلوم" : item.s;

        slots.push({
          id: `sl-${slotCounter++}`,
          classId,
          day,
          period,
          subject: finalSubject,
          teacherId: finalTeacher,
          room,
        });
      }
    }
  }

  return slots;
}

export const slots: Slot[] = generateSlots();

export const announcements: Announcement[] = [
  {
    id: "an-1",
    title: "بدء امتحانات منتصف الفصل الدراسي الأول",
    body: "تعلن إدارة مدرسة المنهل عن بدء جدول امتحانات منتصف الفصل الدراسي الأول لكافة المراحل يوم الأحد القادم. يرجى من جميع الطلاب الالتزام بالحضور المبكر.",
    category: "urgent",
    date: "2025-10-15T08:00:00Z",
    author: "إدارة المدرسة",
    audience: "all",
  },
  {
    id: "an-2",
    title: "ضوابط الزي المدرسي والانضباط العام",
    body: "حرصاً على المظهر التربوي اللائق، تؤكد إدارة المدرسة على الالتزام التام بالزي المدرسي الموحد والمحافظة على النظافة العامة والهدوء داخل الفصول والممرات.",
    category: "rules",
    date: "2025-09-20T09:30:00Z",
    author: "شؤون الطلاب",
    audience: "all",
  },
  {
    id: "an-3",
    title: "انطلاق فعاليات دوري كرة القدم والأنشطة الثقافية",
    body: "يسر قسم الأنشطة المدرسية الإعلان عن انطلاق فعاليات النشاط الرياضي والثقافي بين الفصول نهاية هذا الأسبوع تحت شعار 'العقل السليم في الجسم السليم'.",
    category: "activities",
    date: "2025-10-02T11:00:00Z",
    author: "قسم الأنشطة",
    audience: "all",
  },
];

export const homeworkList: Homework[] = [
  {
    id: "hw-1",
    classId: "c-sec-3sci",
    subject: "الرياضيات",
    title: "حل تمارين التفاضل والتكامل صفحة ٤٥",
    description: "إكمال حل المسائل من رقم ١ إلى ٨ مع التركيز على تطبيقات المشتقة الأولى في الحركة والقيم العظمى والصغرى.",
    dueDate: "2025-11-20",
    teacherId: "t1",
    kind: "homework",
    createdAt: "2025-11-10T10:00:00Z",
  },
  {
    id: "hw-2",
    classId: "c-sec-3sci",
    subject: "الفيزياء",
    title: "مذكرة قوانين الحركة الدائرية والجاذبية العامة",
    description: "ملخص شامل لجميع استنتاجات وقوانين الباب الثاني مع نماذج امتحانات الشهادة السودانية للسنوات السابقة.",
    dueDate: "2025-11-25",
    teacherId: "t3",
    kind: "notes",
    createdAt: "2025-11-12T12:00:00Z",
  },
];

export const gradesList: GradeEntry[] = [
  {
    id: "gr-1",
    studentId: "s-sec-1",
    classId: "c-sec-3sci",
    subject: "الرياضيات المتخصصة",
    academicYear: "2025-2026",
    term: "term_1",
    courseworkScore: 19,
    midtermScore: 19,
    finalScore: 56,
    totalScore: 94,
    letter: "أ+",
    notes: "أداء رياضي ممتاز ومتميز في التفكير المجرد",
    recordedBy: "د. طارق الجزولي",
    recordedAt: "2025-10-25T12:00:00Z",
  },
  {
    id: "gr-2",
    studentId: "s-sec-1",
    classId: "c-sec-3sci",
    subject: "الفيزياء",
    academicYear: "2025-2026",
    term: "term_1",
    courseworkScore: 18,
    midtermScore: 18,
    finalScore: 54,
    totalScore: 90,
    letter: "أ+",
    notes: "فهم دقيق للتجارب العملية واستنتاجات القوانين",
    recordedBy: "أ. عثمان عبد الرحيم",
    recordedAt: "2025-10-25T13:00:00Z",
  },
  {
    id: "gr-3",
    studentId: "s-sec-1",
    classId: "c-sec-3sci",
    subject: "الكيمياء",
    academicYear: "2025-2026",
    term: "term_1",
    courseworkScore: 17,
    midtermScore: 18,
    finalScore: 52,
    totalScore: 87,
    letter: "أ",
    notes: "تفاعل متميز في الحصص المعملية",
    recordedBy: "د. سارة التاج الفكي",
    recordedAt: "2025-10-26T10:00:00Z",
  },
];

export const behaviorRecords: BehaviorRecord[] = [
  {
    id: "bh-1",
    studentId: "s-sec-1",
    date: "2025-10-18",
    type: "positive",
    title: "إشادة بالتفوق وحسن الخلق",
    details: "إشادة خاصة من أساتذة المواد بالانضباط العالي والمبادرة في مساعدة زملائه داخل الفصل والمختبر.",
    recordedBy: "إدارة المرحلة الثانوية",
    term: "term_1",
  },
];

export const calendarEvents: CalendarEvent[] = [
  {
    id: "ev-1",
    title: "امتحان نصف الفصل الدراسي الأول - الرياضيات",
    date: "2025-11-22",
    time: "08:30 ص",
    type: "exam",
    classId: "all",
    subject: "الرياضيات",
  },
  {
    id: "ev-2",
    title: "المعرض العلمي والثقافي السنوي",
    date: "2025-12-05",
    time: "10:00 ص",
    type: "event",
    classId: "all",
  },
  {
    id: "ev-3",
    title: "عطلة ذكرى الاستقلال المجيدة",
    date: "2026-01-01",
    type: "holiday",
    classId: "all",
  },
];

export function createSeed(): SchoolState {
  const attendance: AttendanceRecord[] = [];
  const todayISO = toISODate(new Date());

  // Seed sample attendance for secondary and primary
  for (const st of students.slice(0, 40)) {
    attendance.push({
      date: todayISO,
      classId: st.classId,
      studentId: st.id,
      status: "present" as AttendanceStatus,
    });
  }

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
    admins,
    gradesList,
    behaviorRecords,
    installments,
    payments,
    announcements,
    slots,
    homework: homeworkList,
    completedHomework: [],
    attendance,
    events: calendarEvents,
    notifications: [],
    session: null,
  };
}
