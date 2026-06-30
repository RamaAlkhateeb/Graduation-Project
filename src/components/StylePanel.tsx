import type { FC } from 'react';
import { FONT_FAMILIES_GROUPED } from '../config';

interface StylePanelProps {
  labelColor?: string;
  fontSize?: number;
  fontFamily?: string;
  onChange: (updates: { labelColor?: string; fontSize?: number; fontFamily?: string }) => void;
}

const StylePanel: FC<StylePanelProps> = ({ labelColor, fontSize, fontFamily, onChange }) => {
  return (
    <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Style</h4>
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 w-24">Label Color</label>
        <input
          type="color"
          value={labelColor || '#374151'}
          onChange={e => onChange({ labelColor: e.target.value })}
          className="w-8 h-8 rounded cursor-pointer border border-gray-300"
        />
        <span className="text-xs text-gray-400">{labelColor || '#374151'}</span>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 w-24">Font Size</label>
        <input
          type="number"
          value={fontSize || 14}
          min={10}
          max={32}
          onChange={e => onChange({ fontSize: parseInt(e.target.value) })}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
        />
        <span className="text-xs text-gray-400">px</span>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 w-24">Font Family</label>
        <select
          value={fontFamily || 'Inter'}
          onChange={e => onChange({ fontFamily: e.target.value })}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
          style={{ fontFamily: fontFamily || 'Inter' }}
        >
          {FONT_FAMILIES_GROUPED.map(group => (
            <optgroup key={group.group} label={group.group}>
              {group.fonts.map(f => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
};

export default StylePanel;
