export type Role = "student" | "teacher" | "admin";
export type StageId = "stg-pri" | "stg-mid" | "stg-sec";
export type StageType = "primary" | "middle" | "secondary";
export type SectionGender = "boys" | "girls" | "mixed";
export type Term = "term_1" | "term_2";

export interface AcademicStage {
  id: StageId;
  name: string;
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
  year: string;
  name: string;
  currentTerm: Term;
  isCurrent: boolean;
  terms: { term: Term; name: string; startDate: string; endDate: string }[];
}
export interface SchoolClass {
  id: string;
  name: string;
  short: string;
  stage: string;
  stageId?: StageId | undefined;
  sectionId?: string | undefined;
  gradeLevelId?: string | undefined;
  academicYear?: string | undefined;
  capacity?: number | undefined;
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
  gender?: "male" | "female" | undefined;
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
  stageIds?: StageId[] | undefined;
  status: "active" | "archived";
}
export interface Admin {
  id: string;
  name: string;
  username: string;
  title: "مدير" | "حسابات" | "تسجيل";
}
export interface Installment {
  id: string;
  studentId: string;
  title: string;
  amount: number;
  dueDate: string;
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
  courseworkScore: number;
  midtermScore: number;
  finalScore: number;
  totalScore: number;
  letter: string;
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
  date: string;
  author: string;
  audience: "all" | string;
}
export interface Slot {
  id: string;
  classId: string;
  day: number;
  period: number;
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
