import { Link } from "@tanstack/react-router";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { AppPath } from "./nav";

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between w-full">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-soft text-gold">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold leading-tight text-navy truncate sm:overflow-visible sm:whitespace-normal">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="w-full sm:w-auto shrink-0 flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-display text-xl font-bold text-navy">{children}</h2>
      {action}
    </div>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border bg-card p-4 shadow-card", className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "navy",
  hint,
  to,
  onClick,
  className,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: "navy" | "gold" | "success" | "warning" | "danger" | undefined;
  hint?: string | undefined;
  to?: AppPath | undefined;
  onClick?: (() => void) | undefined;
  className?: string | undefined;
}) {
  const tones = {
    navy: "bg-secondary text-navy",
    gold: "bg-gold-soft text-gold",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-destructive",
  } as const;

  const isClickable = Boolean(to || onClick);

  const cardInner = (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-card transition-all",
        isClickable && "hover:border-gold hover:shadow-elevated active:scale-[0.98] group cursor-pointer",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        {isClickable && (
          <ChevronLeft className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:-translate-x-1 group-hover:text-gold" />
        )}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-extrabold text-foreground">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground truncate">{hint}</div>}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block no-underline focus:outline-none">
        {cardInner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-start focus:outline-none">
        {cardInner}
      </button>
    );
  }

  return cardInner;
}

export interface GridAction {
  label: string;
  to: AppPath;
  icon: LucideIcon;
  badge?: number;
}

export function QuickGrid({ items }: { items: GridAction[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it, i) => (
        <Link
          key={it.label}
          to={it.to}
          style={{ animationDelay: `${i * 40}ms` }}
          className="animate-rise group relative flex flex-col items-center gap-2 rounded-2xl border bg-card px-2 py-4 text-center shadow-card transition-all hover:-translate-y-0.5 hover:border-gold"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-colors group-hover:bg-gradient-gold group-hover:text-accent-foreground">
            <it.icon className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <span className="text-[12.5px] font-bold leading-snug text-foreground">{it.label}</span>
          {!!it.badge && (
            <span className="absolute end-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {it.badge}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

export function Chips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
            value === o.value
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:border-gold hover:text-foreground",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="ms-1.5 opacity-70">({o.count})</span>}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className="h-full rounded-full bg-gradient-gold transition-all duration-700" style={{ width: `${value}%` }} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card/60 px-6 py-10 text-center">
      <Icon className="mb-3 h-10 w-10 text-gold" strokeWidth={1.5} />
      <div className="font-bold text-foreground">{title}</div>
      {text && <p className="mt-1 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

/** Native select styled to match inputs (reliable on mobile). */
export function NativeSelect({
  value,
  onChange,
  children,
  className,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={cn(
        "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}
