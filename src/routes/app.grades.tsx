import { createFileRoute } from "@tanstack/react-router";
import { Award, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/school/bits";
import { BehaviorFeed, StudentReportCard, TeacherGradebookSection } from "@/components/school/Gradebook";
import { useMe } from "@/components/school/useMe";
import { Button } from "@/components/ui/button";
import type { Term } from "@/lib/school/types";

export const Route = createFileRoute("/app/grades")({
  component: GradesPage,
});

function GradesPage() {
  const { s, me } = useMe();
  const [selectedTerm, setSelectedTerm] = useState<Term>("term_1");
  const [activeTab, setActiveTab] = useState<"grades" | "behavior">("grades");

  const targetStudent = me.role === "student" ? me.student : null;

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="كشف وشهادات الدرجات"
        subtitle="كشوفات الدرجات التفصيلية، بطاقة الأداء الأكاديمي، وسجل المتابعة السلوكية والتربوية"
        icon={Award}
      />

      {/* For Student */}
      {me.role === "student" && targetStudent && (
        <div className="space-y-6">
          {/* Controls bar: Term & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={activeTab === "grades" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("grades")}
                className="rounded-xl gap-2 font-bold text-xs"
              >
                <FileSpreadsheet className="h-4 w-4" />
                كشف الدرجات والشهادة
              </Button>
              <Button
                type="button"
                variant={activeTab === "behavior" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("behavior")}
                className="rounded-xl gap-2 font-bold text-xs"
              >
                <ShieldCheck className="h-4 w-4" />
                سجل الانضباط والتميز
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">الفترة:</span>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value as Term)}
                className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-bold text-foreground focus:outline-none"
              >
                <option value="term_1">الفصل الدراسي الأول (Term 1)</option>
                <option value="term_2">الفصل الدراسي الثاني (Term 2)</option>
              </select>
            </div>
          </div>

          {activeTab === "grades" ? (
            <StudentReportCard
              student={targetStudent}
              grades={s.gradesList}
              classes={s.classes}
              academicYear="2025-2026"
              term={selectedTerm}
            />
          ) : (
            <BehaviorFeed
              records={s.behaviorRecords.filter((b) => b.studentId === targetStudent.id)}
            />
          )}
        </div>
      )}

      {/* For Teacher and Admin */}
      {(me.role === "teacher" || me.role === "admin") && (
        <TeacherGradebookSection
          classes={s.classes}
          students={s.students}
          grades={s.gradesList}
          teachers={s.teachers}
          activeTeacher={me.role === "teacher" ? me.teacher : null}
        />
      )}
    </div>
  );
}
