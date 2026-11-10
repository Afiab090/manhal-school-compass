import { createFileRoute } from "@tanstack/react-router";
import { TeachersDirectory } from "@/features/teachers/TeachersDirectory";

export const Route = createFileRoute("/app/teachers")({ component: () => <TeachersDirectory /> });
