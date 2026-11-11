import { useNavigate } from "@tanstack/react-router";
import {
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Layers,
  LogIn,
  ShieldCheck,
  UserRound,
  Users,
  Zap,
} from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
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

        {/* Password Input with Visibility Toggle */}
        <Field label="كلمة المرور">
          <div className="relative">
            <KeyRound className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              dir="ltr"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="••••••"
              className="h-11 bg-background ps-9 pe-11 text-start"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={showPassword ? "إخفاء كلمة المرور" : "عرض كلمة المرور"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
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
      </form>
    </div>
  );
}

/**
 * Standalone demo switcher isolated outside the primary login card.
 * Rendered only when DEMO_MODE is true.
 */
export function DemoQuickSwitcher({ className }: { className?: string }) {
  const [stageId, setStageId] = useState<StageId>("المرحلة الثانوية");
  const navigate = useNavigate();

  if (!DEMO_MODE) return null;

  function quick(r: Role) {
    demoLogin(r, stageId);
    const label = roles.find((x) => x.role === r)?.label ?? r;
    toast.success(`مرحباً بك — دخول تجريبي (${label} - ${stageId})`);
    navigate({ to: "/app" });
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-gold/40 bg-card/90 p-4 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gold/20 text-gold-darker">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-navy">دخول سريع للتجربة (Demo Mode)</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>المرحلة:</span>
          <select
            value={stageId}
            onChange={(e) => setStageId(e.target.value as StageId)}
            className="h-7 rounded-lg border border-input bg-background px-2 text-xs font-semibold text-foreground focus:outline-none"
          >
            {academicStages.map((stg) => (
              <option key={stg.id} value={stg.id}>
                {stg.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="gold"
          size="sm"
          onClick={() => quick("student")}
          className="text-xs font-bold gap-1.5 h-8"
        >
          <Zap className="h-3 w-3" />
          طالب
        </Button>
        <Button
          variant="soft"
          size="sm"
          onClick={() => quick("teacher")}
          className="text-xs font-bold gap-1.5 h-8"
        >
          <Zap className="h-3 w-3" />
          معلم
        </Button>
        <Button
          variant="soft"
          size="sm"
          onClick={() => quick("admin")}
          className="text-xs font-bold gap-1.5 h-8"
        >
          <Zap className="h-3 w-3" />
          مدير
        </Button>
      </div>
    </div>
  );
}
