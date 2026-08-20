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
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

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

interface TeacherRow {
  id: string;
  name: string;
  fatherName?: string;
  motherName?: string;
  email?: string | null;
}

interface PagedResponse<T> {
  items?: T[];
  data?: T[];
}

// عنصر واحد من استجابة /attendance-management/teachers/{teacherId}/attendance-status
// يمثل حالة الأستاذ في إحدى الحلقات المسجل بها (وليس بالضرورة الحلقة الحالية فقط)
interface TeacherAttendanceStatusItem {
  halaqaId: string;
  halaqaName: string;
  courseId: string;
  courseName: string;
  semesterId: string;
  semesterName: string;
  enrollmentId: string;
  status: string; // "Online" | "Absent" | ...
  startTime: string | null;
  endTime: string | null;
}

interface TeacherAttendanceStatusResponse {
  data: TeacherAttendanceStatusItem[];
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://alashmar.runasp.net/api";

interface TeacherAttendanceActionPageProps {
  mode: "attend" | "leave";
}

const TeacherAttendanceActionPage = ({ mode }: TeacherAttendanceActionPageProps) => {
  const isAttendMode = mode === "attend";

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [halaqas, setHalaqas] = useState<Halaqa[]>([]);

  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedHalaqaId, setSelectedHalaqaId] = useState("");

  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  // teacherId → enrollmentId (لهذه الحلقة تحديدًا)، مأخوذ من عنصر attendance-status المطابق لـ halaqaId
  const [enrollmentByTeacher, setEnrollmentByTeacher] = useState<Map<string, string>>(
    new Map()
  );
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  // الأساتذة الذين حالتهم الحالية Online في هذه الحلقة تحديدًا
  const [onlineTeacherIds, setOnlineTeacherIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [semestersLoading, setSemestersLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [halaqasLoading, setHalaqasLoading] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(false);

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
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.items)) return response.items;
    if (Array.isArray(response.data)) return response.data;
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

