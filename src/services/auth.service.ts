import api from './api';
import { ApiResponse, AuthResponse, LoginCredentials, SignupCredentials, User } from '../types';

export const authService = {
  /**
   * Log in a user
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse | ApiResponse<AuthResponse>>('/auth/login', credentials);
      
      // Check if response has the ApiResponse structure
      if ('success' in response.data && 'data' in response.data) {
        if (response.data.success && response.data.data) {
          // Store token and user info in localStorage
          localStorage.setItem('accessToken', response.data.data.accessToken);
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
          return response.data.data;
        }
        throw new Error(response.data.message || 'Login failed');
      } 
      
      // Handle direct AuthResponse format
      const authResponse = response.data as AuthResponse;
      if (authResponse.accessToken && authResponse.user) {
        // Store token and user info in localStorage
        localStorage.setItem('accessToken', authResponse.accessToken);
        localStorage.setItem('user', JSON.stringify(authResponse.user));
        return authResponse;
      }
      
      throw new Error('Login failed: Invalid response format');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  /**
   * Register a new user
   */
  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse | ApiResponse<AuthResponse>>('/auth/signup', credentials);
      
      // Check if response has the ApiResponse structure
      if ('success' in response.data && 'data' in response.data) {
        if (response.data.success && response.data.data) {
          // Store token and user info in localStorage
          localStorage.setItem('accessToken', response.data.data.accessToken);
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
          return response.data.data;
        }
        throw new Error(response.data.message || 'Signup failed');
      }
      
      // Handle direct AuthResponse format
      const authResponse = response.data as AuthResponse;
      if (authResponse.accessToken && authResponse.user) {
        // Store token and user info in localStorage
        localStorage.setItem('accessToken', authResponse.accessToken);
        localStorage.setItem('user', JSON.stringify(authResponse.user));
        return authResponse;
      }
      
      throw new Error('Signup failed: Invalid response format');
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },
  
  /**
   * Register a new user by admin (doesn't log in as the new user)
   */
  registerUserByAdmin: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse | ApiResponse<AuthResponse>>('/auth/signup', credentials);
      
      // Check if response has the ApiResponse structure
      if ('success' in response.data && 'data' in response.data) {
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
        throw new Error(response.data.message || 'User registration failed');
      }
      
      // Handle direct AuthResponse format
      const authResponse = response.data as AuthResponse;
      if (authResponse.accessToken && authResponse.user) {
        return authResponse;
      }
      
      throw new Error('User registration failed: Invalid response format');
    } catch (error) {
      console.error('Admin user registration error:', error);
      throw error;
    }
  },
  
  /**
   * Log out user (remove token and user info)
   */
  logout: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },
  
  /**
   * Get current user from localStorage
   */
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr) as User;
    }
    return null;
  },
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('accessToken');
  },
}; 