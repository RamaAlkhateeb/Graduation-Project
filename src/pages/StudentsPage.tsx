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
import TableRowContextMenu from "@/components/TableRowContextMenu";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Student {
    id: string;
    name: string;
    fatherName: string;
    motherName: string;
    nationalityNumber: string;
    email: string | null;
}

interface StudentPayload {
    name: string;
    fatherName: string;
    motherName: string;
    nationalityNumber: string;
    email: string | null;
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
    courseName: string;
}

interface Halaqa {
    id: string;
    className: string;
}

interface TeacherOption {
    id: string;
    name: string;
}

interface Teacher {
    id: string;
    name: string;
    fatherName: string;
    motherName: string;
    nationalityNumber: string;
    email: string | null;
    userId: string | null;
}

interface StudentFilters {
    pageNumber: number;
    pageSize: number;
    classId: string;
    semesterId: string;
    eventId: string;
    teacherId: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const emptyStudentPayload: StudentPayload = {
    name: "",
    fatherName: "",
    motherName: "",
    nationalityNumber: "",
    email: "",
};

const defaultStudentFilters: StudentFilters = {
    pageNumber: 1,
    pageSize: 100,
    classId: "",
    semesterId: "",
    eventId: "",
    teacherId: "",
};

const StudentsPage = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [halaqas, setHalaqas] = useState<Halaqa[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFilterLoading, setIsFilterLoading] = useState(false);
    const [studentFilters, setStudentFilters] = useState<StudentFilters>(defaultStudentFilters);

    const [newStudent, setNewStudent] = useState<StudentPayload>(emptyStudentPayload);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

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

    const buildStudentParams = (filters: StudentFilters) => ({
        pageNumber: filters.pageNumber,
        pageSize: filters.pageSize,
        ...(filters.classId ? { classId: filters.classId } : {}),
        ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
        ...(filters.eventId ? { eventId: filters.eventId } : {}),
        ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
    });

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

    const fetchTeachersByFilters = async (filters: StudentFilters) => {
        if (!filters.classId) {
            setTeachers([]);
            return;
        }

        try {
            setIsFilterLoading(true);
            const response = await axiosClient.get<Teacher[] | PagedResponse<Teacher>>("/teachers/filtered", {
                params: {
                    pageNumber: 1,
                    pageSize: 100,
                    classId: filters.classId,
                    ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
                    ...(filters.eventId ? { eventId: filters.eventId } : {}),
                },
            });

            const normalizedTeachers = normalizeTeachers(response.data);
            setTeachers(normalizedTeachers.map((teacher) => ({ id: teacher.id, name: teacher.name })));
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل الأساتذة");
        } finally {
            setIsFilterLoading(false);
        }
    };

    const filtered = students.filter(
        (student) =>
            student.name.includes(search) ||
            student.fatherName.includes(search) ||
            student.motherName.includes(search) ||
            student.nationalityNumber.includes(search)
    );

    const fetchStudents = async (filters: StudentFilters = studentFilters) => {
        try {
            setIsLoading(true);
            const response = await axiosClient.get<Student[] | PagedResponse<Student>>("/students/filtered", {
                params: buildStudentParams(filters),
            });

            setStudents(Array.isArray(response.data) ? response.data : response.data.items ?? []);
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل بيانات الطلاب");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
        fetchSemesters();
    }, []);

    const handleApplyStudentFilters = () => {
        fetchStudents(studentFilters);
    };

    const handleResetStudentFilters = () => {
        setStudentFilters(defaultStudentFilters);
        setCourses([]);
        setHalaqas([]);
        setTeachers([]);
        fetchStudents(defaultStudentFilters);
    };

    const handleStudentSemesterChange = (semesterId: string) => {
        const nextFilters = {
            ...studentFilters,
            semesterId,
            eventId: "",
            classId: "",
            teacherId: "",
        };

        setStudentFilters(nextFilters);
        setCourses([]);
        setHalaqas([]);
        setTeachers([]);

        if (semesterId) {
            fetchCoursesBySemester(semesterId);
        }
    };

