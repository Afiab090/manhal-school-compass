import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/lib/school/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "الوضع الفاتح" : "الوضع الداكن"}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card text-navy transition-colors hover:bg-gold-soft",
        className,
      )}
    >
      {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
