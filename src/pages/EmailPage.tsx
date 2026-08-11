import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Paperclip,
  Plus,
  Trash2,
  X,
  Send,
  Users,
  UserSquare2,
  GraduationCap,
  History,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { uuid } from "@/lib/utils";
import { teacherApi, studentApi } from "@/api/personApi";
import { emailApi } from "@/api/emailApi";
import type { EmailAddressDto, EmailAttachmentDto } from "@/types/email";
import type { TeacherDto, StudentListItemDto } from "@/types/person";

type RecipientCategory = "teacher" | "student" | "manual";

interface ManualRow {
  id: string;
  name: string;
  address: string;
}

interface AttachmentRow {
  id: string;
  fileName: string;
  contentType: string;
  content: string; // base64
  sizeLabel: string;
}

interface SentHistoryEntry {
  id: string;
  subject: string;
  recipientsCount: number;
  recipientsPreview: string;
  sentAt: string;
}

const emptyManualRow = (): ManualRow => ({
  id: uuid(),
  name: "",
  address: "",
});

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const EmailPage = () => {
  const [recipientCategory, setRecipientCategory] = useState<RecipientCategory>("teacher");

  // ── الأساتذة ──
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());

  // ── الطلاب (أولياء الأمور) ──
  const [students, setStudents] = useState<StudentListItemDto[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // ── مستلمون يدويون ──
  const [manualTo, setManualTo] = useState<ManualRow[]>([emptyManualRow()]);

  // ── CC / BCC ──
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [ccRows, setCcRows] = useState<ManualRow[]>([]);
  const [bccRows, setBccRows] = useState<ManualRow[]>([]);

  const [subject, setSubject] = useState("");
  const [bodyMode, setBodyMode] = useState<"text" | "html">("text");
  const [body, setBody] = useState("");

  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [attachmentsUploading, setAttachmentsUploading] = useState(false);

  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SentHistoryEntry[]>([]);

  // ── تحميل الأساتذة ──
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setTeachersLoading(true);
        const list = await teacherApi.list();
        setTeachers(Array.isArray(list) ? list.filter((t) => Boolean(t.email)) : []);
      } catch (err) {
        console.error("loadTeachers error:", err);
        toast.error("تعذر تحميل قائمة الأساتذة");
        setTeachers([]);
      } finally {
        setTeachersLoading(false);
      }
    };

    void loadTeachers();
  }, []);

  // ── تحميل الطلاب ──
  // ملاحظة: لا نفلتر هنا حسب وجود بريد، بل نعرض الجميع ونعطّل من ليس لديه
  // بريد في الواجهة، حتى يتضح للمستخدم الفرق بين "فشل التحميل" و"لا يوجد بريد".
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setStudentsLoading(true);
        const list = await studentApi.list();
        console.log("🔍 studentApi.list() raw result:", list); // 👈 تشخيص مؤقت — احذفه لاحقًا
        console.log("🔍 is array?", Array.isArray(list), "length:", (list as unknown[])?.length); // 👈 تشخيص مؤقت
        setStudents(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("❌ loadStudents error:", err); // 👈 تشخيص مؤقت
        toast.error("تعذر تحميل قائمة الطلاب");
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };

    void loadStudents();
  }, []);

  const safeTeachers = Array.isArray(teachers) ? teachers : [];
  const safeStudents = Array.isArray(students) ? students : [];

  const filteredTeachers = safeTeachers.filter((t) =>
    `${t.name} ${t.email ?? ""}`.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const filteredStudents = safeStudents.filter((s) =>
    `${s.name} ${s.fatherName ?? ""} ${s.email ?? ""}`
      .toLowerCase()
      .includes(studentSearch.toLowerCase())
  );

  const toggleTeacher = (id: string, checked: boolean) => {
    setSelectedTeacherIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectAllVisibleTeachers = () => {
    setSelectedTeacherIds((prev) => {
      const next = new Set(prev);
      filteredTeachers.forEach((t) => next.add(t.id));
      return next;
    });
  };

  const clearTeacherSelection = () => setSelectedTeacherIds(new Set());

  const toggleStudent = (id: string, checked: boolean) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // نحدد فقط الطلاب الظاهرين حاليًا والذين لديهم بريد إلكتروني فعلي
  const selectAllVisibleStudents = () => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      filteredStudents.filter((s) => Boolean(s.email)).forEach((s) => next.add(s.id));
      return next;
    });
  };

  const clearStudentSelection = () => setSelectedStudentIds(new Set());

  const updateRow = (
    rows: ManualRow[],
    setRows: (r: ManualRow[]) => void,
    id: string,
    patch: Partial<ManualRow>
  ) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addRow = (rows: ManualRow[], setRows: (r: ManualRow[]) => void) => {
    setRows([...rows, emptyManualRow()]);
  };

  const removeRow = (rows: ManualRow[], setRows: (r: ManualRow[]) => void, id: string) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const handleFilesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setAttachmentsUploading(true);
      const newAttachments: AttachmentRow[] = [];

      for (const file of Array.from(files)) {
        const content = await readFileAsBase64(file);
        newAttachments.push({
          id: uuid(),
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          content,
          sizeLabel: formatBytes(file.size),
        });
      }

      setAttachments((prev) => [...prev, ...newAttachments]);
    } catch {
      toast.error("تعذر إرفاق أحد الملفات");
    } finally {
      setAttachmentsUploading(false);
      event.target.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const buildAddresses = (rows: ManualRow[]): EmailAddressDto[] =>
    rows
      .filter((row) => row.address.trim())
      .map((row) => ({
        name: row.name.trim() || null,
        address: row.address.trim(),
      }));

  const selectedTeachers = safeTeachers.filter((t) => selectedTeacherIds.has(t.id));
  const selectedStudents = safeStudents.filter((s) => selectedStudentIds.has(s.id));

  const resetComposer = () => {
    setSubject("");
    setBody("");
    setBodyMode("text");
    setAttachments([]);
    setShowCcBcc(false);
    setCcRows([]);
    setBccRows([]);
    setManualTo([emptyManualRow()]);
    setSelectedTeacherIds(new Set());
    setSelectedStudentIds(new Set());
  };

  const handleSend = async () => {
    const teacherAddresses: EmailAddressDto[] =
      recipientCategory === "teacher"
        ? selectedTeachers
            .filter((t) => t.email)
            .map((t) => ({ name: t.name, address: t.email as string }))
        : [];

    const studentAddresses: EmailAddressDto[] =
      recipientCategory === "student"
        ? selectedStudents
            .filter((s) => s.email)
            .map((s) => ({ name: s.name, address: s.email as string }))
        : [];

    const manualAddresses = recipientCategory === "manual" ? buildAddresses(manualTo) : [];

    const to = [...teacherAddresses, ...studentAddresses, ...manualAddresses];

    if (to.length === 0) {
      toast.error("اختر مستلمًا واحدًا على الأقل");
      return;
    }

    if (!subject.trim()) {
      toast.error("يرجى كتابة موضوع الرسالة");
      return;
    }

    if (!body.trim()) {
      toast.error("يرجى كتابة نص الرسالة");
      return;
    }

    const cc = buildAddresses(ccRows);
    const bcc = buildAddresses(bccRows);

    const attachmentPayload: EmailAttachmentDto[] = attachments.map((a) => ({
      fileName: a.fileName,
      content: a.content,
      contentType: a.contentType,
    }));

    try {
      setSending(true);

      await emailApi.send({
        to,
        cc: cc.length > 0 ? cc : undefined,
        bcc: bcc.length > 0 ? bcc : undefined,
        subject: subject.trim(),
        htmlBody: bodyMode === "html" ? body : null,
        plainTextBody: bodyMode === "text" ? body : null,
        attachments: attachmentPayload.length > 0 ? attachmentPayload : undefined,
      });

      const preview =
        to.length <= 2
          ? to.map((r) => r.name || r.address).join("، ")
          : `${to[0].name || to[0].address} و${to.length - 1} آخرين`;

      setHistory((prev) => [
        {
          id: uuid(),
          subject: subject.trim(),
          recipientsCount: to.length,
          recipientsPreview: preview,
          sentAt: new Date().toLocaleString("ar", {
            hour: "2-digit",
            minute: "2-digit",
            day: "numeric",
            month: "short",
          }),
        },
        ...prev,
      ]);

      toast.success(`تم إرسال البريد إلى ${to.length} مستلم بنجاح`);
      resetComposer();
    } catch {
      toast.error("فشل إرسال البريد. تأكد من الاتصال بالخادم وحاول مرة أخرى");
    } finally {
      setSending(false);
    }
  };

  const renderManualRows = (
    label: string,
    rows: ManualRow[],
    setRows: (r: ManualRow[]) => void,
    compact = false
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 h-7 text-xs"
          onClick={() => addRow(rows, setRows)}
        >
          <Plus className="h-3.5 w-3.5" />
          إضافة
        </Button>
      </div>

      {rows.map((row) => (
        <div key={row.id} className="flex gap-2">
          {!compact && (
            <Input
              placeholder="الاسم (اختياري)"
              value={row.name}
              onChange={(e) => updateRow(rows, setRows, row.id, { name: e.target.value })}
              className="flex-1"
            />
          )}
          <Input
            type="email"
            placeholder="البريد الإلكتروني"
            value={row.address}
            onChange={(e) => updateRow(rows, setRows, row.id, { address: e.target.value })}
            className={compact ? "flex-1" : "flex-[1.5]"}
            dir="ltr"
          />
          {rows.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRow(rows, setRows, row.id)}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );

  const totalRecipientsCount =
    recipientCategory === "teacher"
      ? selectedTeacherIds.size
      : recipientCategory === "student"
        ? selectedStudentIds.size
        : buildAddresses(manualTo).length;

  return (
    <DashboardLayout
      title="البريد الإلكتروني"
      subtitle="إرسال رسائل بريد إلكتروني للأساتذة أو الطلاب أو لعناوين مخصصة"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ══════════ عمود المستلمين ══════════ */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="glass-card border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                المستلمون
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={recipientCategory}
                onValueChange={(v) => setRecipientCategory(v as RecipientCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">
                    <span className="flex items-center gap-2">
                      <UserSquare2 className="h-3.5 w-3.5" />
                      أساتذة (من النظام)
                    </span>
                  </SelectItem>
                  <SelectItem value="student">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5" />
                      طلاب / أولياء أمور (من النظام)
                    </span>
                  </SelectItem>
                  <SelectItem value="manual">
                    <span className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      بريد يدوي (عنوان مخصص)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* ── أساتذة ── */}
              {recipientCategory === "teacher" && (
                <div className="space-y-3">
                  <Input
                    placeholder="بحث عن أستاذ..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                  />

                  {teachersLoading ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      جاري تحميل الأساتذة...
                    </p>
                  ) : filteredTeachers.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      لا يوجد أساتذة لديهم بريد إلكتروني مسجل.
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <button
                          type="button"
                          onClick={selectAllVisibleTeachers}
                          className="hover:text-primary transition-colors"
                        >
                          تحديد الكل
                        </button>
                        <button
                          type="button"
                          onClick={clearTeacherSelection}
                          className="hover:text-destructive transition-colors"
                        >
                          إلغاء التحديد
                        </button>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-1 rounded-lg border p-1.5">
                        {filteredTeachers.map((teacher) => (
                          <label
                            key={teacher.id}
                            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <Checkbox
                              checked={selectedTeacherIds.has(teacher.id)}
                              onCheckedChange={(checked) =>
                                toggleTeacher(teacher.id, checked === true)
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{teacher.name}</p>
                              <p className="text-xs text-muted-foreground truncate" dir="ltr">
                                {teacher.email}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── طلاب / أولياء أمور ── */}
              {recipientCategory === "student" && (
                <div className="space-y-3">
                  <Input
                    placeholder="بحث عن طالب أو ولي أمر..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />

                  {studentsLoading ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      جاري تحميل الطلاب...
                    </p>
                  ) : filteredStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      لا يوجد طلاب مطابقون للبحث.
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <button
                          type="button"
                          onClick={selectAllVisibleStudents}
                          className="hover:text-primary transition-colors"
                        >
                          تحديد الكل (لديهم بريد)
                        </button>
                        <button
                          type="button"
                          onClick={clearStudentSelection}
                          className="hover:text-destructive transition-colors"
                        >
                          إلغاء التحديد
                        </button>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-1 rounded-lg border p-1.5">
                        {filteredStudents.map((student) => {
                          const hasEmail = Boolean(student.email);
                          return (
                            <label
                              key={student.id}
                              className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors ${
                                hasEmail
                                  ? "hover:bg-muted/50 cursor-pointer"
                                  : "opacity-50 cursor-not-allowed"
                              }`}
                            >
                              <Checkbox
                                checked={selectedStudentIds.has(student.id)}
                                disabled={!hasEmail}
                                onCheckedChange={(checked) =>
                                  toggleStudent(student.id, checked === true)
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {student.name}
                                  {student.fatherName ? ` — ولي الأمر: ${student.fatherName}` : ""}
                                </p>
                                <p className="text-xs text-muted-foreground truncate" dir="ltr">
                                  {student.email || "لا يوجد بريد إلكتروني مسجل"}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── يدوي ── */}
              {recipientCategory === "manual" && (
                <div className="space-y-3">
                  {renderManualRows("المستلمون", manualTo, setManualTo)}
                </div>
              )}

              {totalRecipientsCount > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 text-primary px-3 py-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {totalRecipientsCount} مستلم محدد
                </div>
              )}
            </CardContent>
          </Card>

          {/* CC / BCC */}
          <Card className="glass-card border-border/60">
            <button
              type="button"
              onClick={() => setShowCcBcc((s) => !s)}
              className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-foreground"
            >
              نسخة (CC) / نسخة مخفية (BCC)
              {showCcBcc ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showCcBcc && (
              <CardContent className="space-y-4 pt-0">
                {renderManualRows("نسخة (CC)", ccRows, setCcRows, true)}
                <Separator />
                {renderManualRows("نسخة مخفية (BCC)", bccRows, setBccRows, true)}
              </CardContent>
            )}
          </Card>

          {/* سجل الإرسال */}
          {history.length > 0 && (
            <Card className="glass-card border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  آخر الرسائل المرسلة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {history.slice(0, 6).map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border bg-background/50 px-3 py-2 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground truncate">{entry.subject}</p>
                      <span className="text-muted-foreground shrink-0">{entry.sentAt}</span>
                    </div>
                    <p className="text-muted-foreground truncate">
                      إلى: {entry.recipientsPreview}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ══════════ عمود التأليف ══════════ */}
        <div className="lg:col-span-2">
          <Card className="glass-card border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                محتوى الرسالة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>الموضوع</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="موضوع الرسالة"
                  className="mt-1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>نص الرسالة</Label>
                  <Select
                    value={bodyMode}
                    onValueChange={(v) => setBodyMode(v as "text" | "html")}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">نص عادي</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  rows={bodyMode === "html" ? 12 : 10}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={
                    bodyMode === "html" ? "<p>مرحبًا...</p>" : "اكتب نص الرسالة هنا..."
                  }
                  dir={bodyMode === "html" ? "ltr" : "rtl"}
                  className="resize-none"
                />
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>المرفقات</Label>
                  <div>
                    <input
                      id="email-attachments"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFilesChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={attachmentsUploading}
                      onClick={() => document.getElementById("email-attachments")?.click()}
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      {attachmentsUploading ? "جارٍ الرفع..." : "إرفاق ملف"}
                    </Button>
                  </div>
                </div>

                {attachments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">لا توجد مرفقات</p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-lg border bg-background/50 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{a.fileName}</span>
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            {a.sizeLabel}
                          </Badge>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(a.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {totalRecipientsCount > 0
                    ? `سيتم الإرسال إلى ${totalRecipientsCount} مستلم`
                    : "لم يتم تحديد مستلمين بعد"}
                </p>
                <Button onClick={handleSend} className="gap-2" disabled={sending} size="lg">
                  <Send className="h-4 w-4" />
                  {sending ? "جارٍ الإرسال..." : "إرسال البريد"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmailPage;

