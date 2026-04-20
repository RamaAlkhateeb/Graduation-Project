import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search } from "lucide-react";

interface Student {
  id: number;
  firstName: string;
  fatherName: string;
  birthDate: string;
  grade: string;
  school: string;
  fatherJob: string;
  memorizedParts: string;
}

const initialStudents: Student[] = [
  {
    id: 1,
    firstName: "أحمد",
    fatherName: "محمد",
    birthDate: "2012-05-10",
    grade: "السادس",
    school: "مدرسة النور",
    fatherJob: "مهندس",
    memorizedParts: "10 أجزاء",
  },
  {
    id: 2,
    firstName: "عمر",
    fatherName: "سعيد",
    birthDate: "2014-03-22",
    grade: "الرابع",
    school: "مدرسة الأمل",
    fatherJob: "مدرس",
    memorizedParts: "5 أجزاء",
  },
];

const StudentsPage = () => {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const [newStudent, setNewStudent] = useState({
    firstName: "",
    fatherName: "",
    birthDate: "",
    grade: "",
    school: "",
    fatherJob: "",
    memorizedParts: "",
  });

  const filtered = students.filter(
    (s) =>
      s.firstName.includes(search) ||
      s.fatherName.includes(search)
  );

  const handleAdd = () => {
    if (!newStudent.firstName) return;

    setStudents([
      ...students,
      {
        id: Date.now(),
        ...newStudent,
      },
    ]);

    setNewStudent({
      firstName: "",
      fatherName: "",
      birthDate: "",
      grade: "",
      school: "",
      fatherJob: "",
      memorizedParts: "",
    });

    setOpen(false);
  };

  return (
    <DashboardLayout
      title="الطلاب"
      subtitle="إدارة بيانات الطلاب"
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة طالب
            </Button>
          </DialogTrigger>

          <DialogContent className="font-tajawal" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة طالب جديد</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label>الاسم</Label>
                <Input
                  value={newStudent.firstName}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      firstName: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>اسم الأب</Label>
                <Input
                  value={newStudent.fatherName}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      fatherName: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>المواليد</Label>
                <Input
                  type="date"
                  value={newStudent.birthDate}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      birthDate: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>الصف</Label>
                <Input
                  value={newStudent.grade}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      grade: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>المدرسة</Label>
                <Input
                  value={newStudent.school}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      school: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>عمل الأب</Label>
                <Input
                  value={newStudent.fatherJob}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      fatherJob: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>الأجزاء المحفوظة</Label>
                <Input
                  value={newStudent.memorizedParts}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      memorizedParts: e.target.value,
                    })
                  }
                />
              </div>

              <Button onClick={handleAdd} className="w-full">
                إضافة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-4 text-right">الاسم</th>
                <th className="p-4 text-right">اسم الأب</th>
                <th className="p-4 text-right">المواليد</th>
                <th className="p-4 text-right">الصف</th>
                <th className="p-4 text-right">المدرسة</th>
                <th className="p-4 text-right">عمل الأب</th>
                <th className="p-4 text-right">الأجزاء المحفوظة</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((student, i) => (
                <tr
                  key={student.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="p-4">{student.firstName}</td>
                  <td className="p-4">{student.fatherName}</td>
                  <td className="p-4">{student.birthDate}</td>
                  <td className="p-4">{student.grade}</td>
                  <td className="p-4">{student.school}</td>
                  <td className="p-4">{student.fatherJob}</td>
                  <td className="p-4">{student.memorizedParts}</td>
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
