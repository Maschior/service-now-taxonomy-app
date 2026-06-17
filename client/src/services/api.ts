import axios from 'axios';
import { Application, Module, Incident, Action, Tag, TagCategory, Closure } from '../types/index';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const workspaceId = localStorage.getItem('currentWorkspaceId');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (workspaceId) {
    config.headers['x-workspace-id'] = workspaceId;
  }
  
  return config;
});

export const applicationApi = {
  getAll: () => api.get<Application[]>('/applications'),
  create: (data: Partial<Application>) => api.post<Application>('/applications', data),
  update: (id: string, data: Partial<Application>) => api.put<Application>(`/applications/${id}`, data),
  delete: (id: string) => api.delete(`/applications/${id}`)
};

export const moduleApi = {
  getAll: (applicationId?: string) =>
    api.get<Module[]>('/modules', { params: { applicationId } }),
  create: (data: Partial<Module>) => api.post<Module>('/modules', data),
  update: (id: string, data: Partial<Module>) => api.put<Module>(`/modules/${id}`, data),
  delete: (id: string) => api.delete(`/modules/${id}`)
};

export const incidentApi = {
  getAll: (params?: { moduleId?: string; applicationId?: string }) =>
    api.get<Incident[]>('/incidents', { params }),
  create: (data: { name: string; moduleIds: string[] }) => api.post<Incident>('/incidents', data),
  update: (id: string, data: Partial<Incident>) => api.put<Incident>(`/incidents/${id}`, data),
  delete: (id: string) => api.delete(`/incidents/${id}`)
};

export const actionApi = {
  getAll: (params?: { incidentId?: string; moduleId?: string; applicationId?: string }) =>
    api.get<Action[]>('/actions', { params }),
  create: (data: { name: string; incidentIds: string[] }) => api.post<Action>('/actions', data),
  update: (id: string, data: Partial<Action>) => api.put<Action>(`/actions/${id}`, data),
  delete: (id: string) => api.delete(`/actions/${id}`)
};

export const tagApi = {
  getAll: (categoryId?: string) =>
    api.get<Tag[]>('/tags', { params: { categoryId } }),
  create: (data: Partial<Tag>) => api.post<Tag>('/tags', data),
  update: (id: string, data: Partial<Tag>) => api.put<Tag>(`/tags/${id}`, data),
  delete: (id: string) => api.delete(`/tags/${id}`),
  getCategories: () => api.get<TagCategory[]>('/tags/categories'),
  createCategory: (data: Partial<TagCategory>) => api.post<TagCategory>('/tags/categories', data),
  updateCategory: (id: string, data: Partial<TagCategory>) => api.put<TagCategory>(`/tags/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/tags/categories/${id}`)
};

export const importApi = {
  importCsv: (csvData: string) => api.post<{ message: string }>('/import', { csvData })
};

export const closureApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; shortDescription?: string; tags?: string; startDate?: string; endDate?: string }) => 
    api.get<{ data: Closure[], pagination: any }>('/closures', { params }),
  create: (data: {
    shortDescription: string;
    resolutionNotes: string;
    applicationId?: string;
    moduleId?: string;
    incidentId?: string;
    actionId?: string;
    tags?: string[];
    motivo?: string;
    analise?: string;
    solucao?: string;
  }) => api.post<Closure>('/closures', data),
  delete: (id: string) => api.delete(`/closures/${id}`)
};

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    return error.message;
  }
  return 'An unexpected error occurred';
};
