import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BellOff,
  Calendar,
  ChevronLeft,
  LogOut,
  Menu,
  RotateCcw,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDate } from "@/lib/school/logic";
import {
  demoLogin,
  forceResetDefaultData,
  logout,
  markNotificationsRead,
  notificationsFor,
} from "@/lib/school/store";
import type { Role } from "@/lib/school/types";
import { cn } from "@/lib/utils";
import { Logo, LogoMark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { getDrawerCategories, roleLabel, type AppPath, type NavItem } from "./nav";
import { useMe } from "./useMe";

function firstName(name: string) {
  const parts = name.replace(/^أ\.\s*/, "").split(" ");
  return parts[0];
}

export function TopBar({ onOpenDrawer }: { onOpenDrawer?: () => void }) {
  const { me } = useMe();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = onOpenDrawer ?? (() => setDrawerOpen(true));

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          {/* Hamburger Menu Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={openDrawer}
            className="h-10 w-10 shrink-0 rounded-xl border-border hover:border-gold hover:bg-gold-soft hover:text-navy focus:outline-none"
            aria-label="فتح القائمة الرئيسية"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* School Brand & Logo */}
          <Link to="/app" className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <div className="hidden sm:block leading-tight">
              <span className="font-display text-base font-bold text-navy">مدرسة المنهل</span>
              <span className="block text-[10px] text-muted-foreground">المدرسة الإلكترونية</span>
            </div>
          </Link>

          {/* User Welcome */}
          <div className="min-w-0 flex-1 px-1">
            <div className="truncate text-sm font-bold text-foreground">
              أهلاً، {me.role === "teacher" ? "أ. " : ""}
              {firstName(me.name)} 👋
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-navy">
                {roleLabel[me.role]}
              </span>
              <span className="hidden md:inline-flex text-[11px] text-muted-foreground">
                العام الدراسي ٢٠٢٥ - ٢٠٢٦
              </span>
            </div>
          </div>

          {/* Notifications and Theme Toggle */}
          <NotificationBell />
          <ThemeToggle />
        </div>
      </header>

      {/* Internal drawer instance if not managed higher up */}
      {!onOpenDrawer && <SideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />}
    </>
  );
}