    const handleStudentEventChange = (eventId: string) => {
        const nextFilters = {
            ...studentFilters,
            eventId,
            classId: "",
            teacherId: "",
        };

        setStudentFilters(nextFilters);
        setHalaqas([]);
        setTeachers([]);

        if (eventId) {
            fetchHalaqasByCourse(eventId);
        }
    };

    const handleStudentClassChange = (classId: string) => {
        const nextFilters = {
            ...studentFilters,
            classId,
            teacherId: "",
        };

        setStudentFilters(nextFilters);
        setTeachers([]);

        if (classId) {
            fetchTeachersByFilters(nextFilters);
        }
    };

    const handleAdd = async () => {
        if (!newStudent.name || !newStudent.fatherName || !newStudent.nationalityNumber) {
            toast.error("يرجى تعبئة الحقول المطلوبة");
            return;
        }

        try {
            setIsLoading(true);
            const payload: StudentPayload = {
                ...newStudent,
                email: newStudent.email || null,
            };

            const response = await axiosClient.post<Student>("/students", payload);

            setStudents((prev) => [...prev, response.data]);
            setNewStudent(emptyStudentPayload);
            setOpen(false);
            toast.success("تمت إضافة الطالب بنجاح");
        } catch (error) {
            console.error(error);
            toast.error("فشل إضافة الطالب");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setIsLoading(true);
            await axiosClient.delete(`/students/${id}`);
            setStudents((prev) => prev.filter((student) => student.id !== id));
            toast.success("تم حذف الطالب");
        } catch (error) {
            console.error(error);
            toast.error("فشل حذف الطالب");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartEdit = (student: Student) => {
        setEditingStudent({ ...student });
        setEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingStudent) return;

        if (
            !editingStudent.name ||
            !editingStudent.fatherName ||
            !editingStudent.nationalityNumber
        ) {
            toast.error("يرجى تعبئة الحقول المطلوبة");
            return;
        }

        try {
            setIsLoading(true);

            const payload: StudentPayload = {
                name: editingStudent.name,
                fatherName: editingStudent.fatherName,
                motherName: editingStudent.motherName,
                nationalityNumber: editingStudent.nationalityNumber,
                email: editingStudent.email || null,
            };

            const response = await axiosClient.put<Student>(
                `/students/${editingStudent.id}`,
                payload
            );

            setStudents((prev) =>
                prev.map((student) =>
                    student.id === editingStudent.id ? response.data : student
                )
            );

            setEditOpen(false);
            setEditingStudent(null);
            toast.success("تم تحديث بيانات الطالب");
        } catch (error) {
            console.error(error);
            toast.error("فشل تحديث بيانات الطالب");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout title="الطلاب" subtitle="إدارة بيانات الطلاب">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pr-10"
                    />
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2" disabled={isLoading}>
                            <Plus className="h-4 w-4" />
                            إضافة طالب
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="font-tajawal" dir="rtl">
                        <DialogHeader>
                            <DialogTitle>إضافة طالب جديد</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            <div>
                                <Label>الاسم</Label>
                                <Input
                                    value={newStudent.name}
                                    onChange={(e) =>
                                        setNewStudent({
                                            ...newStudent,
                                            name: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>اسم الأب</Label>
                                <Input
                                    value={newStudent.fatherName}
                                    onChange={(e) =>
                                        setNewStudent({
                                            ...newStudent,
                                            fatherName: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>اسم الأم</Label>
                                <Input
                                    value={newStudent.motherName}
                                    onChange={(e) =>
                                        setNewStudent({
                                            ...newStudent,
                                            motherName: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>الرقم الوطني</Label>
                                <Input
                                    value={newStudent.nationalityNumber}
                                    onChange={(e) =>
                                        setNewStudent({
                                            ...newStudent,
                                            nationalityNumber: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>البريد الإلكتروني</Label>
                                <Input
                                    type="email"
                                    value={newStudent.email ?? ""}
                                    onChange={(e) =>
                                        setNewStudent({
                                            ...newStudent,
                                            email: e.target.value,
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                    <div>
                        <Label>معرف الفصل</Label>
                        <Select
                            value={studentFilters.semesterId || undefined}
                            onValueChange={handleStudentSemesterChange}
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
                            value={studentFilters.eventId || undefined}
                            onValueChange={handleStudentEventChange}
                            disabled={!studentFilters.semesterId || isFilterLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الحدث" />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map((course) => (
                                    <SelectItem key={course.id} value={course.id}>
                                        {course.courseName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>معرف الحلقة</Label>
                        <Select
                            value={studentFilters.classId || undefined}
                            onValueChange={handleStudentClassChange}
                            disabled={!studentFilters.eventId || isFilterLoading}
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
                        <Label>معرف الأستاذ</Label>
                        <Select
                            value={studentFilters.teacherId || undefined}
                            onValueChange={(teacherId) =>
                                setStudentFilters({ ...studentFilters, teacherId })
                            }
                            disabled={!studentFilters.classId || isFilterLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الأستاذ" />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.map((teacher) => (
                                    <SelectItem key={teacher.id} value={teacher.id}>
                                        {teacher.name}
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
                            value={studentFilters.pageSize}
                            onChange={(e) =>
                                setStudentFilters({
                                    ...studentFilters,
                                    pageSize: Number(e.target.value) || 100,
                                })
                            }
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={handleResetStudentFilters} disabled={isLoading}>
                        إعادة ضبط
                    </Button>
                    <Button type="button" onClick={handleApplyStudentFilters} disabled={isLoading}>
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
                                <th className="p-4 text-right">الإجراءات</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading && students.length === 0 ? (
                                <tr>
                                    <td className="p-4 text-center text-muted-foreground" colSpan={6}>
                                        جاري تحميل البيانات...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td className="p-4 text-center text-muted-foreground" colSpan={6}>
                                        لا توجد بيانات مطابقة
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((student) => (
                                    <TableRowContextMenu
                                        key={student.id}
                                        actions={[
                                            {
                                                label: "تعديل",
                                                icon: <Pencil className="h-4 w-4" />,
                                                onSelect: () => handleStartEdit(student),
                                            },
                                            {
                                                label: "حذف",
                                                icon: <Trash2 className="h-4 w-4" />,
                                                onSelect: () => handleDelete(student.id),
                                                destructive: true,
                                            },
                                        ]}
                                    >
                                        <tr
                                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="p-4">{student.name}</td>
                                            <td className="p-4">{student.fatherName}</td>
                                            <td className="p-4">{student.motherName}</td>
                                            <td className="p-4">{student.nationalityNumber}</td>
                                            <td className="p-4">{student.email || "-"}</td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1"
                                                        onClick={() => handleStartEdit(student)}
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
                                                        onClick={() => handleDelete(student.id)}
                                                        disabled={isLoading}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        حذف
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    </TableRowContextMenu>
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
                    if (!value) setEditingStudent(null);
                }}
            >
                <DialogContent className="font-tajawal" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تعديل بيانات الطالب</DialogTitle>
                    </DialogHeader>

                    {editingStudent && (
                        <div className="space-y-4 mt-4">
                            <div>
                                <Label>الاسم</Label>
                                <Input
                                    value={editingStudent.name}
                                    onChange={(e) =>
                                        setEditingStudent({
                                            ...editingStudent,
                                            name: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>اسم الأب</Label>
                                <Input
                                    value={editingStudent.fatherName}
                                    onChange={(e) =>
                                        setEditingStudent({
                                            ...editingStudent,
                                            fatherName: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>اسم الأم</Label>
                                <Input
                                    value={editingStudent.motherName}
                                    onChange={(e) =>
                                        setEditingStudent({
                                            ...editingStudent,
                                            motherName: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>الرقم الوطني</Label>
                                <Input
                                    value={editingStudent.nationalityNumber}
                                    onChange={(e) =>
                                        setEditingStudent({
                                            ...editingStudent,
                                            nationalityNumber: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>البريد الإلكتروني</Label>
                                <Input
                                    type="email"
                                    value={editingStudent.email ?? ""}
                                    onChange={(e) =>
                                        setEditingStudent({
                                            ...editingStudent,
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

export default StudentsPage;
