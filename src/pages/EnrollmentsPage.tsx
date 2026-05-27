import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Halaqa {
  id: string;
  className: string;
}

interface StudentBrief {
  id: string;
  name: string;
}

interface TeacherBrief {
  id: string;
  name: string;
}

interface PagedResponse<T> {
  items?: T[];
  data?: T[];
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://alashmar.runasp.net/api";

const emptyStudentEnrollmentPayload = {
  classId: "",
  studentId: "",
};

const emptyTeacherEnrollmentPayload = {
  classId: "",
  teacherId: "",
  isMainTeacher: false,
};

const EnrollmentsPage = () => {
  const [circles, setCircles] = useState<Halaqa[]>([]);
  const [studentOptions, setStudentOptions] = useState<StudentBrief[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<TeacherBrief[]>([]);

  const [studentEnrollmentForm, setStudentEnrollmentForm] =
    useState(emptyStudentEnrollmentPayload);

  const [teacherEnrollmentForm, setTeacherEnrollmentForm] =
    useState(emptyTeacherEnrollmentPayload);

  const [studentEnrollmentLoading, setStudentEnrollmentLoading] =
    useState(false);

  const [teacherEnrollmentLoading, setTeacherEnrollmentLoading] =
    useState(false);

  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

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

  const fetchCircles = async () => {
    try {
      const response = await axiosClient.get<Halaqa[]>("/halaqas");
      setCircles(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل الحلقات");
    }
  };

  const fetchStudentOptions = async () => {
    try {
      const response = await axiosClient.get<
        StudentBrief[] | PagedResponse<StudentBrief>
      >("/students/filtered", {
        params: {
          pageNumber: 1,
          pageSize: 200,
        },
      });

      setStudentOptions(normalizeCollection(response.data));
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل قائمة الطلاب");
    }
  };

  const fetchTeacherOptions = async () => {
    try {
      const response = await axiosClient.get<
        TeacherBrief[] | PagedResponse<TeacherBrief>
      >("/teachers/filtered", {
        params: {
          pageNumber: 1,
          pageSize: 200,
        },
      });

      setTeacherOptions(normalizeCollection(response.data));
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل قائمة الأساتذة");
    }
  };

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoadingOptions(true);
        await Promise.all([
          fetchCircles(),
          fetchStudentOptions(),
          fetchTeacherOptions(),
        ]);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    void fetchOptions();
  }, []);

  const handleEnrollStudent = async () => {
    if (!studentEnrollmentForm.classId || !studentEnrollmentForm.studentId) {
      toast.error("اختر الحلقة والطالب أولاً");
      return;
    }

    try {
      setStudentEnrollmentLoading(true);

      await axiosClient.post("/StudentEnrollment", {
        studentId: studentEnrollmentForm.studentId,
        classId: studentEnrollmentForm.classId,
      });

      toast.success("تم تسجيل الطالب في الحلقة");
      setStudentEnrollmentForm(emptyStudentEnrollmentPayload);
    } catch (error) {
      console.error(error);
      toast.error("فشل تسجيل الطالب");
    } finally {
      setStudentEnrollmentLoading(false);
    }
  };

  const handleEnrollTeacher = async () => {
    if (!teacherEnrollmentForm.classId || !teacherEnrollmentForm.teacherId) {
      toast.error("اختر الحلقة والأستاذ أولاً");
      return;
    }

    try {
      setTeacherEnrollmentLoading(true);

      await axiosClient.post(
        `/teachers/${teacherEnrollmentForm.teacherId}/enrollments`,
        {
          classId: teacherEnrollmentForm.classId,
          isMainTeacher: teacherEnrollmentForm.isMainTeacher,
        }
      );

      toast.success("تم تسجيل الأستاذ في الحلقة");
      setTeacherEnrollmentForm(emptyTeacherEnrollmentPayload);
    } catch (error) {
      console.error(error);
      toast.error("فشل تسجيل الأستاذ");
    } finally {
      setTeacherEnrollmentLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="التسجيلات"
      subtitle="تسجيل الطلاب والأساتذة ضمن الحلقات"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-bold">تسجيل طالب في حلقة</h3>

          <div>
            <Label>الحلقة</Label>
            <select
              className="w-full border rounded-md h-10 px-3 mt-1"
              value={studentEnrollmentForm.classId}
              onChange={(e) =>
                setStudentEnrollmentForm({
                  ...studentEnrollmentForm,
                  classId: e.target.value,
                })
              }
              disabled={isLoadingOptions}
            >
              <option value="">اختر الحلقة</option>
              {circles.map((circle) => (
                <option key={circle.id} value={circle.id}>
                  {circle.className}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>الطالب</Label>
            <select
              className="w-full border rounded-md h-10 px-3 mt-1"
              value={studentEnrollmentForm.studentId}
              onChange={(e) =>
                setStudentEnrollmentForm({
                  ...studentEnrollmentForm,
                  studentId: e.target.value,
                })
              }
              disabled={isLoadingOptions}
            >
              <option value="">اختر الطالب</option>
              {studentOptions.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleEnrollStudent}
            disabled={studentEnrollmentLoading || isLoadingOptions}
            className="w-full"
          >
            {studentEnrollmentLoading ? "جارٍ التسجيل..." : "تسجيل الطالب"}
          </Button>
        </div>

        <div className="glass-card rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-bold">تسجيل أستاذ في حلقة</h3>

          <div>
            <Label>الحلقة</Label>
            <select
              className="w-full border rounded-md h-10 px-3 mt-1"
              value={teacherEnrollmentForm.classId}
              onChange={(e) =>
                setTeacherEnrollmentForm({
                  ...teacherEnrollmentForm,
                  classId: e.target.value,
                })
              }
              disabled={isLoadingOptions}
            >
              <option value="">اختر الحلقة</option>
              {circles.map((circle) => (
                <option key={circle.id} value={circle.id}>
                  {circle.className}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>الأستاذ</Label>
            <select
              className="w-full border rounded-md h-10 px-3 mt-1"
              value={teacherEnrollmentForm.teacherId}
              onChange={(e) =>
                setTeacherEnrollmentForm({
                  ...teacherEnrollmentForm,
                  teacherId: e.target.value,
                })
              }
              disabled={isLoadingOptions}
            >
              <option value="">اختر الأستاذ</option>
              {teacherOptions.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={teacherEnrollmentForm.isMainTeacher}
              onChange={(e) =>
                setTeacherEnrollmentForm({
                  ...teacherEnrollmentForm,
                  isMainTeacher: e.target.checked,
                })
              }
              disabled={isLoadingOptions}
            />
            تعيين كأستاذ أساسي للحلقة
          </label>

          <Button
            onClick={handleEnrollTeacher}
            disabled={teacherEnrollmentLoading || isLoadingOptions}
            className="w-full"
          >
            {teacherEnrollmentLoading ? "جارٍ التسجيل..." : "تسجيل الأستاذ"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EnrollmentsPage;
