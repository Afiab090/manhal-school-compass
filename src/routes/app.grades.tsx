import { createFileRoute } from "@tanstack/react-router";
import { Award, FileSpreadsheet, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

import { EmptyState, PageHeader, Panel } from "@/components/school/bits";
import { BehaviorFeed, StudentReportCard, TeacherGradebookSection } from "@/components/school/Gradebook";
import { useMe } from "@/components/school/useMe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setActiveChild } from "@/lib/school/store";
import type { Term } from "@/lib/school/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/grades")({
  component: GradesPage,
});

function GradesPage() {
  const { s, me } = useMe();
  const [selectedTerm, setSelectedTerm] = useState<Term>("term_1");
  const [activeTab, setActiveTab] = useState<"grades" | "behavior">("grades");

  const targetStudent =
    me.role === "student"
      ? me.student
      : me.role === "parent"
        ? me.activeChild
        : null;

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="كشف وشهادات الدرجات"
        subtitle="كشوفات الدرجات التفصيلية، بطاقة الأداء الأكاديمي، وسجل المتابعة السلوكية والتربوية"
        icon={Award}
      />

      {/* Parent Child Switcher */}
      {me.role === "parent" && me.children && me.children.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card/90 p-3 shadow-card">
          <span className="text-xs font-bold text-muted-foreground ml-2">كشف درجات الطالب:</span>
          {me.children.map((child) => {
            const isSelected = me.activeChild?.id === child.id;
            const childCls = s.classes.find((c) => c.id === child.classId);
            return (
              <Button
                key={child.id}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveChild(child.id)}
                className={cn(
                  "rounded-full text-xs font-bold transition-all",
                  isSelected && "bg-navy text-gold shadow-sm",
                )}
              >
                {child.name} ({childCls?.name ?? child.classId})
              </Button>
            );
          })}
        </div>
      )}

      {/* For Student and Parent */}
      {(me.role === "student" || me.role === "parent") && (
        <>
          {targetStudent ? (
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
          ) : (
            <EmptyState
              icon={Award}
              title="لم يتم تحديد طالب"
              text="يرجى اختيار أحد الأبناء من القائمة أعلاه لعرض كشف درجاته"
            />
          )}
        </>
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
