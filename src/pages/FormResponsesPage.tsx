import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { formApi, responseApi, answerApi } from '../api/formApi';
import type { FormDto, FormResponseDto } from '../types/form';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Copy, Check, FileSpreadsheet } from 'lucide-react';

export default function FormResponsesPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormDto | null>(null);
  const [responses, setResponses] = useState<FormResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── تصحيح الأسئلة النصية يدويًا ──
  const [gradingValues, setGradingValues] = useState<Record<string, string>>({});
  const [savingAnswerId, setSavingAnswerId] = useState<string | null>(null);
  const [gradingError, setGradingError] = useState<string | null>(null);

  const loadData = async (formId: string) => {
    try {
      setLoading(true);
      const [f, r] = await Promise.all([formApi.get(formId), responseApi.list(formId)]);
      setForm(f);
      setResponses(r);
    } catch {
      setError('فشل تحميل الردود');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const copyLink = () => {
    if (!form?.accessToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/fill/${form.accessToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const avgScore =
    responses.length > 0 && form?.formType === 'Quiz'
      ? Math.round(responses.reduce((sum, r) => sum + (r.score ?? 0), 0) / responses.length)
      : null;

  const avgMinutes =
    responses.length > 0
      ? Math.round(responses.reduce((sum, r) => sum + (r.timeSpentSeconds ?? 0), 0) / responses.length / 60)
      : null;

  const getQuestionById = (questionId: string) =>
    form?.questions.find((q) => q.id === questionId);

  const isManualGradeQuestion = (questionType?: string) =>
    questionType === 'ShortText' || questionType === 'LongText';

  const handleGradeAnswer = async (answerId: string, maxPoints: number) => {
    setGradingError(null);
    const raw = gradingValues[answerId];
    const parsed = Number(raw);

    if (raw === undefined || raw.trim() === '' || Number.isNaN(parsed) || parsed < 0 || parsed > maxPoints) {
      setGradingError(`أدخل درجة صحيحة بين 0 و ${maxPoints}`);
      return;
    }

    try {
      setSavingAnswerId(answerId);
      await answerApi.grade(answerId, parsed);

      if (id) {
        await loadData(id);
      }
    } catch {
      setGradingError('فشل حفظ الدرجة. تأكد من الاتصال بالخادم وحاول مرة أخرى.');
    } finally {
      setSavingAnswerId(null);
    }
  };

  const handleExportExcel = () => {
    if (!form) return;

    const sortedQuestions = [...(form.questions || [])].sort((a, b) => a.order - b.order);

    const rows = responses.map((response, idx) => {
      const row: Record<string, string | number> = {
        '#': idx + 1,
        'النوع': response.respondedByStudentId
          ? 'طالب'
          : response.respondedByTeacherId
          ? 'أستاذ'
          : 'مجهول',
        'المعرف': response.respondedByStudentId || response.respondedByTeacherId || '-',
        'تاريخ الإرسال': new Date(response.submittedAt).toLocaleString('ar'),
        'الوقت المستغرق (دقيقة)':
          response.timeSpentSeconds != null ? Math.round(response.timeSpentSeconds / 60) : '-',
      };

      if (form.formType === 'Quiz') {
        row['الدرجة الإجمالية'] = response.score ?? 0;
      }

      sortedQuestions.forEach((question) => {
        const answer = response.answers.find((a) => a.questionId === question.id);
        let value: string = '-';

        if (answer) {
          if (answer.selectedOptions && answer.selectedOptions.length > 0) {
            value = answer.selectedOptions.map((o) => o.text).join('، ');
          } else if (answer.textAnswer) {
            value = answer.textAnswer;
          }
        }

        row[question.text] = value;

        if (form.formType === 'Quiz' && isManualGradeQuestion(question.questionType)) {
          row[`${question.text} - الدرجة الممنوحة`] =
            answer?.pointsAwarded != null ? answer.pointsAwarded : 'بانتظار التصحيح';
        }
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الردود');

    const safeTitle = (form.title || 'نتائج').replace(/[\\/:*?"<>|]/g, '-');
    XLSX.writeFile(workbook, `${safeTitle}-نتائج.xlsx`);
  };

  return (
    <DashboardLayout title={form?.title || 'الردود'} subtitle="تحليلات الردود">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/form">
            <ChevronRight className="h-4 w-4" />
            رجوع
          </Link>
        </Button>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleExportExcel}
            disabled={!form || responses.length === 0}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            تصدير Excel
          </Button>

          {form?.accessToken && (
            <Button variant={copied ? 'default' : 'outline'} size="sm" className="gap-1.5" onClick={copyLink}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'تم النسخ!' : 'نسخ رابط المشاركة'}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {error && (
            <div className="glass-card border-destructive/30 rounded-xl p-4 text-destructive mb-6">{error}</div>
          )}

          {gradingError && (
            <div className="glass-card border-destructive/30 rounded-xl p-4 text-destructive mb-6">
              {gradingError}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="stat-card text-center">
              <div className="text-3xl font-bold text-primary">{responses.length}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">إجمالي الردود</div>
            </div>
            <div className="stat-card text-center">
              <div className="text-3xl font-bold text-foreground">{form?.questions?.length || 0}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">الأسئلة</div>
            </div>
            <div className="stat-card text-center">
              <div className="text-3xl font-bold text-success">{avgScore ?? '—'}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">متوسط الدرجات</div>
            </div>
            <div className="stat-card text-center">
              <div className="text-3xl font-bold text-accent-foreground">{avgMinutes ?? '—'}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">متوسط الدقائق</div>
            </div>
          </div>

          {responses.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-xl">
              <h2 className="text-xl font-semibold text-foreground">لا توجد ردود بعد</h2>
              <p className="text-muted-foreground mt-2 mb-5 text-sm">شارك رابط الاستبيان لبدء جمع الردود</p>
              {form?.accessToken && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <code className="bg-muted px-4 py-2 rounded-xl text-sm text-foreground font-mono" dir="ltr">
                    /fill/{form.accessToken}
                  </code>
                  <Button size="sm" onClick={copyLink}>
                    {copied ? 'تم النسخ!' : 'نسخ الرابط'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {responses.map((response, idx) => (
                <div key={response.id} className="glass-card rounded-xl overflow-hidden">
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => setExpandedId(expandedId === response.id ? null : response.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm">
                          {response.respondedByStudentId
                            ? `طالب · ${response.respondedByStudentId.substring(0, 8)}…`
                            : response.respondedByTeacherId
                            ? `أستاذ · ${response.respondedByTeacherId.substring(0, 8)}…`
                            : 'مجهول'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {new Date(response.submittedAt).toLocaleDateString('ar')} {new Date(response.submittedAt).toLocaleTimeString('ar')}
                          {response.timeSpentSeconds != null && ` · ${Math.round(response.timeSpentSeconds / 60)} د`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {form?.formType === 'Quiz' && response.score !== undefined && (
                        <Badge>{response.score} نقطة</Badge>
                      )}
                      <span className="text-muted-foreground text-sm">{expandedId === response.id ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {expandedId === response.id && (
                    <div className="px-5 pb-5 border-t border-border/50">
                      <div className="mt-4 space-y-3">
                        {(response.answers || []).map((answer) => {
                          const question = getQuestionById(answer.questionId);
                          const needsManualGrading =
                            form?.formType === 'Quiz' && isManualGradeQuestion(question?.questionType);
                          const maxPoints = question?.points ?? 0;
                          const currentInputValue =
                            gradingValues[answer.id] ??
                            (answer.pointsAwarded != null ? String(answer.pointsAwarded) : '');

                          return (
                            <div key={answer.id} className="bg-muted/40 rounded-xl p-4">
                              <div className="text-sm font-semibold text-foreground mb-2">
                                {answer.questionText}
                              </div>

                              {answer.textAnswer && (
                                <div className="text-sm text-foreground/80 bg-background rounded-lg px-3 py-2 border border-border mb-2">
                                  {answer.textAnswer}
                                </div>
                              )}

                              {answer.selectedOptions && answer.selectedOptions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {answer.selectedOptions.map((opt) => (
                                    <Badge key={opt.id} variant="secondary">
                                      {opt.text}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {needsManualGrading && (
                                <div className="mt-3 flex items-center gap-2 flex-wrap pt-3 border-t border-border/60">
                                  {answer.pointsAwarded == null ? (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                                      بانتظار التصحيح
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">
                                      تم التصحيح: {answer.pointsAwarded} / {maxPoints}
                                    </Badge>
                                  )}

                                  <input
                                    type="number"
                                    min={0}
                                    max={maxPoints}
                                    value={currentInputValue}
                                    onChange={(e) =>
                                      setGradingValues((prev) => ({ ...prev, [answer.id]: e.target.value }))
                                    }
                                    className="w-20 h-8 px-2 text-sm border border-input rounded-md bg-background"
                                    placeholder={`0-${maxPoints}`}
                                  />
                                  <span className="text-xs text-muted-foreground">من {maxPoints}</span>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={savingAnswerId === answer.id}
                                    onClick={() => handleGradeAnswer(answer.id, maxPoints)}
                                  >
                                    {savingAnswerId === answer.id ? 'جارٍ الحفظ...' : 'حفظ الدرجة'}
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
