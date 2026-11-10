import { Navigate, createFileRoute } from "@tanstack/react-router";

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
import { currentUser, useSchool } from "@/lib/school/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مجمع مدارس المنهل الخاصة — منهل العلم وصناعة المستقبل" },
      {
        name: "description",
        content: "الموقع الرسمي والبوابة المدرسية الإلكترونية لمجمع مدارس المنهل الخاصة: المراحل الابتدائية والمتوسطة والثانوية (بنين وبنات).",
      },
      { property: "og:title", content: "مجمع مدارس المنهل الخاصة" },
      { property: "og:description", content: "منهل العلم والمعرفة — البوابة الإلكترونية الشاملة للطلاب والمعلمين والإدارة." },
    ],
  }),
  component: Index,
});

function Index() {
  const s = useSchool();
  const user = currentUser(s);

  // Auto-redirect authenticated users directly to /app
  if (user) {
    return <Navigate to="/app" />;
  }

  return (
    <PublicLayout>
      {/* Top Section: Compact Portal Header & Login Portal directly at the top */}
      <section className="relative overflow-hidden bg-hero py-8 md:py-12">
        <div className="pattern-geo absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-5xl px-4">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            {/* Left/Intro Column */}
            <div className="text-hero-foreground lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/15 px-3.5 py-1 text-xs font-bold text-gold">
                العام الدراسي ٢٠٢٥ / ٢٠٢٦
              </div>
              <h1 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl text-hero-foreground">
                منهلُ العلمِ <span className="text-gold">وصناعةُ المستقبل</span>
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-hero-foreground/85">
                البوابة الإلكترونية الموحدة لمجمع مدارس المنهل الخاصة. متابعة الجداول، الرسوم الدراسية، الحضور والغياب، الواجبات والتقويم المدرسي لمراحل الأساس والمتوسط والثانوي.
              </p>

              {/* Compact Metrics */}
              <div className="mt-6 grid grid-cols-3 gap-2.5">
                {highlights.map((h) => (
                  <div
                    key={h.label}
                    className="rounded-2xl border border-hero-foreground/15 bg-hero-foreground/5 p-2.5 backdrop-blur-sm text-center"
                  >
                    <div className="text-lg font-extrabold text-gold">{h.value}</div>
                    <div className="text-[10px] text-hero-foreground/75 leading-tight mt-0.5">{h.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Prominent Login Portal Card */}
            <div className="lg:col-span-7">
              <LoginPortal />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <SectionHeading
          eyebrow="عن المدرسة"
          title="تعليم يبني العقل ويهذّب الخُلق"
          text="صرح تعليمي يقدّم تجربة تعليمية رائدة بكادر تدريسي مؤهل ومرافق بيئية متكاملة تخدم طلابنا عبر كافة المراحل."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-3xl border bg-card p-5 text-center shadow-card">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-soft text-gold">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-navy">{v.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>
        <MoreLink to="/about">المزيد عن المدرسة</MoreLink>
      </section>

      {/* Educational Stages */}
      <section className="border-y bg-secondary/40 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <SectionHeading
            eyebrow="المراحل التعليمية"
            title="منظومة متدرجة وشاملة"
            text="نوفر بيئة تعليمية محفزة عبر المراحل الثلاث: مرحلة الأساس، المرحلة المتوسطة، والمرحلة الثانوية."
          />
          <StagesGrid />
        </div>
      </section>

      {/* Latest News */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <SectionHeading eyebrow="آخر الأخبار" title="ما الجديد في المنهل" />
        <NewsList limit={3} />
        <MoreLink to="/news">كل الأخبار والأنشطة</MoreLink>
      </section>

      {/* Contact Section */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <SectionHeading eyebrow="تواصل معنا" title="يسعدنا تواصلكم واستفساراتكم" />
        <ContactCards />
        <MoreLink to="/contact">صفحة التواصل والعناوين</MoreLink>
      </section>
    </PublicLayout>
  );
}
