import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formApi, questionApi, optionApi } from '../api/formApi';
import type {
  FormQuestionDto,
  FormQuestionOptionDto,
  QuestionType,
  FormType,
  AudienceType,
} from '../types/form';
import QuestionEditor from '../components/QuestionEditor';
import { FONT_FAMILIES_GROUPED } from '../config';
import AppHeader from '../components/AppHeader';
import { useT } from '../i18n';

function SortableQuestion({
  question,
  isQuiz,
  onChange,
  onDelete,
}: {
  question: FormQuestionDto;
  isQuiz: boolean;
  onChange: (q: FormQuestionDto) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    width: `${Math.round((question.columnSpan || 12) / 12 * 100)}%`,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-4 p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          ⠿
        </button>
        <div className="flex-1">
          <QuestionEditor
            question={question}
            isQuiz={isQuiz}
            onChange={onChange}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
}

export default function FormBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const t = useT();

  const [loading, setLoading] = useState(true);
  const [autoSaving, setAutoSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('Untitled Form');
  const [description, setDescription] = useState('');
  const [formType, setFormType] = useState<FormType>('Normal');
  const [audience, setAudience] = useState<AudienceType>('Students');
  const [isActive, setIsActive] = useState(true);
  const [allowMultipleResponses, setAllowMultipleResponses] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number | undefined>(undefined);
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [backgroundColor, setBackgroundColor] = useState('#f9fafb');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [questions, setQuestions] = useState<FormQuestionDto[]>([]);
  const [showStylePanel, setShowStylePanel] = useState(false);

  // Refs for debounced auto-save
  const formSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const optionSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Latest form data ref to avoid stale closures in debounced save
  const latestFormData = useRef({
    title: 'Untitled Form',
    description: '',
    formType: 'Normal' as FormType,
    audience: 'Students' as AudienceType,
    isActive: true,
    allowMultipleResponses: false,
    timerMinutes: undefined as number | undefined,
    primaryColor: '#3b82f6',
    backgroundColor: '#f9fafb',
    fontFamily: 'Inter',
  });

  // Mirror questions to a ref for use in callbacks that must not re-create on every render
  const questionsRef = useRef<FormQuestionDto[]>([]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (formSaveTimerRef.current) clearTimeout(formSaveTimerRef.current);
      questionSaveTimers.current.forEach(t => clearTimeout(t));
      optionSaveTimers.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // For new forms: auto-create via API on mount, then navigate to edit URL
  useEffect(() => {
    if (!isEdit) {
      formApi.create({
        title: 'Untitled Form',
        description: null,
        formType: 'Normal',
        audience: 'Students',
        timerMinutes: null,
        isActive: true,
        allowMultipleResponses: false,
        startsAt: null,
        endsAt: null,
        createdByManagerId: null,
        createdByTeacherId: null,
        halaqaId: null,
        courseId: null,
        primaryColor: null,
        backgroundColor: null,
        fontFamily: null,
      }).then(created => {
        navigate(`/forms/${created.id}/edit`, { replace: true });
      }).catch(() => {
        setError('Failed to create form. Please try again.');
        setLoading(false);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // For edit forms: load existing form data
  useEffect(() => {
    if (isEdit && id) {
      formApi.get(id)
        .then(form => {
          setTitle(form.title);
          setDescription(form.description || '');
          setFormType(form.formType);
          setAudience(form.audience);
          setIsActive(form.isActive);
          setAllowMultipleResponses(form.allowMultipleResponses);
          setTimerMinutes(form.timerMinutes);
          setPrimaryColor(form.primaryColor || '#3b82f6');
          setBackgroundColor(form.backgroundColor || '#f9fafb');
          setFontFamily(form.fontFamily || 'Inter');
          const sorted = [...(form.questions || [])].sort((a, b) => a.order - b.order);
          setQuestions(sorted);
          latestFormData.current = {
            title: form.title,
            description: form.description || '',
            formType: form.formType,
            audience: form.audience,
            isActive: form.isActive,
            allowMultipleResponses: form.allowMultipleResponses,
            timerMinutes: form.timerMinutes,
            primaryColor: form.primaryColor || '#3b82f6',
            backgroundColor: form.backgroundColor || '#f9fafb',
            fontFamily: form.fontFamily || 'Inter',
          };
        })
        .catch(() => setError('Failed to load form'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  // Schedule a debounced form auto-save (1 second after last change)
  const scheduleFormSave = useCallback(() => {
    if (!id) return;
    if (formSaveTimerRef.current) clearTimeout(formSaveTimerRef.current);
    setAutoSaving(true);
    formSaveTimerRef.current = setTimeout(async () => {
      const data = latestFormData.current;
      try {
        await formApi.update(id, {
          title: data.title.trim() || 'Untitled Form',
          description: data.description.trim() || null,
          formType: data.formType,
          audience: data.audience,
          isActive: data.isActive,
          allowMultipleResponses: data.allowMultipleResponses,
          timerMinutes: data.timerMinutes ?? null,
          primaryColor: data.primaryColor,
          backgroundColor: data.backgroundColor,
          fontFamily: data.fontFamily,
        });
      } catch {
        // Silent auto-save failure
      } finally {
        setAutoSaving(false);
      }
    }, 1000);
  }, [id]);

  // Schedule a debounced question auto-save (1 second after last change)
  const scheduleQuestionSave = (question: FormQuestionDto) => {
    if (question.id.startsWith('temp-')) return;
    const key = question.id;
    if (questionSaveTimers.current.has(key)) clearTimeout(questionSaveTimers.current.get(key)!);
    questionSaveTimers.current.set(key, setTimeout(async () => {
      try {
        await questionApi.update(question.id, {
          text: question.text || 'Question',
          description: question.description,
          questionType: question.questionType,
          order: question.order,
          isRequired: question.isRequired,
          points: question.points,
          columnSpan: question.columnSpan,
          labelColor: question.labelColor,
          fontSize: question.fontSize,
          fontFamily: question.fontFamily,
        });
      } catch {
        // Silent auto-save failure
      }
      questionSaveTimers.current.delete(key);
    }, 1000));
  };

  // Schedule a debounced option auto-save (1 second after last change)
  const scheduleOptionSave = (option: FormQuestionOptionDto) => {
    if (option.id.startsWith('temp-')) return;
    const key = option.id;
    if (optionSaveTimers.current.has(key)) clearTimeout(optionSaveTimers.current.get(key)!);
    optionSaveTimers.current.set(key, setTimeout(async () => {
      try {
        await optionApi.update(option.id, {
          text: option.text,
          order: option.order,
          isCorrect: option.isCorrect,
        });
      } catch {
        // Silent auto-save failure
      }
      optionSaveTimers.current.delete(key);
    }, 1000));
  };

  // Form field change handlers — update state + ref + schedule save
  const handleTitleChange = (val: string) => {
    setTitle(val);
    latestFormData.current = { ...latestFormData.current, title: val };
    scheduleFormSave();
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    latestFormData.current = { ...latestFormData.current, description: val };
    scheduleFormSave();
  };

  const handleFormTypeChange = (val: FormType) => {
    setFormType(val);
    latestFormData.current = { ...latestFormData.current, formType: val };
    scheduleFormSave();
  };

  const handleAudienceChange = (val: AudienceType) => {
    setAudience(val);
    latestFormData.current = { ...latestFormData.current, audience: val };
    scheduleFormSave();
  };

  const handleIsActiveToggle = () => {
    const val = !latestFormData.current.isActive;
    setIsActive(val);
    latestFormData.current = { ...latestFormData.current, isActive: val };
    scheduleFormSave();
  };

  const handleAllowMultipleToggle = () => {
    const val = !latestFormData.current.allowMultipleResponses;
    setAllowMultipleResponses(val);
    latestFormData.current = { ...latestFormData.current, allowMultipleResponses: val };
    scheduleFormSave();
  };

  const handleTimerChange = (val: number | undefined) => {
    setTimerMinutes(val);
    latestFormData.current = { ...latestFormData.current, timerMinutes: val };
    scheduleFormSave();
  };

  const handlePrimaryColorChange = (val: string) => {
    setPrimaryColor(val);
    latestFormData.current = { ...latestFormData.current, primaryColor: val };
    scheduleFormSave();
  };

  const handleBackgroundColorChange = (val: string) => {
    setBackgroundColor(val);
    latestFormData.current = { ...latestFormData.current, backgroundColor: val };
    scheduleFormSave();
  };

  const handleFontFamilyChange = (val: string) => {
    setFontFamily(val);
    latestFormData.current = { ...latestFormData.current, fontFamily: val };
    scheduleFormSave();
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const qs = questionsRef.current;
    const oldIdx = qs.findIndex(q => q.id === active.id);
    const newIdx = qs.findIndex(q => q.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const reordered = arrayMove(qs, oldIdx, newIdx).map((q, i) => ({ ...q, order: i }));
    setQuestions(reordered);

    // Schedule API saves for all reordered questions
    reordered.forEach(q => { scheduleQuestionSave(q); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Add a new question: immediately create it via API
  const addQuestion = async (type: QuestionType = 'ShortText') => {
    if (!id) return;
    try {
      const created = await questionApi.create({
        formId: id,
        text: '',
        questionType: type,
        order: questionsRef.current.length,
        isRequired: false,
        columnSpan: 12,
        options: [],
      });
      setQuestions(qs => [...qs, created]);
      // Keep form-level auto-save behavior consistent with typing edits.
      scheduleFormSave();
    } catch {
      setError('Failed to add question. Please try again.');
    }
  };

  // Update a question locally and sync changes to the API
  const updateQuestion = (idx: number, updated: FormQuestionDto) => {
    const old = questionsRef.current[idx];
    if (!old) return;

    setQuestions(qs => qs.map((q, i) => i === idx ? updated : q));

    // Skip API sync for questions not yet persisted
    if (updated.id.startsWith('temp-')) return;

    // Detect option changes
    const oldOptionMap = new Map(old.options.map(o => [o.id, o]));
    const newOptionIds = new Set(updated.options.map(o => o.id));

    // New options (temp- ID) → create via API immediately
    updated.options.forEach(option => {
      if (option.id.startsWith('temp-')) {
        optionApi.create({
          questionId: updated.id,
          text: option.text || `Option ${option.order + 1}`,
          order: option.order,
          isCorrect: option.isCorrect,
        }).then(created => {
          setQuestions(prev => prev.map(q =>
            q.id === updated.id
              ? { ...q, options: q.options.map(o => o.id === option.id ? created : o) }
              : q
          ));
        }).catch(() => {});
      } else if (oldOptionMap.has(option.id)) {
        // Existing option that was changed → debounced update
        const oldOpt = oldOptionMap.get(option.id)!;
        if (
          oldOpt.text !== option.text ||
          oldOpt.isCorrect !== option.isCorrect ||
          oldOpt.order !== option.order
        ) {
          scheduleOptionSave(option);
        }
      }
    });

    // Removed options → delete via API immediately
    old.options.forEach(oldOpt => {
      if (!newOptionIds.has(oldOpt.id) && !oldOpt.id.startsWith('temp-')) {
        optionApi.delete(oldOpt.id).catch(() => {});
      }
    });

    // Schedule debounced question save for text/property changes
    scheduleQuestionSave(updated);
  };

  // Delete a question: remove from API then from state
  const deleteQuestion = async (idx: number) => {
    const q = questionsRef.current[idx];
    if (!q) return;

    if (!q.id.startsWith('temp-')) {
      try {
        await questionApi.delete(q.id);
      } catch {
        setError('Failed to delete question. Please try again.');
        return;
      }
    }
    setQuestions(qs => qs.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i })));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-slate-900 transition-colors duration-300" style={{ backgroundColor, fontFamily }}>
      {/* Top bar */}
      <AppHeader>
        <div className="flex items-center gap-3 ms-2">
          <Link to="/" className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white text-sm">{t.back}</Link>
          <span className="text-gray-300 dark:text-slate-600">|</span>
          <input
            type="text"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Form title"
            className="text-base font-semibold text-gray-900 dark:text-white border-none outline-none bg-transparent w-48 sm:w-64"
          />
        </div>
      </AppHeader>

      {/* Auto-save status bar */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-end gap-3">
          {error && <span className="text-sm text-red-500">{error}</span>}
          {autoSaving && (
            <span className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              {t.saving}
            </span>
          )}
          {!autoSaving && !error && isEdit && (
            <span className="text-xs text-green-600 dark:text-green-400">✓ {t.save}d</span>
          )}
          {isEdit && (
            <Link
              to={`/forms/${id}/preview`}
              className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              {t.preview}
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Form header card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border-t-8 shadow-sm p-6 space-y-4" style={{ borderTopColor: primaryColor }}>
          <textarea
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Form Title"
            rows={1}
            className="w-full text-3xl font-bold text-gray-900 dark:text-white border-none outline-none resize-none bg-transparent"
          />
          <textarea
            value={description}
            onChange={e => handleDescriptionChange(e.target.value)}
            placeholder="Form description (optional)"
            rows={2}
            className="w-full text-base text-gray-500 dark:text-slate-400 border-none outline-none resize-none bg-transparent"
          />

          {/* Form settings */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Form Type</label>
              <select
                value={formType}
                onChange={e => handleFormTypeChange(e.target.value as FormType)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Normal">Normal</option>
                <option value="Quiz">Quiz</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Audience</label>
              <select
                value={audience}
                onChange={e => handleAudienceChange(e.target.value as AudienceType)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Students">Students</option>
                <option value="Teachers">Teachers</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Timer (minutes)</label>
              <input
                type="number"
                value={timerMinutes || ''}
                onChange={e => handleTimerChange(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="No timer"
                min={1}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={handleIsActiveToggle}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${isActive ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700 dark:text-slate-300">Active</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={handleAllowMultipleToggle}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${allowMultipleResponses ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allowMultipleResponses ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700 dark:text-slate-300">Allow Multiple Responses</span>
              </label>
            </div>
          </div>

          {/* Style panel toggle */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
            <button
              onClick={() => setShowStylePanel(s => !s)}
              className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white flex items-center gap-2"
            >
              🎨 {showStylePanel ? 'Hide' : 'Show'} Form Style Settings
            </button>
            {showStylePanel && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-2">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={e => handlePrimaryColorChange(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-slate-600"
                    />
                    <span className="text-sm text-gray-600 dark:text-slate-300">{primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-2">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={e => handleBackgroundColorChange(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-slate-600"
                    />
                    <span className="text-sm text-gray-600 dark:text-slate-300">{backgroundColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-2">Font Family</label>
                  <select
                    value={fontFamily}
                    onChange={e => handleFontFamilyChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none"
                    style={{ fontFamily }}
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
            )}
          </div>
        </div>

        {/* Questions */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-wrap gap-4">
              {questions.map((question, idx) => (
                <SortableQuestion
                  key={question.id}
                  question={question}
                  isQuiz={formType === 'Quiz'}
                  onChange={updated => updateQuestion(idx, updated)}
                  onDelete={() => deleteQuestion(idx)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add question */}
        <div className="flex flex-wrap gap-2 justify-center py-4">
          {(['ShortText', 'LongText', 'MultipleChoice', 'Checkbox', 'Dropdown'] as QuestionType[]).map(type => (
            <button
              key={type}
              onClick={() => addQuestion(type)}
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm"
            >
              + {type === 'ShortText' ? 'Short Answer' : type === 'LongText' ? 'Long Answer' : type === 'MultipleChoice' ? 'Multiple Choice' : type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

