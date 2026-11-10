import { createFileRoute } from "@tanstack/react-router";

import { StudentsDirectory } from "@/features/students/StudentsDirectory";

export const Route = createFileRoute("/app/students")({
  component: StudentsPage,
});

function StudentsPage() {
  return <StudentsDirectory />;
}
