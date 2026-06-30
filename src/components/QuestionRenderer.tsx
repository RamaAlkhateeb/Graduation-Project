import type { FC } from 'react';
import type { UseFormRegister, FieldValues, FieldErrors } from 'react-hook-form';
import type { FormQuestionDto } from '../types/form';

interface QuestionRendererProps {
  question: FormQuestionDto;
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors<FieldValues>;
  readOnly?: boolean;
}

const colSpanStyle = (span: number): React.CSSProperties => {
  const pct = Math.round((span / 12) * 100);
  return { width: `${pct}%` };
};

const QuestionRenderer: FC<QuestionRendererProps> = ({ question, register, errors, readOnly }) => {
  const labelStyle: React.CSSProperties = {
    color: question.labelColor || undefined,
    fontSize: question.fontSize ? `${question.fontSize}px` : undefined,
    fontFamily: question.fontFamily || undefined,
  };

  const fieldName = `q_${question.id}`;
  const error = errors[fieldName];

  return (
    <div style={colSpanStyle(question.columnSpan || 12)} className="space-y-2">
      <label className="block font-medium text-gray-700" style={labelStyle}>
        {question.text}
        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      {question.description && (
        <p className="text-sm text-gray-500">{question.description}</p>
      )}

      {question.questionType === 'ShortText' && (
        <input
          type="text"
          {...register(fieldName, { required: question.isRequired ? 'This field is required' : false })}
          readOnly={readOnly}
          placeholder="Short answer"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
        />
      )}

      {question.questionType === 'LongText' && (
        <textarea
          {...register(fieldName, { required: question.isRequired ? 'This field is required' : false })}
          readOnly={readOnly}
          rows={4}
          placeholder="Long answer"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none disabled:bg-gray-50"
        />
      )}

      {question.questionType === 'MultipleChoice' && (
        <div className="space-y-2">
          {question.options.map(opt => (
            <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                value={opt.id}
                {...register(fieldName, { required: question.isRequired ? 'Please select an option' : false })}
                disabled={readOnly}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 group-hover:text-gray-900">{opt.text}</span>
            </label>
          ))}
        </div>
      )}

      {question.questionType === 'Checkbox' && (
        <div className="space-y-2">
          {question.options.map(opt => (
            <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                value={opt.id}
                {...register(`${fieldName}_${opt.id}`)}
                disabled={readOnly}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-gray-700 group-hover:text-gray-900">{opt.text}</span>
            </label>
          ))}
        </div>
      )}

      {question.questionType === 'Dropdown' && (
        <select
          {...register(fieldName, { required: question.isRequired ? 'Please select an option' : false })}
          disabled={readOnly}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white disabled:bg-gray-50"
        >
          <option value="">Select an option...</option>
          {question.options.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.text}</option>
          ))}
        </select>
      )}

      {error && (
        <p className="text-sm text-red-500">{error.message as string}</p>
      )}
    </div>
  );
};

export default QuestionRenderer;
