import { toISODate } from "./logic";
import type {
  Announcement,
  AttendanceRecord,
  AttendanceStatus,
  CalendarEvent,
  Homework,
  Installment,
  Payment,
  Receipt,
  SchoolClass,
  SchoolState,
  Slot,
  Student,
  Teacher,
} from "./types";

export const SEED_VERSION = 2;

export const DEMO = {
  student: { academicId: "MNH-2026-0314", id: "s1" },
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

export const classes: SchoolClass[] = [
  { id: "c1a", name: "الصف الأول الثانوي - فصل (أ)", short: "١ أ", stage: "المرحلة الثانوية" },
  { id: "c1b", name: "الصف الأول الثانوي - فصل (ب)", short: "١ ب", stage: "المرحلة الثانوية" },
  { id: "c2a", name: "الصف الثاني الثانوي - فصل (أ)", short: "٢ أ", stage: "المرحلة الثانوية" },
  { id: "c2b", name: "الصف الثاني الثانوي - فصل (ب)", short: "٢ ب", stage: "المرحلة الثانوية" },
  { id: "c3a", name: "الصف الثالث الثانوي - علمي", short: "٣ علمي", stage: "المرحلة الثانوية" },
  { id: "c3b", name: "الصف الثالث الثانوي - أدبي", short: "٣ أدبي", stage: "المرحلة الثانوية" },
];

export const teachers: Teacher[] = [
  { id: "t1", name: "أ. فاطمة الزين إبراهيم", employeeId: "T-101", subject: "الرياضيات", phone: "0912 345 101", classes: ["c3a", "c2a", "c1a"] },
  { id: "t2", name: "أ. محمد عثمان علي", employeeId: "T-102", subject: "الفيزياء", phone: "0912 345 102", classes: ["c3a", "c2a"] },
  { id: "t3", name: "أ. سارة إبراهيم خليل", employeeId: "T-103", subject: "الكيمياء", phone: "0912 345 103", classes: ["c3a", "c2a"] },
  { id: "t4", name: "أ. عبدالرحيم حسن بشير", employeeId: "T-104", subject: "اللغة العربية", phone: "0912 345 104", classes: ["c3a", "c3b", "c2a", "c2b", "c1a", "c1b"] },
  { id: "t5", name: "أ. هالة يوسف الصادق", employeeId: "T-105", subject: "اللغة الإنجليزية", phone: "0912 345 105", classes: ["c3a", "c3b", "c2a", "c2b", "c1a", "c1b"] },
  { id: "t6", name: "أ. الطيب أحمد الفكي", employeeId: "T-106", subject: "التربية الإسلامية", phone: "0912 345 106", classes: ["c3a", "c3b", "c2a", "c2b", "c1a", "c1b"] },
  { id: "t7", name: "أ. منى صالح كباشي", employeeId: "T-107", subject: "الأحياء", phone: "0912 345 107", classes: ["c3a", "c2a"] },
  { id: "t8", name: "أ. خالد بشير النعيم", employeeId: "T-108", subject: "علوم الحاسوب", phone: "0912 345 108", classes: ["c1a", "c1b", "c2a", "c2b"] },
  { id: "t9", name: "أ. عادل عبدالسلام بابكر", employeeId: "T-109", subject: "التاريخ", phone: "0912 345 109", classes: ["c3b", "c2b", "c1a", "c1b"] },
  { id: "t10", name: "أ. ليلى ميرغني طه", employeeId: "T-110", subject: "الجغرافيا", phone: "0912 345 110", classes: ["c3b", "c2b", "c1a", "c1b"] },
  { id: "t11", name: "أ. عمر فاروق صديق", employeeId: "T-111", subject: "الرياضيات الأساسية", phone: "0912 345 111", classes: ["c3b", "c2b", "c1b"] },
];

interface RawStudentSeed {
  classId: string;
  name: string;
  parentName: string;
  phone: string;
  feeStatus: "full" | "partial" | "overdue" | "pending_receipt";
}

const rawStudents: RawStudentSeed[] = [
  // الصف الثالث الثانوي - علمي (c3a)
  { classId: "c3a", name: "أحمد محمد عبدالله", parentName: "محمد عبدالله أحمد", phone: "0912 777 314", feeStatus: "partial" },
  { classId: "c3a", name: "مريم الطيب حسن", parentName: "الطيب حسن عمر", phone: "0912 710 310", feeStatus: "pending_receipt" },
  { classId: "c3a", name: "يوسف عثمان إبراهيم", parentName: "عثمان إبراهيم داؤود", phone: "0912 711 311", feeStatus: "full" },
  { classId: "c3a", name: "آمنة خالد بابكر", parentName: "خالد بابكر عبدالمجيد", phone: "0912 712 312", feeStatus: "overdue" },
  { classId: "c3a", name: "عمر صلاح الدين النور", parentName: "صلاح الدين النور", phone: "0912 713 313", feeStatus: "partial" },

  // الصف الثالث الثانوي - أدبي (c3b)
  { classId: "c3b", name: "إبراهيم آدم موسى", parentName: "آدم موسى يعقوب", phone: "0922 414 314", feeStatus: "full" },
  { classId: "c3b", name: "هبة عوض الكريم حامد", parentName: "عوض الكريم حامد", phone: "0922 415 315", feeStatus: "pending_receipt" },
  { classId: "c3b", name: "مصعب ياسر مصطفى", parentName: "ياسر مصطفى محجوب", phone: "0922 416 316", feeStatus: "overdue" },
  { classId: "c3b", name: "نسيبة الفاتح عمر", parentName: "الفاتح عمر الصديق", phone: "0922 417 317", feeStatus: "partial" },
  { classId: "c3b", name: "معاذ بكري سعيد", parentName: "بكري سعيد جاد الله", phone: "0922 418 318", feeStatus: "full" },

  // الصف الثاني الثانوي - فصل أ (c2a)
  { classId: "c2a", name: "لينا عادل محجوب", parentName: "عادل محجوب كمال", phone: "0991 519 319", feeStatus: "full" },
  { classId: "c2a", name: "حسام الدين طارق حسن", parentName: "طارق حسن ميرغني", phone: "0991 520 320", feeStatus: "partial" },
  { classId: "c2a", name: "رنا عبدالعزيز يحيى", parentName: "عبدالعزيز يحيى حمد", phone: "0991 521 321", feeStatus: "pending_receipt" },
  { classId: "c2a", name: "أنس مجدي الطاهر", parentName: "مجدي الطاهر يوسف", phone: "0991 522 322", feeStatus: "overdue" },
  { classId: "c2a", name: "دعاء سيف الدين عثمان", parentName: "سيف الدين عثمان علي", phone: "0991 523 323", feeStatus: "full" },

  // الصف الثاني الثانوي - فصل ب (c2b)
  { classId: "c2b", name: "مؤيد الرشيد الطيب", parentName: "الرشيد الطيب عمر", phone: "0966 624 324", feeStatus: "partial" },
  { classId: "c2b", name: "دانية كمال عبداللطيف", parentName: "كمال عبداللطيف حمد", phone: "0966 625 325", feeStatus: "full" },
  { classId: "c2b", name: "صهيب نبيل محمد", parentName: "نبيل محمد سليمان", phone: "0966 626 326", feeStatus: "overdue" },
  { classId: "c2b", name: "شهد أمين الفضل", parentName: "أمين الفضل إدريس", phone: "0966 627 327", feeStatus: "partial" },
  { classId: "c2b", name: "مازن الهادي عبدالكريم", parentName: "الهادي عبدالكريم فضل", phone: "0966 628 328", feeStatus: "full" },

  // الصف الأول الثانوي - فصل أ (c1a)
  { classId: "c1a", name: "زياد هشام عباس", parentName: "هشام عباس أحمد", phone: "0912 829 329", feeStatus: "full" },
  { classId: "c1a", name: "ملاذ عصام الدين فضل", parentName: "عصام الدين فضل", phone: "0912 830 330", feeStatus: "pending_receipt" },
  { classId: "c1a", name: "عبدالله وليد البدوي", parentName: "وليد البدوي إبراهيم", phone: "0912 831 331", feeStatus: "overdue" },
  { classId: "c1a", name: "تسنيم أسامة الجزولي", parentName: "أسامة الجزولي عثمان", phone: "0912 832 332", feeStatus: "partial" },
  { classId: "c1a", name: "بكري محمد الحسن السماني", parentName: "محمد الحسن السماني", phone: "0912 833 333", feeStatus: "full" },

  // الصف الأول الثانوي - فصل ب (c1b)
  { classId: "c1b", name: "سارة جلال الدين صديق", parentName: "جلال الدين صديق", phone: "0922 934 334", feeStatus: "full" },
  { classId: "c1b", name: "منتصر فيصل مبارك", parentName: "فيصل مبارك أحمد", phone: "0922 935 335", feeStatus: "partial" },
  { classId: "c1b", name: "وفاق النور مأمون", parentName: "النور مأمون بشير", phone: "0922 936 336", feeStatus: "overdue" },
  { classId: "c1b", name: "لؤي حيدر عبدالباقي", parentName: "حيدر عبدالباقي حسن", phone: "0922 937 337", feeStatus: "pending_receipt" },
  { classId: "c1b", name: "إسراء تاج السر عثمان", parentName: "تاج السر عثمان علي", phone: "0922 938 338", feeStatus: "full" },
];

const feesByClass: Record<string, number> = {
  c1a: 800000,
  c1b: 800000,
  c2a: 850000,
  c2b: 850000,
  c3a: 900000,
  c3b: 900000,
};

function roomFor(subject: string, classId: string) {
  if (subject === "علوم الحاسوب") return "معمل الحاسوب";
  if (["الفيزياء", "الكيمياء", "الأحياء"].includes(subject)) return "المختبر العلمي";
  const map: Record<string, string> = {
    c1a: "قاعة 101",
    c1b: "قاعة 102",
    c2a: "قاعة 201",
    c2b: "قاعة 202",
    c3a: "قاعة 301 (علمي)",
    c3b: "قاعة 302 (أدبي)",
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
    const isDemo = idx === 0;
    const id = isDemo ? DEMO.student.id : `s-${raw.classId}-${idx + 1}`;
    const academicId = isDemo ? DEMO.student.academicId : `MNH-2026-0${314 + idx}`;
    return {
      id,
      name: raw.name,
      academicId,
      classId: raw.classId,
      parentName: raw.parentName,
      parentPhone: raw.phone,
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
        { id: `pay-${s.id}-2`, studentId: s.id, amount: a2, date: rel(-20), method: "تحويل بنكي - بنكك", receiptNo: `RC-2026-${1101 + idx * 3}` },
        { id: `pay-${s.id}-3`, studentId: s.id, amount: a3, date: rel(-5), method: "تحويل بنكي - فوري", receiptNo: `RC-2026-${1102 + idx * 3}` },
      );
    } else if (raw.feeStatus === "partial") {
      payments.push(
        { id: `pay-${s.id}-1`, studentId: s.id, amount: a1, date: rel(-55), method: "نقداً - خزينة المدرسة", receiptNo: `RC-2026-${1200 + idx * 3}` },
      );
    } else if (raw.feeStatus === "overdue") {
      // no payments recorded or minimal payment overdue
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
        amount: a2,
        note: `سداد القسط الثاني عن طريق بنكك لحساب الطالب ${s.name}`,
        status: "pending",
        submittedAt: relTime(-1, 18),
      });
    }
  });

  // Approved receipt example for demo student
  receipts.push({
    id: "rc-demo-approved",
    studentId: "s1",
    reference: "BOK-77120455",
    amount: 150000,
    note: "سداد دفعة جزئية من القسط الثاني",
    status: "approved",
    submittedAt: relTime(-18, 14),
    reviewedAt: relTime(-17, 10),
  });

  // Timetable Slots: Distributed carefully for all 6 classes
  const slots: Slot[] = [];
  classes.forEach((c, ci) => {
    // Subject pool tailored per track
    const isScientific = c.id === "c3a" || c.id === "c2a";
    const isLiterary = c.id === "c3b" || c.id === "c2b";

    let availableTeachers = teachers;
    if (isScientific) {
      availableTeachers = teachers.filter((t) => !["التاريخ", "الجغرافيا"].includes(t.subject));
    } else if (isLiterary) {
      availableTeachers = teachers.filter((t) => !["الفيزياء", "الكيمياء", "الأحياء"].includes(t.subject));
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
      title: "جدول امتحانات منتصف الفصل الدراسي الأول لجميع الفصول",
      body: "تبدأ امتحانات منتصف الفصل الدراسي الأول يوم الأحد القادم لكافة الفصول الثانوية. يرجى من جميع الطلاب الالتزام بالحضور قبل موعد الامتحان بـ 15 دقيقة وإحضار الأدوات الهندسية اللازمة.",
      category: "urgent",
      date: relTime(-1, 8),
      author: "إدارة الشؤون الأكاديمية",
      audience: "all",
    },
    {
      id: "an-2",
      title: "تذكير هام بموعد استحقاق القسط الثاني للرسوم",
      body: "تهيب الإدارة المالية بأولياء الأمور الكرام سرعة سداد القسط الثاني قبل نهاية الأسبوع القادم. يمكن إرفاق إشعار التحويل البنكي بسهولة عبر بوابة الرسوم في التطبيق ليتم اعتماده وتحديث الحساب.",
      category: "urgent",
      date: relTime(-2, 10),
      author: "الشؤون المالية",
      audience: "all",
    },
    {
      id: "an-3",
      title: "لائحة الزي المدرسي والمظهر العام",
      body: "يلتزم الطلاب بارتداء الزي المدرسي الرسمي طوال أيام الأسبوع: القميص الأبيض والبنطال الكحلي للبنين، والزي الكحلي مع الطرحة البيضاء للبنات. لن يُسمح بالدخول بأي ملابس مخالفة.",
      category: "rules",
      date: relTime(-30, 9),
      author: "إدارة شؤون الطلاب",
      audience: "all",
    },
    {
      id: "an-4",
      title: "ضوابط الحضور الصباحي والغياب",
      body: "يبدأ الطابور الصباحي في تمام 7:30 صباحاً. يعتبر الطالب متأخراً بعد 7:45، وتكرار التأخير 3 مرات يعرض الطالب للإنذار واستدعاء ولي الأمر. الحضور بنسبة 85% شرط أساسي لدخول الامتحانات النهائية.",
      category: "rules",
      date: relTime(-29, 10),
      author: "إدارة المدرسة",
      audience: "all",
    },
    {
      id: "an-5",
      title: "سياسة استخدام الهواتف والأجهزة الذكية",
      body: "يُحظر منعاً باتاً استخدام الهواتف الذكية داخل القاعات الدراسية والمعامل. تسلّم الهواتف لمشرف الدور في بداية اليوم الدراسي وتُستلم عند نهاية الحصة السابعة.",
      category: "rules",
      date: relTime(-28, 9),
      author: "لجنة الانضباط المدرسي",
      audience: "all",
    },
    {
      id: "an-6",
      title: "انطلاق فعاليات المعرض العلمي والثقافي السنوي",
      body: "تدعو إدارة الأنشطة جميع الطلاب للمشاركة في المعرض العلمي لهذا العام بمشاريع الابتكار والتجارب المعملية. تسلم المشاريع لأساتذة المواد العلمية وستمنح المدرسة جوائز قيمة للمراكز الثلاثة الأولى.",
      category: "activities",
      date: relTime(-3, 11),
      author: "قسم النشاط الطلابي",
      audience: "all",
    },
    {
      id: "an-7",
      title: "مسابقة المنهل الكبرى لحفظ القرآن الكريم وتجويده",
      body: "تعلن المدرسة عن بدء التسجيل في مسابقة القرآن الكريم السنوية في أفرع: القرآن كاملاً، نصف القرآن، وخمسة أجزاء. التصفيات الأولية تبدأ مطلع الشهر القادم بإشراف أ. الطيب أحمد.",
      category: "activities",
      date: relTime(-4, 9),
      author: "أسرة التربية الإسلامية",
      audience: "all",
    },
    {
      id: "an-8",
      title: "حصة مراجعة مكثفة في مادة الكيمياء لطلاب الثالث علمي",
      body: "تقرر عقد حصة تقوية ومراجعة عامة في الكيمياء العضوية يوم الأربعاء القادم في المختبر العلمي من الساعة 1:30 حتى 3:00 عصراً مع أ. سارة إبراهيم.",
      category: "general",
      date: relTime(-1, 13),
      author: "أ. سارة إبراهيم",
      audience: "c3a",
    },
  ];

  const homework: Homework[] = [
    { id: "hw-1", classId: "c3a", subject: "الرياضيات", title: "تمارين التفاضل وحساب النهايات - الوحدة الثالثة", description: "حل التمارين من رقم 1 إلى 15 صفحة 84 من الكتاب المقرر مع كتابة الخطوات التفصيلية لكل مسألة.", dueDate: rel(2), teacherId: "t1", kind: "homework", createdAt: relTime(-2) },
    { id: "hw-2", classId: "c3a", subject: "الفيزياء", title: "تقرير تجربة تحقيق قانون أوم والمقاومة النوعية", description: "إعداد تقرير معملي يشمل جدول القراءات، الرسم البياني لعلاقة الجهد بالتيار، وحساب قيمة المقاومة المجهولة ونسبة الخطأ.", dueDate: rel(4), teacherId: "t2", kind: "homework", createdAt: relTime(-3) },
    { id: "hw-3", classId: "c3a", subject: "الكيمياء", title: "مسائل الاتزان الكيميائي وقاعدة لوشاتيليه", description: "إجابة أسئلة الفصل الرابع صفحة 112 الخاصة بحساب ثابت الاتزان وتأثير الضغط ودرجة الحرارة على موضع الاتزان.", dueDate: rel(3), teacherId: "t3", kind: "homework", createdAt: relTime(-1) },
    { id: "hw-4", classId: "c3b", subject: "اللغة العربية", title: "تحليل وتذوق نصوص من الأدب الحديث", description: "استخراج الصور البلاغية والمحسنات البديعية وتحديد العاطفة المسيطرة على الشاعر في الأبيات المقررة.", dueDate: rel(3), teacherId: "t4", kind: "homework", createdAt: relTime(-2) },
    { id: "hw-5", classId: "c3b", subject: "التاريخ", title: "بحث موجز: الثورة المهدية وأثرها في تاريخ السودان", description: "كتابة بحث من صفحتين يستعرض مراحل الثورة المهدية ومعركة شيكان وتأسيس الدولة المهدية.", dueDate: rel(5), teacherId: "t9", kind: "homework", createdAt: relTime(-1) },
    { id: "hw-6", classId: "c2a", subject: "الرياضيات", title: "تمارين المتتابعات الحسابية والهندسية", description: "حل الأسئلة من 1 إلى 12 صفحة 65.", dueDate: rel(2), teacherId: "t1", kind: "homework", createdAt: relTime(-1) },
    { id: "hw-7", classId: "c1a", subject: "اللغة الإنجليزية", title: "Essay: Environmental Protection and Recycling", description: "Write a coherent 180-word paragraph detailing how individuals and communities can combat pollution.", dueDate: rel(4), teacherId: "t5", kind: "homework", createdAt: relTime(-2) },
    { id: "hw-8", classId: "c3a", subject: "الرياضيات", title: "مذكرة قواعد الاشتقاق وقاعدة السلسلة", description: "ملخص شامل لقواعد الاشتقاق الأساسية:\n1) مشتقة الثابت = 0\n2) مشتقة س^ن = ن س^(ن-1)\n3) مشتقة حاصل الضرب: (ع × ص)' = ع' ص + ع ص'\n4) مشتقة خارج القسمة: (ع / ص)' = (ع' ص - ع ص') / ص²\n5) قاعدة السلسلة: د(ع(ص(س)))/دس = ع'(ص) × ص'(س)", dueDate: rel(30), teacherId: "t1", kind: "notes", createdAt: relTime(-7) },
    { id: "hw-9", classId: "c3a", subject: "الأحياء", title: "ملخص قوانين مندل والوراثة الجزيئية", description: "مذكرة مبسطة تشرح قانون الانعزال وقانون التوزيع الحر مع أمثلة عملية ومربعات بانيت لحساب النسب المظهرية والجينية.", dueDate: rel(30), teacherId: "t7", kind: "notes", createdAt: relTime(-8) },
    { id: "hw-10", classId: "c3b", subject: "الجغرافيا", title: "مذكرة حوض النيل والموارد المائية بالسودان", description: "دراسة جغرافية متكاملة لروافد نهر النيل، السدود الكبرى، والمشاريع الزراعية القائمة على الري الفيضي والانسيابي.", dueDate: rel(30), teacherId: "t10", kind: "notes", createdAt: relTime(-6) },
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
    { id: "ev-1", title: "اجتماع مجلس الآباء والمعلمين الدوري", date: rel(5), time: "10:00 ص", type: "event", classId: "all" },
    { id: "ev-2", title: "امتحان منتصف الفصل - الرياضيات", date: rel(9), time: "08:00 ص", type: "exam", classId: "c3a", subject: "الرياضيات" },
    { id: "ev-3", title: "امتحان منتصف الفصل - الفيزياء", date: rel(11), time: "08:00 ص", type: "exam", classId: "c3a", subject: "الفيزياء" },
    { id: "ev-4", title: "امتحان منتصف الفصل - الكيمياء", date: rel(13), time: "08:00 ص", type: "exam", classId: "c3a", subject: "الكيمياء" },
    { id: "ev-5", title: "امتحان منتصف الفصل - التاريخ", date: rel(9), time: "08:00 ص", type: "exam", classId: "c3b", subject: "التاريخ" },
    { id: "ev-6", title: "امتحان منتصف الفصل - الجغرافيا", date: rel(11), time: "08:00 ص", type: "exam", classId: "c3b", subject: "الجغرافيا" },
    { id: "ev-7", title: "المعرض العلمي والثقافي السنوي", date: rel(18), time: "09:00 ص", type: "event", classId: "all" },
    { id: "ev-8", title: "اليوم الرياضي والماراثون المدرسي", date: rel(25), time: "08:00 ص", type: "event", classId: "all" },
    { id: "ev-9", title: "عطلة عيد الاستقلال المجيد", date: rel(45), type: "holiday", classId: "all" },
    { id: "ev-10", title: "انطلاق الامتحانات النهائية للفصل الدراسي الأول", date: rel(50), time: "08:00 ص", type: "exam", classId: "all" },
  ];

  return {
    version: SEED_VERSION,
    classes,
    students,
    teachers,
    admins: [{ id: "a1", name: "أ. عثمان الطيب", username: "admin", title: "مدير المدرسة" }],
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
      { id: "nt-2", title: "تذكير بالقسط الثاني", body: "موعد سداد القسط الثاني خلال الأسبوعين القادمين", date: relTime(-2, 10), to: "student", link: "/app/fees", readBy: [] },
      { id: "nt-3", title: "إشعارات سداد بانتظار الاعتماد", body: "تم تقديم إشعارات دفع جديدة عبر بنكك تحتاج إلى مراجعة", date: relTime(-1, 20), to: "admin", link: "/app/fees", readBy: [] },
      { id: "nt-4", title: "تذكير برصد الغياب اليومي", body: "يرجى من أساتذة الحصص رصد الحضور إلكترونياً قبل نهاية الدوام", date: relTime(0, 7), to: "teacher", link: "/app/attendance", readBy: [] },
      { id: "nt-5", title: "جدول امتحانات منتصف الفصل", body: "تم نشر الجدول التفصيلي لامتحانات منتصف الفصل في التقويم المدرسي", date: relTime(-1, 8), to: "all", link: "/app/calendar", readBy: [] },
    ],
    session: null,
  };
}
