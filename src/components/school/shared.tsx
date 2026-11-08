import { AlertTriangle, CalendarDays, Megaphone, PartyPopper, ScrollText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PERIODS, formatDate } from "@/lib/school/logic";
import type { Announcement, AnnouncementCategory, AttendanceStatus, SchoolState, Slot } from "@/lib/school/types";
import { cn } from "@/lib/utils";

export const categoryMeta: Record<
  AnnouncementCategory,
  { label: string; icon: typeof Megaphone; badge: "danger" | "gold" | "success" | "muted" }
> = {
  urgent: { label: "إعلان هام", icon: AlertTriangle, badge: "danger" },
  rules: { label: "اللوائح والضوابط", icon: ScrollText, badge: "gold" },
  activities: { label: "الأنشطة", icon: PartyPopper, badge: "success" },
  general: { label: "عام", icon: Megaphone, badge: "muted" },
};

export function AnnouncementCard({
  a,
  s,
  actions,
  compact,
}: {
  a: Announcement;
  s: SchoolState;
  actions?: React.ReactNode;
  compact?: boolean;
}) {
  const meta = categoryMeta[a.category];
  const cls = a.audience !== "all" ? s.classes.find((c) => c.id === a.audience) : null;
  return (
    <article
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-card",
        a.category === "urgent" && "border-s-4 border-s-destructive",
        a.category === "rules" && "border-s-4 border-s-gold",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge variant={meta.badge} className="gap-1">
          <meta.icon className="h-3 w-3" />
          {meta.label}
        </Badge>
        {cls && <Badge variant="outline">{cls.name}</Badge>}
        <span className="ms-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          {formatDate(a.date, { day: "numeric", month: "short" })}
        </span>
      </div>
      <h3 className="font-bold leading-snug text-foreground">{a.title}</h3>
      <p className={cn("mt-1.5 text-sm leading-relaxed text-muted-foreground", compact && "line-clamp-2")}>{a.body}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{a.author}</span>
        {actions}
      </div>
    </article>
  );
}

export function SlotCard({ slot, s, showClass, highlight }: { slot: Slot; s: SchoolState; showClass?: boolean; highlight?: boolean }) {
  const p = PERIODS[slot.period - 1];
  const teacher = s.teachers.find((t) => t.id === slot.teacherId);
  const cls = s.classes.find((c) => c.id === slot.classId);
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card", highlight && "border-gold")}>
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <span className="text-[10px] opacity-80">الحصة</span>
        <span className="text-lg font-extrabold leading-none">{slot.period.toLocaleString("ar-EG")}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold text-foreground">{slot.subject}</div>
        <div className="truncate text-xs text-muted-foreground">
          {showClass ? cls?.name : teacher?.name} · {slot.room}
        </div>
      </div>
      <div dir="ltr" className="shrink-0 rounded-lg bg-gold-soft px-2 py-1 text-[11px] font-bold text-navy">
        {p?.time}
      </div>
    </div>
  );
}

export const attendanceMeta: Record<AttendanceStatus, { label: string; badge: "success" | "danger" | "warning" }> = {
  present: { label: "حاضر", badge: "success" },
  absent: { label: "غائب", badge: "danger" },
  late: { label: "متأخر", badge: "warning" },
};

export function initials(name: string) {
  const parts = name.replace(/^أ\.\s*/, "").split(" ").filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-gold font-display text-xl font-bold text-accent-foreground", className)}>
      {initials(name)}
    </div>
  );
}

/** Read an image file and shrink it so it fits comfortably in device storage. */
export function compressImage(file: File, maxSize = 1000, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذر قراءة الملف"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("الملف ليس صورة صالحة"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("تعذر معالجة الصورة"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
