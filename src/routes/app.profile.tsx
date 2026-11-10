import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  GraduationCap,
  LogOut,
  Phone,
  RotateCcw,
  Sparkles,
  UserCheck,
  UserCircle,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/school/bits";
import { roleLabel } from "@/components/school/nav";
import { Avatar } from "@/components/school/shared";
import { ThemeToggle } from "@/components/school/ThemeToggle";
import { useMe } from "@/components/school/useMe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEMO_MODE } from "@/lib/school/seed";
import {
  demoLogin,
  forceResetDefaultData,
  logout,
} from "@/lib/school/store";
import type { Role } from "@/lib/school/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { s, me } = useMe();
  const navigate = useNavigate();

  const handleRoleSwitch = (newRole: Role) => {
    demoLogin(newRole, me.stageId);
    toast.success(`تم التبديل إلى حساب: ${roleLabel[newRole]}`);
  };

  const handleReset = () => {
    forceResetDefaultData();
    toast.success("تم تحديث وإعادة ضبط البيانات الافتراضية بنجاح");
  };

  const st = me.role === "student" ? me.student : null;
  const teacher = me.role === "teacher" ? me.teacher : null;
  const admin = me.role === "admin" ? me.admin : null;
  const studentClass = st ? s.classes.find((c) => c.id === st.classId) : null;

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="الملف الشخصي والحساب"
        subtitle="بيانات الحساب المسجل، المرحلة الدراسية، وإعدادات النظام"
        icon={UserCircle}
      />

      {/* Main Info Card */}
      <Panel className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <Avatar name={me.name} className="h-20 w-20 text-2xl shadow-elevated" />
          <div className="space-y-2 text-center sm:text-start flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="font-display text-2xl font-bold text-navy">
                {me.role === "teacher" ? "أ. " : ""}{me.name}
              </h2>
              <Badge className="bg-gold-soft text-navy border-gold/40 font-bold">
                {me.role === "admin" ? (admin?.title || roleLabel[me.role]) : roleLabel[me.role]}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground font-semibold">
                {me.stageId}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              العام الدراسي الحالي: ٢٠٢٥ - ٢٠٢٦ · الفصل الدراسي الأول
            </p>
          </div>
        </div>

        <div className="my-6 border-t" />

        {/* Detailed Info depending on role */}
        {me.role === "student" && st && (
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-xl border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block">الرقم الأكاديمي</span>
              <span dir="ltr" className="font-mono font-bold text-foreground text-base">
                {st.academicId}
              </span>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block">الفصل الدراسي</span>
              <span className="font-bold text-foreground text-base">
                {studentClass?.name}
              </span>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block">اسم ولي الأمر</span>
              <span className="font-bold text-foreground text-base">
                {st.parentName}
              </span>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block">رقم هاتف ولي الأمر</span>
              <span dir="ltr" className="font-mono font-bold text-foreground text-base">
                {st.parentPhone}
              </span>
            </div>
          </div>
        )}

        {me.role === "teacher" && teacher && (
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-xl border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block">الرقم الوظيفي</span>
              <span dir="ltr" className="font-mono font-bold text-foreground text-base">
                {teacher.employeeId}
              </span>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block">المادة المقررة والتخصص</span>
              <span className="font-bold text-foreground text-base">
                {teacher.subject}
              </span>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block">رقم الهاتف</span>
              <span dir="ltr" className="font-mono font-bold text-foreground text-base">
                {teacher.phone}
              </span>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block">المراحل التعليمية المسندة</span>
              <span className="font-bold text-foreground text-base">
                {(teacher.stageIds ?? [me.stageId]).join("، ")}
              </span>
            </div>
          </div>
        )}

        {me.role === "admin" && admin && (
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-xl border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block">اسم المستخدم</span>
              <span dir="ltr" className="font-mono font-bold text-foreground text-base">
                {admin.username}
              </span>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block">المسمى الوظيفي</span>
              <span className="font-bold text-foreground text-base">
                {admin.title}
              </span>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3 sm:col-span-2">
              <span className="text-xs text-muted-foreground block">صلاحيات الإدارة</span>
              <span className="font-bold text-foreground text-base">
                صلاحية إدارية كاملة لإدارة شؤون الطلاب، هيئة التدريس، الجداول المدرسية، والرسوم
              </span>
            </div>
          </div>
        )}
      </Panel>

      {/* Quick Role Switcher (Visible in DEMO_MODE) */}
      {DEMO_MODE && (
        <Panel className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <h3 className="font-display text-base font-bold text-navy">
              تبديل سريع للحساب (للتجربة السريعة)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            يمكنك الانتقال فوراً بين حسابات الطالب والمعلم والإدارة لاستعراض الصلاحيات المختلفة
          </p>

          <div className="grid grid-cols-3 gap-2">
            {(["student", "teacher", "admin"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleSwitch(r)}
                className={cn(
                  "rounded-xl py-2.5 text-xs font-bold transition-all border",
                  me.role === r
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                )}
              >
                {r === "student" ? "حساب الطالب" : r === "teacher" ? "حساب المعلم" : "حساب الإدارة"}
              </button>
            ))}
          </div>
        </Panel>
      )}

      {/* Theme Toggle */}
      <Panel className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-foreground text-sm block">المظهر الخارجي للتطبيق</span>
          <span className="text-xs text-muted-foreground">التبديل بين الوضع الليلي والوضع الفاتح</span>
        </div>
        <ThemeToggle />
      </Panel>

      {/* Reset Data (Visible in DEMO_MODE) */}
      {DEMO_MODE && (
        <Panel className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-foreground text-sm block">
              تحديث وإعادة ضبط البيانات الافتراضية
            </span>
            <span className="text-xs text-muted-foreground">
              إعادة تحميل بيانات الفصول الدراسية، أساتذة المواد، والطلاب المحدثة
            </span>
          </div>
          <Button variant="outline" onClick={handleReset} className="gap-2 text-xs font-bold">
            <RotateCcw className="h-3.5 w-3.5 text-gold" />
            إعادة تعيين البيانات
          </Button>
        </Panel>
      )}

      <Button
        variant="destructive"
        className="w-full gap-2 font-bold"
        onClick={() => {
          logout();
          navigate({ to: "/" });
        }}
      >
        <LogOut className="h-4 w-4" />
        تسجيل الخروج من الحساب
      </Button>
    </div>
  );
}
