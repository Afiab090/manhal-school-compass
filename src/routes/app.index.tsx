import { createFileRoute } from "@tanstack/react-router";

import { useMe } from "@/components/school/useMe";
import { AdminHome } from "@/features/dashboard/AdminHome";
import { StudentHome } from "@/features/dashboard/StudentHome";
import { TeacherHome } from "@/features/dashboard/TeacherHome";
import { StudentsDirectory } from "@/features/students/StudentsDirectory";
import { TeachersDirectory } from "@/features/teachers/TeachersDirectory";

interface AppIndexSearch {
  tab?: string | undefined;
}

export const Route = createFileRoute("/app/")({
  validateSearch: (search: Record<string, unknown>): AppIndexSearch => {
    const rawTab = search["tab"];
    return {
      tab: typeof rawTab === "string" ? rawTab : undefined,
    };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { me } = useMe();
  const search = Route.useSearch();
  const currentTab = search.tab || "overview";

  // If specific directory tab requested:
  if (currentTab === "students" && (me.role === "admin" || me.role === "teacher")) {
    return <StudentsDirectory />;
  }
  if (currentTab === "teachers" && (me.role === "admin" || me.role === "teacher")) {
    return <TeachersDirectory />;
  }

  // Role-based home dashboards
  if (me.role === "student") {
    return <StudentHome initialTab={currentTab} />;
  }
  if (me.role === "teacher") {
    return <TeacherHome initialTab={currentTab} />;
  }
  return <AdminHome initialTab={currentTab} />;
}
