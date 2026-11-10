import { Link } from "@tanstack/react-router";
import { LogIn, Mail, MapPin, Menu, Phone } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export const publicLinks = [
  { to: "/", label: "الرئيسية" },
  { to: "/about", label: "عن المدرسة" },
  { to: "/stages", label: "المراحل التعليمية" },
  { to: "/news", label: "آخر الأخبار" },
  { to: "/contact", label: "تواصل معنا" },
] as const;

export const CONTACT = {
  phone: "0183 456 789",
  mobile: "0912 345 678",
  email: "info@almanhal-school.edu.sd",
  address: "الخرطوم - حي الرياض، شارع المشتل",
  hours: "الأحد - الخميس: 7:30 ص - 2:00 م",
};

export function PublicLayout({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
        <div className={`mx-auto flex ${compact ? "h-14 max-w-5xl justify-center" : "h-16 max-w-6xl justify-between"} items-center gap-3 px-4`}>
          <Link to="/">
            <Logo />
          </Link>
          {!compact && <nav className="hidden items-center gap-1 lg:flex">
            {publicLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: true }}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-navy data-[status=active]:text-navy data-[status=active]:bg-gold-soft"
              >
                {l.label}
              </Link>
            ))}
          </nav>}
          {!compact && <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild className="hidden sm:inline-flex">
              <Link to="/login">
                <LogIn />
                البوابة الإلكترونية
              </Link>
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="القائمة"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card text-navy lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-card">
                <SheetTitle className="mb-6">
                  <Logo />
                </SheetTitle>
                <nav className="flex flex-col gap-1">
                  {publicLinks.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setOpen(false)}
                      activeOptions={{ exact: true }}
                      className="rounded-xl px-4 py-3 font-semibold text-foreground hover:bg-gold-soft data-[status=active]:bg-gold-soft data-[status=active]:text-navy"
                    >
                      {l.label}
                    </Link>
                  ))}
                  <Button asChild className="mt-4">
                    <Link to="/login" onClick={() => setOpen(false)}>
                      <LogIn />
                      البوابة الإلكترونية
                    </Link>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>}
        </div>
      </header>
      <main>{children}</main>
      <footer className="bg-hero text-hero-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
          <div>
            <Logo tone="hero" />
            <p className="mt-4 text-sm leading-relaxed text-hero-foreground/75">
              منهل العلم والمعرفة — نصنع جيلاً متميزاً علمياً وخُلقياً، قادراً على المنافسة وخدمة وطنه.
            </p>
          </div>
          <div>
            <h3 className="mb-3 font-display text-lg font-bold text-gold">روابط سريعة</h3>
            <ul className="space-y-2 text-sm">
              {publicLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-hero-foreground/80 hover:text-gold">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-display text-lg font-bold text-gold">تواصل معنا</h3>
            <ul className="space-y-2.5 text-sm text-hero-foreground/80">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" />{CONTACT.address}</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" /><span dir="ltr">{CONTACT.phone}</span></li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" /><span dir="ltr">{CONTACT.email}</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-hero-foreground/10 py-4 text-center text-xs text-hero-foreground/60">
          © {new Date().getFullYear()} مدرسة المنهل الثانوية الخاصة — جميع الحقوق محفوظة
        </div>
      </footer>
    </div>
  );
}
