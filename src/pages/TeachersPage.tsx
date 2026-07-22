import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import DashboardLayout from "@/components/DashboardLayout";
import TableRowContextMenu from "@/components/TableRowContextMenu";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

import { Label } from "@/components/ui/label";

import {
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";

import { toast } from "sonner";
import Pagination from "@/components/ui/pagination";

// ─── Types ───────────────────────────────────────────────

interface Teacher {
    id: string;
    name: string;
    fatherName: string;
    motherName: string;
    nationalityNumber: string;
    email: string | null;
}

interface TeacherPayload {
    name: string;
    fatherName: string;
    motherName: string;
    nationalityNumber: string;
    email: string | null;
}

interface TeacherFilters {
    pageNumber: number;
    pageSize: number;
    classId?: string;
    semesterId?: string;
    courseId?: string;
}

interface Semester {
    id: string;
    name: string;
}

interface Course {
    id: string;
    courseName: string;
    semesterId: string;
}

interface Halaqa {
    id: string;
    className: string;
    courseId: string;
}

// ─── Constants ───────────────────────────────────────────

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://alashmar.runasp.net/api";

const emptyTeacherPayload: TeacherPayload = {
    name: "",
    fatherName: "",
    motherName: "",
    nationalityNumber: "",
    email: "",
};

const defaultTeacherFilters: TeacherFilters = {
    pageNumber: 1,
    pageSize: 10,
};

// ─── Component ───────────────────────────────────────────

const TeachersPage = () => {

    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [teacherFilters, setTeacherFilters] = useState<TeacherFilters>(defaultTeacherFilters);
    const [totalTeachers, setTotalTeachers] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [newTeacher, setNewTeacher] = useState<TeacherPayload>(emptyTeacherPayload);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

    // ── Filter data ──
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [halaqas, setHalaqas] = useState<Halaqa[]>([]);

    // ── Selected filter values ──
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [selectedHalaqaId, setSelectedHalaqaId] = useState<string>("");

    // ── Derived filtered lists (cascade) ──
    const filteredCourses = useMemo(() =>
        selectedSemesterId
            ? courses.filter((c) => c.semesterId === selectedSemesterId)
            : courses,
        [courses, selectedSemesterId]
    );

    const filteredHalaqas = useMemo(() =>
        selectedCourseId
            ? halaqas.filter((h) => h.courseId === selectedCourseId)
            : selectedSemesterId
            ? halaqas.filter((h) =>
                  filteredCourses.some((c) => c.id === h.courseId)
              )
            : halaqas,
        [halaqas, selectedCourseId, selectedSemesterId, filteredCourses]
    );

    const hasActiveFilters = selectedSemesterId || selectedCourseId || selectedHalaqaId;

    // ─── Auth ────────────────────────────────────────────

    const authHeaders = useMemo(() => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, []);

    const axiosClient = useMemo(() => {
        return axios.create({
            baseURL: API_BASE_URL,
            headers: { "Content-Type": "application/json", ...authHeaders },
        });
    }, [authHeaders]);

    // ─── Fetch filter data ───────────────────────────────

    const fetchFilterData = async () => {
        try {
            const [semestersRes, coursesRes, halaqasRes] = await Promise.all([
                axiosClient.get("/Semesters"),
                axiosClient.get("/courses"),
                axiosClient.get("/halaqas"),
            ]);
            setSemesters(Array.isArray(semestersRes.data) ? semestersRes.data : []);
            setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
            setHalaqas(Array.isArray(halaqasRes.data) ? halaqasRes.data : []);
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل بيانات الفلاتر");
        }
    };

    // ─── Fetch teachers ──────────────────────────────────

    const fetchTeachers = async (filters: TeacherFilters = teacherFilters) => {
        try {
            setIsLoading(true);
            const response = await axiosClient.get("/teachers/filtered", {
                params: {
                    pageNumber: filters.pageNumber,
                    pageSize: filters.pageSize,
                    ...(filters.classId    ? { classId:    filters.classId    } : {}),
                    ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
                    ...(filters.courseId   ? { courseId:   filters.courseId   } : {}),
                },
            });

            const normalizedTeachers = Array.isArray(response.data.items)
                ? response.data.items
                : Array.isArray(response.data.data)
                ? response.data.data
                : Array.isArray(response.data)
                ? response.data
                : [];

            setTeachers(normalizedTeachers);

            const total =
                response.data?.totalItems ??
                response.data?.totalCount ??
                response.data?.total ??
                normalizedTeachers.length;

            setTotalTeachers(Number(total) || 0);
            setTotalPages(response.data?.totalPages ?? Math.ceil(total / filters.pageSize) ?? 1);

        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل بيانات الأساتذة");
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Initial load ────────────────────────────────────

    useEffect(() => {
        fetchFilterData();
        fetchTeachers();
    }, []);

    // ─── Apply filters ───────────────────────────────────

    const applyFilters = (overrides: Partial<{
        semesterId: string;
        courseId: string;
        halaqaId: string;
    }> = {}) => {
        const semId  = overrides.semesterId !== undefined ? overrides.semesterId : selectedSemesterId;
        const courId = overrides.courseId   !== undefined ? overrides.courseId   : selectedCourseId;
        const halId  = overrides.halaqaId   !== undefined ? overrides.halaqaId   : selectedHalaqaId;

        const next: TeacherFilters = {
            ...teacherFilters,
            pageNumber: 1,
            ...(semId  ? { semesterId: semId }  : {}),
            ...(courId ? { courseId:   courId } : {}),
            ...(halId  ? { classId:    halId }  : {}),
        };

        if (!semId)  delete next.semesterId;
        if (!courId) delete next.courseId;
        if (!halId)  delete next.classId;

        setTeacherFilters(next);
        fetchTeachers(next);
    };

    const handleSemesterChange = (value: string) => {
        const val = value === "all" ? "" : value;
        setSelectedSemesterId(val);
        setSelectedCourseId("");
        setSelectedHalaqaId("");
        applyFilters({ semesterId: val, courseId: "", halaqaId: "" });
    };

    const handleCourseChange = (value: string) => {
        const val = value === "all" ? "" : value;
        setSelectedCourseId(val);
        setSelectedHalaqaId("");
        applyFilters({ courseId: val, halaqaId: "" });
    };

    const handleHalaqaChange = (value: string) => {
        const val = value === "all" ? "" : value;
        setSelectedHalaqaId(val);
        applyFilters({ halaqaId: val });
    };

    const handleResetFilters = () => {
        setSelectedSemesterId("");
        setSelectedCourseId("");
        setSelectedHalaqaId("");
        const next = { ...defaultTeacherFilters };
        setTeacherFilters(next);
        fetchTeachers(next);
    };

    // ─── Search (client-side) ────────────────────────────

    const displayedTeachers = teachers.filter((teacher) =>
        `${teacher.name} ${teacher.fatherName} ${teacher.motherName} ${teacher.nationalityNumber} ${teacher.email ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    // ─── CRUD handlers ───────────────────────────────────

    const handleAdd = async () => {
        if (!newTeacher.name || !newTeacher.fatherName || !newTeacher.motherName || !newTeacher.nationalityNumber) {
            toast.error("يرجى تعبئة الحقول المطلوبة");
            return;
        }
        try {
            setIsLoading(true);
            await axiosClient.post("/teachers", { ...newTeacher, email: newTeacher.email || null });
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
            setTeachers((prev) => prev.filter((t) => t.id !== id));
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
        try {
            setIsLoading(true);
            await axiosClient.put(`/teachers/${editingTeacher.id}`, {
                name: editingTeacher.name,
                fatherName: editingTeacher.fatherName,
                motherName: editingTeacher.motherName,
                nationalityNumber: editingTeacher.nationalityNumber,
                email: editingTeacher.email || null,
            });
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

    // ─── Render ──────────────────────────────────────────

    return (
        <DashboardLayout title="الأساتذة" subtitle="إدارة حسابات الأساتذة">

            {/* ── Search + Add button ── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
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
                    <DialogContent dir="rtl">
                        <DialogHeader>
                            <DialogTitle>إضافة أستاذ جديد</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div>
                                <Label>الاسم الكامل</Label>
                                <Input value={newTeacher.name} onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })} />
                            </div>
                            <div>
                                <Label>اسم الأب</Label>
                                <Input value={newTeacher.fatherName} onChange={(e) => setNewTeacher({ ...newTeacher, fatherName: e.target.value })} />
                            </div>
                            <div>
                                <Label>اسم الأم</Label>
                                <Input value={newTeacher.motherName} onChange={(e) => setNewTeacher({ ...newTeacher, motherName: e.target.value })} />
                            </div>
                            <div>
                                <Label>الرقم الوطني</Label>
                                <Input value={newTeacher.nationalityNumber} onChange={(e) => setNewTeacher({ ...newTeacher, nationalityNumber: e.target.value })} />
                            </div>
                            <div>
                                <Label>البريد الإلكتروني</Label>
                                <Input type="email" value={newTeacher.email ?? ""} onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })} />
                            </div>
                            <Button onClick={handleAdd} className="w-full" disabled={isLoading}>إضافة</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* ── Filter dropdowns ── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6" dir="rtl">

                <Select value={selectedSemesterId || "all"} onValueChange={handleSemesterChange}>
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="كل الفصول" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">كل الفصول</SelectItem>
                        {semesters.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={selectedCourseId || "all"}
                    onValueChange={handleCourseChange}
                    disabled={!selectedSemesterId}
                >
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder={!selectedSemesterId ? "اختر الفصل أولاً" : "كل الكورسات"} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">كل الكورسات</SelectItem>
                        {filteredCourses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.courseName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={selectedHalaqaId || "all"}
                    onValueChange={handleHalaqaChange}
                    disabled={!selectedCourseId}
                >
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder={!selectedCourseId ? "اختر الكورس أولاً" : "كل الحلقات"} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">كل الحلقات</SelectItem>
                        {filteredHalaqas.map((h) => (
                            <SelectItem key={h.id} value={h.id}>{h.className}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {hasActiveFilters && (
                    <Button variant="outline" onClick={handleResetFilters} className="gap-2 shrink-0">
                        <X className="h-4 w-4" />
                        إعادة تعيين
                    </Button>
                )}
            </div>

            {/* ── Table ── */}
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
                            {isLoading && teachers.length === 0 ? (
                                <tr>
                                    <td className="p-4 text-center" colSpan={6}>جاري تحميل البيانات...</td>
                                </tr>
                            ) : displayedTeachers.length === 0 ? (
                                <tr>
                                    <td className="p-4 text-center" colSpan={6}>لا توجد بيانات</td>
                                </tr>
                            ) : (
                                displayedTeachers.map((teacher) => (
                                    <TableRowContextMenu
                                        key={teacher.id}
                                        actions={[
                                            {
                                                label: "تعديل",
                                                icon: <Pencil className="h-4 w-4" />,
                                                onSelect: () => handleStartEdit(teacher),
                                            },
                                            {
                                                label: "حذف",
                                                icon: <Trash2 className="h-4 w-4" />,
                                                onSelect: () => handleDelete(teacher.id),
                                                destructive: true,
                                            },
                                        ]}
                                    >
                                        <tr className="border-b border-border/50">
                                            <td className="p-4">{teacher.name}</td>
                                            <td className="p-4">{teacher.fatherName}</td>
                                            <td className="p-4">{teacher.motherName}</td>
                                            <td className="p-4">{teacher.nationalityNumber}</td>
                                            <td className="p-4">{teacher.email || "-"}</td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleStartEdit(teacher)}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(teacher.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
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

            {/* ── Pagination ── */}
            <div className="flex items-center justify-between gap-4 mt-3">
                <div className="text-sm text-muted-foreground">
                    إجمالي النتائج: {totalTeachers}
                </div>
                <Pagination
                    currentPage={teacherFilters.pageNumber}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                        const next = { ...teacherFilters, pageNumber: page };
                        setTeacherFilters(next);
                        fetchTeachers(next);
                    }}
                />
            </div>

            {/* ── Edit dialog ── */}
            <Dialog open={editOpen} onOpenChange={(value) => { setEditOpen(value); if (!value) setEditingTeacher(null); }}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تعديل بيانات الأستاذ</DialogTitle>
                    </DialogHeader>
                    {editingTeacher && (
                        <div className="space-y-4 mt-4">
                            <Input value={editingTeacher.name} onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })} />
                            <Input value={editingTeacher.fatherName} onChange={(e) => setEditingTeacher({ ...editingTeacher, fatherName: e.target.value })} />
                            <Input value={editingTeacher.motherName} onChange={(e) => setEditingTeacher({ ...editingTeacher, motherName: e.target.value })} />
                            <Input value={editingTeacher.nationalityNumber} onChange={(e) => setEditingTeacher({ ...editingTeacher, nationalityNumber: e.target.value })} />
                            <Input value={editingTeacher.email ?? ""} onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })} />
                            <Button onClick={handleUpdate} className="w-full" disabled={isLoading}>حفظ التعديلات</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </DashboardLayout>
    );
};

export default TeachersPage;
