import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Teacher {
    id: string;
    name: string;
    fatherName: string;
    motherName: string;
    nationalityNumber: string;
    email: string | null;
    userId: string | null;
}

interface TeacherPayload {
    name: string;
    fatherName: string;
    motherName: string;
    nationalityNumber: string;
    email: string | null;
    userId: string | null;
}

interface PagedResponse<T> {
    items?: T[];
}

interface Semester {
    id: string;
    name: string;
}

interface Course {
    id: string;
    eventName: string;
}

interface Halaqa {
    id: string;
    className: string;
}

interface TeacherFilters {
    pageNumber: number;
    pageSize: number;
    classId: string;
    semesterId: string;
    eventId: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://alashmar.runasp.net";

const emptyTeacherPayload: TeacherPayload = {
    name: "",
    fatherName: "",
    motherName: "",
    nationalityNumber: "",
    email: "",
    userId: "",
};

const defaultTeacherFilters: TeacherFilters = {
    pageNumber: 1,
    pageSize: 100,
    classId: "",
    semesterId: "",
    eventId: "",
};

const TeachersPage = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [halaqas, setHalaqas] = useState<Halaqa[]>([]);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFilterLoading, setIsFilterLoading] = useState(false);
    const [teacherFilters, setTeacherFilters] = useState<TeacherFilters>(defaultTeacherFilters);
    const [newTeacher, setNewTeacher] = useState<TeacherPayload>(emptyTeacherPayload);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

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

    const buildTeacherParams = (filters: TeacherFilters) => ({
        pageNumber: filters.pageNumber,
        pageSize: filters.pageSize,
        ...(filters.classId ? { classId: filters.classId } : {}),
        ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
        ...(filters.eventId ? { eventId: filters.eventId } : {}),
    });

    const filteredTeachers = teachers.filter(
        (teacher) =>
            teacher.name.includes(search) ||
            teacher.fatherName.includes(search) ||
            teacher.motherName.includes(search) ||
            teacher.nationalityNumber.includes(search) ||
            (teacher.email ?? "").includes(search)
    );

    const normalizeTeachers = (data: Teacher[] | PagedResponse<Teacher>) => {
        if (Array.isArray(data)) {
            return data;
        }

        return data.items ?? [];
    };

    const fetchSemesters = async () => {
        try {
            setIsFilterLoading(true);
            const response = await axiosClient.get<Semester[]>("/Semesters");
            setSemesters(response.data);
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل الفصول");
        } finally {
            setIsFilterLoading(false);
        }
    };

    const fetchCoursesBySemester = async (semesterId: string) => {
        try {
            setIsFilterLoading(true);
            const response = await axiosClient.get<Course[]>(`/courses/by-semester/${semesterId}`);
            setCourses(response.data);
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل الأحداث");
        } finally {
            setIsFilterLoading(false);
        }
    };

    const fetchHalaqasByCourse = async (courseId: string) => {
        try {
            setIsFilterLoading(true);
            const response = await axiosClient.get<Halaqa[]>(`/halaqas/by-course/${courseId}`);
            setHalaqas(response.data);
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل الحلقات");
        } finally {
            setIsFilterLoading(false);
        }
    };

    const fetchTeachers = async (filters: TeacherFilters = teacherFilters) => {
        try {
            setIsLoading(true);
            const response = await axiosClient.get<Teacher[] | PagedResponse<Teacher>>(
                "/teachers/filtered",
                {
                    params: buildTeacherParams(filters),
                }
            );

            setTeachers(normalizeTeachers(response.data));
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل بيانات الأساتذة");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
        fetchSemesters();
    }, []);

    const handleApplyTeacherFilters = () => {
        fetchTeachers(teacherFilters);
    };

    const handleResetTeacherFilters = () => {
        setTeacherFilters(defaultTeacherFilters);
        setCourses([]);
        setHalaqas([]);
        fetchTeachers(defaultTeacherFilters);
    };

    const handleTeacherSemesterChange = (semesterId: string) => {
        setTeacherFilters({
            ...teacherFilters,
            semesterId,
            eventId: "",
            classId: "",
        });
        setCourses([]);
        setHalaqas([]);

        if (semesterId) {
            fetchCoursesBySemester(semesterId);
        }
    };

    const handleTeacherEventChange = (eventId: string) => {
        setTeacherFilters({
            ...teacherFilters,
            eventId,
            classId: "",
        });
        setHalaqas([]);

        if (eventId) {
            fetchHalaqasByCourse(eventId);
        }
    };

    const handleAdd = async () => {
        if (
            !newTeacher.name ||
            !newTeacher.fatherName ||
            !newTeacher.motherName ||
            !newTeacher.nationalityNumber ||
            !newTeacher.userId
        ) {
            toast.error("يرجى تعبئة الحقول المطلوبة");
            return;
        }

        try {
            setIsLoading(true);
            const payload: TeacherPayload = {
                ...newTeacher,
                email: newTeacher.email || null,
                userId: newTeacher.userId || null,
            };

            await axiosClient.post("/teachers", payload);
            await fetchTeachers();
            setNewTeacher(emptyTeacherPayload);
            setOpen(false);
            toast.success("تمت إضافة الأستاذ بنجاح");
        } catch (error) {
            console.error(error);
            toast.error("فشل إضافة الأستاذ");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setIsLoading(true);
            await axiosClient.delete(`/teachers/${id}`);
            setTeachers((prev) => prev.filter((teacher) => teacher.id !== id));
            toast.success("تم حذف الأستاذ");
        } catch (error) {
            console.error(error);
            toast.error("فشل حذف الأستاذ");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartEdit = (teacher: Teacher) => {
        setEditingTeacher({ ...teacher });
        setEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingTeacher) return;

        if (
            !editingTeacher.name ||
            !editingTeacher.fatherName ||
            !editingTeacher.motherName ||
            !editingTeacher.nationalityNumber
        ) {
            toast.error("يرجى تعبئة الحقول المطلوبة");
            return;
        }

        try {
            setIsLoading(true);

            const payload = {
                name: editingTeacher.name,
                fatherName: editingTeacher.fatherName,
                motherName: editingTeacher.motherName,
                nationalityNumber: editingTeacher.nationalityNumber,
                email: editingTeacher.email || null,
            };

            await axiosClient.put(`/teachers/${editingTeacher.id}`, payload);
            await fetchTeachers();
            setEditOpen(false);
            setEditingTeacher(null);
            toast.success("تم تحديث بيانات الأستاذ");
        } catch (error) {
            console.error(error);
            toast.error("فشل تحديث بيانات الأستاذ");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout title="الأساتذة" subtitle="إدارة حسابات الأساتذة">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث عن أستاذ..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pr-10"
                    />
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2" disabled={isLoading}>
                            <Plus className="h-4 w-4" />
                            إضافة أستاذ
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="font-tajawal" dir="rtl">
                        <DialogHeader>
                            <DialogTitle>إضافة أستاذ جديد</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            <div>
                                <Label>الاسم الكامل</Label>
                                <Input
                                    value={newTeacher.name}
                                    onChange={(e) =>
                                        setNewTeacher({
                                            ...newTeacher,
                                            name: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>اسم الأب</Label>
                                <Input
                                    value={newTeacher.fatherName}
                                    onChange={(e) =>
                                        setNewTeacher({
                                            ...newTeacher,
                                            fatherName: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>اسم الأم</Label>
                                <Input
                                    value={newTeacher.motherName}
                                    onChange={(e) =>
                                        setNewTeacher({
                                            ...newTeacher,
                                            motherName: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>الرقم الوطني</Label>
                                <Input
                                    value={newTeacher.nationalityNumber}
                                    onChange={(e) =>
                                        setNewTeacher({
                                            ...newTeacher,
                                            nationalityNumber: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>البريد الإلكتروني</Label>
                                <Input
                                    type="email"
                                    value={newTeacher.email ?? ""}
                                    onChange={(e) =>
                                        setNewTeacher({
                                            ...newTeacher,
                                            email: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>معرّف المستخدم</Label>
                                <Input
                                    value={newTeacher.userId ?? ""}
                                    onChange={(e) =>
                                        setNewTeacher({
                                            ...newTeacher,
                                            userId: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <Button onClick={handleAdd} className="w-full" disabled={isLoading}>
                                إضافة
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="glass-card rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    <div>
                        <Label>معرف الفصل</Label>
                        <Select
                            value={teacherFilters.semesterId || undefined}
                            onValueChange={handleTeacherSemesterChange}
                            disabled={isFilterLoading}
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

                    <div>
                        <Label>معرف الحدث</Label>
                        <Select
                            value={teacherFilters.eventId || undefined}
                            onValueChange={handleTeacherEventChange}
                            disabled={!teacherFilters.semesterId || isFilterLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الحدث" />
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

                    <div>
                        <Label>معرف الحلقة</Label>
                        <Select
                            value={teacherFilters.classId || undefined}
                            onValueChange={(classId) =>
                                setTeacherFilters({ ...teacherFilters, classId })
                            }
                            disabled={!teacherFilters.eventId || isFilterLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الحلقة" />
                            </SelectTrigger>
                            <SelectContent>
                                {halaqas.map((halaqa) => (
                                    <SelectItem key={halaqa.id} value={halaqa.id}>
                                        {halaqa.className}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>عدد النتائج</Label>
                        <Input
                            type="number"
                            min="1"
                            value={teacherFilters.pageSize}
                            onChange={(e) =>
                                setTeacherFilters({
                                    ...teacherFilters,
                                    pageSize: Number(e.target.value) || 100,
                                })
                            }
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={handleResetTeacherFilters} disabled={isLoading}>
                        إعادة ضبط
                    </Button>
                    <Button type="button" onClick={handleApplyTeacherFilters} disabled={isLoading}>
                        تطبيق الفلاتر
                    </Button>
                </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="p-4 text-right">الاسم</th>
                                <th className="p-4 text-right">اسم الأب</th>
                                <th className="p-4 text-right">اسم الأم</th>
                                <th className="p-4 text-right">الرقم الوطني</th>
                                <th className="p-4 text-right">البريد الإلكتروني</th>
                                <th className="p-4 text-right">معرّف المستخدم</th>
                                <th className="p-4 text-right">الإجراءات</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading && teachers.length === 0 ? (
                                <tr>
                                    <td className="p-4 text-center text-muted-foreground" colSpan={7}>
                                        جاري تحميل البيانات...
                                    </td>
                                </tr>
                            ) : filteredTeachers.length === 0 ? (
                                <tr>
                                    <td className="p-4 text-center text-muted-foreground" colSpan={7}>
                                        لا توجد بيانات مطابقة
                                    </td>
                                </tr>
                            ) : (
                                filteredTeachers.map((teacher) => (
                                    <tr
                                        key={teacher.id}
                                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="p-4">{teacher.name}</td>
                                        <td className="p-4">{teacher.fatherName}</td>
                                        <td className="p-4">{teacher.motherName}</td>
                                        <td className="p-4">{teacher.nationalityNumber}</td>
                                        <td className="p-4">{teacher.email || "-"}</td>
                                        <td className="p-4">{teacher.userId || "-"}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1"
                                                    onClick={() => handleStartEdit(teacher)}
                                                    disabled={isLoading}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    تعديل
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="gap-1"
                                                    onClick={() => handleDelete(teacher.id)}
                                                    disabled={isLoading}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    حذف
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog
                open={editOpen}
                onOpenChange={(value) => {
                    setEditOpen(value);
                    if (!value) setEditingTeacher(null);
                }}
            >
                <DialogContent className="font-tajawal" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تعديل بيانات الأستاذ</DialogTitle>
                    </DialogHeader>

                    {editingTeacher && (
                        <div className="space-y-4 mt-4">
                            <div>
                                <Label>الاسم الكامل</Label>
                                <Input
                                    value={editingTeacher.name}
                                    onChange={(e) =>
                                        setEditingTeacher({
                                            ...editingTeacher,
                                            name: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>اسم الأب</Label>
                                <Input
                                    value={editingTeacher.fatherName}
                                    onChange={(e) =>
                                        setEditingTeacher({
                                            ...editingTeacher,
                                            fatherName: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>اسم الأم</Label>
                                <Input
                                    value={editingTeacher.motherName}
                                    onChange={(e) =>
                                        setEditingTeacher({
                                            ...editingTeacher,
                                            motherName: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>الرقم الوطني</Label>
                                <Input
                                    value={editingTeacher.nationalityNumber}
                                    onChange={(e) =>
                                        setEditingTeacher({
                                            ...editingTeacher,
                                            nationalityNumber: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>البريد الإلكتروني</Label>
                                <Input
                                    type="email"
                                    value={editingTeacher.email ?? ""}
                                    onChange={(e) =>
                                        setEditingTeacher({
                                            ...editingTeacher,
                                            email: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <Button onClick={handleUpdate} className="w-full" disabled={isLoading}>
                                حفظ التعديلات
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default TeachersPage;
