import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, User, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import TableRowContextMenu from "@/components/TableRowContextMenu";

interface Halaqa {
    id: string;
    className: string;
    courseId: string | null;
}

interface Course {
    id: string;
    eventName: string;
    semesterId?: string | null;
}

interface Semester {
    id: string;
    name: string;
}

interface HalaqaPayload {
    className: string;
    courseId: string;
}

interface StudentBrief {
    id: string;
    name: string;
    fatherName: string;
    nationalityNumber: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://alashmar.runasp.net/api";

const emptyHalaqaPayload: HalaqaPayload = {
    className: "",
    courseId: "",
};

const CirclesPage = () => {
    const [circles, setCircles] = useState<Halaqa[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [students, setStudents] = useState<StudentBrief[]>([]);
    const [search, setSearch] = useState("");
    const [selectedSemesterId, setSelectedSemesterId] = useState("");
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [open, setOpen] = useState(false);
    const [studentsOpen, setStudentsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [selected, setSelected] = useState<Halaqa | null>(null);
    const [selectedCircleForStudents, setSelectedCircleForStudents] = useState<Halaqa | null>(null);
    const [form, setForm] = useState<HalaqaPayload>(emptyHalaqaPayload);

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

    const courseNameById = useMemo(() => {
        return new Map(courses.map((course) => [course.id, course.eventName]));
    }, [courses]);

    const filteredCourses = useMemo(() => {
        if (!selectedSemesterId) {
            return courses;
        }

        return courses.filter((course) => course.semesterId === selectedSemesterId);
    }, [courses, selectedSemesterId]);

    const filteredCircles = useMemo(() => {
        return circles.filter((circle) => {
            const matchesSearch = circle.className.includes(search);
            const matchesCourse = !selectedCourseId || circle.courseId === selectedCourseId;

            return matchesSearch && matchesCourse;
        });
    }, [circles, search, selectedCourseId]);

    const fetchSemesters = async () => {
        try {
            const response = await axiosClient.get<Semester[]>("/Semesters");
            setSemesters(response.data);
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل الفصول");
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await axiosClient.get<Course[]>("/courses");
            setCourses(response.data);
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل الكورسات");
        }
    };

    const fetchCircles = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get<Halaqa[]>("/halaqas");
            setCircles(response.data);
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل الحلقات");
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentsForCircle = async (circle: Halaqa) => {
        try {
            setStudentsLoading(true);
            const response = await axiosClient.get<StudentBrief[]>("/students/filtered", {
                params: {
                    pageNumber: 1,
                    pageSize: 100,
                    classId: circle.id,
                },
            });

            setStudents(response.data);
            setSelectedCircleForStudents(circle);
            setStudentsOpen(true);
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل الطلاب المسجلين");
        } finally {
            setStudentsLoading(false);
        }
    };

    useEffect(() => {
        fetchSemesters();
        fetchCourses();
        fetchCircles();
    }, []);

    const handleSemesterChange = (semesterId: string) => {
        setSelectedSemesterId(semesterId);
        setSelectedCourseId("");
    };

    const handleCourseChange = (courseId: string) => {
        setSelectedCourseId(courseId);
    };

    const handleResetFilters = () => {
        setSearch("");
        setSelectedSemesterId("");
        setSelectedCourseId("");
    };

    const resetForm = () => {
        setForm(emptyHalaqaPayload);
        setSelected(null);
    };

    const handleSave = async () => {
        if (!form.className || !form.courseId) {
            toast.error("يرجى تعبئة الحقول المطلوبة");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                className: form.className,
                courseId: form.courseId,
            };

            if (selected) {
                await axiosClient.put(`/halaqas/${selected.id}`, payload);
                toast.success("تم تعديل الحلقة بنجاح");
            } else {
                await axiosClient.post("/halaqas", payload);
                toast.success("تمت إضافة الحلقة بنجاح");
            }

            setOpen(false);
            resetForm();
            fetchCircles();
        } catch (error) {
            console.error(error);
            toast.error("حدث خطأ أثناء الحفظ");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (circle: Halaqa) => {
        setSelected(circle);
        setForm({
            className: circle.className,
            courseId: circle.courseId ?? "",
        });
        setOpen(true);
    };

    const handleDelete = async (circle: Halaqa) => {
        try {
            setLoading(true);
            await axiosClient.delete(`/halaqas/${circle.id}`);
            toast.success("تم حذف الحلقة بنجاح");
            fetchCircles();
        } catch (error) {
            console.error(error);
            toast.error("فشل حذف الحلقة");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout title="الحلقات" subtitle="إنشاء وإدارة الحلقات القرآنية وتعيين الأساتذة">
            <div className="glass-card rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <Label>الفصل</Label>
                        <Select value={selectedSemesterId || undefined} onValueChange={handleSemesterChange}>
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

                    <div>
                        <Label>الكورس</Label>
                        <Select
                            value={selectedCourseId || undefined}
                            onValueChange={handleCourseChange}
                            disabled={!selectedSemesterId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الكورس" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredCourses.map((course) => (
                                    <SelectItem key={course.id} value={course.id}>
                                        {course.eventName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        <Button type="button" variant="outline" className="w-full" onClick={handleResetFilters}>
                            إعادة ضبط الفلاتر
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                <div className="relative flex-1">
                    <Input
                        placeholder="بحث عن حلقة..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
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
                            إضافة حلقة
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="font-tajawal" dir="rtl">
                        <DialogHeader>
                            <DialogTitle>{selected ? "تعديل حلقة" : "إنشاء حلقة جديدة"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div>
                                <Label>اسم الحلقة</Label>
                                <Input
                                    value={form.className}
                                    onChange={(e) => setForm({ ...form, className: e.target.value })}
                                    placeholder="مثال: حلقة الفجر"
                                />
                            </div>
                            <div>
                                <Label>الكورس</Label>
                                <Select
                                    value={form.courseId || undefined}
                                    onValueChange={(courseId) => setForm({ ...form, courseId })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر الكورس" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map((course) => (
                                            <SelectItem key={course.id} value={course.id}>
                                                {course.eventName}
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
                                <th className="p-4 text-right">اسم الحلقة</th>
                                <th className="p-4 text-right">الكورس</th>
                                <th className="p-4 text-right">معرّف الحلقة</th>
                                <th className="p-4 text-right">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCircles.map((circle) => (
                                <TableRowContextMenu
                                    key={circle.id}
                                    actions={[
                                        {
                                            label: "عرض الطلاب المسجلين",
                                            icon: <Users className="h-4 w-4" />,
                                            onSelect: () => void fetchStudentsForCircle(circle),
                                        },
                                        {
                                            label: "تعديل",
                                            icon: <Pencil className="h-4 w-4" />,
                                            onSelect: () => handleEdit(circle),
                                        },
                                        {
                                            label: "حذف",
                                            icon: <Trash2 className="h-4 w-4" />,
                                            onSelect: () => handleDelete(circle),
                                            destructive: true,
                                        },
                                    ]}
                                >
                                    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                        <td className="p-4 font-medium">{circle.className}</td>
                                        <td className="p-4">{courseNameById.get(circle.courseId ?? "") ?? "غير محدد"}</td>
                                        <td className="p-4">{circle.id}</td>
                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">
                                                <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(circle)}>
                                                    <Pencil className="h-4 w-4 ml-1" />
                                                    تعديل
                                                </Button>
                                                <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(circle)} disabled={loading}>
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

            <Dialog open={studentsOpen} onOpenChange={setStudentsOpen}>
                <DialogContent dir="rtl" className="font-tajawal max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            الطلاب المسجلون في {selectedCircleForStudents?.className ?? "الحلقة"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 mt-4">
                        {studentsLoading ? (
                            <p className="text-sm text-muted-foreground">جاري تحميل الطلاب...</p>
                        ) : students.length === 0 ? (
                            <p className="text-sm text-muted-foreground">لا يوجد طلاب مسجلون.</p>
                        ) : (
                            students.map((student) => (
                                <div key={student.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <div className="font-medium">{student.name}</div>
                                        <div className="text-sm text-muted-foreground">{student.fatherName}</div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{student.nationalityNumber}</div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default CirclesPage;
