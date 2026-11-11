import { Navigate, createFileRoute } from "@tanstack/react-router";

import { DemoQuickSwitcher, LoginPortal } from "@/components/school/LoginPortal";
import { PublicLayout } from "@/components/school/PublicLayout";
import { currentUser, useSchool } from "@/lib/school/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "البوابة الإلكترونية — مدرسة المنهل الخاصة" },
      { name: "description", content: "تسجيل دخول الطلاب والمعلمين والإدارة إلى البوابة الإلكترونية لمدرسة المنهل." },
      { property: "og:title", content: "البوابة الإلكترونية — مدرسة المنهل" },
      { property: "og:description", content: "دخول الطلاب والمعلمين والإدارة." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const s = useSchool();
  const user = currentUser(s);

  if (user) {
    return <Navigate to="/app" />;
  }

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-hero px-4 py-10 md:py-16">
        <div className="pattern-geo absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-lg space-y-4">
          <LoginPortal />
          <DemoQuickSwitcher />
        </div>
      </section>
    </PublicLayout>
  );
}
