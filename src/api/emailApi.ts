import axios from 'axios';
import { API_URL } from '../config';
import type { SendEmailRequest, SendTemplateEmailRequest } from '../types/email';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('expiresAt');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export const emailApi = {
  send: (data: SendEmailRequest) => api.post('/Email/send', data).then((r) => r.data),
  sendTemplate: (data: SendTemplateEmailRequest) =>
    api.post('/Email/send-template', data).then((r) => r.data),
};