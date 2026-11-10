import { Link, Navigate, createFileRoute } from "@tanstack/react-router";

import { LoginPortal } from "@/components/school/LoginPortal";
import { PublicLayout } from "@/components/school/PublicLayout";
import { ContactCards, MoreLink, NewsList, SectionHeading, StagesGrid, values } from "@/components/school/PublicSections";
import { useSchool } from "@/lib/school/store";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "مدرسة المنهل — البوابة الإلكترونية" },
    { name: "description", content: "البوابة الإلكترونية لمدرسة المنهل: تسجيل الدخول ومتابعة الخدمات المدرسية." },
  ] }),
  component: Index,
});

function Index() {
  const state = useSchool();
  if (state.session) return <Navigate to="/app" />;
  return (
    <PublicLayout compact>
      <section className="mx-auto max-w-5xl px-4 pb-8 pt-7">
        <LoginPortal />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {values.slice(0, 3).map((value) => <article key={value.title} className="rounded-2xl border bg-card p-5 text-center shadow-card"><div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gold-soft text-gold"><value.icon className="h-5 w-5" /></div><h2 className="font-display font-bold text-navy">{value.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{value.text}</p></article>)}
        </div>
        <div className="mt-10"><SectionHeading eyebrow="عن المدرسة" title="منهل العلم وصناعة المستقبل" text="بيئة تعليمية تجمع بين التميز الأكاديمي والقيم الأصيلة، وتدعم الطالب في رحلته التعليمية." /><MoreLink to="/about">التعرّف على المدرسة</MoreLink></div>
      </section>
      <section className="border-y bg-secondary/40 py-10"><div className="mx-auto max-w-5xl px-4"><SectionHeading eyebrow="المراحل التعليمية" title="مراحل تعليمية متكاملة" /><StagesGrid /></div></section>
      <section className="mx-auto max-w-5xl px-4 py-10"><SectionHeading eyebrow="آخر الأخبار" title="أخبار المدرسة" /><NewsList limit={3} /><MoreLink to="/news">جميع الأخبار</MoreLink></section>
      <section className="border-t bg-muted/30 py-10"><div className="mx-auto max-w-5xl px-4"><SectionHeading eyebrow="تواصل معنا" title="يسعدنا تواصلكم" /><ContactCards /><MoreLink to="/contact">صفحة التواصل</MoreLink></div></section>
      <div className="pb-8 text-center text-xs text-muted-foreground"><Link to="/contact" className="underline">معلومات التواصل</Link></div>
    </PublicLayout>
  );
}
