import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, CalendarDays, TrendingUp } from "lucide-react";

const reportCards = [
	{
		title: "تقارير الطلاب",
		description: "متابعة الحضور والحفظ والأداء لكل طالب",
		status: "متاح",
		icon: Users,
	},
	{
		title: "تقارير الأساتذة",
		description: "إحصاءات النقاط والالتزام ونشاط الحلقات",
		status: "متاح",
		icon: TrendingUp,
	},
	{
		title: "تقارير الفصول",
		description: "ملخص شامل للفصول والكورسات المرتبطة",
		status: "متاح",
		icon: CalendarDays,
	},
	{
		title: "تقارير مخصصة",
		description: "تصفية النتائج حسب التاريخ والفصل والحلقة",
		status: "قريبًا",
		icon: FileText,
	},
];

const ReportsPage = () => {
	return (
		<DashboardLayout title="التقارير" subtitle="عرض الملخصات والإحصاءات التفصيلية">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{reportCards.map((item) => (
					<Card key={item.title} className="glass-card border-border/60">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-lg font-bold">{item.title}</CardTitle>
							<item.icon className="h-5 w-5 text-primary" />
						</CardHeader>

						<CardContent>
							<p className="text-sm text-muted-foreground mb-3">{item.description}</p>
							<Badge variant={item.status === "متاح" ? "default" : "secondary"}>{item.status}</Badge>
						</CardContent>
					</Card>
				))}
			</div>
		</DashboardLayout>
	);
};

export default ReportsPage;
