import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: number;
  name: string;
  age: number;
  parentPhone: string;
  circle: string;
  teacher: string;
  progress: number;
}

const initialStudents: Student[] = [
  { id: 1, name: "أحمد محمد", age: 12, parentPhone: "0912345678", circle: "حلقة الفجر", teacher: "خالد الأحمد", progress: 75 },
  { id: 2, name: "عمر سعيد", age: 10, parentPhone: "0923456789", circle: "حلقة العصر", teacher: "سامر الخطيب", progress: 60 },
  { id: 3, name: "يوسف علي", age: 14, parentPhone: "0934567890", circle: "حلقة المغرب", teacher: "سامر الخطيب", progress: 90 },
  { id: 4, name: "خالد حسن", age: 11, parentPhone: "0945678901", circle: "حلقة العشاء", teacher: "محمد الزند", progress: 45 },
  { id: 5, name: "إبراهيم كريم", age: 13, parentPhone: "0956789012", circle: "حلقة الفجر", teacher: "خالد الأحمد", progress: 85 },
  { id: 6, name: "زيد ماهر", age: 9, parentPhone: "0967890123", circle: "حلقة العصر", teacher: "عمر السيد", progress: 30 },
];

const circles = ["حلقة الفجر", "حلقة العصر", "حلقة المغرب", "حلقة العشاء"];

const StudentsPage = () => {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState("");
  const [filterCircle, setFilterCircle] = useState("all");
  const [open, setOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", age: "", parentPhone: "", circle: "" });

  const filtered = students.filter((s) => {
    const matchSearch = s.name.includes(search);
    const matchCircle = filterCircle === "all" || s.circle === filterCircle;
    return matchSearch && matchCircle;
  });

  const handleAdd = () => {
    if (!newStudent.name) return;
    setStudents([...students, {
      id: Date.now(),
      name: newStudent.name,
      age: parseInt(newStudent.age) || 10,
      parentPhone: newStudent.parentPhone,
      circle: newStudent.circle || "غير محدد",
      teacher: "غير معيّن",
      progress: 0,
    }]);
    setNewStudent({ name: "", age: "", parentPhone: "", circle: "" });
    setOpen(false);
  };

  const progressColor = (p: number) => p >= 70 ? "text-success" : p >= 40 ? "text-warning" : "text-destructive";

  return (
    <DashboardLayout title="الطلاب" subtitle="إدارة الطلاب وتوزيعهم على الحلقات">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث عن طالب..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>
        <Select value={filterCircle} onValueChange={setFilterCircle}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="جميع الحلقات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحلقات</SelectItem>
            {circles.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />إضافة طالب</Button>
          </DialogTrigger>
          <DialogContent className="font-tajawal" dir="rtl">
            <DialogHeader><DialogTitle>إضافة طالب جديد</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>اسم الطالب</Label><Input value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} /></div>
              <div><Label>العمر</Label><Input type="number" value={newStudent.age} onChange={(e) => setNewStudent({ ...newStudent, age: e.target.value })} /></div>
              <div><Label>هاتف ولي الأمر</Label><Input value={newStudent.parentPhone} onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })} /></div>
              <div>
                <Label>الحلقة</Label>
                <Select value={newStudent.circle} onValueChange={(v) => setNewStudent({ ...newStudent, circle: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر الحلقة" /></SelectTrigger>
                  <SelectContent>{circles.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} className="w-full">إضافة</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-right p-4 text-sm font-bold text-foreground">الطالب</th>
                <th className="text-right p-4 text-sm font-bold text-foreground">العمر</th>
                <th className="text-right p-4 text-sm font-bold text-foreground">الحلقة</th>
                <th className="text-right p-4 text-sm font-bold text-foreground">الأستاذ</th>
                <th className="text-right p-4 text-sm font-bold text-foreground">التقدم</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student, i) => (
                <tr key={student.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <span className="font-medium text-foreground">{student.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{student.age} سنة</td>
                  <td className="p-4"><Badge variant="secondary">{student.circle}</Badge></td>
                  <td className="p-4 text-muted-foreground">{student.teacher}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${student.progress}%` }} />
                      </div>
                      <span className={`text-sm font-bold ${progressColor(student.progress)}`}>{student.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentsPage;
