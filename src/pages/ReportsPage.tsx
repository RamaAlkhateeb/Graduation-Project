import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { BarChart3, CalendarDays, FileText, TrendingUp, Users } from "lucide-react";
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

const reportSections = [
  {
    title: "تقارير الطلاب",
    description: "الحضور والحفظ والنقاط لكل طالب من بيانات الخادم",
    icon: Users,
  },
  {
    title: "تقارير الأساتذة",
    description: "إحصاءات النقاط والحضور ونشاط الإشراف",
    icon: TrendingUp,
  },
  {
    title: "تقارير الفصول",
    description: "ملخصات الحلقات ضمن الفصل المحدد من الـ API",
    icon: CalendarDays,
  },
  {
    title: "تقارير شاملة",
    description: "ملخص موحد للحضور والنقاط والفصل النشط",
    icon: FileText,
  },
];

const API_SELECT_ALL = "__all__";

const ReportsPage = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(API_SELECT_ALL);
  const [attendanceOverview, setAttendanceOverview] = useState<AttendanceOverviewReport | null>(null);
  const [pointsOverview, setPointsOverview] = useState<PointsOverviewReport | null>(null);
  const [semesterOverview, setSemesterOverview] = useState<SemesterOverviewReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <DashboardLayout title="التقارير" subtitle="عرض حي لملخصات وإحصاءات الخادم">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
        </div>

        <p className="text-sm text-muted-foreground">
          {isLoading ? "جارٍ تحميل التقارير من الخادم..." : "البيانات المعروضة تأتي مباشرة من API التقارير."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[
          { label: "إجمالي الطلاب", value: stats?.totalStudents ?? "-" },
          { label: "إجمالي الأساتذة", value: stats?.totalTeachers ?? "-" },
          { label: "إجمالي الحلقات", value: stats?.totalClasses ?? "-" },
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
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
        <Card className="glass-card border-border/60 xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
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
                {isLoading ? "جارٍ تحميل ملخص الفصل..." : "لا يوجد ملخص فصل متاح حالياً."}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
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

      <Card className="glass-card border-border/60">
        <CardHeader>
          <CardTitle>تفاصيل الفصول</CardTitle>
        </CardHeader>
        <CardContent>
          {classSummaries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {classSummaries.map((classSummary) => (
                <div key={classSummary.classId} className="rounded-xl border bg-background/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold">{classSummary.className}</p>
                    <Badge variant="outline">{formatNumber(classSummary.studentCount)} طالب</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">متوسط الحضور: {formatPercent(classSummary.averageAttendance)}</p>
                  <p className="text-sm text-muted-foreground">إجمالي النقاط: {formatNumber(classSummary.totalPoints)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{isLoading ? "جارٍ التحميل..." : "لا توجد تفاصيل فصول متاحة."}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {reportSections.map((item) => (
          <Card key={item.title} className="glass-card border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold">{item.title}</CardTitle>
              <item.icon className="h-5 w-5 text-primary" />
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;

