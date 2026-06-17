import api from './api';
import { FollowupSettings } from '../types';

export interface FollowupSettingsResponse {
  success: boolean;
  data: FollowupSettings;
  message?: string;
}

export const userService = {
  /**
   * Get user's followup settings
   */
  getFollowupSettings: async (): Promise<FollowupSettings> => {
    try {
      const response = await api.get<FollowupSettingsResponse>('/users/followup-settings');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching followup settings:', error);
      // Return default values if API fails
      return {
        followupHotlist: 30,
        followupAList: 60,
        followupBList: 90,
        followupCList: 120,
        followupStandard: 180,
      };
    }
  },

  /**
   * Update user's followup settings
   */
  updateFollowupSettings: async (settings: FollowupSettings): Promise<FollowupSettings> => {
    try {
      const response = await api.put<FollowupSettingsResponse>('/users/followup-settings', settings);
      return response.data.data;
    } catch (error) {
      console.error('Error updating followup settings:', error);
      throw error;
    }
  },
}; 