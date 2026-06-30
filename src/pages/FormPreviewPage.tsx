import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';
import { formApi } from '../api/formApi';
import type { FormDto } from '../types/form';
import QuestionRenderer from '../components/QuestionRenderer';
import { useT } from '../i18n';

export default function FormPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  const { register, formState: { errors } } = useForm<FieldValues>();

  useEffect(() => {
    if (id) {
      formApi.get(id)
        .then(setForm)
        .catch(() => setError('Failed to load form'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  if (error || !form) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="text-center">
        <p className="text-red-600 font-medium">{error || 'Form not found'}</p>
        <Link to="/" className="mt-3 text-sm text-blue-600 underline block">Back to forms</Link>
      </div>
    </div>
  );

  const sorted = [...(form.questions || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen py-8 px-4 dark:bg-slate-900 transition-colors duration-300" style={{ backgroundColor: form.backgroundColor || '#f9fafb', fontFamily: form.fontFamily }}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Preview banner */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">{t.previewMode}</span>
          <div className="flex gap-3">
            <Link to={`/forms/${id}/edit`} className="text-sm text-yellow-700 dark:text-yellow-400 underline">{t.edit}</Link>
            <Link to="/" className="text-sm text-yellow-700 dark:text-yellow-400 underline">{t.back}</Link>
          </div>
        </div>

        {/* Form header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border-t-8" style={{ borderTopColor: form.primaryColor || '#3b82f6' }}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{form.title}</h1>
          {form.description && <p className="text-gray-500 dark:text-slate-400 mt-2">{form.description}</p>}
          <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-500 dark:text-slate-400">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${form.formType === 'Quiz' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
              {form.formType}
            </span>
            {form.timerMinutes && <span>⏱ {form.timerMinutes} minutes</span>}
          </div>
        </div>

        {/* Questions */}
        <form className="flex flex-wrap gap-4">
          {sorted.map(question => (
            <div key={question.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5" style={{ width: `${Math.round((question.columnSpan || 12) / 12 * 100)}%` }}>
              <QuestionRenderer
                question={question}
                register={register}
                errors={errors}
                readOnly={true}
              />
            </div>
          ))}
        </form>
      </div>
    </div>
  );
}

