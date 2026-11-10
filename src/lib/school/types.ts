export type Role = "student" | "teacher" | "admin";

export type StageId = "مرحلة الأساس" | "المرحلة المتوسطة" | "المرحلة الثانوية";
export type StageType = "primary" | "middle" | "secondary";
export type SectionGender = "boys" | "girls" | "mixed";
export type Term = "term_1" | "term_2";

export interface AcademicStage {
  id: StageId;
  name: StageId;
  code: StageType;
  order: number;
}

export interface AcademicSection {
  id: string;
  stageId: StageId;
  name: string;
  type: SectionGender;
}

export interface GradeLevel {
  id: string;
  stageId: StageId;
  name: string;
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
  name: string;
  short: string;
  stageId: StageId;
  sectionId?: string | undefined;
  gradeLevelId?: string | undefined;
  academicYear?: string | undefined;
  capacity: number;
}

export interface Student {
  id: string;
  name: string;
  academicId: string;
  classId: string;
  parentName: string;
  parentPhone: string;
  totalFees: number;
  status: "active" | "archived";
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
  status: "active" | "archived";
  classes?: string[] | undefined;
  stageIds?: StageId[] | undefined;
}

export interface Admin {
  id: string;
  name: string;
  username: string;
  title: string; // "مدير" | "حسابات" | "تسجيل"
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

export interface GradeEntry {
  id: string;
  studentId: string;
  classId: string;
  subject: string;
  academicYear: string;
  term: Term;
  courseworkScore: number; // أعمال السنة / الأنشطة (من 20)
  midtermScore: number; // اختبار منتصف الفصل (من 20)
  finalScore: number; // الامتحان النهائي (من 60)
  totalScore: number; // المجموع الكلي (100)
  letter: string; // أ+، أ، ب+، ب، ج، هـ
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
  readBy: string[];
}

export interface Session {
  role: Role;
  userId: string;
  stageId: StageId;
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
  admins: Admin[];
  gradesList: GradeEntry[];
  behaviorRecords: BehaviorRecord[];
  installments: Installment[];
  payments: Payment[];
  announcements: Announcement[];
  slots: Slot[];
  homework: Homework[];
  completedHomework: string[];
  attendance: AttendanceRecord[];
  events: CalendarEvent[];
  notifications: AppNotification[];
  session: Session | null;
}
