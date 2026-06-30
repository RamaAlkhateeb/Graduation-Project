import type { FC, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useT } from '../i18n';

interface AppHeaderProps {
  children?: ReactNode;
}

const AppHeader: FC<AppHeaderProps> = ({ children }) => {
  const navigate = useNavigate();
  const logout = useAuthStore(s => s.logout);
  const { theme, toggleTheme, lang, toggleLang } = useSettingsStore();
  const t = useT();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-30 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm select-none">
            A
          </div>
          <div className="hidden sm:block">
            <div className="text-base font-bold text-gray-900 dark:text-white leading-tight">{t.appName}</div>
            <div className="text-xs text-gray-400 dark:text-slate-400 leading-tight">{t.appSubtitle}</div>
          </div>
        </Link>

        {/* Middle slot (page-specific content like nav links) */}
        <div className="flex-1">{children}</div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            title="Toggle language / تبديل اللغة"
          >
            {lang === 'en' ? 'عر' : 'EN'}
          </button>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            {t.logout}
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
