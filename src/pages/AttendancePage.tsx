import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

const weeklyData = [
  { week: "الأسبوع 1", حضور: 82, تقدم: 65 },
  { week: "الأسبوع 2", حضور: 88, تقدم: 70 },
  { week: "الأسبوع 3", حضور: 85, تقدم: 72 },
  { week: "الأسبوع 4", حضور: 91, تقدم: 78 },
];

const circleAttendance = [
  { name: "حلقة الفجر", حاضر: 16, غائب: 2 },
  { name: "حلقة العصر", حاضر: 22, غائب: 3 },
  { name: "حلقة المغرب", حاضر: 18, غائب: 2 },
  { name: "حلقة العشاء", حاضر: 12, غائب: 3 },
];

const topStudents = [
  { name: "يوسف علي", circle: "حلقة المغرب", progress: 90 },
  { name: "إبراهيم كريم", circle: "حلقة الفجر", progress: 85 },
  { name: "أحمد محمد", circle: "حلقة الفجر", progress: 75 },
  { name: "عمر سعيد", circle: "حلقة العصر", progress: 60 },
  { name: "خالد حسن", circle: "حلقة العشاء", progress: 45 },
];

const AttendancePage = () => {
  return (
    <DashboardLayout title="الحضور والتقدم" subtitle="إحصائيات تفصيلية عن حضور الطلاب وتقدمهم">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-lg font-bold mb-4 text-foreground">تطور الحضور والتقدم الشهري</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 20%, 88%)" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fontFamily: "Tajawal" }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: "12px", fontFamily: "Tajawal", direction: "rtl" }} />
              <Legend wrapperStyle={{ fontFamily: "Tajawal" }} />
              <Line type="monotone" dataKey="حضور" stroke="hsl(152, 45%, 28%)" strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="تقدم" stroke="hsl(42, 75%, 55%)" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-lg font-bold mb-4 text-foreground">حضور الحلقات اليوم</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={circleAttendance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 20%, 88%)" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontFamily: "Tajawal" }} width={90} />
              <Tooltip contentStyle={{ borderRadius: "12px", fontFamily: "Tajawal", direction: "rtl" }} />
              <Bar dataKey="حاضر" fill="hsl(152, 45%, 28%)" radius={[0, 6, 6, 0]} />
              <Bar dataKey="غائب" fill="hsl(0, 72%, 51%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-lg font-bold mb-4 text-foreground">ترتيب الطلاب حسب التقدم</h3>
        <div className="space-y-3">
          {topStudents.map((s, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${i < 3 ? "gradient-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.circle}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${s.progress}%` }} />
                </div>
                <span className="text-sm font-bold text-foreground w-10 text-left">{s.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AttendancePage;
