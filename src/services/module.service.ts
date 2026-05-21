import api from './api.service';
import type { Module, ModuleField, MenuItem, DynamicRecord, PaginationMeta, DynamicListResult } from '../types';

export const moduleService = {
  // Modules
  async getModules(params?: Record<string, unknown>) {
    const response = await api.get('/modules', { params });
    return response.data;
  },

  async getModule(id: string): Promise<Module> {
    const response = await api.get(`/modules/${id}`);
    return response.data.data;
  },

  async getModuleBySlug(slug: string): Promise<Module> {
    const response = await api.get(`/modules/slug/${slug}`);
    return response.data.data;
  },

  async createModule(data: Partial<Module>): Promise<Module> {
    const response = await api.post('/modules', data);
    return response.data.data;
  },

  async updateModule(id: string, data: Partial<Module>): Promise<Module> {
    const response = await api.put(`/modules/${id}`, data);
    return response.data.data;
  },

  async deleteModule(id: string): Promise<void> {
    await api.delete(`/modules/${id}`);
  },

  // Fields
  async addField(moduleId: string, data: Partial<ModuleField>): Promise<ModuleField> {
    const response = await api.post(`/modules/${moduleId}/fields`, data);
    return response.data.data;
  },

  async updateField(moduleId: string, fieldId: string, data: Partial<ModuleField>): Promise<ModuleField> {
    const response = await api.put(`/modules/${moduleId}/fields/${fieldId}`, data);
    return response.data.data;
  },

  async deleteField(moduleId: string, fieldId: string): Promise<void> {
    await api.delete(`/modules/${moduleId}/fields/${fieldId}`);
  },

  async reorderFields(moduleId: string, fields: { id: string; sortOrder: number }[]): Promise<void> {
    await api.put(`/modules/${moduleId}/fields/reorder`, { fields });
  },

  // Menu
  async getMenuTree(): Promise<MenuItem[]> {
    const response = await api.get('/modules/menu');
    return response.data.data;
  },

  // Dynamic Data
  async getRecords(moduleSlug: string, params?: Record<string, unknown>): Promise<DynamicListResult> {
    const response = await api.get(`/data/${moduleSlug}`, { params });
    const { data: records, meta } = response.data;
    return {
      data: records,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      module: response.data.module,
    } as DynamicListResult;
  },

  async getRecord(moduleSlug: string, id: string): Promise<{ data: DynamicRecord; module: Module }> {
    const response = await api.get(`/data/${moduleSlug}/${id}`);
    return response.data.data;
  },

  async createRecord(moduleSlug: string, data: Record<string, unknown>): Promise<DynamicRecord> {
    const response = await api.post(`/data/${moduleSlug}`, data);
    return response.data.data;
  },

  async updateRecord(moduleSlug: string, id: string, data: Record<string, unknown>): Promise<DynamicRecord> {
    const response = await api.put(`/data/${moduleSlug}/${id}`, data);
    return response.data.data;
  },

  async deleteRecord(moduleSlug: string, id: string): Promise<void> {
    await api.delete(`/data/${moduleSlug}/${id}`);
  },

  async bulkDelete(moduleSlug: string, ids: string[]): Promise<{ deleted: number }> {
    const response = await api.post(`/data/${moduleSlug}/bulk-delete`, { ids });
    return response.data.data;
  },

  async exportRecords(moduleSlug: string, format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> {
    const response = await api.get(`/data/${moduleSlug}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};
