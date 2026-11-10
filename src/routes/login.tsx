import { createFileRoute, Navigate } from "@tanstack/react-router";

import { LoginPortal } from "@/components/school/LoginPortal";
import { PublicLayout } from "@/components/school/PublicLayout";
import { useSchool } from "@/lib/school/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "البوابة الإلكترونية — مدرسة المنهل الثانوية الخاصة" },
      { name: "description", content: "تسجيل دخول الطلاب والمعلمين والإدارة إلى البوابة الإلكترونية لمدرسة المنهل." },
      { property: "og:title", content: "البوابة الإلكترونية — مدرسة المنهل" },
      { property: "og:description", content: "دخول الطلاب والمعلمين والإدارة." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const state = useSchool();
  if (state.session) return <Navigate to="/app" />;
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
