import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileText,
  Users,
  Link2,
  Copy,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Award,
  RotateCcw,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  title: string;
  options: Option[];
  correctOptionId: string | null;
  points: number;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  publicUrl: string;
  createdAt: string;
  responses: number;
  totalSent: number;
  questions: Question[];
}

interface ExamAttemptResult {
  examId: string;
  totalScore: number;
  maxScore: number;
  correctCount: number;
  totalQuestions: number;
  answeredAt: string;
}

const emptyQuestion = (): Question => ({
  id: crypto.randomUUID(),
  title: "",
  options: [
    { id: crypto.randomUUID(), text: "" },
    { id: crypto.randomUUID(), text: "" },
  ],
  correctOptionId: null,
  points: 1,
});

const ExamsPage = () => {
  const [exams, setExams] = useState<Exam[]>([]);

  const [open, setOpen] = useState(false);

  const [newExam, setNewExam] = useState({
    title: "",
    description: "",
  });

  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);

  // ── Taking an exam ──
  const [takingExam, setTakingExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ExamAttemptResult | null>(null);

  // ── Results history (per exam) ──
  const [resultsByExam, setResultsByExam] = useState<Record<string, ExamAttemptResult[]>>({});

  // ─── Builder helpers ───────────────────────────────────────────────────

  const addQuestion = () => {
    setQuestions([...questions, emptyQuestion()]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestionTitle = (id: string, value: string) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, title: value } : q))
    );
  };

  const updateQuestionPoints = (id: string, value: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, points: Number.isFinite(value) && value > 0 ? value : 1 } : q
      )
    );
  };

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: [...q.options, { id: crypto.randomUUID(), text: "" }] }
          : q
      )
    );
  };

  const updateOptionText = (questionId: string, optionId: string, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((o) =>
                o.id === optionId ? { ...o, text: value } : o
              ),
            }
          : q
      )
    );
  };

  const removeOption = (questionId: string, optionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.filter((o) => o.id !== optionId),
              correctOptionId: q.correctOptionId === optionId ? null : q.correctOptionId,
            }
          : q
      )
    );
  };

  const setCorrectOption = (questionId: string, optionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, correctOptionId: optionId } : q
      )
    );
  };

  const resetBuilder = () => {
    setNewExam({ title: "", description: "" });
    setQuestions([emptyQuestion()]);
  };

  const handleAddExam = () => {
    if (!newExam.title) return;

    // تحقق بسيط: كل سؤال يحتاج عنوان، خيارين على الأقل، وإجابة صحيحة محددة
    const invalidQuestion = questions.find(
      (q) =>
        !q.title.trim() ||
        q.options.filter((o) => o.text.trim()).length < 2 ||
        !q.correctOptionId
    );

    if (invalidQuestion) {
      alert("يرجى التأكد من أن كل سؤال يحتوي على نص، خيارين على الأقل، وتحديد الإجابة الصحيحة");
      return;
    }

    const examId = crypto.randomUUID();

    const exam: Exam = {
      id: examId,
      title: newExam.title,
      description: newExam.description,
      publicUrl: `${window.location.origin}/exam/${examId}`,
      createdAt: new Date().toISOString().split("T")[0],
      responses: 0,
      totalSent: 0,
      questions: questions.map((q) => ({
        ...q,
        options: q.options.filter((o) => o.text.trim()),
      })),
    };

    setExams([exam, ...exams]);
    resetBuilder();
    setOpen(false);
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("تم نسخ رابط الاختبار");
  };

  // ─── Taking the exam ───────────────────────────────────────────────────

  const startExam = (exam: Exam) => {
    setTakingExam(exam);
    setAnswers({});
    setResult(null);
  };

  const selectAnswer = (questionId: string, optionId: string) => {
    setAnswers({ ...answers, [questionId]: optionId });
  };

  const submitExam = () => {
    if (!takingExam) return;

    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;

    takingExam.questions.forEach((q) => {
      maxScore += q.points;
      if (answers[q.id] && answers[q.id] === q.correctOptionId) {
        totalScore += q.points;
        correctCount += 1;
      }
    });

    const attempt: ExamAttemptResult = {
      examId: takingExam.id,
      totalScore,
      maxScore,
      correctCount,
      totalQuestions: takingExam.questions.length,
      answeredAt: new Date().toISOString(),
    };

    setResult(attempt);

    setResultsByExam((prev) => ({
      ...prev,
      [takingExam.id]: [attempt, ...(prev[takingExam.id] ?? [])],
    }));

    setExams((prev) =>
      prev.map((e) =>
        e.id === takingExam.id
          ? { ...e, responses: e.responses + 1, totalSent: e.totalSent || e.responses + 1 }
          : e
      )
    );
  };

  const closeExamDialog = () => {
    setTakingExam(null);
    setAnswers({});
    setResult(null);
  };

  const allQuestionsAnswered =
    !!takingExam && takingExam.questions.every((q) => Boolean(answers[q.id]));

  return (
    <DashboardLayout
      title="الاختبارات"
      subtitle="إنشاء وإدارة الاختبارات وعرض النتائج"
    >
      <div className="flex justify-end mb-6">
        <Dialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            if (!value) resetBuilder();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إنشاء اختبار
            </Button>
          </DialogTrigger>

          <DialogContent
            className="max-w-3xl font-tajawal max-h-[90vh] overflow-y-auto"
            dir="rtl"
          >
            <DialogHeader>
              <DialogTitle>إنشاء اختبار جديد</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>عنوان الاختبار</Label>
                <Input
                  value={newExam.title}
                  onChange={(e) =>
                    setNewExam({
                      ...newExam,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={newExam.description}
                  onChange={(e) =>
                    setNewExam({
                      ...newExam,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-4">
                <Label>الأسئلة</Label>

                {questions.map((question, qIndex) => (
                  <div
                    key={question.id}
                    className="rounded-lg border p-4 space-y-3 bg-muted/30"
                  >
                    <div className="flex items-start gap-2">
                      <Input
                        placeholder={`نص السؤال ${qIndex + 1}`}
                        value={question.title}
                        onChange={(e) =>
                          updateQuestionTitle(question.id, e.target.value)
                        }
                        className="flex-1"
                      />

                      <Input
                        type="number"
                        min={1}
                        value={question.points}
                        onChange={(e) =>
                          updateQuestionPoints(question.id, Number(e.target.value))
                        }
                        className="w-20"
                        title="درجة السؤال"
                      />

                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2 pr-2">
                      {question.options.map((option, oIndex) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            checked={question.correctOptionId === option.id}
                            onChange={() => setCorrectOption(question.id, option.id)}
                            className="h-4 w-4 accent-primary"
                            title="تحديد كإجابة صحيحة"
                          />
                          <Input
                            placeholder={`الخيار ${oIndex + 1}`}
                            value={option.text}
                            onChange={(e) =>
                              updateOptionText(question.id, option.id, e.target.value)
                            }
                            className="flex-1"
                          />
                          {question.options.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOption(question.id, option.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(question.id)}
                        className="gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        إضافة خيار
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addQuestion}
                  className="w-full"
                >
                  <PlusCircle className="w-4 h-4 ml-2" />
                  إضافة سؤال
                </Button>
              </div>

              <Button
                onClick={handleAddExam}
                className="w-full"
              >
                إنشاء الاختبار
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {exams.length === 0 && (
          <p className="text-sm text-muted-foreground">
            لا توجد اختبارات بعد. اضغط "إنشاء اختبار" للبدء.
          </p>
        )}

        {exams.map((exam) => {
          const examResults = resultsByExam[exam.id] ?? [];
          const lastResult = examResults[0];

          return (
            <div
              key={exam.id}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-info" />
                </div>

                <div className="flex-1">
                  <h3 className="font-bold">
                    {exam.title}
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    {exam.createdAt}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {exam.description}
              </p>

              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                <span>
                  عدد الأسئلة: {exam.questions.length}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Link2 className="h-4 w-4" />
                <span className="text-xs truncate">
                  {exam.publicUrl}
                </span>
              </div>

              <Button
                variant="outline"
                className="w-full mb-2"
                onClick={() => copyLink(exam.publicUrl)}
              >
                <Copy className="h-4 w-4 ml-2" />
                نسخ الرابط
              </Button>

              <Button
                className="w-full mb-4"
                onClick={() => startExam(exam)}
              >
                <CheckCircle2 className="h-4 w-4 ml-2" />
                بدء الاختبار
              </Button>

              <div className="flex justify-between mb-1 text-sm">
                <span>عدد المحاولات</span>
                <Badge variant="secondary">{exam.responses}</Badge>
              </div>

              {lastResult && (
                <div className="mt-2 rounded-lg border p-3 text-sm bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">آخر نتيجة</span>
                    <span className="font-bold">
                      {lastResult.totalScore} / {lastResult.maxScore}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {lastResult.correctCount} من {lastResult.totalQuestions} إجابات صحيحة
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Dialog أداء الاختبار ── */}
      <Dialog
        open={!!takingExam}
        onOpenChange={(value) => {
          if (!value) closeExamDialog();
        }}
      >
        <DialogContent
          className="max-w-2xl font-tajawal max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          {takingExam && (
            <>
              <DialogHeader>
                <DialogTitle>{takingExam.title}</DialogTitle>
              </DialogHeader>

              {!result ? (
                <div className="space-y-5 mt-2">
                  {takingExam.description && (
                    <p className="text-sm text-muted-foreground">{takingExam.description}</p>
                  )}

                  {takingExam.questions.map((question, qIndex) => (
                    <div key={question.id} className="rounded-lg border p-4 space-y-3">
                      <p className="font-medium">
                        {qIndex + 1}. {question.title}
                        <span className="text-xs text-muted-foreground"> ({question.points} درجة)</span>
                      </p>

                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <label
                            key={option.id}
                            className="flex items-center gap-3 cursor-pointer rounded-md border p-2 hover:bg-muted/50"
                          >
                            <input
                              type="radio"
                              name={`answer-${question.id}`}
                              checked={answers[question.id] === option.id}
                              onChange={() => selectAnswer(question.id, option.id)}
                              className="h-4 w-4 accent-primary"
                            />
                            <span>{option.text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Button
                    onClick={submitExam}
                    disabled={!allQuestionsAnswered}
                    className="w-full"
                  >
                    تسليم الاختبار
                  </Button>

                  {!allQuestionsAnswered && (
                    <p className="text-xs text-muted-foreground text-center">
                      يرجى الإجابة على جميع الأسئلة قبل التسليم
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-5 mt-2 text-center">
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Award className="h-8 w-8 text-primary" />
                    </div>

                    <h3 className="text-2xl font-bold">
                      {result.totalScore} / {result.maxScore}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      {result.correctCount} من {result.totalQuestions} إجابات صحيحة
                    </p>

                    <Badge variant="secondary" className="text-sm">
                      النسبة: {result.maxScore > 0 ? Math.round((result.totalScore / result.maxScore) * 100) : 0}%
                    </Badge>
                  </div>

                  <div className="space-y-3 text-right">
                    {takingExam.questions.map((question, qIndex) => {
                      const studentAnswerId = answers[question.id];
                      const isCorrect = studentAnswerId === question.correctOptionId;
                      const correctOption = question.options.find(
                        (o) => o.id === question.correctOptionId
                      );
                      const studentOption = question.options.find(
                        (o) => o.id === studentAnswerId
                      );

                      return (
                        <div
                          key={question.id}
                          className={`rounded-lg border p-3 text-sm ${
                            isCorrect ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5"
                          }`}
                        >
                          <p className="font-medium mb-1">
                            {qIndex + 1}. {question.title}
                          </p>
                          <p className="text-muted-foreground">
                            إجابتك: {studentOption?.text ?? "—"}
                          </p>
                          {!isCorrect && (
                            <p className="text-success">
                              الإجابة الصحيحة: {correctOption?.text}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => {
                        setAnswers({});
                        setResult(null);
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                      إعادة المحاولة
                    </Button>
                    <Button className="flex-1" onClick={closeExamDialog}>
                      إغلاق
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ExamsPage;