import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
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
import Pagination from "@/components/ui/pagination";
import { FileSpreadsheet, Pencil, Plus, Search, Trash2 } from "lucide-react";
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

interface ExcelStudentRow {
    name?: string;
    fatherName?: string;
    motherName?: string;
    nationalityNumber?: string;
    email?: string;
    [key: string]: unknown;
}

interface PagedResponse<T> {
    items?: T[];
    data?: T[];
    totalItems?: number;
    totalCount?: number;
    total?: number;
    count?: number;
    totalPages?: number;
    pageCount?: number;
    page?: number;
    pageSize?: number;
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
    courseId: string;
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
    pageSize: 10,
    classId: "",
    semesterId: "",
    courseId: "",
    teacherId: "",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const pickNumber = (...values: unknown[]): number | undefined => {
    for (const value of values) {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed >= 0) {
            return parsed;
        }
    }

    return undefined;
};

const StudentsPage = () => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    const [studentPageMeta, setStudentPageMeta] = useState<{ totalItems: number; totalPages: number }>({
        totalItems: 0,
        totalPages: 0,
    });

    const [newStudent, setNewStudent] = useState<StudentPayload>(emptyStudentPayload);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [bulkImportLoading, setBulkImportLoading] = useState(false);

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
        ...(filters.courseId ? { courseId: filters.courseId } : {}),
        ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
    });

    const normalizeTeachers = (data: Teacher[] | PagedResponse<Teacher>) => {
        if (Array.isArray(data)) {
            return data;
        }

        return data.items ?? [];
    };

    const normalizeStudents = (data: unknown): Student[] => {
        if (Array.isArray(data)) {
            return data.filter((student): student is Student => Boolean((student as Student | undefined)?.id));
        }

        if (!isRecord(data)) {
            return [];
        }

        const candidates: unknown[] = [
            data.items,
            data.data,
            data.results,
            data.records,
            data.value,
            data.payload,
            data.result,
        ];

        for (const candidate of candidates) {
            if (Array.isArray(candidate)) {
                return candidate.filter((student): student is Student => Boolean((student as Student | undefined)?.id));
            }

            if (isRecord(candidate)) {
                const nested = normalizeStudents(candidate);
                if (nested.length > 0) {
                    return nested;
                }
            }
        }

        return [];
    };

    const extractStudentPageMeta = (data: unknown, fallbackItemsCount: number, pageSize: number) => {
        const root = isRecord(data) ? data : undefined;
        const level1 = root?.data;
        const level2 = isRecord(level1) ? level1.data : undefined;

        const candidates = [
            root,
            isRecord(root?.result) ? root.result : undefined,
            isRecord(root?.payload) ? root.payload : undefined,
            isRecord(root?.value) ? root.value : undefined,
            isRecord(level1) ? level1 : undefined,
            isRecord(level2) ? level2 : undefined,
        ].filter(Boolean) as Record<string, unknown>[];

        const totalItems =
            candidates
                .map((candidate) =>
                    pickNumber(
                        candidate.totalItems,
                        candidate.totalCount,
                        candidate.total,
                        candidate.count,
                        candidate.recordsTotal
                    )
                )
                .find((value) => value !== undefined) ?? fallbackItemsCount;

        const explicitTotalPages = candidates
            .map((candidate) => pickNumber(candidate.totalPages, candidate.pageCount, candidate.pages))
            .find((value) => value !== undefined);

        const totalPages =
            explicitTotalPages ??
            (pageSize > 0 ? Math.ceil(totalItems / pageSize) : 1);

        return {
            totalItems,
            totalPages,
        };
    };

    const normalizeRowValue = (value: unknown) =>
        typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();

    const normalizeHeaderKey = (key: string) =>
        key.toLowerCase().replace(/[_\s-]+/g, "").trim();

    const getExcelValue = (row: ExcelStudentRow, keys: string[]) => {
        const normalizedKeys = keys.map(normalizeHeaderKey);

        for (const [rawKey, rawValue] of Object.entries(row)) {
            if (!normalizedKeys.includes(normalizeHeaderKey(rawKey))) {
                continue;
            }

            const value = normalizeRowValue(rawValue);

            if (value) {
                return value;
            }
        }

        return "";
    };

    const buildStudentPayloadFromRow = (row: ExcelStudentRow): StudentPayload | null => {
        const name = getExcelValue(row, ["name", "student name", "studentname", "full name", "الاسم", "اسم الطالب"]);
        const fatherName = getExcelValue(row, ["fatherName", "father name", "father", "اسم الأب", "اسم الاب"]);
        const motherName = getExcelValue(row, ["motherName", "mother name", "mother", "اسم الأم", "اسم الام"]);
        const nationalityNumber = getExcelValue(row, ["nationalityNumber", "nationality number", "national id", "nationalid", "national number", "الرقم الوطني", "الرقم الوطنى"]);
        const email = getExcelValue(row, ["email", "e-mail", "البريد الإلكتروني", "البريد الالكتروني"]);

        if (!name || !fatherName || !motherName || !nationalityNumber) {
            return null;
        }

        return {
            name,
            fatherName,
            motherName,
            nationalityNumber,
            email: email || null,
        };
    };

    const handleExcelImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleDownloadTemplate = () => {
        const worksheet = XLSX.utils.aoa_to_sheet([
            ["name", "fatherName", "motherName", "nationalityNumber", "email"],
            ["Student Name", "Father Name", "Mother Name", "1234567890", "student@example.com"],
        ]);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "StudentsTemplate");

        XLSX.writeFile(workbook, "students-import-template.xlsx");
    };

    const handleExcelFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        event.target.value = "";

        if (!file) {
            return;
        }

        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            toast.error("الرجاء اختيار ملف Excel بصيغة xlsx أو xls");
            return;
        }

        try {
            setBulkImportLoading(true);

            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];

            if (!sheetName) {
                toast.error("ملف Excel لا يحتوي على أوراق عمل");
                return;
            }

            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json<ExcelStudentRow>(worksheet, {
                defval: "",
                raw: false,
            });

            if (rows.length === 0) {
                toast.error("لم يتم العثور على صفوف في ملف Excel");
                return;
            }

            let createdCount = 0;
            let skippedCount = 0;
            let failedCount = 0;

            for (const row of rows) {
                const payload = buildStudentPayloadFromRow(row);

                if (!payload) {
                    skippedCount += 1;
                    continue;
                }

                try {
                    await axiosClient.post("/students", payload);
                    createdCount += 1;
                } catch (error) {
                    failedCount += 1;
                    console.error(error);
                }
            }

            await fetchStudents(studentFilters);

            if (createdCount > 0) {
                toast.success(`تمت إضافة ${createdCount} طالب/طلاب بنجاح`);
            }

            if (skippedCount > 0) {
                toast.message?.(`تم تخطي ${skippedCount} صفًا غير مكتمل`);
            }

            if (failedCount > 0) {
                toast.error(`فشل إنشاء ${failedCount} صفًا`);
            }

            if (createdCount === 0 && skippedCount > 0 && failedCount === 0) {
                toast.error("لم يتم إنشاء أي طالب. تأكد من أن الأعمدة المطلوبة موجودة في الملف");
            }
        } catch (error) {
            console.error(error);
            toast.error("تعذر قراءة ملف Excel");
        } finally {
            setBulkImportLoading(false);
        }
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
                    ...(filters.courseId ? { courseId: filters.courseId } : {}),
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

            const normalizedStudents = normalizeStudents(response.data);
            setStudents(normalizedStudents);
            setStudentPageMeta(
                extractStudentPageMeta(response.data, normalizedStudents.length, filters.pageSize)
            );
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
        setStudentFilters({ ...studentFilters, pageNumber: 1 });
        fetchStudents({ ...studentFilters, pageNumber: 1 });
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
            courseId: "",
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

    const handleStudentCourseChange = (courseId: string) => {
        const nextFilters = {
            ...studentFilters,
            courseId,
            classId: "",
            teacherId: "",
        };

        setStudentFilters(nextFilters);
        setHalaqas([]);
        setTeachers([]);

        if (courseId) {
            fetchHalaqasByCourse(courseId);
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

            await axiosClient.post("/students", payload);
            await fetchStudents(studentFilters);
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

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleExcelFileChange}
                />

                <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={handleExcelImportClick}
                    disabled={isLoading || bulkImportLoading}
                >
                    <FileSpreadsheet className="h-4 w-4" />
                    {bulkImportLoading ? "جارٍ الاستيراد..." : "استيراد Excel"}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={handleDownloadTemplate}
                    disabled={isLoading || bulkImportLoading}
                >
                    <FileSpreadsheet className="h-4 w-4" />
                    تحميل القالب
                </Button>

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
                            <p className="text-sm text-muted-foreground">
                                يمكنك أيضًا استيراد الطلاب من ملف Excel عبر الأعمدة: الاسم، اسم الأب، اسم الأم، الرقم الوطني، البريد الإلكتروني.
                            </p>

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
                        <Label>معرف الدورة</Label>
                        <Select
                            value={studentFilters.courseId || undefined}
                            onValueChange={handleStudentCourseChange}
                            disabled={!studentFilters.semesterId || isFilterLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الدورة" />
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
                            disabled={!studentFilters.courseId || isFilterLoading}
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
                                    pageNumber: 1,
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

            <div className="flex items-center justify-between gap-4 mt-3">
                <div className="text-sm text-muted-foreground">
                    إجمالي النتائج: {studentPageMeta.totalItems || students.length}
                </div>
                <Pagination
                    currentPage={studentFilters.pageNumber}
                    totalPages={Math.max(
                        1,
                        studentPageMeta.totalPages || Math.ceil((studentPageMeta.totalItems || students.length) / studentFilters.pageSize)
                    )}
                    onPageChange={(page) => {
                        const next = { ...studentFilters, pageNumber: page };
                        setStudentFilters(next);
                        fetchStudents(next);
                    }}
                />
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
