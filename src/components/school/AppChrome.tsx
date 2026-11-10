import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, BellOff, ChevronLeft, LogOut, Menu, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate } from "@/lib/school/logic";
import { DEMO_MODE } from "@/lib/school/seed";
import { demoLogin, forceResetDefaultData, logout, markNotificationsRead, notificationsFor } from "@/lib/school/store";
import type { Role, StageId } from "@/lib/school/types";
import { cn } from "@/lib/utils";
import { Logo, LogoMark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { getDrawerCategories, roleLabel, type AppPath, type NavItem } from "./nav";
import { useMe } from "./useMe";

const demoRoles: Role[] = ["student", "teacher", "admin"];
function firstName(name: string) { return name.replace(/^أ\.\s*/, "").split(" ")[0] ?? name; }

export function TopBar({ onOpenDrawer }: { onOpenDrawer?: () => void }) {
  const { me } = useMe();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = onOpenDrawer ?? (() => setDrawerOpen(true));
  return <>
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
        <Button variant="outline" size="icon" onClick={openDrawer} className="h-10 w-10 shrink-0 rounded-xl" aria-label="فتح القائمة الرئيسية"><Menu className="h-5 w-5" /></Button>
        <Link to="/app" className="flex items-center gap-2.5"><LogoMark className="h-9 w-9" /><div className="leading-tight"><span className="font-display text-sm font-bold text-navy sm:text-base">مدرسة المنهل</span>{me.role !== "admin" && <span className="hidden text-[10px] text-muted-foreground sm:block">المدرسة الإلكترونية</span>}</div></Link>
        {me.role !== "admin" && <div className="min-w-0 flex-1 px-1"><div className="truncate text-sm font-bold text-foreground">أهلاً، {me.role === "teacher" ? "أ. " : ""}{firstName(me.name)}</div><span className="mt-0.5 inline-flex rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-navy">{roleLabel[me.role]}</span></div>}
        {me.role === "admin" && <div className="flex-1" />}
        <NotificationBell /><ThemeToggle />
      </div>
    </header>
    {!onOpenDrawer && <SideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />}
  </>;
}

export function SideDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { s, me } = useMe();
  const navigate = useNavigate();
  const categories = useMemo(() => getDrawerCategories(me.role), [me.role]);
  const stageId = s.session?.stageId ?? "stg-pri";
  const handleRoleSwitch = (role: Role) => { const result = demoLogin(role, stageId); if (!result.ok) { toast.error(result.error); return; } toast.success(`تم التبديل إلى حساب: ${roleLabel[role]}`); onOpenChange(false); navigate({ to: "/app" }); };
  const handleReset = () => { forceResetDefaultData(); toast.success("تمت إعادة ضبط البيانات التجريبية"); onOpenChange(false); };
  const handleNav = (item: NavItem) => { onOpenChange(false); if (item.tab) navigate({ to: item.to, search: { tab: item.tab } as never }); else navigate({ to: item.to }); };
  const leave = () => { logout(); onOpenChange(false); navigate({ to: "/login" }); };
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="flex w-[85vw] max-w-[340px] flex-col border-s bg-card p-0 shadow-elevated">
      <SheetHeader className="sr-only"><SheetTitle>قائمة التنقل الجانبية</SheetTitle></SheetHeader>
      <div className="border-b bg-muted/40 p-5"><Logo /><div className="mt-4 flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-gold font-display font-bold text-accent-foreground">{me.name.slice(0, 2)}</div><div className="min-w-0"><div className="truncate text-sm font-bold">{me.name}</div><span className="mt-1 inline-flex rounded-md bg-gold-soft px-1.5 py-0.5 text-[10px] font-bold text-navy">{roleLabel[me.role]}</span></div></div></div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">{categories.map((category) => <div key={category.title} className="space-y-1.5"><div className="px-3 text-[11px] font-bold text-muted-foreground">{category.title}</div>{category.items.map((item) => <button key={`${item.to}-${item.tab ?? item.label}`} type="button" onClick={() => handleNav(item)} className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-sm font-semibold text-foreground transition-colors hover:bg-gold-soft hover:text-navy"><span className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-gold group-hover:text-accent-foreground"><item.icon className="h-4 w-4" /></span>{item.label}</span><ChevronLeft className="h-4 w-4 text-muted-foreground/50" /></button>)}</div>)}</div>
      <div className="space-y-3 border-t bg-muted/20 p-4">
        {DEMO_MODE && <><div><div className="mb-1.5 flex items-center gap-1 text-[11px] font-bold text-muted-foreground"><Sparkles className="h-3 w-3 text-gold" />تبديل سريع للحساب</div><div className="grid grid-cols-3 gap-1 rounded-xl border bg-card p-1">{demoRoles.map((role) => <button key={role} type="button" onClick={() => handleRoleSwitch(role)} className={cn("rounded-lg py-1.5 text-xs font-bold", me.role === role ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{roleLabel[role]}</button>)}</div></div><Button variant="outline" size="sm" onClick={handleReset} className="w-full gap-2 text-xs font-bold"><RotateCcw className="h-3.5 w-3.5 text-gold" />إعادة ضبط البيانات التجريبية</Button></>}
        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><ThemeToggle /><span className="text-xs font-semibold text-muted-foreground">المظهر</span></div><button onClick={leave} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-destructive hover:bg-danger-soft"><LogOut className="h-4 w-4" />تسجيل الخروج</button></div>
      </div>
    </SheetContent>
  </Sheet>;
}

function NotificationBell() {
  const { s, me } = useMe();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const items = useMemo(() => notificationsFor(s, me.role, me.id).sort((a, b) => b.date.localeCompare(a.date)), [s, me.role, me.id]);
  const unread = items.filter((item) => !item.readBy.includes(me.id));
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button aria-label="الإشعارات" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-card text-foreground hover:bg-gold-soft hover:text-navy"><Bell className="h-4 w-4" />{unread.length > 0 && <span className="absolute -end-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-card bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread.length}</span>}</button></PopoverTrigger><PopoverContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl p-0 shadow-elevated"><div className="flex items-center justify-between border-b px-4 py-3"><strong className="text-sm">الإعلانات والتنبيهات</strong>{unread.length > 0 && <button className="text-xs font-semibold text-gold hover:underline" onClick={() => markNotificationsRead(me.id, unread.map((item) => item.id))}>تعليم الكل كمقروء</button>}</div><div className="max-h-[60vh] overflow-y-auto">{items.length === 0 && <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground"><BellOff className="h-6 w-6" />لا توجد إشعارات حالياً</div>}{items.slice(0, 20).map((item) => <button key={item.id} className={cn("flex w-full items-start gap-3 border-b px-4 py-3 text-start last:border-0 hover:bg-muted", !item.readBy.includes(me.id) && "bg-gold-soft/40")} onClick={() => { markNotificationsRead(me.id, [item.id]); setOpen(false); if (item.link) navigate({ to: item.link as AppPath }); }}><span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", !item.readBy.includes(me.id) ? "bg-destructive" : "bg-border")} /><span className="min-w-0"><strong className="block text-sm">{item.title}</strong><span className="mt-0.5 block text-xs text-muted-foreground">{item.body}</span><span className="mt-1 block text-[10px] text-muted-foreground">{formatDate(item.date, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></span></button>)}</div></PopoverContent></Popover>;
}

export function SideNav() {
  const { s, me } = useMe();
  const navigate = useNavigate();
  const categories = useMemo(() => getDrawerCategories(me.role), [me.role]);
  const stageId: StageId = s.session?.stageId ?? "stg-pri";
  const leave = () => { logout(); navigate({ to: "/login" }); };
  return <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e bg-card shadow-sm md:flex"><Link to="/app" className="flex items-center gap-2.5 border-b px-5 py-4"><LogoMark className="h-10 w-10" /><div className="leading-tight"><div className="font-display text-lg font-bold text-navy">مدرسة المنهل</div><div className="text-[11px] text-muted-foreground">المدرسة الإلكترونية</div></div></Link><div className="border-b bg-muted/30 px-4 py-3"><div className="truncate text-sm font-bold">{me.name}</div><span className="text-[11px] text-muted-foreground">{roleLabel[me.role]} · {s.stages.find((stage) => stage.id === stageId)?.name}</span></div><div className="flex-1 space-y-4 overflow-y-auto p-3">{categories.map((category) => <div key={category.title} className="space-y-1"><div className="px-3 text-[11px] font-bold text-muted-foreground/75">{category.title}</div>{category.items.map((item) => <Link key={`${item.to}-${item.tab ?? item.label}`} to={item.to} search={item.tab ? ({ tab: item.tab } as never) : undefined} activeOptions={{ exact: item.to === "/app" && !item.tab }} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"><item.icon className="h-4 w-4" />{item.label}</Link>)}</div>)}</div><div className="space-y-2 border-t bg-muted/10 p-3">{DEMO_MODE && <div className="grid grid-cols-3 gap-1 rounded-xl border bg-card p-1">{demoRoles.map((role) => <button key={role} type="button" onClick={() => { const result = demoLogin(role, stageId); if (!result.ok) { toast.error(result.error); return; } navigate({ to: "/app" }); }} className={cn("rounded-md py-1 text-[11px] font-bold", me.role === role ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{roleLabel[role]}</button>)}</div>}<button onClick={leave} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-danger-soft"><LogOut className="h-4 w-4" />تسجيل الخروج</button></div></aside>;
}
