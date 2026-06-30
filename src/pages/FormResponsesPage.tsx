import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formApi, responseApi } from '../api/formApi';
import type { FormDto, FormResponseDto } from '../types/form';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Copy, Check } from 'lucide-react';

export default function FormResponsesPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormDto | null>(null);
  const [responses, setResponses] = useState<FormResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      Promise.all([formApi.get(id), responseApi.list(id)])
        .then(([f, r]) => {
          setForm(f);
          setResponses(r);
        })
        .catch(() => setError('فشل تحميل الردود'))
        .finally(() => setLoading(false));
    }
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

  return (
    <DashboardLayout title={form?.title || 'الردود'} subtitle="تحليلات الردود">
      <div className="flex items-center justify-between mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/form">
            <ChevronRight className="h-4 w-4" />
            رجوع
          </Link>
        </Button>

        {form?.accessToken && (
          <Button variant={copied ? 'default' : 'outline'} size="sm" className="gap-1.5" onClick={copyLink}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'تم النسخ!' : 'نسخ رابط المشاركة'}
          </Button>
        )}
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
                        {(response.answers || []).map((answer) => (
                          <div key={answer.id} className="bg-muted/40 rounded-xl p-4">
                            <div className="text-sm font-semibold text-foreground mb-2">{answer.questionText}</div>
                            {answer.textAnswer && (
                              <div className="text-sm text-foreground/80 bg-background rounded-lg px-3 py-2 border border-border">
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
                          </div>
                        ))}
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