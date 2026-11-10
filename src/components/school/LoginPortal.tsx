import { useNavigate } from "@tanstack/react-router";
import { GraduationCap, KeyRound, Layers, LogIn, ShieldCheck, UserRound, Users, Zap } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO, DEMO_MODE, academicStages } from "@/lib/school/seed";
import { demoLogin, login } from "@/lib/school/store";
import type { Role, StageId } from "@/lib/school/types";
import { cn } from "@/lib/utils";
import { Field } from "./bits";

const roles: { role: Role; label: string; icon: typeof Users; idLabel: string }[] = [
  { role: "student", label: "طالب", icon: Users, idLabel: "الرقم الأكاديمي" },
  { role: "teacher", label: "معلم", icon: GraduationCap, idLabel: "الرقم الوظيفي" },
  { role: "admin", label: "الإدارة", icon: ShieldCheck, idLabel: "اسم المستخدم" },
];

function getDemoIdentifier(role: Role, stageId: StageId): string {
  if (role === "admin") return DEMO.admin.username;
  if (role === "teacher") {
    if (stageId === "مرحلة الأساس") return "T-301";
    if (stageId === "المرحلة المتوسطة") return "T-201";
    return DEMO.teacher.employeeId; // T-101
  }
  // student
  if (stageId === "مرحلة الأساس") return "STD-PRI-1001";
  if (stageId === "المرحلة المتوسطة") return "STD-MID-1001";
  return DEMO.student.academicId; // STD-SEC-1001
}

export function LoginPortal({ className }: { className?: string }) {
  const [role, setRole] = useState<Role>("student");
  const [stageId, setStageId] = useState<StageId>("المرحلة الثانوية");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const currentRole = roles.find((r) => r.role === role)!;
  const currentDemoId = getDemoIdentifier(role, stageId);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("يرجى إدخال بيانات الدخول كاملة");
      return;
    }
    const res = login(role, identifier, password, stageId);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.success(`تم تسجيل الدخول بنجاح — مرحباً بك في ${stageId}`);
    navigate({ to: "/app" });
  }

  function quick(r: Role) {
    demoLogin(r, stageId);
    const label = roles.find((x) => x.role === r)?.label ?? r;
    toast.success(`مرحباً بك — دخول تجريبي (${label} - ${stageId})`);
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

      {/* Role Toggle: 3 Roles */}
      <div role="tablist" className="mb-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-muted p-1.5">
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
              "flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-bold transition-all sm:text-sm",
              role === r.role ? "bg-card text-navy shadow-card" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <r.icon className="h-4 w-4" />
            {r.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Stage Selection Dropdown */}
        <Field label="المرحلة الدراسية">
          <div className="relative">
            <Layers className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={stageId}
              onChange={(e) => {
                setStageId(e.target.value as StageId);
                setError(null);
              }}
              className="h-11 w-full rounded-xl border border-input bg-background ps-9 pe-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {academicStages.map((stg) => (
                <option key={stg.id} value={stg.id}>
                  {stg.name}
                </option>
              ))}
            </select>
          </div>
        </Field>

        {/* Identifier Input */}
        <Field label={currentRole.idLabel}>
          <div className="relative">
            <UserRound className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              dir="ltr"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError(null);
              }}
              placeholder={currentDemoId}
              className="h-11 bg-background ps-9 text-start"
              autoComplete="username"
            />
          </div>
        </Field>

        {/* Password Input */}
        <Field label="كلمة المرور">
          <div className="relative">
            <KeyRound className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              dir="ltr"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="••••••"
              className="h-11 bg-background ps-9 text-start"
              autoComplete="current-password"
            />
          </div>
        </Field>

        {error && (
          <p className="rounded-xl border border-destructive/20 bg-danger-soft px-3 py-2 text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full">
          <LogIn className="h-4 w-4 ms-2" />
          تسجيل الدخول
        </Button>

        {DEMO_MODE && (
          <button
            type="button"
            onClick={() => {
              setIdentifier(currentDemoId);
              setPassword(DEMO.password);
              setError(null);
            }}
            className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-navy hover:underline"
          >
            تعبئة بيانات تجريبية: <span dir="ltr" className="font-mono">{currentDemoId}</span> / <span dir="ltr" className="font-mono">{DEMO.password}</span>
          </button>
        )}
      </form>

      {DEMO_MODE && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            دخول سريع للتجربة في ({stageId})
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="gold" onClick={() => quick("student")}>
              <Zap className="h-3.5 w-3.5" />
              طالب
            </Button>
            <Button variant="soft" onClick={() => quick("teacher")}>
              <Zap className="h-3.5 w-3.5" />
              معلم
            </Button>
            <Button variant="soft" onClick={() => quick("admin")}>
              <Zap className="h-3.5 w-3.5" />
              مدير
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
