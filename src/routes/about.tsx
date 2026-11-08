import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Building2, FlaskConical, MonitorSmartphone, ShieldCheck, Users } from "lucide-react";

import campus from "@/assets/school-campus.jpg";
import { PublicLayout } from "@/components/school/PublicLayout";
import { PageHero, SectionHeading, values } from "@/components/school/PublicSections";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "عن المدرسة — مدرسة المنهل الثانوية الخاصة" },
      { name: "description", content: "تعرّف على رسالة ورؤية وقيم مدرسة المنهل الثانوية الخاصة ومرافقها التعليمية." },
      { property: "og:title", content: "عن مدرسة المنهل الثانوية الخاصة" },
      { property: "og:description", content: "رسالتنا ورؤيتنا وقيمنا ومرافقنا التعليمية." },
    ],
  }),
  component: About,
});

const facilities = [
  { icon: FlaskConical, title: "مختبرات علمية", text: "مختبرات مجهزة للفيزياء والكيمياء والأحياء." },
  { icon: MonitorSmartphone, title: "معمل حاسوب", text: "أجهزة حديثة وشبكة إنترنت لخدمة التعليم الإلكتروني." },
  { icon: BookOpen, title: "مكتبة المنهل", text: "آلاف المراجع والكتب في مختلف التخصصات." },
  { icon: Building2, title: "فصول مكيفة", text: "بيئة دراسية مريحة بكثافة طلابية مناسبة." },
  { icon: Users, title: "كادر مؤهل", text: "معلمون ذوو خبرة طويلة في تدريس المناهج السودانية." },
  { icon: ShieldCheck, title: "بيئة آمنة", text: "إشراف تربوي متواصل ونظام انضباط واضح." },
];

function About() {
  return (
    <PublicLayout>
      <PageHero title="عن المدرسة" text="منذ تأسيسها، تسعى مدرسة المنهل إلى تقديم تعليم ثانوي نوعي يصنع الفارق في حياة طلابها." />
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
        <img src={campus} alt="ساحة مدرسة المنهل" width={1600} height={1008} loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-elevated" />
        <div>
          <h2 className="font-display text-3xl font-bold text-navy">قصتنا</h2>
          <div className="gold-rule mt-3" />
          <p className="mt-5 leading-loose text-muted-foreground">
            انطلقت مدرسة المنهل الثانوية الخاصة برؤية واضحة: أن يكون التعليم منهلاً عذباً ينهل منه الطلاب العلم
            والمعرفة والقيم. نحرص على متابعة كل طالب أكاديمياً وتربوياً، وعلى بناء شراكة حقيقية مع أولياء الأمور من خلال
            التواصل المستمر والبوابة الإلكترونية.
          </p>
          <div className="mt-6 grid gap-3">
            {values.map((v) => (
              <div key={v.title} className="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-card">
                <v.icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <div className="font-bold text-navy">{v.title}</div>
                  <div className="text-sm text-muted-foreground">{v.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="border-t bg-secondary/50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading eyebrow="مرافقنا" title="بيئة تعليمية متكاملة" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((f) => (
              <div key={f.title} className="rounded-3xl border bg-card p-6 shadow-card">
                <f.icon className="mb-3 h-7 w-7 text-gold" />
                <h3 className="font-display text-lg font-bold text-navy">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
