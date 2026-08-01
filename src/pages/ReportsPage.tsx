import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  LayoutDashboard,
  Printer,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://alashmar.runasp.net/api";

interface Semester {
  id: string;
  name: string;
}

interface PagedResponse<T> {
  items?: T[];
  data?: T[];
}

interface AttendanceOverviewReport {
  overallSummary: {
    totalDays: number | string;
    studentAverageAttendance: number | string;
    teacherAverageAttendance: number | string;
    totalStudentAbsences: number | string;
    totalTeacherAbsences: number | string;
  };
  studentAttendanceDetails: Array<{
    studentId: string;
    studentName: string;
    presentDays: number | string;
    absentDays: number | string;
    attendancePercentage: number | string;
    absenceDates: string[];
  }>;
  teacherAttendanceDetails: Array<{
    teacherId: string;
    teacherName: string;
    presentDays: number | string;
    absentDays: number | string;
    attendancePercentage: number | string;
    absenceDates: string[];
  }>;
}

interface PointsOverviewReport {
  overallSummary: {
    totalPoints: number | string;
    quranPoints: number | string;
    hadithPoints: number | string;
    attendancePoints: number | string;
    behaviorPoints: number | string;
    totalCourses: number | string;
  };
  studentPointsDetails: Array<{
    studentId: string;
    studentName: string;
    totalPoints: number | string;
    quranPoints: number | string;
    hadithPoints: number | string;
    attendancePoints: number | string;
    behaviorPoints: number | string;
  }>;
  teacherPointsGiven: Array<{
    teacherId: string;
    teacherName: string;
    totalPointsGiven: number | string;
    pointsByCategory: number | string;
    studentsCount: number | string;
  }>;
}

interface SemesterOverviewReport {
  semesterId: string;
  semesterName: string;
  startDate: string;
  endDate: string;
  statistics: {
    totalStudents: number | string;
    totalTeachers: number | string;
    totalClasses: number | string;
    totalQuranPagesMemorized: number | string;
    totalHadithsMemorized: number | string;
    totalPointsGiven: number | string;
    averageAttendancePercentage: number | string;
  };
  classSummaries: Array<{
    classId: string;
    className: string;
    studentCount: number | string;
    averageAttendance: number | string;
    totalPoints: number | string;
  }>;
  topStudents: Array<{
    studentId: string;
    studentName: string;
    totalPoints: number | string;
    quranPagesMemorized: number | string;
    hadithsMemorized: number | string;
    attendancePercentage: number | string;
  }>;
  topTeachers: Array<{
    teacherId: string;
    teacherName: string;
    pointsGiven: number | string;
    studentsCount: number | string;
    attendancePercentage: number | string;
  }>;
}

interface StudentReportRow {
  studentId: string;
  studentName: string;
  totalPoints: number;
  quranPoints: number;
  hadithPoints: number;
  attendancePoints: number;
  behaviorPoints: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
}

interface TeacherReportRow {
  teacherId: string;
  teacherName: string;
  totalPointsGiven: number;
  studentsCount: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
}

const API_SELECT_ALL = "__all__";

const toNumber = (value: number | string | undefined) => Number(value) || 0;

