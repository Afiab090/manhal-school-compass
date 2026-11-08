import { Link } from "@tanstack/react-router";
import {
  Atom,
  BookMarked,
  CalendarDays,
  ChevronLeft,
  Clock,
  FlaskConical,
  GraduationCap,
  HeartHandshake,
  Lightbulb,
  Mail,
  MapPin,
  Phone,
  Target,
  Trophy,
} from "lucide-react";

import { formatDate } from "@/lib/school/logic";
import { useSchool } from "@/lib/school/store";
import { CONTACT } from "./PublicLayout";

export const stages = [
  {
    title: "الصف الأول الثانوي",
    icon: BookMarked,
    text: "مرحلة التأسيس الثانوي: تعزيز المهارات الأساسية في اللغات والرياضيات والعلوم مع برنامج إرشاد أكاديمي لاختيار المسار.",
    points: ["مواد أساسية مشتركة", "إرشاد أكاديمي مبكر", "أنشطة ثقافية ورياضية"],
  },
  {
    title: "الصف الثاني الثانوي",
    icon: FlaskConical,
    text: "التخصص في المسارين العلمي والأدبي مع مختبرات حديثة للفيزياء والكيمياء والأحياء ومعمل حاسوب متكامل.",
    points: ["المسار العلمي والأدبي", "مختبرات تطبيقية", "مشاريع بحثية"],
  },
  {
    title: "الصف الثالث الثانوي",
    icon: GraduationCap,
    text: "الاستعداد لامتحانات الشهادة الثانوية السودانية عبر خطط مراجعة مكثفة وامتحانات تجريبية ومتابعة فردية.",
    points: ["مراجعات مكثفة", "امتحانات تجريبية", "متابعة فردية لكل طالب"],
  },
];

export const values = [
  { icon: Target, title: "رسالتنا", text: "تقديم تعليم ثانوي متميز يجمع بين التحصيل العلمي الرصين والقيم الأصيلة." },
  { icon: Lightbulb, title: "رؤيتنا", text: "أن نكون المنهل الأول للتعليم الثانوي النوعي في السودان." },
  { icon: HeartHandshake, title: "قيمنا", text: "الإتقان، الأمانة، الاحترام، والشراكة الحقيقية مع الأسرة." },
];

export function StagesGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stages.map((s) => (
        <div key={s.title} className="group rounded-3xl border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:border-gold">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground group-hover:bg-gradient-gold group-hover:text-accent-foreground">
            <s.icon className="h-6 w-6" />
          </div>
          <h3 className="font-display text-xl font-bold text-navy">{s.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
          <ul className="mt-4 space-y-1.5">
            {s.points.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const catLabel = { general: "أخبار المدرسة", activities: "الأنشطة", urgent: "هام", rules: "اللوائح" } as const;

export function NewsList({ limit }: { limit?: number }) {
  const s = useSchool();
  const items = s.announcements
    .filter((a) => a.audience === "all" && (a.category === "general" || a.category === "activities" || a.category === "urgent"))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((a) => (
        <article key={a.id} className="flex flex-col rounded-3xl border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-bold text-navy">{catLabel[a.category]}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(a.date)}
            </span>
          </div>
          <h3 className="font-display text-lg font-bold leading-snug text-navy">{a.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
        </article>
      ))}
    </div>
  );
}

export function ContactCards() {
  const items = [
    { icon: MapPin, label: "العنوان", value: CONTACT.address },
    { icon: Phone, label: "الهاتف", value: `${CONTACT.phone} — ${CONTACT.mobile}`, ltr: true },
    { icon: Mail, label: "البريد الإلكتروني", value: CONTACT.email, ltr: true },
    { icon: Clock, label: "ساعات العمل", value: CONTACT.hours },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.label} className="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-card">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold">
            <i.icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{i.label}</div>
            <div className="font-bold text-foreground" dir={i.ltr ? "ltr" : undefined}>
              {i.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mb-8 text-center">
      <div className="mb-2 text-sm font-bold text-gold">{eyebrow}</div>
      <h2 className="font-display text-3xl font-bold text-navy md:text-4xl">{title}</h2>
      <div className="gold-rule mx-auto mt-3" />
      {text && <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{text}</p>}
    </div>
  );
}

export function MoreLink({ to, children }: { to: "/about" | "/stages" | "/news" | "/contact"; children: string }) {
  return (
    <div className="mt-6 text-center">
      <Link to={to} className="inline-flex items-center gap-1 font-bold text-navy hover:text-gold">
        {children}
        <ChevronLeft className="h-4 w-4" />
      </Link>
    </div>
  );
}

export const highlights = [
  { icon: Trophy, value: "+١٥", label: "عاماً من التميز" },
  { icon: GraduationCap, value: "٩٨٪", label: "نسبة النجاح في الشهادة" },
  { icon: Atom, value: "٤", label: "مختبرات علمية وحاسوبية" },
];

export function PageHero({ title, text }: { title: string; text: string }) {
  return (
    <section className="relative overflow-hidden bg-hero text-hero-foreground">
      <div className="pattern-geo absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-6xl px-4 py-14 text-center md:py-20">
        <h1 className="font-display text-4xl font-bold md:text-5xl">{title}</h1>
        <div className="gold-rule mx-auto mt-4" />
        <p className="mx-auto mt-4 max-w-2xl text-hero-foreground/80">{text}</p>
      </div>
    </section>
  );
}
