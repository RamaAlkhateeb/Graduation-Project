import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formApi, responseApi } from '../api/formApi';
import type { FormDto, FormResponseDto } from '../types/form';
import AppHeader from '../components/AppHeader';
import { useT } from '../i18n';

export default function FormResponsesPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormDto | null>(null);
  const [responses, setResponses] = useState<FormResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const t = useT();

  useEffect(() => {
    if (id) {
      Promise.all([
        formApi.get(id),
        responseApi.list(id),
      ])
        .then(([f, r]) => {
          setForm(f);
          setResponses(r);
        })
        .catch(() => setError('Failed to load responses'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const copyLink = () => {
    if (!form?.accessToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/fill/${form.accessToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const avgScore = responses.length > 0 && form?.formType === 'Quiz'
    ? Math.round(responses.reduce((sum, r) => sum + (r.score ?? 0), 0) / responses.length)
    : null;

  const avgMinutes = responses.length > 0
    ? Math.round(responses.reduce((sum, r) => sum + (r.timeSpentSeconds ?? 0), 0) / responses.length / 60)
    : null;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <AppHeader>
        <div className="flex items-center gap-4 ms-2">
          <Link to="/" className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white text-sm font-medium">{t.back}</Link>
          <span className="text-gray-200 dark:text-slate-700">|</span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{form?.title || t.responses}</div>
            <div className="text-xs text-gray-400 dark:text-slate-500">{t.responseAnalytics}</div>
          </div>
        </div>
      </AppHeader>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Share link button */}
        {form?.accessToken && (
          <div className="flex justify-end mb-4">
            <button
              onClick={copyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                copied
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
              }`}
            >
              {copied ? t.copied : t.copyShareLink}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-red-600 dark:text-red-400 mb-6">{error}</div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-blue-600">{responses.length}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium">{t.totalResponses}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-gray-700 dark:text-white">{form?.questions?.length || 0}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium">{t.questions}</div>
          </div>
          {avgScore !== null ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-green-600">{avgScore}</div>
              <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium">{t.avgScore}</div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 text-center shadow-sm opacity-40">
              <div className="text-3xl font-bold text-gray-400">—</div>
              <div className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium">{t.avgScore}</div>
            </div>
          )}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-purple-600">{avgMinutes ?? '—'}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium">{t.avgMinutes}</div>
          </div>
        </div>

        {responses.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-white">{t.noResponsesYet}</h2>
            <p className="text-gray-500 dark:text-slate-400 mt-2 mb-5 text-sm">{t.noResponsesDesc}</p>
            {form?.accessToken && (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <code className="bg-gray-100 dark:bg-slate-700 px-4 py-2 rounded-xl text-sm text-gray-700 dark:text-slate-200 font-mono">
                  /fill/{form.accessToken}
                </code>
                <button
                  onClick={copyLink}
                  className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                    copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? t.copied : t.copyShareLink}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {responses.map((response, idx) => (
              <div key={response.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => setExpandedId(expandedId === response.id ? null : response.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        {response.respondedByStudentId
                          ? `${t.student} · ${response.respondedByStudentId.substring(0, 8)}…`
                          : response.respondedByTeacherId
                          ? `${t.teacher} · ${response.respondedByTeacherId.substring(0, 8)}…`
                          : t.anonymous}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        {new Date(response.submittedAt).toLocaleDateString()} at {new Date(response.submittedAt).toLocaleTimeString()}
                        {response.timeSpentSeconds != null && ` · ${Math.round(response.timeSpentSeconds / 60)} min`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {form?.formType === 'Quiz' && response.score !== undefined && (
                      <div className="text-lg font-bold text-green-600">{response.score} pts</div>
                    )}
                    <span className="text-gray-400 text-sm">{expandedId === response.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expandedId === response.id && (
                  <div className="px-5 pb-5 border-t border-gray-100 dark:border-slate-700">
                    <div className="mt-4 space-y-3">
                      {(response.answers || []).map(answer => (
                        <div key={answer.id} className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                          <div className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">{answer.questionText}</div>
                          {answer.textAnswer && (
                            <div className="text-sm text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-lg px-3 py-2 border border-gray-200 dark:border-slate-600">{answer.textAnswer}</div>
                          )}
                          {answer.selectedOptions && answer.selectedOptions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {answer.selectedOptions.map(opt => (
                                <span key={opt.id} className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                  {opt.text}
                                </span>
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
      </div>
    </div>
  );
}

