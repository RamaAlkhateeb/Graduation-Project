import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';
import { formApi, responseApi } from '../api/formApi';
import type { FormDto, FormResponseDto } from '../types/form';
import QuestionRenderer from '../components/QuestionRenderer';

export default function FormFillPage() {
  const { accessToken } = useParams<{ accessToken: string }>();
  const [form, setForm] = useState<FormDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<FormResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startTime = useRef(Date.now());

  const { register, handleSubmit, formState: { errors } } = useForm<FieldValues>();

  useEffect(() => {
    if (accessToken) {
      formApi.getByToken(accessToken)
        .then(setForm)
        .catch(() => setError('الاستبيان غير موجود أو لم يعد متاحًا'))
        .finally(() => setLoading(false));
    }
  }, [accessToken]);

  // هل يحتوي الاختبار على أسئلة تحتاج تصحيح يدوي (نص قصير/طويل)؟
  const hasManualGradedQuestions =
    form?.formType === 'Quiz' &&
    (form.questions || []).some((q) => q.questionType === 'ShortText' || q.questionType === 'LongText');

  const onSubmit = async (data: FieldValues) => {
    if (!form) return;
    setSubmitting(true);
    setError(null);
    try {
      const timeSpentSeconds = Math.round((Date.now() - startTime.current) / 1000);
      const answers = form.questions.map((q) => {
        const fieldName = `q_${q.id}`;
        if (q.questionType === 'ShortText' || q.questionType === 'LongText') {
          return { questionId: q.id, textAnswer: data[fieldName] || '', selectedOptionIds: [] };
        } else if (q.questionType === 'Checkbox') {
          const selectedIds = q.options.filter((o) => data[`${fieldName}_${o.id}`]).map((o) => o.id);
          return { questionId: q.id, selectedOptionIds: selectedIds };
        } else {
          return { questionId: q.id, selectedOptionIds: data[fieldName] ? [data[fieldName]] : [] };
        }
      });
      const result = await responseApi.submit({ formId: form.id, timeSpentSeconds, answers });
      setSubmittedResult(result);
      setSubmitted(true);
    } catch {
      setError('فشل إرسال الرد. حاول مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );

  if (error && !form)
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background font-tajawal" dir="rtl">
        <div className="text-center glass-card p-8 rounded-xl max-w-md w-full">
          <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        </div>
      </div>
    );

  if (submitted)
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background font-tajawal" dir="rtl">
        <div className="text-center glass-card p-8 rounded-xl max-w-md w-full">
          <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">تم إرسال الرد!</h2>

          {form?.formType === 'Quiz' && submittedResult && (
            <div className="my-5 py-4 border-y border-border/60">
              <p className="text-muted-foreground text-sm mb-1">نتيجتك</p>
              <p className="text-4xl font-bold text-primary">{submittedResult.score ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">نقطة</p>

              {hasManualGradedQuestions && (
                <p className="text-xs text-muted-foreground mt-3">
                  يحتوي هذا الاختبار على أسئلة نصية تحتاج تصحيح المعلم، وقد تتغير نتيجتك بعد اكتمال التصحيح.
                </p>
              )}
            </div>
          )}

          <p className="text-muted-foreground">شكراً لإكمالك الاستبيان.</p>
        </div>
      </div>
    );

  if (!form) return null;

  const sorted = [...(form.questions || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen py-8 px-4 bg-background font-tajawal" dir="rtl" style={{ fontFamily: form.fontFamily }}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div
          className="glass-card rounded-xl p-6 border-t-4"
          style={{ borderTopColor: form.primaryColor || 'hsl(var(--primary))' }}
        >
          <h1 className="text-2xl font-bold text-foreground">{form.title}</h1>
          {form.description && <p className="text-muted-foreground mt-2">{form.description}</p>}
          {form.timerMinutes && (
            <p className="mt-3 text-sm text-accent-foreground">⏱ الوقت المحدد: {form.timerMinutes} دقيقة</p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {sorted.map((question) => (
              <div
                key={question.id}
                className="glass-card rounded-xl p-5"
                style={{ width: `${Math.round(((question.columnSpan || 12) / 12) * 100)}%` }}
              >
                <QuestionRenderer question={question} register={register} errors={errors} />
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-start">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              {submitting ? 'جاري الإرسال...' : 'إرسال'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
