import { createFileRoute } from "@tanstack/react-router";

import { LoginPortal } from "@/components/school/LoginPortal";
import { PublicLayout } from "@/components/school/PublicLayout";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "البوابة الإلكترونية — مدرسة المنهل الثانوية الخاصة" },
      { name: "description", content: "تسجيل دخول الطلاب وأولياء الأمور والمعلمين والإدارة إلى البوابة الإلكترونية لمدرسة المنهل." },
      { property: "og:title", content: "البوابة الإلكترونية — مدرسة المنهل" },
      { property: "og:description", content: "دخول الطلاب وأولياء الأمور والمعلمين والإدارة." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-hero px-4 py-10 md:py-16">
        <div className="pattern-geo absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-md">
          <LoginPortal />
        </div>
      </section>
    </PublicLayout>
  );
}
