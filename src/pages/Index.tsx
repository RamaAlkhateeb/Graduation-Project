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

const attendanceData = [
  { day: "الأحد", حضور: 85 },
  { day: "الإثنين", حضور: 92 },
  { day: "الثلاثاء", حضور: 78 },
  { day: "الأربعاء", حضور: 95 },
  { day: "الخميس", حضور: 88 },
  { day: "الجمعة", حضور: 70 },
  { day: "السبت", حضور: 82 },
];

const circleDistribution = [
  { name: "حلقة الفجر", value: 25, color: "#166534" },
  { name: "حلقة العصر", value: 30, color: "#f59e0b" },
  { name: "حلقة المغرب", value: 20, color: "#0ea5e9" },
  { name: "حلقة العشاء", value: 15, color: "#ef4444" },
];

const recentActivities = [
  { text: "تم إضافة الطالب أحمد محمد إلى حلقة الفجر", time: "منذ ساعة" },
  { text: "الأستاذ خالد أرسل تقييم لـ 12 طالب", time: "منذ ساعتين" },
  { text: "تم جدولة اختبار سورة البقرة", time: "منذ 3 ساعات" },
  { text: "استبيان رضا الأهالي - 45 رد جديد", time: "منذ 5 ساعات" },
  { text: "تم تعيين الأستاذ سامر لحلقة المغرب", time: "أمس" },
];

const Card = ({ children }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition">
    {children}
  </div>
);

const Index = () => {
  return (
    <DashboardLayout
      title="لوحة التحكم"
      subtitle="نظرة عامة على إدارة الحلقات القرآنية"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard icon={GraduationCap} label="إجمالي الطلاب" value={156} change="+12 هذا الشهر" />
        <StatCard icon={Users} label="الأساتذة" value={14} change="+2 جدد" />
        <StatCard icon={BookOpen} label="الحلقات النشطة" value={8} />
        <StatCard icon={ClipboardCheck} label="نسبة الحضور" value="87%" change="↑ 3%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Attendance */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-gray-800">الحضور الأسبوعي</h3>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                    direction: "rtl",
                  }}
                />
                <Bar
                  dataKey="حضور"
                  radius={[8, 8, 0, 0]}
                  className="fill-green-600"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Pie */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-gray-800">توزيع الحلقات</h3>
          </div>

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
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <h3 className="font-bold text-gray-800 mb-6">النشاط الأخير</h3>

        <div className="relative">
          <div className="absolute right-2 top-0 bottom-0 w-[2px] bg-gray-200" />

          <div className="space-y-5">
            {recentActivities.map((item, i) => (
              <div key={i} className="flex gap-4 relative">
                <div className="w-4 h-4 bg-green-600 rounded-full mt-1 z-10" />

                <div className="flex-1 flex justify-between">
                  <p className="text-sm text-gray-700">{item.text}</p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default Index;