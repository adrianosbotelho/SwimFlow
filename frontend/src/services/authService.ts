import axios from 'axios';
import { apiConfig } from '../config/api';

// Create axios instance
const api = axios.create(apiConfig);

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'professor';
  profileImage?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
  timestamp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'user';
  private readonly REMEMBER_ME_KEY = 'rememberMe';

  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/api/auth/login', {
      email: credentials.email,
      password: credentials.password
    });

    const authData = response.data;
    
    // Store tokens and user data
    this.storeAuthData(authData, credentials.rememberMe);
    
    return authData;
  }

  // Register
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post('/api/auth/register', {
      name: credentials.name,
      email: credentials.email,
      password: credentials.password,
      confirmPassword: credentials.confirmPassword
    });

    const authData = response.data;
    
    // Store tokens and user data (auto-login after registration)
    this.storeAuthData(authData, false);
    
    return authData;
  }

  // Logout
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if we have a token
      const token = this.getAccessToken();
      if (token) {
        await api.post('/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      this.clearAuthData();
    }
  }

  // Refresh token
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/api/auth/refresh', {
      refreshToken
    });

    const authData = response.data;
    const rememberMe = this.getRememberMe();
    
    // Update stored tokens
    this.storeAuthData(authData, rememberMe);
    
    return authData;
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const userData = response.data.user;
    
    // Update stored user data
    this.storeUser(userData);
    
    return userData;
  }

  // Forgot password
  async forgotPassword(request: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await api.post('/api/auth/forgot-password', request);
    return response.data;
  }

  // Reset password
  async resetPassword(request: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await api.post('/api/auth/reset-password', request);
    return response.data;
  }

  // Verify reset token
  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const response = await api.get(`/api/auth/verify-reset-token/${token}`);
    return response.data;
  }

  // Token management
  private storeAuthData(authData: AuthResponse, rememberMe: boolean = false): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem(this.ACCESS_TOKEN_KEY, authData.accessToken);
    storage.setItem(this.REFRESH_TOKEN_KEY, authData.refreshToken);
    storage.setItem(this.USER_KEY, JSON.stringify(authData.user));
    
    // Store remember me preference
    localStorage.setItem(this.REMEMBER_ME_KEY, rememberMe.toString());
  }

  private storeUser(user: User): void {
    const rememberMe = this.getRememberMe();
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  clearAuthData(): void {
    // Clear from both storages
    [localStorage, sessionStorage].forEach(storage => {
      storage.removeItem(this.ACCESS_TOKEN_KEY);
      storage.removeItem(this.REFRESH_TOKEN_KEY);
      storage.removeItem(this.USER_KEY);
    });
    localStorage.removeItem(this.REMEMBER_ME_KEY);
  }

  // Getters
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY) || 
           sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY) || 
           sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY) || 
                   sessionStorage.getItem(this.USER_KEY);
    
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getRememberMe(): boolean {
    return localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // Check if user is professor
  isProfessor(): boolean {
    return this.hasRole('professor');
  }
}

// Setup axios interceptors for automatic token handling
const authService = new AuthService();

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await authService.refreshToken();
        
        // Retry original request with new token
        const token = authService.getAccessToken();
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        authService.clearAuthData();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default authService;