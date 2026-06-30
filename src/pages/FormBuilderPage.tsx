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
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ChevronRight, Eye } from 'lucide-react'; 
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
          className="mt-4 p-1 text-gray-400 hover:text-emerald-700 cursor-grab active:cursor-grabbing"
          title="سحب لإعادة الترتيب"
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

  // نصوص عربية افتراضية وألوان خضراء
  const [title, setTitle] = useState('نموذج بدون عنوان');
  const [description, setDescription] = useState('');
  const [formType, setFormType] = useState<FormType>('Normal');
  const [audience, setAudience] = useState<AudienceType>('Students');
  const [isActive, setIsActive] = useState(true);
  const [allowMultipleResponses, setAllowMultipleResponses] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number | undefined>(undefined);
  const [primaryColor, setPrimaryColor] = useState('#064e3b'); // أخضر غامق
  const [backgroundColor, setBackgroundColor] = useState('#f0fdf4'); // خلفية خضراء باهتة جداً
  const [fontFamily, setFontFamily] = useState('Inter');
  const [questions, setQuestions] = useState<FormQuestionDto[]>([]);
  const [showStylePanel, setShowStylePanel] = useState(false);

  const formSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const optionSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const latestFormData = useRef({
    title: 'نموذج بدون عنوان',
    description: '',
    formType: 'Normal' as FormType,
    audience: 'Students' as AudienceType,
    isActive: true,
    allowMultipleResponses: false,
    timerMinutes: undefined as number | undefined,
    primaryColor: '#064e3b',
    backgroundColor: '#f0fdf4',
    fontFamily: 'Inter',
  });

  const questionsRef = useRef<FormQuestionDto[]>([]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    return () => {
      if (formSaveTimerRef.current) clearTimeout(formSaveTimerRef.current);
      questionSaveTimers.current.forEach(t => clearTimeout(t));
      optionSaveTimers.current.forEach(t => clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    if (!isEdit) {
      formApi.create({
        title: 'العنوان',
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
        primaryColor: '#064e3b',
        backgroundColor: '#f0fdf4',
        fontFamily: null,
      }).then(created => {
        navigate(`/forms/${created.id}/edit`, { replace: true });
      }).catch(() => {
        setError('فشل في إنشاء النموذج. يرجى المحاولة مرة أخرى.');
        setLoading(false);
      });
    }
  }, []);

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
          setPrimaryColor(form.primaryColor || '#064e3b');
          setBackgroundColor(form.backgroundColor || '#f0fdf4');
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
            primaryColor: form.primaryColor || '#064e3b',
            backgroundColor: form.backgroundColor || '#f0fdf4',
            fontFamily: form.fontFamily || 'Inter',
          };
        })
        .catch(() => setError('فشل في تحميل النموذج'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const scheduleFormSave = useCallback(() => {
    if (!id) return;
    if (formSaveTimerRef.current) clearTimeout(formSaveTimerRef.current);
    setAutoSaving(true);
    formSaveTimerRef.current = setTimeout(async () => {
      const data = latestFormData.current;
      try {
        await formApi.update(id, {
          title: data.title.trim() || 'نموذج بدون عنوان',
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
        // Silent
      } finally {
        setAutoSaving(false);
      }
    }, 1000);
  }, [id]);

  const scheduleQuestionSave = (question: FormQuestionDto) => {
    if (question.id.startsWith('temp-')) return;
    const key = question.id;
    if (questionSaveTimers.current.has(key)) clearTimeout(questionSaveTimers.current.get(key)!);
    questionSaveTimers.current.set(key, setTimeout(async () => {
      try {
        await questionApi.update(question.id, {
          text: question.text || 'السؤال',
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
      } catch { }
      questionSaveTimers.current.delete(key);
    }, 1000));
  };

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
      } catch { }
      optionSaveTimers.current.delete(key);
    }, 1000));
  };

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
    reordered.forEach(q => { scheduleQuestionSave(q); });
  }, []);

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
      scheduleFormSave();
    } catch {
      setError('فشل في إضافة السؤال.');
    }
  };

  const updateQuestion = (idx: number, updated: FormQuestionDto) => {
    const old = questionsRef.current[idx];
    if (!old) return;
    setQuestions(qs => qs.map((q, i) => i === idx ? updated : q));
    if (updated.id.startsWith('temp-')) return;

    const oldOptionMap = new Map(old.options.map(o => [o.id, o]));
    const newOptionIds = new Set(updated.options.map(o => o.id));

    updated.options.forEach(option => {
      if (option.id.startsWith('temp-')) {
        optionApi.create({
          questionId: updated.id,
          text: option.text || `خيار ${option.order + 1}`,
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
        const oldOpt = oldOptionMap.get(option.id)!;
        if (oldOpt.text !== option.text || oldOpt.isCorrect !== option.isCorrect || oldOpt.order !== option.order) {
          scheduleOptionSave(option);
        }
      }
    });

    old.options.forEach(oldOpt => {
      if (!newOptionIds.has(oldOpt.id) && !oldOpt.id.startsWith('temp-')) {
        optionApi.delete(oldOpt.id).catch(() => {});
      }
    });

    scheduleQuestionSave(updated);
  };

  const deleteQuestion = async (idx: number) => {
    const q = questionsRef.current[idx];
    if (!q) return;
    if (!q.id.startsWith('temp-')) {
      try {
        await questionApi.delete(q.id);
      } catch {
        setError('فشل في حذف السؤال.');
        return;
      }
    }
    setQuestions(qs => qs.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i })));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DashboardLayout title={title || 'إنشاء استبيان أو اختبار'} subtitle="منشئ النماذج والاختبارات">
      <div className="glass-card rounded-xl px-4 py-3 flex items-center justify-between mb-6" dir="rtl">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link to="/form">
              <ChevronRight className="h-4 w-4" /> {/* تم التغيير لليمين لأن الاتجاه RTL */}
              {t.back || 'رجوع'}
            </Link>
          </Button>
          {error && <span className="text-sm text-destructive">{error}</span>}
          {autoSaving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              {t.saving || 'جاري الحفظ...'}
            </span>
          )}
          {!autoSaving && !error && isEdit && (
            <span className="text-xs text-emerald-600">✓ {t.save || 'تم الحفظ'}</span>
          )}
        </div>
        {isEdit && (
          <Button asChild variant="outline" size="sm" className="gap-1.5 border-emerald-600/20 text-emerald-700 hover:bg-emerald-50">
            <Link to={`/forms/${id}/preview`}>
              <Eye className="h-3.5 w-3.5" />
              {t.preview || 'معاينة'}
            </Link>
          </Button>
        )}
      </div>

      <div className="max-w-5xl mx-auto space-y-6" dir="rtl" style={{ fontFamily }}>
        {/* Form header card */}
        <div className="glass-card rounded-xl border-t-4 p-6 space-y-4 shadow-sm" style={{ borderTopColor: primaryColor }}>
          <textarea
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="عنوان النموذج"
            rows={1}
            className="w-full text-3xl font-bold text-foreground border-none outline-none resize-none bg-transparent placeholder:text-muted-foreground/50"
          />
          <textarea
            value={description}
            onChange={e => handleDescriptionChange(e.target.value)}
            placeholder="وصف النموذج (اختياري)"
            rows={2}
            className="w-full text-base text-muted-foreground border-none outline-none resize-none bg-transparent placeholder:text-muted-foreground/50"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-emerald-100">
            <div>
              <label className="text-xs font-bold text-emerald-800 uppercase tracking-wide">نوع النموذج</label>
              <select
                value={formType}
                onChange={e => handleFormTypeChange(e.target.value as FormType)}
                className="mt-1 w-full px-3 py-2 border border-emerald-100 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                <option value="Normal">استبيان</option>
                <option value="Quiz">اختبار</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-emerald-800 uppercase tracking-wide">الفئة المستهدفة</label>
              <select
                value={audience}
                onChange={e => handleAudienceChange(e.target.value as AudienceType)}
                className="mt-1 w-full px-3 py-2 border border-emerald-100 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                <option value="Students">الطلاب</option>
                <option value="Teachers">المعلمون</option>
                <option value="Both">الجميع</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-emerald-800 uppercase tracking-wide">المؤقت (بالدقائق)</label>
              <input
                type="number"
                value={timerMinutes || ''}
                onChange={e => handleTimerChange(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="بدون مؤقت"
                min={1}
                className="mt-1 w-full px-3 py-2 border border-emerald-100 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={handleIsActiveToggle}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${isActive ? 'bg-emerald-600' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-[-1.25rem]' : 'translate-x-[-0.1rem]'}`} />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-emerald-700">النموذج نشط</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={handleAllowMultipleToggle}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${allowMultipleResponses ? 'bg-emerald-600' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allowMultipleResponses ? 'translate-x-[-1.25rem]' : 'translate-x-[-0.1rem]'}`} />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-emerald-700">السماح بأكثر من رد</span>
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-100">
            <button
              onClick={() => setShowStylePanel(s => !s)}
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-2 transition-colors"
            >
              🎨 {showStylePanel ? 'إخفاء' : 'إظهار'} إعدادات مظهر النموذج
            </button>
            {showStylePanel && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <div>
                  <label className="text-xs font-bold text-emerald-800 uppercase tracking-wide block mb-2">اللون الأساسي</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={e => handlePrimaryColorChange(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-none p-0 overflow-hidden shadow-sm"
                    />
                    <span className="text-xs font-mono text-muted-foreground">{primaryColor.toUpperCase()}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-emerald-800 uppercase tracking-wide block mb-2">لون الخلفية</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={e => handleBackgroundColorChange(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-none p-0 overflow-hidden shadow-sm"
                    />
                    <span className="text-xs font-mono text-muted-foreground">{backgroundColor.toUpperCase()}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-emerald-800 uppercase tracking-wide block mb-2">خط الكتابة</label>
                  <select
                    value={fontFamily}
                    onChange={e => handleFontFamilyChange(e.target.value)}
                    className="w-full px-3 py-2 border border-emerald-100 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
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

        {/* Add question buttons */}
        <div className="flex flex-wrap gap-3 justify-center py-8 border-t border-dashed border-emerald-200">
          <button
            onClick={() => addQuestion('ShortText')}
            className="px-5 py-2.5 text-sm font-bold text-emerald-700 border-2 border-emerald-600/20 bg-white rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
          >
            + إجابة قصيرة
          </button>
          <button
            onClick={() => addQuestion('LongText')}
            className="px-5 py-2.5 text-sm font-bold text-emerald-700 border-2 border-emerald-600/20 bg-white rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
          >
            + نص طويل
          </button>
          <button
            onClick={() => addQuestion('MultipleChoice')}
            className="px-5 py-2.5 text-sm font-bold text-emerald-700 border-2 border-emerald-600/20 bg-white rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
          >
            + خيارات متعددة
          </button>
          <button
            onClick={() => addQuestion('Checkbox')}
            className="px-5 py-2.5 text-sm font-bold text-emerald-700 border-2 border-emerald-600/20 bg-white rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
          >
            + مربعات اختيار
          </button>
          <button
            onClick={() => addQuestion('Dropdown')}
            className="px-5 py-2.5 text-sm font-bold text-emerald-700 border-2 border-emerald-600/20 bg-white rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
          >
            + قائمة منسدلة
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
