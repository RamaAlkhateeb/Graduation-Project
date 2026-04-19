import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, FileText, Users, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Survey {
  id: number;
  title: string;
  description: string;
  targetGroup: string;
  responses: number;
  totalSent: number;
  createdAt: string;
}

const initialSurveys: Survey[] = [
  { id: 1, title: "استبيان رضا أولياء الأمور", description: "تقييم مستوى الرضا عن أداء الحلقات القرآنية", targetGroup: "أولياء الأمور", responses: 45, totalSent: 80, createdAt: "2026-02-10" },
  { id: 2, title: "تقييم جودة التعليم", description: "استبيان لتقييم جودة التعليم في الحلقات", targetGroup: "أولياء الأمور", responses: 32, totalSent: 80, createdAt: "2026-02-01" },
  { id: 3, title: "اقتراحات تطوير الحلقات", description: "جمع اقتراحات الأهالي لتطوير البرنامج", targetGroup: "أولياء الأمور", responses: 28, totalSent: 80, createdAt: "2026-01-20" },
];

const SurveysPage = () => {
  const [surveys, setSurveys] = useState(initialSurveys);
  const [open, setOpen] = useState(false);
  const [newSurvey, setNewSurvey] = useState({ title: "", description: "" });

  const handleAdd = () => {
    if (!newSurvey.title) return;
    setSurveys([...surveys, {
      id: Date.now(),
      title: newSurvey.title,
      description: newSurvey.description,
      targetGroup: "أولياء الأمور",
      responses: 0,
      totalSent: 80,
      createdAt: new Date().toISOString().split("T")[0],
    }]);
    setNewSurvey({ title: "", description: "" });
    setOpen(false);
  };

  return (
    <DashboardLayout title="الاستبيانات" subtitle="إرسال استبيانات لأولياء الأمور ومتابعة الردود">
      <div className="flex justify-end mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />إنشاء استبيان</Button>
          </DialogTrigger>
          <DialogContent className="font-tajawal" dir="rtl">
            <DialogHeader><DialogTitle>إنشاء استبيان جديد</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>عنوان الاستبيان</Label><Input value={newSurvey.title} onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })} /></div>
              <div><Label>الوصف</Label><Textarea value={newSurvey.description} onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })} /></div>
              <Button onClick={handleAdd} className="w-full">إرسال الاستبيان</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {surveys.map((survey, i) => {
          const pct = Math.round((survey.responses / survey.totalSent) * 100);
          return (
            <div key={survey.id} className="glass-card rounded-xl p-5 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-info" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{survey.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{survey.createdAt}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{survey.description}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Users className="h-4 w-4" />
                <span>{survey.targetGroup}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">الردود</span>
                <span className="font-bold text-foreground">{survey.responses}/{survey.totalSent}</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default SurveysPage;
