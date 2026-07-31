import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Semester {
  id: string;
  name: string;
}

interface Course {
  id: string;
  courseName: string;
}

interface Halaqa {
  id: string;
  className: string;
}

interface HalaqaStudent {
  enrollmentId: string;
  studentId: string;
  name: string;
  fatherName: string;
  lastName: string;
  fatherWork?: string;
  parentPhoneNumber?: string;
}

interface PagedResponse<T> {
  items?: T[];
  data?: T[];
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://alashmar.runasp.net/api";

interface AttendanceActionPageProps {
  mode: "attend" | "leave";
}

const AttendanceActionPage = ({ mode }: AttendanceActionPageProps) => {
  const isAttendMode = mode === "attend";

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [halaqas, setHalaqas] = useState<Halaqa[]>([]);

  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedHalaqaId, setSelectedHalaqaId] = useState("");

  const [students, setStudents] = useState<HalaqaStudent[]>([]);
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [semestersLoading, setSemestersLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [halaqasLoading, setHalaqasLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

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

  const fetchSemesters = async () => {
    try {
      setSemestersLoading(true);
      const response = await axiosClient.get<Semester[]>("/Semesters");
      setSemesters(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل الفصول");
    } finally {
      setSemestersLoading(false);
    }
  };

  const fetchCourses = async (semesterId: string) => {
    try {
      setCoursesLoading(true);
      const response = await axiosClient.get<Course[]>(
        `/courses/by-semester/${semesterId}`
      );
      setCourses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل الكورسات");
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchHalaqas = async (courseId: string) => {
    try {
      setHalaqasLoading(true);
      const response = await axiosClient.get<Halaqa[]>(
        `/halaqas/by-course/${courseId}`
      );
      setHalaqas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل الحلقات");
    } finally {
      setHalaqasLoading(false);
    }
  };

  const fetchStudents = async (halaqaId: string) => {
    try {
      setStudentsLoading(true);
      const response = await axiosClient.get<
  { data?: HalaqaStudent[] } | HalaqaStudent[]
>(
  `/attendance-management/halaqas/${halaqaId}/students`
);

      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : normalizeCollection(payload as PagedResponse<HalaqaStudent>);

      setStudents(list);
      setMarkedIds(new Set());
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل طلاب الحلقة");
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSemesterChange = (semesterId: string) => {
    setSelectedSemesterId(semesterId);
    setSelectedCourseId("");
    setSelectedHalaqaId("");
    setCourses([]);
    setHalaqas([]);
    setStudents([]);
    setMarkedIds(new Set());

    if (semesterId) {
      fetchCourses(semesterId);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedHalaqaId("");
    setHalaqas([]);
    setStudents([]);
    setMarkedIds(new Set());

    if (courseId) {
      fetchHalaqas(courseId);
    }
  };

  const handleHalaqaChange = (halaqaId: string) => {
    setSelectedHalaqaId(halaqaId);
    setStudents([]);
    setMarkedIds(new Set());

    if (halaqaId) {
      fetchStudents(halaqaId);
    }
  };

  const handleToggleStudent = async (student: HalaqaStudent) => {
    if (!selectedHalaqaId || markedIds.has(student.studentId) || pendingId) {
      return;
    }

    try {
      setPendingId(student.studentId);

      await axiosClient.post(
        `/attendance-management/students/${student.studentId}/halaqas/${selectedHalaqaId}/${mode}`
      );

      setMarkedIds((prev) => new Set(prev).add(student.studentId));
      toast.success(
        isAttendMode
          ? `تم تسجيل حضور ${student.name}`
          : `تم تسجيل خروج ${student.name}`
      );
    } catch (error) {
      console.error(error);
      toast.error(
        isAttendMode
          ? `فشل تسجيل حضور ${student.name}`
          : `فشل تسجيل خروج ${student.name}`
      );
    } finally {
      setPendingId(null);
    }
  };

  const markedCount = markedIds.size;

  return (
    <DashboardLayout
      title={isAttendMode ? "تسجيل حضور الطلاب" : "تسجيل خروج الطلاب"}
      subtitle={
        isAttendMode
          ? "اختر الفصل ثم الكورس ثم الحلقة لعرض الطلاب وتسجيل حضورهم"
          : "اختر الفصل ثم الكورس ثم الحلقة لعرض الطلاب وتسجيل خروجهم"
      }
    >
      <Card className="p-5 glass-card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>الفصل</Label>
            <Select
              value={selectedSemesterId || undefined}
              onValueChange={handleSemesterChange}
              disabled={semestersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الفصل" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>
                    {semester.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>الكورس</Label>
            <Select
              value={selectedCourseId || undefined}
              onValueChange={handleCourseChange}
              disabled={!selectedSemesterId || coursesLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedSemesterId ? "اختر الفصل أولاً" : "اختر الكورس"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.courseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>الحلقة</Label>
            <Select
              value={selectedHalaqaId || undefined}
              onValueChange={handleHalaqaChange}
              disabled={!selectedCourseId || halaqasLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedCourseId ? "اختر الكورس أولاً" : "اختر الحلقة"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {halaqas.map((halaqa) => (
                  <SelectItem key={halaqa.id} value={halaqa.id}>
                    {halaqa.className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedHalaqaId && (
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">إجمالي الطلاب</p>
              <p className="text-2xl font-bold">{students.length}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">
                {isAttendMode ? "تم تسجيل حضورهم" : "تم تسجيل خروجهم"}
              </p>
              <p className="text-2xl font-bold text-primary">{markedCount}</p>
            </div>
          </div>
        )}
      </Card>

      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-right font-semibold">#</th>
                <th className="px-4 py-3 text-right font-semibold">الاسم</th>
                <th className="px-4 py-3 text-right font-semibold">اسم الأب</th>
                <th className="px-4 py-3 text-right font-semibold">الكنية</th>
                <th className="px-4 py-3 text-center font-semibold">
                  {isAttendMode ? "حاضر" : "خرج"}
                </th>
              </tr>
            </thead>
            <tbody>
              {!selectedHalaqaId && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    اختر الفصل ثم الكورس ثم الحلقة لعرض الطلاب.
                  </td>
                </tr>
              )}

              {selectedHalaqaId && studentsLoading && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline ml-2" />
                    جارٍ تحميل الطلاب…
                  </td>
                </tr>
              )}

              {selectedHalaqaId && !studentsLoading && students.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    لا يوجد طلاب مسجلون في هذه الحلقة.
                  </td>
                </tr>
              )}

              {!studentsLoading &&
                students.map((student, index) => {
                  const isMarked = markedIds.has(student.studentId);
                  const isPending = pendingId === student.studentId;

                  return (
                    <tr
                      key={student.enrollmentId}
                      className="border-t border-border/50 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">{student.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{student.fatherName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{student.lastName}</td>
                      <td className="px-4 py-3 text-center">
                        {isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground inline" />
                        ) : (
                          <Checkbox
                            checked={isMarked}
                            disabled={isMarked}
                            onCheckedChange={() => handleToggleStudent(student)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default AttendanceActionPage;