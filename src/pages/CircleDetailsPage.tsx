import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenCheck } from "lucide-react";
import { toast } from "sonner";

interface Halaqa {
  id: string;
  className: string;
  courseId: string | null;
}

interface Course {
  id: string;
  courseName: string;
}

interface StudentBrief {
  id: string;
  name: string;
  fatherName?: string;
  nationalityNumber?: string;
}

interface TeacherBrief {
  id: string;
  name: string;
  fatherName?: string;
  nationalityNumber?: string;
}

interface PagedResponse<T> {
  items?: T[];
  data?: T[];
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://alashmar.runasp.net/api";

const CircleDetailsPage = () => {
  const { circleId } = useParams();
  const navigate = useNavigate();

  const [circle, setCircle] = useState<Halaqa | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<StudentBrief[]>([]);
  const [teachers, setTeachers] = useState<TeacherBrief[]>([]);
  const [loading, setLoading] = useState(false);

  const axiosClient = useMemo(() => {
    const token = localStorage.getItem("token");

    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }, []);

  const normalizeCollection = <T,>(response: T[] | PagedResponse<T>) => {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.items)) {
      return response.items;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  };

  const fetchCircle = async () => {
    try {
      const response = await axiosClient.get<Halaqa[]>("/halaqas");
      const circles = Array.isArray(response.data) ? response.data : [];
      setCircle(circles.find((item) => item.id === circleId) ?? null);
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل تفاصيل الحلقة");
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axiosClient.get<Course[]>("/courses");
      setCourses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStudents = async () => {
    if (!circleId) return;

    try {
      const response = await axiosClient.get<
        StudentBrief[] | PagedResponse<StudentBrief>
      >("/students/filtered", {
        params: {
          pageNumber: 1,
          pageSize: 200,
          classId: circleId,
        },
      });

      setStudents(normalizeCollection(response.data));
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل الطلاب المسجلين");
    }
  };

  const fetchTeachers = async () => {
    if (!circleId) return;

    try {
      const response = await axiosClient.get<
        TeacherBrief[] | PagedResponse<TeacherBrief>
      >("/teachers/filtered", {
        params: {
          pageNumber: 1,
          pageSize: 200,
          classId: circleId,
        },
      });

      setTeachers(normalizeCollection(response.data));
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل الأساتذة المسجلين");
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchCircle(), fetchCourses(), fetchStudents(), fetchTeachers()]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [circleId]);

  const courseName = courses.find((course) => course.id === circle?.courseId)?.courseName ?? "غير محدد";

  return (
    <DashboardLayout
      title={circle?.className ?? "تفاصيل الحلقة"}
      subtitle="الطلاب والأساتذة المسجلون في هذه الحلقة"
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">بيانات الحلقة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">الاسم</span>
              <span className="font-medium">{circle?.className ?? (loading ? "..." : "غير متوفر")}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">الكورس</span>
              <span className="font-medium">{courseName}</span>
            </div>
            <div className="flex justify-between gap-3">
              
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">الطلاب المسجلون</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">العدد</span>
              <Badge variant="secondary">{students.length}</Badge>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا يوجد طلاب مسجلون.</p>
              ) : (
                students.map((student) => (
                  <div key={student.id} className="rounded-lg border p-3 space-y-2">
                    <div className="font-medium">{student.name}</div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full gap-1"
                      onClick={() =>
                        navigate(
                          `/students/${student.id}/memorization?halaqaId=${circleId}&halaqaName=${encodeURIComponent(circle?.className ?? "")}`
                        )
                      }
                    >
                      <BookOpenCheck className="h-3.5 w-3.5" />
                      سجلات الحفظ
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">الأساتذة المسجلون</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">العدد</span>
              <Badge variant="secondary">{teachers.length}</Badge>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {teachers.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا يوجد أساتذة مسجلون.</p>
              ) : (
                teachers.map((teacher) => (
                  <div key={teacher.id} className="rounded-lg border p-3">
                    <div className="font-medium">{teacher.name}</div>
                    
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CircleDetailsPage;
