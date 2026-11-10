import {
  Award,
  BookOpen,
  CalendarDays,
  Clock,
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
  | "/app/calendar"
  | "/app/students"
  | "/app/teachers"
  | "/app/timetables";

export interface NavItem {
  to: AppPath;
  tab?: string | undefined;
  label: string;
  icon: LucideIcon;
}

export interface NavCategory {
  title: string;
  items: NavItem[];
}

export const navItems = {
  home: { to: "/app" as AppPath, label: "الرئيسية", icon: Home },
  grades: { to: "/app" as AppPath, tab: "grades", label: "كشف الدرجات والشهادات", icon: Award },
  schedule: { to: "/app/schedule" as AppPath, label: "الجدول الدراسي", icon: CalendarDays },
  calendar: { to: "/app/calendar" as AppPath, label: "التقويم والامتحانات", icon: Award },
  homework: { to: "/app/homework" as AppPath, label: "الواجبات والدروس", icon: BookOpen },
  attendance: { to: "/app/attendance" as AppPath, label: "الحضور والغياب", icon: UserCheck },
  fees: { to: "/app/fees" as AppPath, label: "كشف الرسوم الدراسية", icon: Wallet },
  notices: { to: "/app/notices" as AppPath, label: "الإعلانات واللوائح", icon: Megaphone },
  profile: { to: "/app/profile" as AppPath, label: "الملف الشخصي", icon: UserCircle },
  students: { to: "/app/students" as AppPath, label: "إدارة الطلاب والفصول", icon: Users },
  teachers: { to: "/app/teachers" as AppPath, label: "هيئة التدريس", icon: GraduationCap },
  timetables: { to: "/app/timetables" as AppPath, label: "الجداول المدرسية", icon: Clock },
};

/** Categorized navigation for the slide-out side drawer and persistent side navigation. */
export function getDrawerCategories(role: Role): NavCategory[] {
  if (role === "admin") {
    return [
      {
        title: "الرئيسية",
        items: [navItems.home],
      },
      {
        title: "الشؤون الأكاديمية",
        items: [navItems.schedule, navItems.calendar, navItems.attendance, navItems.notices],
      },
      {
        title: "الإدارة والمتابعة",
        items: [navItems.students, navItems.teachers, navItems.timetables, navItems.fees],
      },
    ];
  }

  if (role === "teacher") {
    return [
      {
        title: "القائمة الرئيسية",
        items: [navItems.home, navItems.schedule, navItems.calendar],
      },
      {
        title: "الشؤون الأكاديمية والطلابية",
        items: [navItems.homework, navItems.attendance, navItems.notices],
      },
      {
        title: "المتابعة المدرسية",
        items: [navItems.students, navItems.teachers],
      },
    ];
  }

  // Student role
  return [
    {
      title: "القائمة الرئيسية",
      items: [navItems.home, navItems.grades, navItems.schedule, navItems.calendar],
    },
    {
      title: "الشؤون الأكاديمية والطلابية",
      items: [navItems.homework, navItems.attendance, navItems.fees, navItems.notices],
    },
  ];
}

/** Flattened items for backward compatibility if needed */
export function sideNav(role: Role): NavItem[] {
  const cats = getDrawerCategories(role);
  return cats.flatMap((c) => c.items);
}

export const roleLabel: Record<Role, string> = {
  student: "طالب",
  teacher: "معلم",
  admin: "إدارة المدرسة",
};
