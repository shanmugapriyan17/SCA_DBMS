/**
 * @file api.ts
 * @description API client for backend communication
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || { error: 'Network error' });
    }
);

// Auth API
export const authApi = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    register: (username: string, email: string, password: string, full_name: string) =>
        api.post('/auth/register', { username, email, password, full_name }),
    getMe: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout')
};

// Skills API
export const skillsApi = {
    getAll: (category?: string) => api.get('/skills', { params: { category } }),
    getById: (id: string) => api.get(`/skills/${id}`),
    getUserSkills: () => api.get('/skills/user/me')
};

// Assessments API
export const assessmentsApi = {
    getAll: (params?: { career_role?: string; difficulty?: string }) => api.get('/assessments', { params }),
    getById: (id: string) => api.get(`/assessments/${id}`),
    startAssessment: (id: string) => api.post(`/assessments/${id}/start`),
    submitAnswer: (attemptId: string, questionId: string, answer: string) =>
        api.post(`/assessments/attempt/${attemptId}/answer`, { question_id: questionId, answer }),
    submitAssessment: (attemptId: string) => api.post(`/assessments/attempt/${attemptId}/submit`),
    getHistory: () => api.get('/assessments/attempts/history'),
    create: (data: any) => api.post('/assessments', data),
    update: (id: string, data: any) => api.put(`/assessments/${id}`, data),
    delete: (id: string) => api.delete(`/assessments/${id}`),
    getQuestions: (id: string) => api.get(`/assessments/${id}/questions`),
    addQuestion: (id: string, data: any) => api.post(`/assessments/${id}/questions`, data),
    updateQuestion: (qid: string, data: any) => api.put(`/assessments/questions/${qid}`, data),
    deleteQuestion: (qid: string) => api.delete(`/assessments/questions/${qid}`),
};

// Careers API
export const careersApi = {
    getAll: () => api.get('/careers'),
    getById: (id: string) => api.get(`/careers/${id}`),
    getRecommendations: () => api.get('/careers/recommendations'),
    getSkillGap: (careerId: string) => api.get(`/careers/${careerId}/skill-gap`),
    getCareerAssessments: (careerId: string) => api.get(`/careers/${careerId}/assessments`),
};

// Analytics API
export const analyticsApi = {
    getDashboard: () => api.get('/analytics/dashboard'),
    getUserActivity: (userId: string) => api.get(`/analytics/users/${userId}`),
    getLoginHistory: (userId: string) => api.get(`/analytics/logins/${userId}`)
};

export default api;
