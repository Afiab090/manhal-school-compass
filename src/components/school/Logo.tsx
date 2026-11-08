import logo from "@/assets/manhal-logo-sm.png";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="شعار مدرسة المنهل"
      width={320}
      height={320}
      className={cn("h-10 w-10 shrink-0 object-contain", className)}
    />
  );
}

export function Logo({ className, tone = "default" }: { className?: string; tone?: "default" | "hero" }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <div className="leading-tight">
        <div
          className={cn(
            "font-display text-lg font-bold",
            tone === "hero" ? "text-hero-foreground" : "text-navy",
          )}
        >
          مدرسة المنهل
        </div>
        <div className={cn("text-[11px]", tone === "hero" ? "text-hero-foreground/70" : "text-muted-foreground")}>
          الثانوية الخاصة
        </div>
      </div>
    </div>
  );
}
