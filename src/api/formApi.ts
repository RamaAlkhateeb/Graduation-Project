import axios from 'axios';
import { API_URL } from '../config';
import type {
  FormDto, CreateFormDto, UpdateFormDto,
  FormQuestionDto, CreateFormQuestionDto, UpdateFormQuestionDto,
  FormQuestionOptionDto, CreateFormQuestionOptionDto, UpdateFormQuestionOptionDto,
  FormResponseDto, SubmitFormResponseDto, PaginatedResult,
  FormAnswerDto, GradeAnswerDto,
} from '../types/form';

const api = axios.create({ baseURL: API_URL });

// إرفاق التوكن مع كل طلب 
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// عند 401: مسح التوكن والعودة لصفحة تسجيل الدخول الفعلية ("/")
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('expiresAt');
      window.location.href = '/';
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

// تصحيح الأسئلة النصية (ShortText / LongText) يدويًا من قبل المعلم.
// ⚠️ ملاحظة: هذا المسار (PUT /formanswers/{id}/grade) يجب أن يكون مطبقًا في الـ backend،
// ويُفترض أن يقوم بإعادة احتساب الدرجة الإجمالية (score) لكامل الرد (FormResponseDto)
// بحيث تشمل درجات الأسئلة المصححة يدويًا إضافة إلى الأسئلة المصححة تلقائيًا.
export const answerApi = {
  grade: (answerId: string, pointsAwarded: number) =>
    api
      .put<FormAnswerDto>(`/formanswers/${answerId}/grade`, { pointsAwarded } as GradeAnswerDto)
      .then(r => r.data),
};
