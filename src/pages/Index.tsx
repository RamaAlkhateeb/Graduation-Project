import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Activity,
  PieChart as PieIcon,
  Trophy,
  AlertTriangle,
  CalendarDays,
  BookMarked,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://alashmar.runasp.net/api";

const ALL_SEMESTERS = "all";

interface Semester {
  id: string;
  name: string;
}

interface PagedResponse<T> {
  items?: T[];
  data?: T[];
  totalItems?: number;
  totalCount?: number;
  count?: number;
}

interface AttendanceDetail {
  studentId: string;
  studentName: string;
  presentDays: number | string;
  absentDays: number | string;
  attendancePercentage: number | string;
  absenceDates: string[];
}

interface AttendanceOverviewReport {
  overallSummary: {
    totalDays: number | string;
    studentAverageAttendance: number | string;
    teacherAverageAttendance: number | string;
    totalStudentAbsences: number | string;
    totalTeacherAbsences: number | string;
  };
  studentAttendanceDetails: AttendanceDetail[];
  teacherAttendanceDetails: AttendanceDetail[];
}

interface StudentPointsDetail {
  studentId: string;
  studentName: string;
  totalPoints: number | string;
  quranPoints: number | string;
  hadithPoints: number | string;
  attendancePoints: number | string;
  behaviorPoints: number | string;
}

interface TeacherPointsGivenDetail {
  teacherId: string;
  teacherName: string;
  totalPointsGiven: number | string;
  pointsByCategory: number | string;
  studentsCount: number | string;
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
  studentPointsDetails: StudentPointsDetail[];
  teacherPointsGiven: TeacherPointsGivenDetail[];
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
  topStudents?: TopStudentDto[];
}

interface TopStudentDto {
  studentId: string;
  studentName: string;
  totalPoints: number | string;
  quranPagesMemorized: number | string;
  hadithsMemorized: number | string;
  attendancePercentage: number | string;
}

interface StudentMemorizationProgressDto {
  studentId: string;
  totalHadithsMemorized: number | string;
  totalQuranPagesMemorized: number | string;
}

interface MemorizationLeaderboardEntry {
  studentId: string;
  studentName: string;
  quranPages: number;
  hadiths: number;
}

interface MeResponse {
  name?: string;
  fullName?: string;
  userName?: string;
  username?: string;
  role?: string;
  roleName?: string;
}

const Card = ({ children }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition">
    {children}
  </div>
);

