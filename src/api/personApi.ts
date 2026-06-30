import axios from 'axios';
import { API_URL } from '../config';
import { useAuthStore } from '../store/authStore';
import type {
  StudentListItemDto, CreateStudentDto, UpdateStudentDto, StudentEnrollmentDto,
  TeacherDto, CreateTeacherDto, UpdateTeacherDto, TeacherEnrollmentDto, EnrollInClassDto,
} from '../types/person';

const api = axios.create({ baseURL: API_URL });

function normalizeArrayResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidate = record.items ?? record.data ?? record.result ?? record.value;
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [];
}

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
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

export const studentApi = {
  list: () =>
    api.get<unknown>('/students/filtered').then(r => normalizeArrayResponse<StudentListItemDto>(r.data)),
  get: (id: string) =>
    api.get<StudentListItemDto>(`/students/${id}`).then(r => r.data),
  create: (data: CreateStudentDto) =>
    api.post<StudentListItemDto>('/students', data).then(r => r.data),
  update: (id: string, data: UpdateStudentDto) =>
    api.put<StudentListItemDto>(`/students/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/students/${id}`),
  getEnrollments: (id: string) =>
    api.get<unknown>(`/students/${id}/enrollments`).then(r => normalizeArrayResponse<StudentEnrollmentDto>(r.data)),
  enroll: (id: string, classId: string) =>
    api.post(`/students/${id}/enrollments`, classId, { headers: { 'Content-Type': 'application/json' } }),
};

export const teacherApi = {
  list: () =>
    api.get<unknown>('/teachers/filtered').then(r => normalizeArrayResponse<TeacherDto>(r.data)),
  get: (id: string) =>
    api.get<TeacherDto>(`/teachers/${id}`).then(r => r.data),
  create: (data: CreateTeacherDto) =>
    api.post<TeacherDto>('/teachers', data).then(r => r.data),
  update: (id: string, data: UpdateTeacherDto) =>
    api.put<TeacherDto>(`/teachers/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/teachers/${id}`),
  getEnrollments: (id: string) =>
    api.get<unknown>(`/teachers/${id}/enrollments`).then(r => normalizeArrayResponse<TeacherEnrollmentDto>(r.data)),
  enroll: (id: string, data: EnrollInClassDto) =>
    api.post(`/teachers/${id}/enrollments`, data),
};
