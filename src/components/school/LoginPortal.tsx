import { useNavigate } from "@tanstack/react-router";
import { GraduationCap, KeyRound, LogIn, ShieldCheck, UserRound, Users, Zap } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO } from "@/lib/school/seed";
import { demoLogin, login } from "@/lib/school/store";
import type { Role } from "@/lib/school/types";
import { cn } from "@/lib/utils";
import { Field } from "./bits";

const roles: { role: Role; label: string; icon: typeof Users; idLabel: string; placeholder: string }[] = [
  { role: "student", label: "طالب / ولي أمر", icon: Users, idLabel: "الرقم الأكاديمي", placeholder: DEMO.student.academicId },
  { role: "teacher", label: "معلم", icon: GraduationCap, idLabel: "الرقم الوظيفي", placeholder: DEMO.teacher.employeeId },
  { role: "admin", label: "الإدارة", icon: ShieldCheck, idLabel: "اسم المستخدم", placeholder: DEMO.admin.username },
];

const demoIds: Record<Role, string> = {
  student: DEMO.student.academicId,
  teacher: DEMO.teacher.employeeId,
  admin: DEMO.admin.username,
};

export function LoginPortal({ className }: { className?: string }) {
  const [role, setRole] = useState<Role>("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const current = roles.find((r) => r.role === role)!;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("يرجى إدخال بيانات الدخول كاملة");
      return;
    }
    const res = login(role, identifier, password);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.success("تم تسجيل الدخول بنجاح");
    navigate({ to: "/app" });
  }

  function quick(r: Role) {
    demoLogin(r);
    toast.success(`مرحباً بك — دخول تجريبي (${roles.find((x) => x.role === r)!.label})`);
    navigate({ to: "/app" });
  }

  return (
    <div className={cn("rounded-3xl border bg-card p-5 shadow-elevated sm:p-7", className)}>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-navy">البوابة الإلكترونية</h2>
          <p className="text-sm text-muted-foreground">سجّل دخولك لمتابعة الجداول والرسوم والواجبات</p>
        </div>
      </div>

      <div role="tablist" className="mb-5 grid grid-cols-3 gap-1.5 rounded-2xl bg-muted p-1.5">
        {roles.map((r) => (
          <button
            key={r.role}
            role="tab"
            type="button"
            aria-selected={role === r.role}
            onClick={() => {
              setRole(r.role);
              setError(null);
              setIdentifier("");
            }}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-xs font-bold transition-all sm:text-sm",
              role === r.role ? "bg-card text-navy shadow-card" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <r.icon className="h-[18px] w-[18px]" />
            {r.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={current.idLabel}>
          <div className="relative">
            <UserRound className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              dir="ltr"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={current.placeholder}
              className="h-11 bg-background ps-9 text-start"
              autoComplete="username"
            />
          </div>
        </Field>
        <Field label="كلمة المرور">
          <div className="relative">
            <KeyRound className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              dir="ltr"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="h-11 bg-background ps-9 text-start"
              autoComplete="current-password"
            />
          </div>
        </Field>
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full">
          <LogIn />
          تسجيل الدخول
        </Button>
        <button
          type="button"
          onClick={() => {
            setIdentifier(demoIds[role]);
            setPassword(DEMO.password);
          }}
          className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-navy hover:underline"
        >
          تعبئة بيانات تجريبية: <span dir="ltr">{demoIds[role]}</span> / <span dir="ltr">{DEMO.password}</span>
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        دخول سريع للتجربة
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button variant="gold" onClick={() => quick("student")}>
          <Zap />
          كطالب
        </Button>
        <Button variant="soft" onClick={() => quick("teacher")}>
          <Zap />
          كمعلم
        </Button>
        <Button variant="soft" onClick={() => quick("admin")}>
          <Zap />
          كمدير
        </Button>
      </div>
    </div>
  );
}
