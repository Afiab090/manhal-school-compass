import { createFileRoute } from "@tanstack/react-router";

import { PublicLayout } from "@/components/school/PublicLayout";
import { PageHero, StagesGrid } from "@/components/school/PublicSections";

export const Route = createFileRoute("/stages")({
  head: () => ({
    meta: [
      { title: "المراحل التعليمية — مدرسة المنهل الثانوية الخاصة" },
      { name: "description", content: "الصفوف الأول والثاني والثالث الثانوي في مدرسة المنهل: المسارات والبرامج والمتابعة." },
      { property: "og:title", content: "المراحل التعليمية — مدرسة المنهل" },
      { property: "og:description", content: "تعرف على برامج الصفوف الثانوية الثلاثة في مدرسة المنهل." },
    ],
  }),
  component: Stages,
});

function Stages() {
  return (
    <PublicLayout>
      <PageHero title="المراحل التعليمية" text="مسيرة من ثلاث سنوات تقود الطالب بثقة نحو امتحانات الشهادة الثانوية السودانية." />
      <section className="mx-auto max-w-6xl px-4 py-16">
        <StagesGrid />
      </section>
    </PublicLayout>
  );
}
