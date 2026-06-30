import type { FC } from 'react';
import { useState } from 'react';
import type { FormQuestionDto, QuestionType } from '../types/form';
import StylePanel from './StylePanel';

interface QuestionEditorProps {
  question: FormQuestionDto;
  isQuiz: boolean;
  onChange: (updated: FormQuestionDto) => void;
  onDelete: () => void;
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'ShortText', label: 'Short Answer' },
  { value: 'LongText', label: 'Long Answer' },
  { value: 'MultipleChoice', label: 'Multiple Choice' },
  { value: 'Checkbox', label: 'Checkboxes' },
  { value: 'Dropdown', label: 'Dropdown' },
];

const COLUMN_SPAN_OPTIONS = [
  { value: 3, label: '25% (1/4)' },
  { value: 4, label: '33% (1/3)' },
  { value: 6, label: '50% (1/2)' },
  { value: 9, label: '75% (3/4)' },
  { value: 12, label: '100% (Full)' },
];

const QuestionEditor: FC<QuestionEditorProps> = ({ question, isQuiz, onChange, onDelete }) => {
  const [showStyle, setShowStyle] = useState(false);

  const update = (patch: Partial<FormQuestionDto>) => onChange({ ...question, ...patch });

  const addOption = () => {
    const newOption = {
      id: `temp-${Date.now()}`,
      questionId: question.id,
      text: `Option ${question.options.length + 1}`,
      order: question.options.length,
      isCorrect: false,
    };
    update({ options: [...question.options, newOption] });
  };

  const updateOption = (idx: number, patch: Partial<typeof question.options[0]>) => {
    const updated = question.options.map((o, i) => i === idx ? { ...o, ...patch } : o);
    update({ options: updated });
  };

  const removeOption = (idx: number) => {
    update({ options: question.options.filter((_, i) => i !== idx) });
  };

  const needsOptions = ['MultipleChoice', 'Checkbox', 'Dropdown'].includes(question.questionType);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={question.text}
              onChange={e => update({ text: e.target.value })}
              placeholder="Question text"
              className="w-full px-3 py-2 text-base font-medium border-b-2 border-gray-200 focus:border-blue-500 outline-none bg-transparent transition-colors"
              style={{ color: question.labelColor, fontSize: question.fontSize, fontFamily: question.fontFamily }}
            />
            <input
              type="text"
              value={question.description || ''}
              onChange={e => update({ description: e.target.value })}
              placeholder="Description (optional)"
              className="w-full px-3 py-1 text-sm text-gray-500 border-b border-gray-100 focus:border-gray-300 outline-none bg-transparent transition-colors"
            />
          </div>
          <select
            value={question.questionType}
            onChange={e => update({ questionType: e.target.value as QuestionType, options: [] })}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {QUESTION_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Options */}
        {needsOptions && (
          <div className="space-y-2 ml-4">
            {question.options.map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-2">
                {question.questionType === 'MultipleChoice' && (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-400 flex-shrink-0" />
                )}
                {question.questionType === 'Checkbox' && (
                  <div className="w-4 h-4 rounded border-2 border-gray-400 flex-shrink-0" />
                )}
                {question.questionType === 'Dropdown' && (
                  <span className="text-gray-400 text-sm flex-shrink-0">{idx + 1}.</span>
                )}
                <input
                  type="text"
                  value={opt.text}
                  onChange={e => updateOption(idx, { text: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border-b border-gray-200 focus:border-blue-400 outline-none"
                  placeholder={`Option ${idx + 1}`}
                />
                {isQuiz && (
                  <label className="flex items-center gap-1 text-xs text-green-600">
                    <input
                      type="checkbox"
                      checked={opt.isCorrect}
                      onChange={e => updateOption(idx, { isCorrect: e.target.checked })}
                      className="rounded"
                    />
                    Correct
                  </label>
                )}
                <button
                  onClick={() => removeOption(idx)}
                  className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
                >×</button>
              </div>
            ))}
            <button
              onClick={addOption}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <span>+</span> Add option
            </button>
          </div>
        )}

        {/* Column span */}
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-500">Width:</label>
          <select
            value={question.columnSpan}
            onChange={e => update({ columnSpan: parseInt(e.target.value) })}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
          >
            {COLUMN_SPAN_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Style panel toggle */}
        <button
          onClick={() => setShowStyle(s => !s)}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          🎨 {showStyle ? 'Hide' : 'Show'} Style Options
        </button>
        {showStyle && (
          <StylePanel
            labelColor={question.labelColor}
            fontSize={question.fontSize}
            fontFamily={question.fontFamily}
            onChange={patch => update(patch)}
          />
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={question.isRequired}
                onChange={e => update({ isRequired: e.target.checked })}
                className="rounded"
              />
              Required
            </label>
            {isQuiz && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Points:</label>
                <input
                  type="number"
                  value={question.points || 0}
                  min={0}
                  onChange={e => update({ points: parseInt(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            )}
          </div>
          <button
            onClick={onDelete}
            className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            🗑 Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;
