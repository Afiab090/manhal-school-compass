export type Role = "student" | "teacher" | "admin" | "parent";

export type StageType = "primary" | "middle" | "secondary";
export type SectionGender = "boys" | "girls" | "mixed";
export type Term = "term_1" | "term_2";

export interface AcademicStage {
  id: string;
  name: string; // e.g. المرحلة الثانوية، المرحلة المتوسطة، المرحلة الابتدائية
  code: StageType;
  order: number;
}

export interface AcademicSection {
  id: string;
  stageId: string;
  name: string; // e.g. بنين، بنات
  type: SectionGender;
}

export interface GradeLevel {
  id: string;
  stageId: string;
  name: string; // e.g. الصف الأول الثانوي، الصف الثالث الابتدائي
  levelNumber: number;
}

export interface AcademicYearConfig {
  id: string;
  year: string; // "2025-2026"
  name: string; // "العام الدراسي ٢٠٢٥ - ٢٠٢٦"
  currentTerm: Term;
  isCurrent: boolean;
  terms: {
    term: Term;
    name: string;
    startDate: string;
    endDate: string;
  }[];
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. الصف الثالث الثانوي - علمي (أ)
  short: string; // e.g. ٣ علمي أ
  stage: string; // e.g. المرحلة الثانوية (kept for backwards compatibility)
  stageId?: string | undefined;
  sectionId?: string | undefined;
  gradeLevelId?: string | undefined;
  academicYear?: string | undefined;
  capacity?: number | undefined;
}

export interface Parent {
  id: string;
  name: string;
  nationalId: string; // الرقم الوطني أو رقم الهوية
  phone: string;
  email?: string | undefined;
  studentIds: string[]; // قائمة الأبناء المربوطين بحسابه
  relationship: "father" | "mother" | "guardian";
}

export interface Student {
  id: string;
  name: string;
  academicId: string;
  classId: string;
  parentId?: string | undefined;
  parentName: string;
  parentPhone: string;
  totalFees: number;
  gender?: ("male" | "female") | undefined;
  dateOfBirth?: string | undefined;
  enrollmentDate?: string | undefined;
}

export interface Teacher {
  id: string;
  name: string;
  employeeId: string;
  subject: string;
  phone: string;
  classes?: string[] | undefined;
  stageIds?: string[] | undefined;
}

export interface Admin {
  id: string;
  name: string;
  username: string;
  title: string;
}

export interface Installment {
  id: string;
  studentId: string;
  title: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  method: string;
  receiptNo: string;
  transactionId?: string | undefined;
}

export type ReceiptStatus = "pending" | "approved" | "rejected";
export type ReceiptAuditStatus = "unverified" | "under_review" | "verified_match" | "discrepancy";

export interface Receipt {
  id: string;
  studentId: string;
  reference: string;
  transactionId?: string | undefined; // رقم العملية المرجعي الرسمي لتطبيق بنكك (Transaction ID)
  bankName?: string | undefined; // e.g. "بنكك (بنك الخرطوم)", "فوري (بنك فيصل)"
  senderAccount?: string | undefined; // حساب أو هاتف المرسل
  amount: number;
  image?: string | undefined; // data URL
  note?: string | undefined;
  status: ReceiptStatus;
  auditStatus?: ReceiptAuditStatus | undefined; // حالة التدقيق والمطابقة المصرفية
  auditNotes?: string | undefined;
  auditedBy?: string | undefined;
  submittedAt: string; // ISO
  reviewedAt?: string | undefined;
}

export interface GradeEntry {
  id: string;
  studentId: string;
  classId: string;
  subject: string;
  academicYear: string;
  term: Term;
  courseworkScore: number; // أعمال السنة / الأنشطة (مثلاً من 20)
  midtermScore: number; // اختبار منتصف الفصل (مثلاً من 20)
  finalScore: number; // الامتحان النهائي (مثلاً من 60)
  totalScore: number; // المجموع الكلي (100)
  letter: string; // أ، ب، ج، د، هـ
  notes?: string | undefined;
  recordedBy?: string | undefined;
  recordedAt: string;
}

export interface BehaviorRecord {
  id: string;
  studentId: string;
  date: string;
  type: "positive" | "guidance" | "infraction";
  title: string;
  details: string;
  recordedBy: string;
  term: Term;
}

export type AnnouncementCategory = "urgent" | "rules" | "activities" | "general";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  date: string; // ISO
  author: string;
  audience: "all" | string; // "all" or classId
}

export interface Slot {
  id: string;
  classId: string;
  day: number; // 0 = الأحد ... 4 = الخميس
  period: number; // 1..7
  subject: string;
  teacherId: string;
  room: string;
}

export interface Homework {
  id: string;
  classId: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  teacherId: string;
  kind: "homework" | "notes";
  createdAt: string;
}

export type AttendanceStatus = "present" | "absent" | "late";

export interface AttendanceRecord {
  date: string;
  classId: string;
  studentId: string;
  status: AttendanceStatus;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string | undefined;
  type: "exam" | "event" | "holiday";
  classId: "all" | string;
  subject?: string | undefined;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  to: Role | "all";
  toUserId?: string | undefined;
  link?: string | undefined;
  readBy: string[]; // user ids
}

export interface Session {
  role: Role;
  userId: string;
  activeChildId?: string | undefined; // للتحكم بالابن المحدد لحساب ولي الأمر
}

export interface SchoolState {
  version: number;
  academicYears: AcademicYearConfig[];
  currentAcademicYear: string;
  currentTerm: Term;
  stages: AcademicStage[];
  sections: AcademicSection[];
  grades: GradeLevel[];
  classes: SchoolClass[];
  students: Student[];
  teachers: Teacher[];
  parents: Parent[];
  admins: Admin[];
  gradesList: GradeEntry[];
  behaviorRecords: BehaviorRecord[];
  installments: Installment[];
  payments: Payment[];
  receipts: Receipt[];
  announcements: Announcement[];
  slots: Slot[];
  homework: Homework[];
  completedHomework: string[]; // `${studentId}:${homeworkId}`
  attendance: AttendanceRecord[];
  events: CalendarEvent[];
  notifications: AppNotification[];
  session: Session | null;
}
