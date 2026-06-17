import api from './api';
import { ApiResponse, Contact, ContactCategory, ContactInteraction, InteractionType } from '../types';

export const contactService = {
  /**
   * Get all contacts with optional filtering and pagination
   */
  getContacts: async (params?: { 
    search?: string;
    skip?: number;
    take?: number;
    category?: ContactCategory;
    customCategoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    tagIds?: number[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ contacts: Contact[]; total: number }> => {
    try {
      // Create request params object with pagination
      const requestParams: Record<string, any> = {};
      
      // Add search if provided
      if (params?.search) {
        requestParams.search = params.search;
      }
      
      // Add pagination params if provided
      if (params?.skip !== undefined) {
        requestParams.skip = params.skip;
      }
      
      if (params?.take !== undefined) {
        requestParams.take = params.take;
      }
      
      // Add category if provided
      if (params?.category) {
        requestParams.category = params.category;
      }

      if (params?.customCategoryId !== undefined) {
        requestParams.customCategoryId = params.customCategoryId;
      }

      if (params?.minPrice !== undefined) {
        requestParams.minPrice = params.minPrice;
      }

      if (params?.maxPrice !== undefined) {
        requestParams.maxPrice = params.maxPrice;
      }

      if (params?.tagIds && params.tagIds.length > 0) {
        requestParams.tagIds = params.tagIds.join(',');
      }
      
      // Add sorting if provided
      if (params?.sortBy) {
        requestParams.sortBy = params.sortBy;
      }
      
      if (params?.sortOrder) {
        requestParams.sortOrder = params.sortOrder;
      }
      
      const response = await api.get<any>('/contacts', { 
        params: Object.keys(requestParams).length > 0 ? requestParams : undefined 
      });
      
      // The API returns { contacts: Contact[], total: number } directly
      // rather than wrapped in a data property
      if (response.data && Array.isArray(response.data.contacts)) {
        return response.data;
      } else if (Array.isArray(response.data)) {
        // Fallback in case API returns array directly
        return { contacts: response.data, total: response.data.length };
      }
      
      console.error('Unexpected API response format:', response.data);
      return { contacts: [], total: 0 };
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return { contacts: [], total: 0 };
    }
  },
  
  /**
   * Get a specific contact by ID
   */
  getContactById: async (id: number): Promise<Contact> => {
    try {
      const response = await api.get<any>(`/contacts/${id}`);
      
      // Check if the response data is the contact object directly
      if (response.data && response.data.id) {
        return response.data;
      }
      
      // Check if response is wrapped in data property (ApiResponse format)
      if (response.data && response.data.data && response.data.data.id) {
        return response.data.data;
      }
      
      // For error case, log and throw
      console.error('Unexpected contact API response format:', response.data);
      throw new Error('Invalid contact data received');
    } catch (error) {
      console.error(`Error fetching contact with ID ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new contact
   */
  createContact: async (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Contact> => {
    const response = await api.post<ApiResponse<Contact>>('/contacts', contactData);
    return response.data.data;
  },
  
  /**
   * Update an existing contact
   */
  updateContact: async (id: number, contactData: Partial<Contact>): Promise<Contact> => {
    const response = await api.patch<ApiResponse<Contact>>(`/contacts/${id}`, contactData);
    return response.data.data;
  },
  
  /**
   * Delete a contact
   */
  deleteContact: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/contacts/${id}`);
  },
  
  /**
   * Get contacts by category
   */
  getContactsByCategory: async (category: ContactCategory): Promise<Contact[]> => {
    try {
      const response = await api.get<ApiResponse<Contact[]>>(`/contacts/category/${category}`);
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching contacts for category ${category}:`, error);
      return [];
    }
  },
  
  /**
   * Import contacts from CSV or Excel file
   */
  importContacts: async (file: File, defaultCategory?: ContactCategory): Promise<{ imported: number; failed: number; skipped?: Array<{ fullName?: string; email?: string; phone?: string; reason: string }> }> => {
    const formData = new FormData();
    formData.append('file', file);

    // Infer format from file extension or MIME type so backend parses correctly
    const fileName = file.name.toLowerCase();
    const isExcel =
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls') ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel';

    formData.append('format', isExcel ? 'EXCEL' : 'CSV');
    if (defaultCategory) {
      formData.append('defaultCategory', defaultCategory);
    }
    
    const response = await api.post<ApiResponse<{ imported: number; failed: number; skipped?: Array<{ fullName?: string; email?: string; phone?: string; reason: string }> }>>(
      '/contacts/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // Surface skipped reasons in dev tools for quick debugging
    if ((response.data as any)?.data?.skipped?.length) {
      // eslint-disable-next-line no-console
      console.table((response.data as any).data.skipped);
    }

    return response.data.data as any;
  },
  
  /**
   * Log an interaction with a contact (call, email, text)
   */
  logContactInteraction: async (contactId: number, data: { 
    type: InteractionType; 
    notes?: string 
  }): Promise<Contact> => {
    const response = await api.post<ApiResponse<Contact>>(`/contacts/${contactId}/interactions`, data);
    return response.data.data;
  },

  /**
   * Get interaction history for a contact
   */
  getContactInteractions: async (contactId: number): Promise<ContactInteraction[]> => {
    try {
      const response = await api.get<any>(`/contacts/${contactId}/interactions`);
      
      // Check if response is wrapped in data property
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // Check if response data is array directly
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      console.error('Unexpected interaction history API response format:', response.data);
      return [];
    } catch (error) {
      console.error(`Error fetching interaction history for contact ${contactId}:`, error);
      return [];
    }
  },
  
  /**
   * Initialize next contact date for a contact based on their category
   */
  initializeNextContactDate: async (contactId: number): Promise<Contact> => {
    const response = await api.post<ApiResponse<Contact>>(`/contacts/${contactId}/initialize-next-contact`);
    return response.data.data;
  },
  
  /**
   * Get contacts that are due for follow-up today
   */
  getDueContacts: async (includeNeverContacted: boolean = true): Promise<{ contacts: Contact[]; total: number }> => {
    try {
      const params = includeNeverContacted ? { includeNeverContacted: true } : undefined;
      const response = await api.get<ApiResponse<{ contacts: Contact[]; total: number }>>(
        '/contacts/due-today', 
        { params }
      );
      
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      // Alternative response format - directly from API without wrapper
      if (response.data && 'contacts' in response.data && Array.isArray(response.data.contacts)) {
        const responseData = response.data as unknown as { contacts: Contact[]; total: number };
        return responseData;
      }
      
      console.error('Unexpected API response format for due contacts:', response.data);
      return { contacts: [], total: 0 };
    } catch (error) {
      console.error('Error fetching due contacts:', error);
      return { contacts: [], total: 0 };
    }
  },
  
  fetchAllContacts: async (): Promise<Contact[]> => {
    const take = 1000; // big page to minimize round trips
    let skip = 0;
    let total = Infinity;
    const all: Contact[] = [];

    while (skip < total) {
      const { data } = await api.get<{ contacts: Contact[]; total: number }>('/contacts', {
        params: { skip, take, sortBy: 'fullName', sortOrder: 'asc' },
      });

      const pageContacts = Array.isArray(data?.contacts) ? data.contacts : Array.isArray(data) ? data : [];
      const pageTotal = typeof data?.total === 'number' ? data.total : pageContacts.length;

      total = pageTotal;
      all.push(...pageContacts);
      skip += take;

      // Safety: break if API ever misreports total
      if (pageContacts.length === 0) break;
    }

    return all;
  },
}; 
