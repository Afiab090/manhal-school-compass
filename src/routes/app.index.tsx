import { createFileRoute } from "@tanstack/react-router";

import { AdminHome } from "@/features/dashboard/AdminHome";
import { StudentHome } from "@/features/dashboard/StudentHome";
import { TeacherHome } from "@/features/dashboard/TeacherHome";
import { useMe } from "@/components/school/useMe";

interface AppIndexSearch { tab?: string | undefined; }
export const Route = createFileRoute("/app/")({
  validateSearch: (search: Record<string, unknown>): AppIndexSearch => ({ tab: typeof search["tab"] === "string" ? search["tab"] : undefined }),
  component: Home,
});
function Home() {
  const { me } = useMe();
  if (me.role === "student") return <StudentHome />;
  if (me.role === "teacher") return <TeacherHome />;
  return <AdminHome />;
}
