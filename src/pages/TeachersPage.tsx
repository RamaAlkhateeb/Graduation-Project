import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Phone, Mail, BookOpen } from "lucide-react";

interface Teacher {
  id: number;
  name: string;
  phone: string;
  email: string;
  circles: string[];
  studentsCount: number;
}

const initialTeachers: Teacher[] = [
  { id: 1, name: "خالد الأحمد", phone: "0912345678", email: "khaled@example.com", circles: ["حلقة الفجر"], studentsCount: 18 },
  { id: 2, name: "سامر الخطيب", phone: "0923456789", email: "samer@example.com", circles: ["حلقة العصر", "حلقة المغرب"], studentsCount: 25 },
  { id: 3, name: "محمد الزند", phone: "0934567890", email: "mohammed@example.com", circles: ["حلقة العشاء"], studentsCount: 15 },
  { id: 4, name: "أحمد النعسان", phone: "0945678901", email: "ahmad@example.com", circles: ["حلقة الفجر"], studentsCount: 20 },
  { id: 5, name: "عمر السيد", phone: "0956789012", email: "omar@example.com", circles: ["حلقة العصر"], studentsCount: 12 },
];

const TeachersPage = () => {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: "", phone: "", email: "" });

  const filtered = teachers.filter((t) => t.name.includes(search) || t.email.includes(search));

  const handleAdd = () => {
    if (!newTeacher.name) return;
    setTeachers([...teachers, { id: Date.now(), ...newTeacher, circles: [], studentsCount: 0 }]);
    setNewTeacher({ name: "", phone: "", email: "" });
    setOpen(false);
  };

  return (
    <DashboardLayout title="الأساتذة" subtitle="إدارة حسابات الأساتذة وربطهم بالحلقات">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن أستاذ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة أستاذ
            </Button>
          </DialogTrigger>
          <DialogContent className="font-tajawal" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة أستاذ جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>الاسم الكامل</Label>
                <Input value={newTeacher.name} onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })} />
              </div>
              <div>
                <Label>رقم الهاتف</Label>
                <Input value={newTeacher.phone} onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })} />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input value={newTeacher.email} onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })} />
              </div>
              <Button onClick={handleAdd} className="w-full">إضافة</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((teacher, i) => (
          <div key={teacher.id} className="glass-card rounded-xl p-5 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                {teacher.name.charAt(0)}
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                {teacher.studentsCount} طالب
              </span>
            </div>
            <h3 className="font-bold text-foreground text-lg mb-2">{teacher.name}</h3>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{teacher.phone}</p>
              <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{teacher.email}</p>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <BookOpen className="h-3.5 w-3.5" />
                {teacher.circles.map((c) => (
                  <span key={c} className="bg-accent/20 text-accent-foreground text-xs px-2 py-0.5 rounded-full">{c}</span>
                ))}
                {teacher.circles.length === 0 && <span className="text-xs">لم يُعيّن بعد</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default TeachersPage;
