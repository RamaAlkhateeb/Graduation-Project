import type { AxiosInstance } from "axios";
import axios from "axios";

export interface AcademicStageDto {
  id: string;
  grade: number | string;
  displayName?: string;
}

export interface MemorizedQuranPartDto {
  id: string;
  memorizedQuranPart: number | string;
  displayName?: string;
}

export interface CreateStudentRequest {
  name: string;
  fatherName: string;
  lastName: string;
  fatherWork: string;
  parentPhoneNumber: string;
  schoolName: string;
  parentWhatsAppPhoneNumber: string;
  dateOfBirth: string;
  landlineNumber?: string | null;
  additionalInformations?: string | null;
  userName: string;
  password: string;
  academicStageId: string;
  email: string;
}

export interface UpdateStudentRequest {
  name?: string | null;
  fatherName?: string | null;
  lastName?: string | null;
  fatherWork?: string | null;
  parentPhoneNumber?: string | null;
  schoolName?: string | null;
  parentWhatsAppPhoneNumber?: string | null;
  dateOfBirth?: string | null;
  landlineNumber?: string | null;
  additionalInformations?: string | null;
  academicStageId?: string | null;
  email?: string | null;
}

export interface StudentDetailDto {
  id: string;
  name: string;
  fatherName: string;
  lastName: string;
  fatherWork: string;
  parentPhoneNumber: string;
  schoolName: string;
  parentWhatsAppPhoneNumber: string;
  dateOfBirth: string;
  landlineNumber?: string | null;
  additionalInformations?: string | null;
  academicStageId: string;
  academicStage?: AcademicStageDto | null;
  memorizedQuranParts?: MemorizedQuranPartDto[];
  userName?: string | null;
  email?: string | null;
}

export interface StudentListParams {
  pageNumber?: number;
  pageSize?: number;
  classId?: string;
  semesterId?: string;
  courseId?: string;
  teacherId?: string;
  include?: string;
}

export interface StudentListResponse {
  items?: StudentDetailDto[];
  data?: StudentDetailDto[];
  totalItems?: number;
  totalCount?: number;
  total?: number;
  count?: number;
  totalPages?: number;
  pageCount?: number;
  page?: number;
  pageSize?: number;
}

const withIncludes = (includes?: string[]) =>
  includes?.length ? { include: includes.join(",") } : undefined;

const shouldFallbackToFilteredStudents = (error: unknown) =>
  axios.isAxiosError(error) &&
  (error.response?.status === 404 || error.response?.status === 405);

export const getAcademicStages = async (client: AxiosInstance) => {
  const response = await client.get<AcademicStageDto[]>("/academic-stages");
  return response.data;
};

export const getMemorizedQuranParts = async (client: AxiosInstance) => {
  const response = await client.get<MemorizedQuranPartDto[]>("/memorized-quran-parts");
  return response.data;
};

export const getStudents = async (
  client: AxiosInstance,
  params?: StudentListParams
) => {
  try {
    const response = await client.get<StudentDetailDto[] | StudentListResponse>("/students", {
      params,
    });
    return response.data;
  } catch (error) {
    if (!shouldFallbackToFilteredStudents(error)) {
      throw error;
    }

    const response = await client.get<StudentDetailDto[] | StudentListResponse>(
      "/students/filtered",
      { params }
    );
    return response.data;
  }
};

export const getStudentById = async (
  client: AxiosInstance,
  id: string,
  includes?: string[]
) => {
  const response = await client.get<StudentDetailDto>(`/students/${id}`, {
    params: withIncludes(includes),
  });
  return response.data;
};

export const createStudent = async (
  client: AxiosInstance,
  payload: CreateStudentRequest
) => {
  const response = await client.post<StudentDetailDto>("/students", payload);
  return response.data;
};

export const updateStudent = async (
  client: AxiosInstance,
  id: string,
  payload: UpdateStudentRequest
) => {
  const response = await client.put<StudentDetailDto>(`/students/${id}`, payload);
  return response.data;
};

export const updateStudentMemorizedParts = async (
  client: AxiosInstance,
  studentId: string,
  partIds: string[]
) => {
  await client.put(`/students/${studentId}/memorized-parts`, {
    parts: partIds,
  });
};
