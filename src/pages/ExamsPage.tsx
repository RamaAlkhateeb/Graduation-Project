import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, Clock, BookOpen, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Exam {
  id: number;
  title: string;
  circle: string;
  date: string;
  time: string;
  status: "upcoming" | "ongoing" | "completed";
  studentsCount: number;
}

const initialExams: Exam[] = [
  { id: 1, title: "اختبار سورة البقرة (1-50)", circle: "حلقة الفجر", date: "2026-02-25", time: "06:30", status: "upcoming", studentsCount: 18 },
  { id: 2, title: "اختبار سورة آل عمران", circle: "حلقة العصر", date: "2026-02-22", time: "16:00", status: "ongoing", studentsCount: 25 },
  { id: 3, title: "اختبار جزء عمّ", circle: "حلقة المغرب", date: "2026-02-18", time: "18:30", status: "completed", studentsCount: 20 },
  { id: 4, title: "اختبار سورة الكهف", circle: "حلقة العشاء", date: "2026-02-20", time: "20:00", status: "completed", studentsCount: 15 },
];

const statusConfig = {
  upcoming: { label: "قادم", variant: "secondary" as const, icon: Calendar },
  ongoing: { label: "جارٍ", variant: "default" as const, icon: AlertCircle },
  completed: { label: "مكتمل", variant: "outline" as const, icon: CheckCircle2 },
};

const ExamsPage = () => {
  const [exams, setExams] = useState(initialExams);
  const [open, setOpen] = useState(false);
  const [newExam, setNewExam] = useState({ title: "", circle: "", date: "", time: "" });

  const handleAdd = () => {
    if (!newExam.title) return;
    setExams([...exams, { id: Date.now(), ...newExam, status: "upcoming", studentsCount: 0 }]);
    setNewExam({ title: "", circle: "", date: "", time: "" });
    setOpen(false);
  };

  return (
    <DashboardLayout title="الاختبارات" subtitle="جدولة الاختبارات والإشراف عليها">
      <div className="flex justify-end mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />جدولة اختبار</Button>
          </DialogTrigger>
          <DialogContent className="font-tajawal" dir="rtl">
            <DialogHeader><DialogTitle>جدولة اختبار جديد</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>عنوان الاختبار</Label><Input value={newExam.title} onChange={(e) => setNewExam({ ...newExam, title: e.target.value })} /></div>
              <div>
                <Label>الحلقة</Label>
                <Select value={newExam.circle} onValueChange={(v) => setNewExam({ ...newExam, circle: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر الحلقة" /></SelectTrigger>
                  <SelectContent>
                    {["حلقة الفجر", "حلقة العصر", "حلقة المغرب", "حلقة العشاء"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>التاريخ</Label><Input type="date" value={newExam.date} onChange={(e) => setNewExam({ ...newExam, date: e.target.value })} /></div>
                <div><Label>الوقت</Label><Input type="time" value={newExam.time} onChange={(e) => setNewExam({ ...newExam, time: e.target.value })} /></div>
              </div>
              <Button onClick={handleAdd} className="w-full">جدولة</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {exams.map((exam, i) => {
          const config = statusConfig[exam.status];
          return (
            <div key={exam.id} className="glass-card rounded-xl p-5 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{exam.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{exam.date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{exam.time}</span>
                      <span>{exam.circle}</span>
                      <span>{exam.studentsCount} طالب</span>
                    </div>
                  </div>
                </div>
                <Badge variant={config.variant} className="self-start sm:self-center gap-1.5">
                  <config.icon className="h-3.5 w-3.5" />
                  {config.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default ExamsPage;
