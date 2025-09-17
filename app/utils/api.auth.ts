import ApiClient from './api';
import type { ApiResponse } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: number;
  email: string;
  permissionType: string;
  status: string;
  message: string;
  success: boolean;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export class AuthAPI {
  static async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return ApiClient.post<LoginResponse>('/User/login', credentials);
  }

  static async logout(): Promise<ApiResponse<void>> {
    return ApiClient.post<void>('/User/logout');
  }

  // Add other auth-related methods here
}

export function handleAuthError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};