export type Role = "student" | "teacher" | "admin";

export interface SchoolClass {
  id: string;
  name: string; // e.g. الصف الثالث الثانوي - أ
  short: string; // e.g. ٣ أ
  stage: string;
}

export interface Student {
  id: string;
  name: string;
  academicId: string;
  classId: string;
  parentName: string;
  parentPhone: string;
  totalFees: number;
}

export interface Teacher {
  id: string;
  name: string;
  employeeId: string;
  subject: string;
  phone: string;
  classes?: string[];
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
}

export type ReceiptStatus = "pending" | "approved" | "rejected";

export interface Receipt {
  id: string;
  studentId: string;
  reference: string;
  amount: number;
  image?: string; // data URL
  note?: string;
  status: ReceiptStatus;
  submittedAt: string; // ISO
  reviewedAt?: string;
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
  time?: string;
  type: "exam" | "event" | "holiday";
  classId: "all" | string;
  subject?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  to: Role | "all";
  toUserId?: string;
  link?: string;
  readBy: string[]; // user ids
}

export interface Session {
  role: Role;
  userId: string;
}

export interface SchoolState {
  version: number;
  classes: SchoolClass[];
  students: Student[];
  teachers: Teacher[];
  admins: Admin[];
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
