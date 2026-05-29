import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Activity,
  PieChart as PieIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://alashmar.runasp.net/api";

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
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [circleCount, setCircleCount] = useState(0);
  const [attendanceOverview, setAttendanceOverview] = useState<AttendanceOverviewReport | null>(null);
  const [pointsOverview, setPointsOverview] = useState<PointsOverviewReport | null>(null);
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

  const dashboardSubtitle =
    dashboardUser?.name || dashboardUser?.fullName || dashboardUser?.userName
      ? `مرحبًا ${dashboardUser?.name || dashboardUser?.fullName || dashboardUser?.userName}، هذه بيانات حية من الخادم`
      : "نظرة عامة على إدارة الحلقات القرآنية";

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

    const fetchDashboard = async () => {
      try {
        const [studentsResult, teachersResult, circlesResult, attendanceResult, pointsResult, meResult] =
          await Promise.allSettled([
            axiosClient.get<PagedResponse<unknown> | unknown[]>("/students/filtered", {
              params: {
                pageNumber: 1,
                pageSize: 1,
              },
            }),
            axiosClient.get<PagedResponse<unknown> | unknown[]>("/teachers/filtered", {
              params: {
                pageNumber: 1,
                pageSize: 1,
              },
            }),
            axiosClient.get<unknown[]>("/halaqas"),
            axiosClient.get<AttendanceOverviewReport>("/reports/attendance/overview"),
            axiosClient.get<PointsOverviewReport>("/reports/points/overview"),
            axiosClient.get<MeResponse>("/Auth/me"),
          ]);

        if (!isMounted) {
          return;
        }

        const studentsData = studentsResult.status === "fulfilled" ? studentsResult.value.data : null;
        const teachersData = teachersResult.status === "fulfilled" ? teachersResult.value.data : null;
        const circlesData = circlesResult.status === "fulfilled" ? circlesResult.value.data : null;
        const attendanceDataResult = attendanceResult.status === "fulfilled" ? attendanceResult.value.data : null;
        const pointsDataResult = pointsResult.status === "fulfilled" ? pointsResult.value.data : null;
        const meData = meResult.status === "fulfilled" ? meResult.value.data : null;

        if (studentsData) {
          const studentsCollection = normalizeCollection(studentsData);
          const totalStudents =
            (studentsData as PagedResponse<unknown>).totalCount ??
            (studentsData as PagedResponse<unknown>).totalItems ??
            (studentsData as PagedResponse<unknown>).count ??
            studentsCollection.length;

          setStudentCount(Number(totalStudents) || studentsCollection.length);
        }

        if (teachersData) {
          const teachersCollection = normalizeCollection(teachersData);
          const totalTeachers =
            (teachersData as PagedResponse<unknown>).totalCount ??
            (teachersData as PagedResponse<unknown>).totalItems ??
            (teachersData as PagedResponse<unknown>).count ??
            teachersCollection.length;

          setTeacherCount(Number(totalTeachers) || teachersCollection.length);
        }

        if (circlesData) {
          setCircleCount(Array.isArray(circlesData) ? circlesData.length : 0);
        }

        if (attendanceDataResult) {
          setAttendanceOverview(attendanceDataResult);
        }

        if (pointsDataResult) {
          setPointsOverview(pointsDataResult);
        }

        if (meData) {
          setDashboardUser(meData);
        }

        if (
          studentsResult.status === "rejected" ||
          teachersResult.status === "rejected" ||
          circlesResult.status === "rejected" ||
          attendanceResult.status === "rejected" ||
          pointsResult.status === "rejected" ||
          meResult.status === "rejected"
        ) {
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
  }, [axiosClient]);

  return (
    <DashboardLayout
      title="لوحة التحكم"
      subtitle={dashboardSubtitle}
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
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
          label="نسبة الحضور"
          value={isLoading ? "..." : formatPercent(attendanceOverview?.overallSummary.studentAverageAttendance ?? 0)}
          change="من تقارير الحضور"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Attendance */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-gray-800">أعلى نسب حضور الطلاب</h3>
            </div>

            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toFixed(1)}%`, "نسبة الحضور"]}
                    contentStyle={{
                      borderRadius: "10px",
                      border: "none",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                      direction: "rtl",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[8, 8, 0, 0]}
                    className="fill-green-600"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
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