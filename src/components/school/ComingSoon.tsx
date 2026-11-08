import { Construction } from "lucide-react";

import { EmptyState, PageHeader } from "./bits";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="animate-rise">
      <PageHeader title={title} />
      <EmptyState icon={Construction} title="هذه الصفحة قيد الإنشاء" text="سيتم تفعيل هذا القسم قريباً." />
    </div>
  );
}
