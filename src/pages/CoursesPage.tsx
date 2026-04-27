import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, GraduationCap, Users, Clock, Award, BookMarked } from "lucide-react";

interface Course {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  instructor: string;
  studentsCount: number;
  lessonsCount: number;
  level: string;
}

const initialCourses: Course[] = [
  {
    id: 1,
    name: "دورة التجويد المتقدم",
    startDate: "2024-10-01",
    endDate: "2025-01-30",
    description: "دورة متخصصة في أحكام التجويد المتقدمة مع التطبيق العملي على آيات القرآن الكريم.",
    instructor: "الشيخ أحمد المصري",
    studentsCount: 25,
    lessonsCount: 24,
    level: "متقدم",
  },
  {
    id: 2,
    name: "دورة حفظ جزء عمّ",
    startDate: "2025-02-15",
    endDate: "2025-05-15",
    description: "دورة مخصصة للمبتدئين لحفظ جزء عمّ مع شرح معاني الكلمات الغريبة.",
    instructor: "الأستاذ محمد السيد",
    studentsCount: 40,
    lessonsCount: 30,
    level: "مبتدئ",
  },
  {
    id: 3,
    name: "دورة علوم القرآن",
    startDate: "2025-06-01",
    endDate: "2025-08-30",
    description: "دورة شاملة في علوم القرآن وأسباب النزول والناسخ والمنسوخ.",
    instructor: "د. خالد الحسيني",
    studentsCount: 18,
    lessonsCount: 20,
    level: "متوسط",
  },
];

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });

const getStatus = (start: string, end: string) => {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (now < s) return { label: "قادم", color: "bg-info text-info-foreground" };
  if (now > e) return { label: "منتهٍ", color: "bg-muted text-muted-foreground" };
  return { label: "جارٍ", color: "bg-success text-success-foreground" };
};

const getLevelColor = (level: string) => {
  if (level === "مبتدئ") return "bg-info/15 text-info";
  if (level === "متوسط") return "bg-warning/15 text-warning";
  return "bg-accent/15 text-accent";
};

const CoursesPage = () => {
  const [courses, setCourses] = useState(initialCourses);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Course | null>(null);
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    description: "",
    instructor: "",
    level: "مبتدئ",
  });

  const handleAdd = () => {
    if (!form.name || !form.startDate || !form.endDate) return;
    setCourses([
      ...courses,
      {
        id: Date.now(),
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        description: form.description,
        instructor: form.instructor,
        level: form.level,
        studentsCount: 0,
        lessonsCount: 0,
      },
    ]);
    setForm({ name: "", startDate: "", endDate: "", description: "", instructor: "", level: "مبتدئ" });
    setOpen(false);
  };

  return (
    <DashboardLayout title="الكورسات" subtitle="إدارة الدورات التدريبية وعرض تفاصيلها">
      <div className="flex justify-end mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة كورس
            </Button>
          </DialogTrigger>
          <DialogContent className="font-tajawal" dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء كورس جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>اسم الكورس</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: دورة التجويد"
                />
              </div>
              <div>
                <Label>المدرّس</Label>
                <Input
                  value={form.instructor}
                  onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                  placeholder="اسم المدرّس"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>تاريخ البدء</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>تاريخ الانتهاء</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>المستوى</Label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="مبتدئ">مبتدئ</option>
                  <option value="متوسط">متوسط</option>
                  <option value="متقدم">متقدم</option>
                </select>
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="وصف تفصيلي للكورس وأهدافه..."
                  rows={4}
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                إنشاء
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.map((course, i) => {
          const status = getStatus(course.startDate, course.endDate);
          return (
            <button
              key={course.id}
              onClick={() => setSelected(course)}
              className="glass-card rounded-xl p-6 text-right animate-fade-in hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookMarked className="h-6 w-6 text-accent-foreground" />
                </div>
                <Badge className={status.color}>{status.label}</Badge>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{course.name}</h3>
              <Badge variant="secondary" className={`mb-3 ${getLevelColor(course.level)}`}>
                {course.level}
              </Badge>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>البدء: {formatDate(course.startDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-accent" />
                  <span>الانتهاء: {formatDate(course.endDate)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="font-tajawal max-w-2xl" dir="rtl">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-3">
                  <DialogTitle className="text-2xl">{selected.name}</DialogTitle>
                  <Badge className={getStatus(selected.startDate, selected.endDate).color}>
                    {getStatus(selected.startDate, selected.endDate).label}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="space-y-5 mt-2">
                <div className="flex items-center gap-2">
                  <Badge className={getLevelColor(selected.level)}>{selected.level}</Badge>
                  <span className="text-sm text-muted-foreground">
                    المدرّس: <span className="font-bold text-foreground">{selected.instructor}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-card rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      تاريخ البدء
                    </div>
                    <p className="font-bold text-foreground">{formatDate(selected.startDate)}</p>
                  </div>
                  <div className="glass-card rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Clock className="h-4 w-4 text-accent" />
                      تاريخ الانتهاء
                    </div>
                    <p className="font-bold text-foreground">{formatDate(selected.endDate)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-2">الوصف</h4>
                  <p className="text-muted-foreground leading-relaxed">{selected.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="glass-card rounded-lg p-4 text-center">
                    <GraduationCap className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">{selected.studentsCount}</p>
                    <p className="text-xs text-muted-foreground">الطلاب</p>
                  </div>
                  <div className="glass-card rounded-lg p-4 text-center">
                    <BookMarked className="h-5 w-5 text-accent mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">{selected.lessonsCount}</p>
                    <p className="text-xs text-muted-foreground">الدروس</p>
                  </div>
                  <div className="glass-card rounded-lg p-4 text-center">
                    <Award className="h-5 w-5 text-info mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">{selected.level}</p>
                    <p className="text-xs text-muted-foreground">المستوى</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CoursesPage;