const ReportsPage = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(API_SELECT_ALL);
  const [attendanceOverview, setAttendanceOverview] = useState<AttendanceOverviewReport | null>(null);
  const [pointsOverview, setPointsOverview] = useState<PointsOverviewReport | null>(null);
  const [semesterOverview, setSemesterOverview] = useState<SemesterOverviewReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [studentSearch, setStudentSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [halaqaSearch, setHalaqaSearch] = useState("");
  const [attendanceSearch, setAttendanceSearch] = useState("");

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  }, []);

  const axiosClient = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      }),
    [authHeaders]
  );

  const formatNumber = (value: number | string) =>
    new Intl.NumberFormat("ar").format(Number(value) || 0);

  const formatPercent = (value: number | string) =>
    `${new Intl.NumberFormat("ar", { maximumFractionDigits: 1 }).format(Number(value) || 0)}%`;

  const currentSemester =
    selectedSemesterId === API_SELECT_ALL
      ? null
      : semesters.find((semester) => semester.id === selectedSemesterId) ?? null;

  const fetchSemesters = async () => {
    const response = await axiosClient.get<PagedResponse<Semester> | Semester[]>('/semesters');
    const payload = response.data;

    return Array.isArray(payload) ? payload : payload.items ?? payload.data ?? [];
  };

  const fetchReports = async (semesterId: string | null) => {
    const [attendanceResult, pointsResult, semesterResult] = await Promise.allSettled([
      axiosClient.get<AttendanceOverviewReport>("/reports/attendance/overview"),
      axiosClient.get<PointsOverviewReport>("/reports/points/overview", {
        params: semesterId ? { semesterId } : undefined,
      }),
      semesterId
        ? axiosClient.get<SemesterOverviewReport>(`/reports/semesters/${semesterId}/overview`)
        : Promise.resolve(null),
    ]);

    if (attendanceResult.status === "fulfilled") {
      setAttendanceOverview(attendanceResult.value.data);
    }

    if (pointsResult.status === "fulfilled") {
      setPointsOverview(pointsResult.value.data);
    }

    if (semesterResult.status === "fulfilled" && semesterResult.value) {
      setSemesterOverview(semesterResult.value.data);
    } else {
      setSemesterOverview(null);
    }

    if (
      attendanceResult.status === "rejected" ||
      pointsResult.status === "rejected" ||
      semesterResult.status === "rejected"
    ) {
      toast.error("تعذر تحميل بعض بيانات التقارير من الخادم");
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        setIsLoading(true);

        const semesterItems = await fetchSemesters();

        if (!isMounted) {
          return;
        }

        setSemesters(semesterItems);

        const firstSemesterId = semesterItems[0]?.id ?? API_SELECT_ALL;
        setSelectedSemesterId(firstSemesterId);

        await fetchReports(firstSemesterId === API_SELECT_ALL ? null : firstSemesterId);
      } catch (error) {
        console.error(error);
        toast.error("تعذر تحميل صفحة التقارير");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [axiosClient]);

  const handleSemesterChange = async (semesterId: string) => {
    try {
      setIsLoading(true);
      setSelectedSemesterId(semesterId);
      await fetchReports(semesterId === API_SELECT_ALL ? null : semesterId);
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحديث التقارير للفصل المحدد");
    } finally {
      setIsLoading(false);
    }
  };

  const stats = semesterOverview?.statistics;
  const attendanceSummary = attendanceOverview?.overallSummary;
  const pointsSummary = pointsOverview?.overallSummary;
  const topStudents = semesterOverview?.topStudents ?? pointsOverview?.studentPointsDetails ?? [];
  const topTeachers = semesterOverview?.topTeachers ?? pointsOverview?.teacherPointsGiven ?? [];
  const classSummaries = semesterOverview?.classSummaries ?? [];

  // ── دمج بيانات الحضور والنقاط بجدول واحد شامل لكل طالب ──
  const studentReportRows: StudentReportRow[] = useMemo(() => {
    const map = new Map<string, StudentReportRow>();

    (pointsOverview?.studentPointsDetails ?? []).forEach((student) => {
      map.set(student.studentId, {
        studentId: student.studentId,
        studentName: student.studentName,
        totalPoints: toNumber(student.totalPoints),
        quranPoints: toNumber(student.quranPoints),
        hadithPoints: toNumber(student.hadithPoints),
        attendancePoints: toNumber(student.attendancePoints),
        behaviorPoints: toNumber(student.behaviorPoints),
        presentDays: 0,
        absentDays: 0,
        attendancePercentage: 0,
      });
    });

    (attendanceOverview?.studentAttendanceDetails ?? []).forEach((detail) => {
      const attendanceFields = {
        presentDays: toNumber(detail.presentDays),
        absentDays: toNumber(detail.absentDays),
        attendancePercentage: toNumber(detail.attendancePercentage),
      };

      const existing = map.get(detail.studentId);
      if (existing) {
        Object.assign(existing, attendanceFields);
      } else {
        map.set(detail.studentId, {
          studentId: detail.studentId,
          studentName: detail.studentName,
          totalPoints: 0,
          quranPoints: 0,
          hadithPoints: 0,
          attendancePoints: 0,
          behaviorPoints: 0,
          ...attendanceFields,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [pointsOverview, attendanceOverview]);

  // ── دمج بيانات الحضور والنقاط بجدول واحد شامل لكل أستاذ ──
  const teacherReportRows: TeacherReportRow[] = useMemo(() => {
    const map = new Map<string, TeacherReportRow>();

    (pointsOverview?.teacherPointsGiven ?? []).forEach((teacher) => {
      map.set(teacher.teacherId, {
        teacherId: teacher.teacherId,
        teacherName: teacher.teacherName,
        totalPointsGiven: toNumber(teacher.totalPointsGiven),
        studentsCount: toNumber(teacher.studentsCount),
        presentDays: 0,
        absentDays: 0,
        attendancePercentage: 0,
      });
    });

    (attendanceOverview?.teacherAttendanceDetails ?? []).forEach((detail) => {
      const attendanceFields = {
        presentDays: toNumber(detail.presentDays),
        absentDays: toNumber(detail.absentDays),
        attendancePercentage: toNumber(detail.attendancePercentage),
      };

      const existing = map.get(detail.teacherId);
      if (existing) {
        Object.assign(existing, attendanceFields);
      } else {
        map.set(detail.teacherId, {
          teacherId: detail.teacherId,
          teacherName: detail.teacherName,
          totalPointsGiven: 0,
          studentsCount: 0,
          ...attendanceFields,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalPointsGiven - a.totalPointsGiven);
  }, [pointsOverview, attendanceOverview]);

  const filteredStudentRows = studentReportRows.filter((row) =>
    row.studentName.toLowerCase().includes(studentSearch.trim().toLowerCase())
  );

  const filteredTeacherRows = teacherReportRows.filter((row) =>
    row.teacherName.toLowerCase().includes(teacherSearch.trim().toLowerCase())
  );

  const filteredClassSummaries = classSummaries.filter((classSummary) =>
    classSummary.className.toLowerCase().includes(halaqaSearch.trim().toLowerCase())
  );

  const filteredStudentAttendance = (attendanceOverview?.studentAttendanceDetails ?? []).filter((detail) =>
    detail.studentName.toLowerCase().includes(attendanceSearch.trim().toLowerCase())
  );

  const filteredTeacherAttendance = (attendanceOverview?.teacherAttendanceDetails ?? []).filter((detail) =>
    detail.teacherName.toLowerCase().includes(attendanceSearch.trim().toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (isLoading) {
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      const summaryRows = [
        { المؤشر: "الفصل", القيمة: currentSemester ? currentSemester.name : "كل الفصول" },
        { المؤشر: "إجمالي الطلاب", القيمة: formatNumber(stats?.totalStudents ?? studentReportRows.length) },
        { المؤشر: "إجمالي الأساتذة", القيمة: formatNumber(stats?.totalTeachers ?? teacherReportRows.length) },
        { المؤشر: "إجمالي الحلقات", القيمة: formatNumber(stats?.totalClasses ?? classSummaries.length) },
        {
          المؤشر: "متوسط الحضور العام",
          القيمة: formatPercent(stats?.averageAttendancePercentage ?? attendanceSummary?.studentAverageAttendance ?? 0),
        },
        { المؤشر: "متوسط حضور الطلاب", القيمة: formatPercent(attendanceSummary?.studentAverageAttendance ?? 0) },
        { المؤشر: "متوسط حضور الأساتذة", القيمة: formatPercent(attendanceSummary?.teacherAverageAttendance ?? 0) },
        { المؤشر: "إجمالي نقاط القرآن", القيمة: formatNumber(pointsSummary?.quranPoints ?? 0) },
        { المؤشر: "إجمالي نقاط الحديث", القيمة: formatNumber(pointsSummary?.hadithPoints ?? 0) },
        { المؤشر: "إجمالي نقاط الحضور", القيمة: formatNumber(pointsSummary?.attendancePoints ?? 0) },
        { المؤشر: "إجمالي نقاط السلوك", القيمة: formatNumber(pointsSummary?.behaviorPoints ?? 0) },
        { المؤشر: "إجمالي النقاط الكلية", القيمة: formatNumber(stats?.totalPointsGiven ?? pointsSummary?.totalPoints ?? 0) },
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), "ملخص عام");

      if (studentReportRows.length > 0) {
        const rows = studentReportRows.map((row, index) => ({
          "#": index + 1,
          الاسم: row.studentName,
          "إجمالي النقاط": row.totalPoints,
          "نقاط القرآن": row.quranPoints,
          "نقاط الحديث": row.hadithPoints,
          "نقاط الحضور": row.attendancePoints,
          "نقاط السلوك": row.behaviorPoints,
          "أيام الحضور": row.presentDays,
          "أيام الغياب": row.absentDays,
          "نسبة الحضور": formatPercent(row.attendancePercentage),
        }));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "الطلاب");
      }

      if (teacherReportRows.length > 0) {
        const rows = teacherReportRows.map((row, index) => ({
          "#": index + 1,
          الاسم: row.teacherName,
          "عدد الطلاب": row.studentsCount,
          "النقاط الممنوحة": row.totalPointsGiven,
          "أيام الحضور": row.presentDays,
          "أيام الغياب": row.absentDays,
          "نسبة الحضور": formatPercent(row.attendancePercentage),
        }));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "الأساتذة");
      }

      if (classSummaries.length > 0) {
        const rows = classSummaries.map((classSummary) => ({
          الحلقة: classSummary.className,
          "عدد الطلاب": formatNumber(classSummary.studentCount),
          "متوسط الحضور": formatPercent(classSummary.averageAttendance),
          "إجمالي النقاط": formatNumber(classSummary.totalPoints),
        }));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "الحلقات");
      }

      if (attendanceOverview?.studentAttendanceDetails?.length) {
        const rows = attendanceOverview.studentAttendanceDetails.map((detail) => ({
          الطالب: detail.studentName,
          "أيام الحضور": formatNumber(detail.presentDays),
          "أيام الغياب": formatNumber(detail.absentDays),
          "نسبة الحضور": formatPercent(detail.attendancePercentage),
          "عدد أيام الغياب المسجلة": detail.absenceDates?.length ?? 0,
        }));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "حضور الطلاب");
      }

      if (attendanceOverview?.teacherAttendanceDetails?.length) {
        const rows = attendanceOverview.teacherAttendanceDetails.map((detail) => ({
          الأستاذ: detail.teacherName,
          "أيام الحضور": formatNumber(detail.presentDays),
          "أيام الغياب": formatNumber(detail.absentDays),
          "نسبة الحضور": formatPercent(detail.attendancePercentage),
        }));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "حضور الأساتذة");
      }

      const fileNameSuffix = (currentSemester ? currentSemester.name : "كل-الفصول").replace(
        /[\\/:*?"<>|]/g,
        "-"
      );

      XLSX.writeFile(workbook, `تقرير-${fileNameSuffix}.xlsx`);
      toast.success("تم تصدير التقرير بنجاح");
    } catch (error) {
      console.error(error);
      toast.error("تعذر تصدير التقرير");
    }
  };

  return (
    <DashboardLayout title="التقارير" subtitle="عرض حي وشامل لكل إحصاءات الموقع">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 print:hidden">
          <div className="flex-1">
            <Select value={selectedSemesterId} onValueChange={handleSemesterChange}>
              <SelectTrigger className="w-full sm:max-w-sm">
                <SelectValue placeholder="اختر الفصل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={API_SELECT_ALL}>كل الفصول</SelectItem>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>
                    {semester.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Badge variant="secondary">
            {currentSemester ? `الفصل الحالي: ${currentSemester.name}` : "كل الفصول"}
          </Badge>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleExportExcel}
              disabled={isLoading}
            >
              <FileSpreadsheet className="h-4 w-4" />
              تصدير Excel
            </Button>

            <Button type="button" size="sm" className="gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
          </div>
        </div>

        <div className="hidden print:block text-center mb-2">
          <h2 className="text-xl font-bold">
            تقرير {currentSemester ? currentSemester.name : "شامل — كل الفصول"}
          </h2>
          <p className="text-sm text-muted-foreground">
            تاريخ الإصدار: {new Intl.DateTimeFormat("ar").format(new Date())}
          </p>
        </div>

        <p className="text-sm text-muted-foreground print:hidden">
          {isLoading ? "جارٍ تحميل التقارير من الخادم..." : "البيانات المعروضة تأتي مباشرة من API التقارير."}
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="print:hidden flex-wrap h-auto">
          <TabsTrigger value="overview" className="gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            الطلاب
          </TabsTrigger>
          <TabsTrigger value="teachers" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            الأساتذة
          </TabsTrigger>
          <TabsTrigger value="halaqas" className="gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            الحلقات
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            الحضور
          </TabsTrigger>
        </TabsList>

        {/* ══════════ نظرة عامة ══════════ */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "إجمالي الطلاب", value: stats?.totalStudents ?? studentReportRows.length },
              { label: "إجمالي الأساتذة", value: stats?.totalTeachers ?? teacherReportRows.length },
              { label: "إجمالي الحلقات", value: stats?.totalClasses ?? classSummaries.length },
              { label: "متوسط الحضور", value: stats?.averageAttendancePercentage ?? attendanceSummary?.studentAverageAttendance ?? "-" },
            ].map((item, index) => (
              <Card key={item.label} className="glass-card border-border/60">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                      <p className="text-3xl font-bold text-foreground">
                        {index === 3 ? formatPercent(item.value) : formatNumber(item.value)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-primary/10 p-3 text-primary print:hidden">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="glass-card border-border/60 xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary print:hidden" />
                  ملخص الفصل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {semesterOverview ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border bg-background/50 p-4">
                        <p className="text-muted-foreground">الفصل</p>
                        <p className="font-semibold">{semesterOverview.semesterName}</p>
                      </div>
                      <div className="rounded-xl border bg-background/50 p-4">
                        <p className="text-muted-foreground">عدد الطلاب</p>
                        <p className="font-semibold">{formatNumber(stats?.totalStudents ?? 0)}</p>
                      </div>
                      <div className="rounded-xl border bg-background/50 p-4">
                        <p className="text-muted-foreground">النقاط الكلية</p>
                        <p className="font-semibold">{formatNumber(stats?.totalPointsGiven ?? 0)}</p>
                      </div>
                      <div className="rounded-xl border bg-background/50 p-4">
                        <p className="text-muted-foreground">أيام الحضور</p>
                        <p className="font-semibold">{formatNumber(attendanceSummary?.totalDays ?? 0)}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {semesterOverview.topStudents.slice(0, 3).map((student) => (
                        <div key={student.studentId} className="rounded-xl border bg-background/50 p-4">
                          <p className="font-semibold">{student.studentName}</p>
                          <p className="text-muted-foreground">{formatNumber(student.totalPoints)} نقطة</p>
                          <p className="text-muted-foreground">{formatPercent(student.attendancePercentage)} حضور</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                    {isLoading ? "جارٍ تحميل ملخص الفصل..." : "اختر فصلاً محددًا لعرض ملخصه التفصيلي."}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary print:hidden" />
                  ملخص الحضور والنقاط
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground">متوسط حضور الطلاب</p>
                  <p className="font-semibold">{formatPercent(attendanceSummary?.studentAverageAttendance ?? stats?.averageAttendancePercentage ?? 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">متوسط حضور الأساتذة</p>
                  <p className="font-semibold">{formatPercent(attendanceSummary?.teacherAverageAttendance ?? 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">إجمالي نقاط القرآن</p>
                  <p className="font-semibold">{formatNumber(pointsSummary?.quranPoints ?? 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">إجمالي نقاط الحديث</p>
                  <p className="font-semibold">{formatNumber(pointsSummary?.hadithPoints ?? 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">إجمالي نقاط السلوك</p>
                  <p className="font-semibold">{formatNumber(pointsSummary?.behaviorPoints ?? 0)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="glass-card border-border/60">
              <CardHeader>
                <CardTitle>أفضل الطلاب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topStudents.length > 0 ? (
                  topStudents.slice(0, 5).map((student, index) => (
                    <div key={student.studentId} className="flex items-center justify-between rounded-xl border bg-background/50 p-4">
                      <div>
                        <p className="font-semibold">{index + 1}. {student.studentName}</p>
                        <p className="text-xs text-muted-foreground">{formatPercent(student.attendancePercentage)} حضور</p>
                      </div>
                      <Badge>{formatNumber(student.totalPoints)} نقطة</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{isLoading ? "جارٍ التحميل..." : "لا توجد بيانات متاحة."}</p>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card border-border/60">
              <CardHeader>
                <CardTitle>أفضل الأساتذة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topTeachers.length > 0 ? (
                  topTeachers.slice(0, 5).map((teacher, index) => (
                    <div key={teacher.teacherId} className="flex items-center justify-between rounded-xl border bg-background/50 p-4">
                      <div>
                        <p className="font-semibold">{index + 1}. {teacher.teacherName}</p>
                        <p className="text-xs text-muted-foreground">{formatNumber(teacher.studentsCount)} طالب</p>
                      </div>
                      <Badge variant="secondary">
                        {formatNumber((teacher as { pointsGiven?: number | string }).pointsGiven ?? (teacher as { totalPointsGiven?: number | string }).totalPointsGiven ?? 0)} نقطة
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{isLoading ? "جارٍ التحميل..." : "لا توجد بيانات متاحة."}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══════════ الطلاب ══════════ */}
        <TabsContent value="students" className="mt-6 space-y-4">
          <div className="relative max-w-sm print:hidden">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث باسم الطالب..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="pr-10"
            />
          </div>

          <Card className="glass-card border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">إجمالي النقاط</TableHead>
                    <TableHead className="text-right">القرآن</TableHead>
                    <TableHead className="text-right">الحديث</TableHead>
                    <TableHead className="text-right">الحضور (نقاط)</TableHead>
                    <TableHead className="text-right">السلوك</TableHead>
                    <TableHead className="text-right">أيام الحضور</TableHead>
                    <TableHead className="text-right">أيام الغياب</TableHead>
                    <TableHead className="text-right">نسبة الحضور</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        جارٍ التحميل...
                      </TableCell>
                    </TableRow>
                  ) : filteredStudentRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        لا توجد بيانات مطابقة
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudentRows.map((row) => (
                      <TableRow key={row.studentId}>
                        <TableCell className="font-medium">{row.studentName}</TableCell>
                        <TableCell>
                          <Badge>{formatNumber(row.totalPoints)}</Badge>
                        </TableCell>
                        <TableCell>{formatNumber(row.quranPoints)}</TableCell>
                        <TableCell>{formatNumber(row.hadithPoints)}</TableCell>
                        <TableCell>{formatNumber(row.attendancePoints)}</TableCell>
                        <TableCell>{formatNumber(row.behaviorPoints)}</TableCell>
                        <TableCell>{formatNumber(row.presentDays)}</TableCell>
                        <TableCell>{formatNumber(row.absentDays)}</TableCell>
                        <TableCell>{formatPercent(row.attendancePercentage)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          <p className="text-xs text-muted-foreground print:hidden">
            إجمالي النتائج: {filteredStudentRows.length}
          </p>
        </TabsContent>

        {/* ══════════ الأساتذة ══════════ */}
        <TabsContent value="teachers" className="mt-6 space-y-4">
          <div className="relative max-w-sm print:hidden">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث باسم الأستاذ..."
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              className="pr-10"
            />
          </div>

          <Card className="glass-card border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">عدد الطلاب</TableHead>
                    <TableHead className="text-right">النقاط الممنوحة</TableHead>
                    <TableHead className="text-right">أيام الحضور</TableHead>
                    <TableHead className="text-right">أيام الغياب</TableHead>
                    <TableHead className="text-right">نسبة الحضور</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        جارٍ التحميل...
                      </TableCell>
                    </TableRow>
                  ) : filteredTeacherRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        لا توجد بيانات مطابقة
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTeacherRows.map((row) => (
                      <TableRow key={row.teacherId}>
                        <TableCell className="font-medium">{row.teacherName}</TableCell>
                        <TableCell>{formatNumber(row.studentsCount)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{formatNumber(row.totalPointsGiven)}</Badge>
                        </TableCell>
                        <TableCell>{formatNumber(row.presentDays)}</TableCell>
                        <TableCell>{formatNumber(row.absentDays)}</TableCell>
                        <TableCell>{formatPercent(row.attendancePercentage)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          <p className="text-xs text-muted-foreground print:hidden">
            إجمالي النتائج: {filteredTeacherRows.length}
          </p>
        </TabsContent>

        {/* ══════════ الحلقات ══════════ */}
        <TabsContent value="halaqas" className="mt-6 space-y-4">
          {!semesterOverview ? (
            <Card className="glass-card border-border/60">
              <CardContent className="pt-6 text-sm text-muted-foreground text-center">
                اختر فصلاً دراسيًا محددًا (وليس "كل الفصول") لعرض تفاصيل كل حلقة على حدة.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="relative max-w-sm print:hidden">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث باسم الحلقة..."
                  value={halaqaSearch}
                  onChange={(e) => setHalaqaSearch(e.target.value)}
                  className="pr-10"
                />
              </div>

              {filteredClassSummaries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredClassSummaries.map((classSummary) => (
                    <Card key={classSummary.classId} className="glass-card border-border/60">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold">{classSummary.className}</p>
                          <Badge variant="outline">{formatNumber(classSummary.studentCount)} طالب</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">متوسط الحضور: {formatPercent(classSummary.averageAttendance)}</p>
                        <p className="text-sm text-muted-foreground">إجمالي النقاط: {formatNumber(classSummary.totalPoints)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد نتائج مطابقة.</p>
              )}
            </>
          )}
        </TabsContent>

        {/* ══════════ الحضور ══════════ */}
        <TabsContent value="attendance" className="mt-6 space-y-6">
          <div className="relative max-w-sm print:hidden">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم (طالب أو أستاذ)..."
              value={attendanceSearch}
              onChange={(e) => setAttendanceSearch(e.target.value)}
              className="pr-10"
            />
          </div>

          <div>
            <h3 className="font-bold mb-3">حضور الطلاب</h3>
            <Card className="glass-card border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الطالب</TableHead>
                      <TableHead className="text-right">أيام الحضور</TableHead>
                      <TableHead className="text-right">أيام الغياب</TableHead>
                      <TableHead className="text-right">نسبة الحضور</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          جارٍ التحميل...
                        </TableCell>
                      </TableRow>
                    ) : filteredStudentAttendance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          لا توجد بيانات مطابقة
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudentAttendance.map((detail) => (
                        <TableRow key={detail.studentId}>
                          <TableCell className="font-medium">{detail.studentName}</TableCell>
                          <TableCell>{formatNumber(detail.presentDays)}</TableCell>
                          <TableCell>{formatNumber(detail.absentDays)}</TableCell>
                          <TableCell>{formatPercent(detail.attendancePercentage)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          <div>
            <h3 className="font-bold mb-3">حضور الأساتذة</h3>
            <Card className="glass-card border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الأستاذ</TableHead>
                      <TableHead className="text-right">أيام الحضور</TableHead>
                      <TableHead className="text-right">أيام الغياب</TableHead>
                      <TableHead className="text-right">نسبة الحضور</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          جارٍ التحميل...
                        </TableCell>
                      </TableRow>
                    ) : filteredTeacherAttendance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          لا توجد بيانات مطابقة
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTeacherAttendance.map((detail) => (
                        <TableRow key={detail.teacherId}>
                          <TableCell className="font-medium">{detail.teacherName}</TableCell>
                          <TableCell>{formatNumber(detail.presentDays)}</TableCell>
                          <TableCell>{formatNumber(detail.absentDays)}</TableCell>
                          <TableCell>{formatPercent(detail.attendancePercentage)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default ReportsPage;