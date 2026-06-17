import api from './api';
import { Tag } from '../types';

const unwrapArray = (payload: any): Tag[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.tags)) return payload.tags;
  if (Array.isArray(payload?.data?.tags)) return payload.data.tags;
  return [];
};

const unwrapItem = (payload: any): Tag => {
  if (payload?.data && !Array.isArray(payload.data)) return payload.data;
  return payload;
};

export const tagService = {
  getTags: async (): Promise<Tag[]> => {
    const response = await api.get('/tags');
    return unwrapArray(response.data);
  },

  createTag: async (data: { name: string; color?: string }): Promise<Tag> => {
    const response = await api.post('/tags', data);
    return unwrapItem(response.data);
  },

  updateTag: async (id: number, data: { name?: string; color?: string }): Promise<Tag> => {
    const response = await api.patch(`/tags/${id}`, data);
    return unwrapItem(response.data);
  },

  deleteTag: async (id: number): Promise<void> => {
    await api.delete(`/tags/${id}`);
  },
};
