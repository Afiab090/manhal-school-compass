import { Award, BookOpen, CalendarDays, ClipboardCheck, GraduationCap, Home, Megaphone, Users, Wallet, type LucideIcon } from "lucide-react";
import type { Role } from "@/lib/school/types";

export type AppPath = "/app" | "/app/grades" | "/app/schedule" | "/app/fees" | "/app/notices" | "/app/profile" | "/app/homework" | "/app/attendance" | "/app/calendar" | "/app/students" | "/app/teachers" | "/app/timetables";
export interface NavItem { to: AppPath; tab?: string; label: string; icon: LucideIcon; }
export interface NavCategory { title: string; items: NavItem[]; }
export const navItems = {
  home: { to: "/app" as AppPath, label: "الرئيسية", icon: Home },
  grades: { to: "/app/grades" as AppPath, label: "كشف الدرجات والشهادات", icon: Award },
  schedule: { to: "/app/schedule" as AppPath, label: "الجداول الدراسية", icon: CalendarDays },
  calendar: { to: "/app/calendar" as AppPath, label: "التقويم والامتحانات", icon: CalendarDays },
  homework: { to: "/app/homework" as AppPath, label: "الواجبات والدروس", icon: BookOpen },
  attendance: { to: "/app/attendance" as AppPath, label: "متابعة الحضور", icon: ClipboardCheck },
  fees: { to: "/app/fees" as AppPath, label: "كشف الرسوم", icon: Wallet },
  notices: { to: "/app/notices" as AppPath, label: "الإعلانات واللوائح", icon: Megaphone },
  profile: { to: "/app/profile" as AppPath, label: "الملف الشخصي", icon: Users },
  students: { to: "/app/students" as AppPath, label: "إدارة الطلبة", icon: Users },
  teachers: { to: "/app/teachers" as AppPath, label: "إدارة المعلمين", icon: GraduationCap },
  timetables: { to: "/app/timetables" as AppPath, label: "إدارة الجداول", icon: CalendarDays },
};
export function getDrawerCategories(role: Role): NavCategory[] {
  if (role === "admin") return [
    { title: "الرئيسية", items: [navItems.home] },
    { title: "الشؤون الأكاديمية", items: [navItems.schedule, navItems.calendar, navItems.attendance, navItems.notices] },
    { title: "الإدارة", items: [navItems.students, navItems.teachers, navItems.timetables, navItems.fees] },
  ];
  if (role === "teacher") return [
    { title: "الرئيسية", items: [navItems.home, navItems.grades, navItems.schedule] },
    { title: "الشؤون الأكاديمية", items: [navItems.homework, navItems.attendance, navItems.calendar, navItems.notices] },
    { title: "الحساب", items: [navItems.profile] },
  ];
  return [
    { title: "الرئيسية", items: [navItems.home, navItems.grades, navItems.schedule] },
    { title: "الخدمات الأكاديمية", items: [navItems.homework, navItems.attendance, navItems.calendar, navItems.notices, navItems.fees] },
    { title: "الحساب", items: [navItems.profile] },
  ];
}
export function sideNav(role: Role): NavItem[] { return getDrawerCategories(role).flatMap((category) => category.items); }
export const roleLabel: Record<Role, string> = { student: "طالب", teacher: "معلم", admin: "الإدارة" };
