import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Lang = 'en' | 'ar';

interface SettingsState {
  theme: Theme;
  lang: Lang;
  setTheme: (theme: Theme) => void;
  setLang: (lang: Lang) => void;
  toggleTheme: () => void;
  toggleLang: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      lang: 'en',
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      toggleLang: () => set({ lang: get().lang === 'en' ? 'ar' : 'en' }),
    }),
    { name: 'alashmar-settings' }
  )
);
