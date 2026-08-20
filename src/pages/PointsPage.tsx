import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import Pagination from "@/components/ui/pagination";

import {
  Award,
  Plus,
  Pencil,
  Trash2,
  Trophy,
  Layers,
  ListOrdered,
  Minus,
  Loader2,
} from "lucide-react";

import { toast } from "sonner";

import {
  getPointCategories,
  createPointCategory,
  updatePointCategory,
  deletePointCategory,
  getPointsPaged,
  deletePoint,
  addStudentAssessment,
  getTopStudentsReport,
  getPointsByCategoryReport,
  type PointCategoryDto,
  type PointDto,
  type TopStudentPointDto,
  type PointsByCategoryDto,
} from "@/lib/pointsApi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://alashmar.runasp.net/api";

const ALL_SEMESTERS = "all";
const PAGE_SIZE = 10;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Semester {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

interface Course {
  id: string;
  courseName: string;
  semesterId: string;
}

interface Halaqa {
  id: string;
  className: string;
  courseId: string;
  isActive?: boolean;
}

interface TeacherEnrollment {
  id?: string;
  teacherId?: string;
  classId?: string;
  isMainTeacher?: boolean;
}

interface TeacherBrief {
  id: string;
  name: string;
  fatherName?: string;
  classTeacherEnrollments?: TeacherEnrollment[];
}

interface StudentBrief {
  id?: string;
  studentId?: string;

  name?: string;
  studentName?: string;

  fatherName?: string;

  student?: {
    id?: string;
    name?: string;
    fatherName?: string;
  };
}

interface PagedResponse<T> {
  items?: T[];
  data?: T[];
  totalItems?: number;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

const normalizeCollection = <T,>(
  response: T[] | PagedResponse<T>
): T[] => {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    response &&
    Array.isArray(response.items)
  ) {
    return response.items;
  }

  if (
    response &&
    Array.isArray(response.data)
  ) {
    return response.data;
  }

  return [];
};

const formatDate = (
  date?: string | null
) => {
  if (!date) return "-";

  const parsed = new Date(date);

  if (
    Number.isNaN(parsed.getTime())
  ) {
    return "-";
  }

  return parsed.toLocaleDateString(
    "ar-EG",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
};

const emptyCategoryForm = {
  name: "",
  description: "",
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const PointsPage = () => {
  // ───────────────────────────────────────────
  // Lookup data
  // ───────────────────────────────────────────

  const [semesters, setSemesters] =
    useState<Semester[]>([]);

  const [courses, setCourses] =
    useState<Course[]>([]);

  const [halaqas, setHalaqas] =
    useState<Halaqa[]>([]);

  const [teachers, setTeachers] =
    useState<TeacherBrief[]>([]);

  const [halaqaStudents, setHalaqaStudents] =
    useState<StudentBrief[]>([]);

  const [categories, setCategories] =
    useState<PointCategoryDto[]>([]);

  const [lookupsLoading, setLookupsLoading] =
    useState(false);

  const [coursesLoading, setCoursesLoading] =
    useState(false);

  const [halaqasLoading, setHalaqasLoading] =
    useState(false);

  const [teachersLoading, setTeachersLoading] =
    useState(false);

  const [studentsLoading, setStudentsLoading] =
    useState(false);

  // ───────────────────────────────────────────
  // Award form
  // ───────────────────────────────────────────

  const [awardSemesterId, setAwardSemesterId] =
    useState<string>("");

  const [awardCourseId, setAwardCourseId] =
    useState<string>("");

  const [awardHalaqaId, setAwardHalaqaId] =
    useState<string>("");

  const [awardTeacherId, setAwardTeacherId] =
    useState<string>("");

  const [awardStudentId, setAwardStudentId] =
    useState<string>("");

  const [awardCategoryId, setAwardCategoryId] =
    useState<string>("");

  const [awardPointValue, setAwardPointValue] =
    useState<string>("");

  const [awardNotes, setAwardNotes] =
    useState<string>("");

  const [awardSaving, setAwardSaving] =
    useState(false);

  // ───────────────────────────────────────────
  // Points log
  // ───────────────────────────────────────────

  const [pointsList, setPointsList] =
    useState<PointDto[]>([]);

  const [pointsLoading, setPointsLoading] =
    useState(false);

  const [pointsPage, setPointsPage] =
    useState(1);

  const [
    pointsTotalPages,
    setPointsTotalPages,
  ] = useState(1);

  const [
    pointsTotalCount,
    setPointsTotalCount,
  ] = useState(0);

  const [
    deletingPointId,
    setDeletingPointId,
  ] = useState<string | null>(null);

  // ───────────────────────────────────────────
  // Categories
  // ───────────────────────────────────────────

  const [
    categoryDialogOpen,
    setCategoryDialogOpen,
  ] = useState(false);

  const [
    editingCategory,
    setEditingCategory,
  ] = useState<PointCategoryDto | null>(
    null
  );

  const [
    categoryForm,
    setCategoryForm,
  ] = useState(emptyCategoryForm);

  const [
    categorySaving,
    setCategorySaving,
  ] = useState(false);

  const [
    categoryDeleteTarget,
    setCategoryDeleteTarget,
  ] = useState<PointCategoryDto | null>(
    null
  );

  const [
    categoryDeleting,
    setCategoryDeleting,
  ] = useState(false);

  // ───────────────────────────────────────────
  // Leaderboard
  // ───────────────────────────────────────────

  const [
    leaderboardSemesterId,
    setLeaderboardSemesterId,
  ] = useState(ALL_SEMESTERS);

  const [
    leaderboardTop,
    setLeaderboardTop,
  ] = useState("10");

  const [topStudents, setTopStudents] =
    useState<TopStudentPointDto[]>([]);

  const [
    leaderboardLoading,
    setLeaderboardLoading,
  ] = useState(false);

  // ───────────────────────────────────────────
  // Category report
  // ───────────────────────────────────────────

  const [
    reportSemesterId,
    setReportSemesterId,
  ] = useState(ALL_SEMESTERS);

  const [
    reportFromDate,
    setReportFromDate,
  ] = useState("");

  const [
    reportToDate,
    setReportToDate,
  ] = useState("");

  const [
    byCategoryData,
    setByCategoryData,
  ] = useState<
    PointsByCategoryDto[]
  >([]);

  const [
    byCategoryLoading,
    setByCategoryLoading,
  ] = useState(false);

  // ───────────────────────────────────────────
  // Axios
  // ───────────────────────────────────────────

  const axiosClient = useMemo(() => {
    const token =
      localStorage.getItem("token");

    return axios.create({
      baseURL: API_BASE_URL,

      headers: {
        "Content-Type":
          "application/json",

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),
      },
    });
  }, []);

  // ───────────────────────────────────────────
  // Initial lookups
  // ───────────────────────────────────────────

  const fetchInitialLookups =
    async () => {
      try {
        setLookupsLoading(true);

        const [
          semestersRes,
          categoriesRes,
        ] =
          await Promise.allSettled([
            axiosClient.get<Semester[]>(
              "/Semesters/filtered"
            ),

            getPointCategories(
              axiosClient
            ),
          ]);

        if (
          semestersRes.status ===
          "fulfilled"
        ) {
          setSemesters(
            normalizeCollection(
              semestersRes.value.data
            )
          );
        } else {
          toast.error(
            "تعذر تحميل قائمة الفصول"
          );
        }

        if (
          categoriesRes.status ===
          "fulfilled"
        ) {
          setCategories(
            categoriesRes.value
          );
        } else {
          toast.error(
            "تعذر تحميل تصنيفات النقاط"
          );
        }
      } catch (error) {
        console.error(error);

        toast.error(
          "حدث خطأ أثناء تحميل البيانات"
        );
      } finally {
        setLookupsLoading(false);
      }
    };

  // ───────────────────────────────────────────
  // Fetch courses
  // ───────────────────────────────────────────

  const fetchCourses =
    async () => {
      try {
        setCoursesLoading(true);

        const response =
          await axiosClient.get<
            Course[]
          >("/courses");

        setCourses(
          normalizeCollection(
            response.data
          )
        );
      } catch (error) {
        console.error(error);

        toast.error(
          "تعذر تحميل الكورسات"
        );

        setCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    };

  // ───────────────────────────────────────────
  // Fetch halaqas
  // ───────────────────────────────────────────

  const fetchHalaqas =
    async () => {
      try {
        setHalaqasLoading(true);

        const response =
          await axiosClient.get<
            Halaqa[]
          >("/halaqas");

        setHalaqas(
          normalizeCollection(
            response.data
          )
        );
      } catch (error) {
        console.error(error);

        toast.error(
          "تعذر تحميل الحلقات"
        );

        setHalaqas([]);
      } finally {
        setHalaqasLoading(false);
      }
    };

  // ───────────────────────────────────────────
  // Fetch teachers
  // ───────────────────────────────────────────

  const fetchTeachers =
    async () => {
      try {
        setTeachersLoading(true);

        const response =
          await axiosClient.get<
            TeacherBrief[] |
            PagedResponse<TeacherBrief>
          >(
            "/teachers/filtered",
            {
              params: {
                pageNumber: 1,
                pageSize: 500,
              },
            }
          );

        setTeachers(
          normalizeCollection(
            response.data
          )
        );
      } catch (error) {
        console.error(error);

        toast.error(
          "تعذر تحميل قائمة الأساتذة"
        );

        setTeachers([]);
      } finally {
        setTeachersLoading(false);
      }
    };

  // ───────────────────────────────────────────
  // Fetch students by halaqa
  // ───────────────────────────────────────────

  const fetchHalaqaStudents =
    async (
      halaqaId: string
    ) => {
      if (!halaqaId) {
        setHalaqaStudents([]);
        return;
      }

      try {
        setStudentsLoading(true);

        const response =
          await axiosClient.get(
            `/attendance-management/halaqas/${halaqaId}/students`
          );

        console.log(
          "HALAQA STUDENTS RESPONSE:",
          response.data
        );

        const studentsData =
          normalizeCollection<
            StudentBrief
          >(response.data);

        setHalaqaStudents(
          studentsData
        );
      } catch (error) {
        console.error(error);

        toast.error(
          "تعذر تحميل طلاب الحلقة"
        );

        setHalaqaStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };

  // ───────────────────────────────────────────
  // Fetch points
  // ───────────────────────────────────────────

  const fetchPoints = async (
    page = pointsPage
  ) => {
    try {
      setPointsLoading(true);

      const result =
        await getPointsPaged(
          axiosClient,
          page,
          PAGE_SIZE
        );

      setPointsList(
        result.items ?? []
      );

      setPointsTotalCount(
        result.totalCount ?? 0
      );

      setPointsTotalPages(
        result.totalPages ??
          Math.max(
            1,
            Math.ceil(
              (result.totalCount ?? 0) /
                PAGE_SIZE
            )
          )
      );
    } catch (error) {
      console.error(error);

      toast.error(
        "تعذر تحميل سجل النقاط"
      );
    } finally {
      setPointsLoading(false);
    }
  };

  // ───────────────────────────────────────────
  // Initial loading
  // ───────────────────────────────────────────

  useEffect(() => {
    void fetchInitialLookups();
    void fetchCourses();
    void fetchHalaqas();
    void fetchTeachers();
    void fetchPoints(1);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───────────────────────────────────────────
  // Filtered courses
  // ───────────────────────────────────────────

  const filteredCourses =
    useMemo(() => {
      if (!awardSemesterId) {
        return [];
      }

      return courses.filter(
        (course) =>
          course.semesterId ===
          awardSemesterId
      );
    }, [
      courses,
      awardSemesterId,
    ]);

  // ───────────────────────────────────────────
  // Filtered halaqas
  // ───────────────────────────────────────────

  const filteredHalaqas =
    useMemo(() => {
      if (!awardCourseId) {
        return [];
      }

      return halaqas.filter(
        (halaqa) =>
          halaqa.courseId ===
          awardCourseId
      );
    }, [
      halaqas,
      awardCourseId,
    ]);

  // ───────────────────────────────────────────
  // Filtered teachers
  // ───────────────────────────────────────────

  const filteredTeachers =
    useMemo(() => {
      if (!awardHalaqaId) {
        return [];
      }

      return teachers.filter(
        (teacher) =>
          teacher.classTeacherEnrollments?.some(
            (enrollment) =>
              enrollment.classId ===
              awardHalaqaId
          )
      );
    }, [
      teachers,
      awardHalaqaId,
    ]);

  // ───────────────────────────────────────────
  // Reset when semester changes
  // ───────────────────────────────────────────

  const handleSemesterChange = (
    value: string
  ) => {
    setAwardSemesterId(value);

    setAwardCourseId("");
    setAwardHalaqaId("");
    setAwardTeacherId("");
    setAwardStudentId("");

    setHalaqaStudents([]);
  };

  // ───────────────────────────────────────────
  // Reset when course changes
  // ───────────────────────────────────────────

  const handleCourseChange = (
    value: string
  ) => {
    setAwardCourseId(value);

    setAwardHalaqaId("");
    setAwardTeacherId("");
    setAwardStudentId("");

    setHalaqaStudents([]);
  };

  // ───────────────────────────────────────────
  // Reset when halaqa changes
  // ───────────────────────────────────────────

  const handleHalaqaChange = (
    value: string
  ) => {
    setAwardHalaqaId(value);

    setAwardTeacherId("");
    setAwardStudentId("");

    setHalaqaStudents([]);

    void fetchHalaqaStudents(
      value
    );
  };

  // ───────────────────────────────────────────
  // Reset form
  // ───────────────────────────────────────────

  const resetAwardForm = () => {
    setAwardSemesterId("");
    setAwardCourseId("");
    setAwardHalaqaId("");
    setAwardTeacherId("");
    setAwardStudentId("");
    setAwardCategoryId("");
    setAwardPointValue("");
    setAwardNotes("");

    setHalaqaStudents([]);
  };

  // ───────────────────────────────────────────
  // Award / deduct points
  // ───────────────────────────────────────────

  const handleAward = async (
    sign: 1 | -1 = 1
  ) => {
    console.log(
      "Selected values:",
      {
        awardSemesterId,
        awardCourseId,
        awardHalaqaId,
        awardTeacherId,
        awardStudentId,
        awardCategoryId,
        awardPointValue,
      }
    );

    if (!awardSemesterId) {
      toast.error(
        "يرجى اختيار الفصل"
      );

      return;
    }

    if (!awardCourseId) {
      toast.error(
        "يرجى اختيار الكورس"
      );

      return;
    }

    if (!awardHalaqaId) {
      toast.error(
        "يرجى اختيار الحلقة"
      );

      return;
    }

    if (!awardTeacherId) {
      toast.error(
        "يرجى اختيار الأستاذ"
      );

      return;
    }

    if (
      !awardStudentId ||
      awardStudentId.trim() === ""
    ) {
      toast.error(
        "يرجى اختيار الطالب"
      );

      return;
    }

    const rawValue = Math.abs(
      Number(awardPointValue)
    );

    if (
      !Number.isFinite(
        rawValue
      ) ||
      rawValue <= 0
    ) {
      toast.error(
        "يرجى إدخال عدد نقاط صحيح"
      );

      return;
    }

    try {
      setAwardSaving(true);

      const payload = {
        studentId:
          awardStudentId,

        courseId:
          awardCourseId,

        classId:
          awardHalaqaId,

        smesterId:
          awardSemesterId,

        pointValue:
          rawValue * sign,

        title:
          null,

        notes:
          awardNotes.trim() ||
          null,

        categoryId:
          awardCategoryId ||
          null,

        givenByTeacherId:
          awardTeacherId ||
          null,
      };

      console.log(
        "Sending assessment payload:",
        payload
      );

      await addStudentAssessment(
        axiosClient,
        payload
      );

      toast.success(
        sign === 1
          ? "تمت إضافة النقاط بنجاح"
          : "تم خصم النقاط بنجاح"
      );

      resetAwardForm();

      setPointsPage(1);

      void fetchPoints(1);
    } catch (
      error: unknown
    ) {
      console.error(
        "Assessment error:",
        error
      );

      if (
        axios.isAxiosError(error)
      ) {
        console.error(
          "API Response:",
          error.response?.data
        );

        const responseData =
          error.response?.data;

        const message =
          typeof responseData ===
          "string"
            ? responseData
            : responseData?.message ||
              responseData?.title ||
              "حدث خطأ أثناء حفظ النقاط";

        toast.error(message);
      } else {
        toast.error(
          "حدث خطأ أثناء حفظ النقاط"
        );
      }
    } finally {
      setAwardSaving(false);
    }
  };

  // ───────────────────────────────────────────
  // Delete point
  // ───────────────────────────────────────────

  const handleDeletePoint =
    async (
      id: string
    ) => {
      try {
        setDeletingPointId(id);

        await deletePoint(
          axiosClient,
          id
        );

        toast.success(
          "تم حذف السجل بنجاح"
        );

        void fetchPoints(
          pointsPage
        );
      } catch (error) {
        console.error(error);

        toast.error(
          "فشل حذف السجل"
        );
      } finally {
        setDeletingPointId(null);
      }
    };

  const handlePointsPageChange = (
    page: number
  ) => {
    setPointsPage(page);

    void fetchPoints(page);
  };

  // ───────────────────────────────────────────
  // Categories CRUD
  // ───────────────────────────────────────────

  const openCreateCategory = () => {
    setEditingCategory(null);

    setCategoryForm(
      emptyCategoryForm
    );

    setCategoryDialogOpen(true);
  };

  const openEditCategory = (
    category: PointCategoryDto
  ) => {
    setEditingCategory(category);

    setCategoryForm({
      name:
        category.name,

      description:
        category.description ??
        "",
    });

    setCategoryDialogOpen(true);
  };

  const handleSaveCategory =
    async () => {
      if (
        !categoryForm.name.trim()
      ) {
        toast.error(
          "يرجى إدخال اسم التصنيف"
        );

        return;
      }

      try {
        setCategorySaving(true);

        if (editingCategory) {
          await updatePointCategory(
            axiosClient,
            editingCategory.id,
            {
              name:
                categoryForm.name.trim(),

              description:
                categoryForm.description.trim() ||
                null,
            }
          );

          toast.success(
            "تم تعديل التصنيف بنجاح"
          );
        } else {
          await createPointCategory(
            axiosClient,
            {
              name:
                categoryForm.name.trim(),

              description:
                categoryForm.description.trim() ||
                null,
            }
          );

          toast.success(
            "تمت إضافة التصنيف بنجاح"
          );
        }

        setCategoryDialogOpen(
          false
        );

        setEditingCategory(
          null
        );

        setCategoryForm(
          emptyCategoryForm
        );

        const updated =
          await getPointCategories(
            axiosClient
          );

        setCategories(updated);
      } catch (error) {
        console.error(error);

        toast.error(
          "حدث خطأ أثناء حفظ التصنيف"
        );
      } finally {
        setCategorySaving(false);
      }
    };

  const handleDeleteCategory =
    async () => {
      if (
        !categoryDeleteTarget
      ) {
        return;
      }

      try {
        setCategoryDeleting(
          true
        );

        await deletePointCategory(
          axiosClient,
          categoryDeleteTarget.id
        );

        toast.success(
          "تم حذف التصنيف بنجاح"
        );

        setCategoryDeleteTarget(
          null
        );

        const updated =
          await getPointCategories(
            axiosClient
          );

        setCategories(updated);
      } catch (error) {
        console.error(error);

        toast.error(
          "لا يمكن حذف هذا التصنيف، تأكد أنه غير مستخدم في سجلات النقاط"
        );
      } finally {
        setCategoryDeleting(
          false
        );
      }
    };

  // ───────────────────────────────────────────
  // Leaderboard
  // ───────────────────────────────────────────

  const fetchLeaderboard =
    async () => {
      try {
        setLeaderboardLoading(
          true
        );

        const data =
          await getTopStudentsReport(
            axiosClient,
            {
              semesterId:
                leaderboardSemesterId ===
                ALL_SEMESTERS
                  ? undefined
                  : leaderboardSemesterId,

              top:
                Number(
                  leaderboardTop
                ) || 10,
            }
          );

        setTopStudents(data);
      } catch (error) {
        console.error(error);

        toast.error(
          "تعذر تحميل لوحة الصدارة"
        );
      } finally {
        setLeaderboardLoading(
          false
        );
      }
    };

  useEffect(() => {
    void fetchLeaderboard();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───────────────────────────────────────────
  // Category report
  // ───────────────────────────────────────────

  const fetchByCategoryReport =
    async () => {
      try {
        setByCategoryLoading(
          true
        );

        const data =
          await getPointsByCategoryReport(
            axiosClient,
            {
              semesterId:
                reportSemesterId ===
                ALL_SEMESTERS
                  ? undefined
                  : reportSemesterId,

              fromDate:
                reportFromDate ||
                undefined,

              toDate:
                reportToDate ||
                undefined,
            }
          );

        setByCategoryData(data);
      } catch (error) {
        console.error(error);

        toast.error(
          "تعذر تحميل تقرير النقاط حسب التصنيف"
        );
      } finally {
        setByCategoryLoading(
          false
        );
      }
    };

  const maxCategoryTotal =
    Math.max(
      1,
      ...byCategoryData.map(
        (category) =>
          Math.abs(
            category.totalPoints
          )
      )
    );

  // ───────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────

  return (
    <DashboardLayout
      title="النقاط"
      subtitle="منح وخصم النقاط، وعرض السجل والتقارير"
    >
      <Tabs
        defaultValue="award"
        dir="rtl"
        className="space-y-4"
      >
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger
            value="award"
            className="gap-1.5"
          >
            <Award className="h-3.5 w-3.5" />
            منح نقاط
          </TabsTrigger>

          <TabsTrigger
            value="log"
            className="gap-1.5"
          >
            <ListOrdered className="h-3.5 w-3.5" />
            سجل النقاط
          </TabsTrigger>

          <TabsTrigger
            value="categories"
            className="gap-1.5"
          >
            <Layers className="h-3.5 w-3.5" />
            التصنيفات
          </TabsTrigger>

          <TabsTrigger
            value="leaderboard"
            className="gap-1.5"
          >
            <Trophy className="h-3.5 w-3.5" />
            الأعلى نقاطاً
          </TabsTrigger>
        </TabsList>

        {/* ══════════ منح / خصم نقاط ══════════ */}

        <TabsContent value="award">
          <div className="glass-card rounded-xl p-6 max-w-2xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* الفصل */}

              <div>
                <Label>
                  الفصل
                </Label>

                <Select
                  value={
                    awardSemesterId ||
                    ""
                  }
                  onValueChange={
                    handleSemesterChange
                  }
                  disabled={
                    lookupsLoading
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفصل" />
                  </SelectTrigger>

                  <SelectContent>
                    {semesters.map(
                      (semester) => (
                        <SelectItem
                          key={
                            semester.id
                          }
                          value={
                            String(
                              semester.id
                            )
                          }
                        >
                          {semester.name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* الكورس */}

              <div>
                <Label>
                  الكورس
                </Label>

                <Select
                  value={
                    awardCourseId ||
                    ""
                  }
                  onValueChange={
                    handleCourseChange
                  }
                  disabled={
                    !awardSemesterId ||
                    coursesLoading
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الكورس" />
                  </SelectTrigger>

                  <SelectContent>
                    {filteredCourses.map(
                      (course) => (
                        <SelectItem
                          key={
                            course.id
                          }
                          value={
                            String(
                              course.id
                            )
                          }
                        >
                          {
                            course.courseName
                          }
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* الحلقة */}

              <div>
                <Label>
                  الحلقة
                </Label>

                <Select
                  value={
                    awardHalaqaId ||
                    ""
                  }
                  onValueChange={
                    handleHalaqaChange
                  }
                  disabled={
                    !awardCourseId ||
                    halaqasLoading
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحلقة" />
                  </SelectTrigger>

                  <SelectContent>
                    {filteredHalaqas.map(
                      (halaqa) => (
                        <SelectItem
                          key={
                            halaqa.id
                          }
                          value={
                            String(
                              halaqa.id
                            )
                          }
                        >
                          {
                            halaqa.className
                          }
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* الأستاذ */}

              <div>
                <Label>
                  الأستاذ
                </Label>

                <Select
                  value={
                    awardTeacherId ||
                    ""
                  }
                  onValueChange={(
                    value
                  ) => {
                    setAwardTeacherId(
                      value || ""
                    );
                  }}
                  disabled={
                    !awardHalaqaId ||
                    teachersLoading
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأستاذ" />
                  </SelectTrigger>

                  <SelectContent>
                    {filteredTeachers.map(
                      (teacher) => (
                        <SelectItem
                          key={
                            teacher.id
                          }
                          value={
                            String(
                              teacher.id
                            )
                          }
                        >
                          {teacher.name}
                          {teacher.fatherName
                            ? ` — ${teacher.fatherName}`
                            : ""}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* الطالب */}

              <div>
                <Label>
                  اسم الطالب
                </Label>

                <Select
                  value={
                    awardStudentId ||
                    ""
                  }
                  onValueChange={(
                    value
                  ) => {
                    console.log(
                      "STUDENT SELECTED:",
                      value
                    );

                    setAwardStudentId(
                      value || ""
                    );
                  }}
                  disabled={
                    !awardHalaqaId ||
                    studentsLoading
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الطالب" />
                  </SelectTrigger>

                  <SelectContent>
                    {studentsLoading ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        جارٍ تحميل الطلاب...
                      </div>
                    ) : halaqaStudents.length ===
                      0 ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        لا يوجد طلاب في هذه الحلقة
                      </div>
                    ) : (
                      halaqaStudents.map(
                        (
                          student,
                          index
                        ) => {
                          const studentId =
                            student.studentId ??
                            student.id ??
                            student.student?.id ??
                            "";

                          const studentName =
                            student.studentName ??
                            student.name ??
                            student.student?.name ??
                            `طالب ${
                              index + 1
                            }`;

                          const fatherName =
                            student.fatherName ??
                            student.student
                              ?.fatherName ??
                            "";

                          if (
                            !studentId
                          ) {
                            console.warn(
                              "Student without valid ID:",
                              student
                            );

                            return null;
                          }

                          return (
                            <SelectItem
                              key={String(
                                studentId
                              )}
                              value={String(
                                studentId
                              )}
                            >
                              {
                                studentName
                              }

                              {fatherName
                                ? ` — ${fatherName}`
                                : ""}
                            </SelectItem>
                          );
                        }
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* التصنيف */}

              <div>
                <Label>
                  التصنيف
                  (اختياري)
                </Label>

                <Select
                  value={
                    awardCategoryId ||
                    ""
                  }
                  onValueChange={(
                    value
                  ) => {
                    setAwardCategoryId(
                      value || ""
                    );
                  }}
                  disabled={
                    lookupsLoading
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>

                  <SelectContent>
                    {categories.map(
                      (category) => (
                        <SelectItem
                          key={
                            category.id
                          }
                          value={
                            String(
                              category.id
                            )
                          }
                        >
                          {
                            category.name
                          }
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* عدد النقاط */}

              <div className="sm:col-span-2">
                <Label>
                  عدد النقاط
                </Label>

                <Input
                  type="number"
                  min={0}
                  value={
                    awardPointValue
                  }
                  onChange={(
                    event
                  ) =>
                    setAwardPointValue(
                      event.target.value
                    )
                  }
                  placeholder="مثال: 5"
                />
              </div>
            </div>

            {/* الملاحظات */}

            <div>
              <Label>
                ملاحظات
                (اختياري)
              </Label>

              <Textarea
                value={
                  awardNotes
                }
                onChange={(
                  event
                ) =>
                  setAwardNotes(
                    event.target.value
                  )
                }
                placeholder="سبب منح أو خصم النقاط"
              />
            </div>

            {/* الأزرار */}

            <div className="flex gap-3">
              <Button
                className="flex-1 gap-2"
                onClick={() =>
                  void handleAward(
                    1
                  )
                }
                disabled={
                  awardSaving
                }
              >
                <Plus className="h-4 w-4" />

                {awardSaving
                  ? "جارٍ الحفظ..."
                  : "إضافة نقاط"}
              </Button>

              <Button
                variant="destructive"
                className="flex-1 gap-2"
                onClick={() =>
                  void handleAward(
                    -1
                  )
                }
                disabled={
                  awardSaving
                }
              >
                <Minus className="h-4 w-4" />

                {awardSaving
                  ? "جارٍ الحفظ..."
                  : "خصم نقاط"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ══════════ سجل النقاط ══════════ */}

        <TabsContent
          value="log"
          className="space-y-3"
        >
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-4 text-right">
                      الطالب
                    </th>

                    <th className="p-4 text-right">
                      الأستاذ
                    </th>

                    <th className="p-4 text-right">
                      التصنيف
                    </th>

                    <th className="p-4 text-right">
                      النقاط
                    </th>

                    <th className="p-4 text-right">
                      ملاحظات
                    </th>

                    <th className="p-4 text-right">
                      التاريخ
                    </th>

                    <th className="p-4 text-right" />
                  </tr>
                </thead>

                <tbody>
                  {pointsLoading &&
                  pointsList.length ===
                    0 ? (
                    <tr>
                      <td
                        className="p-4 text-center text-muted-foreground"
                        colSpan={7}
                      >
                        <Loader2 className="h-5 w-5 animate-spin inline-block" />
                      </td>
                    </tr>
                  ) : pointsList.length ===
                    0 ? (
                    <tr>
                      <td
                        className="p-4 text-center text-muted-foreground"
                        colSpan={7}
                      >
                        لا توجد سجلات نقاط بعد.
                      </td>
                    </tr>
                  ) : (
                    pointsList.map(
                      (point) => (
                        <tr
                          key={
                            point.id
                          }
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-4 font-medium">
                            {
                              point.studentName ??
                              point.studentId
                            }
                          </td>

                          <td className="p-4 text-muted-foreground">
                            {
                              point.teacherName ??
                              "-"
                            }
                          </td>

                          <td className="p-4 text-muted-foreground">
                            {
                              point.categoryName ??
                              "-"
                            }
                          </td>

                          <td className="p-4">
                            <Badge
                              variant={
                                point.pointValue >=
                                0
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {point.pointValue >=
                              0
                                ? "+"
                                : ""}

                              {
                                point.pointValue
                              }
                            </Badge>
                          </td>

                          <td className="p-4 max-w-xs truncate text-muted-foreground">
                            {
                              point.notes ||
                              "-"
                            }
                          </td>

                          <td className="p-4 text-muted-foreground">
                            {formatDate(
                              point.createdAt
                            )}
                          </td>

                          <td className="p-4">
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={
                                deletingPointId ===
                                point.id
                              }
                              onClick={() =>
                                void handleDeletePoint(
                                  point.id
                                )
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5 ml-1" />

                              {deletingPointId ===
                              point.id
                                ? "..."
                                : "حذف"}
                            </Button>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              إجمالي السجلات:
              {" "}
              {
                pointsTotalCount
              }
            </p>

            <Pagination
              currentPage={
                pointsPage
              }
              totalPages={
                pointsTotalPages
              }
              onPageChange={
                handlePointsPageChange
              }
            />
          </div>
        </TabsContent>

        {/* ══════════ التصنيفات ══════════ */}

        <TabsContent
          value="categories"
          className="space-y-3"
        >
          <div className="flex justify-end">
            <Dialog
              open={
                categoryDialogOpen
              }
              onOpenChange={
                setCategoryDialogOpen
              }
            >
              <DialogTrigger
                asChild
              >
                <Button
                  className="gap-2"
                  onClick={
                    openCreateCategory
                  }
                >
                  <Plus className="h-4 w-4" />
                  إضافة تصنيف
                </Button>
              </DialogTrigger>

              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory
                      ? "تعديل تصنيف"
                      : "إضافة تصنيف"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="category-name">
                      الاسم
                    </Label>

                    <Input
                      id="category-name"
                      value={
                        categoryForm.name
                      }
                      onChange={(
                        event
                      ) =>
                        setCategoryForm({
                          ...categoryForm,
                          name:
                            event.target
                              .value,
                        })
                      }
                      placeholder="مثال: القرآن، الحديث، الحضور، السلوك"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category-description">
                      الوصف
                      (اختياري)
                    </Label>

                    <Textarea
                      id="category-description"
                      value={
                        categoryForm.description
                      }
                      onChange={(
                        event
                      ) =>
                        setCategoryForm({
                          ...categoryForm,
                          description:
                            event.target
                              .value,
                        })
                      }
                    />
                  </div>

                  <Button
                    onClick={
                      handleSaveCategory
                    }
                    disabled={
                      categorySaving
                    }
                    className="w-full"
                  >
                    {categorySaving
                      ? "جارٍ الحفظ..."
                      : editingCategory
                      ? "حفظ التعديلات"
                      : "إضافة"}
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
                    <th className="p-4 text-right">
                      الاسم
                    </th>

                    <th className="p-4 text-right">
                      الوصف
                    </th>

                    <th className="p-4 text-right" />
                  </tr>
                </thead>

                <tbody>
                  {lookupsLoading &&
                  categories.length ===
                    0 ? (
                    <tr>
                      <td
                        className="p-4 text-center text-muted-foreground"
                        colSpan={3}
                      >
                        جارٍ التحميل...
                      </td>
                    </tr>
                  ) : categories.length ===
                    0 ? (
                    <tr>
                      <td
                        className="p-4 text-center text-muted-foreground"
                        colSpan={3}
                      >
                        لا توجد تصنيفات بعد.
                      </td>
                    </tr>
                  ) : (
                    categories.map(
                      (category) => (
                        <tr
                          key={
                            category.id
                          }
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-4 font-medium">
                            {
                              category.name
                            }
                          </td>

                          <td className="p-4 text-muted-foreground">
                            {
                              category.description ||
                              "-"
                            }
                          </td>

                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  openEditCategory(
                                    category
                                  )
                                }
                              >
                                <Pencil className="h-3.5 w-3.5 ml-1" />
                                تعديل
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  setCategoryDeleteTarget(
                                    category
                                  )
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5 ml-1" />
                                حذف
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Dialog
            open={
              !!categoryDeleteTarget
            }
            onOpenChange={() =>
              setCategoryDeleteTarget(
                null
              )
            }
          >
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>
                  تأكيد الحذف
                </DialogTitle>
              </DialogHeader>

              <p>
                هل أنت متأكد من حذف تصنيف
                {" "}
                «
                {
                  categoryDeleteTarget?.name
                }
                »؟
              </p>

              <div className="flex gap-3 mt-4">
                <Button
                  variant="destructive"
                  onClick={
                    handleDeleteCategory
                  }
                  disabled={
                    categoryDeleting
                  }
                >
                  {categoryDeleting
                    ? "جارٍ الحذف..."
                    : "حذف"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    setCategoryDeleteTarget(
                      null
                    )
                  }
                >
                  إلغاء
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ══════════ لوحة الصدارة ══════════ */}

        <TabsContent
          value="leaderboard"
          className="space-y-6"
        >
          <div className="glass-card rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5">
              <div className="flex-1">
                <Label>
                  الفصل
                </Label>

                <Select
                  value={
                    leaderboardSemesterId
                  }
                  onValueChange={
                    setLeaderboardSemesterId
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفصل" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem
                      value={
                        ALL_SEMESTERS
                      }
                    >
                      كل الفصول
                    </SelectItem>

                    {semesters.map(
                      (
                        semester
                      ) => (
                        <SelectItem
                          key={
                            semester.id
                          }
                          value={
                            semester.id
                          }
                        >
                          {
                            semester.name
                          }
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-32">
                <Label>
                  العدد
                </Label>

                <Input
                  type="number"
                  min={1}
                  value={
                    leaderboardTop
                  }
                  onChange={(
                    event
                  ) =>
                    setLeaderboardTop(
                      event.target.value
                    )
                  }
                />
              </div>

              <Button
                onClick={() =>
                  void fetchLeaderboard()
                }
                disabled={
                  leaderboardLoading
                }
              >
                {leaderboardLoading
                  ? "جارٍ التحميل..."
                  : "تحديث"}
              </Button>
            </div>

            {topStudents.length >
            0 ? (
              <div className="space-y-3">
                {topStudents.map(
                  (
                    student,
                    index
                  ) => (
                    <div
                      key={
                        student.studentId
                      }
                      className="flex items-center justify-between rounded-lg border bg-background/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-muted text-muted-foreground"
                        >
                          {
                            index + 1
                          }
                        </span>

                        <span className="font-medium">
                          {
                            student.studentName
                          }
                        </span>
                      </div>

                      <Badge>
                        {
                          student.totalPoints
                        }
                        {" "}
                        نقطة
                      </Badge>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                {leaderboardLoading
                  ? "جارٍ التحميل..."
                  : "لا توجد بيانات متاحة."}
              </p>
            )}
          </div>

          {/* تقرير حسب التصنيف */}

          <div className="glass-card rounded-xl p-5">
            <h3 className="font-bold mb-4">
              النقاط حسب التصنيف
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5">
              <div className="flex-1">
                <Label>
                  الفصل
                </Label>

                <Select
                  value={
                    reportSemesterId
                  }
                  onValueChange={
                    setReportSemesterId
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفصل" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem
                      value={
                        ALL_SEMESTERS
                      }
                    >
                      كل الفصول
                    </SelectItem>

                    {semesters.map(
                      (
                        semester
                      ) => (
                        <SelectItem
                          key={
                            semester.id
                          }
                          value={
                            semester.id
                          }
                        >
                          {
                            semester.name
                          }
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  من تاريخ
                </Label>

                <Input
                  type="date"
                  value={
                    reportFromDate
                  }
                  onChange={(
                    event
                  ) =>
                    setReportFromDate(
                      event.target.value
                    )
                  }
                />
              </div>

              <div>
                <Label>
                  إلى تاريخ
                </Label>

                <Input
                  type="date"
                  value={
                    reportToDate
                  }
                  onChange={(
                    event
                  ) =>
                    setReportToDate(
                      event.target.value
                    )
                  }
                />
              </div>

              <Button
                onClick={() =>
                  void fetchByCategoryReport()
                }
                disabled={
                  byCategoryLoading
                }
              >
                {byCategoryLoading
                  ? "جارٍ التحميل..."
                  : "تحديث"}
              </Button>
            </div>

            {byCategoryData.length >
            0 ? (
              <div className="space-y-3">
                {byCategoryData.map(
                  (
                    category
                  ) => (
                    <div
                      key={
                        category.categoryId
                      }
                    >
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">
                          {
                            category.categoryName
                          }
                        </span>

                        <span className="text-muted-foreground">
                          {
                            category.totalPoints
                          }
                          {" "}
                          نقطة
                        </span>
                      </div>

                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${Math.min(
                              100,
                              (Math.abs(
                                category.totalPoints
                              ) /
                                maxCategoryTotal) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                {byCategoryLoading
                  ? "جارٍ التحميل..."
                  : "اضغط تحديث لعرض التقرير."}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default PointsPage;