  // 1) جلب الأساتذة المسجلين في الحلقة عبر /teachers/filtered?classId=...
  // 2) لكل أستاذ: جلب حالته الحالية عبر
  //    /attendance-management/teachers/{teacherId}/attendance-status
  //    والتي تُرجع مصفوفة من كل حلقاته مع status/enrollmentId لكل حلقة،
  //    فنستخرج منها العنصر المطابق لـ halaqaId المختارة حاليًا فقط.
  const fetchTeachersAndStatuses = async (halaqaId: string) => {
    try {
      setTeachersLoading(true);

      const teachersResponse = await axiosClient.get<
        TeacherRow[] | PagedResponse<TeacherRow>
      >("/teachers/filtered", {
        params: { pageNumber: 1, pageSize: 100, classId: halaqaId },
      });

      const teacherList = normalizeCollection(teachersResponse.data);
      setTeachers(teacherList);

      const statusResults = await Promise.allSettled(
        teacherList.map((teacher) =>
          axiosClient.get<TeacherAttendanceStatusResponse>(
            `/attendance-management/teachers/${teacher.id}/attendance-status`
          )
        )
      );

      const enrollmentMap = new Map<string, string>();
      const online = new Set<string>();

      statusResults.forEach((result, index) => {
        if (result.status !== "fulfilled") return;

        const items = Array.isArray(result.value.data?.data) ? result.value.data.data : [];
        const matchForThisHalaqa = items.find((item) => item.halaqaId === halaqaId);

        if (matchForThisHalaqa) {
          enrollmentMap.set(teacherList[index].id, matchForThisHalaqa.enrollmentId);

          if (matchForThisHalaqa.status === "Online") {
            online.add(teacherList[index].id);
          }
        }
      });

      setEnrollmentByTeacher(enrollmentMap);
      setOnlineTeacherIds(online);

      // في وضع تسجيل الحضور: من هم أونلاين بالفعل تُعرض لهم علامة الصح مباشرة
      if (isAttendMode) {
        setMarkedIds(new Set(online));
      }
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل بيانات الأساتذة");
      setTeachers([]);
      setEnrollmentByTeacher(new Map());
      setOnlineTeacherIds(new Set());
    } finally {
      setTeachersLoading(false);
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
    setTeachers([]);
    setEnrollmentByTeacher(new Map());
    setMarkedIds(new Set());
    setOnlineTeacherIds(new Set());

    if (semesterId) {
      fetchCourses(semesterId);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedHalaqaId("");
    setHalaqas([]);
    setTeachers([]);
    setEnrollmentByTeacher(new Map());
    setMarkedIds(new Set());
    setOnlineTeacherIds(new Set());

    if (courseId) {
      fetchHalaqas(courseId);
    }
  };

  const handleHalaqaChange = (halaqaId: string) => {
    setSelectedHalaqaId(halaqaId);
    setTeachers([]);
    setEnrollmentByTeacher(new Map());
    setMarkedIds(new Set());
    setOnlineTeacherIds(new Set());

    if (halaqaId) {
      fetchTeachersAndStatuses(halaqaId);
    }
  };

  const handleToggleTeacher = async (teacher: TeacherRow) => {
    const enrollmentId = enrollmentByTeacher.get(teacher.id);

    if (!enrollmentId) {
      toast.error(`لا يوجد تسجيل لهذا الأستاذ في الحلقة المحددة: ${teacher.name}`);
      return;
    }

    if (markedIds.has(teacher.id) || pendingId) {
      return;
    }

    try {
      setPendingId(teacher.id);

      await axiosClient.post(
        `/attendance-management/teachers/enrollment/${enrollmentId}/${mode}`
      );

      setMarkedIds((prev) => new Set(prev).add(teacher.id));

      // تحديث حالة الأونلاين محليًا بعد نجاح العملية
      setOnlineTeacherIds((prev) => {
        const next = new Set(prev);
        if (isAttendMode) {
          next.add(teacher.id);
        } else {
          next.delete(teacher.id);
        }
        return next;
      });

      toast.success(
        isAttendMode ? `تم تسجيل حضور ${teacher.name}` : `تم تسجيل خروج ${teacher.name}`
      );
    } catch (error) {
      console.error(error);
      toast.error(
        isAttendMode ? `فشل تسجيل حضور ${teacher.name}` : `فشل تسجيل خروج ${teacher.name}`
      );
    } finally {
      setPendingId(null);
    }
  };

  // في وضع تسجيل الحضور تظهر كل قائمة الأساتذة
  // في وضع تسجيل الخروج تظهر فقط الأساتذة الذين حالتهم أونلاين حاليًا في هذه الحلقة
  const displayedTeachers = isAttendMode
    ? teachers
    : teachers.filter((teacher) => onlineTeacherIds.has(teacher.id));

  const markedCount = markedIds.size;

  return (
    <DashboardLayout
      title={isAttendMode ? "تسجيل حضور الأساتذة" : "تسجيل خروج الأساتذة"}
      subtitle={
        isAttendMode
          ? "اختر الفصل ثم الكورس ثم الحلقة لعرض الأساتذة وتسجيل حضورهم"
          : "اختر الفصل ثم الكورس ثم الحلقة لعرض الأساتذة الحاضرين حاليًا وتسجيل خروجهم"
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
                  placeholder={!selectedSemesterId ? "اختر الفصل أولاً" : "اختر الكورس"}
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
                  placeholder={!selectedCourseId ? "اختر الكورس أولاً" : "اختر الحلقة"}
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
              <p className="text-xs text-muted-foreground">
                {isAttendMode ? "إجمالي الأساتذة" : "الحاضرون حالياً"}
              </p>
              <p className="text-2xl font-bold">{displayedTeachers.length}</p>
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
                <th className="px-4 py-3 text-right font-semibold">البريد الإلكتروني</th>
                <th className="px-4 py-3 text-center font-semibold">
                  {isAttendMode ? "حاضر" : "خرج"}
                </th>
              </tr>
            </thead>
            <tbody>
              {!selectedHalaqaId && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    اختر الفصل ثم الكورس ثم الحلقة لعرض الأساتذة.
                  </td>
                </tr>
              )}

              {selectedHalaqaId && teachersLoading && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline ml-2" />
                    جارٍ تحميل الأساتذة…
                  </td>
                </tr>
              )}

              {selectedHalaqaId && !teachersLoading && displayedTeachers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    {isAttendMode
                      ? "لا يوجد أساتذة مسجلون في هذه الحلقة."
                      : "لا يوجد أساتذة حاضرون حالياً في هذه الحلقة."}
                  </td>
                </tr>
              )}

              {!teachersLoading &&
                displayedTeachers.map((teacher, index) => {
                  const isMarked = markedIds.has(teacher.id);
                  const isPending = pendingId === teacher.id;
                  const hasEnrollment = enrollmentByTeacher.has(teacher.id);

                  return (
                    <tr
                      key={teacher.id}
                      className="border-t border-border/50 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">{teacher.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {teacher.fatherName || "-"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {teacher.email || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground inline" />
                        ) : isMarked ? (
                          <span
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                            title={isAttendMode ? "تم تسجيل الحضور" : "تم تسجيل الخروج"}
                          >
                            <Check className="h-4 w-4" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleTeacher(teacher)}
                            disabled={!hasEnrollment}
                            aria-label={isAttendMode ? "تسجيل حضور" : "تسجيل خروج"}
                            title={
                              !hasEnrollment
                                ? "لا يوجد تسجيل لهذا الأستاذ في هذه الحلقة"
                                : undefined
                            }
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-muted-foreground/40 hover:border-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

export default TeacherAttendanceActionPage;

