import { apiClient } from "./client";
import { getCurrentPayrollMonth } from "../../lib/utils";

export const bizenApi = {
  passwordLogin: (payload) => apiClient.post("/auth/login", payload),
  googleLogin: (credential) => apiClient.post("/auth/google", { credential }),
  me: () => apiClient.get("/auth/me"),
  createCompanyRequest: (payload) => apiClient.post("/tenants/company-requests", payload),
  companyRequests: (status = "Pending") => apiClient.get(`/tenants/company-requests?status=${encodeURIComponent(status)}`),
  reviewCompanyRequest: (id, payload) => apiClient.patch(`/tenants/company-requests/${id}/status`, payload),
  profile: () => apiClient.get("/profile"),
  updateProfile: (payload) => apiClient.patch("/profile", payload),
  communityMembers: () => apiClient.get("/community/members"),
  communityMessages: (limit = 80) => apiClient.get(`/community/messages?limit=${encodeURIComponent(limit)}`),
  sendCommunityMessage: (body) => apiClient.post("/community/messages", { body }),
  communityTyping: () => apiClient.get("/community/typing"),
  updateCommunityTyping: (isTyping) => apiClient.post("/community/typing", { isTyping }),
  requestEmployeeAccount: (payload) => apiClient.post("/auth/employee-account-requests", payload),
  accountRequests: (status = "Pending") => apiClient.get(`/auth/account-requests?status=${encodeURIComponent(status)}`),
  reviewAccountRequest: (id, payload) => apiClient.patch(`/auth/account-requests/${id}/status`, payload),
  dashboardSummary: () => apiClient.get("/dashboard/summary"),
  dashboardCharts: () => apiClient.get("/dashboard/charts"),
  departments: () => apiClient.get("/departments"),
  employees: () => apiClient.get("/employees"),
  employee: (id) => apiClient.get(`/employees/${id}`),
  createEmployee: (payload) => apiClient.post("/employees", payload),
  updateEmployee: (id, payload) => apiClient.patch(`/employees/${id}`, payload),
  deleteEmployee: (id) => apiClient.delete(`/employees/${id}`),
  attendance: (date) => apiClient.get(`/attendance${date ? `?date=${encodeURIComponent(date)}` : ""}`),
  employeeAttendance: (employeeId) => apiClient.get(`/attendance/employee/${employeeId}`),
  checkinPolicy: (employeeId) => apiClient.get(`/attendance/checkin-policy${employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : ""}`),
  upsertAttendance: (payload) => apiClient.post("/attendance", payload),
  faceEnroll: (payload) => apiClient.post("/attendance/face-enroll", payload),
  faceReadiness: (payload) => apiClient.post("/attendance/face-readiness", payload),
  faceCheckin: (payload) => apiClient.post("/attendance/face-checkin", payload),
  faceEnrollments: (status = "All") => apiClient.get(`/attendance/face-enrollments?status=${encodeURIComponent(status)}`),
  faceEnrollmentStatus: (employeeId) => apiClient.get(`/attendance/face-enrollments/employee/${employeeId}/latest`),
  reviewFaceEnrollment: (id, payload) => apiClient.patch(`/attendance/face-enrollments/${id}/status`, payload),
  faceEnrollmentImage: (id) => apiClient.blob(`/attendance/face-enrollments/${id}/image`),
  shifts: () => apiClient.get("/shifts"),
  scheduleWeek: (weekStart) => apiClient.get(`/schedules/week${weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : ""}`),
  updateScheduleWeek: (payload) => apiClient.put("/schedules/week", payload),
  scheduleAvailability: (employeeId) => apiClient.get(`/schedules/availability${employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : ""}`),
  createScheduleAvailability: (payload) => apiClient.post("/schedules/availability", payload),
  deleteScheduleAvailability: (id) => apiClient.delete(`/schedules/availability/${id}`),
  aiSuggestSchedule: (payload = {}) => apiClient.post("/schedules/ai-suggest", payload),
  payroll: (month = getCurrentPayrollMonth()) => apiClient.get(`/payroll?month=${encodeURIComponent(month)}`),
  calculatePayroll: (month = getCurrentPayrollMonth()) => apiClient.post("/payroll/calculate", { month }),
  payrollDetail: (employeeId, month = getCurrentPayrollMonth()) => apiClient.get(`/payroll/${employeeId}?month=${encodeURIComponent(month)}`),
  payrollAdjustments: (month = getCurrentPayrollMonth(), employeeId) =>
    apiClient.get(`/payroll/adjustments?month=${encodeURIComponent(month)}${employeeId ? `&employeeId=${encodeURIComponent(employeeId)}` : ""}`),
  createPayrollAdjustment: (payload) => apiClient.post("/payroll/adjustments", payload),
  updatePayrollAdjustment: (id, payload) => apiClient.patch(`/payroll/adjustments/${id}`, payload),
  deletePayrollAdjustment: (id) => apiClient.delete(`/payroll/adjustments/${id}`),
  leaves: () => apiClient.get("/leaves"),
  createLeave: (payload) => apiClient.post("/leaves", payload),
  updateLeaveStatus: (id, status) => apiClient.patch(`/leaves/${id}/status`, { status }),
  notifications: (employeeId) => apiClient.get(`/notifications${employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : ""}`),
  settings: () => apiClient.get("/settings"),
  updateSettings: (payload) => apiClient.put("/settings", payload),
  placeSuggestions: ({ input, latitude, longitude }) => {
    const params = new URLSearchParams({ input });
    if (latitude !== "" && latitude !== null && latitude !== undefined) params.set("latitude", latitude);
    if (longitude !== "" && longitude !== null && longitude !== undefined) params.set("longitude", longitude);
    return apiClient.get(`/settings/place-suggestions?${params.toString()}`);
  },
  placeDetails: (placeId, text) =>
    apiClient.get(`/settings/place-details?placeId=${encodeURIComponent(placeId)}${text ? `&text=${encodeURIComponent(text)}` : ""}`),
  kpiTasks: ({ date, status = "All", employeeId } = {}) => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (status) params.set("status", status);
    if (employeeId) params.set("employeeId", employeeId);
    const query = params.toString();
    return apiClient.get(`/kpis/tasks${query ? `?${query}` : ""}`);
  },
  createKpiTask: (payload) => apiClient.post("/kpis/tasks", payload),
  updateKpiProgress: (id, status) => apiClient.patch(`/kpis/tasks/${id}/progress`, { status }),
  submitKpiTask: (id, payload) => apiClient.post(`/kpis/tasks/${id}/submit`, payload),
  reviewKpiTask: (id, payload) => apiClient.patch(`/kpis/tasks/${id}/review`, payload),
  deleteKpiTask: (id) => apiClient.delete(`/kpis/tasks/${id}`),
  kpiTaskPhoto: (id) => apiClient.blob(`/kpis/task-photos/${id}/image`),
  reports: () => apiClient.get("/reports"),
  aiAlerts: () => apiClient.get("/ai/alerts"),
  aiChat: (message) => apiClient.post("/ai/chat", { message }),
  aiChatStream: (message, handlers) => apiClient.streamPost("/ai/chat/stream", { message }, handlers)
};
