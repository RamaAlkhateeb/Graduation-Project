import axios from 'axios';
import { API_URL } from '../config';
import { useAuthStore } from '../store/authStore';
import type {
  SemesterDto, CreateSemesterDto, UpdateSemesterDto,
  CourseDto, CreateCourseDto, UpdateCourseDto,
  HalaqaDto, CreateHalaqaDto, UpdateHalaqaDto,
  StudentDto, CreateStudentDto, UpdateStudentDto,
  TeacherDto, CreateTeacherDto, UpdateTeacherDto,
  EnrollmentDto, CreateEnrollmentDto,
} from '../types/academic';

const api = axios.create({ baseURL: API_URL });

const canRetryWithFallback = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 404 || status === 405;
};

async function getWithFallback<T>(paths: string[]): Promise<T> {
  let lastError: unknown;
  for (const path of paths) {
    try {
      const response = await api.get<T>(path);
      return response.data;
    } catch (error) {
      lastError = error;
      if (!canRetryWithFallback(error)) throw error;
    }
  }
  throw lastError;
}

async function postWithFallback<TResponse, TBody>(paths: string[], data: TBody): Promise<TResponse> {
  let lastError: unknown;
  for (const path of paths) {
    try {
      const response = await api.post<TResponse>(path, data);
      return response.data;
    } catch (error) {
      lastError = error;
      if (!canRetryWithFallback(error)) throw error;
    }
  }
  throw lastError;
}

async function putWithFallback<TResponse, TBody>(paths: string[], data: TBody): Promise<TResponse> {
  let lastError: unknown;
  for (const path of paths) {
    try {
      const response = await api.put<TResponse>(path, data);
      return response.data;
    } catch (error) {
      lastError = error;
      if (!canRetryWithFallback(error)) throw error;
    }
  }
  throw lastError;
}

async function deleteWithFallback(paths: string[]): Promise<void> {
  let lastError: unknown;
  for (const path of paths) {
    try {
      await api.delete(path);
      return;
    } catch (error) {
      lastError = error;
      if (!canRetryWithFallback(error)) throw error;
    }
  }
  throw lastError;
}

function normalizeArrayResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidate = record.items ?? record.data ?? record.result ?? record.value;
    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }

  return [];
}

function normalizeStudentResponse(payload: unknown): StudentDto[] {
  const items = normalizeArrayResponse<Record<string, unknown>>(payload);
  return items.map(item => ({
    id: String(item.id ?? ''),
    name: String(item.name ?? ''),
    fatherName: String(item.fatherName ?? ''),
    motherName: String(item.motherName ?? ''),
    nationalityNumber: String(item.nationalityNumber ?? ''),
    email: typeof item.email === 'string' ? item.email : undefined,
    userName: typeof item.userName === 'string' ? item.userName : undefined,
    roleType: typeof item.roleType === 'string' ? item.roleType : undefined,
  })).filter(item => item.id && item.name);
}

function normalizeTeacherResponse(payload: unknown): TeacherDto[] {
  const items = normalizeArrayResponse<Record<string, unknown>>(payload);
  return items.map(item => {
    const contactItems = Array.isArray(item.teacherContactInfos)
      ? item.teacherContactInfos as Record<string, unknown>[]
      : [];

    const contactInfos = contactItems.map(contact => {
      const contactInfo = contact.contactInfo && typeof contact.contactInfo === 'object'
        ? contact.contactInfo as Record<string, unknown>
        : null;

      return {
        number: String(contactInfo?.number ?? ''),
        email: typeof contactInfo?.email === 'string' ? contactInfo.email : undefined,
        isActive: typeof contactInfo?.isActive === 'boolean' ? contactInfo.isActive : undefined,
      };
    }).filter(contact => contact.number);

    return {
      id: String(item.id ?? ''),
      name: String(item.name ?? ''),
      fatherName: String(item.fatherName ?? ''),
      motherName: String(item.motherName ?? ''),
      nationalityNumber: String(item.nationalityNumber ?? ''),
      email: typeof item.email === 'string' ? item.email : undefined,
      contactInfos,
    };
  }).filter(item => item.id && item.name);
}

function normalizeEnrollmentResponse(payload: unknown): EnrollmentDto[] {
  const items = normalizeArrayResponse<Record<string, unknown>>(payload);
  return items.map(item => {
    const id = String(item.id ?? '');
    const studentId = String(item.studentId ?? '');
    const halaqaId = String(item.classId ?? item.halaqaId ?? '');
    const studentName = typeof item.studentName === 'string' ? item.studentName : undefined;
    const halaqaName = typeof item.className === 'string' ? item.className : undefined;

    return {
      id,
      studentId,
      halaqaId,
      student: studentName ? {
        id: studentId,
        name: studentName,
        fatherName: '',
        motherName: '',
        nationalityNumber: '',
      } : undefined,
      halaqa: halaqaName ? { id: halaqaId, className: halaqaName, courseId: '' } : undefined,
    };
  }).filter(item => item.id && item.studentId && item.halaqaId);
}

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const semesterApi = {
  list: () =>
    api.get<unknown>('/semesters').then(r => normalizeArrayResponse<SemesterDto>(r.data)),
  get: (id: string) =>
    api.get<SemesterDto>(`/semesters/${id}`).then(r => r.data),
  create: (data: CreateSemesterDto) =>
    api.post<SemesterDto>('/semesters', data).then(r => r.data),
  update: (id: string, data: UpdateSemesterDto) =>
    api.put<SemesterDto>(`/semesters/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/semesters/${id}`),
};

