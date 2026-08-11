import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import {
    BookOpenCheck,
    Eye,
    FileSpreadsheet,
    Pencil,
    Plus,
    Search,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
    type AcademicStageDto,
    type CreateStudentRequest,
    type MemorizedQuranPartDto,
    type StudentDetailDto,
    type StudentListResponse,
    type UpdateStudentRequest,
    createStudent,
    getAcademicStages,
    getMemorizedQuranParts,
    getStudentById,
    getStudents,
    updateStudent,
    updateStudentMemorizedParts,
} from "@/lib/studentApi";

interface ExcelStudentRow {
    name?: string;
    fatherName?: string;
    lastName?: string;
    fatherWork?: string;
    parentPhoneNumber?: string;
    schoolName?: string;
    parentWhatsAppPhoneNumber?: string;
    dateOfBirth?: string;
    landlineNumber?: string;
    userName?: string;
    password?: string;
    academicStageId?: string;
    academicStage?: string;
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

type StudentFormField = {
    key: keyof UpdateStudentRequest;
    label: string;
    type?: string;
    maxLength?: number;
    optional?: boolean;
};

type CreateOnlyField = {
    key: "userName" | "password";
    label: string;
    type?: string;
};

type StudentFieldKey = keyof CreateStudentRequest | keyof UpdateStudentRequest;
type StudentFormErrors = Partial<Record<StudentFieldKey, string>>;
type ExcelImportIssue = {
    rowIndex: number;
    field?: StudentFieldKey;
    message: string;
};

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://alashmar.runasp.net/api";

const emptyStudentPayload: CreateStudentRequest = {
    name: "",
    fatherName: "",
    lastName: "",
    fatherWork: "",
    parentPhoneNumber: "",
    schoolName: "",
    parentWhatsAppPhoneNumber: "",
    dateOfBirth: "",
    landlineNumber: "",
    additionalInformations: "",
    userName: "",
    password: "",
    academicStageId: "",
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

const studentFields: StudentFormField[] = [
    { key: "name", label: "الاسم", maxLength: 200 },
    { key: "fatherName", label: "اسم الأب", maxLength: 200 },
    { key: "lastName", label: "الكنية", maxLength: 200 },
    { key: "fatherWork", label: "عمل الأب", maxLength: 50 },
    { key: "parentPhoneNumber", label: "هاتف ولي الأمر", maxLength: 255 },
    { key: "schoolName", label: "اسم المدرسة" },
    { key: "parentWhatsAppPhoneNumber", label: "واتساب ولي الأمر" },
    { key: "dateOfBirth", label: "تاريخ الميلاد", type: "date" },
    { key: "landlineNumber", label: "الهاتف الأرضي", optional: true },
    { key: "email", label: "البريد الإلكتروني", type: "email" },
    { key: "additionalInformations", label: "معلومات إضافية", optional: true },
];

const createOnlyFields: CreateOnlyField[] = [
    { key: "userName", label: "اسم المستخدم" },
    { key: "password", label: "كلمة المرور", type: "password" },
];

const fieldLabels: Record<StudentFieldKey, string> = {
    name: "الاسم",
    fatherName: "اسم الأب",
    lastName: "الكنية",
    fatherWork: "عمل الأب",
    parentPhoneNumber: "هاتف ولي الأمر",
    schoolName: "اسم المدرسة",
    parentWhatsAppPhoneNumber: "واتساب ولي الأمر",
    dateOfBirth: "تاريخ الميلاد",
    landlineNumber: "الهاتف الأرضي",
    additionalInformations: "معلومات إضافية",
    userName: "اسم المستخدم",
    password: "كلمة المرور",
    academicStageId: "المرحلة الدراسية",
    email: "البريد الإلكتروني",
};

const excelStudentFieldAliases: Record<keyof CreateStudentRequest, string[]> = {
    name: ["name", "student name", "studentname", "full name", "الاسم", "اسم الطالب"],
    fatherName: ["fatherName", "father name", "father", "اسم الأب", "اسم الاب"],
    lastName: ["lastName", "last name", "family name", "الكنية", "النسبة"],
    fatherWork: ["fatherWork", "father work", "عمل الأب", "عمل الاب"],
    parentPhoneNumber: ["parentPhoneNumber", "parent phone number", "parent phone", "هاتف ولي الأمر", "رقم ولي الأمر"],
    schoolName: ["schoolName", "school name", "school", "اسم المدرسة", "المدرسة"],
    parentWhatsAppPhoneNumber: ["parentWhatsAppPhoneNumber", "parent whatsapp phone number", "whatsapp", "واتساب ولي الأمر"],
    dateOfBirth: ["dateOfBirth", "date of birth", "birth date", "تاريخ الميلاد"],
    landlineNumber: ["landlineNumber", "landline number", "landline", "الهاتف الأرضي"],
    additionalInformations: ["additionalInformations", "additional informations", "additional info", "معلومات إضافية", "ملاحظات"],
    userName: ["userName", "username", "user name", "اسم المستخدم"],
    password: ["password", "كلمة المرور"],
    academicStageId: ["academicStageId", "academic stage id", "academicStage", "academic stage", "المرحلة الدراسية"],
    email: ["email", "email address", "البريد الإلكتروني", "البريد الالكتروني", "ايميل"],
};

const requiredCreateFields: StudentFieldKey[] = [
    "name",
    "fatherName",
    "lastName",
    "fatherWork",
    "parentPhoneNumber",
    "schoolName",
    "parentWhatsAppPhoneNumber",
    "dateOfBirth",
    "academicStageId",
    "userName",
    "password",
    "email",
];

const requiredUpdateFields: StudentFieldKey[] = requiredCreateFields.filter(
    (field) => field !== "userName" && field !== "password"
);

const maxLengths: Partial<Record<StudentFieldKey, number>> = {
    name: 200,
    fatherName: 200,
    lastName: 200,
    fatherWork: 50,
    parentPhoneNumber: 255,
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

const textValue = (value: unknown) =>
    typeof value === "string" ? value : value == null ? "" : String(value);

const trimText = (value: unknown) => textValue(value).trim();

const normalizeComparable = (value: unknown) =>
    trimText(value).toLowerCase().replace(/\s+/g, "");

const formatDateInput = (date: Date) => date.toISOString();

const buildUtcDate = (year: number, month: number, day: number) => {
    const date = new Date(Date.UTC(year, month - 1, day));

    return date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
        ? date
        : null;
};

const parseTwoDigitYear = (year: number) => {
    if (year >= 100) {
        return year;
    }

    return year >= 50 ? 1900 + year : 2000 + year;
};

const parseDateInput = (value: unknown) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value;
    }

    const text = trimText(value);

    if (!text) {
        return null;
    }

    const isoDate = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoDate) {
        return buildUtcDate(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]));
    }

    const slashDate = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (slashDate) {
        const first = Number(slashDate[1]);
        const second = Number(slashDate[2]);
        const year = parseTwoDigitYear(Number(slashDate[3]));
        const [month, day] = first > 12 && second <= 12 ? [second, first] : [first, second];

        return buildUtcDate(
            year,
            month,
            day
        );
    }

    const parsed = new Date(text);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeDateInput = (value: unknown) => {
    const parsed = parseDateInput(value);
    return parsed ? formatDateInput(parsed) : "";
};

