import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  FileText,
  GraduationCap,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, Panel } from "@/components/school/bits";
import { useMe } from "@/components/school/useMe";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  daysUntil,
  formatDate,
  toISODate,
} from "@/lib/school/logic";
import {
  deleteHomework,
  postHomework,
  toggleHomeworkDone,
} from "@/lib/school/store";
import type { Homework } from "@/lib/school/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/homework")({
  component: HomeworkPage,
});

function HomeworkPage() {
  const { s, me } = useMe();
  const [activeTab, setActiveTab] = useState<"homework" | "notes">("homework");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteHomeworkId, setDeleteHomeworkId] = useState<string | null>(null);

  // New Homework Form state
  const [formClassId, setFormClassId] = useState<string>(s.classes[0]?.id || "c3a");
  const [formSubject, setFormSubject] = useState<string>(
    me.role === "teacher" ? me.teacher.subject : "الرياضيات",
  );
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDueDate, setFormDueDate] = useState<string>(
    toISODate(new Date(Date.now() + 3 * 86400000)),
  );
  const [formKind, setFormKind] = useState<"homework" | "notes">("homework");

  const targetStudent = me.role === "student" ? me.student : null;

  // Filter items
  const items = useMemo(() => {
    return s.homework.filter((h) => {
      if (h.kind !== activeTab) return false;
      if (targetStudent) {
        return h.classId === targetStudent.classId;
      }
      if (selectedClassFilter !== "all") {
        return h.classId === selectedClassFilter;
      }
      return true;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [s.homework, activeTab, targetStudent, selectedClassFilter]);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    const teacherId = me.role === "teacher" ? me.teacher.id : s.teachers[0]?.id || "t1";

    postHomework({
      classId: formClassId,
      subject: formSubject,
      title: formTitle.trim(),
      description: formDescription.trim(),
      dueDate: formDueDate,
      teacherId,
      kind: formKind,
    });

    toast.success(formKind === "homework" ? "تم نشر الواجب المدرسي بنجاح" : "تم نشر المذكرة الدراسية بنجاح");
    setDialogOpen(false);
    setFormTitle("");
    setFormDescription("");
  };

  const confirmDelete = () => {
    if (deleteHomeworkId) {
      deleteHomework(deleteHomeworkId);
      toast.success("تم الحذف بنجاح");
      setDeleteHomeworkId(null);
    }
  };

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="الواجبات والدروس والمذكرات"
        subtitle="متابعة التكاليف المدرسية اليومية ومذكرات المواد والمحتوى التعليمي"
        icon={BookOpen}
        action={
          (me.role === "teacher" || me.role === "admin") && (
            <Button
              onClick={() => {
                setFormKind(activeTab);
                setDialogOpen(true);
              }}
              className="gap-2 bg-primary hover:bg-navy font-bold"
            >
              <Plus className="h-4 w-4" />
              {activeTab === "homework" ? "نشر واجب جديد" : "إضافة مذكرة دراسية"}
            </Button>
          )
        }
      />

      {/* Tabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={activeTab === "homework" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("homework")}
            className="gap-2 rounded-xl"
          >
            <BookOpen className="h-4 w-4" />
            الواجبات المنزلية
          </Button>
          <Button
            type="button"
            variant={activeTab === "notes" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("notes")}
            className="gap-2 rounded-xl"
          >
            <FileText className="h-4 w-4" />
            المذكرات والملخصات
          </Button>
        </div>

        {!targetStudent && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">الفصل:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-bold text-foreground focus:outline-none"
            >
              <option value="all">جميع الفصول الدراسية</option>
              {s.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <EmptyState
          icon={activeTab === "homework" ? BookOpen : FileText}
          title={activeTab === "homework" ? "لا توجد واجبات حالية" : "لا توجد مذكرات منشورة"}
          text="سيتم إشعارك فور قيام المعلم بنشر مهام جديدة"
        />
      ) : (
        <div className="space-y-4">
          {items.map((it) => {
            const teacher = s.teachers.find((t) => t.id === it.teacherId);
            const cls = s.classes.find((c) => c.id === it.classId);
            const isCompleted = targetStudent ? s.completedHomework.includes(`${targetStudent.id}:${it.id}`) : false;
            const diff = daysUntil(it.dueDate, new Date());

            return (
              <div
                key={it.id}
                className={cn(
                  "flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-card transition-all",
                  isCompleted && "bg-muted/20 border-muted opacity-80",
                )}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary text-primary-foreground font-bold">
                        {it.subject}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {cls?.name}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-gold" />
                      <span>تاريخ التسليم: {formatDate(it.dueDate)}</span>
                      {it.kind === "homework" && (
                        <span
                          className={cn(
                            "font-bold",
                            diff < 0 ? "text-destructive" : diff <= 2 ? "text-amber-500" : "text-foreground",
                          )}
                        >
                          ({diff < 0 ? "انتهى الموعد" : diff === 0 ? "اليوم" : `متبقي ${diff} يوم`})
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-bold text-foreground mt-2">
                    {it.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line bg-muted/30 p-3.5 rounded-xl border border-muted">
                    {it.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <GraduationCap className="h-4 w-4 text-gold" />
                    <span>المعلم: {teacher?.name ?? "إدارة المدرسة"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {targetStudent && it.kind === "homework" && (
                      <Button
                        size="sm"
                        variant={isCompleted ? "outline" : "default"}
                        onClick={() => {
                          toggleHomeworkDone(targetStudent.id, it.id);
                          toast.success(isCompleted ? "تم إلغاء حالة الإنجاز" : "أحسنت! تم إنجاز الواجب");
                        }}
                        className="gap-2 text-xs font-bold"
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            تم الإنجاز
                          </>
                        ) : (
                          <>
                            <Circle className="h-4 w-4" />
                            تعليم كمكتمل
                          </>
                        )}
                      </Button>
                    )}

                    {(me.role === "admin" || (me.role === "teacher" && it.teacherId === me.teacher.id)) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteHomeworkId(it.id)}
                        className="h-8 text-xs text-destructive hover:bg-danger-soft hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 me-1" />
                        حذف
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Homework / Note Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {formKind === "homework" ? "نشر واجب مدرسي جديد" : "إضافة مذكرة / ملخص دراسي"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePost} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>النوع</Label>
                <select
                  value={formKind}
                  onChange={(e) => setFormKind(e.target.value as "homework" | "notes")}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
                >
                  <option value="homework">واجب منزلي</option>
                  <option value="notes">مذكرة / ملخص دراسي</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>الفصل المستهدف</Label>
                <select
                  value={formClassId}
                  onChange={(e) => setFormClassId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
                >
                  {s.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>المادة الدراسية</Label>
                <Input
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="مثال: الرياضيات"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>تاريخ التسليم / الاستحقاق</Label>
                <Input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>العنوان الرئيسي</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="مثال: حل مسائل التفاضل صفحة 84"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>التفاصيل والتعليمات أو نص المذكرة</Label>
              <Textarea
                rows={5}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="اكتب تفاصيل التكليف، أرقام المسائل، أو محتوى المذكرة هنا..."
                required
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">نشر للطلاب</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteHomeworkId} onOpenChange={(open) => !open && setDeleteHomeworkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف العنصر</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف هذا الواجب/المذكرة نهائياً؟ لن يتمكن الطلاب من الوصول إليه بعد الحذف.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              نعم، حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
