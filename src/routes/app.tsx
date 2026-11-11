import { Navigate, Outlet, createFileRoute, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { App as CapApp } from "@capacitor/app";

import { SideDrawer, SideNav, TopBar } from "@/components/school/AppChrome";
import { currentUser, useSchool } from "@/lib/school/store";

export const Route = createFileRoute("/app")({
  // Data lives on the device, so the dashboard renders in the browser only.
  ssr: false,
  head: () => ({
    meta: [
      { title: "المدرسة الإلكترونية — مدرسة المنهل" },
      { name: "description", content: "لوحة الطالب والمعلم والإدارة في مدرسة المنهل الثانوية الخاصة." },
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
  const navigate = useNavigate();
  const location = useLocation();

  const drawerOpenRef = useRef(drawerOpen);
  const pathnameRef = useRef(location.pathname);

  drawerOpenRef.current = drawerOpen;
  pathnameRef.current = location.pathname;

  // Handle Android hardware back button via Capacitor
  useEffect(() => {
    let handler: { remove: () => Promise<void> } | undefined;

    const setupListener = async () => {
      try {
        handler = await CapApp.addListener("backButton", () => {
          // 1. If drawer is open, close it first
          if (drawerOpenRef.current) {
            setDrawerOpen(false);
            return;
          }

          const currentPath = pathnameRef.current;
          // 2. If at root dashboard (/app) or /login or /, exit app
          if (currentPath === "/app" || currentPath === "/login" || currentPath === "/") {
            CapApp.exitApp();
          } else {
            // 3. Navigate back in history or fallback to /app
            if (window.history.length > 1) {
              window.history.back();
            } else {
              navigate({ to: "/app" });
            }
          }
        });
      } catch {
        // Not running in Capacitor native runtime
      }
    };

    setupListener();

    return () => {
      handler?.remove();
    };
  }, [navigate]);

  if (!currentUser(s)) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-background w-full max-w-[100vw] overflow-x-hidden">
      <SideNav />
      <div className="md:ps-64 w-full max-w-[100vw] overflow-x-hidden">
        <TopBar onOpenDrawer={() => setDrawerOpen(true)} />
        <main className="mx-auto w-full max-w-md md:max-w-5xl px-4 pb-12 pt-5">
          <Outlet />
        </main>
      </div>
      <SideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
