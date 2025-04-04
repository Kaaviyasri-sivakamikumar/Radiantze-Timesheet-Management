export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    VERIFY: "/api/auth/verify",
    RESET_PASSWORD: "/api/auth/reset-password",
    MODIFY_ACCESS: "/api/auth/modify-access",
  },
  EMPLOYEE: {
    REGISTER: "/api/employee/register",
    UPDATE: "/api/employee/update",
    GET_EMPLOYEES: "/api/employee",
    GET_EMPLOYEE: "/api/employee",
    GET_LOGGEDIN_EMPLOYEE: "/api/employee/current-employee",
  },
  TIMESHEET: {
    SAVE_UPDATE_FETCH_WEEK_TIMESHEET: "/api/timesheet/week",
  },
  ENTITY: {
    GENERIC_URL: "/api/entity",
  },
  ATTACHMENT: {
    UPLOAD: "/api/timesheet/attachment",
    DOWNLOAD: "/api/timesheet/attachment",
    REMOVE: "/api/timesheet/attachment",
  },
} as const;
