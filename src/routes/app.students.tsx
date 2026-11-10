import { createFileRoute } from "@tanstack/react-router";
import { StudentsDirectory } from "@/features/students/StudentsDirectory";

export const Route = createFileRoute("/app/students")({
  validateSearch: (search: Record<string, unknown>) => ({ studentId: typeof search.studentId === "string" ? search.studentId : undefined }),
  component: StudentsRoute,
});

function StudentsRoute() { return <StudentsDirectory />; }
