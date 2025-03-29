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
    const response = await apiClient.put(API_ENDPOINTS.EMPLOYEE.UPDATE, data);
    return response;
  },

  async getEmployees() {
    const response = await apiClient.get(API_ENDPOINTS.EMPLOYEE.GET_EMPLOYEES);
    return response; // Return the full response
  },

  async getEmployee(employeeId: string) {
    const response = await apiClient.get(
      `${API_ENDPOINTS.EMPLOYEE.GET_EMPLOYEE}/${employeeId}`
    );
    return response; // Return the full response
  },

  async modifyEmployeeAccess(data: any) {
    const response = await apiClient.post(
      API_ENDPOINTS.AUTH.MODIFY_ACCESS,
      data
    );
    return response; // Return the full response
  },

  async saveAndUpdateWeekTimesheet(data: any) {
    const response = await apiClient.post(
      API_ENDPOINTS.TIMESHEET.SAVE_UPDATE_FETCH_WEEK_TIMESHEET,
      data
    );
    return response; // Return the full response
  },

  async fetchWeekTimesheet(data: any) {
    const { weekStartDate, month, year } = data;

    const response = await apiClient.get(
      API_ENDPOINTS.TIMESHEET.SAVE_UPDATE_FETCH_WEEK_TIMESHEET,
      {
        params: {
          weekStartDate,
          month,
          year,
        },
      }
    );
    return response; // Return the full response
  },

  async getEntities(entityType: string) {
    const response = await apiClient.get(
      `${API_ENDPOINTS.ENTITY.GENERIC_URL}?type=${entityType}`
    );
    return response; // Return the full response
  },

  async getEntityById(entityType: string, id: string) {
    const response = await apiClient.get(
      `${API_ENDPOINTS.ENTITY.GENERIC_URL}?type=${entityType}&id=${id}`
    );
    return response; // Return the full response
  },

  async addEntity(entityType: string, data: any) {
    const response = await apiClient.post(
      `${API_ENDPOINTS.ENTITY.GENERIC_URL}?type=${entityType}`,
      data
    );
    return response; // Return the full response
  },

  async updateEntity(entityType: string, id: string, data: any) {
    const response = await apiClient.put(
      `${API_ENDPOINTS.ENTITY.GENERIC_URL}?type=${entityType}&id=${id}`,
      data
    );
    return response; // Return the full response
  },

  async removeEntityById(entityType: string, id: string) {
    const response = await apiClient.delete(
      `${API_ENDPOINTS.ENTITY.GENERIC_URL}?type=${entityType}&id=${id}`
    );
    return response; // Return the full response
  },

  async uploadAttachment(formData: FormData) {
    const response = await apiClient.post(
      `${API_ENDPOINTS.ATTACHMENT.UPLOAD}`,
      formData,
      {
        headers: {
          "Content-Type": undefined, // Let browser handle it
        },
      }
    );
    return response;
  },

  async deleteAttachment(
    attachmentId: string,
    selectedWeekStartDate: string,
    year: string,
    month: string
  ) {
    const response = await apiClient.delete(
      `${API_ENDPOINTS.ATTACHMENT.REMOVE}?attachmentId=${attachmentId}&weekStart=${selectedWeekStartDate}&year=${year}&month=${month}`
    );
    return response;
  },

  async getAttachment(attachmentId: string, selectedWeekStartDate: string) {
    const response = await apiClient.get(
      `${API_ENDPOINTS.ATTACHMENT.DOWNLOAD}?attachmentId=${attachmentId}&weekStart=${selectedWeekStartDate}`,{
         responseType: "blob"
        });
    return response;
  },

  async getLoggedInEmployeeInfo() {
    const response = await apiClient.get(
      `${API_ENDPOINTS.EMPLOYEE.GET_LOGGEDIN_EMPLOYEE}`
    );
    return response; // Return the full response
  },
};
