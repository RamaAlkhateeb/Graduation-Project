import axios from 'axios';
import { API_URL } from '../config';
import { useAuthStore } from '../store/authStore';
import type {
  FormDto, CreateFormDto, UpdateFormDto,
  FormQuestionDto, CreateFormQuestionDto, UpdateFormQuestionDto,
  FormQuestionOptionDto, CreateFormQuestionOptionDto, UpdateFormQuestionOptionDto,
  FormResponseDto, SubmitFormResponseDto, PaginatedResult,
} from '../types/form';

const api = axios.create({ baseURL: API_URL });

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear auth and redirect to login
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

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ token: string; expiresAt: string }>('/auth/login', { username, password }).then(r => r.data),
};

export const formApi = {
  list: (page = 1, pageSize = 20) =>
    api.get<PaginatedResult<FormDto>>(`/forms/paged?page=${page}&pageSize=${pageSize}`).then(r => r.data),
  get: (id: string) =>
    api.get<FormDto>(`/forms/${id}`).then(r => r.data),
  getByToken: (token: string) =>
    api.get<FormDto>(`/forms/access/${token}`).then(r => r.data),
  create: (data: CreateFormDto) =>
    api.post<FormDto>('/forms', data).then(r => r.data),
  update: (id: string, data: UpdateFormDto) =>
    api.put<FormDto>(`/forms/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/forms/${id}`),
};

export const questionApi = {
  create: (data: CreateFormQuestionDto) =>
    api.post<FormQuestionDto>('/formquestions', data).then(r => r.data),
  update: (id: string, data: UpdateFormQuestionDto) =>
    api.put<FormQuestionDto>(`/formquestions/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/formquestions/${id}`),
};

export const optionApi = {
  create: (data: CreateFormQuestionOptionDto & { questionId: string }) =>
    api.post<FormQuestionOptionDto>('/formquestionoptions', data).then(r => r.data),
  update: (id: string, data: UpdateFormQuestionOptionDto) =>
    api.put<FormQuestionOptionDto>(`/formquestionoptions/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/formquestionoptions/${id}`),
};

export const responseApi = {
  submit: (data: SubmitFormResponseDto) =>
    api.post<FormResponseDto>('/formresponses/submit', data).then(r => r.data),
  list: (formId: string) =>
    api.get<FormResponseDto[]>(`/formresponses/by-form/${formId}`).then(r => r.data),
};
