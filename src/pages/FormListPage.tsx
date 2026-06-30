import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formApi } from '../api/formApi';
import type { FormDto } from '../types/form';
import MainLayout from '../components/MainLayout';
import { useT } from '../i18n';

export default function FormListPage() {
  const [forms, setForms] = useState<FormDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const t = useT();

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
      setError(t.loadError);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    setDeletingId(id);
    try {
      await formApi.delete(id);
      setForms(forms.filter(f => f.id !== id));
    } catch {
      alert(t.deleteError);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = forms.filter(f =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout
      headerContent={
        <div className="flex justify-end w-full">
          <Link
            to="/forms/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
          >
            {t.newForm}
          </Link>
        </div>
      }
    >

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page title + search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.myForms}</h2>
            {!loading && !error && (
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                {t.formsTotal(forms.length)}
              </p>
            )}
          </div>
          {forms.length > 0 && (
            <div className="relative">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.searchForms}
                className="ps-9 pe-4 py-2 border border-gray-300 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white dark:placeholder-slate-400 w-56 transition-all"
              />
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 animate-pulse">
                <div className="flex gap-2 mb-4">
                  <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded-full w-14" />
                  <div className="h-5 bg-gray-100 dark:bg-slate-600 rounded-full w-16" />
                </div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 dark:bg-slate-600 rounded w-1/2 mb-6" />
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-8 bg-gray-100 dark:bg-slate-700 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-red-700 dark:text-red-400 font-semibold mb-1">{t.connectionError}</p>
            <p className="text-red-500 dark:text-red-400 text-sm mb-5">{error}</p>
            <button
              onClick={loadForms}
              className="px-5 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              {t.tryAgain}
            </button>
          </div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-4xl mb-5 shadow-inner">
              📝
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t.noFormsYet}</h2>
            <p className="text-gray-500 dark:text-slate-400 mt-2 mb-7 text-sm max-w-xs">{t.noFormsDesc}</p>
            <Link
              to="/forms/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
            >
              {t.createFirstForm}
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-300">{t.noResults(search)}</h2>
            <button onClick={() => setSearch('')} className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
              {t.clearSearch}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(form => (
              <div
                key={form.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Colored accent bar */}
                <div
                  className="h-1.5 flex-shrink-0"
                  style={{ backgroundColor: form.primaryColor || (form.formType === 'Quiz' ? '#8b5cf6' : '#3b82f6') }}
                />
                <div className="p-5 flex flex-col flex-1">
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      form.formType === 'Quiz' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    }`}>
                      {form.formType === 'Quiz' ? '🏆' : '📋'} {form.formType === 'Quiz' ? t.quiz : t.form}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      form.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                    }`}>
                      <span className="text-[8px]">{form.isActive ? '●' : '○'}</span>
                      {form.isActive ? t.active : t.inactive}
                    </span>
                  </div>

                  {/* Title & description */}
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 mb-1">
                    {form.title}
                  </h3>
                  {form.description && (
                    <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-2">{form.description}</p>
                  )}

                  {/* Meta info */}
                  <div className="flex items-center gap-3 mt-auto pt-3 mb-4 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-400 dark:text-slate-500">
                    <span>📝 {form.questions?.length || 0}</span>
                    <span>👥 {form.audience}</span>
                    {form.timerMinutes && <span>⏱ {form.timerMinutes}m</span>}
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={`/forms/${form.id}/edit`}
                      className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      {t.edit}
                    </Link>
                    <Link
                      to={`/forms/${form.id}/preview`}
                      className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      {t.preview}
                    </Link>
                    <Link
                      to={`/forms/${form.id}/responses`}
                      className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                    >
                      {t.responses}
                    </Link>
                    <button
                      onClick={() => handleDelete(form.id)}
                      disabled={deletingId === form.id}
                      className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                    >
                      {deletingId === form.id ? '…' : t.delete}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

