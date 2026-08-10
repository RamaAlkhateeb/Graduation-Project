import { useState } from 'react';
import { Mail, Paperclip, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { teacherApi } from '@/api/personApi';
import { emailApi } from '@/api/emailApi';
import type { EmailAddressDto, EmailAttachmentDto } from '@/types/email';
import type { TeacherDto } from '@/types/person';

type RecipientCategory = 'teacher' | 'manual';

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
}

const emptyManualRow = (): ManualRow => ({
  id: crypto.randomUUID(),
  name: '',
  address: '',
});

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const EmailComposeDialog = () => {
  const [open, setOpen] = useState(false);
  const [recipientCategory, setRecipientCategory] = useState<RecipientCategory>('teacher');

  // ── الأساتذة ──
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());

  // ── مستلمون يدويون (للطلاب/أولياء الأمور مؤقتًا) ──
  const [manualTo, setManualTo] = useState<ManualRow[]>([emptyManualRow()]);

  // ── نسخة / نسخة مخفية ──
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [ccRows, setCcRows] = useState<ManualRow[]>([]);
  const [bccRows, setBccRows] = useState<ManualRow[]>([]);

  const [subject, setSubject] = useState('');
  const [bodyMode, setBodyMode] = useState<'text' | 'html'>('text');
  const [body, setBody] = useState('');

  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [attachmentsUploading, setAttachmentsUploading] = useState(false);

  const [sending, setSending] = useState(false);

  const resetForm = () => {
    setRecipientCategory('teacher');
    setSelectedTeacherIds(new Set());
    setManualTo([emptyManualRow()]);
    setShowCcBcc(false);
    setCcRows([]);
    setBccRows([]);
    setSubject('');
    setBodyMode('text');
    setBody('');
    setAttachments([]);
  };

  const loadTeachers = async () => {
    if (teachers.length > 0) return;
    try {
      setTeachersLoading(true);
      const list = await teacherApi.list();
      setTeachers(list.filter((t) => Boolean(t.email)));
    } catch {
      toast.error('تعذر تحميل قائمة الأساتذة');
    } finally {
      setTeachersLoading(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) {
      void loadTeachers();
    } else {
      resetForm();
    }
  };

  const toggleTeacher = (id: string, checked: boolean) => {
    setSelectedTeacherIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // ── إدارة صفوف يدوية عامة (to / cc / bcc) ──
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
          id: crypto.randomUUID(),
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          content,
        });
      }

      setAttachments((prev) => [...prev, ...newAttachments]);
    } catch {
      toast.error('تعذر إرفاق أحد الملفات');
    } finally {
      setAttachmentsUploading(false);
      event.target.value = '';
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

  const handleSend = async () => {
    const teacherAddresses: EmailAddressDto[] =
      recipientCategory === 'teacher'
        ? teachers
            .filter((t) => selectedTeacherIds.has(t.id) && t.email)
            .map((t) => ({ name: t.name, address: t.email as string }))
        : [];

    const manualAddresses = recipientCategory === 'manual' ? buildAddresses(manualTo) : [];

    const to = [...teacherAddresses, ...manualAddresses];

    if (to.length === 0) {
      toast.error('اختر مستلمًا واحدًا على الأقل');
      return;
    }

    if (!subject.trim()) {
      toast.error('يرجى كتابة موضوع الرسالة');
      return;
    }

    if (!body.trim()) {
      toast.error('يرجى كتابة نص الرسالة');
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
        htmlBody: bodyMode === 'html' ? body : null,
        plainTextBody: bodyMode === 'text' ? body : null,
        attachments: attachmentPayload.length > 0 ? attachmentPayload : undefined,
      });

      toast.success(`تم إرسال البريد إلى ${to.length} مستلم بنجاح`);
      setOpen(false);
      resetForm();
    } catch {
      toast.error('فشل إرسال البريد. تأكد من الاتصال بالخادم وحاول مرة أخرى');
    } finally {
      setSending(false);
    }
  };

  const renderManualRows = (
    label: string,
    rows: ManualRow[],
    setRows: (r: ManualRow[]) => void
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 h-7"
          onClick={() => addRow(rows, setRows)}
        >
          <Plus className="h-3.5 w-3.5" />
          إضافة
        </Button>
      </div>

      {rows.map((row) => (
        <div key={row.id} className="flex gap-2">
          <Input
            placeholder="الاسم (اختياري)"
            value={row.name}
            onChange={(e) => updateRow(rows, setRows, row.id, { name: e.target.value })}
            className="flex-1"
          />
          <Input
            type="email"
            placeholder="البريد الإلكتروني"
            value={row.address}
            onChange={(e) => updateRow(rows, setRows, row.id, { address: e.target.value })}
            className="flex-[1.5]"
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Mail className="h-4 w-4" />
          إرسال بريد إلكتروني
        </Button>
      </DialogTrigger>

      <DialogContent className="font-tajawal max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إرسال بريد إلكتروني</DialogTitle>
          <DialogDescription className="sr-only">
            إرسال بريد إلكتروني للأساتذة أو لعناوين مخصصة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* نوع المستلم */}
          <div>
            <Label className="mb-2 block">إرسال إلى</Label>
            <Select
              value={recipientCategory}
              onValueChange={(v) => setRecipientCategory(v as RecipientCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">أساتذة (من النظام)</SelectItem>
                <SelectItem value="manual">بريد يدوي (طلاب / أولياء أمور)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* قائمة الأساتذة */}
          {recipientCategory === 'teacher' && (
            <div className="space-y-2">
              <Label>اختر الأساتذة</Label>
              {teachersLoading ? (
                <p className="text-sm text-muted-foreground">جاري تحميل الأساتذة...</p>
              ) : teachers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  لا يوجد أساتذة لديهم بريد إلكتروني مسجل في النظام.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border p-2">
                  {teachers.map((teacher) => (
                    <label
                      key={teacher.id}
                      className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedTeacherIds.has(teacher.id)}
                        onCheckedChange={(checked) =>
                          toggleTeacher(teacher.id, checked === true)
                        }
                      />
                      <span className="flex-1">{teacher.name}</span>
                      <span className="text-xs text-muted-foreground" dir="ltr">
                        {teacher.email}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {selectedTeacherIds.size > 0 && (
                <p className="text-xs text-muted-foreground">
                  تم اختيار {selectedTeacherIds.size} أستاذ/أساتذة
                </p>
              )}
            </div>
          )}

          {/* مستلمون يدويون */}
          {recipientCategory === 'manual' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                لا تتوفر عناوين بريد الطلاب في النظام حاليًا، لذا يمكنك كتابة بريد ولي الأمر أو
                الطالب يدويًا هنا مؤقتًا. سيتم ربط هذا تلقائيًا لاحقًا عند إضافة الحقل من قبل
                المسؤول.
              </div>
              {renderManualRows('المستلمون', manualTo, setManualTo)}
            </div>
          )}

          {/* CC / BCC */}
          <div>
            <button
              type="button"
              onClick={() => setShowCcBcc((s) => !s)}
              className="text-sm text-primary hover:underline"
            >
              {showCcBcc ? 'إخفاء' : 'إضافة'} نسخة (CC) / نسخة مخفية (BCC)
            </button>

            {showCcBcc && (
              <div className="space-y-4 mt-3">
                {renderManualRows('نسخة (CC)', ccRows, setCcRows)}
                {renderManualRows('نسخة مخفية (BCC)', bccRows, setBccRows)}
              </div>
            )}
          </div>

          {/* الموضوع */}
          <div>
            <Label>الموضوع</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          {/* نص الرسالة */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>نص الرسالة</Label>
              <Select value={bodyMode} onValueChange={(v) => setBodyMode(v as 'text' | 'html')}>
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
              rows={bodyMode === 'html' ? 8 : 6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={bodyMode === 'html' ? '<p>مرحبًا...</p>' : 'اكتب نص الرسالة هنا...'}
              dir={bodyMode === 'html' ? 'ltr' : 'rtl'}
            />
          </div>

          {/* المرفقات */}
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
                  onClick={() => document.getElementById('email-attachments')?.click()}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {attachmentsUploading ? 'جارٍ الرفع...' : 'إرفاق ملف'}
                </Button>
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((a) => (
                  <Badge key={a.id} variant="secondary" className="gap-1.5 pl-1">
                    {a.fileName}
                    <button
                      type="button"
                      onClick={() => removeAttachment(a.id)}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleSend} className="w-full gap-2" disabled={sending}>
            <Mail className="h-4 w-4" />
            {sending ? 'جارٍ الإرسال...' : 'إرسال البريد'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailComposeDialog;