import ApiClient from '~/utils/api';
import type { ApiResponse } from '~/utils/api';

export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  details: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: number;
  modifiedBy: number;
  imageUrl: string;
  zipCode: string;
  VATNumber: string;
  address: string;
  city: string;
}

class ClientService {
  static async getAllClients(): Promise<ApiResponse<Client[]>> {
    return ApiClient.get<Client[]>('/Clients');
  }

  static async searchClients(query: string): Promise<ApiResponse<Client[]>> {
    return ApiClient.get<Client[]>(`/Clients/search?query=${encodeURIComponent(query)}`);
  }

  static async getClientById(id: number): Promise<ApiResponse<Client>> {
    return ApiClient.get<Client>(`/Clients/${id}`);
  }

  static async createClient(clientData: Omit<Client, 'id'>): Promise<ApiResponse<Client>> {
    return ApiClient.post<Client>('/Clients', clientData);
  }

  static async updateClient(id: number, clientData: Partial<Client>): Promise<ApiResponse<Client>> {
    return ApiClient.put<Client>(`/Clients/${id}`, clientData);
  }

  static async deleteClient(id: number): Promise<ApiResponse<void>> {
    return ApiClient.delete<void>(`/Clients/${id}`);
  }
}

export default ClientService;
