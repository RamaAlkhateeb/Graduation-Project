import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, UserMinus } from "lucide-react";

const AttendanceChooserPage = () => {
  return (
    <DashboardLayout
      title="تسجيل الحضور"
      subtitle="اختر نوع العملية التي تريد تنفيذها"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
        <Card className="glass-card p-6 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <UserCheck className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">تسجيل حضور الطالب</h3>
            <p className="text-sm text-muted-foreground mt-1">
              اختر الفصل والكورس والحلقة، ثم سجّل حضور الطلاب.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link to="/attendance/check-in">تسجيل حضور</Link>
          </Button>
        </Card>

        <Card className="glass-card p-6 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <UserMinus className="h-7 w-7 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-lg">تسجيل خروج الطالب</h3>
            <p className="text-sm text-muted-foreground mt-1">
              اختر الفصل والكورس والحلقة، ثم سجّل خروج الطلاب من الحلقة.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link to="/attendance/check-out">تسجيل خروج</Link>
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceChooserPage;