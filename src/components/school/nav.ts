import {
  Award,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Home,
  Megaphone,
  UserCheck,
  UserCircle,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@/lib/school/types";

export type AppPath =
  | "/app"
  | "/app/schedule"
  | "/app/fees"
  | "/app/notices"
  | "/app/profile"
  | "/app/homework"
  | "/app/attendance"
  | "/app/calendar";

export interface NavItem {
  to: AppPath;
  tab?: string;
  label: string;
  icon: LucideIcon;
}

export interface NavCategory {
  title: string;
  items: NavItem[];
}

export const navItems = {
  home: { to: "/app" as AppPath, label: "الرئيسية", icon: Home },
  schedule: { to: "/app/schedule" as AppPath, label: "الجدول الدراسي", icon: CalendarDays },
  calendar: { to: "/app/calendar" as AppPath, label: "التقويم والامتحانات", icon: Award },
  homework: { to: "/app/homework" as AppPath, label: "الواجبات والدروس", icon: BookOpen },
  attendance: { to: "/app/attendance" as AppPath, label: "الحضور والغياب", icon: UserCheck },
  fees: { to: "/app/fees" as AppPath, label: "الرسوم الدراسية", icon: Wallet },
  notices: { to: "/app/notices" as AppPath, label: "الإعلانات واللوائح", icon: Megaphone },
  profile: { to: "/app/profile" as AppPath, label: "الملف الشخصي", icon: UserCircle },
  classesAndStudents: { to: "/app" as AppPath, tab: "students", label: "متابعة الفصول والطلاب", icon: Users },
  teachersDirectory: { to: "/app" as AppPath, tab: "teachers", label: "دليل أساتذة المواد", icon: GraduationCap },
};

/** Categorized navigation for the slide-out side drawer and persistent side navigation. */
export function getDrawerCategories(role: Role): NavCategory[] {
  const main: NavCategory = {
    title: "القائمة الرئيسية",
    items: [navItems.home, navItems.schedule, navItems.calendar],
  };

  const academicItems: NavItem[] =
    role === "teacher"
      ? [navItems.homework, navItems.attendance, navItems.notices]
      : [navItems.homework, navItems.attendance, navItems.fees, navItems.notices];

  const academic: NavCategory = {
    title: "الشؤون الأكاديمية والطلابية",
    items: academicItems,
  };

  const categories: NavCategory[] = [main, academic];

  if (role === "admin" || role === "teacher") {
    categories.push({
      title: "إدارة المدرسة والمتابعة",
      items: [navItems.classesAndStudents, navItems.teachersDirectory],
    });
  }

  return categories;
}

/** Flattened items for backward compatibility if needed */
export function sideNav(role: Role): NavItem[] {
  const cats = getDrawerCategories(role);
  return cats.flatMap((c) => c.items);
}

export const roleLabel: Record<Role, string> = {
  student: "طالب / ولي أمر",
  teacher: "معلم",
  admin: "إدارة المدرسة",
};