const formatDateFieldValue = (value: unknown) => {
    const parsed = parseDateInput(value);
    return parsed ? parsed.toISOString().slice(0, 10) : trimText(value);
};

const isValidDate = (value: unknown) => {
    return Boolean(parseDateInput(value));
};

const toStudentDetail = (student: Partial<StudentDetailDto> & { id: string }): StudentDetailDto => ({
    id: student.id,
    name: textValue(student.name),
    fatherName: textValue(student.fatherName),
    lastName: textValue(student.lastName),
    fatherWork: textValue(student.fatherWork),
    parentPhoneNumber: textValue(student.parentPhoneNumber),
    schoolName: textValue(student.schoolName),
    parentWhatsAppPhoneNumber: textValue(student.parentWhatsAppPhoneNumber),
    dateOfBirth: normalizeDateInput(student.dateOfBirth),
    landlineNumber: student.landlineNumber ?? "",
    additionalInformations: student.additionalInformations ?? null,
    academicStageId: textValue(student.academicStageId),
    academicStage: student.academicStage ?? null,
    memorizedQuranParts: student.memorizedQuranParts ?? [],
    userName: student.userName ?? null,
    email: student.email ?? null,
});

const unwrapSingleStudent = (data: unknown): StudentDetailDto | null => {
    if (isRecord(data) && typeof data.id === "string") {
        return toStudentDetail(data as Partial<StudentDetailDto> & { id: string });
    }

    if (!isRecord(data)) {
        return null;
    }

    for (const candidate of [data.data, data.result, data.payload, data.value]) {
        const student = unwrapSingleStudent(candidate);
        if (student) {
            return student;
        }
    }

    return null;
};

