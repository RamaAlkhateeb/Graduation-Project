import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, Users, User } from "lucide-react";

interface Circle {
  id: number;
  name: string;
  time: string;
  teacher: string;
  studentsCount: number;
  maxStudents: number;
}

const initialCircles: Circle[] = [
  { id: 1, name: "حلقة الفجر", time: "بعد صلاة الفجر", teacher: "خالد الأحمد", studentsCount: 18, maxStudents: 25 },
  { id: 2, name: "حلقة العصر", time: "بعد صلاة العصر", teacher: "سامر الخطيب", studentsCount: 25, maxStudents: 30 },
  { id: 3, name: "حلقة المغرب", time: "بعد صلاة المغرب", teacher: "سامر الخطيب", studentsCount: 20, maxStudents: 25 },
  { id: 4, name: "حلقة العشاء", time: "بعد صلاة العشاء", teacher: "محمد الزند", studentsCount: 15, maxStudents: 20 },
];

const teachers = ["خالد الأحمد", "سامر الخطيب", "محمد الزند", "أحمد النعسان", "عمر السيد"];

const CirclesPage = () => {
  const [circles, setCircles] = useState(initialCircles);
  const [open, setOpen] = useState(false);
  const [newCircle, setNewCircle] = useState({ name: "", time: "", teacher: "", maxStudents: "20" });

  const handleAdd = () => {
    if (!newCircle.name) return;
    setCircles([...circles, {
      id: Date.now(),
      name: newCircle.name,
      time: newCircle.time,
      teacher: newCircle.teacher,
      studentsCount: 0,
      maxStudents: parseInt(newCircle.maxStudents) || 20,
    }]);
    setNewCircle({ name: "", time: "", teacher: "", maxStudents: "20" });
    setOpen(false);
  };

  return (
    <DashboardLayout title="الحلقات" subtitle="إنشاء وإدارة الحلقات القرآنية وتعيين الأساتذة">
      <div className="flex justify-end mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />إضافة حلقة</Button>
          </DialogTrigger>
          <DialogContent className="font-tajawal" dir="rtl">
            <DialogHeader><DialogTitle>إنشاء حلقة جديدة</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>اسم الحلقة</Label><Input value={newCircle.name} onChange={(e) => setNewCircle({ ...newCircle, name: e.target.value })} /></div>
              <div><Label>الوقت</Label><Input value={newCircle.time} onChange={(e) => setNewCircle({ ...newCircle, time: e.target.value })} placeholder="مثال: بعد صلاة الفجر" /></div>
              <div>
                <Label>الأستاذ المسؤول</Label>
                <Select value={newCircle.teacher} onValueChange={(v) => setNewCircle({ ...newCircle, teacher: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر الأستاذ" /></SelectTrigger>
                  <SelectContent>{teachers.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>الحد الأقصى للطلاب</Label><Input type="number" value={newCircle.maxStudents} onChange={(e) => setNewCircle({ ...newCircle, maxStudents: e.target.value })} /></div>
              <Button onClick={handleAdd} className="w-full">إنشاء</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {circles.map((circle, i) => {
          const fillPct = (circle.studentsCount / circle.maxStudents) * 100;
          return (
            <div key={circle.id} className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{circle.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Clock className="h-3.5 w-3.5" />{circle.time}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
                  <Users className="h-6 w-6 text-accent-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3 text-sm">
                <User className="h-4 w-4 text-primary" />
                <span className="text-foreground font-medium">{circle.teacher || "غير معيّن"}</span>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">الطلاب</span>
                  <span className="font-bold text-foreground">{circle.studentsCount}/{circle.maxStudents}</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${fillPct > 90 ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default CirclesPage;
