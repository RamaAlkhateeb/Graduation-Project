import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formApi } from '../api/formApi';
import type { FormDto } from '../types/form';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Eye, BarChart3, Pencil, Trash2, Search, ClipboardList } from 'lucide-react';

export default function FormListPage() {
  const [forms, setForms] = useState<FormDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await formApi.list();
      setForms(result.items || []);
    } catch {
      setError('فشل تحميل الاستبيانات. تأكد من تشغيل الخادم.');
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الاستبيان؟')) return;
    setDeletingId(id);
    try {
      await formApi.delete(id);
      setForms(forms.filter((f) => f.id !== id));
    } catch {
      alert('فشل حذف الاستبيان');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = forms.filter(
    (f) =>
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      (f.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      title="الاستبيانات"
      subtitle={!loading && !error ? `${forms.length} ${forms.length === 1 ? 'استبيان' : 'استبيانات'} إجمالاً` : undefined}
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الاستبيانات..."
            className="w-full h-10 rounded-md border border-input bg-background pr-10 pl-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <Button asChild className="gap-2">
          <Link to="/forms/new">
            <Plus className="h-4 w-4" />
            إنشاء استبيان
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
              <div className="flex gap-2 mb-4">
                <div className="h-5 bg-muted rounded-full w-14" />
                <div className="h-5 bg-muted/70 rounded-full w-16" />
              </div>
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted/70 rounded w-1/2 mb-6" />
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-8 bg-muted rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-card rounded-xl border-destructive/30 p-10 text-center">
          <p className="text-destructive font-semibold mb-1">خطأ في الاتصال</p>
          <p className="text-destructive/80 text-sm mb-5">{error}</p>
          <Button variant="outline" onClick={loadForms}>
            حاول مرة أخرى
          </Button>
        </div>
      ) : forms.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center glass-card rounded-xl">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
            <ClipboardList className="h-9 w-9 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">لا توجد استبيانات بعد</h2>
          <p className="text-muted-foreground mt-2 mb-7 text-sm max-w-xs">
            أنشئ أول استبيان أو اختبار لبدء جمع الردود من الطلاب والأساتذة.
          </p>
          <Button asChild className="gap-2">
            <Link to="/forms/new">إنشاء أول استبيان</Link>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground">لا توجد نتائج لـ "{search}"</h2>
          <button onClick={() => setSearch('')} className="mt-2 text-sm text-primary hover:underline">
            مسح البحث
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((form) => (
            <div
              key={form.id}
              className="glass-card rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden"
            >
              <div
                className="h-1.5 flex-shrink-0"
                style={{ backgroundColor: form.formType === 'Quiz' ? 'hsl(var(--accent))' : 'hsl(var(--primary))' }}
              />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={form.formType === 'Quiz' ? 'secondary' : 'default'} className="gap-1">
                    {form.formType === 'Quiz' ? '🏆 اختبار' : '📋 استبيان'}
                  </Badge>
                  <Badge variant={form.isActive ? 'default' : 'outline'} className="gap-1">
                    <span className="text-[8px]">{form.isActive ? '●' : '○'}</span>
                    {form.isActive ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 mb-1">{form.title}</h3>
                {form.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{form.description}</p>
                )}

                <div className="flex items-center gap-3 mt-auto pt-3 mb-4 border-t border-border/50 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {form.questions?.length || 0} سؤال
                  </span>
                  <span>
                    {form.audience === 'Students' ? 'الطلاب' : form.audience === 'Teachers' ? 'الأساتذة' : 'الجميع'}
                  </span>
                  {form.timerMinutes && <span>⏱ {form.timerMinutes} د</span>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link to={`/forms/${form.id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" />
                      تعديل
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link to={`/forms/${form.id}/preview`}>
                      <Eye className="h-3.5 w-3.5" />
                      معاينة
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="sm" className="gap-1.5">
                    <Link to={`/forms/${form.id}/responses`}>
                      <BarChart3 className="h-3.5 w-3.5" />
                      الردود
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1.5"
                    disabled={deletingId === form.id}
                    onClick={() => handleDelete(form.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === form.id ? '…' : 'حذف'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}