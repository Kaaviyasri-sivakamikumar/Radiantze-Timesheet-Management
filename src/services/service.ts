import apiClient from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api.config";
import type { AuthFormData, AuthResponse } from "@/types/auth";

export const service = {
  async login(data: AuthFormData) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, data);
    return response; // Return the full response
  },

  async register(data: AuthFormData) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
    return response; // Return the full response
  },

  async logout() {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    return response; // Return the full response
  },

  async verifyToken() {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.VERIFY);
    return response; // Return the full response
  },

  async resetPassword(email: string) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      email,
    });
    return response; // Return the full response
  },

  async createEmployee(data: any) {
    const response = await apiClient.post(
      API_ENDPOINTS.EMPLOYEE.REGISTER,
      data
    );
    return response; // Return the full response
  },

  async updateEmployee(data: any) {
    const response = await apiClient.put(
      API_ENDPOINTS.EMPLOYEE.UPDATE,
      data
    );
    return response;
  },

  async getEmployees() {
    const response = await apiClient.get(API_ENDPOINTS.EMPLOYEE.GET_EMPLOYEES);
    return response; // Return the full response
  },

  async getEmployee(employeeId: string) {
    const response = await apiClient.get(`${API_ENDPOINTS.EMPLOYEE.GET_EMPLOYEE}/${employeeId}`);
    return response; // Return the full response
  },


  async modifyEmployeeAccess(data: any) {
    const response = await apiClient.post(
      API_ENDPOINTS.AUTH.MODIFY_ACCESS,
      data
    );
    return response; // Return the full response
  },
};
