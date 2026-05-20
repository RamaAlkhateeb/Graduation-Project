import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  BookOpen,
  Pencil,
  Trash2,
  BookMarked,
} from "lucide-react";
import { toast } from "sonner";
import TableRowContextMenu from "@/components/TableRowContextMenu";

interface Semester {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
}

interface Course {
  id: string;
  eventName: string;
  semesterId: string | null;
}

interface SemesterPayload {
  name: string;
  startDate: string | null;
  endDate: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://alashmar.runasp.net/api";

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

const SemestersPage = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Semester | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Semester | null>(null);
  const [relatedSemester, setRelatedSemester] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<SemesterPayload>({
    name: "",
    startDate: "",
    endDate: "",
  });

  const axiosClient = useMemo(() => {
    const token = localStorage.getItem("token");

    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }, []);

  const fetchSemesters = async () => {
    try {
      const res = await axiosClient.get<Semester[]>("/Semesters");
      setSemesters(res.data);
    } catch (error) {
      console.error(error);
      toast.error("فشل تحميل الفصول");
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axiosClient.get<Course[]>("/courses");
      setCourses(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSemesters();
    fetchCourses();
  }, []);

  const handleSave = async () => {
    if (!form.name) {
      toast.error("يرجى تعبئة الحقول المطلوبة");
      return;
    }

    try {
      setLoading(true);

      const payload: SemesterPayload = {
        name: form.name,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };

      if (selected) {
        await axiosClient.put(`/Semesters/${selected.id}`, payload);
      } else {
        await axiosClient.post("/Semesters", payload);
      }

      toast.success(selected ? "تم التعديل بنجاح" : "تمت الإضافة بنجاح");

      setOpen(false);
      setSelected(null);
      setForm({ name: "", startDate: "", endDate: "" });

      fetchSemesters();
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (semester: Semester) => {
    setForm({
      name: semester.name,
      startDate: semester.startDate ?? "",
      endDate: semester.endDate ?? "",
    });

    setSelected(semester);
    setOpen(true);
  };

  const handleShowCourses = (semester: Semester) => {
    setRelatedSemester(semester);
  };

  const relatedCourses = courses.filter((course) => course.semesterId === relatedSemester?.id);

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await axiosClient.delete(`/Semesters/${deleteTarget.id}`);

      toast.success("تم الحذف بنجاح");
      setDeleteTarget(null);

      fetchSemesters();
    } catch (error) {
      console.error(error);
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
                    value={form.startDate ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>إلى</Label>
                  <Input
                    type="date"
                    value={form.endDate ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                  />
                </div>
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

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-4 text-right">الاسم</th>
                <th className="p-4 text-right">تاريخ البدء</th>
                <th className="p-4 text-right">تاريخ الانتهاء</th>
                <th className="p-4 text-right">الحالة</th>
                <th className="p-4 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {semesters.map((semester) => {
                const hasDates = Boolean(semester.startDate && semester.endDate);
                const status = hasDates
                  ? getStatus(semester.startDate as string, semester.endDate as string)
                  : { label: "غير مكتمل", color: "bg-yellow-500 text-white" };

                return (
                  <TableRowContextMenu
                    key={semester.id}
                    actions={[
                      {
                        label: "عرض الكورسات",
                        icon: <BookMarked className="h-4 w-4" />,
                        onSelect: () => handleShowCourses(semester),
                      },
                      {
                        label: "تعديل",
                        icon: <Pencil className="h-4 w-4" />,
                        onSelect: () => handleEdit(semester),
                      },
                      {
                        label: "حذف",
                        icon: <Trash2 className="h-4 w-4" />,
                        onSelect: () => setDeleteTarget(semester),
                        destructive: true,
                      },
                    ]}
                  >
                    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">{semester.name}</td>
                      <td className="p-4">{semester.startDate ? formatDate(semester.startDate) : "-"}</td>
                      <td className="p-4">{semester.endDate ? formatDate(semester.endDate) : "-"}</td>
                      <td className="p-4">
                        <Badge className={status.color}>{status.label}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(semester)}>
                            <Pencil className="h-4 w-4 ml-1" />
                            تعديل
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(semester)}>
                            <Trash2 className="h-4 w-4 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </td>
                    </tr>
                  </TableRowContextMenu>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!relatedSemester} onOpenChange={() => setRelatedSemester(null)}>
        <DialogContent dir="rtl" className="font-tajawal max-w-2xl">
          <DialogHeader>
            <DialogTitle>الكورسات التابعة للفصل</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {relatedCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد كورسات مرتبطة بهذا الفصل.</p>
            ) : (
              relatedCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-medium">{course.eventName}</span>
                  <span className="text-sm text-muted-foreground">{course.id}</span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

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