import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  BookMarked,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMemorizationStatuses,
  getStudentQuranPages,
  getStudentHadiths,
  getStudentHalaqas,
  getHadiths,
  addQuranPage,
  addHadith,
  updateMemorizationRecordStatus,
  deleteMemorizationRecord,
  type MemorizationStatusDto,
  type MemorizationRecordType,
  type StudentQuraanPageDetailDto,
  type StudentHadithDetailDto,
  type HadithDto,
  type StudentHalaqaDto,
} from "@/lib/memorizationApi";
import { getStudentById, type StudentDetailDto } from "@/lib/studentApi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://alashmar.runasp.net/api";

const DEFAULT_STATUS_ID = 1;

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("ar-EG");
};

/** يحوّل لون hex إلى لون بشفافية آمنة للخلفية (#RRGGBB → #RRGGBBAA) */
const withAlpha = (color: string, alpha: string) =>
  /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}${alpha}` : color;

interface EditTarget {
  recordType: MemorizationRecordType;
  recordId: string;
  statusId: number;
  notes: string | null;
}

interface DeleteTarget {
  recordType: MemorizationRecordType;
  recordId: string;
}

const StudentMemorizationPage = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [searchParams] = useSearchParams();
  const halaqaIdFromQuery = searchParams.get("halaqaId") ?? undefined;
  const halaqaNameFromQuery = searchParams.get("halaqaName") ?? undefined;

  const [student, setStudent] = useState<StudentDetailDto | null>(null);
  const [statuses, setStatuses] = useState<MemorizationStatusDto[]>([]);
  const [halaqas, setHalaqas] = useState<StudentHalaqaDto[]>([]);
  const [hadithLookup, setHadithLookup] = useState<HadithDto[]>([]);
  const [quranPages, setQuranPages] = useState<StudentQuraanPageDetailDto[]>([]);
  const [hadithRecords, setHadithRecords] = useState<StudentHadithDetailDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hadithLookupLoading, setHadithLookupLoading] = useState(false);

  // ── dialogs ──
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<MemorizationRecordType>("quran-page");
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── add form ──
  const [formHalaqaId, setFormHalaqaId] = useState("");
  const [formStatusId, setFormStatusId] = useState<number>(DEFAULT_STATUS_ID);
  const [formPageNumber, setFormPageNumber] = useState("");
  const [formHadithId, setFormHadithId] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // ── edit form ──
  const [editStatusId, setEditStatusId] = useState<number>(DEFAULT_STATUS_ID);
  const [editNotes, setEditNotes] = useState("");

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

  const statusById = useCallback(
    (id: number) => statuses.find((status) => status.id === id),
    [statuses]
  );

  const fetchAll = useCallback(async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      const filters = halaqaIdFromQuery ? { halaqaId: halaqaIdFromQuery } : undefined;
      const [pages, hadiths] = await Promise.all([
        getStudentQuranPages(axiosClient, studentId, filters),
        getStudentHadiths(axiosClient, studentId, filters),
      ]);
      setQuranPages(pages);
      setHadithRecords(hadiths);
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل سجلات الحفظ");
    } finally {
      setLoading(false);
    }
  }, [axiosClient, studentId, halaqaIdFromQuery]);

  useEffect(() => {
    if (!studentId) return;

    const load = async () => {
      try {
        const [studentData, statusData, halaqaData] = await Promise.all([
          getStudentById(axiosClient, studentId),
          getMemorizationStatuses(axiosClient),
          getStudentHalaqas(axiosClient, studentId),
        ]);

        setStudent(studentData);
        setStatuses(statusData);
        setHalaqas(halaqaData);
      } catch (error) {
        console.error(error);
        toast.error("تعذر تحميل بيانات الطالب");
      }

      await fetchAll();
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, halaqaIdFromQuery]);

  const openAdd = async (recordType: MemorizationRecordType) => {
    setAddType(recordType);
    setFormHalaqaId(halaqaIdFromQuery ?? (halaqas.length === 1 ? halaqas[0].halaqaId : ""));
    setFormStatusId(DEFAULT_STATUS_ID);
    setFormPageNumber("");
    setFormHadithId("");
    setFormNotes("");
    setAddOpen(true);

    // تحميل قائمة الأحاديث عند فتح نموذج إضافة حديث فقط
    if (recordType === "hadith" && hadithLookup.length === 0) {
      try {
        setHadithLookupLoading(true);
        const data = await getHadiths(axiosClient);
        setHadithLookup(data);
      } catch (error) {
        console.error(error);
        toast.error("تعذر تحميل قائمة الأحاديث");
      } finally {
        setHadithLookupLoading(false);
      }
    }
  };

  const resetAddForm = () => {
    setAddOpen(false);
    setAddType("quran-page");
    setFormHalaqaId("");
    setFormStatusId(DEFAULT_STATUS_ID);
    setFormPageNumber("");
    setFormHadithId("");
    setFormNotes("");
  };

  const handleAdd = async () => {
    if (!studentId) return;

    if (!formHalaqaId) {
      toast.error("يرجى اختيار الحلقة");
      return;
    }

    try {
      setSaving(true);

      if (addType === "quran-page") {
        const pageNumber = Number(formPageNumber);
        if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 604) {
          toast.error("رقم الصفحة يجب أن يكون بين 1 و 604");
          return;
        }

        await addQuranPage(axiosClient, formHalaqaId, studentId, {
          pageNumber,
          statusId: formStatusId,
          notes: formNotes.trim() || null,
        });
        toast.success("تمت إضافة صفحة القرآن بنجاح");
      } else {
        if (!formHadithId) {
          toast.error("يرجى اختيار الحديث");
          return;
        }

        await addHadith(axiosClient, formHalaqaId, studentId, {
          hadithId: formHadithId,
          statusId: formStatusId,
          notes: formNotes.trim() || null,
        });
        toast.success("تمت إضافة الحديث بنجاح");
      }

      resetAddForm();
      await fetchAll();
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const openEditStatus = (recordType: MemorizationRecordType, record: StudentQuraanPageDetailDto | StudentHadithDetailDto) => {
    setEditTarget({
      recordType,
      recordId: record.id,
      statusId: record.statusId,
      notes: record.notes ?? null,
    });
    setEditStatusId(record.statusId);
    setEditNotes(record.notes ?? "");
  };

  const handleSaveStatus = async () => {
    if (!editTarget) return;

    try {
      setSaving(true);
      await updateMemorizationRecordStatus(axiosClient, editTarget.recordId, editTarget.recordType, {
        statusId: editStatusId,
        notes: editNotes.trim() || null,
      });
      toast.success("تم تحديث الحالة بنجاح");
      setEditTarget(null);
      await fetchAll();
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء تحديث الحالة");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await deleteMemorizationRecord(axiosClient, deleteTarget.recordId, deleteTarget.recordType);
      toast.success("تم حذف السجل بنجاح");
      setDeleteTarget(null);
      await fetchAll();
    } catch (error) {
      console.error(error);
      toast.error("فشل حذف السجل");
    } finally {
      setDeleting(false);
    }
  };

  const renderStatusBadge = (statusId: number) => {
    const status = statusById(statusId);
    const color = status?.color ?? "#6b7280";

    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
        style={{
          backgroundColor: withAlpha(color, "1a"),
          borderColor: withAlpha(color, "55"),
          color,
        }}
      >
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {status?.name ?? `#${statusId}`}
      </span>
    );
  };

  const pageTitle = student ? student.name : "سجلات الحفظ";
  const effectiveHalaqaName = halaqaNameFromQuery ?? "كل الحلقات";

  return (
    <DashboardLayout
      title={`حفظ الطالب: ${pageTitle}`}
      subtitle={
        halaqaIdFromQuery
          ? `سجلات حفظ القرآن والأحاديث في حلقة «${effectiveHalaqaName}»`
          : "سجلات حفظ القرآن والأحاديث للطالب"
      }
    >
      <Tabs defaultValue="quran" dir="rtl" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <TabsList>
            <TabsTrigger value="quran">صفحات القرآن</TabsTrigger>
            <TabsTrigger value="hadith">الأحاديث</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => void fetchAll()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </Button>
            <Button size="sm" className="gap-1" onClick={() => void openAdd("quran-page")}>
              <Plus className="h-4 w-4" />
              إضافة صفحة قرآن
            </Button>
            <Button size="sm" variant="secondary" className="gap-1" onClick={() => void openAdd("hadith")}>
              <Plus className="h-4 w-4" />
              إضافة حديث
            </Button>
          </div>
        </div>

        {/* ── صفحات القرآن ── */}
        <TabsContent value="quran" className="space-y-3">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-4 text-right w-32">رقم الصفحة</th>
                    <th className="p-4 text-right">الحالة</th>
                    <th className="p-4 text-right">الملاحظات</th>
                    <th className="p-4 text-right">التاريخ</th>
                    <th className="p-4 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && quranPages.length === 0 ? (
                    <tr>
                      <td className="p-4 text-center text-muted-foreground" colSpan={5}>
                        <Loader2 className="h-5 w-5 animate-spin inline-block" />
                      </td>
                    </tr>
                  ) : quranPages.length === 0 ? (
                    <tr>
                      <td className="p-4 text-center text-muted-foreground" colSpan={5}>
                        لا توجد صفحات قرآن مسجلة بعد.
                      </td>
                    </tr>
                  ) : (
                    quranPages.map((page) => (
                      <tr
                        key={page.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4">
                          <span className="inline-flex items-center gap-2 font-medium">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            {page.pageNumber}
                          </span>
                        </td>
                        <td className="p-4">{renderStatusBadge(page.statusId)}</td>
                        <td className="p-4 max-w-xs truncate text-muted-foreground">
                          {page.notes || "-"}
                        </td>
                        <td className="p-4 text-muted-foreground">{formatDate(page.memorizedAt)}</td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditStatus("quran-page", page)}
                            >
                              <Pencil className="h-3.5 w-3.5 ml-1" />
                              تغيير الحالة
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                setDeleteTarget({ recordType: "quran-page", recordId: page.id })
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5 ml-1" />
                              حذف
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">عدد الصفحات المسجلة: {quranPages.length}</p>
        </TabsContent>

        {/* ── الأحاديث ── */}
        <TabsContent value="hadith" className="space-y-3">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-4 text-right">الحديث</th>
                    <th className="p-4 text-right">الكتاب / الباب</th>
                    <th className="p-4 text-right">الحالة</th>
                    <th className="p-4 text-right">الملاحظات</th>
                    <th className="p-4 text-right">التاريخ</th>
                    <th className="p-4 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && hadithRecords.length === 0 ? (
                    <tr>
                      <td className="p-4 text-center text-muted-foreground" colSpan={6}>
                        <Loader2 className="h-5 w-5 animate-spin inline-block" />
                      </td>
                    </tr>
                  ) : hadithRecords.length === 0 ? (
                    <tr>
                      <td className="p-4 text-center text-muted-foreground" colSpan={6}>
                        لا توجد أحاديث مسجلة بعد.
                      </td>
                    </tr>
                  ) : (
                    hadithRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4 max-w-sm">
                          <div className="flex items-start gap-2">
                            <BookMarked className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{record.hadith?.text ?? record.hadithId}</span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {record.hadith?.bookName ?? record.hadith?.chapter ?? "-"}
                        </td>
                        <td className="p-4">{renderStatusBadge(record.statusId)}</td>
                        <td className="p-4 max-w-xs truncate text-muted-foreground">
                          {record.notes || "-"}
                        </td>
                        <td className="p-4 text-muted-foreground">{formatDate(record.memorizedAt)}</td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditStatus("hadith", record)}
                            >
                              <Pencil className="h-3.5 w-3.5 ml-1" />
                              تغيير الحالة
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                setDeleteTarget({ recordType: "hadith", recordId: record.id })
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5 ml-1" />
                              حذف
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">عدد الأحاديث المسجلة: {hadithRecords.length}</p>
        </TabsContent>
      </Tabs>

      {/* ── إضافة سجل ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {addType === "quran-page" ? "إضافة صفحة قرآن" : "إضافة حديث"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="mem-add-halaqa">الحلقة</Label>
              <Select value={formHalaqaId} onValueChange={setFormHalaqaId}>
                <SelectTrigger id="mem-add-halaqa">
                  <SelectValue placeholder="اختر الحلقة" />
                </SelectTrigger>
                <SelectContent>
                  {halaqas.map((halaqa) => (
                    <SelectItem key={halaqa.halaqaId} value={halaqa.halaqaId}>
                      {halaqa.halaqaName} — {halaqa.courseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {addType === "quran-page" ? (
              <div>
                <Label htmlFor="mem-add-page">رقم الصفحة (1 - 604)</Label>
                <Input
                  id="mem-add-page"
                  type="number"
                  min={1}
                  max={604}
                  value={formPageNumber}
                  onChange={(e) => setFormPageNumber(e.target.value)}
                  placeholder="1"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="mem-add-hadith">الحديث</Label>
                <Select
                  value={formHadithId}
                  onValueChange={setFormHadithId}
                  disabled={hadithLookupLoading}
                >
                  <SelectTrigger id="mem-add-hadith">
                    <SelectValue
                      placeholder={hadithLookupLoading ? "جارٍ تحميل الأحاديث..." : "اختر الحديث"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {hadithLookup.map((hadith) => (
                      <SelectItem key={hadith.id} value={hadith.id}>
                        {hadith.text.length > 80 ? `${hadith.text.slice(0, 80)}…` : hadith.text}
                        {hadith.chapter ? ` (${hadith.chapter})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="mem-add-status">الحالة</Label>
              <Select
                value={String(formStatusId)}
                onValueChange={(value) => setFormStatusId(Number(value))}
              >
                <SelectTrigger id="mem-add-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={String(status.id)}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mem-add-notes">ملاحظات</Label>
              <Textarea
                id="mem-add-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="ملاحظات اختيارية"
              />
            </div>

            <Button onClick={() => void handleAdd()} disabled={saving} className="w-full">
              {saving ? "جارٍ الحفظ..." : "إضافة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── تغيير الحالة ── */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تغيير حالة الحفظ</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="mem-edit-status">الحالة</Label>
              <Select
                value={String(editStatusId)}
                onValueChange={(value) => setEditStatusId(Number(value))}
              >
                <SelectTrigger id="mem-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={String(status.id)}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mem-edit-notes">ملاحظات</Label>
              <Textarea
                id="mem-edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="ملاحظات اختيارية"
              />
            </div>

            <Button onClick={() => void handleSaveStatus()} disabled={saving} className="w-full">
              {saving ? "جارٍ الحفظ..." : "حفظ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── حذف ── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>

          <p>هل أنت متأكد من حذف هذا السجل؟</p>

          <div className="flex gap-3 mt-4">
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
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

export default StudentMemorizationPage;
