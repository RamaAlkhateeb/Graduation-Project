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

import { Label } from "@/components/ui/label";

import {
    Pencil,
    Plus,
    Search,
    Trash2,
} from "lucide-react";

import { toast } from "sonner";

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
    eventId?: string;
}

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ??
    "http://alashmar.runasp.net/api";

const emptyTeacherPayload: TeacherPayload = {
    name: "",
    fatherName: "",
    motherName: "",
    nationalityNumber: "",
    email: "",
};

const defaultTeacherFilters: TeacherFilters = {
    pageNumber: 1,
    pageSize: 100,
};

const TeachersPage = () => {

    const [teachers, setTeachers] = useState<Teacher[]>([]);

    const [search, setSearch] = useState("");

    const [open, setOpen] = useState(false);

    const [editOpen, setEditOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    const [teacherFilters] =
        useState<TeacherFilters>(defaultTeacherFilters);

    const [newTeacher, setNewTeacher] =
        useState<TeacherPayload>(emptyTeacherPayload);

    const [editingTeacher, setEditingTeacher] =
        useState<Teacher | null>(null);

    const authHeaders = useMemo(() => {

        const token = localStorage.getItem("token");

        return token
            ? {
                Authorization: `Bearer ${token}`,
            }
            : {};

    }, []);

    const axiosClient = useMemo(() => {

        return axios.create({
            baseURL: API_BASE_URL,
            headers: {
                "Content-Type": "application/json",
                ...authHeaders,
            },
        });

    }, [authHeaders]);

    // =========================
    // FETCH TEACHERS
    // =========================

    const fetchTeachers = async (
        filters: TeacherFilters = teacherFilters
    ) => {

        try {

            setIsLoading(true);

            const response = await axiosClient.get(
                "/teachers/filtered",
                {
                    params: {
                        pageNumber: filters.pageNumber,
                        pageSize: filters.pageSize,

                        ...(filters.classId
                            ? { classId: filters.classId }
                            : {}),

                        ...(filters.semesterId
                            ? { semesterId: filters.semesterId }
                            : {}),

                        ...(filters.eventId
                            ? { eventId: filters.eventId }
                            : {}),
                    },
                }
            );

            const normalizedTeachers = Array.isArray(response.data.data)
                ? response.data.data
                : [];

            setTeachers(normalizedTeachers);

        } catch (error) {

            console.error(error);

            toast.error("تعذر تحميل بيانات الأساتذة");

        } finally {

            setIsLoading(false);

        }
    };

    // =========================
    // INITIAL LOAD
    // =========================

    useEffect(() => {

        fetchTeachers();

    }, []);

    // =========================
    // SEARCH
    // =========================

    const displayedTeachers = teachers.filter((teacher) =>
        `
        ${teacher.name}
        ${teacher.fatherName}
        ${teacher.motherName}
        ${teacher.nationalityNumber}
        ${teacher.email ?? ""}
        `
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    // =========================
    // ADD TEACHER
    // =========================

    const handleAdd = async () => {

        if (
            !newTeacher.name ||
            !newTeacher.fatherName ||
            !newTeacher.motherName ||
            !newTeacher.nationalityNumber
        ) {

            toast.error("يرجى تعبئة الحقول المطلوبة");

            return;
        }

        try {

            setIsLoading(true);

            await axiosClient.post(
                "/teachers",
                {
                    ...newTeacher,
                    email: newTeacher.email || null,
                }
            );

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

    // =========================
    // DELETE
    // =========================

    const handleDelete = async (id: string) => {

        try {

            setIsLoading(true);

            await axiosClient.delete(`/teachers/${id}`);

            setTeachers((prev) =>
                prev.filter((teacher) => teacher.id !== id)
            );

            toast.success("تم حذف الأستاذ");

        } catch (error) {

            console.error(error);

            toast.error("فشل حذف الأستاذ");

        } finally {

            setIsLoading(false);

        }
    };

    // =========================
    // START EDIT
    // =========================

    const handleStartEdit = (teacher: Teacher) => {

        setEditingTeacher({ ...teacher });

        setEditOpen(true);
    };

    // =========================
    // UPDATE
    // =========================

    const handleUpdate = async () => {

        if (!editingTeacher) return;

        try {

            setIsLoading(true);

            await axiosClient.put(
                `/teachers/${editingTeacher.id}`,
                {
                    name: editingTeacher.name,
                    fatherName: editingTeacher.fatherName,
                    motherName: editingTeacher.motherName,
                    nationalityNumber:
                        editingTeacher.nationalityNumber,
                    email: editingTeacher.email || null,
                }
            );

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

        <DashboardLayout
            title="الأساتذة"
            subtitle="إدارة حسابات الأساتذة"
        >

            <div className="flex flex-col sm:flex-row gap-3 mb-6">

                <div className="relative flex-1">

                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                    <Input
                        placeholder="بحث عن أستاذ..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        className="pr-10"
                    />

                </div>

                <Dialog open={open} onOpenChange={setOpen}>

                    <DialogTrigger asChild>

                        <Button
                            className="gap-2"
                            disabled={isLoading}
                        >

                            <Plus className="h-4 w-4" />

                            إضافة أستاذ

                        </Button>

                    </DialogTrigger>

                    <DialogContent dir="rtl">

                        <DialogHeader>

                            <DialogTitle>
                                إضافة أستاذ جديد
                            </DialogTitle>

                        </DialogHeader>

                        <div className="space-y-4 mt-4">

                            <div>

                                <Label>
                                    الاسم الكامل
                                </Label>

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

                                <Label>
                                    اسم الأب
                                </Label>

                                <Input
                                    value={newTeacher.fatherName}
                                    onChange={(e) =>
                                        setNewTeacher({
                                            ...newTeacher,
                                            fatherName:
                                                e.target.value,
                                        })
                                    }
                                />

                            </div>

                            <div>

                                <Label>
                                    اسم الأم
                                </Label>

                                <Input
                                    value={newTeacher.motherName}
                                    onChange={(e) =>
                                        setNewTeacher({
                                            ...newTeacher,
                                            motherName:
                                                e.target.value,
                                        })
                                    }
                                />

                            </div>

                            <div>

                                <Label>
                                    الرقم الوطني
                                </Label>

                                <Input
                                    value={
                                        newTeacher.nationalityNumber
                                    }
                                    onChange={(e) =>
                                        setNewTeacher({
                                            ...newTeacher,
                                            nationalityNumber:
                                                e.target.value,
                                        })
                                    }
                                />

                            </div>

                            <div>

                                <Label>
                                    البريد الإلكتروني
                                </Label>

                                <Input
                                    type="email"
                                    value={
                                        newTeacher.email ?? ""
                                    }
                                    onChange={(e) =>
                                        setNewTeacher({
                                            ...newTeacher,
                                            email:
                                                e.target.value,
                                        })
                                    }
                                />

                            </div>

                            <Button
                                onClick={handleAdd}
                                className="w-full"
                                disabled={isLoading}
                            >

                                إضافة

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

                                <th className="p-4 text-right">
                                    الاسم
                                </th>

                                <th className="p-4 text-right">
                                    اسم الأب
                                </th>

                                <th className="p-4 text-right">
                                    اسم الأم
                                </th>

                                <th className="p-4 text-right">
                                    الرقم الوطني
                                </th>

                                <th className="p-4 text-right">
                                    البريد الإلكتروني
                                </th>

                                <th className="p-4 text-right">
                                    الإجراءات
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {isLoading &&
                                teachers.length === 0 ? (

                                <tr>

                                    <td
                                        className="p-4 text-center"
                                        colSpan={6}
                                    >

                                        جاري تحميل البيانات...

                                    </td>

                                </tr>

                            ) : displayedTeachers.length === 0 ? (

                                <tr>

                                    <td
                                        className="p-4 text-center"
                                        colSpan={6}
                                    >

                                        لا توجد بيانات

                                    </td>

                                </tr>

                            ) : (

                                displayedTeachers.map((teacher) => (

                                    <TableRowContextMenu
                                        key={teacher.id}
                                        actions={[
                                            {
                                                label: "تعديل",
                                                icon: (
                                                    <Pencil className="h-4 w-4" />
                                                ),
                                                onSelect: () =>
                                                    handleStartEdit(
                                                        teacher
                                                    ),
                                            },
                                            {
                                                label: "حذف",
                                                icon: (
                                                    <Trash2 className="h-4 w-4" />
                                                ),
                                                onSelect: () =>
                                                    handleDelete(
                                                        teacher.id
                                                    ),
                                                destructive: true,
                                            },
                                        ]}
                                    >

                                        <tr className="border-b border-border/50">

                                            <td className="p-4">
                                                {teacher.name}
                                            </td>

                                            <td className="p-4">
                                                {teacher.fatherName}
                                            </td>

                                            <td className="p-4">
                                                {teacher.motherName}
                                            </td>

                                            <td className="p-4">
                                                {teacher.nationalityNumber}
                                            </td>

                                            <td className="p-4">
                                                {teacher.email || "-"}
                                            </td>

                                            <td className="p-4">

                                                <div className="flex items-center justify-end gap-2">

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleStartEdit(
                                                                teacher
                                                            )
                                                        }
                                                    >

                                                        <Pencil className="h-3.5 w-3.5" />

                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDelete(
                                                                teacher.id
                                                            )
                                                        }
                                                    >

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

            <Dialog
                open={editOpen}
                onOpenChange={(value) => {

                    setEditOpen(value);

                    if (!value) {
                        setEditingTeacher(null);
                    }
                }}
            >

                <DialogContent dir="rtl">

                    <DialogHeader>

                        <DialogTitle>
                            تعديل بيانات الأستاذ
                        </DialogTitle>

                    </DialogHeader>

                    {editingTeacher && (

                        <div className="space-y-4 mt-4">

                            <Input
                                value={editingTeacher.name}
                                onChange={(e) =>
                                    setEditingTeacher({
                                        ...editingTeacher,
                                        name: e.target.value,
                                    })
                                }
                            />

                            <Input
                                value={editingTeacher.fatherName}
                                onChange={(e) =>
                                    setEditingTeacher({
                                        ...editingTeacher,
                                        fatherName:
                                            e.target.value,
                                    })
                                }
                            />

                            <Input
                                value={editingTeacher.motherName}
                                onChange={(e) =>
                                    setEditingTeacher({
                                        ...editingTeacher,
                                        motherName:
                                            e.target.value,
                                    })
                                }
                            />

                            <Input
                                value={
                                    editingTeacher.nationalityNumber
                                }
                                onChange={(e) =>
                                    setEditingTeacher({
                                        ...editingTeacher,
                                        nationalityNumber:
                                            e.target.value,
                                    })
                                }
                            />

                            <Input
                                value={
                                    editingTeacher.email ?? ""
                                }
                                onChange={(e) =>
                                    setEditingTeacher({
                                        ...editingTeacher,
                                        email:
                                            e.target.value,
                                    })
                                }
                            />

                            <Button
                                onClick={handleUpdate}
                                className="w-full"
                                disabled={isLoading}
                            >

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