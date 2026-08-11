import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const CURSOR_COLORS = [
  { id: 'green', label: 'Green', value: 'hsl(152 70% 42%)' },
  { id: 'blue', label: 'Blue', value: 'hsl(210 90% 55%)' },
  { id: 'violet', label: 'Violet', value: 'hsl(262 80% 60%)' },
  { id: 'rose', label: 'Rose', value: 'hsl(350 85% 55%)' },
  { id: 'amber', label: 'Amber', value: 'hsl(38 95% 50%)' },
  { id: 'ink', label: 'Ink', value: 'hsl(215 25% 25%)' },
] as const;

export type CursorColor = (typeof CURSOR_COLORS)[number]['id'];

export const CURSOR_SHAPES = [
  { id: 'ring', label: 'حلقة' },
  { id: 'dot', label: 'نقطة فقط' },
  { id: 'square', label: 'مربع' },
  { id: 'crosshair', label: 'تقاطع' },
  { id: 'arrow', label: 'سهم مع حلقة' },
  { id: 'arrowOnly', label: 'سهم فقط' },
] as const;

export type CursorShape = (typeof CURSOR_SHAPES)[number]['id'];

interface CursorState {
  enabled: boolean;
  color: CursorColor;
  shape: CursorShape;
  setEnabled: (enabled: boolean) => void;
  setColor: (color: CursorColor) => void;
  setShape: (shape: CursorShape) => void;
}

// Reflect the persisted settings onto <html> so the CSS in index.css can react.
export const syncCursorAttrs = () => {
  if (typeof document === 'undefined') return;
  const { enabled, color } = useCursorStore.getState();
  document.documentElement.dataset.cursorEnabled = String(enabled);
  document.documentElement.dataset.cursorColor = color;
};

export const useCursorStore = create<CursorState>()(
  persist(
    (set) => ({
      enabled: true,
      color: 'green',
      shape: 'ring',
      setEnabled: (enabled) => {
        set({ enabled });
        syncCursorAttrs();
      },
      setColor: (color) => {
        set({ color });
        syncCursorAttrs();
      },
      setShape: (shape) => set({ shape }),
    }),
    { name: 'alashmar-cursor' }
  )
);
