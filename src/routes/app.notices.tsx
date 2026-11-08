import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Megaphone,
  PartyPopper,
  Plus,
  ScrollText,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/school/bits";
import { AnnouncementCard } from "@/components/school/shared";
import { useMe } from "@/components/school/useMe";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteAnnouncement, saveAnnouncement } from "@/lib/school/store";
import type { AnnouncementCategory } from "@/lib/school/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/notices")({
  component: NoticesPage,
});

function NoticesPage() {
  const { s, me } = useMe();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // New Notice Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("general");
  const [audience, setAudience] = useState<string>("all");
  const [author, setAuthor] = useState(
    me.role === "teacher" ? me.name : "إدارة المدرسة",
  );

  const announcements = useMemo(() => {
    return s.announcements
      .filter((a) => {
        if (selectedCategory !== "all" && a.category !== selectedCategory) return false;
        if (
          searchQuery.trim() &&
          !a.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !a.body.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [s.announcements, selectedCategory, searchQuery]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    saveAnnouncement({
      title: title.trim(),
      body: body.trim(),
      category,
      audience,
      author: author.trim() || "إدارة المدرسة",
    });

    toast.success("تم نشر الإعلان بنجاح");
    setDialogOpen(false);
    setTitle("");
    setBody("");
  };

  const handleDelete = (id: string) => {
    if (confirm("هل تريد حذف هذا الإعلان نهائياً؟")) {
      deleteAnnouncement(id);
      toast.success("تم حذف الإعلان");
    }
  };

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="الإعلانات واللوائح والتعاميم"
        subtitle="متابعة قرارات الإدارة المدرسية، اللوائح التنظيمية، والأنشطة والفعاليات"
        icon={Megaphone}
        action={
          (me.role === "admin" || me.role === "teacher") && (
            <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-primary hover:bg-navy font-bold">
              <Plus className="h-4 w-4" />
              نشر إعلان جديد
            </Button>
          )
        }
      />

      {/* Categories & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "الكل" },
            { id: "urgent", label: "إعلانات هامة وعاجلة", icon: AlertTriangle },
            { id: "rules", label: "اللوائح والضوابط", icon: ScrollText },
            { id: "activities", label: "الأنشطة المدرسية", icon: PartyPopper },
            { id: "general", label: "عام", icon: Megaphone },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all",
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {cat.icon && <cat.icon className="h-3.5 w-3.5" />}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute end-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="بحث في الإعلانات واللوائح..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full sm:w-56 pe-8 text-xs"
          />
        </div>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="لا توجد إعلانات مطابقة"
          text="لم يتم العثور على نتائج تطابق معايير البحث المحددة"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              a={a}
              s={s}
              actions={
                (me.role === "admin" || (me.role === "teacher" && a.author.includes(me.name))) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(a.id)}
                    className="h-8 text-xs text-destructive hover:bg-danger-soft hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 me-1" />
                    حذف
                  </Button>
                )
              }
            />
          ))}
        </div>
      )}

      {/* Add Notice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>نشر إعلان أو لائحة جديدة</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>التصنيف</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
                >
                  <option value="urgent">إعلان هام وعاجل</option>
                  <option value="rules">اللوائح والضوابط المدرسية</option>
                  <option value="activities">الأنشطة والفعاليات</option>
                  <option value="general">إعلان عام</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>الجمهور المستهدف</Label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
                >
                  <option value="all">كافة الطلاب وأولياء الأمور والمعلمين</option>
                  {s.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} فقط
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>عنوان الإعلان</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: موعد تسليم مشاريع المعرض العلمي"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>نص الإعلان أو بنود اللائحة</Label>
              <Textarea
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="اكتب التفاصيل الكاملة هنا..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>جهة الإصدار / الكاتب</Label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="مثال: إدارة المدرسة / الشؤون الأكاديمية"
                required
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">نشر الإعلان للجميع</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