const normalizeStudents = (data: unknown): StudentDetailDto[] => {
    if (Array.isArray(data)) {
        return data
            .map((student) => unwrapSingleStudent(student))
            .filter((student): student is StudentDetailDto => Boolean(student));
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
            return normalizeStudents(candidate);
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

const normalizeCollection = <T extends { id: string }>(data: unknown): T[] => {
    if (Array.isArray(data)) {
        return data.filter((item): item is T => isRecord(item) && typeof item.id === "string");
    }

    if (!isRecord(data)) {
        return [];
    }

    for (const candidate of [data.items, data.data, data.results, data.records, data.value, data.payload, data.result]) {
        const nested = normalizeCollection<T>(candidate);
        if (nested.length > 0) {
            return nested;
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

const getFieldErrorMessage = (errors: unknown) => {
    if (Array.isArray(errors)) {
        return errors.map(String).join("، ");
    }

    return typeof errors === "string" ? errors : undefined;
};

const normalizeErrorFieldName = (field: string) =>
    (field.charAt(0).toLowerCase() + field.slice(1)) as StudentFieldKey;

const extractFieldErrors = (error: unknown): StudentFormErrors => {
    if (!axios.isAxiosError(error) || !isRecord(error.response?.data)) {
        return {};
    }

    const errors = error.response.data.errors;
    if (!isRecord(errors)) {
        return {};
    }

    return Object.entries(errors).reduce<StudentFormErrors>((acc, [field, value]) => {
        const fieldName = normalizeErrorFieldName(field);
        const message = getFieldErrorMessage(value);

        if (message) {
            acc[fieldName] = message;
        }

        return acc;
    }, {});
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (!axios.isAxiosError(error) || !isRecord(error.response?.data)) {
        return fallback;
    }

    const data = error.response.data;
    return (
        textValue(data.message) ||
        textValue(data.title) ||
        textValue(data.error) ||
        fallback
    );
};

const StudentsPage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [students, setStudents] = useState<StudentDetailDto[]>([]);
    const [academicStages, setAcademicStages] = useState<AcademicStageDto[]>([]);
    const [memorizedQuranParts, setMemorizedQuranParts] = useState<MemorizedQuranPartDto[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [halaqas, setHalaqas] = useState<Halaqa[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [memorizedPartsOpen, setMemorizedPartsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFilterLoading, setIsFilterLoading] = useState(false);
    const [lookupsLoading, setLookupsLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [memorizedPartsLoading, setMemorizedPartsLoading] = useState(false);
    const [memorizedPartsSaving, setMemorizedPartsSaving] = useState(false);
    const [studentFilters, setStudentFilters] = useState<StudentFilters>(defaultStudentFilters);
    const [studentPageMeta, setStudentPageMeta] = useState<{ totalItems: number; totalPages: number }>({
        totalItems: 0,
        totalPages: 0,
    });

    const [newStudent, setNewStudent] = useState<CreateStudentRequest>(emptyStudentPayload);
    const [editingStudent, setEditingStudent] = useState<StudentDetailDto | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<StudentDetailDto | null>(null);
    const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
    const [createErrors, setCreateErrors] = useState<StudentFormErrors>({});
    const [editErrors, setEditErrors] = useState<StudentFormErrors>({});
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

    const getAcademicStageLabel = (stage?: AcademicStageDto | null) => {
        if (!stage) {
            return "";
        }

        return textValue(stage.displayName) || `الصف ${stage.grade}`;
    };

    const getAcademicStageLabelById = (stageId?: string | null) => {
        const stage = academicStages.find((item) => item.id === stageId);
        return getAcademicStageLabel(stage) || "غير محدد";
    };

    const getMemorizedPartLabel = (part: MemorizedQuranPartDto) =>
        textValue(part.displayName) || `الجزء ${part.memorizedQuranPart}`;

    const buildStudentParams = (filters: StudentFilters) => ({
        pageNumber: filters.pageNumber,
        pageSize: filters.pageSize,
        include: "academicStage",
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

    const validateStudentForm = (
        payload: Partial<CreateStudentRequest>,
        requiredFields: StudentFieldKey[]
    ) => {
        const errors: StudentFormErrors = {};

        requiredFields.forEach((field) => {
            if (!trimText(payload[field as keyof CreateStudentRequest])) {
                errors[field] = `${fieldLabels[field]} مطلوب`;
            }
        });

        Object.entries(maxLengths).forEach(([field, maxLength]) => {
            const fieldName = field as StudentFieldKey;
            const value = trimText(payload[fieldName as keyof CreateStudentRequest]);

            if (value && maxLength && value.length > maxLength) {
                errors[fieldName] = `${fieldLabels[fieldName]} يجب ألا يتجاوز ${maxLength} حرفًا`;
            }
        });

        if (!errors.dateOfBirth && !isValidDate(payload.dateOfBirth)) {
            errors.dateOfBirth = "تاريخ الميلاد غير صالح";
        }

        return errors;
    };

    const buildCreatePayload = (): CreateStudentRequest => ({
        ...buildNormalizedCreatePayload(newStudent),
    });

    const buildNormalizedCreatePayload = (payload: CreateStudentRequest): CreateStudentRequest => ({
        name: trimText(payload.name),
        fatherName: trimText(payload.fatherName),
        lastName: trimText(payload.lastName),
        fatherWork: trimText(payload.fatherWork),
        parentPhoneNumber: trimText(payload.parentPhoneNumber),
        schoolName: trimText(payload.schoolName),
        parentWhatsAppPhoneNumber: trimText(payload.parentWhatsAppPhoneNumber),
        dateOfBirth: normalizeDateInput(payload.dateOfBirth),
        landlineNumber: trimText(payload.landlineNumber) || null,
        additionalInformations: trimText(payload.additionalInformations) || null,
        userName: trimText(payload.userName),
        password: trimText(payload.password),
        academicStageId: trimText(payload.academicStageId),
        email: trimText(payload.email),
    });

    const buildUpdatePayload = (student: StudentDetailDto): UpdateStudentRequest => ({
        name: trimText(student.name),
        fatherName: trimText(student.fatherName),
        lastName: trimText(student.lastName),
        fatherWork: trimText(student.fatherWork),
        parentPhoneNumber: trimText(student.parentPhoneNumber),
        schoolName: trimText(student.schoolName),
        parentWhatsAppPhoneNumber: trimText(student.parentWhatsAppPhoneNumber),
        dateOfBirth: normalizeDateInput(student.dateOfBirth),
        landlineNumber: trimText(student.landlineNumber) || null,
        additionalInformations: trimText(student.additionalInformations) || null,
        academicStageId: trimText(student.academicStageId),
        email: trimText(student.email) || null,
    });

    const normalizeHeaderKey = (key: string) =>
        key.toLowerCase().replace(/[_\s-]+/g, "").trim();

    const getExcelValue = (row: ExcelStudentRow, keys: string[]) => {
        const normalizedKeys = keys.map(normalizeHeaderKey);

        for (const [rawKey, rawValue] of Object.entries(row)) {
            if (!normalizedKeys.includes(normalizeHeaderKey(rawKey))) {
                continue;
            }

            const value = trimText(rawValue);

            if (value) {
                return value;
            }
        }

        return "";
    };

    const getExcelHeaderColumns = (worksheet: XLSX.WorkSheet) => {
        const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
            header: 1,
            blankrows: false,
            defval: "",
        });
        const headers = rows[0] ?? [];
        const columns = new Map<StudentFieldKey, number>();

        headers.forEach((header, index) => {
            const normalizedHeader = normalizeHeaderKey(textValue(header));
            const matchedField = Object.entries(excelStudentFieldAliases).find(([, aliases]) =>
                aliases.some((alias) => normalizeHeaderKey(alias) === normalizedHeader)
            )?.[0] as StudentFieldKey | undefined;

            if (matchedField && !columns.has(matchedField)) {
                columns.set(matchedField, index);
            }
        });

        return columns;
    };

    const markExcelErrorCell = (worksheet: XLSX.WorkSheet, rowIndex: number, columnIndex: number, message: string) => {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
        const cell = worksheet[cellAddress] ?? { t: "s", v: "" };

        cell.s = {
            fill: {
                patternType: "solid",
                fgColor: { rgb: "FCA5A5" },
            },
        };
        cell.c = [
            {
                a: "Alashmar",
                t: message,
            },
        ];
        worksheet[cellAddress] = cell;
    };

    const downloadExcelImportErrors = (
        workbook: XLSX.WorkBook,
        worksheet: XLSX.WorkSheet,
        sheetName: string,
        issues: ExcelImportIssue[],
        sourceFileName: string
    ) => {
        if (issues.length === 0) {
            return;
        }

        const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "A1:A1");
        const errorColumnIndex = range.e.c + 1;
        const errorHeaderAddress = XLSX.utils.encode_cell({ r: 0, c: errorColumnIndex });
        const headerColumns = getExcelHeaderColumns(worksheet);
        const issuesByRow = issues.reduce<Record<number, ExcelImportIssue[]>>((acc, issue) => {
            acc[issue.rowIndex] = [...(acc[issue.rowIndex] ?? []), issue];
            return acc;
        }, {});

        worksheet[errorHeaderAddress] = { t: "s", v: "أخطاء الاستيراد" };
        markExcelErrorCell(worksheet, 0, errorColumnIndex, "هذا العمود يحتوي ملخص أخطاء كل صف");

        Object.entries(issuesByRow).forEach(([rowIndexText, rowIssues]) => {
            const rowIndex = Number(rowIndexText);
            const message = rowIssues.map((issue) => issue.message).join(" | ");
            const errorCellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: errorColumnIndex });

            worksheet[errorCellAddress] = { t: "s", v: message };
            markExcelErrorCell(worksheet, rowIndex, errorColumnIndex, message);

            rowIssues.forEach((issue) => {
                if (!issue.field) {
                    return;
                }

                const columnIndex = headerColumns.get(issue.field);
                if (columnIndex !== undefined) {
                    markExcelErrorCell(worksheet, rowIndex, columnIndex, issue.message);
                }
            });
        });

        worksheet["!ref"] = XLSX.utils.encode_range({
            s: range.s,
            e: {
                r: Math.max(range.e.r, ...issues.map((issue) => issue.rowIndex)),
                c: errorColumnIndex,
            },
        });

        XLSX.writeFile(
            workbook,
            `${sourceFileName.replace(/\.(xlsx|xls)$/i, "")}-import-errors.xlsx`,
            { cellStyles: true }
        );
    };

    const findAcademicStageIdFromRow = (value: string) => {
        if (!value) {
            return "";
        }

        const normalizedValue = normalizeComparable(value);
        const matchedStage = academicStages.find((stage) =>
            [stage.id, stage.grade, stage.displayName].some(
                (candidate) => normalizeComparable(candidate) === normalizedValue
            )
        );

        return matchedStage?.id ?? value;
    };

    const buildStudentPayloadFromRow = (
        row: ExcelStudentRow,
        rowIndex: number
    ): { payload: CreateStudentRequest | null; issues: ExcelImportIssue[] } => {
        const academicStageValue = getExcelValue(row, excelStudentFieldAliases.academicStageId);

        const dateOfBirthValue = getExcelValue(row, excelStudentFieldAliases.dateOfBirth);
        const payload = buildNormalizedCreatePayload({
            name: getExcelValue(row, excelStudentFieldAliases.name),
            fatherName: getExcelValue(row, excelStudentFieldAliases.fatherName),
            lastName: getExcelValue(row, excelStudentFieldAliases.lastName),
            fatherWork: getExcelValue(row, excelStudentFieldAliases.fatherWork),
            parentPhoneNumber: getExcelValue(row, excelStudentFieldAliases.parentPhoneNumber),
            schoolName: getExcelValue(row, excelStudentFieldAliases.schoolName),
            parentWhatsAppPhoneNumber: getExcelValue(row, excelStudentFieldAliases.parentWhatsAppPhoneNumber),
            dateOfBirth: dateOfBirthValue,
            landlineNumber: getExcelValue(row, excelStudentFieldAliases.landlineNumber),
            additionalInformations: getExcelValue(row, excelStudentFieldAliases.additionalInformations),
            userName: getExcelValue(row, excelStudentFieldAliases.userName),
            password: getExcelValue(row, excelStudentFieldAliases.password),
            academicStageId: findAcademicStageIdFromRow(academicStageValue),
            email: getExcelValue(row, excelStudentFieldAliases.email),
        });

        const errors = validateStudentForm(payload, requiredCreateFields);

        if (trimText(dateOfBirthValue) && !parseDateInput(dateOfBirthValue)) {
            errors.dateOfBirth = "تاريخ الميلاد غير صالح";
        }

        const issues = Object.entries(errors).map(([field, message]) => ({
            rowIndex,
            field: field as StudentFieldKey,
            message: message ?? "قيمة غير صالحة",
        }));

        return {
            payload: issues.length === 0 ? payload : null,
            issues,
        };
    };

    const handleExcelImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleDownloadTemplate = () => {
        const worksheet = XLSX.utils.aoa_to_sheet([
            [
                "name",
                "fatherName",
                "lastName",
                "fatherWork",
                "parentPhoneNumber",
                "schoolName",
                "parentWhatsAppPhoneNumber",
                "dateOfBirth",
                "landlineNumber",
                "academicStageId",
                "userName",
                "password",
                "email",
            ],
            [
                "Student Name",
                "Father Name",
                "Last Name",
                "Father Work",
                "0999999999",
                "School Name",
                "0999999999",
                "2014-01-01",
                "0110000000",
                academicStages[0]?.id ?? "academic-stage-id",
                "student.username",
                "password",
                "student@example.com",
            ],
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
            const workbook = XLSX.read(buffer, { type: "array", cellStyles: true });
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
            const importIssues: ExcelImportIssue[] = [];

            for (const [index, row] of rows.entries()) {
                const rowIndex = index + 1;
                const { payload, issues } = buildStudentPayloadFromRow(row, rowIndex);

                if (!payload) {
                    skippedCount += 1;
                    importIssues.push(...issues);
                    continue;
                }

                try {
                    await createStudent(axiosClient, payload);
                    createdCount += 1;
                } catch (error) {
                    failedCount += 1;
                    importIssues.push({
                        rowIndex,
                        message: getApiErrorMessage(error, "فشل إنشاء الطالب من هذا الصف"),
                    });
                    console.error(error);
                }
            }

            if (importIssues.length > 0) {
                downloadExcelImportErrors(workbook, worksheet, sheetName, importIssues, file.name);
            }

            await fetchStudents(studentFilters);

            if (createdCount > 0) {
                toast.success(`تمت إضافة ${createdCount} طالب/طلاب بنجاح`);
            }

            if (skippedCount > 0) {
                toast.message?.(`تم تخطي ${skippedCount} صفًا غير مكتمل، وتم تنزيل ملف الأخطاء`);
            }

            if (failedCount > 0) {
                toast.error(`فشل إنشاء ${failedCount} صفًا، وتم تنزيل ملف الأخطاء`);
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

    const fetchAcademicStageOptions = async () => {
        try {
            setLookupsLoading(true);
            const response = await getAcademicStages(axiosClient);
            setAcademicStages(normalizeCollection<AcademicStageDto>(response));
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل المراحل الدراسية");
        } finally {
            setLookupsLoading(false);
        }
    };

    const fetchMemorizedPartOptions = async () => {
        try {
            setMemorizedPartsLoading(true);
            const response = await getMemorizedQuranParts(axiosClient);
            setMemorizedQuranParts(normalizeCollection<MemorizedQuranPartDto>(response));
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل أجزاء القرآن");
        } finally {
            setMemorizedPartsLoading(false);
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

    const fetchStudents = async (filters: StudentFilters = studentFilters) => {
        try {
            setIsLoading(true);
            const response = await getStudents(axiosClient, buildStudentParams(filters));
            const normalizedStudents = normalizeStudents(response);

            setStudents(normalizedStudents);
            setStudentPageMeta(
                extractStudentPageMeta(response as StudentListResponse, normalizedStudents.length, filters.pageSize)
            );
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل بيانات الطلاب");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStudentDetails = async (student: StudentDetailDto) => {
        try {
            setDetailLoading(true);
            const response = await getStudentById(axiosClient, student.id, ["academicStage", "memorizedParts"]);
            const normalizedStudent = unwrapSingleStudent(response) ?? student;

            setSelectedStudent(normalizedStudent);
            setStudents((prev) =>
                prev.map((item) => (item.id === normalizedStudent.id ? { ...item, ...normalizedStudent } : item))
            );
            return normalizedStudent;
        } catch (error) {
            console.error(error);
            toast.error("تعذر تحميل تفاصيل الطالب");
            return student;
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
        fetchSemesters();
        fetchAcademicStageOptions();
    }, []);

    const filtered = students.filter((student) => {
        const query = search.trim().toLowerCase();
        if (!query) {
            return true;
        }

        const academicStageLabel =
            getAcademicStageLabel(student.academicStage) ||
            getAcademicStageLabelById(student.academicStageId);

        return [
            student.name,
            student.fatherName,
            student.lastName,
            student.parentPhoneNumber,
            student.schoolName,
            student.email,
            academicStageLabel,
        ].some((value) => value?.toLowerCase().includes(query));
    });

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
        const payload = buildCreatePayload();
        const errors = validateStudentForm(payload, requiredCreateFields);
        setCreateErrors(errors);

        if (Object.keys(errors).length > 0) {
            toast.error("يرجى تعبئة الحقول المطلوبة بشكل صحيح");
            return;
        }

        try {
            setIsLoading(true);

            await createStudent(axiosClient, payload);
            await fetchStudents(studentFilters);
            setNewStudent(emptyStudentPayload);
            setCreateErrors({});
            setOpen(false);
            toast.success("تمت إضافة الطالب بنجاح");
        } catch (error) {
            console.error(error);
            setCreateErrors(extractFieldErrors(error));
            toast.error(getApiErrorMessage(error, "فشل إضافة الطالب"));
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
            toast.error(getApiErrorMessage(error, "فشل حذف الطالب"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDetails = async (student: StudentDetailDto) => {
        setSelectedStudent(student);
        setDetailOpen(true);
        await fetchStudentDetails(student);
    };

    const handleStartEdit = async (student: StudentDetailDto) => {
        setEditErrors({});
        setEditingStudent(student);
        setEditOpen(true);

        try {
            setDetailLoading(true);
            const response = await getStudentById(axiosClient, student.id, ["academicStage"]);
            setEditingStudent(unwrapSingleStudent(response) ?? student);
        } catch (error) {
            console.error(error);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingStudent) return;

        const payload = buildUpdatePayload(editingStudent);
        const errors = validateStudentForm(payload, requiredUpdateFields);
        setEditErrors(errors);

        if (Object.keys(errors).length > 0) {
            toast.error("يرجى تعبئة الحقول المطلوبة بشكل صحيح");
            return;
        }

        try {
            setIsLoading(true);

            const response = await updateStudent(axiosClient, editingStudent.id, payload);
            const updatedStudent =
                unwrapSingleStudent(response) ??
                toStudentDetail({
                    ...editingStudent,
                    ...payload,
                    academicStage:
                        academicStages.find((stage) => stage.id === payload.academicStageId) ??
                        editingStudent.academicStage,
                });

            setStudents((prev) =>
                prev.map((student) =>
                    student.id === editingStudent.id ? updatedStudent : student
                )
            );
            setSelectedStudent((prev) =>
                prev?.id === updatedStudent.id ? { ...prev, ...updatedStudent } : prev
            );

            setEditOpen(false);
            setEditingStudent(null);
            setEditErrors({});
            toast.success("تم تحديث بيانات الطالب");
        } catch (error) {
            console.error(error);
            setEditErrors(extractFieldErrors(error));
            toast.error(getApiErrorMessage(error, "فشل تحديث بيانات الطالب"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenMemorizedParts = async () => {
        if (!selectedStudent) return;

        setSelectedPartIds(selectedStudent.memorizedQuranParts?.map((part) => part.id) ?? []);
        setMemorizedPartsOpen(true);
        await fetchMemorizedPartOptions();
    };

    const handleToggleMemorizedPart = (partId: string, checked: boolean) => {
        setSelectedPartIds((prev) =>
            checked
                ? Array.from(new Set([...prev, partId]))
                : prev.filter((id) => id !== partId)
        );
    };

    const handleSaveMemorizedParts = async () => {
        if (!selectedStudent) return;

        try {
            setMemorizedPartsSaving(true);
            await updateStudentMemorizedParts(axiosClient, selectedStudent.id, selectedPartIds);

            const selectedParts = memorizedQuranParts.filter((part) => selectedPartIds.includes(part.id));
            const optimisticStudent = {
                ...selectedStudent,
                memorizedQuranParts: selectedParts,
            };

            setSelectedStudent(optimisticStudent);
            setMemorizedPartsOpen(false);
            toast.success("تم تحديث الأجزاء المحفوظة");
            await fetchStudentDetails(optimisticStudent);
        } catch (error) {
            console.error(error);
            toast.error(getApiErrorMessage(error, "فشل تحديث الأجزاء المحفوظة"));
        } finally {
            setMemorizedPartsSaving(false);
        }
    };

    const renderStudentFields = (
        value: CreateStudentRequest | StudentDetailDto,
        onChange: (key: keyof CreateStudentRequest, fieldValue: string) => void,
        errors: StudentFormErrors,
        prefix: string
    ) => (
        <>
            {studentFields.map((field) => (
                <div key={field.key}>
                    <Label htmlFor={`${prefix}-${field.key}`}>
                        {field.label}
                        {!field.optional && <span className="text-destructive"> *</span>}
                    </Label>
                    <Input
                        id={`${prefix}-${field.key}`}
                        type={field.type ?? "text"}
                        maxLength={field.maxLength}
                        value={
                            field.type === "date"
                                ? formatDateFieldValue(value[field.key as keyof typeof value])
                                : textValue(value[field.key as keyof typeof value])
                        }
                        onChange={(event) => onChange(field.key as keyof CreateStudentRequest, event.target.value)}
                        aria-invalid={Boolean(errors[field.key])}
                    />
                    {errors[field.key] && (
                        <p className="mt-1 text-xs text-destructive">{errors[field.key]}</p>
                    )}
                </div>
            ))}
        </>
    );

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

                <Dialog
                    open={open}
                    onOpenChange={(value) => {
                        setOpen(value);
                        if (!value) setCreateErrors({});
                    }}
                >
                    <DialogTrigger asChild>
                        <Button className="gap-2" disabled={isLoading}>
                            <Plus className="h-4 w-4" />
                            إضافة طالب
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="font-tajawal max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                        <DialogHeader>
                            <DialogTitle>إضافة طالب جديد</DialogTitle>
                            <DialogDescription className="sr-only">
                                نموذج إنشاء طالب مع بياناته الدراسية وبيانات ولي الأمر.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            <p className="text-sm text-muted-foreground">
                                يمكنك أيضًا استيراد الطلاب من ملف Excel عبر القالب المحدّث المتوافق مع الحقول الجديدة.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderStudentFields(
                                    newStudent,
                                    (key, value) =>
                                        setNewStudent({
                                            ...newStudent,
                                            [key]: value,
                                        }),
                                    createErrors,
                                    "new-student"
                                )}

                                <div>
                                    <Label htmlFor="new-student-academic-stage">
                                        المرحلة الدراسية <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={newStudent.academicStageId || undefined}
                                        onValueChange={(academicStageId) =>
                                            setNewStudent({ ...newStudent, academicStageId })
                                        }
                                        disabled={lookupsLoading}
                                    >
                                        <SelectTrigger id="new-student-academic-stage" aria-invalid={Boolean(createErrors.academicStageId)}>
                                            <SelectValue placeholder="اختر المرحلة الدراسية" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {academicStages.map((stage) => (
                                                <SelectItem key={stage.id} value={stage.id}>
                                                    {getAcademicStageLabel(stage)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {createErrors.academicStageId && (
                                        <p className="mt-1 text-xs text-destructive">{createErrors.academicStageId}</p>
                                    )}
                                </div>

                                {createOnlyFields.map((field) => (
                                    <div key={field.key}>
                                        <Label htmlFor={`new-student-${field.key}`}>
                                            {field.label} <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id={`new-student-${field.key}`}
                                            type={field.type ?? "text"}
                                            value={newStudent[field.key]}
                                            onChange={(event) =>
                                                setNewStudent({
                                                    ...newStudent,
                                                    [field.key]: event.target.value,
                                                })
                                            }
                                            aria-invalid={Boolean(createErrors[field.key])}
                                        />
                                        {createErrors[field.key] && (
                                            <p className="mt-1 text-xs text-destructive">{createErrors[field.key]}</p>
                                        )}
                                    </div>
                                ))}
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
                                <th className="p-4 text-right">الكنية</th>
                                <th className="p-4 text-right">هاتف ولي الأمر</th>
                                <th className="p-4 text-right">البريد الإلكتروني</th>
                                <th className="p-4 text-right">المدرسة</th>
                                <th className="p-4 text-right">المرحلة الدراسية</th>
                                <th className="p-4 text-right">الإجراءات</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading && students.length === 0 ? (
                                <tr>
                                    <td className="p-4 text-center text-muted-foreground" colSpan={8}>
                                        جاري تحميل البيانات...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td className="p-4 text-center text-muted-foreground" colSpan={8}>
                                        لا توجد بيانات مطابقة
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((student) => (
                                    <TableRowContextMenu
                                        key={student.id}
                                        actions={[
                                            {
                                                label: "سجلات الحفظ",
                                                icon: <BookOpenCheck className="h-4 w-4" />,
                                                onSelect: () => navigate(`/students/${student.id}/memorization`),
                                            },
                                            {
                                                label: "عرض التفاصيل",
                                                icon: <Eye className="h-4 w-4" />,
                                                onSelect: () => void handleOpenDetails(student),
                                            },
                                            {
                                                label: "تعديل",
                                                icon: <Pencil className="h-4 w-4" />,
                                                onSelect: () => void handleStartEdit(student),
                                            },
                                            {
                                                label: "حذف",
                                                icon: <Trash2 className="h-4 w-4" />,
                                                onSelect: () => void handleDelete(student.id),
                                                destructive: true,
                                            },
                                        ]}
                                    >
                                        <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                            <td className="p-4">{student.name}</td>
                                            <td className="p-4">{student.fatherName}</td>
                                            <td className="p-4">{student.lastName}</td>
                                            <td className="p-4">{student.parentPhoneNumber}</td>
                                            <td className="p-4">{student.email || "-"}</td>
                                            <td className="p-4">{student.schoolName}</td>
                                            <td className="p-4">
                                                {getAcademicStageLabel(student.academicStage) ||
                                                    getAcademicStageLabelById(student.academicStageId)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1"
                                                        onClick={() => navigate(`/students/${student.id}/memorization`)}
                                                        disabled={isLoading}
                                                    >
                                                        <BookOpenCheck className="h-3.5 w-3.5" />
                                                        الحفظ
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1"
                                                        onClick={() => void handleOpenDetails(student)}
                                                        disabled={isLoading}
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        عرض
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1"
                                                        onClick={() => void handleStartEdit(student)}
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
                    if (!value) {
                        setEditingStudent(null);
                        setEditErrors({});
                    }
                }}
            >
                <DialogContent className="font-tajawal max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تعديل بيانات الطالب</DialogTitle>
                        <DialogDescription className="sr-only">
                            نموذج تعديل بيانات الطالب الأساسية دون تعديل الأجزاء المحفوظة.
                        </DialogDescription>
                    </DialogHeader>

                    {editingStudent && (
                        <div className="space-y-4 mt-4">
                            {detailLoading && (
                                <p className="text-sm text-muted-foreground">جاري تحميل أحدث بيانات الطالب...</p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderStudentFields(
                                    editingStudent,
                                    (key, value) =>
                                        setEditingStudent({
                                            ...editingStudent,
                                            [key]: value,
                                        }),
                                    editErrors,
                                    "edit-student"
                                )}

                                <div>
                                    <Label htmlFor="edit-student-academic-stage">
                                        المرحلة الدراسية <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={editingStudent.academicStageId || undefined}
                                        onValueChange={(academicStageId) =>
                                            setEditingStudent({ ...editingStudent, academicStageId })
                                        }
                                        disabled={lookupsLoading}
                                    >
                                        <SelectTrigger id="edit-student-academic-stage" aria-invalid={Boolean(editErrors.academicStageId)}>
                                            <SelectValue placeholder="اختر المرحلة الدراسية" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {academicStages.map((stage) => (
                                                <SelectItem key={stage.id} value={stage.id}>
                                                    {getAcademicStageLabel(stage)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {editErrors.academicStageId && (
                                        <p className="mt-1 text-xs text-destructive">{editErrors.academicStageId}</p>
                                    )}
                                </div>
                            </div>

                            <Button onClick={handleUpdate} className="w-full" disabled={isLoading}>
                                حفظ التعديلات
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={detailOpen}
                onOpenChange={(value) => {
                    setDetailOpen(value);
                    if (!value) setSelectedStudent(null);
                }}
            >
                <DialogContent className="font-tajawal max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تفاصيل الطالب</DialogTitle>
                        <DialogDescription className="sr-only">
                            عرض بيانات الطالب الأساسية والمرحلة الدراسية والأجزاء المحفوظة.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedStudent && (
                        <div className="space-y-6 mt-4">
                            {detailLoading && (
                                <p className="text-sm text-muted-foreground">جاري تحميل تفاصيل الطالب...</p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {[
                                    ["الاسم", selectedStudent.name],
                                    ["اسم الأب", selectedStudent.fatherName],
                                    ["الكنية", selectedStudent.lastName],
                                    ["عمل الأب", selectedStudent.fatherWork],
                                    ["هاتف ولي الأمر", selectedStudent.parentPhoneNumber],
                                    ["واتساب ولي الأمر", selectedStudent.parentWhatsAppPhoneNumber],
                                    ["اسم المدرسة", selectedStudent.schoolName],
                                    ["تاريخ الميلاد", formatDateFieldValue(selectedStudent.dateOfBirth) || "غير محدد"],
                                    ["الهاتف الأرضي", selectedStudent.landlineNumber || "غير محدد"],
                                    ["البريد الإلكتروني", selectedStudent.email || "غير محدد"],
                                    [
                                        "المرحلة الدراسية",
                                        getAcademicStageLabel(selectedStudent.academicStage) ||
                                        getAcademicStageLabelById(selectedStudent.academicStageId),
                                    ],
                                ].map(([label, value]) => (
                                    <div key={label} className="rounded-md border p-3">
                                        <div className="text-muted-foreground">{label}</div>
                                        <div className="mt-1 font-medium break-words">{value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-base font-semibold">الأجزاء المحفوظة</h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => void handleOpenMemorizedParts()}
                                    >
                                        <BookOpenCheck className="h-4 w-4" />
                                        إدارة الأجزاء
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {selectedStudent.memorizedQuranParts?.length ? (
                                        selectedStudent.memorizedQuranParts.map((part) => (
                                            <Badge key={part.id} variant="secondary">
                                                {getMemorizedPartLabel(part)}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">لا توجد أجزاء محفوظة مسجلة.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={memorizedPartsOpen} onOpenChange={setMemorizedPartsOpen}>
                <DialogContent className="font-tajawal max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>إدارة الأجزاء المحفوظة</DialogTitle>
                        <DialogDescription className="sr-only">
                            اختيار أجزاء القرآن المحفوظة وحفظها عبر المسار المخصص.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {memorizedPartsLoading ? (
                            <p className="text-sm text-muted-foreground">جاري تحميل أجزاء القرآن...</p>
                        ) : memorizedQuranParts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">لا توجد أجزاء متاحة.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {memorizedQuranParts.map((part) => (
                                    <label
                                        key={part.id}
                                        className="flex items-center gap-3 rounded-md border p-3 text-sm"
                                    >
                                        <Checkbox
                                            checked={selectedPartIds.includes(part.id)}
                                            onCheckedChange={(checked) =>
                                                handleToggleMemorizedPart(part.id, checked === true)
                                            }
                                        />
                                        <span>{getMemorizedPartLabel(part)}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        <Button
                            type="button"
                            className="w-full"
                            onClick={handleSaveMemorizedParts}
                            disabled={memorizedPartsSaving || memorizedPartsLoading || !selectedStudent}
                        >
                            {memorizedPartsSaving ? "جارٍ الحفظ..." : "حفظ الأجزاء"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default StudentsPage;