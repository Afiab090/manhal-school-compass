import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, LogIn } from "lucide-react";

import campus from "@/assets/school-campus.jpg";
import { LoginPortal } from "@/components/school/LoginPortal";
import { PublicLayout } from "@/components/school/PublicLayout";
import {
  ContactCards,
  MoreLink,
  NewsList,
  SectionHeading,
  StagesGrid,
  highlights,
  values,
} from "@/components/school/PublicSections";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مجمع مدارس المنهل الخاصة — منهل العلم وصناعة المستقبل" },
      {
        name: "description",
        content: "الموقع الرسمي والبوابة المدرسية الإلكترونية لمجمع مدارس المنهل الخاصة: المراحل الابتدائية والمتوسطة والثانوية (بنين وبنات).",
      },
      { property: "og:title", content: "مجمع مدارس المنهل الخاصة" },
      { property: "og:description", content: "منهل العلم والمعرفة — البوابة الإلكترونية الشاملة للطلاب وأولياء الأمور والمعلمين." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero text-hero-foreground">
        <img
          src={campus}
          alt="مبنى مدرسة المنهل الثانوية الخاصة"
          width={1600}
          height={1008}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="bg-gradient-hero absolute inset-0" />
        <div className="pattern-geo absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 md:pb-24 md:pt-24">
          <div className="max-w-2xl animate-rise">
            <span className="inline-block rounded-full border border-gold/40 bg-gold/15 px-4 py-1.5 text-sm font-bold text-gold">
              العام الدراسي ٢٠٢٦ / ٢٠٢٧
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.35] md:text-6xl">
              منهلُ العلمِ <span className="text-gold">وصناعةُ المستقبل</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-hero-foreground/85 md:text-lg">
              مجمع مدارس المنهل الخاصة — بيئة تعليمية وتربوية متكاملة (ابتدائي، متوسط، ثانوي - بنين وبنات) تجمع بين التميز الأكاديمي والقيم الأصيلة، مع بوابة إلكترونية تربط الطالب وولي الأمر والمعلم في مكان واحد.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg">
                <Link to="/login">
                  <LogIn />
                  البوابة الإلكترونية
                </Link>
              </Button>
              <Button asChild variant="heroOutline" size="lg">
                <Link to="/about">
                  تعرّف على المدرسة
                  <ChevronLeft />
                </Link>
              </Button>
            </div>
          </div>
          <div className="mt-12 grid max-w-2xl grid-cols-3 gap-3">
            {highlights.map((h) => (
              <div key={h.label} className="rounded-2xl border border-hero-foreground/15 bg-hero-foreground/5 p-3 backdrop-blur-sm md:p-4">
                <h.icon className="mb-2 h-5 w-5 text-gold" />
                <div className="text-2xl font-extrabold">{h.value}</div>
                <div className="text-[11px] text-hero-foreground/70 md:text-xs">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading
          eyebrow="عن المدرسة"
          title="تعليم يبني العقل ويهذّب الخُلق"
          text="تأسست مدرسة المنهل لتكون صرحاً تعليمياً يقدّم لطلاب المرحلة الثانوية تجربة تعليمية حديثة بكادر مؤهل ومرافق متكاملة."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-3xl border bg-card p-6 text-center shadow-card">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-soft text-gold">
                <v.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-navy">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>
        <MoreLink to="/about">المزيد عن المدرسة</MoreLink>
      </section>

      {/* Stages */}
      <section className="border-y bg-secondary/50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            eyebrow="المراحل التعليمية"
            title="منظومة تعليمية متدرجة وشاملة"
            text="نوفر تعليماً متميزاً عبر المراحل الابتدائية والمتوسطة والثانوية مع كادر تعليمي خبير ومرافق متطورة لكلا الجنسين."
          />
          <StagesGrid />
        </div>
      </section>

      {/* News */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading eyebrow="آخر الأخبار" title="ما الجديد في المنهل" />
        <NewsList limit={3} />
        <MoreLink to="/news">كل الأخبار</MoreLink>
      </section>

      {/* Portal */}
      <section id="portal" className="relative overflow-hidden bg-hero py-16">
        <div className="pattern-geo absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
          <div className="text-hero-foreground">
            <div className="mb-2 text-sm font-bold text-gold">المدرسة الإلكترونية</div>
            <h2 className="font-display text-3xl font-bold md:text-4xl">كل ما يخص الطالب في تطبيق واحد</h2>
            <div className="gold-rule mt-3" />
            <ul className="mt-6 space-y-3 text-hero-foreground/85">
              {["الجداول الدراسية اليومية", "متابعة الرسوم وإرفاق إشعارات الدفع", "الواجبات والمذكرات الدراسية", "الحضور والغياب لحظة بلحظة", "التقويم ومواعيد الامتحانات"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-gold" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <LoginPortal />
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading eyebrow="تواصل معنا" title="يسعدنا تواصلكم" />
        <ContactCards />
        <MoreLink to="/contact">صفحة التواصل</MoreLink>
      </section>
    </PublicLayout>
  );
}
