import { createFileRoute } from "@tanstack/react-router";

import { PublicLayout } from "@/components/school/PublicLayout";
import { NewsList, PageHero } from "@/components/school/PublicSections";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "آخر الأخبار — مدرسة المنهل الثانوية الخاصة" },
      { name: "description", content: "آخر أخبار وأنشطة وإعلانات مدرسة المنهل الثانوية الخاصة." },
      { property: "og:title", content: "آخر أخبار مدرسة المنهل" },
      { property: "og:description", content: "الأنشطة والفعاليات والإعلانات المدرسية." },
    ],
  }),
  component: News,
});

function News() {
  return (
    <PublicLayout>
      <PageHero title="آخر الأخبار" text="تابع فعاليات المدرسة وأنشطتها وإعلاناتها أولاً بأول." />
      <section className="mx-auto max-w-6xl px-4 py-16">
        <NewsList />
      </section>
    </PublicLayout>
  );
}
