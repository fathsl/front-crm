const API_BASE_URL = 'https://api-crm-tegd.onrender.com/api';

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
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Network error: ${error.message}`);
      }
      throw new Error('Unknown error occurred');
    }
  }

  public static async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.makeRequest<LoginResponse>('/Auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }
}

export const handleAuthError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};