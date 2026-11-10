import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { SideDrawer, SideNav, TopBar } from "@/components/school/AppChrome";
import { currentUser, useSchool } from "@/lib/school/store";

export const Route = createFileRoute("/app")({
  // Data lives on the device, so the dashboard renders in the browser only.
  ssr: false,
  head: () => ({
    meta: [
      { title: "المدرسة الإلكترونية — مدرسة المنهل" },
      { name: "description", content: "لوحة الطالب والمعلم والإدارة في مدرسة المنهل." },
      { property: "og:title", content: "المدرسة الإلكترونية — مدرسة المنهل" },
      { property: "og:description", content: "الجداول والرسوم والواجبات والحضور والإعلانات في مكان واحد." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  const s = useSchool();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!currentUser(s)) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-background">
      <SideNav />
      <div className="md:ps-64">
        <TopBar onOpenDrawer={() => setDrawerOpen(true)} />
        <main className="mx-auto max-w-5xl px-4 pb-12 pt-5">
          <Outlet />
        </main>
      </div>
      <SideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
