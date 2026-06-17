import api from './api';
import { CustomCategory } from '../types';

const unwrapArray = (payload: any): CustomCategory[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.categories)) return payload.categories;
  if (Array.isArray(payload?.data?.categories)) return payload.data.categories;
  return [];
};

const unwrapItem = (payload: any): CustomCategory => {
  if (payload?.data && !Array.isArray(payload.data)) return payload.data;
  return payload;
};

export const customCategoryService = {
  getCustomCategories: async (): Promise<CustomCategory[]> => {
    const response = await api.get('/custom-categories');
    return unwrapArray(response.data);
  },

  createCustomCategory: async (data: {
    name: string;
    followupDays?: number;
    color?: string;
  }): Promise<CustomCategory> => {
    const response = await api.post('/custom-categories', data);
    return unwrapItem(response.data);
  },

  updateCustomCategory: async (
    id: number,
    data: {
      name?: string;
      followupDays?: number;
      color?: string;
    }
  ): Promise<CustomCategory> => {
    const response = await api.patch(`/custom-categories/${id}`, data);
    return unwrapItem(response.data);
  },

  deleteCustomCategory: async (id: number): Promise<void> => {
    await api.delete(`/custom-categories/${id}`);
  },
};
