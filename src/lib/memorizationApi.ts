import type { AxiosInstance } from "axios";

/**
 * Memorization statuses — managed via /api/statuses (Manager + SuperAdmin only).
 * The backend replaced the free-form string status with a foreign key to the
 * MemorizationStatus table; records expose `statusId` + `statusName`.
 */

export interface MemorizationStatusDto {
  id: number;
  name: string;
  color: string | null;
  sortOrder: number;
}

export interface CreateMemorizationStatusRequest {
  name: string;
  color: string | null;
  sortOrder: number;
}

export interface UpdateMemorizationStatusRequest {
  name?: string | null;
  color?: string | null;
  sortOrder?: number;
}

/** Hadith lookup — GET /api/Hadiths */
export interface BookSummaryDto {
  id: string;
  name: string;
}

export interface HadithDto {
  id: string;
  text: string;
  bookId?: string | null;
  book?: BookSummaryDto | null;
  chapter?: string | null;
}

export interface HadithSummaryDto {
  id: string;
  text: string;
  bookId?: string | null;
  bookName?: string | null;
  chapter?: string | null;
}

export interface StudentQuraanPageDetailDto {
  id: string;
  pageNumber: number;
  studentId: string;
  teacherId?: string | null;
  classId?: string | null;
  memorizedAt?: string | null;
  statusId: number;
  statusName?: string | null;
  notes?: string | null;
}

export interface StudentHadithDetailDto {
  id: string;
  hadithId: string;
  studentId: string;
  teacherId?: string | null;
  classId?: string | null;
  memorizedAt?: string | null;
  statusId: number;
  statusName?: string | null;
  notes?: string | null;
  hadith?: HadithSummaryDto | null;
}

/** "quran-page" | "hadith" */
export type MemorizationRecordType = "quran-page" | "hadith";

export interface AddQuranPageRequest {
  pageNumber: number;
  teacherId?: string | null;
  notes?: string | null;
  statusId: number;
}

export interface AddHadithRequest {
  hadithId: string;
  teacherId?: string | null;
  notes?: string | null;
  statusId: number;
}

export interface UpdateMemorizationRecordStatusRequest {
  statusId: number;
  notes?: string | null;
}

export interface MemorizationRecordFilters {
  semesterId?: string;
  courseId?: string;
  halaqaId?: string;
}

/** Student halaqa enrollments — GET /api/students/{id}/halaqas (legacy endpoint) */
export interface StudentHalaqaDto {
  halaqaId: string;
  halaqaName: string;
  isActive: boolean;
  courseId: string;
  courseName: string;
  semesterId: string;
  semesterName: string;
  enrollmentId: string;
}

/** أستاذ ضمن قائمة اختيار (مستخدم في نموذج إضافة صفحة قرآن / حديث) */
export interface TeacherOptionDto {
  id: string;
  name: string;
  fatherName?: string | null;
}

/**
 * Normalizes bare-array and `{ items }`-shaped list responses so callers do not
 * have to care which shape the endpoint returns.
 */
export const normalizeCollection = <T>(response: T[] | { items?: T[]; data?: T[] }): T[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.data)) return response.data;
  return [];
};

/**
 * بعض نقاط النهاية (مثل quran-pages / hadiths) تُغلّف نتيجتها بغلاف إضافي
 * على شكل { data: <القيمة الفعلية> } فوق غلاف axios نفسه (الذي يستخدم أيضًا
 * حقل data). هذه الدالة تُزيل الغلاف الإضافي إن وُجد، وإلا تُعيد القيمة كما هي.
 * لا تستخدم generics على استدعاء axios مباشرة (يسبب أخطاء Vite parse عند
 * النسخ اللصق)، لذا تُستخدم كدالة عادية مع "as" لاحقًا عند الاستخدام.
 */
const unwrapEnvelope = (payload: unknown): unknown => {
  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "data" in (payload as Record<string, unknown>)
  ) {
    return (payload as { data: unknown }).data;
  }
  return payload;
};

// ── Statuses ────────────────────────────────────────────────────────────────

export const getMemorizationStatuses = async (client: AxiosInstance) => {
  const response = await client.get<MemorizationStatusDto[]>("/statuses");
  return normalizeCollection(response.data);
};

export const createMemorizationStatus = async (
  client: AxiosInstance,
  payload: CreateMemorizationStatusRequest
) => {
  const response = await client.post<MemorizationStatusDto>("/statuses", payload);
  return response.data;
};

export const updateMemorizationStatus = async (
  client: AxiosInstance,
  id: number,
  payload: UpdateMemorizationStatusRequest
) => {
  const response = await client.put<MemorizationStatusDto>(`/statuses/${id}`, payload);
  return response.data;
};

export const deleteMemorizationStatus = async (client: AxiosInstance, id: number) => {
  await client.delete(`/statuses/${id}`);
};

// ── Hadith lookup ───────────────────────────────────────────────────────────

export const getHadiths = async (client: AxiosInstance) => {
  const response = await client.get<HadithDto[]>("/Hadiths");
  return normalizeCollection(response.data);
};

