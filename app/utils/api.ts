// Environment detection
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment ? '/api' : 'https://api-crm-tegd.onrender.com/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Generic API client
class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for cookies, authorization headers, etc.
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({})); // Handle empty responses
      
      if (!response.ok) {
        return {
          error: data.message || `HTTP error! status: ${response.status}`,
          status: response.status
        };
      }
      
      return { data, status: response.status };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 0
      };
    }
  }

  static async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  static async post<T>(
    endpoint: string,
    body?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async put<T>(
    endpoint: string,
    body?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async delete<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

export default ApiClient;
