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
  notes?: string | null;
  statusId: number;
}

export interface AddHadithRequest {
  hadithId: string;
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

/** Student halaqa enrollments — GET /api/students/{id}/halaqas */
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

export const getStudentHalaqas = async (client: AxiosInstance, studentId: string) => {
  const response = await client.get<StudentHalaqaDto[]>(`/students/${studentId}/halaqas`);
  return normalizeCollection(response.data);
};

// ── Memorize management records ─────────────────────────────────────────────

export const addQuranPage = async (
  client: AxiosInstance,
  halaqaId: string,
  studentId: string,
  payload: AddQuranPageRequest
) => {
  const response = await client.post<StudentQuraanPageDetailDto>(
    `/memorize-managment/halaqas/${halaqaId}/students/${studentId}/quran-pages`,
    payload
  );
  return response.data;
};

export const addHadith = async (
  client: AxiosInstance,
  halaqaId: string,
  studentId: string,
  payload: AddHadithRequest
) => {
  const response = await client.post<StudentHadithDetailDto>(
    `/memorize-managment/halaqas/${halaqaId}/students/${studentId}/hadiths`,
    payload
  );
  return response.data;
};

export const getStudentQuranPages = async (
  client: AxiosInstance,
  studentId: string,
  filters?: MemorizationRecordFilters
) => {
  const response = await client.get<StudentQuraanPageDetailDto[]>(
    `/memorize-managment/students/${studentId}/quran-pages`,
    { params: filters }
  );
  return normalizeCollection(response.data);
};

export const getStudentHadiths = async (
  client: AxiosInstance,
  studentId: string,
  filters?: MemorizationRecordFilters
) => {
  const response = await client.get<StudentHadithDetailDto[]>(
    `/memorize-managment/students/${studentId}/hadiths`,
    { params: filters }
  );
  return normalizeCollection(response.data);
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
