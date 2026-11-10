import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/school/bits";
import { StudentReportCard, TeacherGradebookSection } from "@/components/school/Gradebook";
import { useMe } from "@/components/school/useMe";

export const Route = createFileRoute("/app/grades")({ component: GradesPage });
function GradesPage() {
  const { s, me } = useMe();
  return <div className="space-y-6"><PageHeader title="كشف الدرجات والشهادات" subtitle="سجل الأداء الأكاديمي والنتائج الدراسية" />{me.role === "student" ? <StudentReportCard student={me.student} grades={s.gradesList} classes={s.classes} academicYear={s.currentAcademicYear} term={s.currentTerm} /> : <TeacherGradebookSection classes={s.classes} students={s.students} grades={s.gradesList} teachers={s.teachers} activeTeacher={me.role === "teacher" ? me.teacher : null} />}</div>;
}
