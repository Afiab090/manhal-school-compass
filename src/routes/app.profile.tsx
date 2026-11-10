import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Calendar, RotateCcw, UserCircle } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/school/bits";
import { roleLabel } from "@/components/school/nav";
import { Avatar } from "@/components/school/shared";
import { ThemeToggle } from "@/components/school/ThemeToggle";
import { useMe } from "@/components/school/useMe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEMO_MODE } from "@/lib/school/seed";
import { forceResetDefaultData } from "@/lib/school/store";

export const Route = createFileRoute("/app/profile")({ component: ProfilePage });
function ProfilePage() {
  const { s, me } = useMe();
  const navigate = useNavigate();
  const student = me.role === "student" ? me.student : null;
  const teacher = me.role === "teacher" ? me.teacher : null;
  const schoolClass = student ? s.classes.find((item) => item.id === student.classId) : null;
  return <div className="animate-rise space-y-6">
    <PageHeader title="الملف الشخصي وإعدادات الحساب" subtitle="بيانات الحساب المدرسي والتحكم في المظهر" icon={UserCircle} />
    <Panel className="flex items-center gap-4 p-6"><Avatar name={me.name} className="h-16 w-16 text-2xl" /><div><div className="flex items-center gap-2"><strong className="font-display text-xl text-navy">{me.name}</strong><Badge>{roleLabel[me.role]}</Badge></div><div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{s.academicYears.find((year) => year.isCurrent)?.name ?? s.currentAcademicYear}</div></div></Panel>
    <Panel className="space-y-3"><h2 className="border-b pb-2 font-display font-bold text-navy">البيانات الأكاديمية والتنظيمية</h2>
      {student && <div className="grid gap-3 sm:grid-cols-2 text-sm"><div><span className="block text-xs text-muted-foreground">الرقم الأكاديمي</span><b dir="ltr">{student.academicId}</b></div><div><span className="block text-xs text-muted-foreground">الفصل</span><b>{schoolClass?.name}</b></div><div><span className="block text-xs text-muted-foreground">ولي الأمر</span><b>{student.parentName}</b></div><div><span className="block text-xs text-muted-foreground">هاتف ولي الأمر</span><b dir="ltr">{student.parentPhone}</b></div></div>}
      {teacher && <div className="grid gap-3 sm:grid-cols-2 text-sm"><div><span className="block text-xs text-muted-foreground">الرقم الوظيفي</span><b dir="ltr">{teacher.employeeId}</b></div><div><span className="block text-xs text-muted-foreground">المادة</span><b>{teacher.subject}</b></div><div><span className="block text-xs text-muted-foreground">الهاتف</span><b dir="ltr">{teacher.phone}</b></div><div><span className="block text-xs text-muted-foreground">الفصول المسندة</span><b>{(teacher.classes ?? []).map((id) => s.classes.find((item) => item.id === id)?.short).filter(Boolean).join("، ")}</b></div></div>}
      {me.role === "admin" && <div className="grid gap-3 sm:grid-cols-2 text-sm"><div><span className="block text-xs text-muted-foreground">اسم المستخدم</span><b dir="ltr">{me.admin.username}</b></div><div><span className="block text-xs text-muted-foreground">المسمى الوظيفي</span><b>{me.admin.title}</b></div></div>}
    </Panel>
    <Panel className="flex items-center justify-between"><div><b className="block text-sm">المظهر الخارجي</b><span className="text-xs text-muted-foreground">التبديل بين الوضع الليلي والفاتح</span></div><ThemeToggle /></Panel>
    {DEMO_MODE && me.role === "admin" && <Panel className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><b className="block text-sm">إعادة ضبط البيانات التجريبية</b><span className="text-xs text-muted-foreground">إعادة إنشاء بيانات المدرسة التجريبية</span></div><Button variant="outline" onClick={() => { forceResetDefaultData(); toast.success("تمت إعادة ضبط البيانات التجريبية"); navigate({ to: "/app" }); }}><RotateCcw className="me-2 h-4 w-4" />إعادة الضبط</Button></Panel>}
  </div>;
}