export function SideDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { me } = useMe();
  const navigate = useNavigate();
  const categories = useMemo(() => getDrawerCategories(me.role), [me.role]);

  const handleRoleSwitch = (newRole: Role) => {
    demoLogin(newRole);
    toast.success(`تم التبديل إلى حساب: ${roleLabel[newRole]}`);
    onOpenChange(false);
    navigate({ to: "/app" });
  };

  const handleReset = () => {
    forceResetDefaultData();
    toast.success("تم تحديث وإعادة ضبط البيانات الافتراضية بنجاح");
    onOpenChange(false);
  };

  const handleNavClick = (to: AppPath, tab?: string) => {
    onOpenChange(false);
    if (tab) {
      navigate({ to, search: { tab } as any });
    } else {
      navigate({ to });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[85vw] max-w-[340px] flex-col p-0 bg-card border-s border-border shadow-elevated"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>قائمة التنقل الجانبية</SheetTitle>
        </SheetHeader>

        {/* 1. Header: School Brand, User Profile, Academic Year */}
        <div className="border-b bg-muted/40 p-5">
          <div className="flex items-center justify-between">
            <Logo />
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-gold font-display text-base font-bold text-accent-foreground">
              {me.name.replace(/^أ\.\s*/, "").slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-foreground">
                {me.role === "teacher" ? "أ. " : ""}{me.name}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center rounded-md bg-gold-soft px-1.5 py-0.5 text-[10px] font-bold text-navy">
                  {roleLabel[me.role]}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gold" />
              العام الدراسي ٢٠٢٥ - ٢٠٢٦
            </span>
            <span className="text-gold font-semibold">الفصل الأول</span>
          </div>
        </div>

        {/* 2. Categorized Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {categories.map((cat, catIdx) => (
            <div key={cat.title || catIdx} className="space-y-1.5">
              <div className="px-3 text-[11px] font-bold text-muted-foreground/80 tracking-wider">
                {cat.title}
              </div>
              <div className="space-y-1">
                {cat.items.map((item) => (
                  <button
                    key={`${item.to}-${item.tab || item.label}`}
                    type="button"
                    onClick={() => handleNavClick(item.to, item.tab)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-gold-soft hover:text-navy group text-start"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-gold group-hover:text-accent-foreground">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:-translate-x-0.5 group-hover:text-navy" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 3. Footer: Role Switcher, Reset Seed, Theme, Logout */}
        <div className="border-t bg-muted/20 p-4 space-y-3">
          {/* Quick Role Switcher */}
          <div>
            <div className="mb-1.5 flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
              <Sparkles className="h-3 w-3 text-gold" />
              تبديل سريع للحساب (للتجربة)
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-xl border bg-card p-1">
              {(["student", "teacher", "admin"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleSwitch(r)}
                  className={cn(
                    "rounded-lg py-1.5 text-xs font-bold transition-all",
                    me.role === r
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {r === "student" ? "طالب" : r === "teacher" ? "معلم" : "إدارة"}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Demo Data Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="w-full justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground border-border"
          >
            <RotateCcw className="h-3.5 w-3.5 text-gold" />
            تحديث وإعادة ضبط البيانات الافتراضية
          </Button>

          {/* Bottom Row: Theme & Logout */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <span className="text-xs text-muted-foreground font-semibold">المظهر</span>
            </div>

            <button
              onClick={() => {
                onOpenChange(false);
                navigate({ to: "/login" }).then(() => logout());
              }}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-destructive transition-colors hover:bg-danger-soft"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NotificationBell() {
  const { s, me } = useMe();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const items = useMemo(
    () => notificationsFor(s, me.role as Role, me.id).sort((a, b) => b.date.localeCompare(a.date)),
    [s, me.role, me.id],
  );
  const unread = items.filter((n) => !n.readBy.includes(me.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="الإشعارات"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-card text-foreground transition-colors hover:bg-gold-soft hover:text-navy hover:border-gold"
        >
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -end-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-card bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl p-0 shadow-elevated">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-bold text-foreground">الإشعارات والتنبيهات</div>
          {unread.length > 0 && (
            <button
              className="text-xs font-semibold text-gold hover:underline"
              onClick={() => markNotificationsRead(me.id, unread.map((n) => n.id))}
            >
              تعليم الكل كمقروء
            </button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
              <BellOff className="h-6 w-6 text-muted-foreground/60" />
              لا توجد إشعارات حالياً
            </div>
          )}
          {items.slice(0, 20).map((n) => {
            const isUnread = !n.readBy.includes(me.id);
            return (
              <button
                key={n.id}
                className={cn(
                  "flex w-full items-start gap-3 border-b px-4 py-3 text-start transition-colors last:border-0 hover:bg-muted",
                  isUnread && "bg-gold-soft/40",
                )}
                onClick={() => {
                  markNotificationsRead(me.id, [n.id]);
                  setOpen(false);
                  if (n.link) navigate({ to: n.link as AppPath });
                }}
              >
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", isUnread ? "bg-destructive" : "bg-border")} />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-foreground">{n.title}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{n.body}</span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">{formatDate(n.date, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Persistent desktop sidebar for wide screens */
export function SideNav() {
  const { me } = useMe();
  const navigate = useNavigate();
  const categories = useMemo(() => getDrawerCategories(me.role), [me.role]);

  const handleRoleSwitch = (newRole: Role) => {
    demoLogin(newRole);
    toast.success(`تم التبديل إلى حساب: ${roleLabel[newRole]}`);
    navigate({ to: "/app" });
  };

  return (
    <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e bg-card md:flex shadow-sm">
      <Link to="/" className="flex items-center gap-2.5 border-b px-5 py-4">
        <LogoMark className="h-10 w-10" />
        <div className="leading-tight">
          <div className="font-display text-lg font-bold text-navy">مدرسة المنهل</div>
          <div className="text-[11px] text-muted-foreground">الثانوية الخاصة</div>
        </div>
      </Link>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {categories.map((cat, idx) => (
          <div key={cat.title || idx} className="space-y-1">
            <div className="px-3 text-[11px] font-bold text-muted-foreground/75 tracking-wider">
              {cat.title}
            </div>
            {cat.items.map((it) => (
              <Link
                key={`${it.to}-${it.tab || it.label}`}
                to={it.to}
                search={it.tab ? ({ tab: it.tab } as any) : undefined}
                activeOptions={{ exact: it.to === "/app" && !it.tab }}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="border-t p-3 space-y-2 bg-muted/10">
        <div className="rounded-xl border bg-card p-1 grid grid-cols-3 gap-1">
          {(["student", "teacher", "admin"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleSwitch(r)}
              className={cn(
                "rounded-md py-1 text-[11px] font-bold transition-all",
                me.role === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {r === "student" ? "طالب" : r === "teacher" ? "معلم" : "إدارة"}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            navigate({ to: "/login" }).then(() => logout());
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-destructive hover:bg-danger-soft transition-colors"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
