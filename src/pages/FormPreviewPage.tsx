import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';
import { formApi } from '../api/formApi';
import type { FormDto } from '../types/form';
import QuestionRenderer from '../components/QuestionRenderer';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ChevronRight, Pencil } from 'lucide-react';

export default function FormPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { register, formState: { errors } } = useForm<FieldValues>();

  useEffect(() => {
    if (id) {
      formApi.get(id)
        .then(setForm)
        .catch(() => setError('فشل تحميل الاستبيان'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="معاينة">
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !form) {
    return (
      <DashboardLayout title="معاينة">
        <div className="glass-card rounded-xl p-10 text-center">
          <p className="text-destructive font-medium">{error || 'الاستبيان غير موجود'}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/form">رجوع</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const sorted = [...(form.questions || [])].sort((a, b) => a.order - b.order);

  return (
    <DashboardLayout title={form.title} subtitle={form.description}>
      <div className="glass-card rounded-xl px-4 py-3 flex items-center justify-between mb-6">
        <span className="text-sm text-accent-foreground font-medium">👁 وضع المعاينة — لن تُحفظ الردود</span>
        <div className="flex gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link to={`/forms/${id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              تعديل
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link to="/form">
              <ChevronRight className="h-3.5 w-3.5" />
              رجوع
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-6 max-w-3xl mx-auto">
        <div
          className="glass-card rounded-xl p-6 border-t-4"
          style={{ borderTopColor: form.primaryColor || 'hsl(var(--primary))' }}
        >
          <h1 className="text-2xl font-bold text-foreground">{form.title}</h1>
          {form.description && <p className="text-muted-foreground mt-2">{form.description}</p>}
          <div className="flex flex-wrap gap-3 mt-4 text-sm text-muted-foreground">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {form.formType === 'Quiz' ? 'اختبار' : 'استبيان'}
            </span>
            {form.timerMinutes && <span>⏱ {form.timerMinutes} دقيقة</span>}
          </div>
        </div>

        <form className="flex flex-wrap gap-4">
          {sorted.map((question) => (
            <div
              key={question.id}
              className="glass-card rounded-xl p-5"
              style={{ width: `${Math.round(((question.columnSpan || 12) / 12) * 100)}%` }}
            >
              <QuestionRenderer question={question} register={register} errors={errors} readOnly />
            </div>
          ))}
        </form>
      </div>
    </DashboardLayout>
  );
}