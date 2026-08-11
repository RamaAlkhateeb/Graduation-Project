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
import { Plus, Pencil, Trash2, Palette } from "lucide-react";
import { toast } from "sonner";
import TableRowContextMenu from "@/components/TableRowContextMenu";
import {
  getMemorizationStatuses,
  createMemorizationStatus,
  updateMemorizationStatus,
  deleteMemorizationStatus,
  type MemorizationStatusDto,
} from "@/lib/memorizationApi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://alashmar.runasp.net/api";

const DEFAULT_COLOR = "#28a745";

interface StatusForm {
  name: string;
  color: string;
  sortOrder: string;
}

const emptyForm: StatusForm = { name: "", color: DEFAULT_COLOR, sortOrder: "" };

const StatusesPage = () => {
  const [statuses, setStatuses] = useState<MemorizationStatusDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<MemorizationStatusDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemorizationStatusDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<StatusForm>(emptyForm);

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

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const data = await getMemorizationStatuses(axiosClient);
      setStatuses([...data].sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل حالات الحفظ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (status: MemorizationStatusDto) => {
    setSelected(status);
    setForm({
      name: status.name,
      color: status.color ?? DEFAULT_COLOR,
      sortOrder: String(status.sortOrder),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("يرجى إدخال اسم الحالة");
      return;
    }

    const sortOrder = Number(form.sortOrder);
    if (!Number.isFinite(sortOrder)) {
      toast.error("يرجى إدخال ترتيب صحيح");
      return;
    }

    try {
      setLoading(true);

      if (selected) {
        await updateMemorizationStatus(axiosClient, selected.id, {
          name: form.name.trim(),
          color: form.color || null,
          sortOrder,
        });
        toast.success("تم تعديل الحالة بنجاح");
      } else {
        await createMemorizationStatus(axiosClient, {
          name: form.name.trim(),
          color: form.color || null,
          sortOrder,
        });
        toast.success("تمت إضافة الحالة بنجاح");
      }

      setOpen(false);
      setSelected(null);
      setForm(emptyForm);
      await fetchStatuses();
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await deleteMemorizationStatus(axiosClient, deleteTarget.id);
      toast.success("تم حذف الحالة بنجاح");
      setDeleteTarget(null);
      await fetchStatuses();
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error("لا يمكن حذف هذه الحالة لأنها مستخدمة في سجلات الحفظ");
      } else {
        toast.error("فشل حذف الحالة");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout
      title="حالات الحفظ"
      subtitle="إدارة حالات حفظ القرآن والأحاديث (متقن، قيد المراجعة، ...)"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <p className="text-sm text-muted-foreground flex-1">
          تستخدم هذه الحالات في صفحات حفظ القرآن والأحاديث، وتظهر بألوانها في الجداول والقوائم.
        </p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              إضافة حالة
            </Button>
          </DialogTrigger>

          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>{selected ? "تعديل حالة" : "إضافة حالة"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="status-name">الاسم</Label>
                <Input
                  id="status-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: متقن، قيد المراجعة"
                />
              </div>

              <div>
                <Label htmlFor="status-color">اللون</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="status-color"
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent p-1"
                  />
                  <Input
                    id="status-color-hex"
                    aria-label="قيمة اللون"
                    value={form.color}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        color: e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`,
                      })
                    }
                    className="w-32 font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status-sort-order">الترتيب</Label>
                <Input
                  id="status-sort-order"
                  type="number"
                  min={1}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  placeholder="1"
                />
              </div>

              <Button onClick={handleSave} disabled={loading} className="w-full">
                {loading ? "جارٍ الحفظ..." : selected ? "حفظ التعديلات" : "إضافة"}
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
    <th className="p-4 text-right w-24">الترتيب</th>
    <th className="p-4 text-right">الاسم</th>
    <th className="p-4 text-right">اللون</th>
    <th className="p-4 text-right"></th>
  </tr>
</thead>

<tbody>
  {loading && statuses.length === 0 ? (
    <tr>
      <td className="p-4 text-center text-muted-foreground" colSpan={4}>
        جارٍ التحميل...
      </td>
    </tr>
  ) : statuses.length === 0 ? (
    <tr>
      <td className="p-4 text-center text-muted-foreground" colSpan={4}>
        لا توجد حالات بعد. أضف حالة جديدة للبدء.
      </td>
    </tr>
  ) : (
    statuses.map((status) => (
      <TableRowContextMenu
        key={status.id}
        actions={[
          {
            label: "تعديل",
            icon: <Pencil className="h-4 w-4" />,
            onSelect: () => openEdit(status),
          },
          {
            label: "حذف",
            icon: <Trash2 className="h-4 w-4" />,
            onSelect: () => setDeleteTarget(status),
            destructive: true,
          },
        ]}
      >
        <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
          <td className="p-4">{status.sortOrder}</td>

          {/* الاسم فقط */}
          <td className="p-4">
            <span className="font-medium">
              {status.name}
            </span>
          </td>

          {/* دائرة اللون فقط */}
          <td className="p-4">
            <span
              className="inline-block h-5 w-5 rounded-full border border-border shadow-sm"
              style={{
                backgroundColor: status.color ?? DEFAULT_COLOR,
              }}
              title={status.color ?? DEFAULT_COLOR}
            />
          </td>

          <td className="p-4">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEdit(status)}
              >
                <Pencil className="h-4 w-4 ml-1" />
                تعديل
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteTarget(status)}
              >
                <Trash2 className="h-4 w-4 ml-1" />
                حذف
              </Button>
            </div>
          </td>
        </tr>
      </TableRowContextMenu>
    ))
  )}
</tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
        <Palette className="h-4 w-4" />
        مجموع الحالات: {statuses.length}
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>

          <p>
            هل أنت متأكد من حذف حالة «{deleteTarget?.name}»؟ لا يمكن حذف الحالة إذا كانت مستخدمة في
            سجلات الحفظ.
          </p>

          <div className="flex gap-3 mt-4">
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "جارٍ الحذف..." : "حذف"}
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

export default StatusesPage;
