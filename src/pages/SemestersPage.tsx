import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Calendar,
  BookOpen,
  Users,
  GraduationCap,
  Clock,
  Pencil,
  Trash2,
} from "lucide-react";

interface Semester {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  circlesCount: number;
  studentsCount: number;
  teachersCount: number;
}

const initialSemesters: Semester[] = [
  {
    id: 1,
    name: "الفصل الأول 1446",
    startDate: "2024-09-01",
    endDate: "2025-01-15",
    description:
      "الفصل الدراسي الأول من العام الهجري 1446 يشمل حفظ ومراجعة الأجزاء العشرة الأولى من القرآن الكريم.",
    circlesCount: 4,
    studentsCount: 78,
    teachersCount: 5,
  },
  {
    id: 2,
    name: "الفصل الثاني 1446",
    startDate: "2025-02-01",
    endDate: "2025-06-15",
    description:
      "الفصل الدراسي الثاني يركّز على إتقان التجويد وحفظ الأجزاء من 11 إلى 20.",
    circlesCount: 5,
    studentsCount: 92,
    teachersCount: 6,
  },
  {
    id: 3,
    name: "الفصل الصيفي 1446",
    startDate: "2025-07-01",
    endDate: "2025-08-30",
    description:
      "دورة صيفية مكثّفة لمراجعة المحفوظ وإجراء الاختبارات النهائية.",
    circlesCount: 3,
    studentsCount: 45,
    teachersCount: 3,
  },
];

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const getStatus = (start: string, end: string) => {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (now < s) return { label: "قادم", color: "bg-info text-info-foreground" };
  if (now > e) return { label: "منتهٍ", color: "bg-muted text-muted-foreground" };
  return { label: "جارٍ", color: "bg-success text-success-foreground" };
};

const SemestersPage = () => {
  const [semesters, setSemesters] = useState(initialSemesters);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Semester | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Semester | null>(null);

  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  // إضافة + تعديل
  const handleSave = () => {
    if (!form.name || !form.startDate || !form.endDate) return;

    if (selected) {
      setSemesters(
        semesters.map((s) =>
          s.id === selected.id ? { ...s, ...form } : s
        )
      );
      setSelected(null);
    } else {
      setSemesters([
        ...semesters,
        {
          id: Date.now(),
          ...form,
          circlesCount: 0,
          studentsCount: 0,
          teachersCount: 0,
        },
      ]);
    }

    setForm({ name: "", startDate: "", endDate: "", description: "" });
    setOpen(false);
  };

  const handleEdit = (semester: Semester) => {
    setForm({
      name: semester.name,
      startDate: semester.startDate,
      endDate: semester.endDate,
      description: semester.description,
    });
    setSelected(semester);
    setOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setSemesters(semesters.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <DashboardLayout title="الفصول" subtitle="إدارة الفصول الدراسية وعرض تفاصيلها">
      <div className="flex justify-end mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة فصل
            </Button>
          </DialogTrigger>

          <DialogContent className="font-tajawal" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {selected ? "تعديل الفصل" : "إنشاء فصل جديد"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label>اسم الفصل</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>تاريخ البدء</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>تاريخ الانتهاء</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <Button onClick={handleSave} className="w-full">
                {selected ? "حفظ التعديل" : "إنشاء"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* الكروت */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {semesters.map((semester, i) => {
          const status = getStatus(semester.startDate, semester.endDate);

          return (
            <button
              key={semester.id}
              onClick={() => setSelected(semester)}
              className="glass-card rounded-xl p-6 text-right animate-fade-in hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="h-6 w-6 text-primary-foreground" />
                </div>

                <div className="flex items-center gap-2">
                  {/* تعديل */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(semester);
                    }}
                    className="p-2 rounded-lg hover:bg-muted transition"
                  >
                    <Pencil className="h-4 w-4 text-primary" />
                  </button>

                  {/* حذف */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(semester);
                    }}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>

                  <Badge className={status.color}>{status.label}</Badge>
                </div>
              </div>

              <h3 className="text-xl font-bold text-foreground mb-3">
                {semester.name}
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>البدء: {formatDate(semester.startDate)}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-accent" />
                  <span>الانتهاء: {formatDate(semester.endDate)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* تأكيد الحذف */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>

          <p>هل أنت متأكد من حذف هذا الفصل؟</p>

          <div className="flex gap-3 mt-4">
            <Button variant="destructive" onClick={confirmDelete}>
              حذف
            </Button>

            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SemestersPage;