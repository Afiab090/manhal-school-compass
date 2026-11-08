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
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/school/bits";
import { roleLabel } from "@/components/school/nav";
import { Avatar } from "@/components/school/shared";
import { ThemeToggle } from "@/components/school/ThemeToggle";
import { useMe } from "@/components/school/useMe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    demoLogin(newRole);
    toast.success(`تم التبديل إلى حساب: ${roleLabel[newRole]}`);
  };

  const handleReset = () => {
    forceResetDefaultData();
    toast.success("تم تحديث وإعادة ضبط البيانات الافتراضية بنجاح");
  };

  const st = me.role === "student" ? me.student : null;
  const teacher = me.role === "teacher" ? me.teacher : null;
  const studentClass = st ? s.classes.find((c) => c.id === st.classId) : null;

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="الملف الشخصي وإعدادات الحساب"
        subtitle="بيانات الحساب المدرسي، التحكم في المظهر، وإعادة تعيين البيانات"
        icon={UserCircle}
      />

      {/* Main Profile Card */}
      <Panel className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <Avatar name={me.name} className="h-16 w-16 text-2xl" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold text-navy">
                {me.role === "teacher" ? "أ. " : ""}{me.name}
              </span>
              <Badge className="bg-gold-soft text-navy font-bold text-xs">
                {roleLabel[me.role]}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-gold" />
              <span>العام الدراسي ٢٠٢٥ - ٢٠٢٦ · مدرسة المنهل الثانوية الخاصة</span>
            </div>
          </div>
        </div>
      </Panel>

      {/* Detailed Info Card */}
      <Panel className="space-y-4">
        <h3 className="font-display text-base font-bold text-navy border-b pb-2">
          البيانات الأكاديمية والتنظيمية
        </h3>

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

        {me.role === "parent" && me.parent && (
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-xl border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block">الرقم الوطني / الهوية</span>
              <span dir="ltr" className="font-mono font-bold text-foreground text-base">
                {me.parent.nationalId}
              </span>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block">رقم الهاتف المسجل</span>
              <span dir="ltr" className="font-mono font-bold text-foreground text-base">
                {me.parent.phone}
              </span>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3 sm:col-span-2">
              <span className="text-xs text-muted-foreground block mb-1.5">الأبناء المسجلون في المدرسة ({me.children.length})</span>
              <div className="flex flex-wrap gap-2">
                {me.children.map((c) => {
                  const cls = s.classes.find((x) => x.id === c.classId);
                  return (
                    <Badge key={c.id} variant="secondary" className="text-xs py-1 px-2.5 font-bold">
                      {c.name} · {cls?.name}
                    </Badge>
                  );
                })}
              </div>
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
              <span className="text-xs text-muted-foreground block">الفصول المسندة</span>
              <span className="font-bold text-foreground text-base">
                {teacher.classes?.map((cid) => s.classes.find((c) => c.id === cid)?.short).join("، ") || "كافة الفصول المقررة"}
              </span>
            </div>
          </div>
        )}

        {me.role === "admin" && (
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-xl border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block">اسم المستخدم</span>
              <span className="font-mono font-bold text-foreground text-base">admin</span>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground block">المسمى الإداري</span>
              <span className="font-bold text-foreground text-base">مدير المدرسة والشؤون الأكاديمية</span>
            </div>
          </div>
        )}
      </Panel>

      {/* Quick Role Switcher */}
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["student", "parent", "teacher", "admin"] as Role[]).map((r) => (
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
              {r === "student" ? "حساب الطالب" : r === "parent" ? "حساب ولي الأمر" : r === "teacher" ? "حساب المعلم" : "حساب الإدارة"}
            </button>
          ))}
        </div>
      </Panel>

      {/* Theme Toggle & Reset Data */}
      <Panel className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-foreground text-sm block">المظهر الخارجي للتطبيق</span>
          <span className="text-xs text-muted-foreground">التبديل بين الوضع الليلي والوضع الفاتح</span>
        </div>
        <ThemeToggle />
      </Panel>

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

      <Button
        variant="destructive"
        className="w-full gap-2 font-bold"
        onClick={() => navigate({ to: "/login" }).then(() => logout())}
      >
        <LogOut className="h-4 w-4" />
        تسجيل الخروج من الحساب
      </Button>
    </div>
  );
}