/**
 * @deprecated يُفضّل استخدام getStudentHalaqasFromFiltered التي تعتمد على
 * /students/filtered (الشكل المعتمد حاليًا للـ API). أُبقيت هذه الدالة لتفادي
 * كسر أي استخدام سابق لها.
 */
export const getStudentHalaqas = async (client: AxiosInstance, studentId: string) => {
  const response = await client.get<StudentHalaqaDto[]>(`/students/${studentId}/halaqas`);
  return normalizeCollection(response.data);
};

// شكل عنصر الحلقة كما يظهر ضمن items[].halaqas[] في استجابة /students/filtered
interface RawStudentHalaqaFromFiltered {
  halaqaId: string;
  halaqaName: string;
  enrollmentId?: string;
}

interface RawStudentFromFiltered {
  id: string;
  halaqas?: RawStudentHalaqaFromFiltered[];
}

interface StudentsFilteredResponse {
  items?: RawStudentFromFiltered[];
  data?: RawStudentFromFiltered[];
  totalItems?: number;
  totalPages?: number;
}

/**
 * يجلب حلقات الطالب (المسجّل بها فعليًا فقط) من /students/filtered،
 * ثم يُصفّي محليًا حسب studentId. هذا هو المصدر المعتمد حاليًا لحلقات الطالب
 * (بدلاً من /students/{id}/halaqas).
 */
export const getStudentHalaqasFromFiltered = async (
  client: AxiosInstance,
  studentId: string
): Promise<StudentHalaqaDto[]> => {
  const response = await client.get("/students/filtered", {
    params: { pageNumber: 1, pageSize: 2000 },
  });

  const payload = response.data as StudentsFilteredResponse | RawStudentFromFiltered[];

  const items: RawStudentFromFiltered[] = Array.isArray(payload)
    ? payload
    : payload.items ?? payload.data ?? [];

  const student = items.find((item) => item.id === studentId);
  if (!student || !Array.isArray(student.halaqas)) return [];

  return student.halaqas.map((h) => ({
    halaqaId: h.halaqaId,
    halaqaName: h.halaqaName,
    isActive: true,
    courseId: "",
    courseName: "",
    semesterId: "",
    semesterName: "",
    enrollmentId: h.enrollmentId ?? "",
  }));
};

/** أساتذة حلقة معيّنة — تُستخدم لتعبئة اختيار الأستاذ في نموذج إضافة صفحة قرآن/حديث */
export const getHalaqaTeachers = async (
  client: AxiosInstance,
  halaqaId: string
): Promise<TeacherOptionDto[]> => {
  const response = await client.get("/teachers/filtered", {
    params: { pageNumber: 1, pageSize: 200, classId: halaqaId },
  });

  const data = response.data as
    | TeacherOptionDto[]
    | { items?: TeacherOptionDto[]; data?: TeacherOptionDto[] };

  return normalizeCollection(data);
};

// ── Memorize management records ─────────────────────────────────────────────

export const addQuranPage = async (
  client: AxiosInstance,
  halaqaId: string,
  studentId: string,
  payload: AddQuranPageRequest
) => {
  const response = await client.post(
    `/memorize-managment/halaqas/${halaqaId}/students/${studentId}/quran-pages`,
    payload
  );

  return unwrapEnvelope(response.data) as StudentQuraanPageDetailDto;
};

export const addHadith = async (
  client: AxiosInstance,
  halaqaId: string,
  studentId: string,
  payload: AddHadithRequest
) => {
  const response = await client.post(
    `/memorize-managment/halaqas/${halaqaId}/students/${studentId}/hadiths`,
    payload
  );

  return unwrapEnvelope(response.data) as StudentHadithDetailDto;
};

export const getStudentQuranPages = async (
  client: AxiosInstance,
  studentId: string,
  filters?: MemorizationRecordFilters
) => {
  const response = await client.get(
    `/memorize-managment/students/${studentId}/quran-pages`,
    { params: filters }
  );

  const unwrapped = unwrapEnvelope(response.data) as
    | StudentQuraanPageDetailDto[]
    | { items?: StudentQuraanPageDetailDto[]; data?: StudentQuraanPageDetailDto[] };

  return normalizeCollection(unwrapped);
};

export const getStudentHadiths = async (
  client: AxiosInstance,
  studentId: string,
  filters?: MemorizationRecordFilters
) => {
  const response = await client.get(
    `/memorize-managment/students/${studentId}/hadiths`,
    { params: filters }
  );

  const unwrapped = unwrapEnvelope(response.data) as
    | StudentHadithDetailDto[]
    | { items?: StudentHadithDetailDto[]; data?: StudentHadithDetailDto[] };

  return normalizeCollection(unwrapped);
};

export const updateMemorizationRecordStatus = async (
  client: AxiosInstance,
  recordId: string,
  recordType: MemorizationRecordType,
  payload: UpdateMemorizationRecordStatusRequest
) => {
  await client.patch(`/memorize-managment/records/${recordId}/status`, payload, {
    params: { recordType },
  });
};

export const deleteMemorizationRecord = async (
  client: AxiosInstance,
  recordId: string,
  recordType: MemorizationRecordType
) => {
  await client.delete(`/memorize-managment/records/${recordId}`, {
    params: { recordType },
  });
};