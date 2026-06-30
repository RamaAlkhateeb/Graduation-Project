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
      <label className="block font-medium text-foreground" style={labelStyle}>
        {question.text}
        {question.isRequired && <span className="text-destructive mr-1">*</span>}
      </label>
      {question.description && (
        <p className="text-sm text-muted-foreground">{question.description}</p>
      )}

      {question.questionType === 'ShortText' && (
        <input
          type="text"
          {...register(fieldName, { required: question.isRequired ? 'هذا الحقل مطلوب' : false })}
          readOnly={readOnly}
          placeholder="إجابة قصيرة"
          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring outline-none disabled:bg-muted"
        />
      )}

      {question.questionType === 'LongText' && (
        <textarea
          {...register(fieldName, { required: question.isRequired ? 'هذا الحقل مطلوب' : false })}
          readOnly={readOnly}
          rows={4}
          placeholder="إجابة مطوّلة"
          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring outline-none resize-none disabled:bg-muted"
        />
      )}

      {question.questionType === 'MultipleChoice' && (
        <div className="space-y-2">
          {question.options.map(opt => (
            <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                value={opt.id}
                {...register(fieldName, { required: question.isRequired ? 'الرجاء اختيار خيار' : false })}
                disabled={readOnly}
                className="w-4 h-4 text-primary"
              />
              <span className="text-foreground/90 group-hover:text-foreground">{opt.text}</span>
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
                className="w-4 h-4 text-primary rounded"
              />
              <span className="text-foreground/90 group-hover:text-foreground">{opt.text}</span>
            </label>
          ))}
        </div>
      )}

      {question.questionType === 'Dropdown' && (
        <select
          {...register(fieldName, { required: question.isRequired ? 'الرجاء اختيار خيار' : false })}
          disabled={readOnly}
          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring outline-none disabled:bg-muted"
        >
          <option value="">اختر خيارًا...</option>
          {question.options.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.text}</option>
          ))}
        </select>
      )}

      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
};

export default QuestionRenderer;