import { createFileRoute } from "@tanstack/react-router";

import { PublicLayout } from "@/components/school/PublicLayout";
import { PageHero, StagesGrid } from "@/components/school/PublicSections";

export const Route = createFileRoute("/stages")({
  head: () => ({
    meta: [
      { title: "المراحل التعليمية والأقسام — مجمع مدارس المنهل الخاصة" },
      {
        name: "description",
        content: "المراحل الابتدائية والمتوسطة والثانوية (بنين وبنات) في مدارس المنهل: الرؤية الأكاديمية والبرامج والمسارات التعليمية.",
      },
      { property: "og:title", content: "المراحل التعليمية — مجمع مدارس المنهل" },
      {
        property: "og:description",
        content: "تعرف على البرامج والمراحل التعليمية في مجمع مدارس المنهل من الابتدائي حتى الثانوي.",
      },
    ],
  }),
  component: Stages,
});

function Stages() {
  return (
    <PublicLayout>
      <PageHero
        title="المراحل التعليمية والأقسام"
        text="منظومة تعليمية متكاملة تبدأ من المرحلة الابتدائية وتتدرج عبر المرحلة المتوسطة حتى قمة التميز في الشهادة الثانوية السودانية، في بيئة تربوية رائدة لكلا القسمين (بنين وبنات)."
      />
      <section className="mx-auto max-w-6xl px-4 py-16">
        <StagesGrid />
      </section>
    </PublicLayout>
  );
}
