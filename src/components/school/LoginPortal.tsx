import { useNavigate } from "@tanstack/react-router";
import { GraduationCap, KeyRound, LogIn, ShieldCheck, Users, Zap } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO, DEMO_MODE } from "@/lib/school/seed";
import { demoLogin, login } from "@/lib/school/store";
import type { Role, StageId } from "@/lib/school/types";
import { cn } from "@/lib/utils";
import { Field } from "./bits";

const stageOptions: { id: StageId; label: string }[] = [
  { id: "stg-pri", label: "مرحلة الأساس" },
  { id: "stg-mid", label: "المرحلة المتوسطة" },
  { id: "stg-sec", label: "المرحلة الثانوية" },
];
const roles: { role: Role; label: string; icon: typeof Users; idLabel: string; placeholder: string }[] = [
  { role: "student", label: "طالب", icon: Users, idLabel: "الرقم الأكاديمي", placeholder: DEMO.student.academicId },
  { role: "teacher", label: "معلم", icon: GraduationCap, idLabel: "الرقم الوظيفي", placeholder: DEMO.teacher.employeeId },
  { role: "admin", label: "الإدارة", icon: ShieldCheck, idLabel: "اسم المستخدم", placeholder: DEMO.admin.username },
];

export function LoginPortal({ className }: { className?: string }) {
  const [role, setRole] = useState<Role>("student");
  const [stageId, setStageId] = useState<StageId | "">("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const current = roles.find((item) => item.role === role)!;
  const demoIds: Record<Role, string> = { student: DEMO.student.academicId, teacher: DEMO.teacher.employeeId, admin: DEMO.admin.username };

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!identifier.trim() || !password) { setError("يرجى إدخال بيانات الدخول كاملة"); return; }
    if (!stageId) { setError("يرجى اختيار المرحلة الدراسية"); return; }
    const result = login(role, identifier, password, stageId);
    if (!result.ok) { setError(result.error); return; }
    toast.success("تم تسجيل الدخول بنجاح");
    navigate({ to: "/app" });
  }
  function quick(nextRole: Role) {
    if (!DEMO_MODE) return;
    if (!stageId) { setError("يرجى اختيار المرحلة الدراسية"); return; }
    const result = demoLogin(nextRole, stageId);
    if (!result.ok) { setError(result.error); return; }
    toast.success(`مرحباً بك — دخول تجريبي (${roles.find((item) => item.role === nextRole)!.label})`);
    navigate({ to: "/app" });
  }

  return (
    <div className={cn("mx-auto w-full max-w-lg rounded-3xl border bg-card p-5 shadow-elevated sm:p-7", className)}>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><KeyRound className="h-5 w-5" /></div>
        <div><h2 className="font-display text-2xl font-bold text-navy">تسجيل الدخول</h2><p className="text-sm text-muted-foreground">بوابة مدرسة المنهل الإلكترونية</p></div>
      </div>
      <div role="tablist" aria-label="نوع الحساب" className="mb-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-muted p-1.5">
        {roles.map((item) => <button key={item.role} role="tab" type="button" aria-selected={role === item.role} onClick={() => { setRole(item.role); setError(null); setIdentifier(""); }} className={cn("flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-bold transition-all", role === item.role ? "bg-card text-navy shadow-card" : "text-muted-foreground hover:text-foreground")}><item.icon className="h-4 w-4" />{item.label}</button>)}
      </div>
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="المرحلة الدراسية">
          <select required value={stageId} onChange={(event) => { setStageId(event.target.value as StageId); setError(null); }} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="">اختر المرحلة</option>{stageOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
        <Field label={current.idLabel}>
          <Input dir="ltr" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={current.placeholder} className="h-11 bg-background text-start" autoComplete="username" />
        </Field>
        <Field label="كلمة المرور">
          <Input dir="ltr" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••" className="h-11 bg-background text-start" autoComplete="current-password" />
        </Field>
        {error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full"><LogIn /> تسجيل الدخول</Button>
        {DEMO_MODE && <button type="button" onClick={() => { setIdentifier(demoIds[role]); setPassword(DEMO.password); }} className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-navy hover:underline">تعبئة بيانات تجريبية: <span dir="ltr">{demoIds[role]}</span> / <span dir="ltr">{DEMO.password}</span></button>}
      </form>
      {DEMO_MODE && <>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />الدخول السريع للتجربة<span className="h-px flex-1 bg-border" /></div>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="gold" onClick={() => quick("student")}><Zap /> طالب</Button>
          <Button variant="soft" onClick={() => quick("teacher")}><Zap /> معلم</Button>
          <Button variant="soft" onClick={() => quick("admin")}><Zap /> إدارة</Button>
        </div>
      </>}
    </div>
  );
}
