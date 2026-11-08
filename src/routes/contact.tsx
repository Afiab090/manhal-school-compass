import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";

import { CONTACT, PublicLayout } from "@/components/school/PublicLayout";
import { ContactCards, PageHero } from "@/components/school/PublicSections";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا — مدرسة المنهل الثانوية الخاصة" },
      { name: "description", content: "عنوان مدرسة المنهل وأرقام الهاتف والبريد الإلكتروني وساعات العمل." },
      { property: "og:title", content: "تواصل مع مدرسة المنهل" },
      { property: "og:description", content: "العنوان والهاتف والبريد الإلكتروني وساعات العمل." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <PublicLayout>
      <PageHero title="تواصل معنا" text="أبوابنا مفتوحة لأولياء الأمور والطلاب. يسعدنا الرد على استفساراتكم." />
      <section className="mx-auto max-w-4xl px-4 py-16">
        <ContactCards />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <a href={`tel:${CONTACT.mobile.replace(/\s/g, "")}`}>
              <Phone />
              اتصل بنا
            </a>
          </Button>
          <Button asChild size="lg" variant="soft">
            <a href={`mailto:${CONTACT.email}`}>
              <Mail />
              راسلنا بالبريد
            </a>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
