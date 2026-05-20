import { apiClient } from "./client";

export const bizenApi = {
  dashboardSummary: () => apiClient.get("/dashboard/summary"),
  dashboardCharts: () => apiClient.get("/dashboard/charts"),
  employees: () => apiClient.get("/employees"),
  employee: (id) => apiClient.get(`/employees/${id}`),
  createEmployee: (payload) => apiClient.post("/employees", payload),
  updateEmployee: (id, payload) => apiClient.patch(`/employees/${id}`, payload),
  deleteEmployee: (id) => apiClient.delete(`/employees/${id}`),
  attendance: (date = "2026-05-20") => apiClient.get(`/attendance?date=${encodeURIComponent(date)}`),
  upsertAttendance: (payload) => apiClient.post("/attendance", payload),
  shifts: () => apiClient.get("/shifts"),
  scheduleWeek: () => apiClient.get("/schedules/week"),
  aiSuggestSchedule: () => apiClient.post("/schedules/ai-suggest", {}),
  payroll: (month = "05/2026") => apiClient.get(`/payroll?month=${encodeURIComponent(month)}`),
  payrollDetail: (employeeId, month = "05/2026") => apiClient.get(`/payroll/${employeeId}?month=${encodeURIComponent(month)}`),
  leaves: () => apiClient.get("/leaves"),
  createLeave: (payload) => apiClient.post("/leaves", payload),
  updateLeaveStatus: (id, status) => apiClient.patch(`/leaves/${id}/status`, { status }),
  notifications: (employeeId = "BZN017") => apiClient.get(`/notifications?employeeId=${encodeURIComponent(employeeId)}`),
  settings: () => apiClient.get("/settings"),
  updateSettings: (payload) => apiClient.put("/settings", payload),
  aiAlerts: () => apiClient.get("/ai/alerts"),
  aiChat: (message) => apiClient.post("/ai/chat", { message })
};
