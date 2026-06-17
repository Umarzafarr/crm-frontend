import api from './api';
import { ApiResponse, Reminder } from '../types';

export const reminderService = {
  /**
   * Get all reminders with optional filtering
   */
  getReminders: async (params?: { 
    page?: number; 
    limit?: number;
    completed?: boolean;
  }): Promise<{ reminders: Reminder[]; total: number }> => {
    try {
      console.log('Calling getReminders API');
      const response = await api.get('/reminders', { params });
      console.log('API response:', response);
      
      // Handle direct array response
      let reminders: Reminder[];
      if (Array.isArray(response.data)) {
        reminders = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        reminders = response.data.data;
      } else {
        console.error('Unexpected response format:', response.data);
        reminders = [];
      }
      
      return { 
        reminders, 
        total: reminders.length 
      };
    } catch (error) {
      console.error('Error in getReminders:', error);
      return { reminders: [], total: 0 };
    }
  },
  
  /**
   * Get a specific reminder by ID
   */
  getReminderById: async (id: number): Promise<Reminder> => {
    const response = await api.get<ApiResponse<Reminder>>(`/reminders/${id}`);
    return response.data.data;
  },
  
  /**
   * Create a new reminder
   */
  createReminder: async (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Reminder> => {
    const response = await api.post<ApiResponse<Reminder>>('/reminders', reminderData);
    return response.data.data;
  },
  
  /**
   * Update an existing reminder
   */
  updateReminder: async (id: number, reminderData: Partial<Reminder>): Promise<Reminder> => {
    const response = await api.patch<ApiResponse<Reminder>>(`/reminders/${id}`, reminderData);
    return response.data.data;
  },
  
  /**
   * Delete a reminder
   */
  deleteReminder: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/reminders/${id}`);
  },
  
  /**
   * Get today's reminders
   */
  getDailyReminders: async (): Promise<Reminder[]> => {
    try {
      console.log('Calling getDailyReminders API');
      const response = await api.get('/reminders/daily');
      console.log('Daily reminders response:', response);
      
      // Handle direct array response
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.error('Unexpected daily reminders format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error in getDailyReminders:', error);
      return [];
    }
  },
  
  /**
   * Get reminder summary
   */
  getReminderSummary: async (): Promise<{ 
    completed: number; 
    pending: number; 
    total: number 
  }> => {
    try {
      console.log('Calling getReminderSummary API');
      const response = await api.get('/reminders/summary');
      console.log('Summary response:', response);
      
      // Handle direct object response
      if (response.data && typeof response.data === 'object') {
        if (response.data.data) {
          return response.data.data;
        } else {
          // The API might return the summary directly without wrapping it in data
          const { total, completed, pending, upcoming } = response.data;
          if (total !== undefined) {
            return { 
              total: total || 0, 
              completed: completed || 0, 
              pending: (pending || upcoming || 0) 
            };
          }
        }
      }
      
      console.error('Unexpected summary format:', response.data);
      return { completed: 0, pending: 0, total: 0 };
    } catch (error) {
      console.error('Error in getReminderSummary:', error);
      return { completed: 0, pending: 0, total: 0 };
    }
  },
  
  /**
   * Get contact goal progress
   */
  getGoalProgress: async (): Promise<{
    dailyGoal: number;
    contacted: number;
    remaining: number;
    dueToday: number;
  }> => {
    try {
      // First try to get goal progress from the API
      const response = await api.get<ApiResponse<{
        dailyGoal: number;
        contacted: number;
        remaining: number;
        dueToday: number;
      }>>('/reminders/goal-progress');
      
      // If we get a valid response, return it with dueToday as the goal if it's higher
      if (response.data && response.data.data) {
        const data = response.data.data;
        
        // Use dueToday as the goal if it's higher than the user's set dailyGoal
        const adjustedDailyGoal = Math.max(data.dailyGoal, data.dueToday);
        
        // Recalculate remaining based on the adjusted goal
        const adjustedRemaining = Math.max(0, adjustedDailyGoal - data.contacted);
        
        return {
          ...data,
          dailyGoal: adjustedDailyGoal,
          remaining: adjustedRemaining
        };
      }
      
      // If the response doesn't have the data we need, try to get due contacts directly
      const dueContactsResponse = await api.get<ApiResponse<{
        contacts: any[];
        total: number;
      }>>('/contacts/due-today');
      
      // Calculate the number of due contacts
      const dueToday = dueContactsResponse.data?.data?.total || 0;
      
      // Use dueToday as the daily goal if it's available, otherwise default to 5
      const dailyGoal = Math.max(5, dueToday);
      
      // Format dates in ISO format for the API
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setMilliseconds(tomorrow.getMilliseconds() - 1); // End of day
      const tomorrowStr = tomorrow.toISOString();
      
      // Get contacts that were contacted today
      try {
        const contactedTodayResponse = await api.get<ApiResponse<{
          contacts: any[];
          total: number;
        }>>('/contacts', {
          params: {
            lastContactedAfter: todayStr,
            lastContactedBefore: tomorrowStr,
          }
        });
        
        const contacted = contactedTodayResponse.data?.data?.total || 0;
        const remaining = Math.max(0, dailyGoal - contacted);
        
        return {
          dailyGoal,
          contacted,
          remaining,
          dueToday,
        };
      } catch (err) {
        console.error('Error fetching contacted today:', err);
        return {
          dailyGoal,
          contacted: 0,
          remaining: dailyGoal,
          dueToday,
        };
      }
    } catch (error) {
      console.error('Error fetching goal progress:', error);
      // Return default values in case of error
      return {
        dailyGoal: 0,
        contacted: 0,
        remaining: 0,
        dueToday: 0
      };
    }
  },

    /**
   * Get daily contact goal
   */
  getDailyGoal: async (): Promise<{ dailyGoal: number }> => {
    const response = await api.get<{ dailyGoal: number }>('/reminders/daily-goal');
    return response.data;
  },
  
  /**
   * Update daily contact goal
   */
  updateDailyGoal: async (dailyGoal: number): Promise<{ dailyGoal: number }> => {
    const response = await api.patch<ApiResponse<{ dailyGoal: number }>>('/reminders/daily-goal', { dailyGoal });
    return response.data.data;
  },
  
  /**
   * Mark a reminder as completed
   */
  completeReminder: async (id: number): Promise<Reminder> => {
    const response = await api.patch<ApiResponse<Reminder>>(`/reminders/${id}/complete`);
    return response.data.data;
  },
  
  /**
   * Send notification immediately (for testing)
   */
  sendNotificationNow: async (notificationType: 'morning' | 'afternoon'): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('Sending immediate notification:', notificationType);
      const response = await api.post('/reminders/send-notification', { 
        notificationType,
        timezone: 'Asia/Karachi' // Using Pakistan timezone as requested
      });
      console.log('Notification response:', response);
      
      if (response.data && response.data.success !== undefined) {
        return response.data;
      }
      
      return { 
        success: true, 
        message: `${notificationType === 'morning' ? 'Morning' : 'Afternoon'} notification sent successfully` 
      };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { 
        success: false, 
        message: `Failed to send ${notificationType} notification` 
      };
    }
  },
}; 
