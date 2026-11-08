import { Award, CheckCircle2, ChevronLeft, Download, FileSpreadsheet, Plus, Printer, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordGrade } from "@/lib/school/store";
import type { BehaviorRecord, GradeEntry, SchoolClass, Student, Teacher, Term } from "@/lib/school/types";
import { cn } from "@/lib/utils";

/** Helper to compute letter grade */
export function calculateGradeLetter(total: number): { letter: string; label: string; tone: "success" | "gold" | "warning" | "danger" } {
  if (total >= 90) return { letter: "أ+", label: "ممتاز مرتفع", tone: "success" };
  if (total >= 85) return { letter: "أ", label: "ممتاز", tone: "success" };
  if (total >= 75) return { letter: "ب+", label: "جيد جداً", tone: "gold" };
  if (total >= 65) return { letter: "ب", label: "جيد", tone: "gold" };
  if (total >= 50) return { letter: "ج", label: "مقبول", tone: "warning" };
  return { letter: "هـ", label: "يحتاج لمتابعة", tone: "danger" };
}

/** Official Clean Academic Report Card for Students and Parents */
export function StudentReportCard({
  student,
  grades,
  classes,
  academicYear = "2025-2026",
  term = "term_1",
}: {
  student: Student;
  grades: GradeEntry[];
  classes: SchoolClass[];
  academicYear?: string;
  term?: Term;
}) {
  const cls = classes.find((c) => c.id === student.classId);
  const studentGrades = useMemo(
    () => grades.filter((g) => g.studentId === student.id && g.academicYear === academicYear && g.term === term),
    [grades, student.id, academicYear, term],
  );

  const stats = useMemo(() => {
    if (studentGrades.length === 0) return null;
    const totalMax = studentGrades.length * 100;
    const totalEarned = studentGrades.reduce((sum, g) => sum + g.totalScore, 0);
    const average = Math.round((totalEarned / totalMax) * 100);
    const passed = studentGrades.every((g) => g.totalScore >= 50);
    return { totalEarned, totalMax, average, passed };
  }, [studentGrades]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-soft text-gold">
              <Award className="h-4 w-4" />
            </span>
            <h3 className="font-display text-lg font-bold text-navy">
              كشف درجات التقييم الأكاديمي والامتحانات
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cls?.stage} — {cls?.name} · العام الدراسي ٢٠٢٥ - ٢٠٢٦ (الفصل الدراسي الأول)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs font-bold border-border hover:bg-muted"
          >
            <Printer className="h-3.5 w-3.5 text-gold" />
            طباعة الشهادة
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-muted/50 border-b text-xs text-muted-foreground font-bold">
              <tr>
                <th className="py-3 px-4 text-start">المادة الدراسية</th>
                <th className="py-3 px-3 text-center">أعمال السنة (٢٠)</th>
                <th className="py-3 px-3 text-center">منتصف الفصل (٢٠)</th>
                <th className="py-3 px-3 text-center">الامتحان النهائي (٦٠)</th>
                <th className="py-3 px-3 text-center">المجموع (١٠٠)</th>
                <th className="py-3 px-3 text-center">التقدير</th>
                <th className="py-3 px-4 text-start">ملاحظات الأستاذ وتوجيهاته</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {studentGrades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                    لم يتم رصد نتائج هذا الفصل حتى الآن.
                  </td>
                </tr>
              ) : (
                studentGrades.map((g) => {
                  const gradeInfo = calculateGradeLetter(g.totalScore);
                  return (
                    <tr key={g.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {g.subject}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-semibold text-foreground/85">
                        {g.courseworkScore}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-semibold text-foreground/85">
                        {g.midtermScore}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-semibold text-foreground/85">
                        {g.finalScore}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-extrabold text-navy text-base">
                        {g.totalScore}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <Badge
                          variant={gradeInfo.tone}
                          className="font-bold text-[11px] px-2 py-0.5"
                        >
                          {gradeInfo.letter} ({gradeInfo.label})
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground max-w-xs truncate">
                        {g.notes || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Overall Summary Bar */}
        {stats && (
          <div className="bg-muted/30 border-t p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-muted-foreground block">المجموع الكلي:</span>
                <span className="text-lg font-extrabold text-foreground font-mono">
                  {stats.totalEarned} / {stats.totalMax}
                </span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <span className="text-xs text-muted-foreground block">المعدل المئوي العام:</span>
                <span className="text-xl font-extrabold text-navy font-mono">
                  {stats.average}٪
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">النتيجة العامة:</span>
              <Badge variant="success" className="text-xs font-bold px-3 py-1 gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {stats.passed ? "ناجح بتفوق" : "مستمر"}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Conduct & Behavioral Feed */
export function BehaviorFeed({ records }: { records: BehaviorRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl border bg-card text-muted-foreground text-xs">
        لا توجد ملاحظات سلوكية مسجلة. السجل نظيف ومثالي.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {records.map((r) => {
        const isPositive = r.type === "positive";
        return (
          <div
            key={r.id}
            className={cn(
              "flex items-start gap-3.5 p-4 rounded-2xl border bg-card shadow-card transition-all",
              isPositive ? "border-s-4 border-s-success" : "border-s-4 border-s-warning",
            )}
          >
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                isPositive ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
              )}
            >
              {isPositive ? <Sparkles className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-foreground text-sm">{r.title}</h4>
                <span className="text-[11px] text-muted-foreground shrink-0">{r.date.slice(0, 10)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.details}</p>
              <div className="mt-2 text-[11px] font-semibold text-foreground/80 flex items-center gap-2">
                <span>المسؤول:</span>
                <span className="text-navy">{r.recordedBy}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Teacher / Admin Grade Recording Management */
export function TeacherGradebookSection({
  classes,
  students,
  grades,
  teachers,
  activeTeacher,
}: {
  classes: SchoolClass[];
  students: Student[];
  grades: GradeEntry[];
  teachers: Teacher[];
  activeTeacher?: Teacher | null;
}) {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || "c3a");
  const [selectedSubject, setSelectedSubject] = useState<string>(
    activeTeacher?.subject || "الرياضيات",
  );
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Grade Input Form State
  const [coursework, setCoursework] = useState<string>("18");
  const [midterm, setMidterm] = useState<string>("18");
  const [finalScore, setFinalScore] = useState<string>("54");
  const [notes, setNotes] = useState<string>("");

  const classStudents = useMemo(
    () => students.filter((s) => s.classId === selectedClassId),
    [students, selectedClassId],
  );

  const openRecordModal = (student: Student) => {
    setSelectedStudent(student);
    const existing = grades.find(
      (g) => g.studentId === student.id && g.subject === selectedSubject && g.term === "term_1",
    );
    if (existing) {
      setCoursework(String(existing.courseworkScore));
      setMidterm(String(existing.midtermScore));
      setFinalScore(String(existing.finalScore));
      setNotes(existing.notes || "");
    } else {
      setCoursework("18");
      setMidterm("18");
      setFinalScore("50");
      setNotes("");
    }
    setRecordModalOpen(true);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const cw = Number(coursework) || 0;
    const mid = Number(midterm) || 0;
    const fin = Number(finalScore) || 0;
    const total = Math.min(100, cw + mid + fin);
    const { letter } = calculateGradeLetter(total);

    recordGrade({
      studentId: selectedStudent.id,
      classId: selectedClassId,
      subject: selectedSubject,
      academicYear: "2025-2026",
      term: "term_1",
      courseworkScore: cw,
      midtermScore: mid,
      finalScore: fin,
      totalScore: total,
      letter,
      notes: notes.trim() || undefined,
      recordedBy: activeTeacher?.name || "إدارة الامتحانات",
    });

    toast.success(`تم حفظ درجات مادة ${selectedSubject} للطالب ${selectedStudent.name}`);
    setRecordModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border shadow-card">
        <div>
          <h3 className="font-display text-lg font-bold text-navy">
            دفتر رصد الدرجات والتقييم الفصلي
          </h3>
          <p className="text-xs text-muted-foreground">
            إدخال وتعديل درجات أعمال السنة والاختبارات واعتماد كشوف الدرجات الرسمية
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-semibold"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <Input
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            placeholder="المادة الدراسية"
            className="h-9 w-36 text-xs font-semibold"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-muted/50 border-b text-xs text-muted-foreground font-bold">
              <tr>
                <th className="py-3 px-4 text-start">الطالب والرقم الأكاديمي</th>
                <th className="py-3 px-3 text-center">أعمال السنة (٢٠)</th>
                <th className="py-3 px-3 text-center">منتصف الفصل (٢٠)</th>
                <th className="py-3 px-3 text-center">الامتحان النهائي (٦٠)</th>
                <th className="py-3 px-3 text-center">المجموع الكلي</th>
                <th className="py-3 px-3 text-center">التقدير</th>
                <th className="py-3 px-4 text-end">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {classStudents.map((st) => {
                const entry = grades.find(
                  (g) => g.studentId === st.id && g.subject === selectedSubject && g.term === "term_1",
                );
                const gradeInfo = entry ? calculateGradeLetter(entry.totalScore) : null;

                return (
                  <tr key={st.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground text-sm">{st.name}</div>
                      <div className="text-xs font-mono text-gold" dir="ltr">{st.academicId}</div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      {entry ? entry.courseworkScore : "—"}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      {entry ? entry.midtermScore : "—"}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      {entry ? entry.finalScore : "—"}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-navy text-base">
                      {entry ? `${entry.totalScore}٪` : "—"}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {gradeInfo ? (
                        <Badge variant={gradeInfo.tone} className="text-[10px]">
                          {gradeInfo.letter} ({gradeInfo.label})
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">غير مرصود</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRecordModal(st)}
                        className="text-xs font-bold h-8 border-border hover:bg-gold-soft hover:text-navy"
                      >
                        {entry ? "تعديل الدرجة" : "رصد الدرجة"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Grade Dialog */}
      <Dialog open={recordModalOpen} onOpenChange={setRecordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              رصد درجات مادة {selectedSubject} — {selectedStudent?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveGrade} className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>أعمال السنة (من 20)</Label>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={coursework}
                  onChange={(e) => setCoursework(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>منتصف الفصل (من 20)</Label>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={midterm}
                  onChange={(e) => setMidterm(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>النهائي (من 60)</Label>
                <Input
                  type="number"
                  min="0"
                  max="60"
                  value={finalScore}
                  onChange={(e) => setFinalScore(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl flex items-center justify-between text-sm">
              <span className="text-muted-foreground">المجموع الكلي التقديري:</span>
              <span className="font-extrabold text-navy font-mono text-base">
                {Math.min(100, (Number(coursework) || 0) + (Number(midterm) || 0) + (Number(finalScore) || 0))} من ١٠٠
              </span>
            </div>

            <div className="space-y-1.5">
              <Label>ملاحظات الأستاذ وتوجيهاته للطالب (اختياري)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: أداء متميز وتفاعل إيجابي مستمر"
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setRecordModalOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">حفظ واعتماد الدرجة</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