const Index = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(ALL_SEMESTERS);

  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [circleCount, setCircleCount] = useState(0);
  const [attendanceOverview, setAttendanceOverview] = useState<AttendanceOverviewReport | null>(null);
  const [pointsOverview, setPointsOverview] = useState<PointsOverviewReport | null>(null);
  const [memorizationLeaderboard, setMemorizationLeaderboard] = useState<MemorizationLeaderboardEntry[]>([]);
  const [dashboardUser, setDashboardUser] = useState<MeResponse | null>(null);
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

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("ar", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));

  const attendanceData = useMemo(
    () =>
      (attendanceOverview?.studentAttendanceDetails ?? [])
        .slice()
        .sort(
          (left, right) =>
            Number(right.attendancePercentage) - Number(left.attendancePercentage)
        )
        .slice(0, 7)
        .map((item) => ({
          name: item.studentName,
          value: Number(item.attendancePercentage) || 0,
        })),
    [attendanceOverview]
  );

  const circleDistribution = useMemo(() => {
    const summary = pointsOverview?.overallSummary;

    if (!summary) {
      return [];
    }

    return [
      { name: "القرآن", value: Number(summary.quranPoints) || 0, color: "#166534" },
      { name: "الحديث", value: Number(summary.hadithPoints) || 0, color: "#f59e0b" },
      { name: "الحضور", value: Number(summary.attendancePoints) || 0, color: "#0ea5e9" },
      { name: "السلوك", value: Number(summary.behaviorPoints) || 0, color: "#ef4444" },
    ];
  }, [pointsOverview]);

  // لوحة صدارة الطلاب — أعلى 5 حسب مجموع النقاط
  const topStudentsLeaderboard = useMemo(
    () =>
      (pointsOverview?.studentPointsDetails ?? [])
        .slice()
        .sort((a, b) => Number(b.totalPoints) - Number(a.totalPoints))
        .slice(0, 5),
    [pointsOverview]
  );

  // الطلاب الأكثر غياباً — أعلى 5 حسب عدد أيام الغياب
  const mostAbsentStudents = useMemo(
    () =>
      (attendanceOverview?.studentAttendanceDetails ?? [])
        .filter((student) => Number(student.absentDays) > 0)
        .slice()
        .sort((a, b) => Number(b.absentDays) - Number(a.absentDays))
        .slice(0, 5),
    [attendanceOverview]
  );

  const recentActivities = useMemo(() => {
    const studentAttendance = attendanceOverview?.studentAttendanceDetails ?? [];
    const studentPoints = pointsOverview?.studentPointsDetails ?? [];
    const teacherPoints = pointsOverview?.teacherPointsGiven ?? [];

    const sortedAttendance = studentAttendance.slice().sort(
      (left, right) => Number(right.attendancePercentage) - Number(left.attendancePercentage)
    );

    const sortedStudentPoints = studentPoints.slice().sort(
      (left, right) => Number(right.totalPoints) - Number(left.totalPoints)
    );

    const sortedTeacherPoints = teacherPoints.slice().sort(
      (left, right) => Number(right.totalPointsGiven) - Number(left.totalPointsGiven)
    );

    const latestAbsence = studentAttendance
      .flatMap((student) =>
        student.absenceDates.map((absenceDate) => ({
          studentName: student.studentName,
          absenceDate,
        }))
      )
      .sort(
        (left, right) =>
          new Date(right.absenceDate).getTime() - new Date(left.absenceDate).getTime()
      )[0];

    const items = [
      sortedAttendance[0]
        ? {
            text: `أفضل حضور: ${sortedAttendance[0].studentName}`,
            time: formatPercent(sortedAttendance[0].attendancePercentage),
          }
        : null,
      sortedStudentPoints[0]
        ? {
            text: `أعلى طالب نقاطًا: ${sortedStudentPoints[0].studentName}`,
            time: `${formatNumber(sortedStudentPoints[0].totalPoints)} نقطة`,
          }
        : null,
      sortedTeacherPoints[0]
        ? {
            text: `أكثر المعلمين منحًا للنقاط: ${sortedTeacherPoints[0].teacherName}`,
            time: `${formatNumber(sortedTeacherPoints[0].totalPointsGiven)} نقطة`,
          }
        : null,
      latestAbsence
        ? {
            text: `آخر غياب مسجل: ${latestAbsence.studentName}`,
            time: formatDate(latestAbsence.absenceDate),
          }
        : null,
      attendanceOverview?.overallSummary
        ? {
            text: "متوسط حضور الطلاب",
            time: formatPercent(attendanceOverview.overallSummary.studentAverageAttendance),
          }
        : null,
    ].filter(Boolean) as Array<{ text: string; time: string }>;

    return items;
  }, [attendanceOverview, pointsOverview]);

  const selectedSemesterName = useMemo(
    () => semesters.find((semester) => semester.id === selectedSemesterId)?.name,
    [semesters, selectedSemesterId]
  );

  const dashboardSubtitle = useMemo(() => {
    const greeting =
      dashboardUser?.name || dashboardUser?.fullName || dashboardUser?.userName
        ? `مرحبًا ${dashboardUser?.name || dashboardUser?.fullName || dashboardUser?.userName}، هذه بيانات حية من الخادم`
        : "نظرة عامة على إدارة الحلقات القرآنية";

    return selectedSemesterName ? `${greeting} — الفصل: ${selectedSemesterName}` : greeting;
  }, [dashboardUser, selectedSemesterName]);

  // جلب قائمة الفصول مرة واحدة لتعبئة الفلتر
  useEffect(() => {
    let isMounted = true;

    const fetchSemesters = async () => {
      try {
        const response = await axiosClient.get<Semester[] | PagedResponse<Semester>>("/Semesters");
        const payload = response.data;
        const list = Array.isArray(payload) ? payload : payload.items ?? payload.data ?? [];

        if (isMounted) {
          setSemesters(list);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchSemesters();

    return () => {
      isMounted = false;
    };
  }, [axiosClient]);

  // جلب بيانات اللوحة، وتُعاد كلما تغيّر الفصل المختار
  useEffect(() => {
    let isMounted = true;

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

    const isFilteredBySemester = selectedSemesterId !== ALL_SEMESTERS;
    const semesterParam = isFilteredBySemester ? { semesterId: selectedSemesterId } : undefined;

    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setMemorizationLeaderboard([]);

        const [attendanceResult, pointsResult, meResult] = await Promise.allSettled([
          axiosClient.get<AttendanceOverviewReport>("/reports/attendance/overview", {
            params: semesterParam,
          }),
          axiosClient.get<PointsOverviewReport>("/reports/points/overview", {
            params: semesterParam,
          }),
          axiosClient.get<MeResponse>("/Auth/me"),
        ]);

        if (!isMounted) {
          return;
        }

        if (attendanceResult.status === "fulfilled") {
          setAttendanceOverview(attendanceResult.value.data);
        }

        if (pointsResult.status === "fulfilled") {
          setPointsOverview(pointsResult.value.data);
        }

        if (meResult.status === "fulfilled") {
          setDashboardUser(meResult.value.data);
        }

        let hadError =
          attendanceResult.status === "rejected" ||
          pointsResult.status === "rejected" ||
          meResult.status === "rejected";

        if (isFilteredBySemester) {
          // فصل محدد: نعتمد على ملخص الفصل الجاهز بدل 3 استدعاءات منفصلة
          try {
            const semesterRes = await axiosClient.get<SemesterOverviewReport>(
              `/reports/semesters/${selectedSemesterId}/overview`
            );

            if (!isMounted) {
              return;
            }

            const stats = semesterRes.data.statistics;
            setStudentCount(Number(stats.totalStudents) || 0);
            setTeacherCount(Number(stats.totalTeachers) || 0);
            setCircleCount(Number(stats.totalClasses) || 0);

            // أعلى الطلاب حفظًا — من أوائل الطلاب في ملخص الفصل
            setMemorizationLeaderboard(
              (semesterRes.data.topStudents ?? [])
                .map((student) => ({
                  studentId: student.studentId,
                  studentName: student.studentName,
                  quranPages: Number(student.quranPagesMemorized) || 0,
                  hadiths: Number(student.hadithsMemorized) || 0,
                }))
                .sort((a, b) => b.quranPages + b.hadiths - (a.quranPages + a.hadiths))
                .slice(0, 5)
            );
          } catch (error) {
            console.error(error);
            hadError = true;
          }
        } else {
          // كل الفصول: نفس منطق الجلب الأصلي بالعدّ اليدوي
          const [studentsResult, teachersResult, circlesResult] = await Promise.allSettled([
            axiosClient.get<PagedResponse<unknown> | unknown[]>("/students/filtered", {
              params: { pageNumber: 1, pageSize: 1 },
            }),
            axiosClient.get<PagedResponse<unknown> | unknown[]>("/teachers/filtered", {
              params: { pageNumber: 1, pageSize: 1 },
            }),
            axiosClient.get<unknown[]>("/halaqas"),
          ]);

          if (!isMounted) {
            return;
          }

          if (studentsResult.status === "fulfilled") {
            const data = studentsResult.value.data;
            const collection = normalizeCollection(data);
            const total =
              (data as PagedResponse<unknown>).totalCount ??
              (data as PagedResponse<unknown>).totalItems ??
              (data as PagedResponse<unknown>).count ??
              collection.length;

            setStudentCount(Number(total) || collection.length);
          }

          if (teachersResult.status === "fulfilled") {
            const data = teachersResult.value.data;
            const collection = normalizeCollection(data);
            const total =
              (data as PagedResponse<unknown>).totalCount ??
              (data as PagedResponse<unknown>).totalItems ??
              (data as PagedResponse<unknown>).count ??
              collection.length;

            setTeacherCount(Number(total) || collection.length);
          }

          if (circlesResult.status === "fulfilled") {
            setCircleCount(Array.isArray(circlesResult.value.data) ? circlesResult.value.data.length : 0);
          }

          if (
            studentsResult.status === "rejected" ||
            teachersResult.status === "rejected" ||
            circlesResult.status === "rejected"
          ) {
            hadError = true;
          }

          // أعلى الطلاب حفظًا — ملخص الحفظ لكل طالب من قائمة الأوائل بالنقاط
          if (pointsResult.status === "fulfilled") {
            const topByPoints = (pointsResult.value.data.studentPointsDetails ?? [])
              .slice()
              .sort((a, b) => Number(b.totalPoints) - Number(a.totalPoints))
              .slice(0, 5);

            const memorizationResults = await Promise.allSettled(
              topByPoints.map((student) =>
                axiosClient.get<StudentMemorizationProgressDto>(
                  `/students/${student.studentId}/memorization`
                )
              )
            );

            if (!isMounted) {
              return;
            }

            setMemorizationLeaderboard(
              memorizationResults
                .map((result, index) => {
                  if (result.status !== "fulfilled") return null;

                  return {
                    studentId: topByPoints[index].studentId,
                    studentName: topByPoints[index].studentName,
                    quranPages: Number(result.value.data.totalQuranPagesMemorized) || 0,
                    hadiths: Number(result.value.data.totalHadithsMemorized) || 0,
                  };
                })
                .filter(
                  (entry): entry is MemorizationLeaderboardEntry => entry !== null
                )
            );
          }
        }

        if (hadError) {
          toast.error("تعذر تحميل بعض بيانات لوحة التحكم من الخادم");
        }
      } catch (error) {
        console.error(error);
        toast.error("تعذر تحميل بيانات لوحة التحكم");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, [axiosClient, selectedSemesterId]);

  return (
    <DashboardLayout
      title="لوحة التحكم"
      subtitle={dashboardSubtitle}
    >
      {/* فلتر الفصل */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
          <CalendarDays className="h-4 w-4" />
          عرض بيانات:
        </div>
        <div className="w-full sm:w-64">
          <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="اختر الفصل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SEMESTERS}>كل الفصول</SelectItem>
              {semesters.map((semester) => (
                <SelectItem key={semester.id} value={semester.id}>
                  {semester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
        <StatCard
          icon={GraduationCap}
          label="إجمالي الطلاب"
          value={isLoading ? "..." : formatNumber(studentCount)}
          change="من الخادم مباشرة"
        />
        <StatCard
          icon={Users}
          label="الأساتذة"
          value={isLoading ? "..." : formatNumber(teacherCount)}
          change="من الخادم مباشرة"
        />
        <StatCard
          icon={BookOpen}
          label="الحلقات النشطة"
          value={isLoading ? "..." : formatNumber(circleCount)}
          change="من الخادم مباشرة"
        />
        <StatCard
          icon={ClipboardCheck}
          label="نسبة حضور الطلاب"
          value={isLoading ? "..." : formatPercent(attendanceOverview?.overallSummary.studentAverageAttendance ?? 0)}
          change="من تقارير الحضور"
        />
        <StatCard
          icon={Activity}
          label="نسبة حضور الأساتذة"
          value={isLoading ? "..." : formatPercent(attendanceOverview?.overallSummary.teacherAverageAttendance ?? 0)}
          change="من تقارير الحضور"
          variant="info"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Attendance — قائمة مرتّبة بدل الرسم البياني */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-gray-800">أعلى نسب حضور الطلاب</h3>
            </div>

            {attendanceData.length > 0 ? (
              <div className="space-y-4">
                {attendanceData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : i === 1
                          ? "bg-gray-100 text-gray-600"
                          : i === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700 truncate">{item.name}</span>
                        <span className="text-sm font-bold text-green-700 shrink-0 mr-2">
                          {item.value.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-green-600 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
                {isLoading ? "جارٍ تحميل بيانات الحضور..." : "لا توجد بيانات حضور متاحة"}
              </div>
            )}
          </Card>
        </div>

        {/* Pie */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-gray-800">توزيع النقاط حسب الفئة</h3>
          </div>

          {circleDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={circleDistribution}
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {circleDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-4 space-y-2">
                {circleDistribution.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: item.color }}
                      />
                      {item.name}
                    </div>
                    <span className="font-bold">{formatNumber(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
              {isLoading ? "جارٍ تحميل بيانات النقاط..." : "لا توجد بيانات نقاط متاحة"}
            </div>
          )}
        </Card>
      </div>

      {/* لوحة الصدارة + تنبيهات الغياب */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* أفضل الطلاب */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-gray-800">لوحة الصدارة — الطلاب</h3>
          </div>

          {topStudentsLeaderboard.length > 0 ? (
            <div className="space-y-3">
              {topStudentsLeaderboard.map((student, i) => (
                <div key={student.studentId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : i === 1
                          ? "bg-gray-100 text-gray-600"
                          : i === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{student.studentName}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {formatNumber(student.totalPoints)} نقطة
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
              {isLoading ? "جارٍ التحميل..." : "لا توجد بيانات نقاط متاحة"}
            </div>
          )}
        </Card>

        {/* أعلى الطلاب حفظًا */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <BookMarked className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-gray-800">أعلى الطلاب حفظًا</h3>
          </div>

          {memorizationLeaderboard.length > 0 ? (
            <div className="space-y-3">
              {memorizationLeaderboard.map((student, i) => (
                <div key={student.studentId} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        i === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : i === 1
                          ? "bg-gray-100 text-gray-600"
                          : i === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700 truncate">{student.studentName}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
                      <BookOpen className="h-3.5 w-3.5" />
                      {formatNumber(student.quranPages)} صفحة
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-700">
                      <BookMarked className="h-3.5 w-3.5" />
                      {formatNumber(student.hadiths)} حديث
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
              {isLoading ? "جارٍ التحميل..." : "لا توجد بيانات حفظ متاحة"}
            </div>
          )}
        </Card>

        {/* تنبيه: الطلاب الأكثر غياباً */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="font-bold text-gray-800">الطلاب الأكثر غياباً</h3>
          </div>

          {mostAbsentStudents.length > 0 ? (
            <div className="space-y-3">
              {mostAbsentStudents.map((student) => (
                <div key={student.studentId} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{student.studentName}</span>
                  <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                    {formatNumber(student.absentDays)} يوم غياب
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
              {isLoading ? "جارٍ التحميل..." : "لا يوجد طلاب لديهم غياب مسجل 👏"}
            </div>
          )}
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <h3 className="font-bold text-gray-800 mb-6">أبرز المؤشرات الحية</h3>

        <div className="relative">
          <div className="absolute right-2 top-0 bottom-0 w-[2px] bg-gray-200" />

          <div className="space-y-5">
            {recentActivities.length > 0 ? recentActivities.map((item, i) => (
              <div key={i} className="flex gap-4 relative">
                <div className="w-4 h-4 bg-green-600 rounded-full mt-1 z-10" />

                <div className="flex-1 flex justify-between">
                  <p className="text-sm text-gray-700">{item.text}</p>
                  <span className="text-xs text-gray-500 whitespace-nowrap font-medium">
                    {item.time}
                  </span>
                </div>
              </div>
            )) : (
              <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                {isLoading ? "جارٍ تحميل المؤشرات..." : "لا توجد مؤشرات متاحة حاليًا"}
              </div>
            )}
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default Index;