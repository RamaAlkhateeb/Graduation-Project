import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Pencil, Trash2, BookMarked } from "lucide-react";
import { toast } from "sonner";
import TableRowContextMenu from "@/components/TableRowContextMenu";
import Pagination from "@/components/ui/pagination";

interface Course {
    id: string;
    courseName?: string | null;
    semesterId: string | null;
}

interface Halaqa {
    id: string;
    className?: string | null;
    courseId: string | null;
}

interface Semester {
    id: string;
    name: string;
}

interface CoursePayload {
    courseName: string;
    semesterId: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://alashmar.runasp.net/api";

const emptyCoursePayload: CoursePayload = {
    courseName: "",
    semesterId: "",
};

const CoursesPage = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [halaqas, setHalaqas] = useState<Halaqa[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Course | null>(null);
    const [relatedCourse, setRelatedCourse] = useState<Course | null>(null);
    const [form, setForm] = useState<CoursePayload>(emptyCoursePayload);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedSemester, setSelectedSemester] = useState<string>("all");

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

    const semesterNameById = useMemo(() => {
        return new Map(semesters.map((semester) => [semester.id, semester.name]));
    }, [semesters]);

    const filteredCourses = courses.filter((course) => {
        const matchesSearch =
            (course.courseName ?? "")
                .toLowerCase()
                .includes(search.toLowerCase());

        const matchesSemester =
            selectedSemester === "all" ||
            course.semesterId === selectedSemester;

        return matchesSearch && matchesSemester;
    });

    const pagedCourses = filteredCourses.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

    const fetchSemesters = async () => {
        try {
            const response = await axiosClient.get<Semester[]>("/Semesters");
            setSemesters(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل الفصول");
        }
    };

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get<Course[]>("/courses");
            setCourses(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل الكورسات");
        } finally {
            setLoading(false);
        }
    };

    const fetchHalaqas = async () => {
        try {
            const response = await axiosClient.get<Halaqa[]>("/halaqas");
            setHalaqas(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchSemesters();
        fetchCourses();
        fetchHalaqas();
    }, []);

    useEffect(() => {
        setPageNumber(1);
    }, [search, selectedSemester]);

    const resetForm = () => {
        setForm(emptyCoursePayload);
        setSelected(null);
    };

    const handleSave = async () => {
        if (!form.courseName || !form.semesterId) {
            toast.error("يرجى تعبئة الحقول المطلوبة");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                courseName: form.courseName,
                semesterId: form.semesterId,
            };

            if (selected) {
                await axiosClient.put(`/courses/${selected.id}`, payload);
                toast.success("تم تعديل الكورس بنجاح");
            } else {
                await axiosClient.post("/courses", payload);
                toast.success("تمت إضافة الكورس بنجاح");
            }

            setOpen(false);
            resetForm();
            fetchCourses();
        } catch (error) {
            console.error(error);
            toast.error("حدث خطأ أثناء الحفظ");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (course: Course) => {
        setSelected(course);
        setForm({
            courseName: course.courseName ?? "",
            semesterId: course.semesterId ?? "",
        });
        setOpen(true);
    };

    const handleShowHalaqas = (course: Course) => {
        setRelatedCourse(course);
    };

    const relatedHalaqas = halaqas.filter((halaqa) => halaqa.courseId === relatedCourse?.id);

    const handleDelete = async (course: Course) => {
        try {
            setLoading(true);
            await axiosClient.delete(`/courses/${course.id}`);
            toast.success("تم حذف الكورس بنجاح");
            fetchCourses();
        } catch (error) {
            console.error(error);
            toast.error("فشل حذف الكورس");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout title="الكورسات" subtitle="إدارة الدورات التدريبية وعرض تفاصيلها">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                <div className="relative flex-1">
                    <Input
                        placeholder="بحث عن كورس..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="w-full sm:w-60">
                    <Select
                        value={selectedSemester}
                        onValueChange={setSelectedSemester}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="اختر الفصل" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="all">
                                جميع الفصول
                            </SelectItem>

                            {semesters.map((semester) => (
                                <SelectItem
                                    key={semester.id}
                                    value={semester.id}
                                >
                                    {semester.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Dialog
                    open={open}
                    onOpenChange={(value) => {
                        setOpen(value);
                        if (!value) resetForm();
                    }}
                >
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            إضافة كورس
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="font-tajawal" dir="rtl">
                        <DialogHeader>
                            <DialogTitle>{selected ? "تعديل كورس" : "إضافة كورس جديد"}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            <div>
                                <Label>اسم الكورس</Label>
                                <Input
                                    value={form.courseName}
                                    onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                                    placeholder="مثال: دورة التجويد"
                                />
                            </div>

                            <div>
                                <Label>الفصل</Label>
                                <Select
                                    // ✅ التعديل هنا: استخدام القيمة مباشرة بدون || undefined
                                    value={form.semesterId !== "" ? form.semesterId : undefined}
                                    onValueChange={(semesterId) => setForm({ ...form, semesterId })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر الفصل" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {semesters.map((semester) => (
                                            <SelectItem key={semester.id} value={semester.id}>
                                                {semester.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={handleSave} className="w-full" disabled={loading}>
                                {loading ? "جارٍ الحفظ..." : "حفظ"}
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
                                <th className="p-4 text-right">اسم الكورس</th>
                                <th className="p-4 text-right">الفصل</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedCourses.map((course) => (
                                <TableRowContextMenu
                                    key={course.id}
                                    actions={[
                                        {
                                            label: "عرض الحلقات",
                                            icon: <BookMarked className="h-4 w-4" />,
                                            onSelect: () => handleShowHalaqas(course),
                                        },
                                        {
                                            label: "تعديل",
                                            icon: <Pencil className="h-4 w-4" />,
                                            onSelect: () => handleEdit(course),
                                        },
                                        {
                                            label: "حذف",
                                            icon: <Trash2 className="h-4 w-4" />,
                                            onSelect: () => handleDelete(course),
                                            destructive: true,
                                        },
                                    ]}
                                >
                                    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                        <td className="p-4 font-medium">{course.courseName || "-"}</td>
                                        <td className="p-4">
                                            <Badge variant="secondary">
                                                {semesterNameById.get(course.semesterId ?? "") ?? "غير محدد"}
                                            </Badge>
                                        </td>

                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(course)}>
                                                    <Pencil className="h-4 w-4 ml-1" />
                                                    تعديل
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(course)}>
                                                    <Trash2 className="h-4 w-4 ml-1" />
                                                    حذف
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                </TableRowContextMenu>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-3">
                <div />
                <Pagination
                    currentPage={pageNumber}
                    totalPages={Math.max(1, Math.ceil(filteredCourses.length / pageSize))}
                    onPageChange={(page) => {
                        setPageNumber(page);
                    }}
                />
            </div>

            <Dialog open={!!relatedCourse} onOpenChange={() => setRelatedCourse(null)}>
                <DialogContent dir="rtl" className="font-tajawal max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>الحلقات التابعة للكورس</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                        {relatedHalaqas.length === 0 ? (
                            <p className="text-sm text-muted-foreground">لا توجد حلقات مرتبطة بهذا الكورس.</p>
                        ) : (
                            relatedHalaqas.map((halaqa) => (
                                <div key={halaqa.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <span className="font-medium">{halaqa.className || "-"}</span>
                                    <span className="text-sm text-muted-foreground">{halaqa.id}</span>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default CoursesPage;
