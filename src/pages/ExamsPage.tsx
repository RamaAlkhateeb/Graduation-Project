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
import {
  Plus,
  FileText,
  Users,
  Link2,
  Copy,
  PlusCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Question {
  id: string;
  title: string;
  type: "text";
}

interface Survey {
  id: string;
  title: string;
  description: string;
  publicUrl: string;
  createdAt: string;
  responses: number;
  totalSent: number;
  questions: Question[];
}

const SurveysPage = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);

  const [open, setOpen] = useState(false);

  const [newSurvey, setNewSurvey] = useState({
    title: "",
    description: "",
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: crypto.randomUUID(),
      title: "",
      type: "text",
    },
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        title: "",
        type: "text",
      },
    ]);
  };

  const updateQuestion = (id: string, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, title: value } : q
      )
    );
  };

  const handleAddSurvey = () => {
    if (!newSurvey.title) return;

    const surveyId = crypto.randomUUID();

    const survey: Survey = {
      id: surveyId,
      title: newSurvey.title,
      description: newSurvey.description,
      publicUrl: `${window.location.origin}/survey/${surveyId}`,
      createdAt: new Date().toISOString().split("T")[0],
      responses: 0,
      totalSent: 0,
      questions,
    };

    setSurveys([survey, ...surveys]);

    setNewSurvey({
      title: "",
      description: "",
    });

    setQuestions([
      {
        id: crypto.randomUUID(),
        title: "",
        type: "text",
      },
    ]);

    setOpen(false);
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("تم نسخ رابط الاستبيان");
  };

  return (
    <DashboardLayout
      title="الاستبيانات"
      subtitle="إنشاء وإدارة الاستبيانات"
    >
      <div className="flex justify-end mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إنشاء استبيان
            </Button>
          </DialogTrigger>

          <DialogContent
            className="max-w-2xl font-tajawal"
            dir="rtl"
          >
            <DialogHeader>
              <DialogTitle>
                إنشاء استبيان جديد
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">

              <div>
                <Label>عنوان الاستبيان</Label>
                <Input
                  value={newSurvey.title}
                  onChange={(e) =>
                    setNewSurvey({
                      ...newSurvey,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={newSurvey.description}
                  onChange={(e) =>
                    setNewSurvey({
                      ...newSurvey,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-3">
                <Label>الأسئلة</Label>

                {questions.map((question, index) => (
                  <Input
                    key={question.id}
                    placeholder={`السؤال ${index + 1}`}
                    value={question.title}
                    onChange={(e) =>
                      updateQuestion(
                        question.id,
                        e.target.value
                      )
                    }
                  />
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
                onClick={handleAddSurvey}
                className="w-full"
              >
                إنشاء الاستبيان
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {surveys.map((survey) => {
          const pct =
            survey.totalSent === 0
              ? 0
              : (survey.responses /
                  survey.totalSent) *
                100;

          return (
            <div
              key={survey.id}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-info" />
                </div>

                <div className="flex-1">
                  <h3 className="font-bold">
                    {survey.title}
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    {survey.createdAt}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {survey.description}
              </p>

              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                <span>
                  عدد الأسئلة:
                  {survey.questions.length}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Link2 className="h-4 w-4" />
                <span className="text-xs truncate">
                  {survey.publicUrl}
                </span>
              </div>

              <Button
                variant="outline"
                className="w-full mb-4"
                onClick={() =>
                  copyLink(survey.publicUrl)
                }
              >
                <Copy className="h-4 w-4 ml-2" />
                نسخ الرابط
              </Button>

              <div className="flex justify-between mb-2 text-sm">
                <span>الردود</span>
                <span>
                  {survey.responses}
                </span>
              </div>

              <Progress value={pct} />
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default SurveysPage;
