import { useEffect, useState } from "react";
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
  Clock,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

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

  if (now < s) return { label: "قادم", color: "bg-blue-500 text-white" };
  if (now > e) return { label: "منتهٍ", color: "bg-gray-500 text-white" };
  return { label: "جارٍ", color: "bg-green-500 text-white" };
};

const API = "http://alashmar.runasp.net/api/Semesters";

const SemestersPage = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Semester | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const token = localStorage.getItem("token");

  // ======================
  // GET ALL
  // ======================
  const fetchSemesters = async () => {
    try {
      const res = await fetch(API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setSemesters(data);
    } catch {
      toast.error("فشل تحميل الفصول");
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  // ======================
  // SAVE (CREATE / UPDATE)
  // ======================
  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error("يرجى تعبئة الحقول المطلوبة");
      return;
    }

    try {
      setLoading(true);

      const method = selected ? "PUT" : "POST";
      const url = selected ? `${API}/${selected.id}` : API;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      toast.success(selected ? "تم التعديل بنجاح" : "تمت الإضافة بنجاح");

      setOpen(false);
      setSelected(null);
      setForm({ name: "", startDate: "", endDate: "", description: "" });

      fetchSemesters();
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // EDIT
  // ======================
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

  // ======================
  // DELETE
  // ======================
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`${API}/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error();

      toast.success("تم الحذف بنجاح");
      setDeleteTarget(null);

      fetchSemesters();
    } catch {
      toast.error("فشل الحذف");
    }
  };

  return (
    <DashboardLayout title="الفصول" subtitle="إدارة الفصول الدراسية">

      {/* إضافة */}
      <div className="flex justify-end mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة فصل
            </Button>
          </DialogTrigger>

          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {selected ? "تعديل فصل" : "إضافة فصل"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">

              <div>
                <Label>الاسم</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>من</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>إلى</Label>
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
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full"
              >
                {loading ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {semesters.map((s) => {
          const status = getStatus(s.startDate, s.endDate);

          return (
            <div
              key={s.id}
              className="p-5 border rounded-xl bg-card"
            >
              <div className="flex justify-between items-start">
                <BookOpen />

                <div className="flex gap-2">
                  <button onClick={() => handleEdit(s)}>
                    <Pencil />
                  </button>

                  <button onClick={() => setDeleteTarget(s)}>
                    <Trash2 />
                  </button>

                  <Badge className={status.color}>
                    {status.label}
                  </Badge>
                </div>
              </div>

              <h3 className="font-bold mt-3">{s.name}</h3>

              <p className="text-sm text-muted-foreground mt-2">
                {s.description}
              </p>

              <div className="text-sm mt-3">
                <div>من: {formatDate(s.startDate)}</div>
                <div>إلى: {formatDate(s.endDate)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>

          <p>هل أنت متأكد؟</p>

          <div className="flex gap-3 mt-4">
            <Button variant="destructive" onClick={confirmDelete}>
              حذف
            </Button>

            <Button variant="outline">
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

export default SemestersPage;