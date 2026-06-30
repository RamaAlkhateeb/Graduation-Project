import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';
import { formApi, responseApi } from '../api/formApi';
import type { FormDto } from '../types/form';
import QuestionRenderer from '../components/QuestionRenderer';
import { useT } from '../i18n';

export default function FormFillPage() {
  const { accessToken } = useParams<{ accessToken: string }>();
  const [form, setForm] = useState<FormDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startTime = useRef(Date.now());
  const t = useT();

  const { register, handleSubmit, formState: { errors } } = useForm<FieldValues>();

  useEffect(() => {
    if (accessToken) {
      formApi.getByToken(accessToken)
        .then(setForm)
        .catch(() => setError(t.formNotFound))
        .finally(() => setLoading(false));
    }
  }, [accessToken]);

  const onSubmit = async (data: FieldValues) => {
    if (!form) return;
    setSubmitting(true);
    setError(null);
    try {
      const timeSpentSeconds = Math.round((Date.now() - startTime.current) / 1000);
      const answers = form.questions.map(q => {
        const fieldName = `q_${q.id}`;
        if (q.questionType === 'ShortText' || q.questionType === 'LongText') {
          return { questionId: q.id, textAnswer: data[fieldName] || '', selectedOptionIds: [] };
        } else if (q.questionType === 'Checkbox') {
          const selectedIds = q.options.filter(o => data[`${fieldName}_${o.id}`]).map(o => o.id);
          return { questionId: q.id, selectedOptionIds: selectedIds };
        } else {
          return { questionId: q.id, selectedOptionIds: data[fieldName] ? [data[fieldName]] : [] };
        }
      });
      await responseApi.submit({ formId: form.id, timeSpentSeconds, answers });
      setSubmitted(true);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  if (error && !form) return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-slate-900">
      <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm max-w-md w-full">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{error}</h2>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-4 dark:bg-slate-900" style={{ backgroundColor: form?.backgroundColor || '#f9fafb' }}>
      <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm max-w-md w-full">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.submitSuccess}</h2>
        <p className="text-gray-500 dark:text-slate-400">{t.submitThankYou}</p>
      </div>
    </div>
  );

  if (!form) return null;

  const sorted = [...(form.questions || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen py-8 px-4 dark:bg-slate-900 transition-colors duration-300" style={{ backgroundColor: form.backgroundColor || '#f9fafb', fontFamily: form.fontFamily }}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Form header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border-t-8" style={{ borderTopColor: form.primaryColor || '#3b82f6' }}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{form.title}</h1>
          {form.description && <p className="text-gray-500 dark:text-slate-400 mt-2">{form.description}</p>}
          {form.timerMinutes && (
            <p className="mt-3 text-sm text-orange-600 dark:text-orange-400">⏱ Time limit: {form.timerMinutes} minutes</p>
          )}
        </div>

        {/* Questions */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {sorted.map(question => (
              <div
                key={question.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5"
                style={{ width: `${Math.round((question.columnSpan || 12) / 12 * 100)}%` }}
              >
                <QuestionRenderer
                  question={question}
                  register={register}
                  errors={errors}
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">{error}</div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {submitting ? t.submitting : t.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