export const courseApi = {
  list: () =>
    api.get<unknown>('/courses').then(r => normalizeArrayResponse<CourseDto>(r.data)),
  bySemester: (semesterId: string) =>
    api.get<unknown>(`/courses/by-semester/${semesterId}`).then(r => normalizeArrayResponse<CourseDto>(r.data)),
  get: (id: string) =>
    api.get<CourseDto>(`/courses/${id}`).then(r => r.data),
  create: (data: CreateCourseDto) =>
    api.post<CourseDto>('/courses', data).then(r => r.data),
  update: (id: string, data: UpdateCourseDto) =>
    api.put<CourseDto>(`/courses/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/courses/${id}`),
};

export const halaqaApi = {
  list: () =>
    api.get<unknown>('/halaqas').then(r => normalizeArrayResponse<HalaqaDto>(r.data)),
  byCourse: (courseId: string) =>
    api.get<unknown>(`/halaqas/by-course/${courseId}`).then(r => normalizeArrayResponse<HalaqaDto>(r.data)),
  get: (id: string) =>
    api.get<HalaqaDto>(`/halaqas/${id}`).then(r => r.data),
  create: (data: CreateHalaqaDto) =>
    api.post<HalaqaDto>('/halaqas', data).then(r => r.data),
  update: (id: string, data: UpdateHalaqaDto) =>
    api.put<HalaqaDto>(`/halaqas/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/halaqas/${id}`),
};

export const studentApi = {
  list: () =>
    getWithFallback<unknown>(['/students/filtered', '/students', '/student']).then(payload => normalizeStudentResponse(payload)),
  listPaged: (pageNumber: number, pageSize: number) =>
    api.get<unknown>(`/students/filtered?pageNumber=${pageNumber}&pageSize=${pageSize}`).then(r => normalizeStudentResponse(r.data)),
  get: (id: string) =>
    getWithFallback<StudentDto>([`/students/${id}`, `/student/${id}`]),
  create: async (data: CreateStudentDto) => {
    const formData = new FormData();
    formData.append('Name', data.name);
    formData.append('FatherName', data.fatherName);
    formData.append('MotherName', data.motherName);
    formData.append('NationalityNumber', data.nationalityNumber);
    formData.append('Email', data.email ?? '');

    (data.contactInfos ?? []).forEach((contact, index) => {
      formData.append(`ContactInfos[${index}].Number`, contact.number);
      formData.append(`ContactInfos[${index}].Email`, contact.email ?? '');
      formData.append(`ContactInfos[${index}].IsActive`, String(contact.isActive ?? true));
    });

    const response = await api.post<unknown>('/students', formData);
    const payload = response.data as Record<string, unknown>;
    const idFromRoot = payload && typeof payload.id !== 'undefined' ? String(payload.id) : '';
    const nested = payload && typeof payload.data === 'object' && payload.data
      ? payload.data as Record<string, unknown>
      : null;
    const idFromData = nested && typeof nested.id !== 'undefined' ? String(nested.id) : '';
    return idFromRoot || idFromData;
  },
  update: (id: string, data: UpdateStudentDto) =>
    putWithFallback<unknown, UpdateStudentDto>([`/students/${id}`, `/student/${id}`], data),
  resetPassword: (id: string, newPassword: string) =>
    api.put(`/students/${id}/password`, { newPassword }),
  delete: (id: string) =>
    deleteWithFallback([`/students/${id}`, `/student/${id}`]),
};

export const teacherApi = {
  list: () =>
    getWithFallback<unknown>(['/teachers/filtered', '/teachers', '/teacher']).then(payload => normalizeTeacherResponse(payload)),
  listPaged: (pageNumber: number, pageSize: number) =>
    api.get<unknown>(`/teachers/filtered?pageNumber=${pageNumber}&pageSize=${pageSize}`).then(r => normalizeTeacherResponse(r.data)),
  get: (id: string) =>
    getWithFallback<TeacherDto>([`/teachers/${id}`, `/teacher/${id}`]),
  create: (data: CreateTeacherDto) =>
    postWithFallback<unknown, CreateTeacherDto>(['/teachers', '/teacher'], data),
  update: (id: string, data: UpdateTeacherDto) =>
    putWithFallback<unknown, UpdateTeacherDto>([`/teachers/${id}`, `/teacher/${id}`], data),
  resetPassword: (id: string, newPassword: string) =>
    api.put(`/teachers/${id}/password`, { newPassword }),
  delete: (id: string) =>
    deleteWithFallback([`/teachers/${id}`, `/teacher/${id}`]),
};

export const enrollmentApi = {
  listByStudents: async (studentIds: string[]) => {
    const enrollmentLists = await Promise.all(studentIds.map(studentId =>
      getWithFallback<unknown>([`/students/${studentId}/enrollments`]).then(payload => normalizeEnrollmentResponse(payload))
    ));

    return enrollmentLists.flat();
  },
  byStudent: (studentId: string) =>
    getWithFallback<unknown>([`/students/${studentId}/enrollments`]).then(payload => normalizeEnrollmentResponse(payload)),
  byHalaqa: async (_halaqaId: string) => [],
  create: (data: CreateEnrollmentDto) =>
    postWithFallback<unknown, string>([`/students/${data.studentId}/enrollments`], data.halaqaId).then(() => undefined),
  delete: async (_id: string) => {
    throw new Error('Enrollment delete endpoint is not available in backend.');
  },
};
